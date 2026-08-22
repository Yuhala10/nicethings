import formidable from "formidable";
import fs from "fs";
import supabaseAdmin from "../../../lib/supabaseAdmin";

export const config = {
    api: {
        bodyParser: false,
    },
};

export default async function handler(
    req,
    res
) {
    if (req.method !== "POST") {
        return res.status(405).json({
            error: "Method not allowed.",
        });
    }

    try {
        const form =
            formidable({
                multiples: false,
                maxFileSize:
                    5 * 1024 * 1024,
            });

        const [
            fields,
            files,
        ] =
            await form.parse(
                req
            );

        const visitorId =
            Array.isArray(
                fields.visitorId
            )
                ? fields.visitorId[0]
                : fields.visitorId;

        const transactionReference =
            Array.isArray(
                fields.transactionReference
            )
                ? fields.transactionReference[0]
                : fields.transactionReference;

        const proof =
            Array.isArray(
                files.proof
            )
                ? files.proof[0]
                : files.proof;

        if (!visitorId) {
            return res.status(400).json({
                error:
                    "Visitor session is required.",
            });
        }

        if (!proof) {
            return res.status(400).json({
                error:
                    "Payment proof is required.",
            });
        }

        const extension =
            (
                proof.originalFilename ||
                "proof.jpg"
            )
                .split(".")
                .pop()
                .toLowerCase();

        const allowed =
            [
                "jpg",
                "jpeg",
                "png",
                "webp",
            ];

        if (
            !allowed.includes(
                extension
            )
        ) {
            return res.status(400).json({
                error:
                    "Unsupported image format.",
            });
        }

        const accessPass =
            await supabaseAdmin
                .from(
                    "nt_access_passes"
                )
                .insert({
                    visitor_id:
                        visitorId,
                    amount: 100,
                    currency:
                        "XAF",
                    status:
                        "PENDING",
                })
                .select(
                    "id"
                )
                .single();

        if (
            accessPass.error
        ) {
            console.error(
                accessPass.error
            );

            return res.status(500).json({
                error:
                    "Unable to create access request.",
            });
        }

        const filePath =
            `${visitorId}/${accessPass.data.id}-${Date.now()}.${extension}`;

        const fileBuffer =
            fs.readFileSync(
                proof.filepath
            );

        const {
            error: uploadError,
        } =
            await supabaseAdmin
                .storage
                .from(
                    "nt-payment-proofs"
                )
                .upload(
                    filePath,
                    fileBuffer,
                    {
                        contentType:
                            proof.mimetype ||
                            "image/jpeg",
                        upsert: false,
                    }
                );

        if (uploadError) {
            console.error(
                uploadError
            );

            return res.status(500).json({
                error:
                    "Unable to upload payment proof.",
            });
        }

        const {
            error: paymentError,
        } =
            await supabaseAdmin
                .from(
                    "nt_payment_requests"
                )
                .insert({
                    visitor_id:
                        visitorId,

                    access_pass_id:
                        accessPass
                            .data
                            .id,

                    amount: 100,

                    currency:
                        "XAF",

                    transaction_reference:
                        transactionReference?.trim() ||
                        null,

                    proof_url:
                        filePath,

                    status:
                        "PENDING",
                });

        if (paymentError) {
            console.error(
                paymentError
            );

            await supabaseAdmin
                .storage
                .from(
                    "nt-payment-proofs"
                )
                .remove([
                    filePath,
                ]);

            return res.status(500).json({
                error:
                    "Unable to create payment request.",
            });
        }

        return res.status(201).json({
            success: true,
        });
    } catch (error) {
        console.error(
            "Payment submission:",
            error
        );

        return res.status(500).json({
            error:
                "Unable to submit payment.",
        });
    }
}