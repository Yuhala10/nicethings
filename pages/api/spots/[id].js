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
            .select(`
                id,
                name,
                slug,
                description,
                category,
                cuisine,
                address,
                neighborhood,
                city,
                latitude,
                longitude,
                phone,
                whatsapp,
                minimum_price,
                maximum_price,
                average_price,
                currency,
                opening_time,
                closing_time,
                rating,
                review_count,
                verified,
                price_verified_at,
                location_verified_at,
                featured
            `)
            .eq(
                "id",
                id
            )
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