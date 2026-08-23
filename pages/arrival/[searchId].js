import { useEffect, useState } from "react";

import {
    Check,
    MapPin,
    Send,
    Sparkles,
    Star,
} from "lucide-react";

import AppShell from "../../components/layout/AppShell";
import { useLanguage } from "../../lib/i18n";


export default function ArrivalPage() {
    const {
        language,
        setLanguage,
    } = useLanguage();

    const [search, setSearch] =
        useState(null);

    const [spot, setSpot] =
        useState(null);

    const [rating, setRating] =
        useState(0);

    const [comment, setComment] =
        useState("");

    const [
        priceAccurate,
        setPriceAccurate,
    ] = useState(null);

    const [
        locationAccurate,
        setLocationAccurate,
    ] = useState(null);

    const [submitted, setSubmitted] =
        useState(false);

    const [loading, setLoading] =
        useState(false);

    const [error, setError] =
        useState("");

    const french =
        language === "fr";


    /* =====================================================
       LOAD SELECTED SPOT
    ====================================================== */

    useEffect(() => {
        if (
            typeof window ===
            "undefined"
        ) {
            return;
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
                JSON.parse(
                    saved
                );

            if (
                parsed &&
                parsed.spot
            ) {
                setSpot(
                    parsed.spot
                );
            }

            setSearch(
                parsed
            );
        } catch (
        loadError
        ) {
            console.error(
                "Arrival session error:",
                loadError
            );

            setError(
                french
                    ? "Impossible de charger cette découverte."
                    : "Unable to load this discovery."
            );
        }
    }, [french]);


    /* =====================================================
       SUBMIT ARRIVAL + REVIEW
    ====================================================== */

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
            /* =============================================
               ARRIVAL
            ============================================== */

            const arrivalResponse =
                await fetch(
                    "/api/arrival",
                    {
                        method:
                            "POST",

                        headers: {
                            "Content-Type":
                                "application/json",
                        },

                        body:
                            JSON.stringify({
                                visitorId,
                                searchId:
                                    search.searchId,
                                spotId:
                                    spot.id,
                            }),
                    }
                );


            let arrivalData =
                {};

            try {
                arrivalData =
                    await arrivalResponse.json();
            } catch {
                arrivalData =
                    {};
            }


            if (
                !arrivalResponse.ok
            ) {
                throw new Error(
                    arrivalData.error ||
                    (
                        french
                            ? "Impossible d'enregistrer votre arrivée."
                            : "Unable to record your arrival."
                    )
                );
            }


            /* =============================================
               REVIEW
            ============================================== */

            const reviewResponse =
                await fetch(
                    "/api/reviews",
                    {
                        method:
                            "POST",

                        headers: {
                            "Content-Type":
                                "application/json",
                        },

                        body:
                            JSON.stringify({
                                visitorId,

                                spotId:
                                    spot.id,

                                arrivalId:
                                    arrivalData.arrivalId,

                                rating,

                                comment:
                                    comment.trim(),

                                priceAccurate,

                                locationAccurate,
                            }),
                    }
                );


            let reviewData =
                {};

            try {
                reviewData =
                    await reviewResponse.json();
            } catch {
                reviewData =
                    {};
            }


            if (
                !reviewResponse.ok
            ) {
                throw new Error(
                    reviewData.error ||
                    (
                        french
                            ? "Impossible d'enregistrer votre avis."
                            : "Unable to save your review."
                    )
                );
            }


            setSubmitted(
                true
            );
        } catch (
        submitError
        ) {
            console.error(
                "Arrival/review error:",
                submitError
            );

            setError(
                submitError.message ||
                (
                    french
                        ? "Impossible d'enregistrer votre avis."
                        : "Unable to save your review."
                )
            );
        } finally {
            setLoading(
                false
            );
        }
    }


    /* =====================================================
       INVALID / MISSING ARRIVAL
    ====================================================== */

    if (
        !spot ||
        !search?.searchId
    ) {
        return (
            <AppShell>

                <main
                    className="nt-arrival-page"
                >

                    <div
                        className="nt-arrival-shell"
                    >

                        <div
                            className="nt-arrival-card"
                        >

                            <div
                                className="nt-arrival-spot-icon"
                            >
                                <MapPin
                                    size={25}
                                />
                            </div>


                            <span
                                className="nt-arrival-label"
                            >
                                NiceThings
                            </span>


                            <h1>
                                {french
                                    ? "Découverte introuvable"
                                    : "Discovery not found"}
                            </h1>


                            <p>
                                {french
                                    ? "Cette arrivée ne contient plus les informations nécessaires. Retournez à la recherche pour continuer."
                                    : "This arrival no longer contains the information needed. Return to search to continue."}
                            </p>


                            <button
                                type="button"
                                onClick={() => {
                                    window.location.href =
                                        "/find";
                                }}
                                className="nt-arrival-primary"
                            >
                                {french
                                    ? "Retour à la recherche"
                                    : "Back to search"}
                            </button>

                        </div>

                    </div>

                </main>

            </AppShell>
        );
    }


    /* =====================================================
       SUCCESS
    ====================================================== */

    if (
        submitted
    ) {
        return (
            <AppShell>

                <main
                    className="nt-arrival-page"
                >

                    <div
                        className="nt-arrival-success"
                    >

                        <div
                            className="nt-success-icon"
                        >
                            <Check
                                size={30}
                            />
                        </div>


                        <span
                            className="nt-success-eyebrow"
                        >

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
                            onClick={() => {
                                window.location.href =
                                    "/find";
                            }}
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


    /* =====================================================
       REVIEW FORM
    ====================================================== */

    return (
        <AppShell>

            <main
                className="nt-arrival-page"
            >

                <div
                    className="nt-arrival-shell"
                >

                    <div
                        className="nt-arrival-top"
                    >

                        <Sparkles
                            size={17}
                        />

                        NiceThings

                    </div>


                    <div
                        className="nt-arrival-card"
                    >

                        <div
                            className="nt-arrival-spot-icon"
                        >
                            <MapPin
                                size={25}
                            />
                        </div>


                        <span
                            className="nt-arrival-label"
                        >
                            {french
                                ? "Votre découverte"
                                : "Your discovery"}
                        </span>


                        <h1>
                            {spot.name}
                        </h1>


                        <p>
                            {french
                                ? "Vous êtes arrivé ? Dites-nous comment c'était."
                                : "Did you make it there? Tell us how it was."}
                        </p>


                        {/* =========================================
                            RATING
                        ========================================== */}

                        <div
                            className="nt-rating"
                            role="radiogroup"
                            aria-label={
                                french
                                    ? "Note"
                                    : "Rating"
                            }
                        >

                            {[
                                1,
                                2,
                                3,
                                4,
                                5,
                            ].map(
                                value => (

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
                                        aria-label={`${value} ${value ===
                                                1
                                                ? "star"
                                                : "stars"
                                            }`}
                                        aria-pressed={
                                            value ===
                                            rating
                                        }
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


                        {/* =========================================
                            COMMENT
                        ========================================== */}

                        <textarea
                            value={
                                comment
                            }
                            onChange={event =>
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
                            maxLength={
                                1000
                            }
                        />


                        {/* =========================================
                            ACCURACY
                        ========================================== */}

                        <div
                            className="nt-accuracy"
                        >

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
                            <div
                                className="nt-arrival-error"
                                role="alert"
                            >
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


/* =====================================================
   ACCURACY QUESTION
====================================================== */

function AccuracyQuestion({
    title,
    value,
    onChange,
    french,
}) {
    return (
        <div
            className="nt-accuracy-question"
        >

            <strong>
                {title}
            </strong>


            <div>

                <button
                    type="button"
                    className={
                        value ===
                            true
                            ? "active"
                            : ""
                    }
                    onClick={() =>
                        onChange(
                            true
                        )
                    }
                    aria-pressed={
                        value ===
                        true
                    }
                >
                    {french
                        ? "Oui"
                        : "Yes"}
                </button>


                <button
                    type="button"
                    className={
                        value ===
                            false
                            ? "active"
                            : ""
                    }
                    onClick={() =>
                        onChange(
                            false
                        )
                    }
                    aria-pressed={
                        value ===
                        false
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