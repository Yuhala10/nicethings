import { useState } from "react";
import {
    ArrowLeft,
    Check,
    MapPin,
    Send,
    Sparkles,
} from "lucide-react";

import AppShell from "../components/layout/AppShell";

export default function IntroducePage() {
    const [language, setLanguage] =
        useState("en");

    const [form, setForm] =
        useState({
            name: "",
            category: "",
            description: "",
            address: "",
            neighborhood: "",
            city: "Yaoundé",
            phone: "",
            whatsapp: "",
            estimatedPrice: "",
            submittedByName: "",
            submittedByPhone: "",
        });

    const [loading, setLoading] =
        useState(false);

    const [submitted, setSubmitted] =
        useState(false);

    const [error, setError] =
        useState("");

    const french =
        language === "fr";

    function update(
        field,
        value
    ) {
        setForm(
            (current) => ({
                ...current,
                [field]:
                    value,
            })
        );
    }

    async function submit(
        event
    ) {
        event.preventDefault();

        setError("");

        if (
            !form.name.trim() ||
            !form.address.trim()
        ) {
            setError(
                french
                    ? "Le nom et l'emplacement sont nécessaires."
                    : "The name and location are required."
            );

            return;
        }

        setLoading(true);

        try {
            const visitorId =
                localStorage.getItem(
                    "nicethings_visitor_id"
                );

            const response =
                await fetch(
                    "/api/spots/introduce",
                    {
                        method: "POST",
                        headers: {
                            "Content-Type":
                                "application/json",
                        },
                        body: JSON.stringify({
                            visitorId,
                            ...form,
                        }),
                    }
                );

            const data =
                await response.json();

            if (!response.ok) {
                throw new Error(
                    data.error ||
                    "Submission failed."
                );
            }

            setSubmitted(
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
                        ? "Impossible d'envoyer ce spot."
                        : "Unable to submit this spot."
                )
            );
        } finally {
            setLoading(false);
        }
    }

    if (submitted) {
        return (
            <AppShell>
                <main className="nt-introduce-page">
                    <div className="nt-introduce-success">

                        <div className="nt-success-icon">
                            <Check
                                size={30}
                            />
                        </div>

                        <Sparkles
                            size={17}
                        />

                        <h1>
                            {french
                                ? "Merci pour cette belle découverte."
                                : "Thank you for sharing a great discovery."}
                        </h1>

                        <p>
                            {french
                                ? "Notre équipe va vérifier les informations avant de publier le spot."
                                : "Our team will verify the information before publishing the spot."}
                        </p>

                        <button
                            type="button"
                            className="nt-introduce-primary"
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
            <main className="nt-introduce-page">

                <div className="nt-introduce-shell">

                    <header className="nt-introduce-header">

                        <button
                            type="button"
                            onClick={() =>
                                window.history.back()
                            }
                        >
                            <ArrowLeft
                                size={17}
                            />

                            {french
                                ? "Retour"
                                : "Back"}
                        </button>

                        <div>
                            <Sparkles
                                size={16}
                            />

                            NiceThings
                        </div>

                        <div className="nt-language-switch">
                            <button
                                type="button"
                                className={
                                    language ===
                                        "en"
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
                                type="button"
                                className={
                                    language ===
                                        "fr"
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

                    <section className="nt-introduce-hero">

                        <div className="nt-introduce-eyebrow">
                            <MapPin
                                size={13}
                            />

                            {french
                                ? "Partager une découverte"
                                : "Share a discovery"}
                        </div>

                        <h1>
                            {french
                                ? "Vous connaissez un endroit qui mérite d'être découvert ?"
                                : "Know a place worth discovering?"}
                        </h1>

                        <p>
                            {french
                                ? "Présentez-le à NiceThings. Nous vérifierons les informations avant de le rendre visible."
                                : "Introduce it to NiceThings. We'll verify the information before making it visible."}
                        </p>

                    </section>

                    <form
                        className="nt-introduce-form"
                        onSubmit={
                            submit
                        }
                    >

                        <FormInput
                            label={
                                french
                                    ? "Nom du spot"
                                    : "Spot name"
                            }
                            required
                            value={
                                form.name
                            }
                            onChange={(value) =>
                                update(
                                    "name",
                                    value
                                )
                            }
                            placeholder={
                                french
                                    ? "Ex. Chez Mama"
                                    : "e.g. Chez Mama"
                            }
                        />

                        <FormInput
                            label={
                                french
                                    ? "Catégorie"
                                    : "Category"
                            }
                            value={
                                form.category
                            }
                            onChange={(value) =>
                                update(
                                    "category",
                                    value
                                )
                            }
                            placeholder={
                                french
                                    ? "Restaurant, grill, café..."
                                    : "Restaurant, grill, café..."
                            }
                        />

                        <FormInput
                            label={
                                french
                                    ? "Quartier"
                                    : "Neighborhood"
                            }
                            value={
                                form.neighborhood
                            }
                            onChange={(value) =>
                                update(
                                    "neighborhood",
                                    value
                                )
                            }
                            placeholder="Bastos"
                        />

                        <FormInput
                            label={
                                french
                                    ? "Adresse"
                                    : "Address"
                            }
                            required
                            value={
                                form.address
                            }
                            onChange={(value) =>
                                update(
                                    "address",
                                    value
                                )
                            }
                            placeholder={
                                french
                                    ? "Adresse ou indication précise"
                                    : "Address or clear directions"
                            }
                        />

                        <FormInput
                            label={
                                french
                                    ? "Ville"
                                    : "City"
                            }
                            value={
                                form.city
                            }
                            onChange={(value) =>
                                update(
                                    "city",
                                    value
                                )
                            }
                        />

                        <FormInput
                            label={
                                french
                                    ? "Dépense approximative"
                                    : "Approximate spend"
                            }
                            value={
                                form.estimatedPrice
                            }
                            onChange={(value) =>
                                update(
                                    "estimatedPrice",
                                    value
                                )
                            }
                            type="number"
                            placeholder="2000"
                        />

                        <FormInput
                            label={
                                french
                                    ? "Téléphone du spot"
                                    : "Spot phone"
                            }
                            value={
                                form.phone
                            }
                            onChange={(value) =>
                                update(
                                    "phone",
                                    value
                                )
                            }
                        />

                        <FormInput
                            label="WhatsApp"
                            value={
                                form.whatsapp
                            }
                            onChange={(value) =>
                                update(
                                    "whatsapp",
                                    value
                                )
                            }
                        />

                        <div className="nt-introduce-divider">
                            <span>
                                {french
                                    ? "À propos de vous"
                                    : "About you"}
                            </span>
                        </div>

                        <FormInput
                            label={
                                french
                                    ? "Votre nom"
                                    : "Your name"
                            }
                            value={
                                form.submittedByName
                            }
                            onChange={(value) =>
                                update(
                                    "submittedByName",
                                    value
                                )
                            }
                        />

                        <FormInput
                            label={
                                french
                                    ? "Votre téléphone"
                                    : "Your phone"
                            }
                            value={
                                form.submittedByPhone
                            }
                            onChange={(value) =>
                                update(
                                    "submittedByPhone",
                                    value
                                )
                            }
                        />

                        <div>
                            <label>
                                {french
                                    ? "Décrivez le spot"
                                    : "Tell us about the place"}
                            </label>

                            <textarea
                                value={
                                    form.description
                                }
                                onChange={(
                                    event
                                ) =>
                                    update(
                                        "description",
                                        event
                                            .target
                                            .value
                                    )
                                }
                                placeholder={
                                    french
                                        ? "Pourquoi aimez-vous cet endroit ?"
                                        : "Why do you like this place?"
                                }
                            />
                        </div>

                        {error && (
                            <div className="nt-introduce-error">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={
                                loading
                            }
                            className="nt-introduce-primary"
                        >
                            {loading
                                ? french
                                    ? "Envoi..."
                                    : "Sending..."
                                : french
                                    ? "Présenter ce spot"
                                    : "Introduce this spot"}

                            <Send
                                size={16}
                            />
                        </button>

                    </form>

                </div>

            </main>
        </AppShell>
    );
}

function FormInput({
    label,
    value,
    onChange,
    placeholder,
    type = "text",
    required = false,
}) {
    return (
        <div>
            <label>
                {label}
                {required && (
                    <span>
                        {" "}
                        *
                    </span>
                )}
            </label>

            <input
                type={type}
                value={value}
                placeholder={
                    placeholder
                }
                required={
                    required
                }
                onChange={(event) =>
                    onChange(
                        event.target
                            .value
                    )
                }
            />
        </div>
    );
}