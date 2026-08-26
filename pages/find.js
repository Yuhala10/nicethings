import { useEffect, useState } from "react";

import {
    ArrowLeft,
    ArrowRight,
    LocateFixed,
    MapPin,
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
       CURRENT GPS LOCATION ONLY
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
        setLocationError(false);
        setLoadingLocation(true);

        try {
            const location =
                await getCurrentLocation();

            setCoordinates({
                latitude:
                    location.latitude,

                longitude:
                    location.longitude,

                accuracy:
                    location.accuracy,
            });
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
                t(
                    "locationError"
                )
            );
        } finally {
            setLoadingLocation(
                false
            );
        }
    }


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
      ====================================================== */

    async function handleSearch(
        event
    ) {
        event.preventDefault();

        setError("");
        setLocationError(false);

        /* -------------------------------------------------
           VISITOR CHECK
        ------------------------------------------------- */

        if (!visitorId) {
            setError(
                t(
                    "sessionNotReady"
                )
            );

            return;
        }

        /* -------------------------------------------------
           GPS LOCATION IS REQUIRED
        ------------------------------------------------- */

        if (
            !coordinates ||
            !Number.isFinite(
                Number(
                    coordinates.latitude
                )
            ) ||
            !Number.isFinite(
                Number(
                    coordinates.longitude
                )
            )
        ) {
            setLocationError(
                true
            );

            setError(
                t(
                    "locationRequired"
                )
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

                                /*
                                 * GPS ONLY.
                                 *
                                 * No manually entered
                                 * location/quarter is sent.
                                 */
                                latitude:
                                    Number(
                                        coordinates.latitude
                                    ),

                                longitude:
                                    Number(
                                        coordinates.longitude
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

            let data = {};

            try {
                data =
                    await response.json();
            } catch {
                data = {};
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
                     * This is only a display
                     * label now.
                     *
                     * The actual matching location
                     * is always latitude/longitude.
                     */
                    locationText:
                        t(
                            "currentLocation"
                        ),

                    latitude:
                        Number(
                            coordinates.latitude
                        ),

                    longitude:
                        Number(
                            coordinates.longitude
                        ),

                    accuracy:
                        Number(
                            coordinates.accuracy
                        ) || null,

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
        if (!category) {
            return null;
        }

        return (
            categories.find(
                item =>
                    item.id ===
                    category
            ) || null
        );
    }


    /* =====================================================
       CATEGORY NAME
    ====================================================== */

    function getCategoryName(
        item
    ) {
        if (!item) {
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


    /* =====================================================
       LOCATION READY
    ====================================================== */

    const locationReady =
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
                                size={17}
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
                                size={14}
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
                                locationReady
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
                                        {t(
                                            "whereAreYou"
                                        )}
                                    </h2>

                                    <p>
                                        {t(
                                            "locationHelp"
                                        )}
                                    </p>

                                </div>

                            </div>


                            <div
                                className="nt-location-panel"
                            >

                                <div
                                    className="nt-location-panel-header"
                                >

                                    <div
                                        className="nt-location-panel-icon"
                                    >
                                        <MapPin
                                            size={20}
                                        />
                                    </div>


                                    <div>

                                        <strong>
                                            {t(
                                                "location"
                                            )}
                                        </strong>

                                        <span>
                                            {t(
                                                "currentLocation"
                                            )}
                                        </span>

                                    </div>

                                </div>


                                {/* =================================================
                                    GPS ONLY
                                ================================================== */}

                                <button
                                    type="button"
                                    onClick={
                                        useMyLocation
                                    }
                                    disabled={
                                        loadingLocation
                                    }
                                    className={
                                        locationReady
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
                                                {t(
                                                    "gettingLocation"
                                                )}
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
                                                {locationReady
                                                    ? t(
                                                        "locationDetected"
                                                    )
                                                    : t(
                                                        "useMyLocation"
                                                    )}
                                            </span>

                                        </>
                                    )}

                                </button>


                                {/* =================================================
                                    LOCATION STATUS
                                ================================================== */}

                                {locationReady && (
                                    <div
                                        className="nt-current-location-success"
                                    >

                                        <LocateFixed
                                            size={17}
                                        />

                                        <span>
                                            {t(
                                                "locationDetected"
                                            )}
                                        </span>

                                    </div>
                                )}


                                {locationError && (
                                    <div
                                        className="nt-access-error"
                                        role="alert"
                                        style={{
                                            marginTop:
                                                "10px",
                                        }}
                                    >
                                        {error}
                                    </div>
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
                                            "chooseBudget"
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
                                            key={
                                                value
                                            }
                                            type="button"
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
                                        >
                                            {Number(
                                                value
                                            ).toLocaleString(
                                                "fr-FR"
                                            )}{" "}
                                            FCFA
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

                                <label
                                    htmlFor="customBudget"
                                    className="nt-label"
                                >
                                    {t(
                                        "customBudget"
                                    )}
                                </label>


                                <input
                                    id="customBudget"
                                    type="number"
                                    min="1"
                                    inputMode="numeric"
                                    value={
                                        customBudget
                                    }
                                    onChange={event => {
                                        setCustomBudget(
                                            event
                                                .target
                                                .value
                                        );

                                        setError(
                                            ""
                                        );
                                    }}
                                    placeholder={t(
                                        "customBudgetPlaceholder"
                                    )}
                                    className="nt-input"
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
                                            "people"
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

                                <div
                                    style={{
                                        minWidth:
                                            0,
                                    }}
                                >

                                    <strong>
                                        {t(
                                            "howManyPeople"
                                        )}
                                    </strong>

                                    <div
                                        style={{
                                            marginTop:
                                                "4px",

                                            color:
                                                "var(--nt-muted)",

                                            fontSize:
                                                "0.78rem",
                                        }}
                                    >
                                        {Number(
                                            people
                                        ) === 1
                                            ? t(
                                                "onePerson"
                                            )
                                            : `${people} ${t(
                                                "people"
                                            )}`}
                                    </div>

                                </div>


                                <div
                                    className="nt-people-controls"
                                >

                                    <button
                                        type="button"
                                        className="nt-people-button"
                                        onClick={
                                            decreasePeople
                                        }
                                        disabled={
                                            people <=
                                            Math.min(
                                                ...peopleOptions
                                            )
                                        }
                                        aria-label={t(
                                            "decreasePeople"
                                        )}
                                    >
                                        −
                                    </button>


                                    <div
                                        className="nt-people-count"
                                        aria-live="polite"
                                    >
                                        {people}
                                    </div>


                                    <button
                                        type="button"
                                        className="nt-people-button"
                                        onClick={
                                            increasePeople
                                        }
                                        disabled={
                                            people >=
                                            Math.max(
                                                ...peopleOptions
                                            )
                                        }
                                        aria-label={t(
                                            "increasePeople"
                                        )}
                                    >
                                        +
                                    </button>

                                </div>

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
                                        {t(
                                            "category"
                                        )}
                                    </h2>

                                    <p>
                                        {t(
                                            "categoryHelp"
                                        )}
                                    </p>

                                </div>

                            </div>


                            <div
                                className="nt-category-grid"
                            >

                                {categories.map(
                                    item => {
                                        const isSelected =
                                            category ===
                                            item.id;

                                        const itemName =
                                            getCategoryName(
                                                item
                                            );

                                        return (
                                            <button
                                                key={
                                                    item.id
                                                }
                                                type="button"
                                                className={
                                                    isSelected
                                                        ? "nt-category-card selected"
                                                        : "nt-category-card"
                                                }
                                                onClick={() => {
                                                    setCategory(
                                                        isSelected
                                                            ? ""
                                                            : item.id
                                                    );

                                                    setError(
                                                        ""
                                                    );
                                                }}
                                                aria-pressed={
                                                    isSelected
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


                                                <div
                                                    style={{
                                                        minWidth:
                                                            0,
                                                    }}
                                                >
                                                    <strong>
                                                        {
                                                            itemName
                                                        }
                                                    </strong>
                                                </div>

                                            </button>
                                        );
                                    }
                                )}

                            </div>


                            <button
                                type="button"
                                className={
                                    !category
                                        ? "nt-location-option active"
                                        : "nt-location-option"
                                }
                                onClick={() =>
                                    setCategory(
                                        ""
                                    )
                                }
                                style={{
                                    width:
                                        "100%",

                                    justifyContent:
                                        "center",

                                    marginTop:
                                        "10px",
                                }}
                            >

                                <Search
                                    size={17}
                                />

                                <span>
                                    {t(
                                        "anyCategory"
                                    )}
                                </span>

                            </button>

                        </section>


                        {/* =================================================
                            SEARCH SUMMARY
                        ================================================== */}

                        <section
                            style={{
                                marginTop:
                                    "20px",
                            }}
                        >

                            <div
                                className="nt-section-header"
                            >

                                <h3>
                                    {t(
                                        "yourSearch"
                                    )}
                                </h3>

                                <p>
                                    {t(
                                        "yourSearchDescription"
                                    )}
                                </p>

                            </div>


                            <div
                                className="nt-search-summary"
                            >

                                {/* LOCATION */}

                                <div
                                    className="nt-search-summary-item"
                                >

                                    <MapPin
                                        size={14}
                                    />

                                    <strong>
                                        {locationReady
                                            ? t(
                                                "currentLocation"
                                            )
                                            : t(
                                                "location"
                                            )}
                                    </strong>

                                </div>


                                {/* BUDGET */}

                                <div
                                    className="nt-search-summary-item"
                                >

                                    <span>
                                        {t(
                                            "budget"
                                        )}
                                    </span>

                                    <strong>
                                        {finalBudget
                                            ? finalBudget.toLocaleString(
                                                "fr-FR"
                                            )
                                            : "—"}{" "}
                                        FCFA
                                    </strong>

                                </div>


                                {/* PEOPLE */}

                                <div
                                    className="nt-search-summary-item"
                                >

                                    <Users
                                        size={14}
                                    />

                                    <strong>
                                        {people}
                                    </strong>

                                    <span>
                                        {Number(
                                            people
                                        ) === 1
                                            ? t(
                                                "person"
                                            )
                                            : t(
                                                "people"
                                            )}
                                    </span>

                                </div>


                                {/* CATEGORY */}

                                {selectedCategory && (
                                    <div
                                        className="nt-search-summary-item"
                                    >

                                        <Sparkles
                                            size={14}
                                        />

                                        <strong>
                                            {getCategoryName(
                                                selectedCategory
                                            )}
                                        </strong>

                                    </div>
                                )}

                            </div>

                        </section>


                        {/* =================================================
                            ERROR
                        ================================================== */}

                        {error &&
                            !locationError && (
                                <div
                                    className="nt-access-error"
                                    role="alert"
                                    style={{
                                        marginTop:
                                            "18px",
                                    }}
                                >
                                    {error}
                                </div>
                            )}


                        {/* =================================================
                            SEARCH BUTTON
                        ================================================== */}

                        <div
                            className="nt-search-action"
                        >

                            <button
                                type="submit"
                                disabled={
                                    searching ||
                                    loadingLocation ||
                                    !locationReady
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
                                            {t(
                                                "searching"
                                            )}
                                        </span>

                                    </>
                                ) : (
                                    <>

                                        <Search
                                            size={19}
                                        />

                                        <span>
                                            {t(
                                                "findSpot"
                                            )}
                                        </span>

                                        <ArrowRight
                                            size={19}
                                        />

                                    </>
                                )}

                            </button>

                        </div>


                        {/* =================================================
                            FRIENDLY MESSAGE
                        ================================================== */}

                        <div
                            style={{
                                marginTop:
                                    "16px",

                                display:
                                    "flex",

                                alignItems:
                                    "flex-start",

                                justifyContent:
                                    "center",

                                gap:
                                    "7px",

                                color:
                                    "var(--nt-muted)",

                                fontSize:
                                    "0.76rem",

                                lineHeight:
                                    "1.45",

                                textAlign:
                                    "center",
                            }}
                        >

                            <Sparkles
                                size={14}
                                style={{
                                    flex:
                                        "0 0 auto",

                                    marginTop:
                                        "2px",

                                    color:
                                        "var(--nt-red)",
                                }}
                            />

                            <span>
                                {t(
                                    "searchFriendlyMessage"
                                )}
                            </span>

                        </div>

                    </form>


                    {/* =================================================
                        HELP
                    ================================================== */}

                    <div
                        style={{
                            marginTop:
                                "18px",

                            padding:
                                "16px",

                            textAlign:
                                "center",

                            color:
                                "var(--nt-muted)",

                            fontSize:
                                "0.78rem",

                            lineHeight:
                                "1.5",
                        }}
                    >
                        {t(
                            "needHelp"
                        )}
                    </div>

                </div>

            </main>

        </AppShell>
    );
}