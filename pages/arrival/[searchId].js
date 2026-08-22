import { useEffect, useState } from "react";
import {
    Check,
    MapPin,
    Send,
    Sparkles,
    Star,
} from "lucide-react";

import AppShell from "../../components/layout/AppShell";

export default function ArrivalPage() {
    const [language, setLanguage] =
        useState("en");

    const [search, setSearch] =
        useState(null);

    const [spot, setSpot] =
        useState(null);

    const [rating, setRating] =
        useState(0);

    const [comment, setComment] =
        useState("");

    const [priceAccurate, setPriceAccurate] =
        useState(null);

    const [locationAccurate, setLocationAccurate] =
        useState(null);

    const [submitted, setSubmitted] =
        useState(false);

    const [loading, setLoading] =
        useState(false);

    const [error, setError] =
        useState("");

    const french =
        language === "fr";

    useEffect(() => {
        const savedLanguage =
            localStorage.getItem(
                "nicethings_language"
            );

        if (
            savedLanguage === "fr" ||
            savedLanguage === "en"
        ) {
            setLanguage(
                savedLanguage
            );
        }

        const saved =
            sessionStorage.getItem(
                "nicethings_selected_spot"
            );

        if (!saved) {
            return;
        }

        try {
            const parsed =
                JSON.parse(saved);

            setSpot(
                parsed.spot
            );

            setSearch(
                parsed
            );
        } catch (error) {
            console.error(
                error
            );
        }
    }, []);

    async function submit() {
        setError("");

        if (!rating) {
            setError(
                french
                    ? "Choisissez une note."
                    : "Please choose a rating."
            );

            return;
        }

        const visitorId =
            localStorage.getItem(
                "nicethings_visitor_id"
            );

        if (
            !visitorId ||
            !search?.searchId ||
            !spot?.id
        ) {
            setError(
                french
                    ? "Cette arrivée ne peut pas être enregistrée."
                    : "This arrival cannot be recorded."
            );

            return;
        }

        setLoading(true);

        try {
            const arrivalResponse =
                await fetch(
                    "/api/arrival",
                    {
                        method: "POST",
                        headers: {
                            "Content-Type":
                                "application/json",
                        },
                        body: JSON.stringify({
                            visitorId,
                            searchId:
                                search.searchId,
                            spotId:
                                spot.id,
                        }),
                    }
                );

            const arrivalData =
                await arrivalResponse.json();

            if (
                !arrivalResponse.ok
            ) {
                throw new Error(
                    arrivalData.error
                );
            }

            const reviewResponse =
                await fetch(
                    "/api/reviews",
                    {
                        method: "POST",
                        headers: {
                            "Content-Type":
                                "application/json",
                        },
                        body: JSON.stringify({
                            visitorId,
                            spotId:
                                spot.id,
                            arrivalId:
                                arrivalData.arrivalId,
                            rating,
                            comment,
                            priceAccurate,
                            locationAccurate,
                        }),
                    }
                );

            const reviewData =
                await reviewResponse.json();

            if (
                !reviewResponse.ok
            ) {
                throw new Error(
                    reviewData.error
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
                        ? "Impossible d'enregistrer votre avis."
                        : "Unable to save your review."
                )
            );
        } finally {
            setLoading(false);
        }
    }

    if (submitted) {
        return (
            <AppShell>
                <main className="nt-arrival-page">
                    <div className="nt-arrival-success">

                        <div className="nt-success-icon">
                            <Check
                                size={30}
                            />
                        </div>

                        <span className="nt-success-eyebrow">
                            <Sparkles
                                size={13}
                            />

                            NiceThings
                        </span>

                        <h1>
                            {french
                                ? "Merci pour votre découverte."
                                : "Thank you for discovering with us."}
                        </h1>

                        <p>
                            {french
                                ? "Votre retour aide NiceThings à devenir plus précis et plus utile."
                                : "Your feedback helps NiceThings become more accurate and useful."}
                        </p>

                        <button
                            type="button"
                            onClick={() =>
                                window.location.href =
                                "/find"
                            }
                            className="nt-arrival-primary"
                        >
                            {french
                                ? "Trouver un autre spot"
                                : "Find another spot"}
                        </button>

                    </div>
                </main>
            </AppShell>
        );
    }

    return (
        <AppShell>
            <main className="nt-arrival-page">

                <div className="nt-arrival-shell">

                    <div className="nt-arrival-top">
                        <Sparkles
                            size={17}
                        />

                        NiceThings
                    </div>

                    <div className="nt-arrival-card">

                        <div className="nt-arrival-spot-icon">
                            <MapPin
                                size={25}
                            />
                        </div>

                        <span className="nt-arrival-label">
                            {french
                                ? "Votre découverte"
                                : "Your discovery"}
                        </span>

                        <h1>
                            {spot?.name ||
                                "NiceThings spot"}
                        </h1>

                        <p>
                            {french
                                ? "Vous êtes arrivé ? Dites-nous comment c'était."
                                : "Did you make it there? Tell us how it was."}
                        </p>

                        <div className="nt-rating">

                            {[1, 2, 3, 4, 5].map(
                                (value) => (
                                    <button
                                        type="button"
                                        key={
                                            value
                                        }
                                        className={
                                            value <=
                                                rating
                                                ? "selected"
                                                : ""
                                        }
                                        onClick={() =>
                                            setRating(
                                                value
                                            )
                                        }
                                        aria-label={`${value} stars`}
                                    >
                                        <Star
                                            size={27}
                                            fill={
                                                value <=
                                                    rating
                                                    ? "currentColor"
                                                    : "none"
                                            }
                                        />
                                    </button>
                                )
                            )}

                        </div>

                        <textarea
                            value={
                                comment
                            }
                            onChange={(event) =>
                                setComment(
                                    event
                                        .target
                                        .value
                                )
                            }
                            placeholder={
                                french
                                    ? "Un petit mot ? (facultatif)"
                                    : "Anything you'd like to say? (optional)"
                            }
                        />

                        <div className="nt-accuracy">

                            <AccuracyQuestion
                                title={
                                    french
                                        ? "Le prix était-il correct ?"
                                        : "Was the price accurate?"
                                }
                                value={
                                    priceAccurate
                                }
                                onChange={
                                    setPriceAccurate
                                }
                                french={
                                    french
                                }
                            />

                            <AccuracyQuestion
                                title={
                                    french
                                        ? "L'emplacement était-il correct ?"
                                        : "Was the location accurate?"
                                }
                                value={
                                    locationAccurate
                                }
                                onChange={
                                    setLocationAccurate
                                }
                                french={
                                    french
                                }
                            />

                        </div>

                        {error && (
                            <div className="nt-arrival-error">
                                {error}
                            </div>
                        )}

                        <button
                            type="button"
                            onClick={
                                submit
                            }
                            disabled={
                                loading
                            }
                            className="nt-arrival-primary"
                        >
                            {loading
                                ? french
                                    ? "Enregistrement..."
                                    : "Saving..."
                                : french
                                    ? "Envoyer mon avis"
                                    : "Send my feedback"}

                            <Send
                                size={16}
                            />
                        </button>

                    </div>

                </div>

            </main>
        </AppShell>
    );
}

function AccuracyQuestion({
    title,
    value,
    onChange,
    french,
}) {
    return (
        <div className="nt-accuracy-question">

            <strong>
                {title}
            </strong>

            <div>
                <button
                    type="button"
                    className={
                        value === true
                            ? "active"
                            : ""
                    }
                    onClick={() =>
                        onChange(
                            true
                        )
                    }
                >
                    {french
                        ? "Oui"
                        : "Yes"}
                </button>

                <button
                    type="button"
                    className={
                        value === false
                            ? "active"
                            : ""
                    }
                    onClick={() =>
                        onChange(
                            false
                        )
                    }
                >
                    {french
                        ? "Non"
                        : "No"}
                </button>
            </div>

        </div>
    );
}