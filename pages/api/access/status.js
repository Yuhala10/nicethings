import supabaseAdmin from "../../../lib/supabaseAdmin";

export default async function handler(req, res) {
    if (req.method !== "GET") {
        return res.status(405).json({
            error: "Method not allowed.",
        });
    }

    const visitorId =
        req.query.visitorId;

    if (!visitorId) {
        return res.status(400).json({
            error:
                "Visitor ID is required.",
        });
    }

    try {
        const now =
            new Date().toISOString();

        const {
            data: active,
            error,
        } = await supabaseAdmin
            .from("nt_access_passes")
            .select(
                "id,amount,currency,status,activated_at,expires_at"
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
                now
            )
            .order(
                "expires_at",
                {
                    ascending:
                        false,
                }
            )
            .limit(1)
            .maybeSingle();

        if (error) {
            console.error(error);

            return res.status(500).json({
                error:
                    "Unable to check access.",
            });
        }

        return res.status(200).json({
            active: Boolean(
                active
            ),
            access: active || null,
        });
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            error:
                "Unable to check access.",
        });
    }
}