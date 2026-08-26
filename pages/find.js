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
import { initializeVisitor } from "../lib/visitor";
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
       INITIALIZE DATABASE-BACKED VISITOR SESSION
    ====================================================== */

    useEffect(() => {
        let cancelled = false;

        async function initVisitor() {
            const id =
                await initializeVisitor(
                    language
                );

            if (cancelled) {
                return;
            }

            if (!id) {
                setVisitorId(
                    ""
                );

                setError(
                    language === "fr"
                        ? "Impossible d'initialiser votre session. Veuillez réessayer."
                        : "Unable to initialize your visitor session. Please try again."
                );

                return;
            }

            setVisitorId(
                id
            );

            setError(
                ""
            );
        }

        initVisitor();

        return () => {
            cancelled = true;
        };
    }, [language]);


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
               SAVE GPS

               IMPORTANT:
               The Find page may use an approximate GPS fix.
               A 500 m browser accuracy reading is still a
               real geographic position and must not make the
               user completely unable to search.

               The actual accuracy is preserved and sent
               with the search.

               The stricter accuracy rule remains appropriate
               for Spot registration, where the submitted GPS
               becomes the Spot's official coordinates.
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
    function getCategoryIcon(
        categoryItem
    ) {
        if (!categoryItem) {
            return "📍";
        }

        return (
            categoryItem.icon ||
            "📍"
        );
    }

    function formatBudget(value) {
        const number = Number(value);

        if (!Number.isFinite(number)) {
            return "";
        }

        return number.toLocaleString("fr-FR");
    }

    const selectedCategory =
        getSelectedCategory();


    const finalBudget =
        getFinalBudget();


    /* =====================================================
       RENDER
    ====================================================== */

    return (
        <AppShell>

            <main
                className="nt-find-page"
            >

                {/* =================================================
                    HEADER
                ================================================= */}

                <header
                    className="nt-page-header"
                >

                    <div
                        className="nt-page-header-left"
                    >

                        <button
                            type="button"
                            className="nt-icon-button"
                            onClick={() =>
                                window.history.back()
                            }
                            aria-label={
                                language ===
                                    "fr"
                                    ? "Retour"
                                    : "Back"
                            }
                        >
                            <ArrowLeft
                                size={20}
                            />
                        </button>


                        <div>

                            <h1>
                                {t(
                                    "findTitle"
                                )}
                            </h1>

                            <p>
                                {t(
                                    "findSubtitle"
                                )}
                            </p>

                        </div>

                    </div>


                    <div
                        className="nt-language-switcher"
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
                                changeLanguage(
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
                                changeLanguage(
                                    "fr"
                                )
                            }
                        >
                            FR
                        </button>

                    </div>

                </header>


                {/* =================================================
                    LOCATION
                ================================================= */}

                <section
                    className="nt-location-card"
                >

                    <div
                        className="nt-section-heading"
                    >

                        <div
                            className="nt-section-icon"
                        >
                            <LocateFixed
                                size={21}
                            />
                        </div>


                        <div>

                            <h2>
                                {language ===
                                    "fr"
                                    ? "Votre position"
                                    : "Your location"}
                            </h2>

                            <p>
                                {language ===
                                    "fr"
                                    ? "Nous utilisons votre position réelle pour trouver les endroits près de vous."
                                    : "We use your real location to find places near you."}
                            </p>

                        </div>

                    </div>


                    {/* -------------------------------------------------
                        CURRENT LOCATION BUTTON
                    ------------------------------------------------- */}

                    <button
                        type="button"
                        className={
                            hasLocation
                                ? "nt-location-button active"
                                : "nt-location-button"
                        }
                        onClick={
                            useMyLocation
                        }
                        disabled={
                            loadingLocation
                        }
                    >

                        {loadingLocation ? (
                            <>
                                <span
                                    className="nt-loading-spinner"
                                />

                                <span>
                                    {language ===
                                        "fr"
                                        ? "Localisation..."
                                        : "Getting your location..."}
                                </span>
                            </>
                        ) : (
                            <>
                                <Navigation
                                    size={20}
                                />

                                <span>
                                    {hasLocation
                                        ? (
                                            language ===
                                                "fr"
                                                ? "Position actuelle détectée"
                                                : "Current location detected"
                                        )
                                        : (
                                            language ===
                                                "fr"
                                                ? "Utiliser ma position actuelle"
                                                : "Use My Current Location"
                                        )}
                                </span>
                            </>
                        )}

                    </button>


                    {/* -------------------------------------------------
                        LOCATION READY
                    ------------------------------------------------- */}

                    {hasLocation && (
                        <div
                            className="nt-location-success"
                        >

                            <MapPin
                                size={17}
                            />

                            <div>

                                <strong>
                                    {language ===
                                        "fr"
                                        ? "Position prête"
                                        : "Location ready"}
                                </strong>

                                {Number.isFinite(
                                    Number(
                                        coordinates?.accuracy
                                    )
                                ) && (
                                        <span>
                                            {language ===
                                                "fr"
                                                ? `Précision GPS : environ ${Math.round(
                                                    Number(
                                                        coordinates.accuracy
                                                    )
                                                )} m`
                                                : `GPS accuracy: about ${Math.round(
                                                    Number(
                                                        coordinates.accuracy
                                                    )
                                                )} m`}
                                        </span>
                                    )}

                            </div>

                        </div>
                    )}


                    {/* -------------------------------------------------
                        LOCATION ERROR
                    ------------------------------------------------- */}

                    {locationError &&
                        error && (
                            <div
                                className="nt-location-error"
                            >
                                {error}
                            </div>
                        )}


                    {!hasLocation &&
                        !loadingLocation && (
                            <p
                                className="nt-location-help"
                            >
                                <MapPin
                                    size={16}
                                />

                                {language ===
                                    "fr"
                                    ? "Votre position actuelle est nécessaire pour calculer les distances."
                                    : "Your current location is required to calculate distances."}
                            </p>
                        )}

                </section>


                {/* =================================================
                    SEARCH FORM
                ================================================= */}

                <form
                    onSubmit={
                        handleSearch
                    }
                    className="nt-find-form"
                >

                    {/* =================================================
                        CATEGORY
                    ================================================= */}

                    <section
                        className="nt-find-section"
                    >

                        <div
                            className="nt-section-heading"
                        >

                            <div
                                className="nt-section-icon"
                            >
                                <Sparkles
                                    size={21}
                                />
                            </div>


                            <div>

                                <h2>
                                    {t(
                                        "categoryTitle"
                                    )}
                                </h2>

                                <p>
                                    {t(
                                        "categorySubtitle"
                                    )}
                                </p>

                            </div>

                        </div>


                        <div
                            className="nt-category-grid"
                        >

                            {categories.map(
                                item => (
                                    <button
                                        key={
                                            item.id
                                        }
                                        type="button"
                                        className={
                                            category ===
                                                item.id
                                                ? "nt-category-card selected"
                                                : "nt-category-card"
                                        }
                                        onClick={() => {
                                            setCategory(
                                                item.id
                                            );

                                            setError(
                                                ""
                                            );
                                        }}
                                    >

                                        <span
                                            className="nt-category-icon"
                                        >
                                            {getCategoryIcon(
                                                item
                                            )}
                                        </span>

                                        <span>
                                            {getCategoryName(
                                                item.id
                                            )}
                                        </span>

                                    </button>
                                )
                            )}

                        </div>

                    </section>


                    {/* =================================================
                        BUDGET
                    ================================================= */}

                    <section
                        className="nt-find-section"
                    >

                        <div
                            className="nt-section-heading"
                        >

                            <div
                                className="nt-step-number"
                            >
                                2
                            </div>


                            <div>

                                <h2>
                                    {t(
                                        "chooseBudget"
                                    )}
                                </h2>

                                <p>
                                    {t(
                                        "budgetSubtitle"
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
                                        key={
                                            value
                                        }
                                        type="button"
                                        className={
                                            Number(
                                                budget
                                            ) ===
                                                Number(
                                                    value
                                                ) &&
                                                !customBudget
                                                ? "nt-budget-option selected"
                                                : "nt-budget-option"
                                        }
                                        onClick={() => {
                                            setBudget(
                                                value
                                            );

                                            setCustomBudget(
                                                ""
                                            );

                                            setError(
                                                ""
                                            );
                                        }}
                                    >

                                        <span
                                            className="nt-budget-price"
                                        >

                                            <strong>
                                                {formatBudget(
                                                    value
                                                )}
                                            </strong>

                                            <span>
                                                FCFA
                                            </span>

                                        </span>

                                    </button>
                                )
                            )}

                        </div>


                        {/* -------------------------------------------------
                            CUSTOM BUDGET
                        ------------------------------------------------- */}

                        <div
                            className="nt-custom-budget"
                        >

                            <label>
                                {t(
                                    "otherBudget"
                                )}
                            </label>


                            <input
                                type="number"
                                min="1"
                                inputMode="numeric"
                                value={
                                    customBudget
                                }
                                onChange={event => {
                                    setCustomBudget(
                                        event.target.value
                                    );

                                    setError(
                                        ""
                                    );
                                }}
                                placeholder={
                                    t(
                                        "enterBudget"
                                    )
                                }
                            />

                        </div>

                    </section>


                    {/* =================================================
                        PEOPLE
                    ================================================= */}

                    <section
                        className="nt-find-section"
                    >

                        <div
                            className="nt-section-heading"
                        >

                            <div
                                className="nt-section-icon"
                            >
                                <Users
                                    size={21}
                                />
                            </div>


                            <div>

                                <h2>
                                    {t(
                                        "peopleTitle"
                                    )}
                                </h2>

                                <p>
                                    {t(
                                        "peopleSubtitle"
                                    )}
                                </p>

                            </div>

                        </div>


                        <div
                            className="nt-people-control"
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
                                        ? "Diminuer"
                                        : "Decrease"
                                }
                            >
                                −
                            </button>


                            <div>

                                <strong>
                                    {people}
                                </strong>

                                <span>
                                    {Number(
                                        people
                                    ) ===
                                        1
                                        ? t(
                                            "person"
                                        )
                                        : t(
                                            "people"
                                        )}
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
                                        ? "Augmenter"
                                        : "Increase"
                                }
                            >
                                +
                            </button>

                        </div>

                    </section>
                    {/* =================================================
                        ERROR
                    ================================================== */}

                    {error &&
                        !locationError && (
                            <div
                                className="nt-find-error"
                                role="alert"
                            >
                                {error}
                            </div>
                        )}


                    {/* =================================================
                        SEARCH ACTION
                    ================================================== */}

                    <div
                        className="nt-search-action"
                    >

                        <button
                            type="submit"
                            disabled={
                                searching ||
                                loadingLocation ||
                                !hasLocation ||
                                !visitorId
                            }
                        >

                            {searching ? (
                                <>
                                    <span
                                        className="nt-loading-spinner"
                                        style={{
                                            width:
                                                "20px",

                                            height:
                                                "20px",

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
                                            ? "Recherche..."
                                            : "Searching..."}
                                    </span>
                                </>
                            ) : (
                                <>
                                    <Search
                                        size={20}
                                    />

                                    <span>
                                        {language ===
                                            "fr"
                                            ? "Trouver des endroits près de moi"
                                            : "Find places near me"}
                                    </span>

                                    <ArrowRight
                                        size={20}
                                    />
                                </>
                            )}

                        </button>


                        {!hasLocation && (
                            <p
                                className="nt-search-disabled-message"
                            >
                                <LocateFixed
                                    size={15}
                                />

                                {language ===
                                    "fr"
                                    ? "Utilisez votre position actuelle pour continuer."
                                    : "Use your current location to continue."}
                            </p>
                        )}

                    </div>

                </form>


                {/* =================================================
                    LOCATION FOOTER NOTE
                ================================================== */}

                <div
                    className="nt-location-footer-note"
                >

                    <Navigation
                        size={16}
                    />

                    <span>
                        {language ===
                            "fr"
                            ? "Votre position GPS est utilisée pour calculer les distances. Une zone saisie manuellement n'est pas utilisée pour déterminer votre position."
                            : "Your GPS location is used to calculate distances. A manually entered area is not used to determine your position."}
                    </span>

                </div>

            </main>

        </AppShell>
    );
}