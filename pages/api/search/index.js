import supabaseAdmin from "../../../lib/supabaseAdmin";
import { rankSpots } from "../../../lib/matching";

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

    try {
        const {
            visitorId,
            latitude,
            longitude,
            locationText,
            budget,
            people,
            category,
            language = "en",
        } =
            req.body || {};

        if (!visitorId) {
            return res.status(400).json({
                error:
                    "Visitor session is required.",
            });
        }

        /*
         * Access verification happens
         * on the server.
         */

        const {
            data: access,
            error: accessError,
        } =
            await supabaseAdmin
                .from(
                    "nt_access_passes"
                )
                .select(
                    "id,expires_at"
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
                    new Date().toISOString()
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

        if (accessError) {
            console.error(
                accessError
            );

            return res.status(500).json({
                error:
                    "Unable to verify access.",
            });
        }

        if (!access) {
            return res.status(403).json({
                error:
                    "Your NiceThings access has expired or has not been activated.",
                accessRequired:
                    true,
            });
        }

        /*
         * Retrieve approved spots.
         */

        const {
            data: spots,
            error: spotsError,
        } =
            await supabaseAdmin
                .from(
                    "nt_spots"
                )
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
                    average_price,
                    minimum_price,
                    maximum_price,
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
                .limit(250);

        if (spotsError) {
            console.error(
                spotsError
            );

            return res.status(500).json({
                error:
                    "Unable to find spots.",
            });
        }

        /*
         * Rank the places.
         */

        const ranked =
            rankSpots(
                spots || [],
                {
                    latitude:
                        latitude ??
                        null,

                    longitude:
                        longitude ??
                        null,

                    budget:
                        Number(
                            budget
                        ) || null,

                    people:
                        Number(
                            people
                        ) || 1,

                    category:
                        category ||
                        null,
                }
            );

        /*
         * Keep the experience focused.
         *
         * We don't overwhelm the user
         * with dozens of places.
         */

        const results =
            ranked
                .slice(
                    0,
                    10
                )
                .map(
                    (spot) => ({
                        ...spot,

                        distanceKm:
                            spot.match
                                .distanceKm,
                    })
                );

        /*
         * Record the search.
         */

        const {
            data: search,
            error: searchError,
        } =
            await supabaseAdmin
                .from(
                    "nt_searches"
                )
                .insert({
                    visitor_id:
                        visitorId,

                    access_pass_id:
                        access.id,

                    location_text:
                        locationText ||
                        null,

                    latitude:
                        latitude ??
                        null,

                    longitude:
                        longitude ??
                        null,

                    budget:
                        Number(
                            budget
                        ) || null,

                    people:
                        Number(
                            people
                        ) || 1,

                    category:
                        category ||
                        null,

                    language:
                        language ===
                            "fr"
                            ? "fr"
                            : "en",
                })
                .select(
                    "id"
                )
                .single();

        if (searchError) {
            console.error(
                "Search record error:",
                searchError
            );
        }

        return res.status(200).json({
            searchId:
                search?.id ||
                null,

            accessExpiresAt:
                access.expires_at,

            results,
        });
    } catch (error) {
        console.error(
            "Search API error:",
            error
        );

        return res.status(500).json({
            error:
                "Something went wrong while finding your spots.",
        });
    }
}