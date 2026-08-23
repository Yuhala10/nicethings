import Link from "next/link";
import {
    ArrowRight,
    MapPin,
    Sparkles,
    Utensils,
} from "lucide-react";

import AppShell from "../components/layout/AppShell";
import { useLanguage } from "../lib/i18n";

export default function HomePage() {
    const { t } = useLanguage();

    return (
        <AppShell>
            <main className="nt-home">
                {/* =====================================================
                    HERO
                ====================================================== */}

                <section className="nt-hero">
                    <div className="nt-hero-inner">
                        <div className="nt-hero-content">

                            {/* Brand mark */}
                            <div className="nt-brand-mark">
                                <Sparkles size={30} />
                            </div>

                            {/* Small introduction */}
                            <div className="nt-hero-badge">
                                <span>
                                    <Sparkles size={14} />
                                </span>

                                {t("discover")}
                            </div>

                            {/* Main title */}
                            <h1>
                                {t("heroTitle")}
                                <br />

                                <span>
                                    {t("heroTitleAccent")}
                                </span>
                            </h1>

                            {/* Description */}
                            <p>
                                {t("heroDescription")}
                            </p>

                            {/* Main actions */}
                            <div className="nt-hero-actions">

                                <Link
                                    href="/find"
                                    className="nt-button-primary"
                                >
                                    <Sparkles size={18} />

                                    <span>
                                        {t("findSpot")}
                                    </span>

                                    <ArrowRight size={18} />
                                </Link>

                                <Link
                                    href="/introduce"
                                    className="nt-button-secondary"
                                >
                                    <MapPin size={17} />

                                    <span>
                                        {t("introduceSpot")}
                                    </span>
                                </Link>

                            </div>

                            {/* Simple reassurance */}
                            <div
                                style={{
                                    marginTop: "28px",
                                    display: "flex",
                                    justifyContent: "center",
                                    alignItems: "center",
                                    gap: "7px",
                                    flexWrap: "wrap",
                                    color: "var(--nt-muted)",
                                    fontSize: "0.82rem",
                                }}
                            >
                                <MapPin size={14} />

                                <span>
                                    {t("locationOptional")}
                                </span>
                            </div>

                        </div>
                    </div>
                </section>


                {/* =====================================================
                    SIMPLE EXPLANATION
                ====================================================== */}

                <section className="nt-section">
                    <div className="nt-container">

                        <div className="nt-section-header nt-center">
                            <h2>
                                {t("howItWorks")}
                            </h2>

                            <p>
                                {t("howItWorksDescription")}
                            </p>
                        </div>


                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns:
                                    "repeat(3, minmax(0, 1fr))",
                                gap: "14px",
                            }}
                        >

                            {/* Step 1 */}
                            <div className="nt-card">
                                <div
                                    style={{
                                        padding: "22px",
                                    }}
                                >
                                    <div className="nt-brand-mark">
                                        <Sparkles size={23} />
                                    </div>

                                    <h3>
                                        {t("homeStepOneTitle")}
                                    </h3>

                                    <p
                                        style={{
                                            marginBottom: 0,
                                            color:
                                                "var(--nt-muted)",
                                        }}
                                    >
                                        {t("homeStepOneDescription")}
                                    </p>
                                </div>
                            </div>


                            {/* Step 2 */}
                            <div className="nt-card">
                                <div
                                    style={{
                                        padding: "22px",
                                    }}
                                >
                                    <div className="nt-brand-mark">
                                        <MapPin size={23} />
                                    </div>

                                    <h3>
                                        {t("homeStepTwoTitle")}
                                    </h3>

                                    <p
                                        style={{
                                            marginBottom: 0,
                                            color:
                                                "var(--nt-muted)",
                                        }}
                                    >
                                        {t("homeStepTwoDescription")}
                                    </p>
                                </div>
                            </div>


                            {/* Step 3 */}
                            <div className="nt-card">
                                <div
                                    style={{
                                        padding: "22px",
                                    }}
                                >
                                    <div className="nt-brand-mark">
                                        <Utensils size={23} />
                                    </div>

                                    <h3>
                                        {t("homeStepThreeTitle")}
                                    </h3>

                                    <p
                                        style={{
                                            marginBottom: 0,
                                            color:
                                                "var(--nt-muted)",
                                        }}
                                    >
                                        {t("homeStepThreeDescription")}
                                    </p>
                                </div>
                            </div>

                        </div>

                    </div>
                </section>


                {/* =====================================================
                    FINAL CTA
                ====================================================== */}

                <section className="nt-section-small">
                    <div className="nt-container">

                        <div
                            style={{
                                padding: "28px",
                                borderRadius:
                                    "var(--nt-radius-xl)",
                                background:
                                    "var(--nt-red)",
                                color:
                                    "var(--nt-white)",
                                textAlign:
                                    "center",
                            }}
                        >

                            <h2
                                style={{
                                    color:
                                        "var(--nt-white)",
                                    marginBottom:
                                        "8px",
                                }}
                            >
                                {t("readyToDiscover")}
                            </h2>

                            <p
                                style={{
                                    maxWidth:
                                        "560px",
                                    margin:
                                        "0 auto 18px",
                                    color:
                                        "rgba(255,255,255,0.88)",
                                }}
                            >
                                {t("readyToDiscoverDescription")}
                            </p>

                            <Link
                                href="/find"
                                className="nt-button-secondary"
                            >
                                <Sparkles size={17} />

                                {t("findSpot")}

                                <ArrowRight size={17} />
                            </Link>

                        </div>

                    </div>
                </section>

            </main>
        </AppShell>
    );
}