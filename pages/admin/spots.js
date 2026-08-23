import { useEffect, useMemo, useState } from "react";

import {
    ArrowLeft,
    CheckCircle2,
    ExternalLink,
    MapPin,
    RefreshCw,
    ShieldCheck,
    Star,
} from "lucide-react";

import Link from "next/link";

import { useLanguage } from "../../lib/i18n";


export default function AdminSpots() {
    const {
        language,
        setLanguage,
    } = useLanguage();

    const french =
        language === "fr";


    const [
        spots,
        setSpots,
    ] = useState([]);

    const [
        loading,
        setLoading,
    ] = useState(true);

    const [
        refreshing,
        setRefreshing,
    ] = useState(false);

    const [
        error,
        setError,
    ] = useState("");

    const [
        search,
        setSearch,
    ] = useState("");


    /* =====================================================
       INITIAL LOAD
    ====================================================== */

    useEffect(() => {
        loadSpots();
    }, []);


    /* =====================================================
       LOAD SPOTS
    ====================================================== */

    async function loadSpots(
        silent = false
    ) {
        if (silent) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }

        setError("");


        try {
            const auth =
                await fetch(
                    "/api/admin/me",
                    {
                        method:
                            "GET",

                        credentials:
                            "include",
                    }
                );


            let authData = {};

            try {
                authData =
                    await auth.json();
            } catch {
                authData = {};
            }


            if (
                !authData.authenticated
            ) {
                window.location.replace(
                    "/admin/login"
                );

                return;
            }


            const response =
                await fetch(
                    "/api/admin/spots",
                    {
                        method:
                            "GET",

                        credentials:
                            "include",
                    }
                );


            let data = {};

            try {
                data =
                    await response.json();
            } catch {
                data = {};
            }


            if (
                response.status ===
                401
            ) {
                window.location.replace(
                    "/admin/login"
                );

                return;
            }


            if (
                !response.ok
            ) {
                throw new Error(
                    data.error ||
                    (
                        french
                            ? "Impossible de charger les spots."
                            : "Unable to load spots."
                    )
                );
            }


            setSpots(
                Array.isArray(
                    data.spots
                )
                    ? data.spots
                    : []
            );
        } catch (
        loadError
        ) {
            console.error(
                "Admin spots:",
                loadError
            );

            setError(
                loadError.message ||
                (
                    french
                        ? "Impossible de charger les spots."
                        : "Unable to load spots."
                )
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }


    /* =====================================================
       FILTER
    ====================================================== */

    const filteredSpots =
        useMemo(() => {
            const term =
                search
                    .trim()
                    .toLowerCase();


            if (!term) {
                return spots;
            }


            return spots.filter(
                spot => {
                    const searchable =
                        [
                            spot.name,
                            spot.category,
                            spot.address,
                            spot.neighborhood,
                            spot.city,
                            spot.status,
                        ]
                            .filter(Boolean)
                            .join(" ")
                            .toLowerCase();


                    return searchable.includes(
                        term
                    );
                }
            );
        }, [
            spots,
            search,
        ]);


    const approvedCount =
        spots.filter(
            spot =>
                spot.status ===
                "APPROVED"
        ).length;


    const verifiedCount =
        spots.filter(
            spot =>
                Boolean(
                    spot.verified
                )
        ).length;


    /* =====================================================
       LOADING
    ====================================================== */

    if (
        loading
    ) {
        return (
            <main
                className="nt-admin-page"
            >

                <div
                    className="nt-admin-loading"
                >

                    <RefreshCw
                        size={28}
                        className="nt-spin"
                    />

                    <p>
                        {french
                            ? "Chargement des spots..."
                            : "Loading spots..."}
                    </p>

                </div>

            </main>
        );
    }


    /* =====================================================
       PAGE
    ====================================================== */

    return (
        <main
            className="nt-admin-page"
        >

            {/* =================================================
                HEADER
            ================================================== */}

            <header
                className="nt-admin-header"
            >

                <div>

                    <Link
                        href="/admin"
                        className="nt-admin-back"
                    >

                        <ArrowLeft
                            size={16}
                        />

                        {french
                            ? "Tableau de bord"
                            : "Dashboard"}

                    </Link>


                    <div
                        className="nt-admin-eyebrow"
                    >

                        <ShieldCheck
                            size={13}
                        />

                        NiceThings Control

                    </div>


                    <h1>
                        {french
                            ? "Spots"
                            : "Spots"}
                    </h1>


                    <p>
                        {french
                            ? "Gérez et contrôlez les lieux disponibles dans NiceThings."
                            : "Manage and review places available in NiceThings."}
                    </p>

                </div>


                <div
                    className="nt-admin-header-actions"
                >

                    {/* LANGUAGE */}

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


                    {/* REFRESH */}

                    <button
                        type="button"
                        className="nt-admin-icon-button"
                        onClick={() =>
                            loadSpots(
                                true
                            )
                        }
                        disabled={
                            refreshing
                        }
                        title={
                            french
                                ? "Actualiser"
                                : "Refresh"
                        }
                    >

                        <RefreshCw
                            size={17}
                            className={
                                refreshing
                                    ? "nt-spin"
                                    : ""
                            }
                        />

                    </button>

                </div>

            </header>


            {/* =================================================
                STATS
            ================================================== */}

            <section
                className="nt-admin-stats"
            >

                <SpotStat
                    icon={
                        <MapPin
                            size={19}
                        />
                    }
                    label={
                        french
                            ? "Total"
                            : "Total"
                    }
                    value={
                        spots.length
                    }
                />


                <SpotStat
                    icon={
                        <CheckCircle2
                            size={19}
                        />
                    }
                    label={
                        french
                            ? "Approuvés"
                            : "Approved"
                    }
                    value={
                        approvedCount
                    }
                />


                <SpotStat
                    icon={
                        <ShieldCheck
                            size={19}
                        />
                    }
                    label={
                        french
                            ? "Vérifiés"
                            : "Verified"
                    }
                    value={
                        verifiedCount
                    }
                />

            </section>


            {/* =================================================
                ERROR
            ================================================== */}

            {error && (
                <div
                    className="nt-admin-error"
                    role="alert"
                >
                    {error}
                </div>
            )}


            {/* =================================================
                SPOT MANAGEMENT
            ================================================== */}

            <section
                className="nt-admin-section"
            >

                <div
                    className="nt-admin-section-header"
                >

                    <div>

                        <div
                            className="nt-admin-section-kicker"
                        >
                            {french
                                ? "BASE DE DÉCOUVERTE"
                                : "DISCOVERY DATABASE"}
                        </div>


                        <h2>
                            {french
                                ? "Lieux"
                                : "Places"}
                        </h2>


                        <p>
                            {french
                                ? "Consultez les lieux actuellement disponibles dans la base NiceThings."
                                : "Review places currently available in the NiceThings database."}
                        </p>

                    </div>

                </div>


                {/* SEARCH */}

                <div
                    className="nt-admin-search"
                >

                    <MapPin
                        size={17}
                    />


                    <input
                        type="search"
                        value={
                            search
                        }
                        onChange={event =>
                            setSearch(
                                event
                                    .target
                                    .value
                            )
                        }
                        placeholder={
                            french
                                ? "Rechercher un spot, une ville ou une catégorie..."
                                : "Search a spot, city or category..."
                        }
                    />

                </div>


                {/* EMPTY */}

                {filteredSpots.length ===
                    0 ? (
                    <div
                        className="nt-admin-empty"
                    >

                        <MapPin
                            size={28}
                        />


                        <h3>
                            {search
                                ? french
                                    ? "Aucun résultat."
                                    : "No results."
                                : french
                                    ? "Aucun spot pour le moment."
                                    : "No spots yet."}
                        </h3>


                        <p>
                            {search
                                ? french
                                    ? "Essayez une autre recherche."
                                    : "Try another search."
                                : french
                                    ? "Les lieux approuvés apparaîtront ici."
                                    : "Approved places will appear here."}
                        </p>

                    </div>
                ) : (
                    <div
                        className="nt-admin-payment-list"
                    >

                        {filteredSpots.map(
                            spot => (
                                <SpotRow
                                    key={
                                        spot.id
                                    }
                                    spot={
                                        spot
                                    }
                                    french={
                                        french
                                    }
                                />
                            )
                        )}

                    </div>
                )}

            </section>

        </main>
    );
}


/* =====================================================
   STAT
====================================================== */

function SpotStat({
    icon,
    label,
    value,
}) {
    return (
        <div
            className="nt-admin-stat"
        >

            <div
                className="nt-admin-stat-icon"
            >
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


/* =====================================================
   SPOT ROW
====================================================== */

function SpotRow({
    spot,
    french,
}) {
    const location =
        spot.address ||
        spot.neighborhood ||
        spot.city ||
        (
            french
                ? "Lieu non renseigné"
                : "Location not provided"
        );


    const hasCoordinates =
        spot.latitude !=
        null &&
        spot.longitude !=
        null;


    const mapsUrl =
        hasCoordinates
            ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                `${spot.latitude},${spot.longitude}`
            )}`
            : null;


    const price =
        spot.minimum_price !=
            null &&
            spot.maximum_price !=
            null
            ? `${Number(
                spot.minimum_price
            ).toLocaleString(
                "fr-FR"
            )}–${Number(
                spot.maximum_price
            ).toLocaleString(
                "fr-FR"
            )} FCFA`
            : (
                french
                    ? "Non vérifié"
                    : "Not verified"
            );


    return (
        <article
            className="nt-admin-payment"
        >

            {/* =================================================
                TOP
            ================================================== */}

            <div
                className="nt-admin-payment-top"
            >

                <div>

                    <div
                        className="nt-admin-payment-amount"
                    >
                        {spot.name ||
                            (
                                french
                                    ? "Spot sans nom"
                                    : "Unnamed spot"
                            )}
                    </div>


                    <div
                        className="nt-admin-payment-meta"
                    >
                        {location}
                    </div>

                </div>


                <span
                    className={`nt-admin-status ${String(
                        spot.status ||
                        ""
                    ).toLowerCase()}`}
                >
                    {spot.status ||
                        "—"}
                </span>

            </div>


            {/* =================================================
                DETAILS
            ================================================== */}

            <div
                className="nt-admin-payment-info"
            >

                <div>

                    <span>
                        {french
                            ? "Catégorie"
                            : "Category"}
                    </span>


                    <strong>
                        {spot.category ||
                            "—"}
                    </strong>

                </div>


                <div>

                    <span>
                        {french
                            ? "Prix"
                            : "Price"}
                    </span>


                    <strong>
                        {price}
                    </strong>

                </div>


                <div>

                    <span>
                        {french
                            ? "Note"
                            : "Rating"}
                    </span>


                    <strong>
                        <Star
                            size={14}
                            style={{
                                verticalAlign:
                                    "middle",
                            }}
                        />{" "}
                        {spot.rating ??
                            "0"}
                    </strong>

                </div>

            </div>


            {/* =================================================
                COORDINATES
            ================================================== */}

            {hasCoordinates && (
                <div
                    className="nt-admin-proof"
                >

                    <MapPin
                        size={16}
                    />


                    <span>
                        {spot.latitude},{" "}
                        {
                            spot.longitude
                        }
                    </span>


                    {mapsUrl && (
                        <a
                            href={
                                mapsUrl
                            }
                            target="_blank"
                            rel="noreferrer"
                            className="nt-admin-proof-link"
                        >

                            <ExternalLink
                                size={14}
                            />

                            {french
                                ? "Carte"
                                : "Map"}

                        </a>
                    )}

                </div>
            )}


            {/* =================================================
                VERIFIED
            ================================================== */}

            {spot.verified && (
                <div
                    className="nt-admin-proof"
                >

                    <CheckCircle2
                        size={16}
                    />

                    {french
                        ? "Spot vérifié par NiceThings"
                        : "NiceThings verified"}

                </div>
            )}

        </article>
    );
}