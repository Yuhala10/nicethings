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
    const { t } =
        useLanguage();

    return (
        <AppShell>
            <main className="nt-hero">
                <div className="nt-container">
                    <div className="nt-hero-content">
                        <div className="nt-eyebrow">
                            <span className="nt-eyebrow-dot" />

                            {t(
                                "discover"
                            )}
                        </div>

                        <h1>
                            Find somewhere
                            <br />

                            <span className="nt-gradient-text">
                                you'll love.
                            </span>
                        </h1>

                        <p>
                            {t(
                                "heroDescription"
                            )}
                        </p>

                        <div className="nt-hero-actions">
                            <Link
                                href="/find"
                                className="nt-button nt-button-primary"
                            >
                                <Sparkles
                                    size={18}
                                />

                                {t(
                                    "findSpot"
                                )}

                                <ArrowRight
                                    size={18}
                                />
                            </Link>

                            <Link
                                href="/introduce"
                                className="nt-button nt-button-secondary"
                            >
                                <MapPin
                                    size={17}
                                />

                                {t(
                                    "introduceSpot"
                                )}
                            </Link>
                        </div>

                        <div
                            style={{
                                marginTop:
                                    "55px",
                                display:
                                    "flex",
                                justifyContent:
                                    "center",
                                gap: "12px",
                                flexWrap:
                                    "wrap",
                            }}
                        >
                            <div className="nt-eyebrow">
                                <MapPin
                                    size={13}
                                />
                                Yaoundé
                            </div>

                            <div className="nt-eyebrow">
                                <Utensils
                                    size={13}
                                />
                                Food & spots
                            </div>

                            <div className="nt-eyebrow">
                                <Sparkles
                                    size={13}
                                />
                                Simple discovery
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </AppShell>
    );
}