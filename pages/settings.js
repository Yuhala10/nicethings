import { useState } from "react";
import Link from "next/link";

import {
    ArrowLeft,
    ChevronRight,
    Globe2,
    Heart,
    Info,
    Lock,
    RotateCcw,
    Settings as SettingsIcon,
    Sparkles,
    Trash2,
} from "lucide-react";

import AppShell from "../components/layout/AppShell";
import { useLanguage } from "../lib/i18n";


const SAVED_KEY =
    "nicethings_saved_spots";


export default function SettingsPage() {
    const {
        language,
        setLanguage,
        t,
    } = useLanguage();


    const [
        savedCleared,
        setSavedCleared,
    ] = useState(false);


    /* =====================================================
       LANGUAGE
    ====================================================== */

    function changeLanguage(
        nextLanguage
    ) {
        if (
            nextLanguage !== "en" &&
            nextLanguage !== "fr"
        ) {
            return;
        }

        setLanguage(
            nextLanguage
        );
    }


    /* =====================================================
       CLEAR SAVED PLACES
    ====================================================== */

    function clearSavedPlaces() {
        if (
            typeof window ===
            "undefined"
        ) {
            return;
        }

        localStorage.removeItem(
            SAVED_KEY
        );

        setSavedCleared(
            true
        );

        setTimeout(() => {
            setSavedCleared(
                false
            );
        }, 2500);
    }


    /* =====================================================
       RESET LANGUAGE
    ====================================================== */

    function resetLanguage() {
        changeLanguage(
            "en"
        );
    }


    return (
        <AppShell>

            <main
                className="nt-settings-page"
            >

                <div
                    className="nt-settings-shell"
                >

                    {/* =================================================
                        HEADER
                    ================================================== */}

                    <header
                        className="nt-settings-header"
                    >

                        <Link
                            href="/"
                            className="nt-button-secondary"
                        >

                            <ArrowLeft
                                size={17}
                            />

                            {t(
                                "back"
                            )}

                        </Link>


                        <div
                            className="nt-settings-heading"
                        >

                            <div
                                className="nt-settings-eyebrow"
                            >

                                <SettingsIcon
                                    size={14}
                                />

                                {t(
                                    "settings"
                                )}

                            </div>


                            <h1>
                                {t(
                                    "settingsTitle"
                                )}
                            </h1>


                            <p>
                                {t(
                                    "settingsDescription"
                                )}
                            </p>

                        </div>

                    </header>


                    {/* =================================================
                        LANGUAGE
                    ================================================== */}

                    <section
                        className="nt-settings-card"
                    >

                        <div
                            className="nt-settings-card-heading"
                        >

                            <div
                                className="nt-settings-icon"
                            >

                                <Globe2
                                    size={19}
                                />

                            </div>


                            <div>

                                <h2>
                                    {t(
                                        "language"
                                    )}
                                </h2>

                                <p>
                                    {t(
                                        "languageDescription"
                                    )}
                                </p>

                            </div>

                        </div>


                        <div
                            className="nt-settings-language-options"
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
                                aria-pressed={
                                    language ===
                                    "en"
                                }
                            >

                                <span>
                                    English
                                </span>

                                {language ===
                                    "en" && (
                                        <span
                                            aria-hidden="true"
                                        >
                                            ✓
                                        </span>
                                    )}

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
                                aria-pressed={
                                    language ===
                                    "fr"
                                }
                            >

                                <span>
                                    Français
                                </span>

                                {language ===
                                    "fr" && (
                                        <span
                                            aria-hidden="true"
                                        >
                                            ✓
                                        </span>
                                    )}

                            </button>

                        </div>

                    </section>


                    {/* =================================================
                        SAVED PLACES
                    ================================================== */}

                    <section
                        className="nt-settings-card"
                    >

                        <div
                            className="nt-settings-card-heading"
                        >

                            <div
                                className="nt-settings-icon"
                            >

                                <Heart
                                    size={19}
                                />

                            </div>


                            <div>

                                <h2>
                                    {t(
                                        "saved"
                                    )}
                                </h2>

                                <p>
                                    {t(
                                        "savedSettingsDescription"
                                    )}
                                </p>

                            </div>

                        </div>


                        <div
                            className="nt-settings-actions"
                        >

                            <Link
                                href="/saved"
                                className="nt-settings-row"
                            >

                                <span>

                                    <Heart
                                        size={17}
                                    />

                                    {t(
                                        "viewSaved"
                                    )}

                                </span>

                                <ChevronRight
                                    size={17}
                                />

                            </Link>


                            <button
                                type="button"
                                className="nt-settings-row danger"
                                onClick={
                                    clearSavedPlaces
                                }
                            >

                                <span>

                                    <Trash2
                                        size={17}
                                    />

                                    {savedCleared
                                        ? t(
                                            "savedCleared"
                                        )
                                        : t(
                                            "clearSaved"
                                        )}

                                </span>

                                <ChevronRight
                                    size={17}
                                />

                            </button>

                        </div>

                    </section>


                    {/* =================================================
                        PRIVACY
                    ================================================== */}

                    <section
                        className="nt-settings-card"
                    >

                        <div
                            className="nt-settings-card-heading"
                        >

                            <div
                                className="nt-settings-icon"
                            >

                                <Lock
                                    size={19}
                                />

                            </div>


                            <div>

                                <h2>
                                    {t(
                                        "privacy"
                                    )}
                                </h2>

                                <p>
                                    {t(
                                        "privacyDescription"
                                    )}
                                </p>

                            </div>

                        </div>


                        <div
                            className="nt-settings-actions"
                        >

                            <Link
                                href="/legal/privacy"
                                className="nt-settings-row"
                            >

                                <span>

                                    <Lock
                                        size={17}
                                    />

                                    {t(
                                        "privacy"
                                    )}

                                </span>

                                <ChevronRight
                                    size={17}
                                />

                            </Link>


                            <Link
                                href="/legal/cookies"
                                className="nt-settings-row"
                            >

                                <span>

                                    <Info
                                        size={17}
                                    />

                                    {t(
                                        "cookies"
                                    )}

                                </span>

                                <ChevronRight
                                    size={17}
                                />

                            </Link>


                            <Link
                                href="/legal/terms"
                                className="nt-settings-row"
                            >

                                <span>

                                    <Info
                                        size={17}
                                    />

                                    {t(
                                        "terms"
                                    )}

                                </span>

                                <ChevronRight
                                    size={17}
                                />

                            </Link>


                            <Link
                                href="/legal/data-rights"
                                className="nt-settings-row"
                            >

                                <span>

                                    <ShieldIcon />

                                    {language ===
                                        "fr"
                                        ? "Droits sur les données"
                                        : "Data rights"}

                                </span>

                                <ChevronRight
                                    size={17}
                                />

                            </Link>

                        </div>

                    </section>


                    {/* =================================================
                        APP INFORMATION
                    ================================================== */}

                    <section
                        className="nt-settings-card"
                    >

                        <div
                            className="nt-settings-card-heading"
                        >

                            <div
                                className="nt-settings-icon"
                            >

                                <Sparkles
                                    size={19}
                                />

                            </div>


                            <div>

                                <h2>
                                    {t(
                                        "about"
                                    )}
                                </h2>

                                <p>
                                    {t(
                                        "aboutDescription"
                                    )}
                                </p>

                            </div>

                        </div>


                        <div
                            className="nt-settings-about"
                        >

                            <strong>
                                NiceThings
                            </strong>

                            <span>
                                {t(
                                    "footerTagline"
                                )}
                            </span>

                            <small>
                                {t(
                                    "version"
                                )}{" "}
                                1.0.0
                            </small>

                        </div>

                    </section>


                    {/* =================================================
                        RESET
                    ================================================== */}

                    <section
                        className="nt-settings-card nt-settings-reset"
                    >

                        <button
                            type="button"
                            onClick={
                                resetLanguage
                            }
                            className="nt-settings-row"
                        >

                            <span>

                                <RotateCcw
                                    size={17}
                                />

                                {t(
                                    "resetLanguage"
                                )}

                            </span>

                            <ChevronRight
                                size={17}
                            />

                        </button>

                    </section>


                    {/* =================================================
                        ADMIN
                    ================================================== */}

                    <Link
                        href="/admin/login"
                        className="nt-settings-admin-link"
                    >

                        <ShieldIcon />

                        {t(
                            "admin"
                        )}

                    </Link>

                </div>

            </main>

        </AppShell>
    );
}


/* =====================================================
   SHIELD ICON
====================================================== */

function ShieldIcon() {
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

            <path
                d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
            />

            <path
                d="m9 12 2 2 4-4"
            />

        </svg>
    );
}