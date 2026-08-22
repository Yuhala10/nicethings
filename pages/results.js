import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
    ArrowLeft,
    ArrowRight,
    Clock3,
    Map,
    MapPin,
    Navigation,
    RefreshCw,
    Search,
    Sparkles,
    Star,
} from "lucide-react";

import AppShell from "../components/layout/AppShell";
import { formatDistance } from "../lib/distance";

export default function ResultsPage() {
    const [language, setLanguage] =
        useState("en");

    const [search, setSearch] =
        useState(null);

    const [view, setView] =
        useState("list");

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    const french =
        language === "fr";

    useEffect(() => {
        const saved =
            sessionStorage.getItem(
                "nicethings_search"
            );

        if (!saved) {
            window.location.href =
                "/find";

            return;
        }

        try {
            const parsed =
                JSON.parse(saved);

            setSearch(parsed);

            if (
                parsed.language ===
                "fr" ||
                parsed.language ===
                "en"
            ) {
                setLanguage(
                    parsed.language
                );
            }
        } catch (error) {
            console.error(error);

            setError(
                french
                    ? "Impossible de charger vos résultats."
                    : "Unable to load your results."
            );
        } finally {
            setLoading(false);
        }
    }, []);

    const results = useMemo(
        () =>
            Array.isArray(
                search?.results
            )
                ? search.results
                : [],
        [search]
    );

    function changeLanguage(
        value
    ) {
        setLanguage(value);

        localStorage.setItem(
            "nicethings_language",
            value
        );
    }

    function openSpot(
        spot
    ) {
        if (!spot?.id) {
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

    function formatPrice(
        spot
    ) {
        const minimum =
            Number(
                spot.minimum_price
            ) || 0;

        const maximum =
            Number(
                spot.maximum_price
            ) || 0;

        if (
            minimum &&
            maximum
        ) {
            return `${minimum.toLocaleString()}–${maximum.toLocaleString()} FCFA`;
        }

        const average =
            Number(
                spot.average_price
            ) || 0;

        if (average) {
            return `${average.toLocaleString()} FCFA`;
        }

        return french
            ? "Prix non indiqué"
            : "Price unavailable";
    }

    function isOpen(
        spot
    ) {
        if (
            !spot.opening_time ||
            !spot.closing_time
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
            openMinute = 0,
        ] =
            String(
                spot.opening_time
            )
                .split(":")
                .map(Number);

        const [
            closeHour,
            closeMinute = 0,
        ] =
            String(
                spot.closing_time
            )
                .split(":")
                .map(Number);

        const opening =
            openHour * 60 +
            openMinute;

        const closing =
            closeHour * 60 +
            closeMinute;

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

    if (loading) {
        return (
            <AppShell>
                <main className="nt-results-page">
                    <div className="nt-results-loading">
                        <Sparkles
                            size={27}
                        />

                        <p>
                            {french
                                ? "Nous trouvons les meilleurs spots..."
                                : "Finding your best spots..."}
                        </p>
                    </div>
                </main>
            </AppShell>
        );
    }

    if (error || !search) {
        return (
            <AppShell>
                <main className="nt-results-page">
                    <div className="nt-results-empty">
                        <Search
                            size={30}
                        />

                        <h1>
                            {french
                                ? "Vos résultats ne sont plus disponibles."
                                : "Your results are no longer available."}
                        </h1>

                        <p>
                            {error}
                        </p>

                        <Link
                            href="/find"
                            className="nt-button nt-button-primary"
                        >
                            {french
                                ? "Nouvelle recherche"
                                : "New search"}

                            <ArrowRight
                                size={17}
                            />
                        </Link>
                    </div>
                </main>
            </AppShell>
        );
    }

    return (
        <AppShell>
            <main className="nt-results-page">

                <div className="nt-results-shell">

                    {/* =========================================
                        HEADER
                    ========================================== */}

                    <header className="nt-results-header">

                        <Link
                            href="/find"
                            className="nt-results-back"
                        >
                            <ArrowLeft
                                size={17}
                            />

                            <span>
                                {french
                                    ? "Modifier"
                                    : "Change search"}
                            </span>
                        </Link>

                        <div className="nt-results-brand">
                            <Sparkles
                                size={16}
                            />

                            NiceThings
                        </div>

                        <div className="nt-language-switch">
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


                    {/* =========================================
                        SEARCH SUMMARY
                    ========================================== */}

                    <section className="nt-results-intro">

                        <div className="nt-find-eyebrow">
                            <Sparkles
                                size={13}
                            />

                            {french
                                ? "Votre sélection"
                                : "Your selection"}
                        </div>

                        <h1>
                            {results.length}{" "}
                            {french
                                ? "spots qui pourraient vous plaire."
                                : "spots that could be your kind of place."}
                        </h1>

                        <div className="nt-search-summary">

                            {search.locationText && (
                                <SummaryPill
                                    icon={
                                        <MapPin
                                            size={13}
                                        />
                                    }
                                    text={
                                        search.locationText
                                    }
                                />
                            )}

                            <SummaryPill
                                icon={
                                    <Sparkles
                                        size={13}
                                    />
                                }
                                text={`${Number(
                                    search.budget
                                ).toLocaleString()} FCFA`}
                            />

                            <SummaryPill
                                icon={
                                    <Star
                                        size={13}
                                    />
                                }
                                text={
                                    search.people ===
                                        1
                                        ? french
                                            ? "1 personne"
                                            : "1 person"
                                        : french
                                            ? `${search.people} personnes`
                                            : `${search.people} people`
                                }
                            />

                            {search.category && (
                                <SummaryPill
                                    icon={
                                        <Search
                                            size={13}
                                        />
                                    }
                                    text={
                                        search.category
                                    }
                                />
                            )}

                        </div>
                    </section>


                    {/* =========================================
                        VIEW CONTROLS
                    ========================================== */}

                    <div className="nt-results-controls">

                        <div>
                            <strong>
                                {french
                                    ? "Meilleures correspondances"
                                    : "Best matches"}
                            </strong>

                            <span>
                                {french
                                    ? "Classées pour vous"
                                    : "Ranked for you"}
                            </span>
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
                                <Search
                                    size={14}
                                />

                                {french
                                    ? "Liste"
                                    : "List"}
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
                                <Map
                                    size={14}
                                />

                                Map
                            </button>

                        </div>
                    </div>


                    {/* =========================================
                        MAP
                    ========================================== */}

                    {view === "map" && (
                        <ResultsMap
                            results={
                                results
                            }
                            latitude={
                                search.latitude
                            }
                            longitude={
                                search.longitude
                            }
                            french={
                                french
                            }
                            onSelect={
                                openSpot
                            }
                        />
                    )}


                    {/* =========================================
                        RESULTS
                    ========================================== */}

                    {view ===
                        "list" && (
                            <section className="nt-results-list">

                                {results.length ===
                                    0 ? (
                                    <div className="nt-results-empty">
                                        <MapPin
                                            size={28}
                                        />

                                        <h2>
                                            {french
                                                ? "Aucun spot ne correspond encore."
                                                : "No matching spots yet."}
                                        </h2>

                                        <p>
                                            {french
                                                ? "Essayez un budget différent ou une zone plus large."
                                                : "Try a different budget or a wider area."}
                                        </p>

                                        <Link
                                            href="/find"
                                            className="nt-button nt-button-primary"
                                        >
                                            {french
                                                ? "Nouvelle recherche"
                                                : "Try another search"}
                                        </Link>
                                    </div>
                                ) : (
                                    results.map(
                                        (
                                            spot,
                                            index
                                        ) => (
                                            <ResultCard
                                                key={
                                                    spot.id
                                                }
                                                spot={
                                                    spot
                                                }
                                                rank={
                                                    index +
                                                    1
                                                }
                                                french={
                                                    french
                                                }
                                                price={formatPrice(
                                                    spot
                                                )}
                                                open={isOpen(
                                                    spot
                                                )}
                                                onOpen={() =>
                                                    openSpot(
                                                        spot
                                                    )
                                                }
                                            />
                                        )
                                    )
                                )}

                            </section>
                        )}

                </div>
            </main>
        </AppShell>
    );
}


/* ============================================================
   RESULT CARD
============================================================ */

function ResultCard({
    spot,
    rank,
    french,
    price,
    open,
    onOpen,
}) {
    const distance =
        formatDistance(
            spot.distanceKm
        );

    const score =
        Number(
            spot.match?.score
        ) || 0;

    return (
        <article className="nt-result-card">

            <div className="nt-result-visual">

                <div className="nt-result-image-placeholder">
                    <Sparkles
                        size={27}
                    />

                    <span>
                        NiceThings
                    </span>
                </div>

                <div className="nt-result-rank">
                    #{rank}
                </div>

                {spot.verified && (
                    <div className="nt-result-verified">
                        ✓{" "}
                        {french
                            ? "Vérifié"
                            : "Verified"}
                    </div>
                )}

            </div>


            <div className="nt-result-content">

                <div className="nt-result-topline">

                    <div>
                        <h2>
                            {spot.name}
                        </h2>

                        <div className="nt-result-category">
                            {spot.category ||
                                (french
                                    ? "Spot"
                                    : "Place")}
                        </div>
                    </div>

                    <div className="nt-match-score">
                        <span>
                            {score}%
                        </span>

                        <small>
                            {french
                                ? "match"
                                : "match"}
                        </small>
                    </div>

                </div>


                {spot.description && (
                    <p className="nt-result-description">
                        {spot.description}
                    </p>
                )}


                <div className="nt-result-facts">

                    <Fact
                        icon={
                            <Sparkles
                                size={14}
                            />
                        }
                        text={
                            price
                        }
                    />

                    {distance && (
                        <Fact
                            icon={
                                <MapPin
                                    size={14}
                                />
                            }
                            text={
                                distance
                            }
                        />
                    )}

                    {spot.rating > 0 && (
                        <Fact
                            icon={
                                <Star
                                    size={14}
                                    fill="currentColor"
                                />
                            }
                            text={`${Number(
                                spot.rating
                            ).toFixed(
                                1
                            )}`}
                        />
                    )}

                    {open !== null && (
                        <Fact
                            icon={
                                <Clock3
                                    size={14}
                                />
                            }
                            text={
                                open
                                    ? french
                                        ? "Ouvert"
                                        : "Open"
                                    : french
                                        ? "Fermé"
                                        : "Closed"
                            }
                            positive={
                                open
                            }
                        />
                    )}

                </div>


                <div className="nt-result-footer">

                    <div className="nt-result-address">
                        <MapPin
                            size={14}
                        />

                        <span>
                            {spot.address ||
                                spot.neighborhood ||
                                spot.city ||
                                (french
                                    ? "Adresse disponible sur la fiche"
                                    : "Address available on profile")}
                        </span>
                    </div>

                    <button
                        type="button"
                        className="nt-result-button"
                        onClick={
                            onOpen
                        }
                    >
                        {french
                            ? "Voir"
                            : "View"}

                        <ArrowRight
                            size={16}
                        />
                    </button>

                </div>

            </div>

        </article>
    );
}


/* ============================================================
   FACT
============================================================ */

function Fact({
    icon,
    text,
    positive = false,
}) {
    return (
        <span
            className={
                positive
                    ? "nt-result-fact positive"
                    : "nt-result-fact"
            }
        >
            {icon}

            {text}
        </span>
    );
}


/* ============================================================
   SUMMARY PILL
============================================================ */

function SummaryPill({
    icon,
    text,
}) {
    return (
        <span className="nt-summary-pill">
            {icon}
            {text}
        </span>
    );
}


/* ============================================================
   MAP
============================================================ */

function ResultsMap({
    results,
    latitude,
    longitude,
    french,
    onSelect,
}) {
    const firstSpot =
        results.find(
            (spot) =>
                Number.isFinite(
                    Number(
                        spot.latitude
                    )
                ) &&
                Number.isFinite(
                    Number(
                        spot.longitude
                    )
                )
        );

    const mapLatitude =
        firstSpot?.latitude ??
        latitude ??
        3.848;

    const mapLongitude =
        firstSpot?.longitude ??
        longitude ??
        11.502;

    const mapUrl =
        `https://www.openstreetmap.org/export/embed.html?bbox=${mapLongitude - 0.035},${mapLatitude - 0.035},${mapLongitude + 0.035},${mapLatitude + 0.035}&layer=mapnik&marker=${mapLatitude},${mapLongitude}`;

    return (
        <section className="nt-results-map">

            <div className="nt-map-frame">
                <iframe
                    title="NiceThings map"
                    src={mapUrl}
                    loading="lazy"
                />

                <div className="nt-map-overlay">
                    <Navigation
                        size={15}
                    />

                    {french
                        ? "Votre zone"
                        : "Your area"}
                </div>
            </div>

            <div className="nt-map-results">

                {results
                    .slice(
                        0,
                        5
                    )
                    .map(
                        (
                            spot,
                            index
                        ) => (
                            <button
                                type="button"
                                key={
                                    spot.id
                                }
                                onClick={() =>
                                    onSelect(
                                        spot
                                    )
                                }
                            >
                                <span>
                                    {index +
                                        1}
                                </span>

                                <div>
                                    <strong>
                                        {
                                            spot.name
                                        }
                                    </strong>

                                    <small>
                                        {formatDistance(
                                            spot.distanceKm
                                        ) ||
                                            spot.neighborhood ||
                                            ""}
                                    </small>
                                </div>

                                <ArrowRight
                                    size={15}
                                />
                            </button>
                        )
                    )}

            </div>

            <p className="nt-map-note">
                <Map
                    size={13}
                />

                {french
                    ? "La navigation précise sera disponible depuis la fiche du spot."
                    : "Turn-by-turn navigation will be available from the spot profile."}
            </p>
        </section>
    );
}