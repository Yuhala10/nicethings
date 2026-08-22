import Link from "next/link";
import Image from "next/image";
import {
    Globe2,
    Search,
} from "lucide-react";

import { useLanguage } from "../../lib/i18n";

export default function AppShell({
    children,
}) {
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

    return (
        <div className="nt-page">
            <header className="nt-header">
                <div className="nt-header-inner">
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

                    <div className="nt-header-actions">
                        <Link
                            href="/find"
                            className="nt-language-button"
                        >
                            <Search
                                size={14}
                            />
                        </Link>

                        <button
                            type="button"
                            className="nt-language-button"
                            onClick={
                                toggleLanguage
                            }
                            aria-label={
                                t(
                                    "language"
                                )
                            }
                        >
                            <Globe2
                                size={14}
                            />

                            {" "}

                            {language ===
                                "en"
                                ? "FR"
                                : "EN"}
                        </button>
                    </div>
                </div>
            </header>

            {children}
        </div>
    );
}