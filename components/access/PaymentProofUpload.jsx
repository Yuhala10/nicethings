import { useState } from "react";
import {
    CheckCircle2,
    ImagePlus,
    Loader2,
    Upload,
} from "lucide-react";

export default function PaymentProofUpload({
    visitorId,
    paymentId,
    language = "en",
    onSubmitted,
}) {
    const french =
        language === "fr";

    const [file, setFile] =
        useState(null);

    const [preview, setPreview] =
        useState("");

    const [loading, setLoading] =
        useState(false);

    const [error, setError] =
        useState("");

    function handleFileChange(
        event
    ) {
        const selected =
            event.target.files?.[0];

        if (!selected) {
            return;
        }

        setError("");

        if (
            !selected.type.startsWith(
                "image/"
            )
        ) {
            setError(
                french
                    ? "Veuillez sélectionner une image."
                    : "Please select an image."
            );
            return;
        }

        if (
            selected.size >
            5 * 1024 * 1024
        ) {
            setError(
                french
                    ? "L'image doit faire moins de 5 Mo."
                    : "The image must be smaller than 5 MB."
            );
            return;
        }

        setFile(selected);

        setPreview(
            URL.createObjectURL(
                selected
            )
        );
    }

    async function submitProof() {
        if (!file) {
            setError(
                french
                    ? "Ajoutez votre capture de paiement."
                    : "Please add your payment screenshot."
            );

            return;
        }

        if (!visitorId || !paymentId) {
            setError(
                french
                    ? "Votre session de paiement est invalide."
                    : "Your payment session is invalid."
            );

            return;
        }

        setLoading(true);
        setError("");

        try {
            const formData =
                new FormData();

            formData.append(
                "visitorId",
                visitorId
            );

            formData.append(
                "paymentId",
                paymentId
            );

            formData.append(
                "proof",
                file
            );

            const response =
                await fetch(
                    "/api/payments/proof",
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
                    "Unable to submit proof."
                );
            }

            onSubmitted?.(
                data
            );
        } catch (err) {
            console.error(err);

            setError(
                err.message ||
                (french
                    ? "Impossible d'envoyer la preuve."
                    : "Unable to submit payment proof.")
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="nt-proof-card">

            <div className="nt-proof-header">
                <div className="nt-access-icon">
                    <ImagePlus
                        size={25}
                    />
                </div>

                <div>
                    <h2>
                        {french
                            ? "Confirmez votre paiement"
                            : "Confirm your payment"}
                    </h2>

                    <p>
                        {french
                            ? "Envoyez une capture claire de votre transaction MoMo."
                            : "Upload a clear screenshot of your MoMo transaction."}
                    </p>
                </div>
            </div>

            <label
                className="nt-upload-zone"
                htmlFor="payment-proof"
            >
                {preview ? (
                    <img
                        src={preview}
                        alt={
                            french
                                ? "Preuve de paiement"
                                : "Payment proof"
                        }
                        className="nt-proof-preview"
                    />
                ) : (
                    <>
                        <Upload
                            size={27}
                        />

                        <strong>
                            {french
                                ? "Ajouter une capture"
                                : "Add screenshot"}
                        </strong>

                        <span>
                            JPG, PNG • 5 MB max
                        </span>
                    </>
                )}

                <input
                    id="payment-proof"
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={
                        handleFileChange
                    }
                    hidden
                />
            </label>

            {error && (
                <div className="nt-proof-error">
                    {error}
                </div>
            )}

            <button
                type="button"
                className="nt-button nt-button-primary"
                style={{
                    width: "100%",
                }}
                disabled={
                    loading ||
                    !file
                }
                onClick={
                    submitProof
                }
            >
                {loading ? (
                    <>
                        <Loader2
                            size={17}
                            className="nt-spin"
                        />

                        {french
                            ? "Envoi..."
                            : "Submitting..."}
                    </>
                ) : (
                    <>
                        <CheckCircle2
                            size={17}
                        />

                        {french
                            ? "Envoyer la preuve"
                            : "Submit proof"}
                    </>
                )}
            </button>
        </div>
    );
}