import { useEffect, useState } from "react";

import {
    ArrowLeft,
    ArrowRight,
    LocateFixed,
    MapPin,
    Navigation,
    Search,
    Sparkles,
    Users,
} from "lucide-react";

import AppShell from "../components/layout/AppShell";
import { useLanguage } from "../lib/i18n";
import { getCurrentLocation } from "../lib/location";
import { NICE_THINGS } from "../lib/constants";


export default function FindPage() {
    const {
        language,
        setLanguage,
        t,
    } = useLanguage();


    /* =====================================================
       VISITOR
    ====================================================== */

    const [
        visitorId,
        setVisitorId,
    ] = useState("");


    /* =====================================================
       LOCATION
       
       GPS IS NOW THE ONLY LOCATION METHOD.
    ====================================================== */

    const [
        coordinates,
        setCoordinates,
    ] = useState(null);


    const [
        loadingLocation,
        setLoadingLocation,
    ] = useState(false);


    const [
        locationError,
        setLocationError,
    ] = useState(false);


    /* =====================================================
       SEARCH OPTIONS
    ====================================================== */

    const budgets =
        Array.isArray(
            NICE_THINGS.budgets
        ) &&
            NICE_THINGS.budgets.length
            ? NICE_THINGS.budgets
            : [1000];


    const peopleOptions =
        Array.isArray(
            NICE_THINGS.people
        ) &&
            NICE_THINGS.people.length
            ? NICE_THINGS.people
            : [1];


    const categories =
        Array.isArray(
            NICE_THINGS.categories
        )
            ? NICE_THINGS.categories
            : [];


    const [
        budget,
        setBudget,
    ] = useState(
        budgets[0]
    );


    const [
        customBudget,
        setCustomBudget,
    ] = useState("");


    const [
        people,
        setPeople,
    ] = useState(
        peopleOptions[0]
    );


    const [
        category,
        setCategory,
    ] = useState("");


    /* =====================================================
       SEARCH STATE
    ====================================================== */

    const [
        searching,
        setSearching,
    ] = useState(false);


    const [
        error,
        setError,
    ] = useState("");


    /* =====================================================
       CREATE VISITOR ID
    ====================================================== */

    useEffect(() => {
        let id =
            localStorage.getItem(
                "nicethings_visitor_id"
            );


        if (!id) {
            id =
                typeof crypto !==
                    "undefined" &&
                    crypto.randomUUID
                    ? crypto.randomUUID()
                    : `visitor_${Date.now()}_${Math.random()
                        .toString(36)
                        .slice(2)}`;


            localStorage.setItem(
                "nicethings_visitor_id",
                id
            );
        }


        setVisitorId(
            id
        );
    }, []);


    /* =====================================================
       USE MY CURRENT LOCATION
    ====================================================== */

    async function useMyLocation() {
        setError("");

        setLocationError(
            false
        );

        setLoadingLocation(
            true
        );


        try {
            const location =
                await getCurrentLocation();


            const latitude =
                Number(
                    location.latitude
                );


            const longitude =
                Number(
                    location.longitude
                );


            const accuracy =
                Number(
                    location.accuracy
                );


            /* =============================================
               VALIDATE GPS
            ============================================== */

            if (
                !Number.isFinite(
                    latitude
                ) ||
                !Number.isFinite(
                    longitude
                ) ||
                latitude < -90 ||
                latitude > 90 ||
                longitude < -180 ||
                longitude > 180
            ) {
                throw new Error(
                    language === "fr"
                        ? "La position GPS reçue est invalide."
                        : "The GPS location received from your device is invalid."
                );
            }


            /* =============================================
               ACCURACY CHECK
            ============================================== */

            if (
                Number.isFinite(
                    accuracy
                ) &&
                accuracy > 150
            ) {
                throw new Error(
                    language === "fr"
                        ? `Votre précision GPS est actuellement d'environ ${Math.round(
                            accuracy
                        )} mètres. Attendez un meilleur signal et réessayez.`
                        : `Your GPS accuracy is currently about ${Math.round(
                            accuracy
                        )} metres. Please wait for a better GPS signal and try again.`
                );
            }


            /* =============================================
               SAVE GPS
            ============================================== */

            setCoordinates({
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
                false
            );


            setError("");


        } catch (
        locationErrorValue
        ) {
            console.error(
                "NiceThings location error:",
                locationErrorValue
            );


            setCoordinates(
                null
            );


            setLocationError(
                true
            );


            setError(
                locationErrorValue?.message ||
                (
                    language === "fr"
                        ? "Activez votre position actuelle pour trouver les endroits près de vous."
                        : "Please allow access to your current location so we can find places near you."
                )
            );

        } finally {
            setLoadingLocation(
                false
            );
        }
    }


    /* =====================================================
       LOCATION STATUS
    ====================================================== */

    const hasLocation =
        Boolean(
            coordinates &&
            Number.isFinite(
                Number(
                    coordinates.latitude
                )
            ) &&
            Number.isFinite(
                Number(
                    coordinates.longitude
                )
            )
        );


    /* =====================================================
       BUDGET
    ====================================================== */

    function getFinalBudget() {
        if (
            customBudget.trim() !==
            ""
        ) {
            const value =
                Number(
                    customBudget
                );


            if (
                Number.isFinite(
                    value
                ) &&
                value > 0
            ) {
                return value;
            }
        }


        const value =
            Number(
                budget
            );


        return Number.isFinite(
            value
        ) &&
            value > 0
            ? value
            : 0;
    }


    /* =====================================================
       PEOPLE
    ====================================================== */

    function increasePeople() {
        const maximum =
            Math.max(
                ...peopleOptions
            );


        setPeople(
            current =>
                Math.min(
                    Number(
                        current
                    ) + 1,
                    maximum
                )
        );
    }


    function decreasePeople() {
        const minimum =
            Math.min(
                ...peopleOptions
            );


        setPeople(
            current =>
                Math.max(
                    Number(
                        current
                    ) - 1,
                    minimum
                )
        );
    }
    /* =====================================================
      SEARCH
      
      GPS IS REQUIRED.
      MANUAL AREA SEARCH IS REMOVED.
   ====================================================== */

    async function handleSearch(
        event
    ) {
        event.preventDefault();


        setError("");


        setLocationError(
            false
        );


        /* -------------------------------------------------
           VISITOR CHECK
        ------------------------------------------------- */

        if (
            !visitorId
        ) {
            setError(
                t(
                    "sessionNotReady"
                )
            );

            return;
        }


        /* -------------------------------------------------
           GPS CHECK
        ------------------------------------------------- */

        if (
            !hasLocation
        ) {
            setError(
                language === "fr"
                    ? "Activez votre position actuelle pour trouver les endroits près de vous."
                    : "Please use your current location to find places near you."
            );

            return;
        }


        /* -------------------------------------------------
           BUDGET CHECK
        ------------------------------------------------- */

        const finalBudget =
            getFinalBudget();


        if (
            !finalBudget ||
            finalBudget <= 0
        ) {
            setError(
                t(
                    "budgetRequired"
                )
            );

            return;
        }


        /* -------------------------------------------------
           SEARCH
        ------------------------------------------------- */

        setSearching(
            true
        );


        try {
            const response =
                await fetch(
                    "/api/search",
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


                                /* =================================
                                   AUTHORITATIVE USER GPS
                                ================================== */

                                latitude:
                                    Number(
                                        coordinates.latitude
                                    ),

                                longitude:
                                    Number(
                                        coordinates.longitude
                                    ),


                                /*
                                 * We intentionally do NOT send a
                                 * manually typed area.
                                 *
                                 * The backend uses GPS as the
                                 * geographic source of truth.
                                 */

                                locationText:
                                    t(
                                        "currentLocation"
                                    ),


                                budget:
                                    finalBudget,


                                people:
                                    Number(
                                        people
                                    ),


                                category:
                                    category ||
                                    null,


                                language,
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


            /* -------------------------------------------------
               ACCESS REQUIRED
            ------------------------------------------------- */

            if (
                response.status ===
                403 &&
                data.accessRequired
            ) {
                window.location.href =
                    "/access";

                return;
            }


            /* -------------------------------------------------
               LOCATION REQUIRED
            ------------------------------------------------- */

            if (
                response.status ===
                400 &&
                data.locationRequired
            ) {
                setCoordinates(
                    null
                );

                setError(
                    language === "fr"
                        ? "Votre position actuelle est nécessaire pour trouver les endroits près de vous."
                        : "Your current location is required to find nearby places."
                );

                return;
            }


            /* -------------------------------------------------
               SEARCH ERROR
            ------------------------------------------------- */

            if (
                !response.ok
            ) {
                throw new Error(
                    data.error ||
                    t(
                        "searchError"
                    )
                );
            }


            /* -------------------------------------------------
               SAVE SEARCH
            ------------------------------------------------- */

            sessionStorage.setItem(
                "nicethings_search",
                JSON.stringify({
                    searchId:
                        data.searchId ||
                        null,


                    results:
                        data.results ||
                        [],


                    alternatives:
                        data.alternatives ||
                        [],


                    accessExpiresAt:
                        data.accessExpiresAt ||
                        null,


                    launchFree:
                        Boolean(
                            data.launchFree
                        ),


                    admin:
                        Boolean(
                            data.admin
                        ),


                    /*
                     * This is a UI label only.
                     *
                     * The actual geographic position is
                     * stored separately below.
                     */

                    locationText:
                        t(
                            "currentLocation"
                        ),


                    /* =================================
                       USER GPS
                    ================================== */

                    latitude:
                        Number(
                            coordinates.latitude
                        ),

                    longitude:
                        Number(
                            coordinates.longitude
                        ),


                    accuracy:
                        Number.isFinite(
                            Number(
                                coordinates.accuracy
                            )
                        )
                            ? Number(
                                coordinates.accuracy
                            )
                            : null,


                    budget:
                        finalBudget,


                    people:
                        Number(
                            people
                        ),


                    category:
                        category ||
                        null,


                    language,
                })
            );


            /* -------------------------------------------------
               GO TO RESULTS
            ------------------------------------------------- */

            window.location.href =
                "/results";

        } catch (
        searchError
        ) {
            console.error(
                "NiceThings search error:",
                searchError
            );


            setError(
                searchError?.message ||
                t(
                    "searchError"
                )
            );

        } finally {
            setSearching(
                false
            );
        }
    }


    /* =====================================================
       SELECTED CATEGORY
    ====================================================== */

    function getSelectedCategory() {
        if (
            !category
        ) {
            return null;
        }


        return (
            categories.find(
                item =>
                    item.id ===
                    category
            ) ||
            null
        );
    }


    /* =====================================================
       CATEGORY NAME
    ====================================================== */

    function getCategoryName(
        item
    ) {
        if (
            !item
        ) {
            return "";
        }


        return language ===
            "fr"
            ? item.fr
            : item.en;
    }


    const selectedCategory =
        getSelectedCategory();


    const finalBudget =
        getFinalBudget();
    return (
        <AppShell>

            <main className="nt-discovery">

                <div className="nt-discovery-shell">

                    {/* =================================================
                        TOP BAR
                    ================================================== */}

                    <div
                        style={{
                            display:
                                "flex",

                            alignItems:
                                "center",

                            justifyContent:
                                "space-between",

                            gap:
                                "12px",

                            marginBottom:
                                "20px",
                        }}
                    >

                        <button
                            type="button"
                            onClick={() =>
                                window.history.back()
                            }
                            className="nt-button-secondary"
                            style={{
                                minHeight:
                                    "42px",

                                padding:
                                    "8px 13px",
                            }}
                        >

                            <ArrowLeft
                                size={
                                    17
                                }
                            />

                            <span>
                                {t(
                                    "back"
                                )}
                            </span>

                        </button>


                        <div
                            className="nt-language-switch"
                            aria-label={
                                t(
                                    "language"
                                )
                            }
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
                            >
                                FR
                            </button>

                        </div>

                    </div>


                    {/* =================================================
                        HEADER
                    ================================================== */}

                    <header
                        className="nt-discovery-header"
                    >

                        <div
                            className="nt-hero-badge"
                        >

                            <Sparkles
                                size={
                                    14
                                }
                            />

                            {t(
                                "discover"
                            )}

                        </div>


                        <h1>
                            {t(
                                "findPageTitle"
                            )}
                        </h1>


                        <p>
                            {t(
                                "findPageDescription"
                            )}
                        </p>

                    </header>


                    {/* =================================================
                        PROGRESS
                    ================================================== */}

                    <div
                        className="nt-search-progress"
                        aria-hidden="true"
                    >

                        <div
                            className={
                                hasLocation
                                    ? "nt-search-progress-step completed"
                                    : "nt-search-progress-step active"
                            }
                        />


                        <div
                            className={
                                finalBudget
                                    ? "nt-search-progress-step active"
                                    : "nt-search-progress-step"
                            }
                        />


                        <div
                            className={
                                people
                                    ? "nt-search-progress-step active"
                                    : "nt-search-progress-step"
                            }
                        />


                        <div
                            className={
                                category
                                    ? "nt-search-progress-step completed"
                                    : "nt-search-progress-step"
                            }
                        />

                    </div>


                    {/* =================================================
                        FORM
                    ================================================== */}

                    <form
                        onSubmit={
                            handleSearch
                        }
                        className="nt-discovery-card"
                    >

                        {/* =================================================
                            STEP 1 — CURRENT LOCATION
                        ================================================== */}

                        <section
                            className="nt-discovery-step"
                        >

                            <div
                                className="nt-discovery-step-header"
                            >

                                <div
                                    className="nt-discovery-step-number"
                                >
                                    1
                                </div>


                                <div>

                                    <h2>
                                        {language ===
                                            "fr"
                                            ? "Où êtes-vous ?"
                                            : "Where are you?"}
                                    </h2>


                                    <p>
                                        {language ===
                                            "fr"
                                            ? "Nous utilisons votre position actuelle pour trouver les endroits près de vous."
                                            : "We use your current location to find places near you."}
                                    </p>

                                </div>

                            </div>


                            {/* =================================================
                                GPS LOCATION CARD
                            ================================================== */}

                            <div
                                className="nt-location-panel"
                            >

                                <div
                                    className="nt-location-panel-header"
                                >

                                    <div
                                        className="nt-location-panel-icon"
                                    >

                                        {hasLocation ? (
                                            <Navigation
                                                size={
                                                    20
                                                }
                                            />
                                        ) : (
                                            <MapPin
                                                size={
                                                    20
                                                }
                                            />
                                        )}

                                    </div>


                                    <div>

                                        <strong>
                                            {hasLocation
                                                ? language ===
                                                    "fr"
                                                    ? "Position actuelle capturée"
                                                    : "Current location captured"
                                                : language ===
                                                    "fr"
                                                    ? "Votre position actuelle"
                                                    : "Your current location"}
                                        </strong>


                                        <span>
                                            {hasLocation
                                                ? language ===
                                                    "fr"
                                                    ? "Cette position sera utilisée pour calculer les distances."
                                                    : "This position will be used to calculate distances."
                                                : language ===
                                                    "fr"
                                                    ? "Vous devez autoriser l'accès à votre position."
                                                    : "You must allow access to your current location."}
                                        </span>

                                    </div>

                                </div>


                                {/* =================================================
                                    CURRENT LOCATION BUTTON
                                ================================================== */}

                                <button
                                    type="button"
                                    onClick={
                                        useMyLocation
                                    }
                                    disabled={
                                        loadingLocation ||
                                        searching
                                    }
                                    className={
                                        hasLocation
                                            ? "nt-location-option active"
                                            : "nt-location-option"
                                    }
                                >

                                    {loadingLocation ? (
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
                                                }}
                                            />

                                            <span>
                                                {language ===
                                                    "fr"
                                                    ? "Localisation en cours..."
                                                    : "Getting your location..."}
                                            </span>

                                        </>
                                    ) : (
                                        <>

                                            <LocateFixed
                                                size={
                                                    19
                                                }
                                            />

                                            <span>
                                                {hasLocation
                                                    ? language ===
                                                        "fr"
                                                        ? "Actualiser ma position"
                                                        : "Update My Current Location"
                                                    : language ===
                                                        "fr"
                                                        ? "Utiliser ma position actuelle"
                                                        : "Use My Current Location"}
                                            </span>

                                        </>
                                    )}

                                </button>


                                {/* =================================================
                                    CAPTURED GPS DETAILS
                                ================================================== */}

                                {hasLocation && (
                                    <div
                                        style={{
                                            marginTop:
                                                "12px",

                                            padding:
                                                "12px",

                                            borderRadius:
                                                "10px",

                                            background:
                                                "#f0fdf4",

                                            border:
                                                "1px solid #bbf7d0",
                                        }}
                                    >

                                        <div
                                            style={{
                                                display:
                                                    "grid",

                                                gridTemplateColumns:
                                                    "1fr 1fr",

                                                gap:
                                                    "8px",
                                            }}
                                        >

                                            <div>

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


                                                <strong
                                                    style={{
                                                        display:
                                                            "block",

                                                        marginTop:
                                                            "3px",

                                                        fontSize:
                                                            "0.78rem",

                                                        wordBreak:
                                                            "break-all",
                                                    }}
                                                >
                                                    {Number(
                                                        coordinates.latitude
                                                    ).toFixed(
                                                        6
                                                    )}
                                                </strong>

                                            </div>


                                            <div>

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


                                                <strong
                                                    style={{
                                                        display:
                                                            "block",

                                                        marginTop:
                                                            "3px",

                                                        fontSize:
                                                            "0.78rem",

                                                        wordBreak:
                                                            "break-all",
                                                    }}
                                                >
                                                    {Number(
                                                        coordinates.longitude
                                                    ).toFixed(
                                                        6
                                                    )}
                                                </strong>

                                            </div>


                                            <div
                                                style={{
                                                    gridColumn:
                                                        "1 / -1",
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


                                                <strong
                                                    style={{
                                                        display:
                                                            "block",

                                                        marginTop:
                                                            "3px",

                                                        fontSize:
                                                            "0.82rem",

                                                        color:
                                                            "#16803C",
                                                    }}
                                                >
                                                    {Number.isFinite(
                                                        Number(
                                                            coordinates.accuracy
                                                        )
                                                    )
                                                        ? `±${Math.round(
                                                            Number(
                                                                coordinates.accuracy
                                                            )
                                                        )} metres`
                                                        : language ===
                                                            "fr"
                                                            ? "Position GPS valide"
                                                            : "Valid GPS position"}
                                                </strong>

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

                                        {error ||
                                            (
                                                language ===
                                                    "fr"
                                                    ? "Impossible d'obtenir votre position actuelle."
                                                    : "Unable to get your current location."
                                            )}

                                    </div>
                                )}


                                {/* =================================================
                                    NO MANUAL LOCATION
                                ================================================== */}

                                {!hasLocation &&
                                    !loadingLocation && (
                                        <p
                                            style={{
                                                margin:
                                                    "12px 0 0",

                                                fontSize:
                                                    "0.76rem",

                                                lineHeight:
                                                    1.45,

                                                color:
                                                    "var(--nt-muted)",
                                            }}
                                        >
                                            <MapPin
                                                size={
                                                    14
                                                }
                                                style={{
                                                    verticalAlign:
                                                        "middle",

                                                    marginRight:
                                                        "4px",
                                                }}
                                            />

                                            {language ===
                                                "fr"
                                                ? "La saisie manuelle d'un quartier n'est plus utilisée. Votre position GPS réelle est nécessaire pour une correspondance précise."
                                                : "Manual area entry is not used. Your real GPS position is required for accurate matching."}
                                        </p>
                                    )}

                            </div>

                        </section>


                        {/* =================================================
                            STEP 2 — BUDGET
                        ================================================== */}

                        <section
                            className="nt-discovery-step"
                        >

                            <div
                                className="nt-discovery-step-header"
                            >

                                <div
                                    className="nt-discovery-step-number"
                                >
                                    2
                                </div>


                                <div>

                                    <h2>
                                        {t(
                                            "budgetTitle"
                                        )}
                                    </h2>


                                    <p>
                                        {t(
                                            "budgetHelp"
                                        )}
                                    </p>

                                </div>

                            </div>


                            <div
                                className="nt-budget-grid"
                            >

                                {budgets.map(
                                    value => (
                                        <button
                                            key={value}
                                            type="button"
                                            onClick={() => {
                                                setBudget(value);
                                                setCustomBudget("");
                                                setError("");
                                            }}
                                            className={
                                                Number(budget) === Number(value) && !customBudget
                                                    ? "nt-budget-option selected"
                                                    : "nt-budget-option"
                                            }
                                        >
                                            <span className="nt-budget-price">
                                                <strong>
                                                    {Number(value).toLocaleString("fr-FR")}
                                                </strong>

                                                <span>FCFA</span>
                                            </span>
                                        </button>
                                    )
                                )}

                            </div>


                            <div
                                style={{
                                    marginTop:
                                        "12px",
                                }}
                            >

                                <label>
                                    {language ===
                                        "fr"
                                        ? "Autre budget"
                                        : "Other budget"}
                                </label>


                                <input
                                    type="number"
                                    min="1"
                                    value={
                                        customBudget
                                    }
                                    onChange={event =>
                                        setCustomBudget(
                                            event
                                                .target
                                                .value
                                        )
                                    }
                                    placeholder={
                                        language ===
                                            "fr"
                                            ? "Entrez votre budget"
                                            : "Enter your budget"
                                    }
                                />

                            </div>

                        </section>


                        {/* =================================================
                            STEP 3 — PEOPLE
                        ================================================== */}

                        <section
                            className="nt-discovery-step"
                        >

                            <div
                                className="nt-discovery-step-header"
                            >

                                <div
                                    className="nt-discovery-step-number"
                                >
                                    3
                                </div>


                                <div>

                                    <h2>
                                        {t(
                                            "peopleTitle"
                                        )}
                                    </h2>


                                    <p>
                                        {t(
                                            "peopleHelp"
                                        )}
                                    </p>

                                </div>

                            </div>


                            <div
                                className="nt-people-selector"
                            >

                                <button
                                    type="button"
                                    onClick={
                                        decreasePeople
                                    }
                                    disabled={
                                        Number(
                                            people
                                        ) <=
                                        Math.min(
                                            ...peopleOptions
                                        )
                                    }
                                    aria-label={
                                        language ===
                                            "fr"
                                            ? "Réduire le nombre de personnes"
                                            : "Decrease people"
                                    }
                                >
                                    −
                                </button>


                                <div>

                                    <Users
                                        size={
                                            20
                                        }
                                    />


                                    <strong>
                                        {
                                            people
                                        }
                                    </strong>


                                    <span>
                                        {Number(
                                            people
                                        ) ===
                                            1
                                            ? language ===
                                                "fr"
                                                ? "personne"
                                                : "person"
                                            : language ===
                                                "fr"
                                                ? "personnes"
                                                : "people"}
                                    </span>

                                </div>


                                <button
                                    type="button"
                                    onClick={
                                        increasePeople
                                    }
                                    disabled={
                                        Number(
                                            people
                                        ) >=
                                        Math.max(
                                            ...peopleOptions
                                        )
                                    }
                                    aria-label={
                                        language ===
                                            "fr"
                                            ? "Augmenter le nombre de personnes"
                                            : "Increase people"
                                    }
                                >
                                    +
                                </button>

                            </div>

                        </section>
                        {/* =================================================
                            STEP 4 — CATEGORY
                        ================================================== */}

                        <section
                            className="nt-discovery-step"
                        >

                            <div
                                className="nt-discovery-step-header"
                            >

                                <div
                                    className="nt-discovery-step-number"
                                >
                                    4
                                </div>


                                <div>

                                    <h2>
                                        {language ===
                                            "fr"
                                            ? "Que recherchez-vous ?"
                                            : "What are you looking for?"}
                                    </h2>


                                    <p>
                                        {language ===
                                            "fr"
                                            ? "Choisissez une catégorie ou laissez-nous chercher partout."
                                            : "Choose a category or let us search everywhere nearby."}
                                    </p>

                                </div>

                            </div>


                            <div
                                className="nt-category-grid"
                            >

                                {/* =============================================
                                    ALL CATEGORIES
                                ============================================== */}

                                <button
                                    type="button"
                                    className={
                                        category ===
                                            ""
                                            ? "nt-category-card selected"
                                            : "nt-category-card"
                                    }
                                    onClick={() =>
                                        setCategory(
                                            ""
                                        )
                                    }
                                    aria-pressed={
                                        category ===
                                        ""
                                    }
                                >

                                    <div
                                        className="nt-category-icon"
                                    >
                                        🔎
                                    </div>


                                    <strong>
                                        {language ===
                                            "fr"
                                            ? "Tout"
                                            : "All"}
                                    </strong>

                                </button>


                                {/* =============================================
                                    CATEGORY OPTIONS
                                ============================================== */}

                                {categories.map(
                                    item => {

                                        const selected =
                                            category ===
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
                                                    setCategory(
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

                        </section>


                        {/* =================================================
                            SEARCH ERROR
                        ================================================== */}

                        {error && (
                            <div
                                className="nt-discovery-error"
                                role="alert"
                            >

                                <MapPin
                                    size={
                                        17
                                    }
                                />

                                <span>
                                    {
                                        error
                                    }
                                </span>

                            </div>
                        )}


                        {/* =================================================
                            SEARCH SUMMARY
                        ================================================== */}

                        <div
                            className="nt-search-summary"
                        >

                            <div
                                className="nt-search-summary-icon"
                            >

                                <Navigation
                                    size={
                                        18
                                    }
                                />

                            </div>


                            <div>

                                <strong>
                                    {hasLocation
                                        ? language ===
                                            "fr"
                                            ? "Prêt à rechercher autour de vous"
                                            : "Ready to search around you"
                                        : language ===
                                            "fr"
                                            ? "Votre position est nécessaire"
                                            : "Your location is required"}
                                </strong>


                                <span>
                                    {hasLocation
                                        ? language ===
                                            "fr"
                                            ? "Les résultats seront classés selon leur distance réelle depuis votre position."
                                            : "Results will be ranked using their real distance from your location."
                                        : language ===
                                            "fr"
                                            ? "Utilisez votre position actuelle pour continuer."
                                            : "Use your current location to continue."}
                                </span>

                            </div>

                        </div>


                        {/* =================================================
                            SEARCH BUTTON
                        ================================================== */}

                        <button
                            type="submit"
                            className="nt-search-submit"
                            disabled={
                                searching ||
                                !hasLocation ||
                                !finalBudget
                            }
                            style={{
                                opacity:
                                    !hasLocation ||
                                        !finalBudget
                                        ? 0.55
                                        : 1,

                                cursor:
                                    searching ||
                                        !hasLocation ||
                                        !finalBudget
                                        ? "not-allowed"
                                        : "pointer",
                            }}
                        >

                            {searching ? (
                                <>

                                    <span
                                        className="nt-loading-spinner"
                                        style={{
                                            width:
                                                "19px",

                                            height:
                                                "19px",

                                            borderWidth:
                                                "2px",

                                            borderColor:
                                                "rgba(255,255,255,0.35)",

                                            borderTopColor:
                                                "#FFFFFF",
                                        }}
                                    />

                                    <span>
                                        {language ===
                                            "fr"
                                            ? "Recherche en cours..."
                                            : "Finding nearby places..."}
                                    </span>

                                </>
                            ) : (
                                <>

                                    <Search
                                        size={
                                            19
                                        }
                                    />

                                    <span>
                                        {language ===
                                            "fr"
                                            ? "Trouver des endroits près de moi"
                                            : "Find places near me"}
                                    </span>


                                    <ArrowRight
                                        size={
                                            18
                                        }
                                    />

                                </>
                            )}

                        </button>


                        {/* =================================================
                            GPS PRIVACY / ACCURACY NOTE
                        ================================================== */}

                        <p
                            style={{
                                margin:
                                    "12px auto 0",

                                maxWidth:
                                    "560px",

                                textAlign:
                                    "center",

                                color:
                                    "var(--nt-muted)",

                                fontSize:
                                    "0.72rem",

                                lineHeight:
                                    1.5,
                            }}
                        >
                            {language ===
                                "fr"
                                ? "Votre position actuelle sert à calculer les distances. Un quartier saisi manuellement n'est pas utilisé pour déterminer votre position."
                                : "Your current location is used to calculate distances. A manually entered area is not used to determine your position."}
                        </p>

                    </form>

                </div>

            </main>

        </AppShell>
    );
}