import supabaseAdmin from "../../../lib/supabaseAdmin";

export default async function handler(
    req,
    res
) {
    if (
        req.method !== "GET"
    ) {
        return res.status(405).json({
            error:
                "Method not allowed.",
        });
    }

    const {
        id,
    } = req.query;

    if (!id) {
        return res.status(400).json({
            error:
                "Spot ID is required.",
        });
    }

    try {
        const {
            data: spot,
            error,
        } = await supabaseAdmin
            .from("nt_spots")
            .select("*")
            .eq("id", id)
            .eq(
                "status",
                "APPROVED"
            )
            .maybeSingle();

        if (error) {
            console.error(
                "Spot lookup error:",
                error
            );

            return res.status(500).json({
                error:
                    "Unable to load spot.",
            });
        }

        if (!spot) {
            return res.status(404).json({
                error:
                    "Spot not found.",
            });
        }

        return res.status(200).json({
            spot,
        });
    } catch (error) {
        console.error(
            "Spot API error:",
            error
        );

        return res.status(500).json({
            error:
                "Unable to load spot.",
        });
    }
}