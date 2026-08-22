// components/discovery/BudgetPicker.jsx

import { Check, Wallet } from "lucide-react";
import { useLanguage } from "../../lib/i18n";

const BUDGETS = [
    500,
    1000,
    2000,
    5000,
    10000,
    20000,
];

export default function BudgetPicker({
    budget,
    setBudget,
}) {
    const { t, language } =
        useLanguage();

    const isFrench =
        language === "fr";

    return (
        <section className="nt-discovery-card">
            <div className="nt-discovery-card-heading">
                <div className="nt-discovery-number">
                    02
                </div>

                <div>
                    <span className="nt-discovery-kicker">
                        {t("budget")}
                    </span>

                    <h2>
                        {isFrench
                            ? "Combien souhaitez-vous dépenser ?"
                            : "How much would you like to spend?"}
                    </h2>
                </div>
            </div>

            <div className="nt-budget-grid">
                {BUDGETS.map(
                    (amount) => {
                        const active =
                            budget ===
                            amount;

                        return (
                            <button
                                key={amount}
                                type="button"
                                className={
                                    active
                                        ? "nt-budget-option nt-budget-option-active"
                                        : "nt-budget-option"
                                }
                                onClick={() =>
                                    setBudget(
                                        amount
                                    )
                                }
                            >
                                {active && (
                                    <span className="nt-budget-check">
                                        <Check
                                            size={
                                                12
                                            }
                                        />
                                    </span>
                                )}

                                <Wallet
                                    size={
                                        16
                                    }
                                />

                                <span>
                                    {amount.toLocaleString(
                                        "fr-FR"
                                    )}{" "}
                                    FCFA
                                </span>
                            </button>
                        );
                    }
                )}
            </div>

            <div className="nt-custom-budget">
                <span>
                    {isFrench
                        ? "Ou entrez votre budget"
                        : "Or enter your budget"}
                </span>

                <div className="nt-custom-budget-input">
                    <input
                        type="number"
                        min="100"
                        inputMode="numeric"
                        placeholder={
                            isFrench
                                ? "Budget personnalisé"
                                : "Custom budget"
                        }
                        value={
                            BUDGETS.includes(
                                Number(
                                    budget
                                )
                            )
                                ? ""
                                : budget ||
                                ""
                        }
                        onChange={(event) => {
                            const value =
                                event.target
                                    .value;

                            setBudget(
                                value ===
                                    ""
                                    ? null
                                    : Number(
                                        value
                                    )
                            );
                        }}
                    />

                    <span>
                        FCFA
                    </span>
                </div>
            </div>
        </section>
    );
}