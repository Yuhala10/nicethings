// components/discovery/PeoplePicker.jsx

import { Minus, Plus, Users } from "lucide-react";
import { useLanguage } from "../../lib/i18n";

export default function PeoplePicker({
    people,
    setPeople,
}) {
    const { t, language } =
        useLanguage();

    const isFrench =
        language === "fr";

    function decrease() {
        setPeople(
            Math.max(1, people - 1)
        );
    }

    function increase() {
        setPeople(
            Math.min(20, people + 1)
        );
    }

    return (
        <section className="nt-discovery-card">
            <div className="nt-discovery-card-heading">
                <div className="nt-discovery-number">
                    03
                </div>

                <div>
                    <span className="nt-discovery-kicker">
                        {t("people")}
                    </span>

                    <h2>
                        {isFrench
                            ? "Pour combien de personnes ?"
                            : "How many people?"}
                    </h2>
                </div>
            </div>

            <div className="nt-people-control">
                <div className="nt-people-icon">
                    <Users size={23} />
                </div>

                <div className="nt-people-label">
                    <strong>
                        {people}
                    </strong>

                    <span>
                        {people === 1
                            ? isFrench
                                ? "personne"
                                : "person"
                            : isFrench
                                ? "personnes"
                                : "people"}
                    </span>
                </div>

                <div className="nt-people-actions">
                    <button
                        type="button"
                        onClick={
                            decrease
                        }
                        disabled={
                            people <= 1
                        }
                        aria-label={
                            isFrench
                                ? "Diminuer"
                                : "Decrease"
                        }
                    >
                        <Minus
                            size={18}
                        />
                    </button>

                    <button
                        type="button"
                        onClick={
                            increase
                        }
                        disabled={
                            people >= 20
                        }
                        aria-label={
                            isFrench
                                ? "Augmenter"
                                : "Increase"
                        }
                    >
                        <Plus
                            size={18}
                        />
                    </button>
                </div>
            </div>
        </section>
    );
}