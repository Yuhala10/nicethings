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

        /* =====================================================
           SESSION
        ====================================================== */

        if (!visitorId) {
            return res.status(400).json({
                error:
                    language === "fr"
                        ? "Votre session est introuvable."
                        : "Your session is missing.",
            });
        }

        /* =====================================================
           ADMIN ACCESS
        ====================================================== */

        const adminToken =
            getAdminCookie(req);

        const admin =
            verifyAdminToken(
                adminToken
            );

        /* =====================================================
           LAUNCH ACCESS
        ====================================================== */

        const launchFree =
            isLaunchFree();

        let access = null;

        /*
         * After launch, normal visitors
         * need an active discovery pass.
         *
         * Admin does not need one.
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

        /* =====================================================
           GET APPROVED SPOTS
        ====================================================== */

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

        /* =====================================================
           SEARCH VALUES
        ====================================================== */

        const numericBudget =
            Number(budget);

        const hasBudget =
            Number.isFinite(
                numericBudget
            ) &&
            numericBudget > 0;

        const numericPeople =
            Math.max(
                Number(people) || 1,
                1
            );

        const searchOptions = {
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
                hasBudget
                    ? numericBudget
                    : null,

            people:
                numericPeople,

            category:
                category ||
                null,
        };

        /* =====================================================
           INTELLIGENT RANKING
        ====================================================== */

        const ranked =
            rankSpots(
                spots || [],
                searchOptions
            );

        /* =====================================================
           SPLIT RESULTS
        ====================================================== */

        let primaryResults = [];
        let alternativeResults = [];

        if (hasBudget) {
            /*
             * PRIMARY:
             *
             * Places within the user's budget
             * or reasonably close to it.
             */

            primaryResults =
                ranked.filter(
                    spot =>
                        spot.match &&
                        (
                            spot.match
                                .budgetStatus ===
                            "WITHIN_BUDGET" ||
                            spot.match
                                .budgetStatus ===
                            "NEAR_BUDGET"
                        )
                );

            /*
             * ALTERNATIVES:
             *
             * Places above budget.
             *
             * We keep them separate so that
             * an expensive restaurant does not
             * compete directly with an affordable
             * restaurant.
             */

            alternativeResults =
                ranked.filter(
                    spot =>
                        spot.match &&
                        spot.match
                            .budgetStatus ===
                        "ABOVE_BUDGET"
                );
        } else {
            /*
             * No budget supplied.
             *
             * All ranked places are valid
             * candidates.
             */

            primaryResults =
                ranked;
        }

        /* =====================================================
           FALLBACK
        ====================================================== */

        /*
         * If the user has a strict budget but
         * there are no places within/near it,
         * do NOT return an empty search.
         *
         * Instead, show the closest alternatives
         * and clearly identify them as above budget.
         */

        if (
            hasBudget &&
            primaryResults.length === 0
        ) {
            primaryResults =
                alternativeResults.slice(
                    0,
                    10
                );

            alternativeResults = [];
        }

        /* =====================================================
           FORMAT RESULTS
        ====================================================== */

        const formatSpot =
            spot => ({
                ...spot,

                distanceKm:
                    spot.match
                        ?.distanceKm ??
                    null,

                matchScore:
                    spot.match
                        ?.score ??
                    0,

                match:
                    spot.match ||
                    null,
            });

        const results =
            primaryResults
                .slice(0, 10)
                .map(
                    formatSpot
                );

        const alternatives =
            alternativeResults
                .slice(0, 5)
                .map(
                    formatSpot
                );

        /* =====================================================
           RECORD SEARCH
        ====================================================== */

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
                        hasBudget
                            ? numericBudget
                            : null,

                    people:
                        numericPeople,

                    category:
                        category ||
                        null,

                    language:
                        language === "fr"
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

        /* =====================================================
           RESPONSE
        ====================================================== */

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

            alternatives,

            searchMeta: {
                budget:
                    hasBudget
                        ? numericBudget
                        : null,

                people:
                    numericPeople,

                category:
                    category ||
                    null,

                locationText:
                    locationText ||
                    null,

                usingLocation:
                    Number.isFinite(
                        Number(latitude)
                    ) &&
                    Number.isFinite(
                        Number(longitude)
                    ),

                totalApprovedSpots:
                    (spots || [])
                        .length,

                primaryCount:
                    primaryResults
                        .length,

                alternativeCount:
                    alternativeResults
                        .length,
            },
        });
    } catch (error) {
        console.error(
            "Search API error:",
            error
        );

        return res.status(500).json({
            error:
                language === "fr"
                    ? "Une erreur s'est produite lors de la recherche."
                    : "Something went wrong while finding your places.",
        });
    }
}