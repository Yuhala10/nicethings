import { useEffect, useState } from "react";
import {
    ArrowRight,
    LocateFixed,
    MapPin,
    Navigation,
    Search,
    Sparkles,
    Users,
} from "lucide-react";

import AppShell from "../components/layout/AppShell";
import { getCurrentLocation } from "../lib/location";
import { NICE_THINGS } from "../lib/constants";

export default function FindPage() {
    const [language, setLanguage] =
        useState("en");

    const [visitorId, setVisitorId] =
        useState("");

    const [locationMode, setLocationMode] =
        useState("area");

    const [locationText, setLocationText] =
        useState("");

    const [coordinates, setCoordinates] =
        useState(null);

    const [budget, setBudget] =
        useState(2000);

    const [customBudget, setCustomBudget] =
        useState("");

    const [people, setPeople] =
        useState(1);

    const [category, setCategory] =
        useState("");

    const [loadingLocation, setLoadingLocation] =
        useState(false);

    const [searching, setSearching] =
        useState(false);

    const [error, setError] =
        useState("");

    const french =
        language === "fr";

    useEffect(() => {
        let id =
            localStorage.getItem(
                "nicethings_visitor_id"
            );

        if (!id) {
            id =
                crypto.randomUUID();

            localStorage.setItem(
                "nicethings_visitor_id",
                id
            );
        }

        setVisitorId(id);

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
    }, []);

    function changeLanguage(value) {
        setLanguage(value);

        localStorage.setItem(
            "nicethings_language",
            value
        );
    }

    async function useMyLocation() {
        setError("");
        setLoadingLocation(true);

        try {
            const location =
                await getCurrentLocation();

            setCoordinates(
                location
            );

            setLocationMode(
                "gps"
            );

            setLocationText(
                french
                    ? "Ma position actuelle"
                    : "My current location"
            );
        } catch (error) {
            console.error(
                error
            );

            setError(
                french
                    ? "Nous n'avons pas pu accéder à votre position. Vous pouvez rechercher un quartier à la place."
                    : "We couldn't access your location. You can search for an area instead."
            );

            setLocationMode(
                "area"
            );
        } finally {
            setLoadingLocation(
                false
            );
        }
    }

    function getFinalBudget() {
        if (
            customBudget &&
            Number(
                customBudget
            ) > 0
        ) {
            return Number(
                customBudget
            );
        }

        return Number(
            budget
        );
    }

    async function handleSearch(
        event
    ) {
        event.preventDefault();

        setError("");

        if (!visitorId) {
            setError(
                french
                    ? "Votre session n'est pas encore prête."
                    : "Your session is not ready yet."
            );

            return;
        }

        if (
            locationMode === "area" &&
            !locationText.trim()
        ) {
            setError(
                french
                    ? "Indiquez un quartier ou utilisez votre position."
                    : "Tell us an area or use your current location."
            );

            return;
        }

        const finalBudget =
            getFinalBudget();

        if (
            !finalBudget ||
            finalBudget <= 0
        ) {
            setError(
                french
                    ? "Choisissez un budget."
                    : "Choose a budget."
            );

            return;
        }

        setSearching(true);

        try {
            const response =
                await fetch(
                    "/api/search",
                    {
                        method: "POST",
                        headers: {
                            "Content-Type":
                                "application/json",
                        },
                        body: JSON.stringify({
                            visitorId,

                            latitude:
                                coordinates?.latitude ??
                                null,

                            longitude:
                                coordinates?.longitude ??
                                null,

                            locationText:
                                locationText.trim() ||
                                null,

                            budget:
                                finalBudget,

                            people,

                            category:
                                category ||
                                null,

                            language,
                        }),
                    }
                );

            const data =
                await response.json();

            if (
                response.status ===
                403 &&
                data.accessRequired
            ) {
                window.location.href =
                    "/access";

                return;
            }

            if (!response.ok) {
                throw new Error(
                    data.error ||
                    "Search failed."
                );
            }

            sessionStorage.setItem(
                "nicethings_search",
                JSON.stringify({
                    searchId:
                        data.searchId,

                    results:
                        data.results,

                    accessExpiresAt:
                        data.accessExpiresAt,

                    locationText:
                        locationText.trim(),

                    latitude:
                        coordinates?.latitude ??
                        null,

                    longitude:
                        coordinates?.longitude ??
                        null,

                    budget:
                        finalBudget,

                    people,

                    category:
                        category ||
                        null,

                    language,
                })
            );

            window.location.href =
                "/results";
        } catch (error) {
            console.error(
                error
            );

            setError(
                french
                    ? "Une erreur est survenue. Réessayez."
                    : "Something went wrong. Please try again."
            );
        } finally {
            setSearching(
                false
            );
        }
    }

    return (
        <AppShell>

            <main className="nt-find-page">

                <section className="nt-find-shell">

                    {/* =========================================
                        TOP BAR
                    ========================================== */}

                    <header className="nt-find-header">

                        <div className="nt-find-brand">
                            <Sparkles
                                size={17}
                            />

                            <span>
                                NiceThings
                            </span>
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
                        HERO
                    ========================================== */}

                    <section className="nt-find-hero">

                        <div className="nt-find-hero-orb orb-one" />
                        <div className="nt-find-hero-orb orb-two" />

                        <div className="nt-find-eyebrow">
                            <Sparkles
                                size={14}
                            />

                            {french
                                ? "Votre découverte commence ici"
                                : "Your discovery starts here"}
                        </div>

                        <h1>
                            {french ? (
                                <>
                                    Trouvez quelque
                                    chose de{" "}
                                    <span>
                                        vraiment bien.
                                    </span>
                                </>
                            ) : (
                                <>
                                    Find something{" "}
                                    <span>
                                        genuinely nice.
                                    </span>
                                </>
                            )}
                        </h1>

                        <p>
                            {french
                                ? "Dites-nous où vous êtes, votre budget et ce qui vous ferait plaisir."
                                : "Tell us where you are, what you want to spend, and what sounds good."}
                        </p>

                    </section>


                    {/* =========================================
                        SEARCH FORM
                    ========================================== */}

                    <form
                        className="nt-discovery-form"
                        onSubmit={
                            handleSearch
                        }
                    >

                        {/* LOCATION */}

                        <DiscoverySection
                            number="01"
                            title={
                                french
                                    ? "Où êtes-vous ?"
                                    : "Where are you?"
                            }
                            subtitle={
                                french
                                    ? "Nous trouverons les meilleurs spots autour de vous."
                                    : "We'll find the best spots around you."
                            }
                        >

                            <div className="nt-location-toggle">

                                <button
                                    type="button"
                                    className={
                                        locationMode ===
                                            "gps"
                                            ? "active"
                                            : ""
                                    }
                                    onClick={
                                        useMyLocation
                                    }
                                >
                                    <LocateFixed
                                        size={17}
                                    />

                                    {loadingLocation
                                        ? french
                                            ? "Localisation..."
                                            : "Locating..."
                                        : french
                                            ? "Ma position"
                                            : "My location"}
                                </button>

                                <button
                                    type="button"
                                    className={
                                        locationMode ===
                                            "area"
                                            ? "active"
                                            : ""
                                    }
                                    onClick={() =>
                                        setLocationMode(
                                            "area"
                                        )
                                    }
                                >
                                    <Search
                                        size={17}
                                    />

                                    {french
                                        ? "Rechercher un quartier"
                                        : "Search an area"}
                                </button>

                            </div>

                            {locationMode ===
                                "area" && (
                                    <div className="nt-search-input-wrap">
                                        <MapPin
                                            size={18}
                                        />

                                        <input
                                            value={
                                                locationText
                                            }
                                            onChange={(
                                                event
                                            ) =>
                                                setLocationText(
                                                    event
                                                        .target
                                                        .value
                                                )
                                            }
                                            placeholder={
                                                french
                                                    ? "Ex. Bastos, Mvan, Essos..."
                                                    : "e.g. Bastos, Mvan, Essos..."
                                            }
                                        />
                                    </div>
                                )}

                            {locationMode ===
                                "gps" &&
                                coordinates && (
                                    <div className="nt-location-confirmed">
                                        <Navigation
                                            size={16}
                                        />

                                        <span>
                                            {french
                                                ? "Position actuelle utilisée"
                                                : "Current location will be used"}
                                        </span>

                                        <span>
                                            ✓
                                        </span>
                                    </div>
                                )}

                        </DiscoverySection>


                        {/* BUDGET */}

                        <DiscoverySection
                            number="02"
                            title={
                                french
                                    ? "Quel est votre budget ?"
                                    : "What's your budget?"
                            }
                            subtitle={
                                french
                                    ? "Nous privilégions les endroits qui correspondent vraiment à votre budget."
                                    : "We'll prioritize places that genuinely fit your budget."
                            }
                        >

                            <div className="nt-budget-grid">

                                {NICE_THINGS.budgets.map(
                                    (
                                        value
                                    ) => (
                                        <button
                                            type="button"
                                            key={
                                                value
                                            }
                                            className={
                                                budget ===
                                                    value &&
                                                    !customBudget
                                                    ? "active"
                                                    : ""
                                            }
                                            onClick={() => {
                                                setBudget(
                                                    value
                                                );

                                                setCustomBudget(
                                                    ""
                                                );
                                            }}
                                        >
                                            {value.toLocaleString()}
                                        </button>
                                    )
                                )}

                            </div>

                            <div className="nt-custom-budget">
                                <span>
                                    FCFA
                                </span>

                                <input
                                    type="number"
                                    min="100"
                                    value={
                                        customBudget
                                    }
                                    onChange={(
                                        event
                                    ) => {
                                        setCustomBudget(
                                            event
                                                .target
                                                .value
                                        );

                                        setBudget(
                                            null
                                        );
                                    }}
                                    placeholder={
                                        french
                                            ? "Autre montant"
                                            : "Another amount"
                                    }
                                />
                            </div>

                        </DiscoverySection>


                        {/* PEOPLE */}

                        <DiscoverySection
                            number="03"
                            title={
                                french
                                    ? "Pour combien de personnes ?"
                                    : "How many people?"
                            }
                            subtitle={
                                french
                                    ? "Le budget sera interprété selon le nombre de personnes."
                                    : "Your budget will be interpreted according to the group size."
                            }
                        >

                            <div className="nt-people-grid">

                                {NICE_THINGS.people.map(
                                    (
                                        value
                                    ) => (
                                        <button
                                            type="button"
                                            key={
                                                value
                                            }
                                            className={
                                                people ===
                                                    value
                                                    ? "active"
                                                    : ""
                                            }
                                            onClick={() =>
                                                setPeople(
                                                    value
                                                )
                                            }
                                        >
                                            <Users
                                                size={17}
                                            />

                                            {value ===
                                                4
                                                ? "4+"
                                                : value}
                                        </button>
                                    )
                                )}

                            </div>

                        </DiscoverySection>


                        {/* CATEGORY */}

                        <DiscoverySection
                            number="04"
                            title={
                                french
                                    ? "Qu'est-ce qui vous ferait plaisir ?"
                                    : "What are you in the mood for?"
                            }
                            subtitle={
                                french
                                    ? "Facultatif — nous pouvons aussi vous surprendre."
                                    : "Optional — we can also surprise you."
                            }
                        >

                            <div className="nt-category-grid">

                                {NICE_THINGS.categories.map(
                                    (
                                        item
                                    ) => (
                                        <button
                                            type="button"
                                            key={
                                                item.id
                                            }
                                            className={
                                                category ===
                                                    item.id
                                                    ? "active"
                                                    : ""
                                            }
                                            onClick={() =>
                                                setCategory(
                                                    category ===
                                                        item.id
                                                        ? ""
                                                        : item.id
                                                )
                                            }
                                        >
                                            <span>
                                                {
                                                    item.icon
                                                }
                                            </span>

                                            <strong>
                                                {
                                                    french
                                                        ? item.fr
                                                        : item.en
                                                }
                                            </strong>
                                        </button>
                                    )
                                )}

                            </div>

                        </DiscoverySection>


                        {/* ERROR */}

                        {error && (
                            <div className="nt-discovery-error">
                                {error}
                            </div>
                        )}


                        {/* SEARCH */}

                        <button
                            type="submit"
                            className="nt-discovery-submit"
                            disabled={
                                searching
                            }
                        >

                            <span>
                                {searching
                                    ? french
                                        ? "Recherche en cours..."
                                        : "Finding your spots..."
                                    : french
                                        ? "Trouver mon spot"
                                        : "Find my spot"}
                            </span>

                            {searching ? (
                                <span className="nt-loading-dot">
                                    •••
                                </span>
                            ) : (
                                <ArrowRight
                                    size={20}
                                />
                            )}

                        </button>

                    </form>


                    <div className="nt-find-trust">
                        <span>
                            ✦
                        </span>

                        {french
                            ? "Des recommandations pensées pour vous."
                            : "Recommendations thoughtfully matched to you."}
                    </div>

                </section>

            </main>
        </AppShell>
    );
}


/* ============================================================
   DISCOVERY SECTION
============================================================ */

function DiscoverySection({
    number,
    title,
    subtitle,
    children,
}) {
    return (
        <section className="nt-discovery-section">

            <div className="nt-discovery-section-heading">

                <span className="nt-section-number">
                    {number}
                </span>

                <div>
                    <h2>
                        {title}
                    </h2>

                    <p>
                        {subtitle}
                    </p>
                </div>

            </div>

            <div>
                {children}
            </div>

        </section>
    );
}