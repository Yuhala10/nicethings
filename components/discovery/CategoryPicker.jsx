// components/discovery/CategoryPicker.jsx

import {
    Coffee,
    CupSoda,
    Flame,
    Grid2X2,
    Hamburger,
    Utensils,
} from "lucide-react";

import { useLanguage } from "../../lib/i18n";

const CATEGORIES = [
    {
        id: "all",
        icon: Grid2X2,
        en: "Anything good",
        fr: "Peu importe",
    },
    {
        id: "local",
        icon: Utensils,
        en: "Local food",
        fr: "Cuisine locale",
    },
    {
        id: "fast",
        icon: Hamburger,
        en: "Fast food",
        fr: "Fast-food",
    },
    {
        id: "cafe",
        icon: Coffee,
        en: "Café",
        fr: "Café",
    },
    {
        id: "grill",
        icon: Flame,
        en: "Grill",
        fr: "Grillades",
    },
    {
        id: "drinks",
        icon: CupSoda,
        en: "Drinks",
        fr: "Boissons",
    },
];

export default function CategoryPicker({
    category,
    setCategory,
}) {
    const { t, language } =
        useLanguage();

    return (
        <section className="nt-discovery-card">
            <div className="nt-discovery-card-heading">
                <div className="nt-discovery-number">
                    04
                </div>

                <div>
                    <span className="nt-discovery-kicker">
                        {t("category")}
                    </span>

                    <h2>
                        {language === "fr"
                            ? "Qu'est-ce qui vous ferait plaisir ?"
                            : "What are you in the mood for?"}
                    </h2>
                </div>
            </div>

            <div className="nt-category-grid">
                {CATEGORIES.map(
                    (item) => {
                        const Icon =
                            item.icon;

                        const active =
                            category ===
                            item.id;

                        return (
                            <button
                                key={
                                    item.id
                                }
                                type="button"
                                className={
                                    active
                                        ? "nt-category-option nt-category-option-active"
                                        : "nt-category-option"
                                }
                                onClick={() =>
                                    setCategory(
                                        item.id
                                    )
                                }
                            >
                                <span className="nt-category-icon">
                                    <Icon
                                        size={
                                            20
                                        }
                                    />
                                </span>

                                <span>
                                    {language ===
                                        "fr"
                                        ? item.fr
                                        : item.en}
                                </span>
                            </button>
                        );
                    }
                )}
            </div>
        </section>
    );
}