import {
    calculateDistance,
} from "./distance";


/*
 * NiceThings geographic matching rule.
 *
 * A place must be genuinely near the user's resolved
 * coordinates to appear in normal search results.
 *
 * 1.0 km = strict primary radius.
 * 1.5 km = absolute safety ceiling.
 *
 * Anything beyond 1.5 km is never returned by rankSpots
 * when real user coordinates are available.
 */
export const MAX_MATCH_DISTANCE_KM = 1.5;
export const PRIMARY_MATCH_DISTANCE_KM = 1.0;


/* =========================================================
   HELPERS
========================================================= */

function clamp(
    value,
    minimum,
    maximum
) {
    return Math.min(
        Math.max(
            value,
            minimum
        ),
        maximum
    );
}


function normalizeText(
    value
) {
    return String(
        value || ""
    )
        .trim()
        .toLowerCase()
        .normalize(
            "NFD"
        )
        .replace(
            /[\u0300-\u036f]/g,
            ""
        )
        .replace(
            /[^a-z0-9\s-]/g,
            " "
        )
        .replace(
            /\s+/g,
            " "
        );
}


/* =========================================================
   BUDGET
========================================================= */

function getSpotPriceRange(
    spot
) {
    const minimum =
        Number(
            spot.minimum_price
        );

    const maximum =
        Number(
            spot.maximum_price
        );

    const average =
        Number(
            spot.average_price
        );

    const validMinimum =
        Number.isFinite(
            minimum
        ) &&
            minimum > 0
            ? minimum
            : null;

    const validMaximum =
        Number.isFinite(
            maximum
        ) &&
            maximum > 0
            ? maximum
            : null;

    const validAverage =
        Number.isFinite(
            average
        ) &&
            average > 0
            ? average
            : null;

    let low =
        validMinimum ??
        validAverage ??
        validMaximum;

    let high =
        validMaximum ??
        validAverage ??
        validMinimum;

    if (
        low === null &&
        high === null
    ) {
        return {
            minimum: null,
            maximum: null,
            average: null,
        };
    }

    if (
        low === null
    ) {
        low =
            high;
    }

    if (
        high === null
    ) {
        high =
            low;
    }

    if (
        low > high
    ) {
        const temp =
            low;

        low =
            high;

        high =
            temp;
    }

    const calculatedAverage =
        validAverage ??
        (
            low +
            high
        ) /
        2;

    return {
        minimum:
            low,

        maximum:
            high,

        average:
            calculatedAverage,
    };
}


function budgetScore(
    spot,
    budget,
    people
) {
    if (
        !budget ||
        budget <= 0
    ) {
        return {
            score: 70,
            status:
                "NO_BUDGET",
            differencePercent:
                null,
        };
    }

    const count =
        Math.max(
            Number(
                people
            ) || 1,
            1
        );

    const totalBudget =
        Number(
            budget
        );

    const budgetPerPerson =
        totalBudget /
        count;

    const prices =
        getSpotPriceRange(
            spot
        );

    if (
        prices.minimum ===
        null
    ) {
        return {
            score: 45,
            status:
                "UNKNOWN",
            differencePercent:
                null,
        };
    }


    /*
     * Completely within budget.
     */

    if (
        prices.maximum <=
        budgetPerPerson
    ) {
        const spare =
            budgetPerPerson -
            prices.maximum;

        const sparePercent =
            spare /
            Math.max(
                budgetPerPerson,
                1
            );

        const score =
            clamp(
                92 +
                Math.min(
                    sparePercent *
                    20,
                    8
                ),
                92,
                100
            );

        return {
            score,

            status:
                "WITHIN_BUDGET",

            differencePercent:
                sparePercent *
                100,
        };
    }


    /*
     * The requested budget falls inside
     * the restaurant's price range.
     *
     * Example:
     *
     * Budget: 5,000
     * Restaurant: 4,000 - 7,000
     */

    if (
        prices.minimum <=
        budgetPerPerson &&
        prices.maximum >
        budgetPerPerson
    ) {
        const overAmount =
            prices.maximum -
            budgetPerPerson;

        const overPercent =
            overAmount /
            Math.max(
                budgetPerPerson,
                1
            );

        return {
            score: clamp(
                88 -
                overPercent *
                35,
                55,
                88
            ),

            status:
                "NEAR_BUDGET",

            differencePercent:
                -overPercent *
                100,
        };
    }


    /*
     * Entire restaurant is above
     * the user's budget.
     */

    const overAmount =
        prices.minimum -
        budgetPerPerson;

    const overPercent =
        overAmount /
        Math.max(
            budgetPerPerson,
            1
        );


    /*
     * Strong penalty for expensive
     * places.
     */

    let score;

    if (
        overPercent <=
        0.10
    ) {
        score =
            70 -
            overPercent *
            100;

    } else if (
        overPercent <=
        0.25
    ) {
        score =
            60 -
            (
                overPercent -
                0.10
            ) *
            100;

    } else if (
        overPercent <=
        0.50
    ) {
        score =
            45 -
            (
                overPercent -
                0.25
            ) *
            70;

    } else {
        score =
            25 -
            Math.min(
                (
                    overPercent -
                    0.50
                ) *
                30,
                20
            );
    }

    return {
        score: clamp(
            score,
            5,
            70
        ),

        status:
            "ABOVE_BUDGET",

        differencePercent:
            -overPercent *
            100,
    };
}


/* =========================================================
   CATEGORY
========================================================= */

function categoryScore(
    spot,
    category
) {
    if (
        !category
    ) {
        return 70;
    }

    const values = [
        spot.category,
        spot.cuisine,
    ]
        .filter(
            Boolean
        )
        .map(
            value =>
                normalizeText(
                    value
                )
        );

    const wanted =
        normalizeText(
            category
        );

    if (
        !wanted
    ) {
        return 70;
    }

    if (
        values.includes(
            wanted
        )
    ) {
        return 100;
    }

    const wantedWords =
        wanted
            .split(
                " "
            )
            .filter(
                Boolean
            );

    const partialMatch =
        wantedWords.length >
        0 &&
        values.some(
            value =>
                wantedWords.every(
                    word =>
                        value.includes(
                            word
                        )
                )
        );

    if (
        partialMatch
    ) {
        return 90;
    }


    /*
     * Partial overlap.
     */

    const hasAnyWord =
        wantedWords.some(
            word =>
                values.some(
                    value =>
                        value.includes(
                            word
                        )
                )
        );

    if (
        hasAnyWord
    ) {
        return 65;
    }

    return 25;
}


/* =========================================================
   LEGACY TEXT LOCATION HELPER

   Kept for compatibility with any older code that may
   import/use this file.

   IMPORTANT:
   It is NO LONGER used by locationScore().
========================================================= */

function locationTextScore(
    spot,
    locationText
) {
    if (
        !locationText ||
        !String(
            locationText
        ).trim()
    ) {
        return null;
    }

    const wanted =
        normalizeText(
            locationText
        );

    if (
        !wanted
    ) {
        return null;
    }

    const neighborhood =
        normalizeText(
            spot.neighborhood
        );

    const city =
        normalizeText(
            spot.city
        );

    const address =
        normalizeText(
            spot.address
        );

    if (
        neighborhood ===
        wanted
    ) {
        return 100;
    }

    if (
        neighborhood &&
        (
            neighborhood.includes(
                wanted
            ) ||
            wanted.includes(
                neighborhood
            )
        )
    ) {
        return 95;
    }

    if (
        address &&
        address.includes(
            wanted
        )
    ) {
        return 90;
    }

    if (
        city ===
        wanted
    ) {
        return 80;
    }

    if (
        city &&
        (
            city.includes(
                wanted
            ) ||
            wanted.includes(
                city
            )
        )
    ) {
        return 75;
    }

    const wantedWords =
        wanted
            .split(
                " "
            )
            .filter(
                Boolean
            );

    if (
        wantedWords.length >
        0
    ) {
        const searchable =
            [
                neighborhood,
                address,
                city,
            ]
                .filter(
                    Boolean
                )
                .join(
                    " "
                );

        const matchedWords =
            wantedWords.filter(
                word =>
                    searchable.includes(
                        word
                    )
            );

        if (
            matchedWords.length ===
            wantedWords.length
        ) {
            return 85;
        }

        if (
            matchedWords.length >
            0
        ) {
            return 70;
        }
    }

    return 40;
}
/* =========================================================
   GPS DISTANCE SCORE

   GPS coordinates are now the ONLY geographic signal
   used by the matching engine.

   Typed neighborhood / city / address text is NOT used
   to determine how geographically relevant a Spot is.
========================================================= */

function locationScore(
    distanceKm
) {
    if (
        !Number.isFinite(
            Number(
                distanceKm
            )
        ) ||
        Number(
            distanceKm
        ) < 0
    ) {
        return 0;
    }


    const distance =
        Number(
            distanceKm
        );


    /*
     * Extremely close.
     */

    if (
        distance <=
        0.25
    ) {
        return 100;
    }


    /*
     * 250m - 500m.
     */

    if (
        distance <=
        0.5
    ) {
        return 98;
    }


    /*
     * 500m - 1km.
     */

    if (
        distance <=
        PRIMARY_MATCH_DISTANCE_KM
    ) {
        return 94;
    }


    /*
     * 1km - 1.5km.
     *
     * This is the outer fallback range.
     */

    if (
        distance <=
        MAX_MATCH_DISTANCE_KM
    ) {
        const range =
            MAX_MATCH_DISTANCE_KM -
            PRIMARY_MATCH_DISTANCE_KM;

        const progress =
            range > 0
                ? (
                    distance -
                    PRIMARY_MATCH_DISTANCE_KM
                ) /
                range
                : 1;

        return Math.round(
            94 -
            progress *
            25
        );
    }


    /*
     * Beyond our geographic ceiling.
     */

    return 0;
}


/* =========================================================
   RATING
========================================================= */

function ratingScore(
    spot
) {
    const rating =
        Number(
            spot.rating
        ) || 0;

    const reviewCount =
        Number(
            spot.review_count
        ) || 0;

    if (
        rating <= 0
    ) {
        return 50;
    }


    /*
     * Bayesian-style confidence.
     *
     * A 5.0 with one review should
     * not beat a 4.7 with hundreds
     * of reviews.
     */

    const priorRating =
        3.5;

    const priorReviews =
        10;

    const adjustedRating =
        (
            rating *
            reviewCount +
            priorRating *
            priorReviews
        ) /
        (
            reviewCount +
            priorReviews
        );

    let score =
        clamp(
            adjustedRating *
            20,
            0,
            100
        );


    /*
     * Small penalty for no review
     * history.
     */

    if (
        reviewCount ===
        0
    ) {
        score =
            50;
    }

    return score;
}


/* =========================================================
   VERIFICATION
========================================================= */

function verificationScore(
    spot
) {
    let score =
        0;


    if (
        spot.verified
    ) {
        score +=
            50;
    }


    if (
        spot.price_verified_at
    ) {
        score +=
            25;
    }


    if (
        spot.location_verified_at
    ) {
        score +=
            25;
    }


    return score;
}


/* =========================================================
   DATA CONFIDENCE
========================================================= */

function dataConfidenceScore(
    spot
) {
    let score =
        0;

    let total =
        0;


    const checks = [
        Boolean(
            spot.name
        ),

        Boolean(
            spot.category
        ),

        Boolean(
            spot.address
        ),

        Number.isFinite(
            Number(
                spot.latitude
            )
        ),

        Number.isFinite(
            Number(
                spot.longitude
            )
        ),

        Number(
            spot.average_price
        ) > 0 ||
        Number(
            spot.minimum_price
        ) > 0,

        Boolean(
            spot.opening_time ||
            spot.closing_time
        ),
    ];


    checks.forEach(
        check => {
            total +=
                1;

            if (
                check
            ) {
                score +=
                    1;
            }
        }
    );


    if (
        !total
    ) {
        return 0;
    }


    return (
        score /
        total
    ) *
        100;
}


/* =========================================================
   STATUS HELPERS
========================================================= */

function distanceStatus(
    distanceKm
) {
    if (
        distanceKm ===
        null ||
        !Number.isFinite(
            Number(
                distanceKm
            )
        )
    ) {
        return "UNKNOWN";
    }


    const distance =
        Number(
            distanceKm
        );


    if (
        distance <=
        0.5
    ) {
        return "VERY_CLOSE";
    }


    if (
        distance <=
        2
    ) {
        return "NEARBY";
    }


    if (
        distance <=
        5
    ) {
        return "MODERATE_DISTANCE";
    }


    return "FAR";
}


function recommendationText(
    budgetStatus,
    distanceStatusValue,
    budgetProvided
) {
    if (
        budgetProvided &&
        budgetStatus ===
        "WITHIN_BUDGET"
    ) {
        if (
            distanceStatusValue ===
            "VERY_CLOSE"
        ) {
            return "Excellent match — close to you and within your budget.";
        }


        if (
            distanceStatusValue ===
            "NEARBY"
        ) {
            return "Great match — nearby and within your budget.";
        }


        if (
            distanceStatusValue ===
            "MODERATE_DISTANCE"
        ) {
            return "Good match — within your budget, but farther away.";
        }


        if (
            distanceStatusValue ===
            "FAR"
        ) {
            return "Within your budget, but far from your location.";
        }


        return "Within your budget.";
    }


    if (
        budgetProvided &&
        budgetStatus ===
        "NEAR_BUDGET"
    ) {
        return "Close to your budget.";
    }


    if (
        budgetProvided &&
        budgetStatus ===
        "ABOVE_BUDGET"
    ) {
        return "Above your requested budget.";
    }


    if (
        distanceStatusValue ===
        "VERY_CLOSE"
    ) {
        return "Very close to your location.";
    }


    if (
        distanceStatusValue ===
        "NEARBY"
    ) {
        return "Nearby option.";
    }


    if (
        distanceStatusValue ===
        "MODERATE_DISTANCE"
    ) {
        return "A little farther away.";
    }


    if (
        distanceStatusValue ===
        "FAR"
    ) {
        return "Farther from your location.";
    }


    return "Potential match.";
}


/* =========================================================
   SCORE ONE SPOT
========================================================= */

export function scoreSpot(
    spot,
    options = {}
) {
    const {
        latitude,
        longitude,

        /*
         * Kept for API compatibility.
         *
         * It is deliberately NOT used by locationScore().
         */
        locationText,

        budget,
        people = 1,
        category,
    } =
        options;


    let distanceKm =
        null;


    /*
     * GPS distance.
     *
     * Both the user's coordinates and the Spot's
     * coordinates must exist before we calculate distance.
     */

    if (
        latitude !== null &&
        latitude !== undefined &&
        longitude !== null &&
        longitude !== undefined &&
        spot.latitude !== null &&
        spot.latitude !== undefined &&
        spot.longitude !== null &&
        spot.longitude !== undefined
    ) {
        const userLatitude =
            Number(
                latitude
            );

        const userLongitude =
            Number(
                longitude
            );

        const spotLatitude =
            Number(
                spot.latitude
            );

        const spotLongitude =
            Number(
                spot.longitude
            );


        if (
            Number.isFinite(
                userLatitude
            ) &&
            Number.isFinite(
                userLongitude
            ) &&
            Number.isFinite(
                spotLatitude
            ) &&
            Number.isFinite(
                spotLongitude
            ) &&
            userLatitude >= -90 &&
            userLatitude <= 90 &&
            userLongitude >= -180 &&
            userLongitude <= 180 &&
            spotLatitude >= -90 &&
            spotLatitude <= 90 &&
            spotLongitude >= -180 &&
            spotLongitude <= 180
        ) {
            distanceKm =
                calculateDistance(
                    userLatitude,
                    userLongitude,
                    spotLatitude,
                    spotLongitude
                );
        }
    }


    /*
     * GPS is mandatory for geographic matching.
     *
     * We intentionally do NOT do:
     *
     * locationTextScore(
     *     spot,
     *     locationText
     * )
     *
     * because a typed area is not a reliable geographic
     * position.
     */

    const locationMatch =
        locationScore(
            distanceKm
        );


    const budgetResult =
        budgetScore(
            spot,
            budget,
            people
        );


    const categoryMatch =
        categoryScore(
            spot,
            category
        );


    const ratingMatch =
        ratingScore(
            spot
        );


    const verificationMatch =
        verificationScore(
            spot
        );


    const confidenceMatch =
        dataConfidenceScore(
            spot
        );


    /*
     * Intelligent weighting.
     *
     * Budget is strongest when the
     * user actually supplied one.
     */

    let score;


    if (
        budget &&
        Number(
            budget
        ) > 0
    ) {
        score =
            budgetResult.score *
            0.40 +

            locationMatch *
            0.30 +

            categoryMatch *
            0.15 +

            ratingMatch *
            0.10 +

            verificationMatch *
            0.05;

    } else {
        score =
            locationMatch *
            0.40 +

            categoryMatch *
            0.20 +

            ratingMatch *
            0.20 +

            verificationMatch *
            0.10 +

            confidenceMatch *
            0.10;
    }


    /*
     * Missing data should slightly
     * reduce confidence rather than
     * creating a fake high match.
     */

    const missingDataPenalty =
        (
            100 -
            confidenceMatch
        ) *
        0.08;


    score -=
        missingDataPenalty;


    /*
     * If a category was explicitly
     * requested and the place is a
     * poor category match, prevent it
     * from appearing as an excellent
     * match just because it is nearby.
     */

    if (
        category &&
        categoryMatch <
        35
    ) {
        score =
            Math.min(
                score,
                55
            );
    }


    /*
     * Strong budget protection.
     *
     * Places substantially above the
     * requested budget cannot receive
     * an artificially high score.
     */

    if (
        budget &&
        budgetResult.status ===
        "ABOVE_BUDGET"
    ) {
        const prices =
            getSpotPriceRange(
                spot
            );

        const budgetPerPerson =
            Number(
                budget
            ) /
            Math.max(
                Number(
                    people
                ) || 1,
                1
            );


        if (
            prices.minimum !==
            null &&
            prices.minimum >
            budgetPerPerson *
            2
        ) {
            score =
                Math.min(
                    score,
                    45
                );
        }
    }


    score =
        Math.round(
            clamp(
                score,
                0,
                100
            )
        );


    const distanceStatusValue =
        distanceStatus(
            distanceKm
        );


    const budgetStatus =
        budgetResult.status;


    return {
        score,

        distanceKm,

        budgetStatus,

        distanceStatus:
            distanceStatusValue,

        recommendation:
            recommendationText(
                budgetStatus,
                distanceStatusValue,
                Boolean(
                    budget &&
                    Number(
                        budget
                    ) > 0
                )
            ),

        breakdown: {
            budget:
                Math.round(
                    budgetResult.score
                ),

            distance:
                Math.round(
                    locationMatch
                ),

            category:
                Math.round(
                    categoryMatch
                ),

            rating:
                Math.round(
                    ratingMatch
                ),

            verification:
                Math.round(
                    verificationMatch
                ),

            confidence:
                Math.round(
                    confidenceMatch
                ),
        },

        budgetDetails: {
            minimum:
                getSpotPriceRange(
                    spot
                ).minimum,

            maximum:
                getSpotPriceRange(
                    spot
                ).maximum,

            average:
                getSpotPriceRange(
                    spot
                ).average,

            budgetPerPerson:
                budget &&
                    Number(
                        budget
                    ) > 0
                    ? Number(
                        budget
                    ) /
                    Math.max(
                        Number(
                            people
                        ) || 1,
                        1
                    )
                    : null,

            differencePercent:
                budgetResult.differencePercent,
        },
    };
}
/* =========================================================
   RANK SPOTS
========================================================= */

export function rankSpots(
    spots = [],
    options = {}
) {
    if (
        !Array.isArray(
            spots
        )
    ) {
        return [];
    }


    const {
        latitude,
        longitude,
        locationText,
        budget,
        people = 1,
        category,
    } =
        options;


    /*
     * GPS must exist for geographic
     * matching.
     *
     * We intentionally do not attempt
     * to resolve a typed area here.
     */

    const hasUserGps =
        Number.isFinite(
            Number(
                latitude
            )
        ) &&
        Number.isFinite(
            Number(
                longitude
            )
        ) &&
        Number(
            latitude
        ) >= -90 &&
        Number(
            latitude
        ) <= 90 &&
        Number(
            longitude
        ) >= -180 &&
        Number(
            longitude
        ) <= 180;


    /*
     * If there is no real user GPS,
     * return an empty geographic result.
     *
     * This prevents a typed neighborhood
     * from being used as a substitute.
     */

    if (
        !hasUserGps
    ) {
        return [];
    }


    const scored =
        spots
            .map(
                spot => {

                    if (
                        !spot
                    ) {
                        return null;
                    }


                    /*
                     * A Spot must itself have
                     * valid GPS coordinates.
                     */

                    const hasSpotGps =
                        Number.isFinite(
                            Number(
                                spot.latitude
                            )
                        ) &&
                        Number.isFinite(
                            Number(
                                spot.longitude
                            )
                        ) &&
                        Number(
                            spot.latitude
                        ) >= -90 &&
                        Number(
                            spot.latitude
                        ) <= 90 &&
                        Number(
                            spot.longitude
                        ) >= -180 &&
                        Number(
                            spot.longitude
                        ) <= 180;


                    if (
                        !hasSpotGps
                    ) {
                        return null;
                    }


                    const match =
                        scoreSpot(
                            spot,
                            {
                                latitude,
                                longitude,
                                locationText,
                                budget,
                                people,
                                category,
                            }
                        );


                    /*
                     * No valid geographic
                     * distance = no result.
                     */

                    if (
                        !Number.isFinite(
                            Number(
                                match.distanceKm
                            )
                        )
                    ) {
                        return null;
                    }


                    const distanceKm =
                        Number(
                            match.distanceKm
                        );


                    /*
                     * Absolute geographic
                     * ceiling.
                     */

                    if (
                        distanceKm >
                        MAX_MATCH_DISTANCE_KM
                    ) {
                        return null;
                    }


                    return {
                        ...spot,

                        match: {
                            ...match,
                        },

                        distanceKm,
                    };
                }
            )
            .filter(
                Boolean
            );


    /*
     * Sort primarily by match score.
     *
     * If two places have nearly the
     * same score, prefer the closer one.
     */

    scored.sort(
        (
            first,
            second
        ) => {

            const firstScore =
                Number(
                    first?.match?.score
                ) || 0;

            const secondScore =
                Number(
                    second?.match?.score
                ) || 0;


            if (
                secondScore !==
                firstScore
            ) {
                return (
                    secondScore -
                    firstScore
                );
            }


            const firstDistance =
                Number(
                    first?.distanceKm
                );

            const secondDistance =
                Number(
                    second?.distanceKm
                );


            if (
                Number.isFinite(
                    firstDistance
                ) &&
                Number.isFinite(
                    secondDistance
                )
            ) {
                return (
                    firstDistance -
                    secondDistance
                );
            }


            return 0;
        }
    );


    return scored;
}


/* =========================================================
   LOCATION-ONLY FILTER
========================================================= */

export function filterNearbySpots(
    spots = [],
    latitude,
    longitude,
    maximumDistanceKm =
        MAX_MATCH_DISTANCE_KM
) {
    if (
        !Array.isArray(
            spots
        )
    ) {
        return [];
    }


    const userLatitude =
        Number(
            latitude
        );

    const userLongitude =
        Number(
            longitude
        );

    const maximumDistance =
        Number(
            maximumDistanceKm
        );


    if (
        !Number.isFinite(
            userLatitude
        ) ||
        !Number.isFinite(
            userLongitude
        ) ||
        !Number.isFinite(
            maximumDistance
        )
    ) {
        return [];
    }


    return spots
        .map(
            spot => {

                if (
                    !spot
                ) {
                    return null;
                }


                const spotLatitude =
                    Number(
                        spot.latitude
                    );

                const spotLongitude =
                    Number(
                        spot.longitude
                    );


                if (
                    !Number.isFinite(
                        spotLatitude
                    ) ||
                    !Number.isFinite(
                        spotLongitude
                    )
                ) {
                    return null;
                }


                const distanceKm =
                    calculateDistance(
                        userLatitude,
                        userLongitude,
                        spotLatitude,
                        spotLongitude
                    );


                if (
                    !Number.isFinite(
                        distanceKm
                    )
                ) {
                    return null;
                }


                if (
                    distanceKm >
                    maximumDistance
                ) {
                    return null;
                }


                return {
                    ...spot,

                    distanceKm,
                };
            }
        )
        .filter(
            Boolean
        )
        .sort(
            (
                first,
                second
            ) =>
                Number(
                    first.distanceKm
                ) -
                Number(
                    second.distanceKm
                )
        );
}


/* =========================================================
   PRIMARY / ALTERNATIVE SPLIT
========================================================= */

export function splitByDistance(
    spots = []
) {
    if (
        !Array.isArray(
            spots
        )
    ) {
        return {
            primary: [],
            alternatives: [],
        };
    }


    const primary = [];

    const alternatives = [];


    spots.forEach(
        spot => {

            const distance =
                Number(
                    spot?.distanceKm
                );


            if (
                !Number.isFinite(
                    distance
                )
            ) {
                return;
            }


            if (
                distance <=
                PRIMARY_MATCH_DISTANCE_KM
            ) {
                primary.push(
                    spot
                );

                return;
            }


            if (
                distance <=
                MAX_MATCH_DISTANCE_KM
            ) {
                alternatives.push(
                    spot
                );
            }
        }
    );


    primary.sort(
        (
            first,
            second
        ) =>
            Number(
                first.distanceKm
            ) -
            Number(
                second.distanceKm
            )
    );


    alternatives.sort(
        (
            first,
            second
        ) =>
            Number(
                first.distanceKm
            ) -
            Number(
                second.distanceKm
            )
    );


    return {
        primary,
        alternatives,
    };
}


/* =========================================================
   EXPORTS
========================================================= */

export {
    budgetScore,
    categoryScore,
    locationScore,
    ratingScore,
    verificationScore,
    dataConfidenceScore,
    getSpotPriceRange,
};