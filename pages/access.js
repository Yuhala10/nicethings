import { useEffect, useState } from "react";
import {
    CheckCircle2,
    Clock,
    Copy,
    ImagePlus,
    Phone,
    ShieldCheck,
    Sparkles,
} from "lucide-react";

import AppShell from "../components/layout/AppShell";

const MOMO_NUMBER =
    "677247425";

export default function AccessPage() {
    const [language, setLanguage] =
        useState("en");

    const [copied, setCopied] =
        useState(false);

    const [proof, setProof] =
        useState(null);

    const [reference, setReference] =
        useState("");

    const [loading, setLoading] =
        useState(false);

    const [success, setSuccess] =
        useState(false);

    const [error, setError] =
        useState("");

    const french =
        language === "fr";

    useEffect(() => {
        const saved =
            localStorage.getItem(
                "nicethings_language"
            );

        if (
            saved === "fr" ||
            saved === "en"
        ) {
            setLanguage(saved);
        }
    }, []);

    async function copyNumber() {
        try {
            await navigator.clipboard.writeText(
                MOMO_NUMBER
            );

            setCopied(true);

            setTimeout(
                () =>
                    setCopied(false),
                1800
            );
        } catch {
            setCopied(false);
        }
    }

    async function submitPayment(
        event
    ) {
        event.preventDefault();

        setError("");

        if (!proof) {
            setError(
                french
                    ? "Ajoutez votre capture de paiement."
                    : "Please add your payment screenshot."
            );

            return;
        }

        setLoading(true);

        try {
            const visitorId =
                localStorage.getItem(
                    "nicethings_visitor_id"
                );

            if (!visitorId) {
                throw new Error(
                    french
                        ? "Session introuvable."
                        : "Visitor session not found."
                );
            }

            const formData =
                new FormData();

            formData.append(
                "visitorId",
                visitorId
            );

            formData.append(
                "transactionReference",
                reference.trim()
            );

            formData.append(
                "proof",
                proof
            );

            const response =
                await fetch(
                    "/api/payments/submit",
                    {
                        method: "POST",
                        body: formData,
                    }
                );

            const data =
                await response.json();

            if (!response.ok) {
                throw new Error(
                    data.error ||
                    "Unable to submit payment."
                );
            }

            setSuccess(
                true
            );
        } catch (error) {
            console.error(
                error
            );

            setError(
                error.message ||
                (
                    french
                        ? "Impossible d'envoyer le paiement."
                        : "Unable to submit payment."
                )
            );
        } finally {
            setLoading(false);
        }
    }

    if (success) {
        return (
            <AppShell>
                <main className="nt-access-page">
                    <div className="nt-access-success">

                        <CheckCircle2
                            size={42}
                        />

                        <h1>
                            {french
                                ? "Paiement reçu."
                                : "Payment received."}
                        </h1>

                        <p>
                            {french
                                ? "Votre paiement est en attente de vérification. Vous pourrez chercher dès que votre accès sera activé."
                                : "Your payment is waiting for verification. You can search as soon as your access is activated."}
                        </p>

                        <button
                            type="button"
                            onClick={() =>
                                window.location.href =
                                "/"
                            }
                        >
                            {french
                                ? "Retour à NiceThings"
                                : "Back to NiceThings"}
                        </button>

                    </div>
                </main>
            </AppShell>
        );
    }

    return (
        <AppShell>
            <main className="nt-access-page">

                <div className="nt-access-shell">

                    <header className="nt-access-header">
                        <div>
                            <Sparkles
                                size={17}
                            />

                            NiceThings
                        </div>

                        <div className="nt-language-switch">
                            <button
                                className={
                                    !french
                                        ? "active"
                                        : ""
                                }
                                onClick={() =>
                                    setLanguage(
                                        "en"
                                    )
                                }
                            >
                                EN
                            </button>

                            <button
                                className={
                                    french
                                        ? "active"
                                        : ""
                                }
                                onClick={() =>
                                    setLanguage(
                                        "fr"
                                    )
                                }
                            >
                                FR
                            </button>
                        </div>
                    </header>

                    <section className="nt-access-hero">

                        <div className="nt-access-icon">
                            <Sparkles
                                size={26}
                            />
                        </div>

                        <span>
                            {french
                                ? "Accès découverte"
                                : "Discovery access"}
                        </span>

                        <h1>
                            {french
                                ? "100 FCFA pour 24 heures de découvertes."
                                : "100 FCFA for 24 hours of discovery."}
                        </h1>

                        <p>
                            {french
                                ? "Un petit accès pour vous aider à trouver des endroits qui correspondent vraiment à vos envies."
                                : "A simple access pass that helps you discover places that genuinely fit what you're looking for."}
                        </p>

                    </section>

                    <div className="nt-access-card">

                        <div className="nt-payment-price">
                            <strong>
                                100
                            </strong>

                            <span>
                                FCFA
                            </span>

                            <small>
                                / 24h
                            </small>
                        </div>

                        <div className="nt-payment-number">
                            <Phone
                                size={17}
                            />

                            <div>
                                <span>
                                    {french
                                        ? "Numéro Mobile Money"
                                        : "Mobile Money number"}
                                </span>

                                <strong>
                                    {MOMO_NUMBER}
                                </strong>
                            </div>

                            <button
                                type="button"
                                onClick={
                                    copyNumber
                                }
                            >
                                {copied ? (
                                    <CheckCircle2
                                        size={16}
                                    />
                                ) : (
                                    <Copy
                                        size={16}
                                    />
                                )}
                            </button>
                        </div>

                        <div className="nt-payment-steps">

                            <PaymentStep
                                number="1"
                                text={
                                    french
                                        ? "Envoyez 100 FCFA au numéro ci-dessus."
                                        : "Send 100 FCFA to the number above."
                                }
                            />

                            <PaymentStep
                                number="2"
                                text={
                                    french
                                        ? "Prenez une capture de la transaction."
                                        : "Take a screenshot of the transaction."
                                }
                            />

                            <PaymentStep
                                number="3"
                                text={
                                    french
                                        ? "Envoyez la preuve ici."
                                        : "Upload your payment proof here."
                                }
                            />

                            <PaymentStep
                                number="4"
                                text={
                                    french
                                        ? "Nous vérifions et activons vos 24 heures."
                                        : "We verify it and activate your 24 hours."
                                }
                            />

                        </div>

                        <form
                            onSubmit={
                                submitPayment
                            }
                        >

                            <label className="nt-proof-upload">

                                <ImagePlus
                                    size={22}
                                />

                                <strong>
                                    {proof
                                        ? proof.name
                                        : french
                                            ? "Ajouter la capture de paiement"
                                            : "Add payment screenshot"}
                                </strong>

                                <span>
                                    PNG, JPG or WEBP
                                </span>

                                <input
                                    type="file"
                                    accept="image/png,image/jpeg,image/webp"
                                    onChange={(
                                        event
                                    ) =>
                                        setProof(
                                            event
                                                .target
                                                .files?.[0] ||
                                            null
                                        )
                                    }
                                />

                            </label>

                            <input
                                value={
                                    reference
                                }
                                onChange={(
                                    event
                                ) =>
                                    setReference(
                                        event
                                            .target
                                            .value
                                    )
                                }
                                placeholder={
                                    french
                                        ? "Référence de transaction (facultatif)"
                                        : "Transaction reference (optional)"
                                }
                            />

                            {error && (
                                <div className="nt-access-error">
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={
                                    loading
                                }
                                className="nt-access-submit"
                            >
                                <ShieldCheck
                                    size={17}
                                />

                                {loading
                                    ? french
                                        ? "Envoi..."
                                        : "Sending..."
                                    : french
                                        ? "Envoyer le paiement"
                                        : "Submit payment"}

                            </button>

                        </form>

                    </div>

                    <div className="nt-access-note">
                        <Clock
                            size={14}
                        />

                        {french
                            ? "Votre accès commence uniquement après validation."
                            : "Your 24-hour access begins only after approval."}
                    </div>

                </div>

            </main>
        </AppShell>
    );
}

function PaymentStep({
    number,
    text,
}) {
    return (
        <div className="nt-payment-step">

            <span>
                {number}
            </span>

            <p>
                {text}
            </p>

        </div>
    );
}