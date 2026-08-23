import { useEffect, useState } from "react";
import Link from "next/link";

import {
    ArrowRight,
    Heart,
    MapPin,
    Search,
    Sparkles,
    Trash2,
} from "lucide-react";

import AppShell from "../components/layout/AppShell";
import { useLanguage } from "../lib/i18n";
import { NICE_THINGS } from "../lib/constants";


const SAVED_KEY =
    "nicethings_saved_spots";


export default function SavedPage() {
    const {
        language,
        t,
    } = useLanguage();


    const [saved, setSaved] =
        useState([]);

    const [loaded, setLoaded] =
        useState(false);


    /* =====================================================
       LOAD SAVED PLACES
    ====================================================== */

    useEffect(() => {
        try {
            const stored =
                localStorage.getItem(
                    SAVED_KEY
                );

            if (!stored) {
                setSaved([]);
                setLoaded(true);
                return;
            }

            const parsed =
                JSON.parse(
                    stored
                );

            if (
                Array.isArray(
                    parsed
                )
            ) {
                setSaved(parsed);
            } else {
                setSaved([]);
            }
        } catch (error) {
            console.error(
                "Saved places error:",
                error
            );

            setSaved([]);
        }

        setLoaded(true);
    }, []);


    /* =====================================================
       REMOVE
    ====================================================== */

    function removeSaved(id) {
        const next =
            saved.filter(
                spot =>
                    String(
                        spot.id
                    ) !==
                    String(id)
            );

        setSaved(next);

        localStorage.setItem(
            SAVED_KEY,
            JSON.stringify(next)
        );
    }


    /* =====================================================
       OPEN SPOT
    ====================================================== */

    function openSpot(spot) {
        if (!spot?.id) {
            return;
        }

        sessionStorage.setItem(
            "nicethings_selected_spot",
            JSON.stringify({
                spot,
                searchId: null,
            })
        );

        window.location.href =
            `/spot/${spot.id}`;
    }


    /* =====================================================
       CATEGORY
    ====================================================== */

    function categoryName(spot) {
        if (!spot?.category) {
            return "";
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
                    String(
                        item.id
                    ) ===
                    String(
                        spot.category
                    )
            );

        if (!category) {
            return spot.category
                .replace(
                    /-/g,
                    " "
                )
                .replace(
                    /\b\w/g,
                    letter =>
                        letter.toUpperCase()
                );
        }

        return language ===
            "fr"
            ? category.fr
            : category.en;
    }


    /* =====================================================
       PRICE
    ====================================================== */

    function priceText(spot) {
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

        const currency =
            spot.currency ||
            "XAF";


        if (
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
            average > 0
        ) {
            return `${average.toLocaleString(
                "fr-FR"
            )} ${currency}`;
        }


        if (
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
       ADDRESS
    ====================================================== */

    function addressText(spot) {
        return [
            spot.neighborhood,
            spot.address,
            spot.city,
        ]
            .filter(Boolean)
            .join(", ");
    }


    /* =====================================================
       LOADING
    ====================================================== */

    if (!loaded) {
        return (
            <AppShell>

                <main className="nt-saved-page">

                    <div className="nt-saved-shell">

                        <div className="nt-saved-loading">

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
       PAGE
    ====================================================== */

    return (
        <AppShell>

            <main className="nt-saved-page">

                <div className="nt-saved-shell">

                    {/* =================================================
                        HEADER
                    ================================================== */}

                    <section className="nt-saved-header">

                        <div className="nt-saved-eyebrow">

                            <Heart
                                size={14}
                            />

                            {t(
                                "saved"
                            )}

                        </div>


                        <h1>
                            {t(
                                "savedPlacesTitle"
                            )}
                        </h1>


                        <p>
                            {t(
                                "savedPlacesDescription"
                            )}
                        </p>

                    </section>


                    {/* =================================================
                        EMPTY
                    ================================================== */}

                    {saved.length ===
                        0 && (

                            <section
                                className="nt-saved-empty"
                            >

                                <div
                                    className="nt-saved-empty-icon"
                                >

                                    <Heart
                                        size={28}
                                    />

                                </div>


                                <Sparkles
                                    size={17}
                                />


                                <h2>
                                    {t(
                                        "nothingHere"
                                    )}
                                </h2>


                                <p>
                                    {t(
                                        "savedEmptyDescription"
                                    )}
                                </p>


                                <Link
                                    href="/find"
                                    className="nt-button-primary"
                                >

                                    <Search
                                        size={17}
                                    />

                                    {t(
                                        "findSpot"
                                    )}

                                    <ArrowRight
                                        size={17}
                                    />

                                </Link>

                            </section>
                        )}


                    {/* =================================================
                        SAVED LIST
                    ================================================== */}

                    {saved.length >
                        0 && (

                            <section
                                className="nt-saved-list"
                            >

                                <div
                                    className="nt-saved-count"
                                >

                                    {saved.length}{" "}

                                    {saved.length ===
                                        1
                                        ? t(
                                            "place"
                                        )
                                        : t(
                                            "places"
                                        )}

                                </div>


                                {saved.map(
                                    spot => (

                                        <article
                                            key={
                                                spot.id
                                            }
                                            className="nt-saved-card"
                                        >

                                            <button
                                                type="button"
                                                className="nt-saved-card-main"
                                                onClick={() =>
                                                    openSpot(
                                                        spot
                                                    )
                                                }
                                            >

                                                <div
                                                    className="nt-saved-icon"
                                                >

                                                    <span>
                                                        🍽️
                                                    </span>

                                                </div>


                                                <div
                                                    className="nt-saved-content"
                                                >

                                                    <div
                                                        className="nt-saved-title-row"
                                                    >

                                                        <h2>
                                                            {
                                                                spot.name
                                                            }
                                                        </h2>


                                                        {spot.verified && (
                                                            <span
                                                                className="nt-saved-verified"
                                                                aria-label={
                                                                    t(
                                                                        "verified"
                                                                    )
                                                                }
                                                                title={
                                                                    t(
                                                                        "verified"
                                                                    )
                                                                }
                                                            >
                                                                ✓
                                                            </span>
                                                        )}

                                                    </div>


                                                    {spot.category && (
                                                        <div
                                                            className="nt-saved-category"
                                                        >
                                                            {categoryName(
                                                                spot
                                                            )}
                                                        </div>
                                                    )}


                                                    {addressText(
                                                        spot
                                                    ) && (
                                                            <div
                                                                className="nt-saved-detail"
                                                            >

                                                                <MapPin
                                                                    size={14}
                                                                />

                                                                <span>
                                                                    {addressText(
                                                                        spot
                                                                    )}
                                                                </span>

                                                            </div>
                                                        )}


                                                    <div
                                                        className="nt-saved-price"
                                                    >
                                                        {priceText(
                                                            spot
                                                        )}
                                                    </div>

                                                </div>


                                                <ArrowRight
                                                    size={18}
                                                    className="nt-saved-arrow"
                                                />

                                            </button>


                                            <button
                                                type="button"
                                                className="nt-saved-remove"
                                                onClick={() =>
                                                    removeSaved(
                                                        spot.id
                                                    )
                                                }
                                                aria-label={
                                                    t(
                                                        "removeSaved"
                                                    )
                                                }
                                                title={
                                                    t(
                                                        "removeSaved"
                                                    )
                                                }
                                            >

                                                <Trash2
                                                    size={17}
                                                />

                                            </button>

                                        </article>

                                    )
                                )}

                            </section>
                        )}

                </div>

            </main>

        </AppShell>
    );
}