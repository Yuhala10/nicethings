import { useEffect, useState } from "react";

import Link from "next/link";

import {
    ArrowLeft,
    ArrowRight,
    Check,
    Clock3,
    ExternalLink,
    MapPin,
    MessageCircle,
    Navigation,
    Phone,
    Share2,
    Sparkles,
    Star,
} from "lucide-react";

import AppShell from "../../components/layout/AppShell";
import { useLanguage } from "../../lib/i18n";
import { NICE_THINGS } from "../../lib/constants";


export default function SpotPage() {
    const {
        language,
        setLanguage,
        t,
    } = useLanguage();


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
    const [isSaved, setIsSaved] =
        useState(false);


    /* =====================================================
       LOAD SPOT
    ====================================================== */

    useEffect(() => {
        loadSpot();
    }, []);
    useEffect(() => {
        if (!spot?.id) {
            setIsSaved(false);
            return;
        }

        setIsSaved(
            checkIfSaved(
                spot
            )
        );
    }, [spot?.id]);


    async function loadSpot() {
        try {
            /*
             * First try the spot passed
             * from the Results page.
             */
            const selected =
                sessionStorage.getItem(
                    "nicethings_selected_spot"
                );


            if (selected) {
                const parsed =
                    JSON.parse(
                        selected
                    );


                /*
                 * New format:
                 *
                 * {
                 *     spot,
                 *     searchId
                 * }
                 */
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


                /*
                 * Backward compatibility:
                 *
                 * If Results stored the
                 * spot directly.
                 */
                if (
                    parsed?.id
                ) {
                    setSpot(
                        parsed
                    );

                    setLoading(
                        false
                    );

                    return;
                }
            }


            /*
             * If the spot was not passed
             * through sessionStorage,
             * get its ID from the URL.
             */
            const pathname =
                window.location.pathname;


            const id =
                pathname
                    .split("/")
                    .filter(Boolean)
                    .pop();


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
        } catch (
        loadError
        ) {
            console.error(
                "NiceThings spot error:",
                loadError
            );


            setError(
                t(
                    "spotLoadError"
                )
            );
        } finally {
            setLoading(
                false
            );
        }
    }


    /* =====================================================
       CATEGORY
    ====================================================== */

    function getCategoryName(
        categoryId
    ) {
        if (!categoryId) {
            return t(
                "discovery"
            );
        }


        const category =
            NICE_THINGS.categories?.find(
                item =>
                    item.id ===
                    categoryId
            );


        if (!category) {
            return categoryId;
        }


        return language === "fr"
            ? category.fr
            : category.en;
    }


    /* =====================================================
       PRICE
    ====================================================== */

    function getPrice() {
        if (!spot) {
            return t(
                "priceNotAvailable"
            );
        }


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
            minimum > 0 &&
            maximum > 0 &&
            minimum !== maximum
        ) {
            return `${minimum.toLocaleString(
                "fr-FR"
            )} – ${maximum.toLocaleString(
                "fr-FR"
            )} ${spot.currency ||
            "XAF"
                }`;
        }


        if (
            average > 0
        ) {
            return `${average.toLocaleString(
                "fr-FR"
            )} ${spot.currency ||
            "XAF"
                }`;
        }


        if (
            minimum > 0
        ) {
            return `${minimum.toLocaleString(
                "fr-FR"
            )} ${spot.currency ||
            "XAF"
                }`;
        }


        return t(
            "priceNotAvailable"
        );
    }


    /* =====================================================
       GOOGLE MAPS
    ====================================================== */

    function getGoogleMapsUrl() {
        if (
            !spot
        ) {
            return "#";
        }


        if (
            spot.latitude !==
            null &&
            spot.latitude !==
            undefined &&
            spot.longitude !==
            null &&
            spot.longitude !==
            undefined
        ) {
            return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                `${spot.latitude},${spot.longitude}`
            )}`;
        }


        return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
            `${spot.name}, ${spot.address ||
            spot.city ||
            NICE_THINGS.defaultCity ||
            "Yaoundé"
            }`
        )}`;
    }


    /* =====================================================
       CALL
    ====================================================== */

    function callSpot() {
        if (
            !spot?.phone
        ) {
            return;
        }


        window.location.href =
            `tel:${spot.phone}`;
    }


    /* =====================================================
       WHATSAPP
    ====================================================== */

    function openWhatsApp() {
        if (
            !spot?.whatsapp &&
            !spot?.phone
        ) {
            return;
        }


        const number =
            spot.whatsapp ||
            spot.phone;


        const cleanNumber =
            String(number)
                .replace(
                    /[^\d+]/g,
                    ""
                );


        window.open(
            `https://wa.me/${cleanNumber.replace(
                "+",
                ""
            )}`,
            "_blank",
            "noopener,noreferrer"
        );
    }


    /* =====================================================
       SHARE
    ====================================================== */

    async function shareSpot() {
        if (!spot) {
            return;
        }


        const url =
            window.location.href;


        const shareData = {
            title:
                spot.name,

            text:
                t(
                    "shareSpotText"
                ),

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


            if (
                navigator.clipboard
            ) {
                await navigator.clipboard.writeText(
                    url
                );

                setCopied(
                    true
                );


                setTimeout(() => {
                    setCopied(
                        false
                    );
                }, 2200);
            }
        } catch (
        shareError
        ) {
            console.error(
                "Share error:",
                shareError
            );
        }
    }

    /* =====================================================
   SAVED PLACES
===================================================== */

    const SAVED_KEY =
        "nicethings_saved_spots";


    function checkIfSaved(
        currentSpot
    ) {
        if (
            typeof window ===
            "undefined" ||
            !currentSpot?.id
        ) {
            return false;
        }

        try {
            const stored =
                localStorage.getItem(
                    SAVED_KEY
                );

            if (!stored) {
                return false;
            }

            const saved =
                JSON.parse(
                    stored
                );

            if (
                !Array.isArray(
                    saved
                )
            ) {
                return false;
            }

            return saved.some(
                item =>
                    String(
                        item.id
                    ) ===
                    String(
                        currentSpot.id
                    )
            );
        } catch (
        storageError
        ) {
            console.error(
                "Saved check error:",
                storageError
            );

            return false;
        }
    }


    function toggleSaved() {
        if (
            !spot?.id ||
            typeof window ===
            "undefined"
        ) {
            return;
        }

        try {
            const stored =
                localStorage.getItem(
                    SAVED_KEY
                );

            let saved = [];

            if (stored) {
                const parsed =
                    JSON.parse(
                        stored
                    );

                if (
                    Array.isArray(
                        parsed
                    )
                ) {
                    saved = parsed;
                }
            }

            const alreadySaved =
                saved.some(
                    item =>
                        String(
                            item.id
                        ) ===
                        String(
                            spot.id
                        )
                );

            if (alreadySaved) {
                saved =
                    saved.filter(
                        item =>
                            String(
                                item.id
                            ) !==
                            String(
                                spot.id
                            )
                    );

                setIsSaved(
                    false
                );
            } else {
                saved = [
                    spot,
                    ...saved.filter(
                        item =>
                            String(
                                item.id
                            ) !==
                            String(
                                spot.id
                            )
                    ),
                ];

                setIsSaved(
                    true
                );
            }

            localStorage.setItem(
                SAVED_KEY,
                JSON.stringify(
                    saved
                )
            );
        } catch (
        storageError
        ) {
            console.error(
                "Save place error:",
                storageError
            );
        }
    }

    /* =====================================================
   LOADING
====================================================== */

    if (loading) {
        return (
            <AppShell>
                <main className="nt-spot-page">
                    <div className="nt-spot-shell">

                        <div
                            className="nt-spot-loading"
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
        !spot
    ) {
        return (
            <AppShell>
                <main className="nt-spot-page">
                    <div className="nt-spot-shell">

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
                            className="nt-spot-empty"
                        >
                            <Sparkles
                                size={30}
                            />

                            <h1>
                                {t(
                                    "spotNotFound"
                                )}
                            </h1>

                            <p>
                                {error ||
                                    t(
                                        "spotLoadError"
                                    )}
                            </p>


                            <Link
                                href="/find"
                                className="nt-button-primary"
                            >
                                <Navigation
                                    size={17}
                                />

                                {t(
                                    "findSpot"
                                )}

                                <ArrowRight
                                    size={17}
                                />
                            </Link>

                        </div>

                    </div>
                </main>
            </AppShell>
        );
    }


    /* =====================================================
       SPOT DATA
    ====================================================== */

    const address =
        [
            spot.neighborhood,
            spot.address,
            spot.city,
        ]
            .filter(Boolean)
            .join(", ");


    const category =
        getCategoryName(
            spot.category
        );


    const price =
        getPrice();


    const mapsUrl =
        getGoogleMapsUrl();


    const hasPhone =
        Boolean(
            spot.phone
        );


    const hasWhatsApp =
        Boolean(
            spot.whatsapp ||
            spot.phone
        );


    const rating =
        Number(
            spot.rating
        ) || 0;


    const reviewCount =
        Number(
            spot.review_count
        ) || 0;


    /* =====================================================
       PAGE
    ====================================================== */

    return (
        <AppShell>
            <main className="nt-spot-page">

                <div className="nt-spot-shell">

                    {/* =================================================
                        TOP BAR
                    ================================================== */}

                    <header
                        className="nt-spot-topbar"
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

                            {t(
                                "back"
                            )}
                        </button>


                        <div
                            className="nt-spot-brand"
                        >
                            <Sparkles
                                size={16}
                            />

                            NiceThings
                        </div>


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

                    </header>


                    {/* =================================================
                        HERO
                    ================================================== */}

                    <section
                        className="nt-spot-hero"
                    >

                        <div
                            className="nt-spot-hero-icon"
                        >
                            🍽️
                        </div>


                        <div
                            className="nt-spot-hero-content"
                        >

                            <div
                                className="nt-spot-eyebrow"
                            >
                                <MapPin
                                    size={13}
                                />

                                {category}
                            </div>


                            <div
                                className="nt-spot-title-row"
                            >

                                <h1>
                                    {
                                        spot.name
                                    }
                                </h1>


                                {spot.verified && (
                                    <span
                                        className="nt-verified-badge"
                                    >
                                        <Check
                                            size={13}
                                        />

                                        {t(
                                            "verified"
                                        )}
                                    </span>
                                )}

                            </div>


                            {address && (
                                <p
                                    className="nt-spot-address"
                                >
                                    <MapPin
                                        size={16}
                                    />

                                    {address}
                                </p>
                            )}

                        </div>

                    </section>


                    {/* =================================================
                        QUICK INFO
                    ================================================== */}

                    <section
                        className="nt-spot-info-grid"
                    >

                        <div
                            className="nt-spot-info-card"
                        >
                            <span>
                                <Sparkles
                                    size={15}
                                />

                                {t(
                                    "category"
                                )}
                            </span>

                            <strong>
                                {category}
                            </strong>
                        </div>


                        <div
                            className="nt-spot-info-card"
                        >
                            <span>
                                <span className="nt-price-symbol">
                                    FCFA
                                </span>

                                {t(
                                    "budget"
                                )}
                            </span>

                            <strong>
                                {price}
                            </strong>
                        </div>


                        <div
                            className="nt-spot-info-card"
                        >
                            <span>
                                <Star
                                    size={15}
                                />

                                {t(
                                    "rating"
                                )}
                            </span>

                            <strong>
                                {rating > 0
                                    ? rating.toFixed(
                                        1
                                    )
                                    : t(
                                        "notRated"
                                    )}

                                {reviewCount >
                                    0 && (
                                        <small>
                                            {" "}
                                            (
                                            {
                                                reviewCount
                                            }
                                            )
                                        </small>
                                    )}
                            </strong>
                        </div>

                    </section>
                    {/* =================================================
                        ABOUT
                    ================================================== */}

                    {spot.description && (
                        <section
                            className="nt-spot-section"
                        >
                            <div
                                className="nt-spot-section-heading"
                            >
                                <Sparkles
                                    size={17}
                                />

                                <h2>
                                    {t(
                                        "aboutThisPlace"
                                    )}
                                </h2>
                            </div>

                            <p
                                className="nt-spot-description"
                            >
                                {
                                    spot.description
                                }
                            </p>
                        </section>
                    )}


                    {/* =================================================
                        OPENING HOURS
                    ================================================== */}

                    {(spot.opening_time ||
                        spot.closing_time) && (
                            <section
                                className="nt-spot-section"
                            >
                                <div
                                    className="nt-spot-section-heading"
                                >
                                    <Clock3
                                        size={17}
                                    />

                                    <h2>
                                        {t(
                                            "openingHours"
                                        )}
                                    </h2>
                                </div>


                                <div
                                    className="nt-spot-hours"
                                >
                                    <div>
                                        <span>
                                            {t(
                                                "today"
                                            )}
                                        </span>

                                        <strong>
                                            {spot.opening_time &&
                                                spot.closing_time
                                                ? `${spot.opening_time} – ${spot.closing_time}`
                                                : t(
                                                    "hoursNotAvailable"
                                                )}
                                        </strong>
                                    </div>
                                </div>
                            </section>
                        )}


                    {/* =================================================
                        LOCATION
                    ================================================== */}

                    <section
                        className="nt-spot-section"
                    >
                        <div
                            className="nt-spot-section-heading"
                        >
                            <MapPin
                                size={17}
                            />

                            <h2>
                                {t(
                                    "location"
                                )}
                            </h2>
                        </div>


                        <div
                            className="nt-spot-location-card"
                        >
                            <div>
                                <strong>
                                    {
                                        spot.name
                                    }
                                </strong>

                                {address && (
                                    <p>
                                        {
                                            address
                                        }
                                    </p>
                                )}
                            </div>


                            <a
                                href={
                                    mapsUrl
                                }
                                target="_blank"
                                rel="noreferrer"
                                className="nt-button-primary"
                            >
                                <Navigation
                                    size={17}
                                />

                                {t(
                                    "findThisPlace"
                                )}

                                <ExternalLink
                                    size={15}
                                />
                            </a>
                        </div>
                    </section>


                    {/* =================================================
    ACTIONS
================================================== */}

                    <section
                        className="nt-spot-actions"
                    >

                        {hasPhone && (
                            <button
                                type="button"
                                className="nt-spot-action primary"
                                onClick={
                                    callSpot
                                }
                            >
                                <Phone
                                    size={19}
                                />

                                <span>
                                    {t(
                                        "call"
                                    )}
                                </span>
                            </button>
                        )}


                        {hasWhatsApp && (
                            <button
                                type="button"
                                className="nt-spot-action"
                                onClick={
                                    openWhatsApp
                                }
                            >
                                <MessageCircle
                                    size={19}
                                />

                                <span>
                                    {t(
                                        "whatsapp"
                                    )}
                                </span>
                            </button>
                        )}


                        <button
                            type="button"
                            className="nt-spot-action"
                            onClick={
                                shareSpot
                            }
                        >
                            <Share2
                                size={19}
                            />

                            <span>
                                {copied
                                    ? t(
                                        "copied"
                                    )
                                    : t(
                                        "share"
                                    )}
                            </span>
                        </button>


                        <button
                            type="button"
                            className={
                                isSaved
                                    ? "nt-spot-action saved"
                                    : "nt-spot-action"
                            }
                            onClick={
                                toggleSaved
                            }
                            aria-pressed={
                                isSaved
                            }
                        >
                            <HeartIcon
                                filled={
                                    isSaved
                                }
                            />

                            <span>
                                {isSaved
                                    ? t(
                                        "savedPlace"
                                    )
                                    : t(
                                        "savePlace"
                                    )}
                            </span>
                        </button>

                    </section>

                    {/* =================================================
                        CONTACT NOTICE
                    ================================================== */}

                    {(hasPhone ||
                        hasWhatsApp) && (
                            <div
                                className="nt-spot-contact-note"
                            >
                                <Sparkles
                                    size={14}
                                />

                                <span>
                                    {t(
                                        "contactPlaceNote"
                                    )}
                                </span>
                            </div>
                        )}


                    {/* =================================================
                        VERIFICATION
                    ================================================== */}

                    {spot.verified && (
                        <section
                            className="nt-spot-verification"
                        >
                            <div
                                className="nt-verification-icon"
                            >
                                <Check
                                    size={18}
                                />
                            </div>


                            <div>
                                <strong>
                                    {t(
                                        "verified"
                                    )}
                                </strong>

                                <p>
                                    {t(
                                        "verifiedDescription"
                                    )}
                                </p>
                            </div>
                        </section>
                    )}
                    {/* =================================================
                        BACK TO RESULTS
                    ================================================== */}

                    <div
                        className="nt-spot-bottom-actions"
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

                            {t(
                                "backToResults"
                            )}
                        </button>


                        <Link
                            href="/find"
                            className="nt-button-primary"
                        >
                            <SearchIcon />

                            {t(
                                "findAnotherPlace"
                            )}

                            <ArrowRight
                                size={17}
                            />
                        </Link>
                    </div>


                    {/* =================================================
                        FOOTER
                    ================================================== */}

                    <footer
                        className="nt-spot-footer"
                    >
                        <div>
                            <Sparkles
                                size={15}
                            />

                            <strong>
                                NiceThings
                            </strong>
                        </div>

                        <p>
                            {t(
                                "footerTagline"
                            )}
                        </p>
                    </footer>

                </div>
            </main>
        </AppShell>
    );
}


/* =====================================================
   SEARCH ICON
===================================================== */

function SearchIcon() {
    return (
        <svg
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            <circle
                cx="11"
                cy="11"
                r="7"
            />

            <path
                d="m20 20-4-4"
            />
        </svg>
    );
}
function HeartIcon({
    filled = false,
}) {
    return (
        <svg
            width="19"
            height="19"
            viewBox="0 0 24 24"
            fill={
                filled
                    ? "currentColor"
                    : "none"
            }
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            <path
                d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z"
            />
        </svg>
    );
}