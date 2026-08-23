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
        req.method !==
        "GET"
    ) {
        return res.status(405).json({
            error:
                "Method not allowed.",
        });
    }

    try {
        const {
            data,
            error,
        } =
            await supabaseAdmin
                .from(
                    "nt_spots"
                )
                .select(
                    "*"
                )
                .order(
                    "created_at",
                    {
                        ascending:
                            false,
                    }
                );


        if (error) {
            console.error(
                "Admin spots:",
                error
            );

            return res.status(500).json({
                error:
                    "Unable to load spots.",
            });
        }


        return res.status(200).json({
            spots:
                data || [],
        });
    } catch (error) {
        console.error(
            "Get admin spots error:",
            error
        );

        return res.status(500).json({
            error:
                "Unable to load spots.",
        });
    }
}