import supabaseAdmin from "../../../lib/supabaseAdmin";
import { rankSpots } from "../../../lib/matching";
import {
    isLaunchFree,
} from "../../../lib/access";
import {
    getAdminCookie,
    verifyAdminToken,
} from "../../../lib/adminAuth";

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
            latitude,
            longitude,
            locationText,
            budget,
            people,
            category,
            language = "en",
        } = req.body || {};

        if (!visitorId) {
            return res.status(400).json({
                error:
                    language === "fr"
                        ? "Votre session est introuvable."
                        : "Your session is missing.",
            });
        }

        /*
         * ADMIN ACCESS
         *
         * Admin authentication is based on
         * the protected server-side cookie.
         *
         * Admin never needs to pay.
         */
        const adminToken =
            getAdminCookie(req);

        const admin =
            verifyAdminToken(
                adminToken
            );

        /*
         * LAUNCH WEEK
         *
         * Everyone gets free discovery
         * until the configured launch date.
         */
        const launchFree =
            isLaunchFree();

        let access = null;

        /*
         * AFTER LAUNCH:
         *
         * Only normal users need an
         * active 24-hour access pass.
         */
        if (
            !launchFree &&
            !admin
        ) {
            const {
                data: activeAccess,
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
                    "Access check:",
                    accessError
                );

                return res.status(500).json({
                    error:
                        language === "fr"
                            ? "Impossible de vérifier votre accès."
                            : "Unable to verify your access.",
                });
            }

            if (!activeAccess) {
                return res.status(403).json({
                    error:
                        language === "fr"
                            ? "Votre accès découverte a expiré."
                            : "Your discovery access has expired.",

                    accessRequired:
                        true,
                });
            }

            access =
                activeAccess;
        }

        /*
         * Get approved places.
         */
        const {
            data: spots,
            error: spotsError,
        } =
            await supabaseAdmin
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
                "Spots:",
                spotsError
            );

            return res.status(500).json({
                error:
                    language === "fr"
                        ? "Impossible de trouver des endroits."
                        : "Unable to find places.",
            });
        }

        /*
         * Rank places using:
         * budget
         * category
         * distance
         * verification
         * rating
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

                    locationText:
                        locationText ||
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

        const results =
            ranked
                .slice(0, 10)
                .map(
                    (spot) => ({
                        ...spot,

                        distanceKm:
                            spot.match
                                ?.distanceKm ??
                            null,
                    })
                );

        /*
         * Record search.
         *
         * During free launch week,
         * access_pass_id remains null.
         *
         * Admin searches also remain
         * independent of paid access.
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
                        access?.id ??
                        null,

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
                .select("id")
                .single();

        if (searchError) {
            console.error(
                "Search record:",
                searchError
            );
        }

        return res.status(200).json({
            searchId:
                search?.id ||
                null,

            accessExpiresAt:
                access?.expires_at ??
                null,

            launchFree,

            admin,

            results,
        });
    } catch (error) {
        console.error(
            "Search API error:",
            error
        );

        return res.status(500).json({
            error:
                "Something went wrong while finding your places.",
        });
    }
}