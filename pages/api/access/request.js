import supabaseAdmin from "../../../lib/supabaseAdmin";

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

    try {
        const {
            visitorId,
        } = req.body || {};

        if (!visitorId) {
            return res.status(400).json({
                error:
                    "Visitor session is required.",
            });
        }

        /*
         * Confirm the visitor exists.
         */
        const {
            data: visitor,
            error: visitorError,
        } =
            await supabaseAdmin
                .from(
                    "nt_visitors"
                )
                .select("id")
                .eq(
                    "id",
                    visitorId
                )
                .maybeSingle();

        if (visitorError) {
            console.error(
                "Visitor lookup:",
                visitorError
            );

            return res.status(500).json({
                error:
                    "Unable to verify visitor.",
            });
        }

        if (!visitor) {
            return res.status(404).json({
                error:
                    "Visitor session not found.",
            });
        }

        /*
         * If the visitor already has an active pass,
         * return it instead of creating another one.
         */
        const now =
            new Date();

        const {
            data: activePass,
            error: activeError,
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
                    expires_at,
                    created_at
                    `
                )
                .eq(
                    "visitor_id",
                    visitorId
                )
                .eq(
                    "status",
                    "ACTIVE"
                )
                .gt(
                    "expires_at",
                    now.toISOString()
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

        if (activeError) {
            console.error(
                "Active access lookup:",
                activeError
            );

            return res.status(500).json({
                error:
                    "Unable to check existing access.",
            });
        }

        if (activePass) {
            return res.status(200).json({
                success:
                    true,

                alreadyActive:
                    true,

                accessPass:
                    activePass,
            });
        }

        /*
         * Check whether there is already a pending
         * access request for this visitor.
         *
         * This prevents accidental duplicate payment
         * requests when the user refreshes the page.
         */
        const {
            data: pendingPass,
            error: pendingError,
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
                    expires_at,
                    created_at
                    `
                )
                .eq(
                    "visitor_id",
                    visitorId
                )
                .eq(
                    "status",
                    "PENDING"
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

        if (pendingError) {
            console.error(
                "Pending access lookup:",
                pendingError
            );

            return res.status(500).json({
                error:
                    "Unable to check existing access request.",
            });
        }

        if (pendingPass) {
            return res.status(200).json({
                success:
                    true,

                alreadyPending:
                    true,

                accessPass:
                    pendingPass,
            });
        }

        /*
         * Create the 100 FCFA / 24-hour access pass.
         */
        const {
            data: accessPass,
            error: accessError,
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
                    `
                    id,
                    visitor_id,
                    amount,
                    currency,
                    status,
                    activated_at,
                    expires_at,
                    created_at
                    `
                )
                .single();

        if (accessError) {
            console.error(
                "Access request creation:",
                accessError
            );

            return res.status(500).json({
                error:
                    "Unable to create access request.",
            });
        }

        return res.status(201).json({
            success:
                true,

            alreadyPending:
                false,

            alreadyActive:
                false,

            accessPass,
        });
    } catch (
    error
    ) {
        console.error(
            "Access request error:",
            error
        );

        return res.status(500).json({
            error:
                "Unable to request access.",
        });
    }
}