import supabaseAdmin from "../../../lib/supabaseAdmin";
import { rankSpots } from "../../../lib/matching";
import {
    isLaunchFree,
} from "../../../lib/access";
import {
    getAdminCookie,
    verifyAdminToken,
} from "../../../lib/adminAuth";

/* =========================================================
   LOCATION SETTINGS
========================================================= */

const PRIMARY_RADIUS_KM = 1.0;
const FALLBACK_RADIUS_KM = 1.5;

/* =========================================================
   VALID COORDINATES
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

function distanceBetweenCoordinates(
    latitude1,
    longitude1,
    latitude2,
    longitude2
) {
    const lat1 =
        Number(latitude1);

    const lon1 =
        Number(longitude1);

    const lat2 =
        Number(latitude2);

    const lon2 =
        Number(longitude2);

    if (
        !isValidCoordinates(
            lat1,
            lon1
        ) ||
        !isValidCoordinates(
            lat2,
            lon2
        )
    ) {
        return null;
    }

    const earthRadiusKm =
        6371;

    const degreesToRadians =
        Math.PI / 180;

    const deltaLatitude =
        (lat2 - lat1) *
        degreesToRadians;

    const deltaLongitude =
        (lon2 - lon1) *
        degreesToRadians;

    const a =
        Math.sin(
            deltaLatitude / 2
        ) ** 2 +
        Math.cos(
            lat1 *
            degreesToRadians
        ) *
        Math.cos(
            lat2 *
            degreesToRadians
        ) *
        Math.sin(
            deltaLongitude / 2
        ) ** 2;

    const c =
        2 *
        Math.atan2(
            Math.sqrt(a),
            Math.sqrt(1 - a)
        );

    return (
        earthRadiusKm * c
    );
}

/* =========================================================
   GEOCODE MANUAL LOCATION
========================================================= */

/*
 * When a visitor types something such as:
 *
 *   Bonamoussadi
 *   Akwa
 *   Bali
 *   Makepe
 *
 * we try to turn that text into real coordinates.
 *
 * Nominatim / OpenStreetMap is used only when
 * the visitor did not already provide GPS coordinates.
 */

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
                        "User-Agent":
                            "NiceThings/1.0 location discovery app",
                        "Accept":
                            "application/json",
                    },
                }
            );

        if (
            !response.ok
        ) {
            console.error(
                "Geocoding HTTP error:",
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
            data.length === 0
        ) {
            return null;
        }

        /*
         * Prefer results that look like an actual
         * neighbourhood / suburb / quarter / locality.
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
    } catch (error) {
        console.error(
            "Location geocoding error:",
            error
        );

        return null;
    }
}

/* =========================================================
   RADIUS FILTER
========================================================= */

function filterByRadius(
    rankedSpots,
    latitude,
    longitude,
    radiusKm
) {
    if (
        !isValidCoordinates(
            latitude,
            longitude
        )
    ) {
        return [];
    }

    return rankedSpots.filter(
        spot => {
            const spotLatitude =
                Number(
                    spot?.latitude
                );

            const spotLongitude =
                Number(
                    spot?.longitude
                );

            if (
                !isValidCoordinates(
                    spotLatitude,
                    spotLongitude
                )
            ) {
                return false;
            }

            const distance =
                distanceBetweenCoordinates(
                    latitude,
                    longitude,
                    spotLatitude,
                    spotLongitude
                );

            if (
                !Number.isFinite(
                    distance
                )
            ) {
                return false;
            }

            /*
             * Keep our own calculated distance authoritative.
             * This protects the radius filter even if the
             * matching engine has different distance handling.
             */

            spot.match = {
                ...(spot.match ||
                    {}),
                distanceKm:
                    distance,
            };

            return (
                distance <=
                radiusKm
            );
        }
    );
}

/* =========================================================
   FORMAT RESULT
========================================================= */

function formatSpot(
    spot
) {
    return {
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
    };
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
           ADMIN ACCESS
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
           LAUNCH ACCESS
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
                "Spots:",
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
           SEARCH VALUES
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

        /* =====================================================
           RESOLVE SEARCH LOCATION
        ====================================================== */

        const submittedLatitude =
            Number(
                latitude
            );

        const submittedLongitude =
            Number(
                longitude
            );

        const hasGpsLocation =
            isValidCoordinates(
                submittedLatitude,
                submittedLongitude
            );

        let resolvedLatitude =
            hasGpsLocation
                ? submittedLatitude
                : null;

        let resolvedLongitude =
            hasGpsLocation
                ? submittedLongitude
                : null;

        let resolvedLocationText =
            locationText ||
            null;

        let locationSource =
            hasGpsLocation
                ? "gps"
                : "none";

        let locationResolution =
            null;

        /*
         * If the visitor typed a quarter/location
         * and did not provide GPS coordinates,
         * resolve the location to coordinates.
         */

        if (
            !hasGpsLocation &&
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
           SEARCH OPTIONS
        ====================================================== */

        const searchOptions = {
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
           GEOGRAPHIC FILTERING
        ====================================================== */

        let nearbyPrimary =
            [];

        let nearbyFallback =
            [];

        if (
            hasResolvedLocation
        ) {
            /*
             * FIRST:
             * Strong local radius.
             */

            nearbyPrimary =
                filterByRadius(
                    ranked,
                    resolvedLatitude,
                    resolvedLongitude,
                    PRIMARY_RADIUS_KM
                );

            /*
             * SECOND:
             * Slightly wider radius.
             *
             * We only use this if the 1 km
             * area does not produce useful
             * results.
             */

            if (
                nearbyPrimary.length ===
                0
            ) {
                nearbyFallback =
                    filterByRadius(
                        ranked,
                        resolvedLatitude,
                        resolvedLongitude,
                        FALLBACK_RADIUS_KM
                    );
            }
        } else {
            /*
             * If location could not be resolved,
             * we cannot honestly claim a distance.
             *
             * Keep text matching available rather
             * than pretending places are nearby.
             */

            nearbyPrimary =
                ranked;
        }

        /*
         * Which geographic set should we use?
         */

        const geographicallyRelevant =
            hasResolvedLocation
                ? nearbyPrimary.length >
                    0
                    ? nearbyPrimary
                    : nearbyFallback
                : nearbyPrimary;

        const usingFallbackRadius =
            hasResolvedLocation &&
            nearbyPrimary.length ===
            0 &&
            nearbyFallback.length >
            0;

        /* =====================================================
           SPLIT BY BUDGET
        ====================================================== */

        let primaryResults =
            [];

        let alternativeResults =
            [];

        if (
            hasBudget
        ) {
            /*
             * PRIMARY:
             * Within budget or reasonably close.
             */

            primaryResults =
                geographicallyRelevant.filter(
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
             * ABOVE BUDGET:
             * Kept separate.
             */

            alternativeResults =
                geographicallyRelevant.filter(
                    spot =>
                        spot.match &&
                        spot.match
                            .budgetStatus ===
                        "ABOVE_BUDGET"
                );
        } else {
            primaryResults =
                geographicallyRelevant;
        }

        /* =====================================================
           SMART FALLBACK
        ====================================================== */

        /*
         * If we are inside the radius but there is
         * no affordable/near-budget place, show
         * nearby above-budget options rather than
         * sending the user to a distant restaurant.
         */

        if (
            hasBudget &&
            primaryResults.length ===
            0
        ) {
            primaryResults =
                alternativeResults.slice(
                    0,
                    10
                );

            alternativeResults =
                [];
        }

        /* =====================================================
           SORT BY DISTANCE + MATCH
        ====================================================== */

        const sortResults =
            list => {
                return [
                    ...list,
                ].sort(
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

                        const distanceA =
                            Number(
                                a
                                    ?.match
                                    ?.distanceKm
                            );

                        const distanceB =
                            Number(
                                b
                                    ?.match
                                    ?.distanceKm
                            );

                        /*
                         * Match score has priority.
                         * Distance breaks close ties.
                         */

                        if (
                            scoreB !==
                            scoreA
                        ) {
                            return (
                                scoreB -
                                scoreA
                            );
                        }

                        if (
                            Number.isFinite(
                                distanceA
                            ) &&
                            Number.isFinite(
                                distanceB
                            )
                        ) {
                            return (
                                distanceA -
                                distanceB
                            );
                        }

                        return 0;
                    }
                );
            };

        primaryResults =
            sortResults(
                primaryResults
            );

        alternativeResults =
            sortResults(
                alternativeResults
            );

        /* =====================================================
           FORMAT RESULTS
        ====================================================== */

        const results =
            primaryResults
                .slice(
                    0,
                    10
                )
                .map(
                    formatSpot
                );

        const alternatives =
            alternativeResults
                .slice(
                    0,
                    5
                )
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
                    resolvedLocationText,

                usingLocation:
                    hasResolvedLocation,

                locationSource,

                latitude:
                    hasResolvedLocation
                        ? resolvedLatitude
                        : null,

                longitude:
                    hasResolvedLocation
                        ? resolvedLongitude
                        : null,

                primaryRadiusKm:
                    PRIMARY_RADIUS_KM,

                fallbackRadiusKm:
                    FALLBACK_RADIUS_KM,

                usingFallbackRadius,

                totalApprovedSpots:
                    (
                        spots ||
                        []
                    ).length,

                primaryCount:
                    primaryResults.length,

                alternativeCount:
                    alternativeResults.length,

                locationResolved:
                    hasResolvedLocation,

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