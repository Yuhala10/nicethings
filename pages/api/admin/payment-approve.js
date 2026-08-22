import supabaseAdmin from "../../../lib/supabaseAdmin";
import {
    requireAdmin,
} from "../../../lib/adminAuth";

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

    if (
        !requireAdmin(
            req,
            res
        )
    ) {
        return;
    }

    try {
        const {
            paymentId,
            note,
        } =
            req.body || {};

        if (!paymentId) {
            return res.status(400).json({
                error:
                    "Payment ID is required.",
            });
        }

        /*
         * Retrieve the payment.
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
                    `
                    id,
                    visitor_id,
                    access_pass_id,
                    amount,
                    status
                    `
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
                    "Unable to verify payment.",
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
                    "This payment has already been processed.",
            });
        }

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
         * Retrieve the associated access pass.
         */

        const {
            data: accessPass,
            error: passError,
        } =
            await supabaseAdmin
                .from(
                    "nt_access_passes"
                )
                .select(
                    "id,status"
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

        if (passError) {
            console.error(
                passError
            );

            return res.status(500).json({
                error:
                    "Unable to verify access pass.",
            });
        }

        if (!accessPass) {
            return res.status(404).json({
                error:
                    "Access pass not found.",
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
         * Activate access.
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
                    updated_at:
                        activatedAt.toISOString(),
                })
                .eq(
                    "id",
                    accessPass.id
                );

        if (activateError) {
            console.error(
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
                        note ||
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
                paymentUpdateError
            );

            /*
             * Important:
             * Access has already been activated.
             *
             * We don't silently pretend everything
             * is fine. The admin receives an error.
             */

            return res.status(500).json({
                error:
                    "Access was activated but payment status could not be updated. Please inspect the payment record.",
            });
        }

        /*
         * Audit log.
         */

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
                    note ||
                    null,
            });

        return res.status(200).json({
            success: true,
            access: {
                activatedAt:
                    activatedAt.toISOString(),
                expiresAt:
                    expiresAt.toISOString(),
            },
        });
    } catch (error) {
        console.error(
            "Payment approval error:",
            error
        );

        return res.status(500).json({
            error:
                "Unable to approve payment.",
        });
    }
}