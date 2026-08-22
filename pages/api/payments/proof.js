import fs from "fs";
import path from "path";
import formidable from "formidable";

import supabaseAdmin from "../../../lib/supabaseAdmin";

export const config = {
    api: {
        bodyParser: false,
    },
};

function parseForm(req) {
    return new Promise(
        (resolve, reject) => {
            const form =
                formidable({
                    multiples: false,
                    maxFiles: 1,
                    maxFileSize:
                        5 * 1024 * 1024,
                    keepExtensions: true,
                });

            form.parse(
                req,
                (error, fields, files) => {
                    if (error) {
                        reject(
                            error
                        );
                        return;
                    }

                    resolve({
                        fields,
                        files,
                    });
                }
            );
        }
    );
}

function getField(
    value
) {
    if (
        Array.isArray(
            value
        )
    ) {
        return value[0];
    }

    return value;
}

function getFile(
    value
) {
    if (
        Array.isArray(
            value
        )
    ) {
        return value[0];
    }

    return value;
}

export default async function handler(
    req,
    res
) {
    if (req.method !== "POST") {
        return res.status(405).json({
            error:
                "Method not allowed.",
        });
    }

    let uploadedPath =
        null;

    try {
        const {
            fields,
            files,
        } =
            await parseForm(
                req
            );

        const visitorId =
            getField(
                fields.visitorId
            );

        const paymentId =
            getField(
                fields.paymentId
            );

        const proof =
            getFile(
                files.proof
            );

        if (
            !visitorId ||
            !paymentId
        ) {
            return res.status(400).json({
                error:
                    "Payment information is missing.",
            });
        }

        if (!proof) {
            return res.status(400).json({
                error:
                    "Payment proof is required.",
            });
        }

        uploadedPath =
            proof.filepath;

        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/webp",
        ];

        if (
            !allowedTypes.includes(
                proof.mimetype
            )
        ) {
            return res.status(400).json({
                error:
                    "Only JPG, PNG and WebP images are accepted.",
            });
        }

        /*
         * Verify that the payment belongs
         * to this visitor and is still pending.
         */

        const {
            data: payment,
            error: paymentError,
        } =
            await supabaseAdmin
                .from(
                    "nt_payment_requests"
                )
                .select(
                    "id,visitor_id,status"
                )
                .eq(
                    "id",
                    paymentId
                )
                .eq(
                    "visitor_id",
                    visitorId
                )
                .maybeSingle();

        if (paymentError) {
            console.error(
                paymentError
            );

            return res.status(500).json({
                error:
                    "Unable to verify payment request.",
            });
        }

        if (!payment) {
            return res.status(404).json({
                error:
                    "Payment request not found.",
            });
        }

        if (
            payment.status !==
            "PENDING"
        ) {
            return res.status(400).json({
                error:
                    "This payment request has already been processed.",
            });
        }

        /*
         * Create a private storage path.
         */

        const extension =
            path
                .extname(
                    proof.originalFilename ||
                    ""
                )
                .toLowerCase() ||
            ".jpg";

        const safeExtension =
            [
                ".jpg",
                ".jpeg",
                ".png",
                ".webp",
            ].includes(
                extension
            )
                ? extension
                : ".jpg";

        const storagePath =
            `${visitorId}/${paymentId}${safeExtension}`;

        const fileBuffer =
            await fs.promises.readFile(
                uploadedPath
            );

        /*
         * Upload to the PRIVATE
         * payment-proofs bucket.
         */

        const {
            error: uploadError,
        } =
            await supabaseAdmin.storage
                .from(
                    "nt-payment-proofs"
                )
                .upload(
                    storagePath,
                    fileBuffer,
                    {
                        contentType:
                            proof.mimetype ||
                            "image/jpeg",
                        upsert:
                            true,
                    }
                );

        if (uploadError) {
            console.error(
                "Proof upload error:",
                uploadError
            );

            return res.status(500).json({
                error:
                    "Unable to securely store your payment proof.",
            });
        }

        /*
         * Store only the private storage path
         * in the database.
         */

        const {
            error: updateError,
        } =
            await supabaseAdmin
                .from(
                    "nt_payment_requests"
                )
                .update({
                    proof_url:
                        storagePath,
                    updated_at:
                        new Date().toISOString(),
                })
                .eq(
                    "id",
                    paymentId
                )
                .eq(
                    "visitor_id",
                    visitorId
                );

        if (updateError) {
            console.error(
                "Proof database update error:",
                updateError
            );

            return res.status(500).json({
                error:
                    "The proof was uploaded but could not be registered.",
            });
        }

        return res.status(200).json({
            success: true,
            paymentId,
            message:
                "Payment proof submitted successfully.",
        });
    } catch (error) {
        console.error(
            "Payment proof error:",
            error
        );

        return res.status(500).json({
            error:
                "Unable to submit payment proof.",
        });
    } finally {
        if (
            uploadedPath
        ) {
            try {
                await fs.promises.unlink(
                    uploadedPath
                );
            } catch {
                // Temporary file cleanup failure
                // does not affect the response.
            }
        }
    }
}