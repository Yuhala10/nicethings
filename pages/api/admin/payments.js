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


    if (
        req.method ===
        "GET"
    ) {
        return getPayments(
            req,
            res
        );
    }


    if (
        req.method ===
        "POST"
    ) {
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


/* =========================================================
   GET PAYMENTS
========================================================= */

async function getPayments(
    req,
    res
) {
    try {
        const {
            data,
            error,
        } =
            await supabaseAdmin
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
            console.error(
                "Admin payments:",
                error
            );

            return res.status(500).json({
                error:
                    "Unable to load payments.",
            });
        }


        const payments =
            await Promise.all(
                (
                    data ||
                    []
                ).map(
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
                                error: signedError,
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


                            if (
                                signedError
                            ) {
                                console.error(
                                    "Proof URL:",
                                    signedError
                                );
                            }


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
    } catch (
    error
    ) {
        console.error(
            "Get payments error:",
            error
        );

        return res.status(500).json({
            error:
                "Unable to load payments.",
        });
    }
}


/* =========================================================
   REVIEW PAYMENT
========================================================= */

async function reviewPayment(
    req,
    res
) {
    try {
        const {
            paymentId,
            decision,
            adminNote,
        } =
            req.body || {};


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


        /*
         * Load payment.
         */

        const {
            data: payment,
            error: paymentError,
        } =
            await supabaseAdmin
                .from(
                    "nt_payment_requests"
                )
                .select(`
                    id,
                    visitor_id,
                    access_pass_id,
                    amount,
                    status,
                    proof_url
                `)
                .eq(
                    "id",
                    paymentId
                )
                .maybeSingle();


        if (
            paymentError
        ) {
            console.error(
                "Payment lookup:",
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


        /*
         * Prevent double review.
         */

        if (
            payment.status !==
            "PENDING"
        ) {
            return res.status(409).json({
                error:
                    "This payment has already been reviewed.",
            });
        }


        /*
         * APPROVE
         */

        if (
            decision ===
            "APPROVE"
        ) {
            return approvePayment(
                req,
                res,
                payment,
                adminNote
            );
        }


        /*
         * REJECT
         */

        return rejectPayment(
            req,
            res,
            payment,
            adminNote
        );
    } catch (
    error
    ) {
        console.error(
            "Payment review error:",
            error
        );

        return res.status(500).json({
            error:
                "Unable to review payment.",
        });
    }
}


/* =========================================================
   APPROVE
========================================================= */

async function approvePayment(
    req,
    res,
    payment,
    adminNote
) {
    /*
     * Validate payment amount.
     */

    if (
        Number(
            payment.amount
        ) !== 100
    ) {
        return res.status(400).json({
            error:
                "Invalid payment amount.",
        });
    }


    /*
     * Require proof.
     *
     * The UI already enforces this,
     * but the server must enforce it too.
     */

    if (
        !payment.proof_url
    ) {
        return res.status(400).json({
            error:
                "Payment proof is required before approval.",
        });
    }


    /*
     * Retrieve associated access pass.
     */

    if (
        !payment.access_pass_id
    ) {
        return res.status(400).json({
            error:
                "Payment has no associated access pass.",
        });
    }


    const {
        data: accessPass,
        error: passError,
    } =
        await supabaseAdmin
            .from(
                "nt_access_passes"
            )
            .select(
                "id,visitor_id,status"
            )
            .eq(
                "id",
                payment.access_pass_id
            )
            .eq(
                "visitor_id",
                payment.visitor_id
            )
            .maybeSingle();


    if (
        passError
    ) {
        console.error(
            "Access pass lookup:",
            passError
        );

        return res.status(500).json({
            error:
                "Unable to verify access pass.",
        });
    }


    if (
        !accessPass
    ) {
        return res.status(404).json({
            error:
                "Access pass not found.",
        });
    }


    /*
     * Only pending passes can
     * be activated.
     */

    if (
        accessPass.status !==
        "PENDING" &&
        accessPass.status !==
        "REJECTED" &&
        accessPass.status !==
        "REVOKED"
    ) {
        return res.status(409).json({
            error:
                "This access pass cannot be activated.",
        });
    }


    const activatedAt =
        new Date();


    const expiresAt =
        new Date(
            activatedAt.getTime() +
            24 *
            60 *
            60 *
            1000
        );


    /*
     * Activate access pass.
     */

    const {
        error: activateError,
    } =
        await supabaseAdmin
            .from(
                "nt_access_passes"
            )
            .update({
                status:
                    "ACTIVE",

                activated_at:
                    activatedAt.toISOString(),

                expires_at:
                    expiresAt.toISOString(),

                admin_note:
                    adminNote ||
                    null,

                reviewed_at:
                    activatedAt.toISOString(),

                updated_at:
                    activatedAt.toISOString(),
            })
            .eq(
                "id",
                accessPass.id
            );


    if (
        activateError
    ) {
        console.error(
            "Access activation:",
            activateError
        );

        return res.status(500).json({
            error:
                "Unable to activate access.",
        });
    }


    /*
     * Mark payment approved.
     */

    const {
        error: paymentUpdateError,
    } =
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
                    activatedAt.toISOString(),

                updated_at:
                    activatedAt.toISOString(),
            })
            .eq(
                "id",
                payment.id
            );


    if (
        paymentUpdateError
    ) {
        console.error(
            "Payment update:",
            paymentUpdateError
        );


        /*
         * We do not silently hide the
         * partial failure.
         */

        return res.status(500).json({
            error:
                "Access was activated but payment status could not be updated. Please inspect the payment record.",
        });
    }


    /*
     * Audit log.
     */

    const {
        error: auditError,
    } =
        await supabaseAdmin
            .from(
                "nt_admin_audit_log"
            )
            .insert({
                action:
                    "PAYMENT_APPROVED",

                target_type:
                    "payment",

                target_id:
                    payment.id,

                note:
                    adminNote ||
                    null,
            });


    if (
        auditError
    ) {
        console.error(
            "Approval audit:",
            auditError
        );
    }


    return res.status(200).json({
        success:
            true,

        expiresAt:
            expiresAt.toISOString(),
    });
}


/* =========================================================
   REJECT
========================================================= */

async function rejectPayment(
    req,
    res,
    payment,
    adminNote
) {
    const reviewedAt =
        new Date();


    /*
     * Reject payment.
     */

    const {
        error: paymentUpdateError,
    } =
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
                    reviewedAt.toISOString(),

                updated_at:
                    reviewedAt.toISOString(),
            })
            .eq(
                "id",
                payment.id
            );


    if (
        paymentUpdateError
    ) {
        console.error(
            "Payment rejection:",
            paymentUpdateError
        );

        return res.status(500).json({
            error:
                "Unable to reject payment.",
        });
    }


    /*
     * Revoke associated access pass.
     */

    if (
        payment.access_pass_id
    ) {
        const {
            error: passError,
        } =
            await supabaseAdmin
                .from(
                    "nt_access_passes"
                )
                .update({
                    status:
                        "REVOKED",

                    admin_note:
                        adminNote ||
                        null,

                    reviewed_at:
                        reviewedAt.toISOString(),

                    updated_at:
                        reviewedAt.toISOString(),
                })
                .eq(
                    "id",
                    payment.access_pass_id
                )
                .eq(
                    "visitor_id",
                    payment.visitor_id
                );


        if (
            passError
        ) {
            console.error(
                "Access pass rejection:",
                passError
            );

            return res.status(500).json({
                error:
                    "Payment was rejected but access pass could not be revoked.",
            });
        }
    }


    /*
     * Audit log.
     */

    const {
        error: auditError,
    } =
        await supabaseAdmin
            .from(
                "nt_admin_audit_log"
            )
            .insert({
                action:
                    "PAYMENT_REJECTED",

                target_type:
                    "payment",

                target_id:
                    payment.id,

                note:
                    adminNote ||
                    null,
            });


    if (
        auditError
    ) {
        console.error(
            "Rejection audit:",
            auditError
        );
    }


    return res.status(200).json({
        success:
            true,
    });
}