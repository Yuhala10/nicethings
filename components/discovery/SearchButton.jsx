// components/discovery/SearchButton.jsx

import {
    ArrowRight,
    Sparkles,
} from "lucide-react";

import { useLanguage } from "../../lib/i18n";

export default function SearchButton({
    onSearch,
    loading,
    disabled,
}) {
    const { language } =
        useLanguage();

    const isFrench =
        language === "fr";

    return (
        <div className="nt-search-submit-area">
            <button
                type="button"
                className="nt-discovery-submit"
                onClick={onSearch}
                disabled={
                    disabled || loading
                }
            >
                <span className="nt-discovery-submit-glow" />

                <span className="nt-action-content">
                    <Sparkles
                        size={19}
                    />

                    <span>
                        {loading
                            ? isFrench
                                ? "Préparation..."
                                : "Preparing..."
                            : isFrench
                                ? "Trouver mon endroit"
                                : "Find my spot"}
                    </span>

                    {!loading && (
                        <ArrowRight
                            size={19}
                        />
                    )}
                </span>
            </button>

            <p className="nt-search-submit-note">
                {isFrench
                    ? "Nous trouverons les options les plus pertinentes pour vous."
                    : "We'll find the options that fit you best."}
            </p>
        </div>
    );
}