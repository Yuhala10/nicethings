import supabaseAdmin from "../../../lib/supabaseAdmin";

export default async function handler(
    req,
    res
) {
    if (
        req.method !== "POST"
    ) {
        return res.status(405).json({
            error:
                "Method not allowed.",
        });
    }

    try {
        const {
            visitorId,
            accessPassId,
        } = req.body || {};

        if (
            !visitorId ||
            !accessPassId
        ) {
            return res.status(400).json({
                error:
                    "Visitor and access pass are required.",
            });
        }

        /*
         * Load the access pass belonging to
         * this visitor.
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
                    `
                    id,
                    visitor_id,
                    amount,
                    currency,
                    status,
                    activated_at,
                    expires_at
                    `
                )
                .eq(
                    "id",
                    accessPassId
                )
                .eq(
                    "visitor_id",
                    visitorId
                )
                .maybeSingle();

        if (passError) {
            console.error(
                "Access pass lookup:",
                passError
            );

            return res.status(500).json({
                error:
                    "Unable to load access pass.",
            });
        }

        if (!accessPass) {
            return res.status(404).json({
                error:
                    "Access pass not found.",
            });
        }

        /*
         * An access pass should normally be activated
         * by the payment approval process.
         *
         * This endpoint therefore does not allow a
         * visitor to simply manufacture access.
         */
        if (
            accessPass.status !==
            "PENDING"
        ) {
            return res.status(409).json({
                error:
                    "This access pass cannot be activated.",
                status:
                    accessPass.status,
            });
        }

        /*
         * Verify that there is an approved payment
         * attached to this access pass.
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
                    amount,
                    currency,
                    status
                    `
                )
                .eq(
                    "access_pass_id",
                    accessPass.id
                )
                .eq(
                    "visitor_id",
                    visitorId
                )
                .eq(
                    "status",
                    "APPROVED"
                )
                .order(
                    "created_at",
                    {
                        ascending:
                            false,
                    }
                )
                .limit(1)
                .maybeSingle();

        if (paymentError) {
            console.error(
                "Payment verification:",
                paymentError
            );

            return res.status(500).json({
                error:
                    "Unable to verify payment.",
            });
        }

        if (!payment) {
            return res.status(403).json({
                error:
                    "Approved payment is required before access can be activated.",
            });
        }

        /*
         * Make sure the payment amount matches
         * the access pass.
         */
        if (
            Number(
                payment.amount
            ) !==
            Number(
                accessPass.amount
            ) ||
            payment.currency !==
            accessPass.currency
        ) {
            return res.status(400).json({
                error:
                    "Payment does not match the access pass.",
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
         *
         * Only columns that exist in the
         * database schema are updated.
         */
        const {
            data: updatedPass,
            error:
            activateError,
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


                })
                .eq(
                    "id",
                    accessPass.id
                )
                .eq(
                    "visitor_id",
                    visitorId
                )
                .select(
                    `
                    id,
                    visitor_id,
                    amount,
                    currency,
                    status,
                    activated_at,
                    expires_at
                    `
                )
                .single();

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

        return res.status(200).json({
            success:
                true,

            accessPass:
                updatedPass,
        });
    } catch (
    error
    ) {
        console.error(
            "Access activation error:",
            error
        );

        return res.status(500).json({
            error:
                "Unable to activate access.",
        });
    }
}