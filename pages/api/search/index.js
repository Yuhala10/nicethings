import supabaseAdmin from "../../../lib/supabaseAdmin";

import {
    rankSpots,
    MAX_MATCH_DISTANCE_KM,
    PRIMARY_MATCH_DISTANCE_KM,
} from "../../../lib/matching";

import {
    isLaunchFree,
} from "../../../lib/access";

import {
    getAdminCookie,
    verifyAdminToken,
} from "../../../lib/adminAuth";


/* =========================================================
   LOCATION VALIDATION
========================================================= */

function isValidCoordinates(
    latitude,
    longitude
) {
    return (
        Number.isFinite(
            Number(latitude)
        ) &&
        Number.isFinite(
            Number(longitude)
        ) &&
        Number(latitude) >= -90 &&
        Number(latitude) <= 90 &&
        Number(longitude) >= -180 &&
        Number(longitude) <= 180
    );
}


/* =========================================================
   HAVERSINE DISTANCE
========================================================= */

function calculateDistanceKm(
    latitude1,
    longitude1,
    latitude2,
    longitude2
) {
    if (
        !isValidCoordinates(
            latitude1,
            longitude1
        ) ||
        !isValidCoordinates(
            latitude2,
            longitude2
        )
    ) {
        return null;
    }

    const earthRadiusKm =
        6371;

    const lat1 =
        Number(latitude1) *
        Math.PI /
        180;

    const lat2 =
        Number(latitude2) *
        Math.PI /
        180;

    const deltaLat =
        (
            Number(latitude2) -
            Number(latitude1)
        ) *
        Math.PI /
        180;

    const deltaLng =
        (
            Number(longitude2) -
            Number(longitude1)
        ) *
        Math.PI /
        180;

    const a =
        Math.sin(
            deltaLat / 2
        ) ** 2 +
        Math.cos(lat1) *
        Math.cos(lat2) *
        Math.sin(
            deltaLng / 2
        ) ** 2;

    const c =
        2 *
        Math.atan2(
            Math.sqrt(a),
            Math.sqrt(1 - a)
        );

    return (
        earthRadiusKm *
        c
    );
}


/* =========================================================
   BUDGET CHECK
========================================================= */

function isWithinBudget(
    spot,
    budget,
    people
) {
    const requestedBudget =
        Number(
            budget
        );

    if (
        !Number.isFinite(
            requestedBudget
        ) ||
        requestedBudget <= 0
    ) {
        return true;
    }

    const numberOfPeople =
        Math.max(
            Number(
                people
            ) || 1,
            1
        );

    const budgetPerPerson =
        requestedBudget /
        numberOfPeople;

    const minimum =
        Number(
            spot.minimum_price
        );

    const average =
        Number(
            spot.average_price
        );

    const maximum =
        Number(
            spot.maximum_price
        );

    const lowestKnownPrice =
        [
            minimum,
            average,
            maximum,
        ]
            .filter(
                value =>
                    Number.isFinite(
                        value
                    ) &&
                    value > 0
            )
            .sort(
                (
                    a,
                    b
                ) =>
                    a - b
            )[0];

    if (
        !Number.isFinite(
            lowestKnownPrice
        )
    ) {
        return true;
    }

    return (
        lowestKnownPrice <=
        budgetPerPerson
    );
}


/* =========================================================
   MAIN HANDLER
========================================================= */

export default async function handler(
    req,
    res
) {
    if (
        req.method !==
        "POST"
    ) {
        return res.status(
            405
        ).json({
            error:
                "Method not allowed.",
        });
    }


    try {
        const {
            visitorId,

            latitude,
            longitude,

            /*
             * Kept only for recording/display.
             *
             * NEVER used to determine the user's
             * geographic position anymore.
             */
            locationText,

            budget,
            people,
            category,
            language = "en",
        } =
            req.body || {};


        /* =====================================================
           SESSION
        ====================================================== */

        if (
            !visitorId
        ) {
            return res.status(
                400
            ).json({
                error:
                    language ===
                        "fr"
                        ? "Votre session est introuvable."
                        : "Your session is missing.",
            });
        }


        /* =====================================================
           ADMIN
        ====================================================== */

        const adminToken =
            getAdminCookie(
                req
            );

        const admin =
            verifyAdminToken(
                adminToken
            );


        /* =====================================================
           ACCESS
        ====================================================== */

        const launchFree =
            isLaunchFree();

        let access =
            null;


        if (
            !launchFree &&
            !admin
        ) {
            const {
                data:
                activeAccess,
                error:
                accessError,
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
                        new Date()
                            .toISOString()
                    )
                    .order(
                        "expires_at",
                        {
                            ascending:
                                false,
                        }
                    )
                    .limit(
                        1
                    )
                    .maybeSingle();


            if (
                accessError
            ) {
                console.error(
                    "Access check:",
                    accessError
                );

                return res.status(
                    500
                ).json({
                    error:
                        language ===
                            "fr"
                            ? "Impossible de vérifier votre accès."
                            : "Unable to verify your access.",
                });
            }


            if (
                !activeAccess
            ) {
                return res.status(
                    403
                ).json({
                    error:
                        language ===
                            "fr"
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
           GPS IS NOW REQUIRED
        ====================================================== */

        const userLatitude =
            Number(
                latitude
            );

        const userLongitude =
            Number(
                longitude
            );


        const hasGps =
            isValidCoordinates(
                userLatitude,
                userLongitude
            );


        if (
            !hasGps
        ) {
            return res.status(
                400
            ).json({
                error:
                    language ===
                        "fr"
                        ? "Activez votre position actuelle pour trouver les endroits près de vous."
                        : "Please use your current location so we can find places near you.",

                locationRequired:
                    true,

                locationSource:
                    "gps_required",
            });
        }


        /* =====================================================
           IMPORTANT LOCATION RULE
           
           Typed area is NEVER converted into coordinates.
           
           GPS is the ONLY geographic source for nearby
           matching.
        ====================================================== */

        const resolvedLatitude =
            userLatitude;

        const resolvedLongitude =
            userLongitude;

        const locationSource =
            "gps";

        const hasResolvedLocation =
            true;


        /*
         * Keep the text only as descriptive/search history
         * information. It has NO effect on distance.
         */
        const resolvedLocationText =
            typeof locationText ===
                "string" &&
                locationText.trim()
                ? locationText.trim()
                : null;


        const locationResolution =
            null;


        /* =====================================================
           INPUT NORMALIZATION
        ====================================================== */

        const numericBudget =
            Number(
                budget
            );

        const hasBudget =
            Number.isFinite(
                numericBudget
            ) &&
            numericBudget > 0;


        const numericPeople =
            Math.max(
                Number(
                    people
                ) || 1,
                1
            );


        /* =====================================================
           GET APPROVED SPOTS
           
           ONLY APPROVED SPOTS.
        ====================================================== */

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
                .limit(
                    250
                );


        if (
            spotsError
        ) {
            console.error(
                "Spots error:",
                spotsError
            );

            return res.status(
                500
            ).json({
                error:
                    language ===
                        "fr"
                        ? "Impossible de trouver des endroits."
                        : "Unable to find places.",
            });
        }


        /* =====================================================
           REMOVE SPOTS WITHOUT REAL GPS
           
           We do NOT guess their location from:
           - neighborhood
           - address
           - city
           - name
        ====================================================== */

        const gpsSpots =
            (
                spots ||
                []
            ).filter(
                spot =>
                    isValidCoordinates(
                        spot?.latitude,
                        spot?.longitude
                    )
            );


        /* =====================================================
           RANK SPOTS
           
           Location is now always the user's REAL GPS.
        ====================================================== */

        const ranked =
            rankSpots(
                gpsSpots,
                {
                    latitude:
                        resolvedLatitude,

                    longitude:
                        resolvedLongitude,

                    /*
                     * Do not let typed location influence
                     * the geographic match.
                     */
                    locationText:
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
                }
            );


        /* =====================================================
           RE-CALCULATE DISTANCE
           
           This prevents stale/fake distance values.
        ====================================================== */

        const geographicallyValid =
            ranked
                .map(
                    spot => {

                        const distanceKm =
                            calculateDistanceKm(
                                resolvedLatitude,
                                resolvedLongitude,
                                Number(
                                    spot.latitude
                                ),
                                Number(
                                    spot.longitude
                                )
                            );


                        if (
                            !Number.isFinite(
                                distanceKm
                            )
                        ) {
                            return null;
                        }


                        if (
                            distanceKm <
                            0 ||
                            distanceKm >
                            MAX_MATCH_DISTANCE_KM
                        ) {
                            return null;
                        }


                        return {
                            ...spot,

                            distanceKm,

                            match: {
                                ...spot.match,

                                distanceKm,
                            },
                        };
                    }
                )
                .filter(
                    Boolean
                );


        /* =====================================================
           BUDGET FILTER
        ====================================================== */

        let budgetEligible =
            geographicallyValid;


        if (
            hasBudget
        ) {
            budgetEligible =
                geographicallyValid.filter(
                    spot =>
                        isWithinBudget(
                            spot,
                            numericBudget,
                            numericPeople
                        )
                );
        }


        if (
            hasBudget &&
            budgetEligible.length ===
            0
        ) {
            budgetEligible =
                [];
        }


        /* =====================================================
           PRIMARY RESULTS
           
           Within PRIMARY_MATCH_DISTANCE_KM.
        ====================================================== */

        const primaryResults =
            budgetEligible
                .filter(
                    spot => {

                        const distance =
                            Number(
                                spot?.distanceKm
                            );


                        return (
                            Number.isFinite(
                                distance
                            ) &&
                            distance <=
                            PRIMARY_MATCH_DISTANCE_KM
                        );
                    }
                )
                .sort(
                    (
                        a,
                        b
                    ) => {

                        const scoreA =
                            Number(
                                a?.match?.score
                            ) || 0;

                        const scoreB =
                            Number(
                                b?.match?.score
                            ) || 0;


                        if (
                            scoreB !==
                            scoreA
                        ) {
                            return (
                                scoreB -
                                scoreA
                            );
                        }


                        return (
                            Number(
                                a.distanceKm
                            ) -
                            Number(
                                b.distanceKm
                            )
                        );
                    }
                );


        /* =====================================================
           FALLBACK RESULTS
           
           1 KM TO 1.5 KM.
        ====================================================== */

        const fallbackResults =
            budgetEligible
                .filter(
                    spot => {

                        const distance =
                            Number(
                                spot?.distanceKm
                            );


                        return (
                            Number.isFinite(
                                distance
                            ) &&

                            distance >
                            PRIMARY_MATCH_DISTANCE_KM &&

                            distance <=
                            MAX_MATCH_DISTANCE_KM
                        );
                    }
                )
                .sort(
                    (
                        a,
                        b
                    ) => {

                        const scoreA =
                            Number(
                                a?.match?.score
                            ) || 0;

                        const scoreB =
                            Number(
                                b?.match?.score
                            ) || 0;


                        if (
                            scoreB !==
                            scoreA
                        ) {
                            return (
                                scoreB -
                                scoreA
                            );
                        }


                        return (
                            Number(
                                a.distanceKm
                            ) -
                            Number(
                                b.distanceKm
                            )
                        );
                    }
                );


        /* =====================================================
           FINAL RESULTS
        ====================================================== */

        const results =
            primaryResults
                .slice(
                    0,
                    10
                )
                .map(
                    spot => ({
                        ...spot,

                        distanceKm:
                            Number(
                                spot.distanceKm
                            ),

                        match: {
                            ...spot.match,

                            distanceKm:
                                Number(
                                    spot.distanceKm
                                ),
                        },
                    })
                );


        const alternatives =
            fallbackResults
                .slice(
                    0,
                    5
                )
                .map(
                    spot => ({
                        ...spot,

                        distanceKm:
                            Number(
                                spot.distanceKm
                            ),

                        match: {
                            ...spot.match,

                            distanceKm:
                                Number(
                                    spot.distanceKm
                                ),
                        },
                    })
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

                    /*
                     * This text is stored for history only.
                     */
                    location_text:
                        resolvedLocationText,

                    /*
                     * AUTHORITATIVE USER GPS.
                     */
                    latitude:
                        resolvedLatitude,

                    longitude:
                        resolvedLongitude,

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
                        language ===
                            "fr"
                            ? "fr"
                            : "en",
                })
                .select(
                    "id"
                )
                .single();


        if (
            searchError
        ) {
            console.error(
                "Search record:",
                searchError
            );
        }


        /* =====================================================
           RESPONSE
        ====================================================== */

        return res.status(
            200
        ).json({
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
                usingLocation:
                    true,

                locationSource:
                    "gps",

                locationText:
                    resolvedLocationText,

                latitude:
                    resolvedLatitude,

                longitude:
                    resolvedLongitude,

                locationResolved:
                    true,

                primaryRadiusKm:
                    PRIMARY_MATCH_DISTANCE_KM,

                maximumRadiusKm:
                    MAX_MATCH_DISTANCE_KM,

                totalApprovedSpots:
                    (
                        spots ||
                        []
                    ).length,

                approvedSpotsWithGps:
                    gpsSpots.length,

                approvedSpotsWithoutGps:
                    (
                        spots ||
                        []
                    ).length -
                    gpsSpots.length,

                mainResults:
                    results.length,

                fartherNearbyResults:
                    alternatives.length,

                budget:
                    hasBudget
                        ? numericBudget
                        : null,

                people:
                    numericPeople,

                category:
                    category ||
                    null,

                locationResolution:
                    null,
            },
        });

    } catch (
    error
    ) {
        console.error(
            "Search API error:",
            error
        );

        return res.status(
            500
        ).json({
            error:
                language ===
                    "fr"
                    ? "Une erreur s'est produite lors de la recherche."
                    : "Something went wrong while finding your places.",
        });
    }
}