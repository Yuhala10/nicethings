import {
    useEffect,
    useState,
} from "react";

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
import {
    ACCESS_PRICE,
    ACCESS_DURATION_HOURS,
    MOMO_NUMBER,
    isLaunchFree,
} from "../lib/access";
import { useLanguage } from "../lib/i18n";


export default function AccessPage() {
    const {
        language,
        setLanguage,
        t,
    } = useLanguage();

    const [
        copied,
        setCopied,
    ] = useState(false);

    const [
        proof,
        setProof,
    ] = useState(null);

    const [
        reference,
        setReference,
    ] = useState("");

    const [
        loading,
        setLoading,
    ] = useState(false);

    const [
        success,
        setSuccess,
    ] = useState(false);

    const [
        error,
        setError,
    ] = useState("");

    const french =
        language === "fr";


    /* =====================================================
       DOCUMENT LANGUAGE
    ====================================================== */

    useEffect(() => {
        if (
            typeof document ===
            "undefined"
        ) {
            return;
        }

        document.documentElement.lang =
            french
                ? "fr"
                : "en";
    }, [french]);


    /* =====================================================
       COPY MOBILE MONEY NUMBER
    ====================================================== */

    async function copyNumber() {
        try {
            if (
                typeof navigator ===
                "undefined" ||
                !navigator.clipboard
            ) {
                return;
            }

            await navigator.clipboard.writeText(
                MOMO_NUMBER
            );

            setCopied(true);

            setTimeout(() => {
                setCopied(false);
            }, 1800);
        } catch (copyError) {
            console.error(
                "Copy number error:",
                copyError
            );

            setCopied(false);
        }
    }


    /* =====================================================
       SUBMIT PAYMENT
    ====================================================== */

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


        /*
         * Basic client-side validation.
         *
         * The API performs the real validation
         * on the server.
         */

        if (
            ![
                "image/png",
                "image/jpeg",
                "image/webp",
            ].includes(
                proof.type
            )
        ) {
            setError(
                french
                    ? "Format d'image non pris en charge."
                    : "Unsupported image format."
            );

            return;
        }


        if (
            proof.size >
            5 * 1024 * 1024
        ) {
            setError(
                french
                    ? "L'image doit faire moins de 5 Mo."
                    : "The image must be smaller than 5 MB."
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
                        method:
                            "POST",

                        body:
                            formData,
                    }
                );


            let data = {};

            try {
                data =
                    await response.json();
            } catch {
                data = {};
            }


            if (
                !response.ok
            ) {
                throw new Error(
                    data.error ||
                    (
                        french
                            ? "Impossible d'envoyer le paiement."
                            : "Unable to submit payment."
                    )
                );
            }


            setSuccess(true);
        } catch (
        submitError
        ) {
            console.error(
                "Payment submission error:",
                submitError
            );

            setError(
                submitError.message ||
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


    /* =====================================================
       LAUNCH WEEK
    ====================================================== */

    if (
        isLaunchFree()
    ) {
        return (
            <AppShell>

                <main
                    className="nt-access-page"
                >

                    <div
                        className="nt-access-shell"
                    >

                        <header
                            className="nt-access-header"
                        >

                            <div>
                                <Sparkles
                                    size={17}
                                />

                                <span>
                                    NiceThings
                                </span>
                            </div>


                            <LanguageSwitch
                                language={
                                    language
                                }
                                setLanguage={
                                    setLanguage
                                }
                            />

                        </header>


                        <section
                            className="nt-access-hero"
                        >

                            <div
                                className="nt-access-icon"
                            >
                                <Sparkles
                                    size={30}
                                />
                            </div>


                            <span>
                                {french
                                    ? "Semaine de lancement"
                                    : "Launch week"}
                            </span>


                            <h1>
                                {french
                                    ? "NiceThings est gratuit !"
                                    : "NiceThings is free!"}
                            </h1>


                            <p>
                                {french
                                    ? "Profitez de vos découvertes gratuitement pendant notre semaine de lancement."
                                    : "Enjoy NiceThings for free during our launch week."}
                            </p>

                        </section>


                        <div
                            className="nt-access-card"
                        >

                            <div
                                className="nt-access-success"
                            >

                                <CheckCircle2
                                    size={48}
                                />


                                <h2>
                                    {french
                                        ? "Aucun paiement nécessaire"
                                        : "No payment needed"}
                                </h2>


                                <p>
                                    {french
                                        ? "Vous pouvez chercher et découvrir des endroits sans payer pendant la semaine de lancement."
                                        : "You can search and discover places without paying during launch week."}
                                </p>


                                <button
                                    type="button"
                                    className="nt-access-submit"
                                    onClick={() => {
                                        window.location.href =
                                            "/find";
                                    }}
                                >
                                    {french
                                        ? "Commencer à découvrir"
                                        : "Start discovering"}
                                </button>

                            </div>

                        </div>


                        <div
                            className="nt-access-note"
                        >

                            <Clock
                                size={14}
                            />

                            <span>
                                {french
                                    ? `Le paiement de ${ACCESS_PRICE} FCFA pour ${ACCESS_DURATION_HOURS} heures commencera après la semaine de lancement.`
                                    : `The ${ACCESS_PRICE} FCFA / ${ACCESS_DURATION_HOURS}-hour access will begin after launch week.`}
                            </span>

                        </div>

                    </div>

                </main>

            </AppShell>
        );
    }


    /* =====================================================
       PAYMENT SUCCESS
    ====================================================== */

    if (
        success
    ) {
        return (
            <AppShell>

                <main
                    className="nt-access-page"
                >

                    <div
                        className="nt-access-shell"
                    >

                        <div
                            className="nt-access-success"
                        >

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
                                onClick={() => {
                                    window.location.href =
                                        "/";
                                }}
                            >
                                {french
                                    ? "Retour à NiceThings"
                                    : "Back to NiceThings"}
                            </button>

                        </div>

                    </div>

                </main>

            </AppShell>
        );
    }


    /* =====================================================
       NORMAL PAID ACCESS
    ====================================================== */

    return (
        <AppShell>

            <main
                className="nt-access-page"
            >

                <div
                    className="nt-access-shell"
                >

                    <header
                        className="nt-access-header"
                    >

                        <div>
                            <Sparkles
                                size={17}
                            />

                            <span>
                                NiceThings
                            </span>
                        </div>


                        <LanguageSwitch
                            language={
                                language
                            }
                            setLanguage={
                                setLanguage
                            }
                        />

                    </header>


                    <section
                        className="nt-access-hero"
                    >

                        <div
                            className="nt-access-icon"
                        >
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
                                ? `${ACCESS_PRICE} FCFA pour ${ACCESS_DURATION_HOURS} heures de découvertes.`
                                : `${ACCESS_PRICE} FCFA for ${ACCESS_DURATION_HOURS} hours of discovery.`}
                        </h1>


                        <p>
                            {french
                                ? "Un petit accès pour vous aider à trouver des endroits qui correspondent vraiment à vos envies."
                                : "A simple access pass that helps you discover places that genuinely fit what you're looking for."}
                        </p>

                    </section>


                    <div
                        className="nt-access-card"
                    >

                        {/* PRICE */}

                        <div
                            className="nt-payment-price"
                        >

                            <strong>
                                {ACCESS_PRICE}
                            </strong>

                            <span>
                                FCFA
                            </span>

                            <small>
                                /{" "}
                                {ACCESS_DURATION_HOURS}
                                h
                            </small>

                        </div>


                        {/* MOBILE MONEY */}

                        <div
                            className="nt-payment-number"
                        >

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
                                aria-label={
                                    french
                                        ? "Copier le numéro"
                                        : "Copy number"
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


                        {/* PAYMENT STEPS */}

                        <div
                            className="nt-payment-steps"
                        >

                            <PaymentStep
                                number="1"
                                text={
                                    french
                                        ? `Envoyez ${ACCESS_PRICE} FCFA au numéro ci-dessus.`
                                        : `Send ${ACCESS_PRICE} FCFA to the number above.`
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
                                        ? "Nous vérifions et activons vos heures d'accès."
                                        : "We verify it and activate your access."
                                }
                            />

                        </div>


                        {/* PAYMENT FORM */}

                        <form
                            onSubmit={
                                submitPayment
                            }
                        >

                            <label
                                className="nt-proof-upload"
                            >

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
                                    ) => {

                                        const file =
                                            event
                                                .target
                                                .files?.[0] ||
                                            null;

                                        setError("");

                                        setProof(
                                            file
                                        );
                                    }}
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
                                maxLength={
                                    120
                                }
                            />


                            {error && (
                                <div
                                    className="nt-access-error"
                                    role="alert"
                                >
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


                    <div
                        className="nt-access-note"
                    >

                        <Clock
                            size={14}
                        />

                        <span>
                            {french
                                ? `Votre accès de ${ACCESS_DURATION_HOURS} heures commence uniquement après validation.`
                                : `Your ${ACCESS_DURATION_HOURS}-hour access begins only after approval.`}
                        </span>

                    </div>

                </div>

            </main>

        </AppShell>
    );
}


/* =====================================================
   LANGUAGE SWITCH
====================================================== */

function LanguageSwitch({
    language,
    setLanguage,
}) {
    return (
        <div
            className="nt-language-switch"
        >

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
                aria-pressed={
                    language ===
                    "en"
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
                aria-pressed={
                    language ===
                    "fr"
                }
            >
                FR
            </button>

        </div>
    );
}


/* =====================================================
   PAYMENT STEP
====================================================== */

function PaymentStep({
    number,
    text,
}) {
    return (
        <div
            className="nt-payment-step"
        >

            <span>
                {number}
            </span>

            <p>
                {text}
            </p>

        </div>
    );
}