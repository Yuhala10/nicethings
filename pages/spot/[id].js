import { useEffect, useState } from "react";
import Link from "next/link";
import {
    ArrowLeft,
    ArrowRight,
    Check,
    Clock3,
    Copy,
    ExternalLink,
    MapPin,
    MessageCircle,
    Navigation,
    Share2,
    Sparkles,
    Star,
} from "lucide-react";

import AppShell from "../../components/layout/AppShell";

export default function SpotPage() {
    const [language, setLanguage] =
        useState("en");

    const [spot, setSpot] =
        useState(null);

    const [searchId, setSearchId] =
        useState(null);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    const [copied, setCopied] =
        useState(false);

    const french =
        language === "fr";

    useEffect(() => {
        const savedLanguage =
            localStorage.getItem(
                "nicethings_language"
            );

        if (
            savedLanguage === "fr" ||
            savedLanguage === "en"
        ) {
            setLanguage(
                savedLanguage
            );
        }

        loadSpot();
    }, []);

    async function loadSpot() {
        try {
            const selected =
                sessionStorage.getItem(
                    "nicethings_selected_spot"
                );

            if (selected) {
                const parsed =
                    JSON.parse(
                        selected
                    );

                if (
                    parsed?.spot
                ) {
                    setSpot(
                        parsed.spot
                    );

                    setSearchId(
                        parsed.searchId ||
                        null
                    );

                    setLoading(
                        false
                    );

                    return;
                }
            }

            const pathname =
                window.location.pathname;

            const id =
                pathname.split(
                    "/"
                ).pop();

            if (!id) {
                throw new Error(
                    "Missing spot."
                );
            }

            const response =
                await fetch(
                    `/api/spots/${id}`
                );

            const data =
                await response.json();

            if (!response.ok) {
                throw new Error(
                    data.error ||
                    "Unable to load spot."
                );
            }

            setSpot(
                data.spot
            );
        } catch (error) {
            console.error(
                error
            );

            setError(
                french
                    ? "Impossible de charger ce spot."
                    : "Unable to load this spot."
            );
        } finally {
            setLoading(
                false
            );
        }
    }

    function changeLanguage(
        value
    ) {
        setLanguage(value);

        localStorage.setItem(
            "nicethings_language",
            value
        );
    }

    function getPrice() {
        const minimum =
            Number(
                spot.minimum_price
            ) || 0;

        const maximum =
            Number(
                spot.maximum_price
            ) || 0;

        const average =
            Number(
                spot.average_price
            ) || 0;

        if (
            minimum &&
            maximum
        ) {
            return `${minimum.toLocaleString()}–${maximum.toLocaleString()} FCFA`;
        }

        if (average) {
            return `${average.toLocaleString()} FCFA`;
        }

        return french
            ? "Prix non indiqué"
            : "Price unavailable";
    }

    function getGoogleMapsUrl() {
        if (
            spot.latitude &&
            spot.longitude
        ) {
            return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                `${spot.latitude},${spot.longitude}`
            )}`;
        }

        return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
            `${spot.name}, ${spot.address || spot.city || "Yaoundé"}`
        )}`;
    }

    async function shareSpot() {
        const url =
            window.location.href;

        const shareData = {
            title:
                spot.name,

            text:
                french
                    ? `J'ai trouvé ${spot.name} sur NiceThings.`
                    : `I found ${spot.name} on NiceThings.`,

            url,
        };

        try {
            if (
                navigator.share
            ) {
                await navigator.share(
                    shareData
                );

                return;
            }

            await navigator.clipboard.writeText(
                url
            );

            setCopied(true);

            setTimeout(() => {
                setCopied(false);
            }, 2200);
        } catch (error) {
            console.error(
                error
            );
        }
    }

    function shareWhatsApp() {
        const text =
            french
                ? `Regarde ce spot que j'ai trouvé sur NiceThings : ${spot.name} ${window.location.href}`
                : `Check out this spot I found on NiceThings: ${spot.name} ${window.location.href}`;

        window.open(
            `https://wa.me/?text=${encodeURIComponent(
                text
            )}`,
            "_blank",
            "noopener,noreferrer"
        );
    }

    if (loading) {
        return (
            <AppShell>
                <main className="nt-spot-page">
                    <div className="nt-spot-loading">
                        <Sparkles
                            size={28}
                        />

                        <span>
                            {french
                                ? "Préparation du spot..."
                                : "Preparing your spot..."}
                        </span>
                    </div>
                </main>
            </AppShell>
        );
    }

    if (
        error ||
        !spot
    ) {
        return (
            <AppShell>
                <main className="nt-spot-page">
                    <div className="nt-spot-error">
                        <MapPin
                            size={30}
                        />

                        <h1>
                            {error}
                        </h1>

                        <Link
                            href="/find"
                            className="nt-spot-primary-button"
                        >
                            {french
                                ? "Rechercher un autre spot"
                                : "Find another spot"}

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
            <main className="nt-spot-page">

                <div className="nt-spot-shell">

                    {/* HEADER */}

                    <header className="nt-spot-header">

                        <Link
                            href="/results"
                            className="nt-spot-back"
                        >
                            <ArrowLeft
                                size={17}
                            />

                            <span>
                                {french
                                    ? "Résultats"
                                    : "Results"}
                            </span>
                        </Link>

                        <div className="nt-spot-brand">
                            <Sparkles
                                size={15}
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


                    {/* HERO */}

                    <section className="nt-spot-hero">

                        <div className="nt-spot-hero-background">
                            <Sparkles
                                size={45}
                            />

                            <span>
                                NiceThings
                            </span>
                        </div>

                        <div className="nt-spot-hero-overlay" />

                        <div className="nt-spot-hero-content">

                            {spot.verified && (
                                <div className="nt-spot-verified">
                                    <Check
                                        size={13}
                                    />

                                    {french
                                        ? "Spot vérifié"
                                        : "Verified spot"}
                                </div>
                            )}

                            <h1>
                                {spot.name}
                            </h1>

                            <p>
                                {spot.description ||
                                    (french
                                        ? "Un endroit qui pourrait bien devenir votre prochaine bonne découverte."
                                        : "A place that could become your next great discovery.")}
                            </p>

                        </div>

                    </section>


                    {/* QUICK FACTS */}

                    <section className="nt-spot-quick-facts">

                        <QuickFact
                            icon={
                                <Sparkles
                                    size={16}
                                />
                            }
                            label={
                                french
                                    ? "Dépense typique"
                                    : "Typical spend"
                            }
                            value={
                                getPrice()
                            }
                        />

                        <QuickFact
                            icon={
                                <Star
                                    size={16}
                                    fill="currentColor"
                                />
                            }
                            label={
                                french
                                    ? "Avis"
                                    : "Rating"
                            }
                            value={
                                spot.rating
                                    ? `${Number(
                                        spot.rating
                                    ).toFixed(
                                        1
                                    )} / 5`
                                    : french
                                        ? "Nouveau"
                                        : "New"
                            }
                        />

                        <QuickFact
                            icon={
                                <MapPin
                                    size={16}
                                />
                            }
                            label={
                                french
                                    ? "Emplacement"
                                    : "Location"
                            }
                            value={
                                spot.neighborhood ||
                                spot.city ||
                                "Yaoundé"
                            }
                        />

                    </section>


                    {/* MAIN CONTENT */}

                    <div className="nt-spot-content-grid">

                        <section className="nt-spot-main-column">

                            {/* ABOUT */}

                            <SpotSection
                                title={
                                    french
                                        ? "À propos"
                                        : "About this place"
                                }
                            >
                                <p className="nt-spot-description">
                                    {spot.description ||
                                        (french
                                            ? "Une belle adresse découverte avec NiceThings."
                                            : "A lovely place discovered through NiceThings.")}
                                </p>

                                <div className="nt-spot-category-pill">
                                    <Sparkles
                                        size={14}
                                    />

                                    {spot.category ||
                                        (french
                                            ? "Découverte"
                                            : "Discovery")}
                                </div>
                            </SpotSection>


                            {/* MENU */}

                            <SpotSection
                                title={
                                    french
                                        ? "Ce que vous pouvez manger"
                                        : "What you can get"
                                }
                            >

                                {Array.isArray(
                                    spot.menu
                                ) &&
                                    spot.menu.length >
                                    0 ? (
                                    <div className="nt-menu-list">
                                        {spot.menu.map(
                                            (
                                                item,
                                                index
                                            ) => (
                                                <div
                                                    className="nt-menu-item"
                                                    key={
                                                        item.id ||
                                                        index
                                                    }
                                                >
                                                    <div>
                                                        <strong>
                                                            {item.name}
                                                        </strong>

                                                        {item.description && (
                                                            <span>
                                                                {
                                                                    item.description
                                                                }
                                                            </span>
                                                        )}
                                                    </div>

                                                    <b>
                                                        {Number(
                                                            item.price
                                                        ).toLocaleString()}{" "}
                                                        FCFA
                                                    </b>
                                                </div>
                                            )
                                        )}
                                    </div>
                                ) : (
                                    <div className="nt-soft-empty">
                                        {french
                                            ? "Le menu détaillé sera bientôt disponible."
                                            : "A detailed menu will be available soon."}
                                    </div>
                                )}

                            </SpotSection>


                            {/* HOURS */}

                            <SpotSection
                                title={
                                    french
                                        ? "Horaires"
                                        : "Opening hours"
                                }
                            >

                                <div className="nt-hours-card">

                                    <div className="nt-hours-icon">
                                        <Clock3
                                            size={18}
                                        />
                                    </div>

                                    <div>
                                        <strong>
                                            {french
                                                ? "Horaires habituels"
                                                : "Regular hours"}
                                        </strong>

                                        <span>
                                            {spot.opening_time &&
                                                spot.closing_time
                                                ? `${spot.opening_time} — ${spot.closing_time}`
                                                : french
                                                    ? "Horaires non vérifiés"
                                                    : "Hours not verified"}
                                        </span>
                                    </div>

                                </div>

                            </SpotSection>


                            {/* LOCATION */}

                            <SpotSection
                                title={
                                    french
                                        ? "Emplacement"
                                        : "Location"
                                }
                            >

                                <div className="nt-spot-location-card">

                                    <div className="nt-location-map-placeholder">
                                        <MapPin
                                            size={28}
                                        />

                                        <span>
                                            {spot.address ||
                                                spot.neighborhood ||
                                                spot.city ||
                                                "Yaoundé"}
                                        </span>
                                    </div>

                                    <div className="nt-spot-address">
                                        <MapPin
                                            size={16}
                                        />

                                        <span>
                                            {spot.address ||
                                                spot.neighborhood ||
                                                spot.city ||
                                                "Yaoundé"}
                                        </span>
                                    </div>

                                </div>

                            </SpotSection>

                        </section>


                        {/* SIDE ACTIONS */}

                        <aside className="nt-spot-sidebar">

                            <div className="nt-spot-action-card">

                                <div className="nt-spot-action-eyebrow">
                                    <Sparkles
                                        size={13}
                                    />

                                    NiceThings
                                </div>

                                <h2>
                                    {french
                                        ? "Vous aimez ce spot ?"
                                        : "Like this spot?"}
                                </h2>

                                <p>
                                    {french
                                        ? "Ouvrez l'itinéraire et laissez votre téléphone vous guider."
                                        : "Open directions and let your phone guide you there."}
                                </p>

                                <a
                                    href={
                                        getGoogleMapsUrl()
                                    }
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="nt-spot-primary-button"
                                >
                                    <Navigation
                                        size={17}
                                    />

                                    {french
                                        ? "Y aller"
                                        : "Go there"}

                                    <ExternalLink
                                        size={14}
                                    />
                                </a>

                            </div>


                            {/* SHARE */}

                            <div className="nt-spot-share-card">

                                <div>
                                    <strong>
                                        {french
                                            ? "Partager ce spot"
                                            : "Share this spot"}
                                    </strong>

                                    <span>
                                        {french
                                            ? "Envoyez-le à vos amis."
                                            : "Send it to your friends."}
                                    </span>
                                </div>

                                <div className="nt-share-buttons">

                                    <button
                                        type="button"
                                        onClick={
                                            shareWhatsApp
                                        }
                                    >
                                        <MessageCircle
                                            size={16}
                                        />

                                        WhatsApp
                                    </button>

                                    <button
                                        type="button"
                                        onClick={
                                            shareSpot
                                        }
                                    >
                                        {copied ? (
                                            <Check
                                                size={16}
                                            />
                                        ) : (
                                            <Share2
                                                size={16}
                                            />
                                        )}

                                        {copied
                                            ? french
                                                ? "Copié"
                                                : "Copied"
                                            : french
                                                ? "Partager"
                                                : "Share"}
                                    </button>

                                </div>

                            </div>


                            {/* ARRIVAL */}

                            {searchId && (
                                <Link
                                    href={`/arrival/${searchId}`}
                                    className="nt-arrival-link"
                                >
                                    <div>
                                        <strong>
                                            {french
                                                ? "Vous êtes arrivé ?"
                                                : "Did you arrive?"}
                                        </strong>

                                        <span>
                                            {french
                                                ? "Enregistrez votre découverte."
                                                : "Record your discovery."}
                                        </span>
                                    </div>

                                    <ArrowRight
                                        size={17}
                                    />
                                </Link>
                            )}

                        </aside>

                    </div>

                </div>

            </main>
        </AppShell>
    );
}


/* ============================================================
   QUICK FACT
============================================================ */

function QuickFact({
    icon,
    label,
    value,
}) {
    return (
        <div className="nt-quick-fact">

            <div className="nt-quick-fact-icon">
                {icon}
            </div>

            <div>
                <span>
                    {label}
                </span>

                <strong>
                    {value}
                </strong>
            </div>

        </div>
    );
}


/* ============================================================
   SECTION
============================================================ */

function SpotSection({
    title,
    children,
}) {
    return (
        <section className="nt-spot-section">

            <h2>
                {title}
            </h2>

            {children}

        </section>
    );
}