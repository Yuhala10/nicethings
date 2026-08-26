import { useState } from "react";

import {
    ArrowLeft,
    Check,
    MapPin,
    Send,
    Sparkles,
    Navigation,
    LocateFixed,
} from "lucide-react";

import AppShell from "../components/layout/AppShell";
import { useLanguage } from "../lib/i18n";
import { NICE_THINGS } from "../lib/constants";


export default function IntroducePage() {
    const {
        language,
        setLanguage,
        t,
    } = useLanguage();


    /* =====================================================
       FORM
    ====================================================== */

    const [form, setForm] =
        useState({
            name: "",
            category: "",
            description: "",
            address: "",
            neighborhood: "",
            city:
                NICE_THINGS.defaultCity ||
                "Yaoundé",
            phone: "",
            whatsapp: "",
            estimatedPrice: "",
            submittedByName: "",
            submittedByPhone: "",
        });


    /* =====================================================
       GPS LOCATION
    ====================================================== */

    const [
        location,
        setLocation,
    ] = useState({
        latitude: null,
        longitude: null,
        accuracy: null,
    });


    const [
        locating,
        setLocating,
    ] = useState(false);


    const [
        locationError,
        setLocationError,
    ] = useState("");


    /* =====================================================
       GENERAL STATE
    ====================================================== */

    const [loading, setLoading] =
        useState(false);

    const [submitted, setSubmitted] =
        useState(false);

    const [error, setError] =
        useState("");


    /* =====================================================
       UPDATE FORM
    ====================================================== */

    function update(
        field,
        value
    ) {
        setForm(
            current => ({
                ...current,
                [field]: value,
            })
        );
    }


    /* =====================================================
       GPS HELPERS
    ====================================================== */

    function isValidCoordinates(
        latitude,
        longitude
    ) {
        const lat =
            Number(
                latitude
            );

        const lng =
            Number(
                longitude
            );

        return (
            Number.isFinite(
                lat
            ) &&
            Number.isFinite(
                lng
            ) &&
            lat >= -90 &&
            lat <= 90 &&
            lng >= -180 &&
            lng <= 180
        );
    }


    function getLocationErrorMessage(
        geoError
    ) {
        if (
            !geoError
        ) {
            return "Unable to get your current location.";
        }


        switch (
        geoError.code
        ) {
            case 1:
                return (
                    "Location permission was denied. Please allow location access in your browser settings and try again."
                );

            case 2:
                return (
                    "Your location could not be determined. Please make sure GPS/location services are enabled and try again."
                );

            case 3:
                return (
                    "Location request timed out. Please move to an area with a better GPS signal and try again."
                );

            default:
                return (
                    geoError.message ||
                    "Unable to get your current location."
                );
        }
    }


    /* =====================================================
       CAPTURE CURRENT LOCATION
    ====================================================== */

    function captureCurrentLocation() {
        setLocationError(
            ""
        );

        setError(
            ""
        );


        if (
            typeof window ===
            "undefined"
        ) {
            return;
        }


        if (
            !navigator.geolocation
        ) {
            setLocationError(
                "Your browser does not support GPS location. Please use a browser with location services enabled."
            );

            return;
        }


        setLocating(
            true
        );


        navigator.geolocation.getCurrentPosition(
            position => {
                const latitude =
                    Number(
                        position.coords.latitude
                    );

                const longitude =
                    Number(
                        position.coords.longitude
                    );

                const accuracy =
                    Number(
                        position.coords.accuracy
                    );


                if (
                    !isValidCoordinates(
                        latitude,
                        longitude
                    )
                ) {
                    setLocationError(
                        "The GPS coordinates returned by your device are invalid. Please try again."
                    );

                    setLocating(
                        false
                    );

                    return;
                }


                /*
                 * We need a reasonably accurate position
                 * because this location becomes the actual
                 * location of the Spot.
                 *
                 * 150 metres is our maximum acceptable
                 * registration accuracy.
                 */

                if (
                    Number.isFinite(
                        accuracy
                    ) &&
                    accuracy >
                    150
                ) {
                    setLocation({
                        latitude:
                            null,

                        longitude:
                            null,

                        accuracy,
                    });


                    setLocationError(
                        `Your GPS accuracy is currently about ${Math.round(
                            accuracy
                        )} metres. Please wait for a stronger GPS signal and try again.`
                    );


                    setLocating(
                        false
                    );

                    return;
                }


                setLocation({
                    latitude,
                    longitude,
                    accuracy:
                        Number.isFinite(
                            accuracy
                        )
                            ? accuracy
                            : null,
                });


                setLocationError(
                    ""
                );


                setLocating(
                    false
                );

            },

            geoError => {
                console.error(
                    "NiceThings GPS error:",
                    geoError
                );


                setLocationError(
                    getLocationErrorMessage(
                        geoError
                    )
                );


                setLocating(
                    false
                );
            },

            {
                enableHighAccuracy:
                    true,

                timeout:
                    20000,

                maximumAge:
                    0,
            }
        );
    }


    /* =====================================================
       LOCATION STATUS
    ====================================================== */

    const locationCaptured =
        isValidCoordinates(
            location.latitude,
            location.longitude
        );


    /* =====================================================
       CATEGORY NAME
    ====================================================== */

    function getCategoryName(
        category
    ) {
        if (
            !category
        ) {
            return "";
        }


        if (
            language ===
            "fr"
        ) {
            return (
                category.fr ||
                category.en ||
                category.id
            );
        }


        return (
            category.en ||
            category.fr ||
            category.id
        );
    }


    /* =====================================================
       SUBMIT
    ====================================================== */

    async function submit(
        event
    ) {
        event.preventDefault();


        setError(
            ""
        );


        /* =================================================
           REQUIRED BASIC FIELDS
        ================================================== */

        if (
            !form.name.trim() ||
            !form.address.trim()
        ) {
            setError(
                t(
                    "introduceRequired"
                )
            );

            return;
        }


        /* =================================================
           GPS IS REQUIRED
        ================================================== */

        if (
            !locationCaptured
        ) {
            setError(
                "You must be physically at the Spot and capture its current GPS location before submitting it."
            );

            return;
        }


        /* =================================================
           VISITOR ID
        ================================================== */

        let visitorId =
            null;


        if (
            typeof window !==
            "undefined"
        ) {
            visitorId =
                localStorage.getItem(
                    "nicethings_visitor_id"
                );
        }


        setLoading(
            true
        );


        try {
            const response =
                await fetch(
                    "/api/spots/introduce",
                    {
                        method:
                            "POST",

                        headers: {
                            "Content-Type":
                                "application/json",
                        },

                        body:
                            JSON.stringify({
                                visitorId,

                                ...form,

                                name:
                                    form.name.trim(),

                                category:
                                    form.category ||
                                    null,

                                description:
                                    form.description.trim() ||
                                    null,

                                address:
                                    form.address.trim(),

                                /*
                                 * Neighborhood is now descriptive.
                                 *
                                 * It does NOT determine the
                                 * geographic position.
                                 */

                                neighborhood:
                                    form.neighborhood.trim() ||
                                    null,

                                city:
                                    form.city.trim() ||
                                    NICE_THINGS.defaultCity ||
                                    "Yaoundé",

                                phone:
                                    form.phone.trim() ||
                                    null,

                                whatsapp:
                                    form.whatsapp.trim() ||
                                    null,

                                estimatedPrice:
                                    form.estimatedPrice
                                        ? Number(
                                            form.estimatedPrice
                                        )
                                        : null,

                                submittedByName:
                                    form.submittedByName.trim() ||
                                    null,

                                submittedByPhone:
                                    form.submittedByPhone.trim() ||
                                    null,


                                /* =========================
                                   AUTHORITATIVE GPS
                                ========================== */

                                latitude:
                                    Number(
                                        location.latitude
                                    ),

                                longitude:
                                    Number(
                                        location.longitude
                                    ),

                                locationAccuracy:
                                    Number.isFinite(
                                        Number(
                                            location.accuracy
                                        )
                                    )
                                        ? Number(
                                            location.accuracy
                                        )
                                        : null,
                            }),
                    }
                );


            let data =
                {};

            try {
                data =
                    await response.json();

            } catch {
                data =
                    {};
            }


            if (
                !response.ok
            ) {
                throw new Error(
                    data.error ||
                    t(
                        "introduceError"
                    )
                );
            }


            setSubmitted(
                true
            );

        } catch (
        submitError
        ) {
            console.error(
                "NiceThings introduce error:",
                submitError
            );


            setError(
                submitError.message ||
                t(
                    "introduceError"
                )
            );

        } finally {
            setLoading(
                false
            );
        }
    }
    /* =====================================================
      SUCCESS SCREEN
   ====================================================== */

    if (
        submitted
    ) {
        return (
            <AppShell>

                <main
                    className="nt-introduce-page"
                >

                    <div
                        className="nt-introduce-success"
                    >

                        <div
                            className="nt-success-icon"
                        >
                            <Check
                                size={30}
                            />
                        </div>


                        <Sparkles
                            size={17}
                        />


                        <h1>
                            {t(
                                "introduceSuccessTitle"
                            )}
                        </h1>


                        <p>
                            {t(
                                "introduceSuccessDescription"
                            )}
                        </p>


                        <button
                            type="button"
                            className="nt-introduce-primary"
                            onClick={() =>
                                window.location.href =
                                "/"
                            }
                        >
                            {t(
                                "backToNiceThings"
                            )}
                        </button>

                    </div>

                </main>

            </AppShell>
        );
    }


    /* =====================================================
       MAIN PAGE
    ====================================================== */

    return (
        <AppShell>

            <main
                className="nt-introduce-page"
            >

                <div
                    className="nt-introduce-shell"
                >

                    {/* =================================================
                        HEADER
                    ================================================== */}

                    <header
                        className="nt-introduce-header"
                    >

                        <button
                            type="button"
                            onClick={() =>
                                window.history.back()
                            }
                        >

                            <ArrowLeft
                                size={17}
                            />

                            {t(
                                "back"
                            )}

                        </button>


                        <div>

                            <Sparkles
                                size={16}
                            />

                            NiceThings

                        </div>


                        <div
                            className="nt-language-switch"
                        >

                            <button
                                type="button"
                                className={
                                    language ===
                                        "en"
                                        ? "active"
                                        : ""
                                }
                                onClick={() =>
                                    setLanguage(
                                        "en"
                                    )
                                }
                                aria-pressed={
                                    language ===
                                    "en"
                                }
                            >
                                EN
                            </button>


                            <button
                                type="button"
                                className={
                                    language ===
                                        "fr"
                                        ? "active"
                                        : ""
                                }
                                onClick={() =>
                                    setLanguage(
                                        "fr"
                                    )
                                }
                                aria-pressed={
                                    language ===
                                    "fr"
                                }
                            >
                                FR
                            </button>

                        </div>

                    </header>


                    {/* =================================================
                        HERO
                    ================================================== */}

                    <section
                        className="nt-introduce-hero"
                    >

                        <div
                            className="nt-introduce-eyebrow"
                        >

                            <MapPin
                                size={13}
                            />

                            {t(
                                "introduceEyebrow"
                            )}

                        </div>


                        <h1>
                            {t(
                                "introduceTitle"
                            )}
                        </h1>


                        <p>
                            {t(
                                "introduceDescription"
                            )}
                        </p>

                    </section>


                    {/* =================================================
                        FORM
                    ================================================== */}

                    <form
                        className="nt-introduce-form"
                        onSubmit={
                            submit
                        }
                    >

                        {/* =================================================
                            NAME
                        ================================================== */}

                        <FormInput
                            label={t(
                                "spotName"
                            )}
                            required
                            value={
                                form.name
                            }
                            onChange={value =>
                                update(
                                    "name",
                                    value
                                )
                            }
                            placeholder={t(
                                "spotNamePlaceholder"
                            )}
                        />


                        {/* =================================================
                            CATEGORY
                        ================================================== */}

                        <div
                            className="nt-introduce-category-field"
                        >

                            <label>
                                {t(
                                    "category"
                                )}
                            </label>


                            <p
                                style={{
                                    margin:
                                        "4px 0 12px",
                                    color:
                                        "var(--nt-muted)",
                                    fontSize:
                                        "0.78rem",
                                }}
                            >
                                {t(
                                    "introduceCategoryHelp"
                                )}
                            </p>


                            <div
                                className="nt-category-grid"
                            >

                                {NICE_THINGS.categories.map(
                                    item => {

                                        const selected =
                                            form.category ===
                                            item.id;


                                        return (
                                            <button
                                                key={
                                                    item.id
                                                }
                                                type="button"
                                                className={
                                                    selected
                                                        ? "nt-category-card selected"
                                                        : "nt-category-card"
                                                }
                                                onClick={() =>
                                                    update(
                                                        "category",
                                                        selected
                                                            ? ""
                                                            : item.id
                                                    )
                                                }
                                                aria-pressed={
                                                    selected
                                                }
                                            >

                                                <div
                                                    className="nt-category-icon"
                                                >

                                                    <span
                                                        aria-hidden="true"
                                                    >
                                                        {
                                                            item.icon
                                                        }
                                                    </span>

                                                </div>


                                                <strong>
                                                    {getCategoryName(
                                                        item
                                                    )}
                                                </strong>

                                            </button>
                                        );
                                    }
                                )}

                            </div>

                        </div>


                        {/* =================================================
                            GPS LOCATION
                        ================================================== */}

                        <section
                            style={{
                                marginTop:
                                    "8px",

                                padding:
                                    "18px",

                                border:
                                    locationCaptured
                                        ? "1px solid #b7e4c7"
                                        : "1px solid var(--nt-border)",

                                borderRadius:
                                    "var(--nt-radius-lg)",

                                background:
                                    locationCaptured
                                        ? "#f0fdf4"
                                        : "var(--nt-white)",
                            }}
                        >

                            <div
                                style={{
                                    display:
                                        "flex",

                                    alignItems:
                                        "flex-start",

                                    gap:
                                        "12px",
                                }}
                            >

                                <div
                                    style={{
                                        width:
                                            "42px",

                                        height:
                                            "42px",

                                        flexShrink:
                                            0,

                                        borderRadius:
                                            "50%",

                                        display:
                                            "flex",

                                        alignItems:
                                            "center",

                                        justifyContent:
                                            "center",

                                        background:
                                            locationCaptured
                                                ? "#dcfce7"
                                                : "var(--nt-red-soft)",

                                        color:
                                            locationCaptured
                                                ? "#16803C"
                                                : "var(--nt-red)",
                                    }}
                                >

                                    {locationCaptured ? (
                                        <Check
                                            size={21}
                                        />
                                    ) : (
                                        <LocateFixed
                                            size={21}
                                        />
                                    )}

                                </div>


                                <div
                                    style={{
                                        flex:
                                            1,
                                    }}
                                >

                                    <div
                                        style={{
                                            fontWeight:
                                                800,

                                            fontSize:
                                                "1rem",

                                            color:
                                                "var(--nt-text)",
                                        }}
                                    >
                                        {locationCaptured
                                            ? "Location captured"
                                            : "Register the Spot's exact location"}
                                    </div>


                                    <p
                                        style={{
                                            margin:
                                                "5px 0 0",

                                            color:
                                                "var(--nt-muted)",

                                            fontSize:
                                                "0.82rem",

                                            lineHeight:
                                                1.5,
                                        }}
                                    >
                                        {locationCaptured
                                            ? "This Spot will be registered using your GPS coordinates. This is the location used for nearby searches."
                                            : "You must be physically at the Spot. Turn on your device location and capture the Spot's exact position."}
                                    </p>

                                </div>

                            </div>


                            {/* =================================================
                                GPS BUTTON
                            ================================================== */}

                            <button
                                type="button"
                                onClick={
                                    captureCurrentLocation
                                }
                                disabled={
                                    locating ||
                                    loading
                                }
                                style={{
                                    width:
                                        "100%",

                                    marginTop:
                                        "15px",

                                    minHeight:
                                        "48px",

                                    display:
                                        "flex",

                                    alignItems:
                                        "center",

                                    justifyContent:
                                        "center",

                                    gap:
                                        "8px",

                                    padding:
                                        "11px 14px",

                                    border:
                                        locationCaptured
                                            ? "1px solid #16803C"
                                            : "none",

                                    borderRadius:
                                        "var(--nt-radius-md)",

                                    background:
                                        locationCaptured
                                            ? "#ffffff"
                                            : "var(--nt-red)",

                                    color:
                                        locationCaptured
                                            ? "#16803C"
                                            : "#ffffff",

                                    fontWeight:
                                        800,

                                    cursor:
                                        locating ||
                                            loading
                                            ? "not-allowed"
                                            : "pointer",

                                    opacity:
                                        locating ||
                                            loading
                                            ? 0.7
                                            : 1,
                                }}
                            >

                                {locating ? (
                                    <>
                                        <span
                                            className="nt-loading-spinner"
                                            style={{
                                                width:
                                                    "18px",

                                                height:
                                                    "18px",

                                                borderWidth:
                                                    "2px",

                                                borderColor:
                                                    locationCaptured
                                                        ? "rgba(22,128,60,0.25)"
                                                        : "rgba(255,255,255,0.35)",

                                                borderTopColor:
                                                    locationCaptured
                                                        ? "#16803C"
                                                        : "#FFFFFF",
                                            }}
                                        />

                                        Getting your location...

                                    </>
                                ) : (
                                    <>
                                        {locationCaptured ? (
                                            <Navigation
                                                size={
                                                    17
                                                }
                                            />
                                        ) : (
                                            <LocateFixed
                                                size={
                                                    17
                                                }
                                            />
                                        )}

                                        {locationCaptured
                                            ? "Update My Current Location"
                                            : "Use My Current Location"}

                                    </>
                                )}

                            </button>


                            {/* =================================================
                                CAPTURED GPS DETAILS
                            ================================================== */}

                            {locationCaptured && (
                                <div
                                    style={{
                                        marginTop:
                                            "12px",

                                        display:
                                            "grid",

                                        gridTemplateColumns:
                                            "repeat(2, minmax(0, 1fr))",

                                        gap:
                                            "8px",
                                    }}
                                >

                                    <div
                                        style={{
                                            padding:
                                                "9px",

                                            borderRadius:
                                                "9px",

                                            background:
                                                "#ffffff",

                                            border:
                                                "1px solid #dcfce7",
                                        }}
                                    >

                                        <div
                                            style={{
                                                fontSize:
                                                    "0.68rem",

                                                color:
                                                    "#6b7280",

                                                fontWeight:
                                                    700,

                                                textTransform:
                                                    "uppercase",
                                            }}
                                        >
                                            Latitude
                                        </div>


                                        <div
                                            style={{
                                                marginTop:
                                                    "3px",

                                                fontSize:
                                                    "0.78rem",

                                                fontWeight:
                                                    700,

                                                wordBreak:
                                                    "break-all",
                                            }}
                                        >
                                            {
                                                Number(
                                                    location.latitude
                                                ).toFixed(
                                                    6
                                                )
                                            }
                                        </div>

                                    </div>


                                    <div
                                        style={{
                                            padding:
                                                "9px",

                                            borderRadius:
                                                "9px",

                                            background:
                                                "#ffffff",

                                            border:
                                                "1px solid #dcfce7",
                                        }}
                                    >

                                        <div
                                            style={{
                                                fontSize:
                                                    "0.68rem",

                                                color:
                                                    "#6b7280",

                                                fontWeight:
                                                    700,

                                                textTransform:
                                                    "uppercase",
                                            }}
                                        >
                                            Longitude
                                        </div>


                                        <div
                                            style={{
                                                marginTop:
                                                    "3px",

                                                fontSize:
                                                    "0.78rem",

                                                fontWeight:
                                                    700,

                                                wordBreak:
                                                    "break-all",
                                            }}
                                        >
                                            {
                                                Number(
                                                    location.longitude
                                                ).toFixed(
                                                    6
                                                )
                                            }
                                        </div>

                                    </div>


                                    <div
                                        style={{
                                            gridColumn:
                                                "1 / -1",

                                            padding:
                                                "9px",

                                            borderRadius:
                                                "9px",

                                            background:
                                                "#ffffff",

                                            border:
                                                "1px solid #dcfce7",
                                        }}
                                    >

                                        <div
                                            style={{
                                                fontSize:
                                                    "0.68rem",

                                                color:
                                                    "#6b7280",

                                                fontWeight:
                                                    700,

                                                textTransform:
                                                    "uppercase",
                                            }}
                                        >
                                            GPS Accuracy
                                        </div>


                                        <div
                                            style={{
                                                marginTop:
                                                    "3px",

                                                fontSize:
                                                    "0.82rem",

                                                fontWeight:
                                                    800,

                                                color:
                                                    "#16803C",
                                            }}
                                        >
                                            {Number.isFinite(
                                                Number(
                                                    location.accuracy
                                                )
                                            )
                                                ? `±${Math.round(
                                                    Number(
                                                        location.accuracy
                                                    )
                                                )} metres`
                                                : "Good GPS position"}
                                        </div>

                                    </div>

                                </div>
                            )}


                            {/* =================================================
                                GPS ERROR
                            ================================================== */}

                            {locationError && (
                                <div
                                    role="alert"
                                    style={{
                                        marginTop:
                                            "10px",

                                        padding:
                                            "10px 12px",

                                        borderRadius:
                                            "10px",

                                        background:
                                            "#fef2f2",

                                        color:
                                            "#991b1b",

                                        fontSize:
                                            "0.78rem",

                                        lineHeight:
                                            1.45,
                                    }}
                                >
                                    {locationError}
                                </div>
                            )}

                        </section>


                        {/* =================================================
                            NEIGHBORHOOD
                        ================================================== */}

                        <FormInput
                            label={t(
                                "neighborhood"
                            )}
                            value={
                                form.neighborhood
                            }
                            onChange={value =>
                                update(
                                    "neighborhood",
                                    value
                                )
                            }
                            placeholder={t(
                                "neighborhoodPlaceholder"
                            )}
                        />


                        {/* =================================================
                            ADDRESS
                        ================================================== */}

                        <FormInput
                            label={t(
                                "address"
                            )}
                            required
                            value={
                                form.address
                            }
                            onChange={value =>
                                update(
                                    "address",
                                    value
                                )
                            }
                            placeholder={t(
                                "addressPlaceholder"
                            )}
                        />


                        {/* =================================================
                            CITY
                        ================================================== */}

                        <FormInput
                            label={t(
                                "city"
                            )}
                            value={
                                form.city
                            }
                            onChange={value =>
                                update(
                                    "city",
                                    value
                                )
                            }
                            placeholder={t(
                                "cityPlaceholder"
                            )}
                        />


                        {/* =================================================
                            PRICE
                        ================================================== */}

                        <FormInput
                            label={t(
                                "approximateSpend"
                            )}
                            value={
                                form.estimatedPrice
                            }
                            onChange={value =>
                                update(
                                    "estimatedPrice",
                                    value
                                )
                            }
                            type="number"
                            min="0"
                            placeholder={t(
                                "approximateSpendPlaceholder"
                            )}
                        />
                        {/* =================================================
                            PHONE
                        ================================================== */}

                        <FormInput
                            label={t(
                                "spotPhone"
                            )}
                            value={
                                form.phone
                            }
                            onChange={value =>
                                update(
                                    "phone",
                                    value
                                )
                            }
                            type="tel"
                            placeholder={t(
                                "phonePlaceholder"
                            )}
                        />


                        {/* =================================================
                            WHATSAPP
                        ================================================== */}

                        <FormInput
                            label="WhatsApp"
                            value={
                                form.whatsapp
                            }
                            onChange={value =>
                                update(
                                    "whatsapp",
                                    value
                                )
                            }
                            type="tel"
                            placeholder={t(
                                "whatsappPlaceholder"
                            )}
                        />


                        {/* =================================================
                            ABOUT YOU
                        ================================================== */}

                        <div
                            className="nt-introduce-divider"
                        >

                            <span>
                                {t(
                                    "aboutYou"
                                )}
                            </span>

                        </div>


                        <FormInput
                            label={t(
                                "yourName"
                            )}
                            value={
                                form.submittedByName
                            }
                            onChange={value =>
                                update(
                                    "submittedByName",
                                    value
                                )
                            }
                            placeholder={t(
                                "yourNamePlaceholder"
                            )}
                        />


                        <FormInput
                            label={t(
                                "yourPhone"
                            )}
                            value={
                                form.submittedByPhone
                            }
                            onChange={value =>
                                update(
                                    "submittedByPhone",
                                    value
                                )
                            }
                            type="tel"
                            placeholder={t(
                                "yourPhonePlaceholder"
                            )}
                        />


                        {/* =================================================
                            DESCRIPTION
                        ================================================== */}

                        <div>

                            <label
                                htmlFor="spotDescription"
                            >
                                {t(
                                    "describeSpot"
                                )}
                            </label>


                            <textarea
                                id="spotDescription"
                                value={
                                    form.description
                                }
                                onChange={event =>
                                    update(
                                        "description",
                                        event
                                            .target
                                            .value
                                    )
                                }
                                placeholder={t(
                                    "describeSpotPlaceholder"
                                )}
                                rows={5}
                                maxLength={
                                    2000
                                }
                            />

                        </div>


                        {/* =================================================
                            ERROR
                        ================================================== */}

                        {error && (
                            <div
                                className="nt-introduce-error"
                                role="alert"
                            >
                                {error}
                            </div>
                        )}


                        {/* =================================================
                            LOCATION REMINDER
                        ================================================== */}

                        {!locationCaptured && (
                            <div
                                style={{
                                    padding:
                                        "12px 14px",

                                    borderRadius:
                                        "10px",

                                    background:
                                        "var(--nt-red-soft)",

                                    color:
                                        "var(--nt-red)",

                                    fontSize:
                                        "0.8rem",

                                    lineHeight:
                                        1.5,

                                    fontWeight:
                                        600,
                                }}
                            >
                                <MapPin
                                    size={
                                        15
                                    }
                                    style={{
                                        verticalAlign:
                                            "middle",

                                        marginRight:
                                            "5px",
                                    }}
                                />

                                Please capture your current
                                GPS location before submitting
                                this Spot.
                            </div>
                        )}


                        {/* =================================================
                            SUBMIT
                        ================================================== */}

                        <button
                            type="submit"
                            disabled={
                                loading ||
                                locating ||
                                !locationCaptured
                            }
                            className="nt-introduce-primary"
                            style={{
                                opacity:
                                    !locationCaptured
                                        ? 0.55
                                        : 1,

                                cursor:
                                    !locationCaptured ||
                                        loading ||
                                        locating
                                        ? "not-allowed"
                                        : "pointer",
                            }}
                        >

                            {loading ? (
                                <>
                                    <span
                                        className="nt-loading-spinner"
                                        style={{
                                            width:
                                                "18px",

                                            height:
                                                "18px",

                                            borderWidth:
                                                "2px",

                                            borderColor:
                                                "rgba(255,255,255,0.35)",

                                            borderTopColor:
                                                "#FFFFFF",
                                        }}
                                    />

                                    {t(
                                        "sending"
                                    )}
                                </>
                            ) : (
                                <>
                                    <span>
                                        {t(
                                            "introduceSpot"
                                        )}
                                    </span>

                                    <Send
                                        size={
                                            17
                                        }
                                    />
                                </>
                            )}

                        </button>


                        {/* =================================================
                            REVIEW NOTE
                        ================================================== */}

                        <p
                            style={{
                                margin:
                                    "12px 0 0",

                                textAlign:
                                    "center",

                                color:
                                    "var(--nt-muted)",

                                fontSize:
                                    "0.75rem",

                                lineHeight:
                                    "1.5",
                            }}
                        >
                            {t(
                                "introduceReviewNote"
                            )}
                        </p>


                    </form>

                </div>

            </main>

        </AppShell>
    );
}


/* =====================================================
   REUSABLE FORM INPUT
====================================================== */

function FormInput({
    label,
    value,
    onChange,
    placeholder,
    type = "text",
    required = false,
    min,
}) {
    return (
        <div>

            <label>
                {label}

                {required && (
                    <span>
                        {" "}
                        *
                    </span>
                )}

            </label>


            <input
                type={
                    type
                }

                value={
                    value
                }

                placeholder={
                    placeholder
                }

                required={
                    required
                }

                min={
                    min
                }

                onChange={event =>
                    onChange(
                        event
                            .target
                            .value
                    )
                }
            />

        </div>
    );
}