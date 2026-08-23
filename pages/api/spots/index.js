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

    try {
        const {
            category,
            city,
            search,
            limit,
        } = req.query || {};

        let query =
            supabaseAdmin
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
                    "status",
                    "APPROVED"
                )
                .order(
                    "featured",
                    {
                        ascending:
                            false,
                    }
                )
                .order(
                    "rating",
                    {
                        ascending:
                            false,
                    }
                )
                .order(
                    "created_at",
                    {
                        ascending:
                            false,
                    }
                );

        if (
            category &&
            String(category).trim()
        ) {
            query = query.eq(
                "category",
                String(
                    category
                ).trim()
            );
        }

        if (
            city &&
            String(city).trim()
        ) {
            query = query.ilike(
                "city",
                `%${String(
                    city
                ).trim()}%`
            );
        }

        if (
            search &&
            String(search).trim()
        ) {
            const term =
                String(
                    search
                ).trim();

            query = query.or(
                `name.ilike.%${term}%,description.ilike.%${term}%,category.ilike.%${term}%,cuisine.ilike.%${term}%,address.ilike.%${term}%,neighborhood.ilike.%${term}%`
            );
        }

        let parsedLimit =
            Number(limit);

        if (
            !Number.isFinite(
                parsedLimit
            )
        ) {
            parsedLimit = 50;
        }

        parsedLimit =
            Math.min(
                Math.max(
                    Math.floor(
                        parsedLimit
                    ),
                    1
                ),
                100
            );

        query = query.limit(
            parsedLimit
        );

        const {
            data,
            error,
        } = await query;

        if (error) {
            console.error(
                "Public spots API:",
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
    } catch (
    error
    ) {
        console.error(
            "Public spots error:",
            error
        );

        return res.status(500).json({
            error:
                "Unable to load spots.",
        });
    }
}