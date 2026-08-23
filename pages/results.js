import {
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    ArrowLeft,
    ArrowRight,
    Clock3,
    MapPin,
    Navigation,
    Search,
    Sparkles,
    Star,
} from "lucide-react";

import AppShell from "../components/layout/AppShell";
import { useLanguage } from "../lib/i18n";
import { NICE_THINGS } from "../lib/constants";


export default function ResultsPage() {
    const {
        language,
        setLanguage,
        t,
    } = useLanguage();


    /* =====================================================
       SEARCH DATA
    ====================================================== */

    const [
        search,
        setSearch,
    ] = useState(null);

    const [
        loading,
        setLoading,
    ] = useState(true);

    const [
        error,
        setError,
    ] = useState("");


    /* =====================================================
       VIEW
    ====================================================== */

    const [
        view,
        setView,
    ] = useState("list");


    /* =====================================================
       LOAD SEARCH
    ====================================================== */

    useEffect(() => {
        try {
            const raw =
                sessionStorage.getItem(
                    "nicethings_search"
                );


            if (!raw) {
                setError(
                    t(
                        "resultsNotFound"
                    )
                );

                return;
            }


            const parsed =
                JSON.parse(
                    raw
                );


            if (
                !parsed ||
                !Array.isArray(
                    parsed.results
                )
            ) {
                throw new Error(
                    "Invalid search data."
                );
            }


            setSearch(
                parsed
            );
        } catch (
        loadError
        ) {
            console.error(
                "NiceThings results error:",
                loadError
            );

            setError(
                t(
                    "resultsError"
                )
            );
        } finally {
            setLoading(false);
        }
    }, [t]);


    /* =====================================================
       CATEGORY NAME
    ====================================================== */

    function getCategoryName(
        categoryId
    ) {
        if (!categoryId) {
            return t(
                "anyCategory"
            );
        }


        const categories =
            Array.isArray(
                NICE_THINGS.categories
            )
                ? NICE_THINGS.categories
                : [];


        const category =
            categories.find(
                item =>
                    item.id ===
                    categoryId
            );


        if (!category) {
            return categoryId;
        }


        return language ===
            "fr"
            ? category.fr
            : category.en;
    }


    /* =====================================================
       OPEN / CLOSED
    ====================================================== */

    function isOpen(
        spot
    ) {
        if (
            !spot?.opening_time ||
            !spot?.closing_time
        ) {
            return null;
        }


        const now =
            new Date();


        const currentMinutes =
            now.getHours() *
            60 +
            now.getMinutes();


        const [
            openHour,
            openMinute,
        ] =
            String(
                spot.opening_time
            )
                .split(":")
                .map(Number);


        const [
            closeHour,
            closeMinute,
        ] =
            String(
                spot.closing_time
            )
                .split(":")
                .map(Number);


        if (
            !Number.isFinite(
                openHour
            ) ||
            !Number.isFinite(
                closeHour
            )
        ) {
            return null;
        }


        const opening =
            openHour *
            60 +
            (openMinute || 0);


        const closing =
            closeHour *
            60 +
            (closeMinute || 0);


        /*
         * Overnight opening hours.
         * Example: 18:00 → 02:00
         */

        if (
            closing <
            opening
        ) {
            return (
                currentMinutes >=
                opening ||
                currentMinutes <=
                closing
            );
        }


        return (
            currentMinutes >=
            opening &&
            currentMinutes <=
            closing
        );
    }


    /* =====================================================
       PRICE
    ====================================================== */

    function formatPrice(
        spot
    ) {
        const minimum =
            Number(
                spot?.minimum_price
            );

        const maximum =
            Number(
                spot?.maximum_price
            );

        const average =
            Number(
                spot?.average_price
            );


        const currency =
            spot?.currency ||
            "XAF";


        if (
            Number.isFinite(
                minimum
            ) &&
            Number.isFinite(
                maximum
            ) &&
            minimum > 0 &&
            maximum > 0 &&
            minimum !== maximum
        ) {
            return `${minimum.toLocaleString(
                "fr-FR"
            )} – ${maximum.toLocaleString(
                "fr-FR"
            )} ${currency}`;
        }


        if (
            Number.isFinite(
                average
            ) &&
            average > 0
        ) {
            return `${average.toLocaleString(
                "fr-FR"
            )} ${currency}`;
        }


        if (
            Number.isFinite(
                minimum
            ) &&
            minimum > 0
        ) {
            return `${minimum.toLocaleString(
                "fr-FR"
            )} ${currency}`;
        }


        return t(
            "priceNotAvailable"
        );
    }


    /* =====================================================
       DISTANCE
    ====================================================== */

    function formatDistance(
        distanceKm
    ) {
        if (
            distanceKm ===
            null ||
            distanceKm ===
            undefined
        ) {
            return null;
        }


        const distance =
            Number(
                distanceKm
            );


        if (
            !Number.isFinite(
                distance
            ) ||
            distance < 0
        ) {
            return null;
        }


        if (
            distance < 1
        ) {
            return `${Math.round(
                distance * 1000
            )} m`;
        }


        return `${distance.toFixed(
            1
        )} km`;
    }


    /* =====================================================
       OPEN SPOT
    ====================================================== */

    function openSpot(
        spot
    ) {
        if (
            !spot?.id
        ) {
            return;
        }


        sessionStorage.setItem(
            "nicethings_selected_spot",
            JSON.stringify({
                spot,

                searchId:
                    search?.searchId ||
                    null,
            })
        );


        window.location.href =
            `/spot/${spot.id}`;
    }


    /* =====================================================
       SORTED RESULTS
    ====================================================== */

    const results =
        useMemo(() => {
            if (
                !search ||
                !Array.isArray(
                    search.results
                )
            ) {
                return [];
            }


            return [
                ...search.results,
            ];
        }, [search]);


    /* =====================================================
       LOADING
    ====================================================== */

    if (loading) {
        return (
            <AppShell>

                <main className="nt-results-page">

                    <div className="nt-results-shell">

                        <div
                            className="nt-results-loading"
                        >

                            <span
                                className="nt-loading-spinner"
                            />

                            <p>
                                {t(
                                    "loading"
                                )}
                            </p>

                        </div>

                    </div>

                </main>

            </AppShell>
        );
    }


    /* =====================================================
       ERROR
    ====================================================== */

    if (
        error ||
        !search
    ) {
        return (
            <AppShell>

                <main className="nt-results-page">

                    <div className="nt-results-shell">

                        <button
                            type="button"
                            className="nt-button-secondary"
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


                        <div
                            className="nt-results-empty"
                        >

                            <Sparkles
                                size={28}
                            />

                            <h1>
                                {t(
                                    "noResults"
                                )}
                            </h1>

                            <p>
                                {error ||
                                    t(
                                        "resultsError"
                                    )}
                            </p>


                            <button
                                type="button"
                                className="nt-button-primary"
                                onClick={() =>
                                    window.location.href =
                                    "/find"
                                }
                            >

                                <Search
                                    size={17}
                                />

                                {t(
                                    "newSearch"
                                )}

                                <ArrowRight
                                    size={17}
                                />

                            </button>

                        </div>

                    </div>

                </main>

            </AppShell>
        );
    }


    return (
        <AppShell>

            <main className="nt-results-page">

                <div className="nt-results-shell">

                    {/* =================================================
                        TOP BAR
                    ================================================== */}

                    <div
                        className="nt-results-topbar"
                    >

                        <button
                            type="button"
                            className="nt-button-secondary"
                            onClick={() =>
                                window.history.back()
                            }
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
                        className="nt-results-header"
                    >

                        <div
                            className="nt-results-eyebrow"
                        >

                            <Sparkles
                                size={14}
                            />

                            {t(
                                "bestMatches"
                            )}

                        </div>


                        <h1>
                            {results.length >
                                0
                                ? t(
                                    "resultsTitle"
                                )
                                : t(
                                    "noResults"
                                )}
                        </h1>


                        <p>
                            {results.length >
                                0
                                ? t(
                                    "resultsDescription"
                                )
                                : t(
                                    "resultsEmptyDescription"
                                )}
                        </p>

                    </header>


                    {/* =================================================
                        SEARCH SUMMARY
                    ================================================== */}

                    <section
                        className="nt-results-summary"
                    >

                        <div
                            className="nt-results-summary-item"
                        >

                            <MapPin
                                size={16}
                            />

                            <div>

                                <span>
                                    {t(
                                        "location"
                                    )}
                                </span>

                                <strong>
                                    {search.locationText ||
                                        t(
                                            "currentLocation"
                                        )}
                                </strong>

                            </div>

                        </div>


                        <div
                            className="nt-results-summary-item"
                        >

                            <span
                                className="nt-results-summary-symbol"
                            >
                                FCFA
                            </span>

                            <div>

                                <span>
                                    {t(
                                        "budget"
                                    )}
                                </span>

                                <strong>
                                    {Number.isFinite(
                                        Number(
                                            search.budget
                                        )
                                    )
                                        ? Number(
                                            search.budget
                                        ).toLocaleString(
                                            "fr-FR"
                                        )
                                        : "—"}{" "}
                                    FCFA
                                </strong>

                            </div>

                        </div>


                        <div
                            className="nt-results-summary-item"
                        >

                            <span
                                className="nt-results-summary-symbol"
                            >
                                {search.people ||
                                    1}
                            </span>

                            <div>

                                <span>
                                    {t(
                                        "people"
                                    )}
                                </span>

                                <strong>
                                    {Number(
                                        search.people
                                    ) === 1
                                        ? t(
                                            "onePerson"
                                        )
                                        : `${search.people} ${t(
                                            "people"
                                        )}`}
                                </strong>

                            </div>

                        </div>


                        <div
                            className="nt-results-summary-item"
                        >

                            <Sparkles
                                size={16}
                            />

                            <div>

                                <span>
                                    {t(
                                        "category"
                                    )}
                                </span>

                                <strong>
                                    {getCategoryName(
                                        search.category
                                    )}
                                </strong>

                            </div>

                        </div>

                    </section>


                    {/* =================================================
                        RESULTS TOOLBAR
                    ================================================== */}

                    <div
                        className="nt-results-toolbar"
                    >

                        <div>

                            <strong>
                                {results.length}
                            </strong>{" "}

                            {results.length ===
                                1
                                ? t(
                                    "place"
                                )
                                : t(
                                    "places"
                                )}

                        </div>


                        <div
                            className="nt-results-view-switch"
                        >

                            <button
                                type="button"
                                className={
                                    view ===
                                        "list"
                                        ? "active"
                                        : ""
                                }
                                onClick={() =>
                                    setView(
                                        "list"
                                    )
                                }
                            >

                                <Navigation
                                    size={15}
                                />

                                {t(
                                    "listView"
                                )}

                            </button>


                            <button
                                type="button"
                                className={
                                    view ===
                                        "map"
                                        ? "active"
                                        : ""
                                }
                                onClick={() =>
                                    setView(
                                        "map"
                                    )
                                }
                            >

                                <MapPin
                                    size={15}
                                />

                                {t(
                                    "mapView"
                                )}

                            </button>

                        </div>

                    </div>


                    {/* =================================================
                        RESULTS
                    ================================================== */}

                    {view ===
                        "list" ? (

                        <section
                            className="nt-results-list"
                        >

                            {results.length ===
                                0 ? (

                                <div
                                    className="nt-results-empty"
                                >

                                    <Sparkles
                                        size={28}
                                    />

                                    <h2>
                                        {t(
                                            "noResults"
                                        )}
                                    </h2>

                                    <p>
                                        {t(
                                            "resultsEmptyDescription"
                                        )}
                                    </p>


                                    <button
                                        type="button"
                                        className="nt-button-primary"
                                        onClick={() =>
                                            window.location.href =
                                            "/find"
                                        }
                                    >

                                        <Search
                                            size={17}
                                        />

                                        {t(
                                            "newSearch"
                                        )}

                                        <ArrowRight
                                            size={17}
                                        />

                                    </button>

                                </div>

                            ) : (

                                results.map(
                                    (
                                        spot,
                                        index
                                    ) => {

                                        const open =
                                            isOpen(
                                                spot
                                            );


                                        const distance =
                                            formatDistance(
                                                spot?.distanceKm
                                            );


                                        const matchScore =
                                            Number(
                                                spot?.match
                                                    ?.score
                                            );


                                        const hasMatchScore =
                                            Number.isFinite(
                                                matchScore
                                            );


                                        return (
                                            <article
                                                key={
                                                    spot?.id ||
                                                    index
                                                }
                                                className="nt-result-card"
                                                onClick={() =>
                                                    openSpot(
                                                        spot
                                                    )
                                                }
                                                role="button"
                                                tabIndex={0}
                                                onKeyDown={
                                                    event => {
                                                        if (
                                                            event.key ===
                                                            "Enter" ||
                                                            event.key ===
                                                            " "
                                                        ) {
                                                            event.preventDefault();

                                                            openSpot(
                                                                spot
                                                            );
                                                        }
                                                    }
                                                }
                                            >

                                                {/* CARD TOP */}

                                                <div
                                                    className="nt-result-card-top"
                                                >

                                                    <div
                                                        className="nt-result-category-icon"
                                                    >
                                                        🍽️
                                                    </div>


                                                    <div
                                                        className="nt-result-card-title"
                                                    >

                                                        <div
                                                            style={{
                                                                display:
                                                                    "flex",

                                                                alignItems:
                                                                    "center",

                                                                gap:
                                                                    "8px",

                                                                flexWrap:
                                                                    "wrap",
                                                            }}
                                                        >

                                                            <h2>
                                                                {
                                                                    spot?.name ||
                                                                    t(
                                                                        "locationNotAvailable"
                                                                    )
                                                                }
                                                            </h2>


                                                            {spot?.verified && (
                                                                <span
                                                                    className="nt-verified-badge"
                                                                >
                                                                    {t(
                                                                        "verified"
                                                                    )}
                                                                </span>
                                                            )}

                                                        </div>


                                                        <p>
                                                            {getCategoryName(
                                                                spot?.category
                                                            )}
                                                        </p>

                                                    </div>


                                                    <ArrowRight
                                                        size={18}
                                                        className="nt-result-arrow"
                                                    />

                                                </div>


                                                {/* DETAILS */}

                                                <div
                                                    className="nt-result-details"
                                                >

                                                    <div
                                                        className="nt-result-detail"
                                                    >

                                                        <MapPin
                                                            size={15}
                                                        />

                                                        <span>
                                                            {spot?.neighborhood ||
                                                                spot?.address ||
                                                                spot?.city ||
                                                                t(
                                                                    "locationNotAvailable"
                                                                )}
                                                        </span>

                                                    </div>


                                                    <div
                                                        className="nt-result-detail"
                                                    >

                                                        <span
                                                            className="nt-price-icon"
                                                        >
                                                            FCFA
                                                        </span>

                                                        <span>
                                                            {formatPrice(
                                                                spot
                                                            )}
                                                        </span>

                                                    </div>


                                                    {distance && (
                                                        <div
                                                            className="nt-result-detail"
                                                        >

                                                            <Navigation
                                                                size={
                                                                    15
                                                                }
                                                            />

                                                            <span>
                                                                {
                                                                    distance
                                                                }
                                                            </span>

                                                        </div>
                                                    )}


                                                    {Number(
                                                        spot?.rating
                                                    ) > 0 && (
                                                            <div
                                                                className="nt-result-detail"
                                                            >

                                                                <Star
                                                                    size={
                                                                        15
                                                                    }
                                                                    fill="currentColor"
                                                                />

                                                                <span>

                                                                    {Number(
                                                                        spot.rating
                                                                    ).toFixed(
                                                                        1
                                                                    )}

                                                                    {Number(
                                                                        spot?.review_count
                                                                    ) >
                                                                        0 && (
                                                                            <>
                                                                                {" "}
                                                                                (
                                                                                {
                                                                                    spot.review_count
                                                                                }
                                                                                )
                                                                            </>
                                                                        )}

                                                                </span>

                                                            </div>
                                                        )}

                                                </div>


                                                {/* BOTTOM STATUS */}

                                                <div
                                                    className="nt-result-card-bottom"
                                                >

                                                    <div>

                                                        {open ===
                                                            true ? (

                                                            <span className="nt-open-status">

                                                                <span className="nt-status-dot" />

                                                                {t(
                                                                    "open"
                                                                )}

                                                            </span>

                                                        ) : open ===
                                                            false ? (

                                                            <span className="nt-closed-status">

                                                                <span className="nt-status-dot" />

                                                                {t(
                                                                    "closed"
                                                                )}

                                                            </span>

                                                        ) : (

                                                            <span className="nt-neutral-status">

                                                                <Clock3
                                                                    size={
                                                                        14
                                                                    }
                                                                />

                                                                {t(
                                                                    "hoursNotAvailable"
                                                                )}

                                                            </span>

                                                        )}

                                                    </div>


                                                    {hasMatchScore && (
                                                        <span
                                                            className="nt-match-score"
                                                        >

                                                            <Sparkles
                                                                size={
                                                                    13
                                                                }
                                                            />

                                                            {Math.round(
                                                                matchScore
                                                            )}
                                                            %
                                                            {t(
                                                                "match"
                                                            )}

                                                        </span>
                                                    )}

                                                </div>

                                            </article>
                                        );
                                    }
                                )
                            )}

                        </section>

                    ) : (

                        /* =================================================
                           MAP
                        ================================================== */

                        <section
                            className="nt-results-map"
                        >

                            <div
                                className="nt-map-placeholder"
                            >

                                <MapPin
                                    size={32}
                                />

                                <h2>
                                    {t(
                                        "mapView"
                                    )}
                                </h2>

                                <p>
                                    {t(
                                        "mapComingSoon"
                                    )}
                                </p>


                                <button
                                    type="button"
                                    className="nt-button-secondary"
                                    onClick={() =>
                                        setView(
                                            "list"
                                        )
                                    }
                                >

                                    <ArrowLeft
                                        size={16}
                                    />

                                    {t(
                                        "listView"
                                    )}

                                </button>

                            </div>

                        </section>
                    )}


                    {/* =================================================
                        BOTTOM ACTION
                    ================================================== */}

                    <div
                        style={{
                            marginTop:
                                "24px",

                            display:
                                "flex",

                            justifyContent:
                                "center",
                        }}
                    >

                        <button
                            type="button"
                            className="nt-button-secondary"
                            onClick={() =>
                                window.location.href =
                                "/find"
                            }
                        >

                            <Search
                                size={17}
                            />

                            <span>
                                {t(
                                    "newSearch"
                                )}
                            </span>

                        </button>

                    </div>


                    {/* =================================================
                        SEARCH ACCESS INFO
                    ================================================== */}

                    {search.accessExpiresAt && (
                        <div
                            style={{
                                marginTop:
                                    "16px",

                                textAlign:
                                    "center",

                                color:
                                    "var(--nt-muted)",

                                fontSize:
                                    "0.75rem",
                            }}
                        >
                            {t(
                                "accessActive"
                            )}
                        </div>
                    )}

                </div>

            </main>

        </AppShell>
    );
}