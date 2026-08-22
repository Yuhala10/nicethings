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

        const {
            data: payment,
            error: paymentError,
        } =
            await supabaseAdmin
                .from(
                    "nt_payment_requests"
                )
                .select(
                    "id,visitor_id,access_pass_id,status"
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

        const now =
            new Date().toISOString();

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
                        note ||
                        null,
                    reviewed_at:
                        now,
                    updated_at:
                        now,
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

            return res.status(500).json({
                error:
                    "Unable to reject payment.",
            });
        }

        if (
            payment.access_pass_id
        ) {
            await supabaseAdmin
                .from(
                    "nt_access_passes"
                )
                .update({
                    status:
                        "REVOKED",
                    updated_at:
                        now,
                })
                .eq(
                    "id",
                    payment.access_pass_id
                );
        }

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
                    note ||
                    null,
            });

        return res.status(200).json({
            success: true,
        });
    } catch (error) {
        console.error(
            "Payment rejection error:",
            error
        );

        return res.status(500).json({
            error:
                "Unable to reject payment.",
        });
    }
}