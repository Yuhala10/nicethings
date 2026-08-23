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
    if (
        req.method !==
        "POST"
    ) {
        return res.status(405).json({
            error:
                "Method not allowed.",
        });
    }


    let uploadedFilePath =
        null;

    let createdAccessPassId =
        null;


    try {
        const form =
            formidable({
                multiples:
                    false,

                maxFileSize:
                    5 *
                    1024 *
                    1024,
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
                ? fields
                    .transactionReference[0]
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


        /*
         * Prevent multiple pending
         * payment requests for the
         * same visitor.
         */

        const {
            data: existingPayment,
            error: existingPaymentError,
        } =
            await supabaseAdmin
                .from(
                    "nt_payment_requests"
                )
                .select(
                    "id,status"
                )
                .eq(
                    "visitor_id",
                    visitorId
                )
                .eq(
                    "status",
                    "PENDING"
                )
                .limit(1)
                .maybeSingle();


        if (
            existingPaymentError
        ) {
            console.error(
                "Existing payment check:",
                existingPaymentError
            );

            return res.status(500).json({
                error:
                    "Unable to check your existing payment request.",
            });
        }


        if (
            existingPayment
        ) {
            return res.status(409).json({
                error:
                    "You already have a payment waiting for verification.",
                pending:
                    true,
            });
        }


        /*
         * Validate image type.
         */

        const extension =
            (
                proof.originalFilename ||
                "proof.jpg"
            )
                .split(".")
                .pop()
                .toLowerCase();


        const allowed = [
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


        /*
         * Create access pass.
         *
         * It stays PENDING until
         * an administrator approves
         * the payment.
         */

        const {
            data: accessPass,
            error: accessPassError,
        } =
            await supabaseAdmin
                .from(
                    "nt_access_passes"
                )
                .insert({
                    visitor_id:
                        visitorId,

                    amount:
                        100,

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
            accessPassError ||
            !accessPass
        ) {
            console.error(
                "Access pass:",
                accessPassError
            );

            return res.status(500).json({
                error:
                    "Unable to create access request.",
            });
        }


        createdAccessPassId =
            accessPass.id;


        /*
         * Build storage path.
         */

        const filePath =
            `${visitorId}/${accessPass.id}-${Date.now()}.${extension}`;


        uploadedFilePath =
            filePath;


        /*
         * Read uploaded proof.
         */

        const fileBuffer =
            fs.readFileSync(
                proof.filepath
            );


        /*
         * Upload proof.
         */

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

                        upsert:
                            false,
                    }
                );


        if (
            uploadError
        ) {
            console.error(
                "Payment proof upload:",
                uploadError
            );

            /*
             * Clean up the access
             * pass that was created.
             */

            await supabaseAdmin
                .from(
                    "nt_access_passes"
                )
                .delete()
                .eq(
                    "id",
                    accessPass.id
                );


            return res.status(500).json({
                error:
                    "Unable to upload payment proof.",
            });
        }


        /*
         * Create payment request.
         */

        const {
            data: payment,
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
                        accessPass.id,

                    amount:
                        100,

                    currency:
                        "XAF",

                    transaction_reference:
                        transactionReference
                            ?.trim() ||
                        null,

                    proof_url:
                        filePath,

                    status:
                        "PENDING",
                })
                .select(
                    "id"
                )
                .single();


        if (
            paymentError ||
            !payment
        ) {
            console.error(
                "Payment request:",
                paymentError
            );


            /*
             * Remove uploaded proof.
             */

            await supabaseAdmin
                .storage
                .from(
                    "nt-payment-proofs"
                )
                .remove([
                    filePath,
                ]);


            /*
             * Remove orphaned
             * access pass.
             */

            await supabaseAdmin
                .from(
                    "nt_access_passes"
                )
                .delete()
                .eq(
                    "id",
                    accessPass.id
                );


            return res.status(500).json({
                error:
                    "Unable to create payment request.",
            });
        }


        /*
         * Everything succeeded.
         */

        return res.status(201).json({
            success:
                true,

            paymentId:
                payment.id,

            accessPassId:
                accessPass.id,
        });


    } catch (
    error
    ) {
        console.error(
            "Payment submission:",
            error
        );


        /*
         * Best-effort cleanup if
         * something unexpected fails.
         */

        if (
            uploadedFilePath
        ) {
            try {
                await supabaseAdmin
                    .storage
                    .from(
                        "nt-payment-proofs"
                    )
                    .remove([
                        uploadedFilePath,
                    ]);
            } catch (
            cleanupError
            ) {
                console.error(
                    "Proof cleanup:",
                    cleanupError
                );
            }
        }


        if (
            createdAccessPassId
        ) {
            try {
                await supabaseAdmin
                    .from(
                        "nt_access_passes"
                    )
                    .delete()
                    .eq(
                        "id",
                        createdAccessPassId
                    );
            } catch (
            cleanupError
            ) {
                console.error(
                    "Access cleanup:",
                    cleanupError
                );
            }
        }


        return res.status(500).json({
            error:
                "Unable to submit payment.",
        });
    }
}