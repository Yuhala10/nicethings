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
   LOCATION HELPERS
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

   Returns REAL straight-line distance between
   two coordinate pairs.

   This is used for search filtering.

   Road distance is handled separately by
   the routing API.
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
   GEOCODE TYPED LOCATION

   Example:

   "Bonamoussadi"
   "Makepe"
   "Akwa"

   becomes real coordinates.
========================================================= */

async function geocodeLocation(
    locationText
) {
    if (
        !locationText ||
        typeof locationText !==
        "string"
    ) {
        return null;
    }

    const cleaned =
        locationText
            .trim();

    if (
        !cleaned
    ) {
        return null;
    }

    try {
        const query =
            `${cleaned}, Cameroon`;

        const url =
            `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&countrycodes=cm&q=${encodeURIComponent(
                query
            )}`;

        const response =
            await fetch(
                url,
                {
                    method:
                        "GET",

                    headers: {
                        Accept:
                            "application/json",

                        "User-Agent":
                            "NiceThings/1.0",
                    },
                }
            );

        if (
            !response.ok
        ) {
            console.error(
                "Geocoding failed:",
                response.status
            );

            return null;
        }

        const data =
            await response.json();

        if (
            !Array.isArray(
                data
            ) ||
            data.length ===
            0
        ) {
            return null;
        }

        /*
         * Prefer places that represent
         * actual local areas.
         */

        const preferred =
            data.find(
                item => {
                    const type =
                        String(
                            item?.type ||
                            ""
                        ).toLowerCase();

                    const category =
                        String(
                            item?.category ||
                            ""
                        ).toLowerCase();

                    return (
                        type ===
                        "neighbourhood" ||
                        type ===
                        "suburb" ||
                        type ===
                        "quarter" ||
                        type ===
                        "village" ||
                        type ===
                        "town" ||
                        type ===
                        "city" ||
                        category ===
                        "place"
                    );
                }
            ) ||
            data[0];

        const resolvedLatitude =
            Number(
                preferred?.lat
            );

        const resolvedLongitude =
            Number(
                preferred?.lon
            );

        if (
            !isValidCoordinates(
                resolvedLatitude,
                resolvedLongitude
            )
        ) {
            return null;
        }

        return {
            latitude:
                resolvedLatitude,

            longitude:
                resolvedLongitude,

            displayName:
                preferred?.display_name ||
                cleaned,

            source:
                "geocoded",
        };
    } catch (
    error
    ) {
        console.error(
            "Geocoding error:",
            error
        );

        return null;
    }
}

/* =========================================================
   BUDGET CHECK

   This is intentionally strict.

   If a user supplies a budget, we prefer places
   that can actually fit that budget.

   A place whose MINIMUM price is already above
   the user's total budget is not considered
   affordable.
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

    /*
     * Your matching engine treats the submitted
     * budget as a total budget and calculates a
     * per-person budget.
     */

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
        /*
         * Unknown pricing is not automatically
         * rejected. The matching engine will
         * penalize it appropriately.
         */

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
            locationText,
            budget,
            people,
            category,
            language = "en",
        } = req.body || {};

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
            numericBudget >
            0;

        const numericPeople =
            Math.max(
                Number(
                    people
                ) || 1,
                1
            );

        const submittedLatitude =
            Number(
                latitude
            );

        const submittedLongitude =
            Number(
                longitude
            );

        const hasGps =
            isValidCoordinates(
                submittedLatitude,
                submittedLongitude
            );

        /* =====================================================
           RESOLVE LOCATION
        ====================================================== */

        let resolvedLatitude =
            null;

        let resolvedLongitude =
            null;

        let resolvedLocationText =
            locationText ||
            null;

        let locationSource =
            "none";

        let locationResolution =
            null;

        /*
         * GPS ALWAYS wins over typed text.
         */

        if (
            hasGps
        ) {
            resolvedLatitude =
                submittedLatitude;

            resolvedLongitude =
                submittedLongitude;

            locationSource =
                "gps";
        }

        /*
         * If no GPS exists, try to understand
         * the quarter/area the person typed.
         */

        else if (
            locationText
        ) {
            const geocoded =
                await geocodeLocation(
                    locationText
                );

            if (
                geocoded
            ) {
                resolvedLatitude =
                    geocoded.latitude;

                resolvedLongitude =
                    geocoded.longitude;

                resolvedLocationText =
                    geocoded.displayName ||
                    locationText;

                locationSource =
                    "geocoded";

                locationResolution =
                    geocoded;
            }
        }

        const hasResolvedLocation =
            isValidCoordinates(
                resolvedLatitude,
                resolvedLongitude
            );

        /* =====================================================
           GET APPROVED SPOTS
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
                .limit(250);

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
           SCORE EVERYTHING
        ====================================================== */

        const ranked =
            rankSpots(
                spots || [],
                {
                    latitude:
                        hasResolvedLocation
                            ? resolvedLatitude
                            : null,

                    longitude:
                        hasResolvedLocation
                            ? resolvedLongitude
                            : null,

                    locationText:
                        resolvedLocationText,

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
           IMPORTANT:

           rankSpots() now already removes anything
           beyond 1.5 km when real coordinates exist.

           We additionally calculate the distance here
           ourselves so the API response cannot contain
           a bogus "0 metres" caused by stale matching data.
        ====================================================== */

        const geographicallyValid =
            ranked
                .map(
                    spot => {
                        let distanceKm =
                            null;

                        if (
                            hasResolvedLocation &&
                            isValidCoordinates(
                                spot.latitude,
                                spot.longitude
                            )
                        ) {
                            distanceKm =
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
                        }

                        /*
                         * Never trust a missing distance as
                         * zero.
                         */

                        if (
                            hasResolvedLocation &&
                            !Number.isFinite(
                                distanceKm
                            )
                        ) {
                            return null;
                        }

                        /*
                         * Absolute geographic boundary.
                         */

                        if (
                            hasResolvedLocation &&
                            (
                                distanceKm <
                                0 ||
                                distanceKm >
                                MAX_MATCH_DISTANCE_KM
                            )
                        ) {
                            return null;
                        }

                        return {
                            ...spot,

                            match: {
                                ...spot.match,

                                distanceKm:
                                    hasResolvedLocation
                                        ? distanceKm
                                        : spot
                                            .match
                                            ?.distanceKm ??
                                        null,
                            },

                            distanceKm:
                                hasResolvedLocation
                                    ? distanceKm
                                    : spot
                                        .match
                                        ?.distanceKm ??
                                    null,
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

        /*
         * If there are affordable nearby places,
         * ONLY those are shown.
         *
         * We do not quietly replace them with
         * expensive places.
         */

        if (
            hasBudget &&
            budgetEligible.length >
            0
        ) {
            budgetEligible =
                budgetEligible;
        }

        /*
         * If nothing fits the budget nearby,
         * return an empty result rather than
         * showing a restaurant that violates
         * the user's request.
         */

        else if (
            hasBudget
        ) {
            budgetEligible =
                [];
        }

        /* =====================================================
           PRIMARY 1 KM
        ====================================================== */

        const primaryResults =
            budgetEligible
                .filter(
                    spot => {
                        const distance =
                            Number(
                                spot
                                    ?.distanceKm
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
                                a
                                    ?.match
                                    ?.score
                            ) || 0;

                        const scoreB =
                            Number(
                                b
                                    ?.match
                                    ?.score
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
           FALLBACK 1–1.5 KM

           These are NOT placed into the main results.

           They are returned separately so the UI can say:

           "A little farther"
        ====================================================== */

        const fallbackResults =
            budgetEligible
                .filter(
                    spot => {
                        const distance =
                            Number(
                                spot
                                    ?.distanceKm
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
                                a
                                    ?.match
                                    ?.score
                            ) || 0;

                        const scoreB =
                            Number(
                                b
                                    ?.match
                                    ?.score
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

           Main results:
           ONLY within 1 km.

           Fallback:
           1–1.5 km.

           NEVER >1.5 km.
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

                    location_text:
                        resolvedLocationText,

                    latitude:
                        hasResolvedLocation
                            ? resolvedLatitude
                            : null,

                    longitude:
                        hasResolvedLocation
                            ? resolvedLongitude
                            : null,

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
                    hasResolvedLocation,

                locationSource,

                locationText:
                    resolvedLocationText,

                latitude:
                    hasResolvedLocation
                        ? resolvedLatitude
                        : null,

                longitude:
                    hasResolvedLocation
                        ? resolvedLongitude
                        : null,

                locationResolved:
                    hasResolvedLocation,

                primaryRadiusKm:
                    PRIMARY_MATCH_DISTANCE_KM,

                maximumRadiusKm:
                    MAX_MATCH_DISTANCE_KM,

                totalApprovedSpots:
                    (
                        spots ||
                        []
                    ).length,

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
                    locationResolution
                        ? {
                            displayName:
                                locationResolution.displayName,

                            source:
                                locationResolution.source,
                        }
                        : null,
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