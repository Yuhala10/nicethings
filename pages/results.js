import {
    useEffect,
    useMemo,
    useState,
} from "react";

import dynamic from "next/dynamic";

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

/* =========================================================
   MAP
========================================================= */

const NiceThingsMap =
    dynamic(
        () =>
            import(
                "../components/NiceThingsMap"
            ),
        {
            ssr: false,

            loading: () => (
                <div
                    className="nt-map-placeholder"
                    style={{
                        minHeight:
                            "480px",

                        display:
                            "flex",

                        alignItems:
                            "center",

                        justifyContent:
                            "center",
                    }}
                >
                    Loading map...
                </div>
            ),
        }
    );

/* =========================================================
   RESULTS PAGE
========================================================= */

export default function ResultsPage() {
    const {
        language,
        setLanguage,
        t,
    } = useLanguage();

    /* =====================================================
       SEARCH
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
       LIVE LOCATION
    ====================================================== */

    const [
        liveLocation,
        setLiveLocation,
    ] = useState(null);

    const [
        followingUser,
        setFollowingUser,
    ] = useState(false);

    const [
        locationError,
        setLocationError,
    ] = useState("");

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
                JSON.parse(raw);

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
            setLoading(
                false
            );
        }
    }, [t]);

    /* =====================================================
       LIVE GPS TRACKING
    ====================================================== */

    useEffect(() => {
        if (
            !followingUser
        ) {
            return;
        }

        if (
            typeof window ===
            "undefined" ||
            !navigator.geolocation
        ) {
            setLocationError(
                language === "fr"
                    ? "La géolocalisation n'est pas disponible sur cet appareil."
                    : "Location is not available on this device."
            );

            setFollowingUser(
                false
            );

            return;
        }

        setLocationError(
            ""
        );

        const watchId =
            navigator.geolocation.watchPosition(
                position => {
                    setLiveLocation({
                        latitude:
                            position
                                .coords
                                .latitude,

                        longitude:
                            position
                                .coords
                                .longitude,

                        accuracy:
                            position
                                .coords
                                .accuracy,
                    });

                    setLocationError(
                        ""
                    );
                },

                locationWatchError => {
                    console.error(
                        "Location tracking:",
                        locationWatchError
                    );

                    if (
                        locationWatchError.code ===
                        locationWatchError.PERMISSION_DENIED
                    ) {
                        setLocationError(
                            language ===
                                "fr"
                                ? "L'accès à votre position a été refusé."
                                : "Location permission was denied."
                        );
                    } else if (
                        locationWatchError.code ===
                        locationWatchError.POSITION_UNAVAILABLE
                    ) {
                        setLocationError(
                            language ===
                                "fr"
                                ? "Votre position est temporairement indisponible."
                                : "Your location is temporarily unavailable."
                        );
                    } else if (
                        locationWatchError.code ===
                        locationWatchError.TIMEOUT
                    ) {
                        setLocationError(
                            language ===
                                "fr"
                                ? "La localisation prend trop de temps. Veuillez réessayer."
                                : "Getting your location is taking too long. Please try again."
                        );
                    }
                },

                {
                    enableHighAccuracy:
                        true,

                    maximumAge:
                        5000,

                    timeout:
                        20000,
                }
            );

        return () => {
            navigator.geolocation.clearWatch(
                watchId
            );
        };
    }, [
        followingUser,
        language,
    ]);

    /* =====================================================
       FOLLOW CONTROLS
    ====================================================== */

    function startFollowingUser() {
        if (
            typeof window ===
            "undefined" ||
            !navigator.geolocation
        ) {
            setLocationError(
                language === "fr"
                    ? "La géolocalisation n'est pas disponible."
                    : "Location is not available on this device."
            );

            return;
        }

        setLocationError(
            ""
        );

        setFollowingUser(
            true
        );
    }

    function stopFollowingUser() {
        setFollowingUser(
            false
        );
    }

    /* =====================================================
       CATEGORY
    ====================================================== */

    function getCategoryName(
        categoryId
    ) {
        if (
            !categoryId
        ) {
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
       BUDGET
    ====================================================== */

    function getBudgetStatus(
        spot
    ) {
        return (
            spot?.match
                ?.budgetStatus ||
            null
        );
    }

    function getBudgetLabel(
        spot
    ) {
        const status =
            getBudgetStatus(
                spot
            );

        if (
            !search?.budget
        ) {
            return null;
        }

        if (
            status ===
            "WITHIN_BUDGET"
        ) {
            return language ===
                "fr"
                ? "Dans votre budget"
                : "Within your budget";
        }

        if (
            status ===
            "NEAR_BUDGET"
        ) {
            return language ===
                "fr"
                ? "Proche de votre budget"
                : "Close to your budget";
        }

        if (
            status ===
            "ABOVE_BUDGET"
        ) {
            return language ===
                "fr"
                ? "Au-dessus de votre budget"
                : "Above your budget";
        }

        if (
            status ===
            "UNKNOWN"
        ) {
            return language ===
                "fr"
                ? "Prix non vérifié"
                : "Price information unavailable";
        }

        return null;
    }

    function getBudgetClass(
        spot
    ) {
        const status =
            getBudgetStatus(
                spot
            );

        if (
            status ===
            "WITHIN_BUDGET"
        ) {
            return "within";
        }

        if (
            status ===
            "NEAR_BUDGET"
        ) {
            return "near";
        }

        if (
            status ===
            "ABOVE_BUDGET"
        ) {
            return "above";
        }

        return "unknown";
    }

    /* =====================================================
       RECOMMENDATION
    ====================================================== */

    function getRecommendation(
        spot
    ) {
        const recommendation =
            spot?.match
                ?.recommendation;

        if (
            recommendation
        ) {
            if (
                language ===
                "fr" &&
                spot?.match
                    ?.budgetStatus ===
                "WITHIN_BUDGET"
            ) {
                const distanceStatus =
                    spot?.match
                        ?.distanceStatus;

                if (
                    distanceStatus ===
                    "VERY_CLOSE"
                ) {
                    return "Excellent choix — proche de vous et dans votre budget.";
                }

                if (
                    distanceStatus ===
                    "NEARBY"
                ) {
                    return "Très bon choix — proche de vous et dans votre budget.";
                }

                if (
                    distanceStatus ===
                    "MODERATE_DISTANCE"
                ) {
                    return "Bon choix — dans votre budget, mais un peu plus loin.";
                }

                if (
                    distanceStatus ===
                    "FAR"
                ) {
                    return "Dans votre budget, mais assez loin.";
                }
            }

            return recommendation;
        }

        const status =
            getBudgetStatus(
                spot
            );

        const distanceStatus =
            spot?.match
                ?.distanceStatus;

        if (
            status ===
            "WITHIN_BUDGET"
        ) {
            if (
                distanceStatus ===
                "VERY_CLOSE"
            ) {
                return language ===
                    "fr"
                    ? "Excellent choix — proche et dans votre budget."
                    : "Excellent match — close to you and within your budget.";
            }

            if (
                distanceStatus ===
                "NEARBY"
            ) {
                return language ===
                    "fr"
                    ? "Très bon choix — proche et dans votre budget."
                    : "Great match — nearby and within your budget.";
            }

            if (
                distanceStatus ===
                "FAR"
            ) {
                return language ===
                    "fr"
                    ? "Dans votre budget, mais loin."
                    : "Within your budget, but far away.";
            }

            return language ===
                "fr"
                ? "Dans votre budget."
                : "Within your budget.";
        }

        if (
            status ===
            "NEAR_BUDGET"
        ) {
            return language ===
                "fr"
                ? "Proche de votre budget."
                : "Close to your budget.";
        }

        if (
            status ===
            "ABOVE_BUDGET"
        ) {
            return language ===
                "fr"
                ? "Au-dessus de votre budget."
                : "Above your requested budget.";
        }

        return null;
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
       RESULTS
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

    const alternatives =
        useMemo(() => {
            if (
                !search ||
                !Array.isArray(
                    search.alternatives
                )
            ) {
                return [];
            }

            return [
                ...search.alternatives,
            ];
        }, [search]);

    /* =====================================================
       MAP LOCATION
    ====================================================== */

    const mapLocation =
        useMemo(() => {
            if (
                liveLocation
            ) {
                return {
                    latitude:
                        Number(
                            liveLocation.latitude
                        ),

                    longitude:
                        Number(
                            liveLocation.longitude
                        ),

                    accuracy:
                        liveLocation.accuracy,
                };
            }

            if (
                search &&
                Number.isFinite(
                    Number(
                        search.latitude
                    )
                ) &&
                Number.isFinite(
                    Number(
                        search.longitude
                    )
                )
            ) {
                return {
                    latitude:
                        Number(
                            search.latitude
                        ),

                    longitude:
                        Number(
                            search.longitude
                        ),
                };
            }

            return null;
        }, [
            liveLocation,
            search,
        ]);

    /* =====================================================
       RESULT CARD
    ====================================================== */

    function renderResultCard(
        spot,
        index,
        isAlternative = false
    ) {
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

        const budgetLabel =
            getBudgetLabel(
                spot
            );

        const budgetClass =
            getBudgetClass(
                spot
            );

        const recommendation =
            getRecommendation(
                spot
            );

        return (
            <article
                key={
                    spot?.id ||
                    index
                }
                className={`nt-result-card ${isAlternative
                        ? "nt-result-card-alternative"
                        : ""
                    }`}
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
                <div className="nt-result-card-top">
                    <div className="nt-result-category-icon">
                        🍽️
                    </div>

                    <div className="nt-result-card-title">
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
                                <span className="nt-verified-badge">
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
                        size={
                            18
                        }
                        className="nt-result-arrow"
                    />
                </div>

                <div className="nt-result-details">
                    <div className="nt-result-detail">
                        <MapPin
                            size={
                                15
                            }
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

                    <div className="nt-result-detail">
                        <span className="nt-price-icon">
                            FCFA
                        </span>

                        <span>
                            {formatPrice(
                                spot
                            )}
                        </span>
                    </div>

                    {distance && (
                        <div className="nt-result-detail">
                            <Navigation
                                size={
                                    15
                                }
                            />

                            <span>
                                {distance}
                            </span>
                        </div>
                    )}

                    {Number(
                        spot?.rating
                    ) > 0 && (
                            <div className="nt-result-detail">
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

                {(budgetLabel ||
                    recommendation ||
                    hasMatchScore) && (
                        <div
                            className="nt-result-smart-info"
                            style={{
                                marginTop:
                                    "14px",
                                padding:
                                    "12px 14px",
                                borderRadius:
                                    "14px",
                                background:
                                    isAlternative
                                        ? "rgba(180, 80, 60, 0.07)"
                                        : "rgba(240, 125, 40, 0.07)",
                                border:
                                    "1px solid rgba(0,0,0,0.06)",
                            }}
                        >
                            <div
                                style={{
                                    display:
                                        "flex",
                                    alignItems:
                                        "center",
                                    justifyContent:
                                        "space-between",
                                    gap:
                                        "10px",
                                    flexWrap:
                                        "wrap",
                                }}
                            >
                                {hasMatchScore && (
                                    <span className="nt-match-score">
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

                                {budgetLabel && (
                                    <span
                                        className={`nt-budget-status nt-budget-status-${budgetClass}`}
                                        style={{
                                            fontSize:
                                                "0.78rem",
                                            fontWeight:
                                                700,
                                        }}
                                    >
                                        {budgetClass ===
                                            "within" &&
                                            "✓ "}

                                        {budgetClass ===
                                            "above" &&
                                            "⚠ "}

                                        {budgetLabel}
                                    </span>
                                )}
                            </div>

                            {recommendation && (
                                <p
                                    style={{
                                        margin:
                                            "7px 0 0",
                                        fontSize:
                                            "0.8rem",
                                        lineHeight:
                                            1.45,
                                    }}
                                >
                                    {recommendation}
                                </p>
                            )}
                        </div>
                    )}

                <div className="nt-result-card-bottom">
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
                </div>
            </article>
        );
    }

    /* =====================================================
       LOADING
    ====================================================== */

    if (loading) {
        return (
            <AppShell>
                <main className="nt-results-page">
                    <div className="nt-results-shell">
                        <div className="nt-results-loading">
                            <span className="nt-loading-spinner" />

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
                                size={
                                    17
                                }
                            />

                            {t(
                                "back"
                            )}
                        </button>

                        <div className="nt-results-empty">
                            <Sparkles
                                size={
                                    28
                                }
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
                                    size={
                                        17
                                    }
                                />

                                {t(
                                    "newSearch"
                                )}

                                <ArrowRight
                                    size={
                                        17
                                    }
                                />
                            </button>
                        </div>
                    </div>
                </main>
            </AppShell>
        );
    }

    /* =====================================================
       PAGE
    ====================================================== */

    return (
        <AppShell>
            <main className="nt-results-page">
                <div className="nt-results-shell">

                    {/* TOP BAR */}

                    <div className="nt-results-topbar">
                        <button
                            type="button"
                            className="nt-button-secondary"
                            onClick={() =>
                                window.history.back()
                            }
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

                    {/* HEADER */}

                    <header className="nt-results-header">
                        <div className="nt-results-eyebrow">
                            <Sparkles
                                size={
                                    14
                                }
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

                    {/* SEARCH SUMMARY */}

                    <section className="nt-results-summary">
                        <div className="nt-results-summary-item">
                            <MapPin
                                size={
                                    16
                                }
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

                        <div className="nt-results-summary-item">
                            <span className="nt-results-summary-symbol">
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

                        <div className="nt-results-summary-item">
                            <span className="nt-results-summary-symbol">
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
                                    ) ===
                                        1
                                        ? t(
                                            "onePerson"
                                        )
                                        : `${search.people} ${t(
                                            "people"
                                        )}`}
                                </strong>
                            </div>
                        </div>

                        <div className="nt-results-summary-item">
                            <Sparkles
                                size={
                                    16
                                }
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

                    {/* TOOLBAR */}

                    <div className="nt-results-toolbar">
                        <div>
                            <strong>
                                {
                                    results.length
                                }
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

                        <div className="nt-results-view-switch">
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
                                    size={
                                        15
                                    }
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
                                    size={
                                        15
                                    }
                                />

                                {t(
                                    "mapView"
                                )}
                            </button>
                        </div>
                    </div>

                    {/* =================================================
                       LIST
                    ================================================== */}

                    {view ===
                        "list" ? (
                        <section className="nt-results-list">

                            {results.length ===
                                0 ? (
                                <div className="nt-results-empty">
                                    <Sparkles
                                        size={
                                            28
                                        }
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
                                            size={
                                                17
                                            }
                                        />

                                        {t(
                                            "newSearch"
                                        )}

                                        <ArrowRight
                                            size={
                                                17
                                            }
                                        />
                                    </button>
                                </div>
                            ) : (
                                results.map(
                                    (
                                        spot,
                                        index
                                    ) =>
                                        renderResultCard(
                                            spot,
                                            index,
                                            false
                                        )
                                )
                            )}

                            {/* ALTERNATIVES */}

                            {alternatives.length >
                                0 && (
                                    <section
                                        style={{
                                            marginTop:
                                                "30px",
                                        }}
                                    >
                                        <div
                                            style={{
                                                marginBottom:
                                                    "14px",
                                            }}
                                        >
                                            <h2
                                                style={{
                                                    margin:
                                                        0,
                                                }}
                                            >
                                                {language ===
                                                    "fr"
                                                    ? "Autres options à proximité"
                                                    : "Other nearby options"}
                                            </h2>

                                            <p
                                                style={{
                                                    margin:
                                                        "6px 0 0",
                                                    color:
                                                        "var(--nt-muted)",
                                                    fontSize:
                                                        "0.86rem",
                                                }}
                                            >
                                                {language ===
                                                    "fr"
                                                    ? "Ces endroits sont pertinents, mais leur prix dépasse votre budget."
                                                    : "These places are relevant, but their price is above your budget."}
                                            </p>
                                        </div>

                                        {alternatives.map(
                                            (
                                                spot,
                                                index
                                            ) =>
                                                renderResultCard(
                                                    spot,
                                                    index,
                                                    true
                                                )
                                        )}
                                    </section>
                                )}
                        </section>
                    ) : (

                        /* =================================================
                           MAP
                        ================================================== */

                        <section className="nt-results-map">

                            {/* FOLLOW LOCATION CONTROLS */}

                            <div
                                style={{
                                    display:
                                        "flex",

                                    justifyContent:
                                        "space-between",

                                    alignItems:
                                        "center",

                                    gap:
                                        "10px",

                                    flexWrap:
                                        "wrap",

                                    marginBottom:
                                        "12px",
                                }}
                            >
                                <button
                                    type="button"
                                    className="nt-button-primary"
                                    onClick={
                                        followingUser
                                            ? stopFollowingUser
                                            : startFollowingUser
                                    }
                                >
                                    <Navigation
                                        size={
                                            17
                                        }
                                    />

                                    {followingUser
                                        ? language ===
                                            "fr"
                                            ? "Arrêter le suivi"
                                            : "Stop following"
                                        : language ===
                                            "fr"
                                            ? "Suivre ma position"
                                            : "Follow my location"}
                                </button>

                                {liveLocation && (
                                    <span
                                        style={{
                                            fontSize:
                                                "0.78rem",

                                            color:
                                                "var(--nt-muted)",
                                        }}
                                    >
                                        📍{" "}
                                        {language ===
                                            "fr"
                                            ? "Position en direct"
                                            : "Live location"}

                                        {liveLocation.accuracy &&
                                            ` · ±${Math.round(
                                                liveLocation.accuracy
                                            )} m`}
                                    </span>
                                )}
                            </div>

                            {locationError && (
                                <div
                                    style={{
                                        marginBottom:
                                            "12px",

                                        padding:
                                            "10px 12px",

                                        borderRadius:
                                            "12px",

                                        background:
                                            "rgba(180, 80, 60, 0.08)",

                                        fontSize:
                                            "0.82rem",
                                    }}
                                >
                                    {
                                        locationError
                                    }
                                </div>
                            )}

                            <NiceThingsMap
                                spots={[
                                    ...(search?.results ||
                                        []),

                                    ...(search?.alternatives ||
                                        []),
                                ]}
                                userLocation={
                                    mapLocation
                                }
                                followUser={
                                    followingUser
                                }
                                onSelectSpot={
                                    spot =>
                                        openSpot(
                                            spot
                                        )
                                }
                            />
                        </section>
                    )}

                    {/* NEW SEARCH */}

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
                                size={
                                    17
                                }
                            />

                            <span>
                                {t(
                                    "newSearch"
                                )}
                            </span>
                        </button>
                    </div>

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