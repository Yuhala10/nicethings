import supabaseAdmin from "../../../lib/supabaseAdmin";
import { requireAdmin } from "../../../lib/adminAuth";

export default async function handler(
    req,
    res
) {
    if (
        !requireAdmin(
            req,
            res
        )
    ) {
        return;
    }

    if (req.method === "GET") {
        return getPayments(
            req,
            res
        );
    }

    if (req.method === "POST") {
        return reviewPayment(
            req,
            res
        );
    }

    return res.status(405).json({
        error:
            "Method not allowed.",
    });
}

async function getPayments(
    req,
    res
) {
    const {
        data,
        error,
    } = await supabaseAdmin
        .from(
            "nt_payment_requests"
        )
        .select(`
            id,
            visitor_id,
            access_pass_id,
            amount,
            currency,
            transaction_reference,
            proof_url,
            status,
            admin_note,
            created_at,
            reviewed_at
        `)
        .order(
            "created_at",
            {
                ascending:
                    false,
            }
        );

    if (error) {
        console.error(error);

        return res.status(500).json({
            error:
                "Unable to load payments.",
        });
    }

    const payments =
        await Promise.all(
            (data || []).map(
                async (
                    payment
                ) => {
                    let proofUrl =
                        null;

                    if (
                        payment.proof_url
                    ) {
                        const {
                            data: signed,
                        } =
                            await supabaseAdmin
                                .storage
                                .from(
                                    "nt-payment-proofs"
                                )
                                .createSignedUrl(
                                    payment.proof_url,
                                    600
                                );

                        proofUrl =
                            signed?.signedUrl ||
                            null;
                    }

                    return {
                        ...payment,
                        proofUrl,
                    };
                }
            )
        );

    return res.status(200).json({
        payments,
    });
}

async function reviewPayment(
    req,
    res
) {
    const {
        paymentId,
        decision,
        adminNote,
    } = req.body || {};

    if (
        !paymentId ||
        ![
            "APPROVE",
            "REJECT",
        ].includes(
            decision
        )
    ) {
        return res.status(400).json({
            error:
                "Invalid payment review.",
        });
    }

    const {
        data: payment,
        error: paymentError,
    } =
        await supabaseAdmin
            .from(
                "nt_payment_requests"
            )
            .select(
                "id,access_pass_id,status"
            )
            .eq(
                "id",
                paymentId
            )
            .maybeSingle();

    if (paymentError) {
        console.error(
            paymentError
        );

        return res.status(500).json({
            error:
                "Unable to load payment.",
        });
    }

    if (!payment) {
        return res.status(404).json({
            error:
                "Payment not found.",
        });
    }

    if (
        payment.status !==
        "PENDING"
    ) {
        return res.status(409).json({
            error:
                "This payment has already been reviewed.",
        });
    }

    const now =
        new Date();

    if (
        decision ===
        "REJECT"
    ) {
        await supabaseAdmin
            .from(
                "nt_payment_requests"
            )
            .update({
                status:
                    "REJECTED",

                admin_note:
                    adminNote ||
                    null,

                reviewed_at:
                    now.toISOString(),
            })
            .eq(
                "id",
                paymentId
            );

        await supabaseAdmin
            .from(
                "nt_access_passes"
            )
            .update({
                status:
                    "REJECTED",

                admin_note:
                    adminNote ||
                    null,

                reviewed_at:
                    now.toISOString(),
            })
            .eq(
                "id",
                payment.access_pass_id
            );

        return res.status(200).json({
            success: true,
        });
    }

    const expires =
        new Date(
            now.getTime() +
            24 *
            60 *
            60 *
            1000
        );

    await supabaseAdmin
        .from(
            "nt_payment_requests"
        )
        .update({
            status:
                "APPROVED",

            admin_note:
                adminNote ||
                null,

            reviewed_at:
                now.toISOString(),
        })
        .eq(
            "id",
            paymentId
        );

    const {
        error: accessError,
    } =
        await supabaseAdmin
            .from(
                "nt_access_passes"
            )
            .update({
                status:
                    "ACTIVE",

                activated_at:
                    now.toISOString(),

                expires_at:
                    expires.toISOString(),

                admin_note:
                    adminNote ||
                    null,

                reviewed_at:
                    now.toISOString(),
            })
            .eq(
                "id",
                payment.access_pass_id
            );

    if (accessError) {
        console.error(
            accessError
        );

        return res.status(500).json({
            error:
                "Payment was approved but access activation failed.",
        });
    }

    return res.status(200).json({
        success: true,
        expiresAt:
            expires.toISOString(),
    });
}