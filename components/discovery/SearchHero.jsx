// components/discovery/SearchHero.jsx

import { Sparkles } from "lucide-react";
import { useLanguage } from "../../lib/i18n";

export default function SearchHero() {
    const { t } = useLanguage();

    return (
        <div className="nt-search-hero">
            <div className="nt-search-hero-glow" />

            <div className="nt-search-hero-content">
                <div className="nt-eyebrow">
                    <span className="nt-eyebrow-dot" />
                    <span>
                        {t("discover")}
                    </span>
                </div>

                <h1 className="nt-search-title">
                    {t("heroTitle")}
                </h1>

                <p className="nt-search-description">
                    {t("heroDescription")}
                </p>

                <div className="nt-search-mini-note">
                    <Sparkles size={15} />
                    <span>
                        {t("trustedDiscovery")}
                    </span>
                </div>
            </div>
        </div>
    );
}