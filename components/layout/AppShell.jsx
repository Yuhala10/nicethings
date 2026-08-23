import Link from "next/link";
import Image from "next/image";
import {
    Globe2,
    Home,
    Search,
    ShieldCheck,
    Settings,
    Heart,
    PlusCircle,
} from "lucide-react";

import { useRouter } from "next/router";

import { useLanguage } from "../../lib/i18n";


export default function AppShell({
    children,
}) {
    const router =
        useRouter();

    const {
        language,
        setLanguage,
        t,
    } = useLanguage();


    function toggleLanguage() {
        setLanguage(
            language === "en"
                ? "fr"
                : "en"
        );
    }


    function isActive(
        path
    ) {
        if (
            path === "/"
        ) {
            return (
                router.pathname ===
                "/"
            );
        }

        return (
            router.pathname ===
            path ||
            router.pathname.startsWith(
                `${path}/`
            )
        );
    }


    return (
        <div className="nt-page">

            {/* =================================================
                HEADER
            ================================================== */}

            <header
                className="nt-header"
            >
                <div
                    className="nt-header-inner"
                >

                    <Link
                        href="/"
                        className="nt-logo"
                    >
                        <Image
                            src="/branding/nicethings-icon.png"
                            alt="NiceThings"
                            width={38}
                            height={38}
                            priority
                        />

                        <span className="nt-logo-text">
                            NiceThings
                        </span>
                    </Link>


                    {/* =============================================
                        DESKTOP NAVIGATION
                    ============================================== */}

                    <nav
                        className="nt-desktop-nav"
                        aria-label="Main navigation"
                    >

                        <Link
                            href="/"
                            className={
                                isActive("/")
                                    ? "active"
                                    : ""
                            }
                        >
                            <Home
                                size={16}
                            />

                            {t(
                                "home"
                            )}
                        </Link>


                        <Link
                            href="/find"
                            className={
                                isActive(
                                    "/find"
                                )
                                    ? "active"
                                    : ""
                            }
                        >
                            <Search
                                size={16}
                            />

                            {t(
                                "discoverNav"
                            )}
                        </Link>


                        <Link
                            href="/saved"
                            className={
                                isActive(
                                    "/saved"
                                )
                                    ? "active"
                                    : ""
                            }
                        >
                            <Heart
                                size={16}
                            />

                            {t(
                                "saved"
                            )}
                        </Link>


                        <Link
                            href="/introduce"
                            className={
                                isActive(
                                    "/introduce"
                                )
                                    ? "active"
                                    : ""
                            }
                        >
                            <PlusCircle
                                size={16}
                            />

                            {t(
                                "contribute"
                            )}
                        </Link>

                    </nav>


                    {/* =============================================
                        HEADER ACTIONS
                    ============================================== */}

                    <div
                        className="nt-header-actions"
                    >

                        <Link
                            href="/find"
                            className="nt-header-icon-button"
                            aria-label={t(
                                "search"
                            )}
                            title={t(
                                "search"
                            )}
                        >
                            <Search
                                size={17}
                            />
                        </Link>


                        <Link
                            href="/admin/login"
                            className="nt-header-icon-button"
                            aria-label={t(
                                "admin"
                            )}
                            title={t(
                                "admin"
                            )}
                        >
                            <ShieldCheck
                                size={17}
                            />
                        </Link>


                        <Link
                            href="/settings"
                            className="nt-header-icon-button"
                            aria-label={t(
                                "settings"
                            )}
                            title={t(
                                "settings"
                            )}
                        >
                            <Settings
                                size={17}
                            />
                        </Link>


                        <button
                            type="button"
                            className="nt-header-language"
                            onClick={
                                toggleLanguage
                            }
                            aria-label={t(
                                "language"
                            )}
                            title={t(
                                "language"
                            )}
                        >
                            <Globe2
                                size={15}
                            />

                            <span>
                                {language ===
                                    "en"
                                    ? "FR"
                                    : "EN"}
                            </span>
                        </button>

                    </div>

                </div>
            </header>


            {/* =================================================
                CONTENT
            ================================================== */}

            {children}


            {/* =================================================
                MOBILE NAVIGATION
            ================================================== */}

            <nav
                className="nt-mobile-nav"
                aria-label="Mobile navigation"
            >

                <Link
                    href="/"
                    className={
                        isActive("/")
                            ? "active"
                            : ""
                    }
                >
                    <Home
                        size={20}
                    />

                    <span>
                        {t(
                            "home"
                        )}
                    </span>
                </Link>


                <Link
                    href="/find"
                    className={
                        isActive(
                            "/find"
                        )
                            ? "active"
                            : ""
                    }
                >
                    <Search
                        size={20}
                    />

                    <span>
                        {t(
                            "discoverNav"
                        )}
                    </span>
                </Link>


                <Link
                    href="/saved"
                    className={
                        isActive(
                            "/saved"
                        )
                            ? "active"
                            : ""
                    }
                >
                    <Heart
                        size={20}
                    />

                    <span>
                        {t(
                            "saved"
                        )}
                    </span>
                </Link>


                <Link
                    href="/introduce"
                    className={
                        isActive(
                            "/introduce"
                        )
                            ? "active"
                            : ""
                    }
                >
                    <PlusCircle
                        size={20}
                    />

                    <span>
                        {t(
                            "contribute"
                        )}
                    </span>
                </Link>

            </nav>


            {/* =================================================
                FOOTER
            ================================================== */}

            <footer
                className="nt-footer"
            >
                <div
                    className="nt-footer-inner"
                >

                    <div>
                        <strong>
                            NiceThings
                        </strong>

                        <span>
                            {t(
                                "footerTagline"
                            )}
                        </span>
                    </div>


                    <div
                        className="nt-footer-links"
                    >

                        <Link
                            href="/legal/privacy"
                        >
                            {t(
                                "privacy"
                            )}
                        </Link>


                        <Link
                            href="/legal/terms"
                        >
                            {t(
                                "terms"
                            )}
                        </Link>


                        <Link
                            href="/legal/cookies"
                        >
                            {t(
                                "cookies"
                            )}
                        </Link>


                        <Link
                            href="/admin/login"
                        >
                            {t(
                                "admin"
                            )}
                        </Link>

                    </div>

                </div>
            </footer>

        </div>
    );
}