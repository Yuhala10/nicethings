export const PRIMARY_MATCH_DISTANCE_KM = 1;

import {
    calculateDistance,
} from "./distance";

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

function normalizeText(value) {
    return String(value || "")
        .trim()
        .toLowerCase()
        .normalize("NFD")
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

function getSpotPriceRange(spot) {
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
        low = high;
    }

    if (
        high === null
    ) {
        high = low;
    }

    if (low > high) {
        const temp = low;
        low = high;
        high = temp;
    }

    const calculatedAverage =
        validAverage ??
        (low + high) / 2;

    return {
        minimum: low,
        maximum: high,
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
            status: "NO_BUDGET",
            differencePercent: null,
        };
    }

    const count =
        Math.max(
            Number(people) || 1,
            1
        );

    const totalBudget =
        Number(budget);

    const budgetPerPerson =
        totalBudget / count;

    const prices =
        getSpotPriceRange(
            spot
        );

    if (
        prices.minimum === null
    ) {
        return {
            score: 45,
            status: "UNKNOWN",
            differencePercent: null,
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

        /*
         * A place comfortably below
         * the budget is good, but we do
         * not want extremely cheap places
         * to automatically beat everything.
         */

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
                sparePercent * 100,
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
                overPercent * 35,
                55,
                88
            ),

            status:
                "NEAR_BUDGET",

            differencePercent:
                -overPercent * 100,
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
     * places. This prevents a highly
     * rated expensive restaurant from
     * becoming a fake "great match".
     */

    let score;

    if (
        overPercent <= 0.10
    ) {
        score =
            70 -
            overPercent * 100;
    } else if (
        overPercent <= 0.25
    ) {
        score =
            60 -
            (overPercent - 0.10) *
            100;
    } else if (
        overPercent <= 0.50
    ) {
        score =
            45 -
            (overPercent - 0.25) *
            70;
    } else {
        score =
            25 -
            Math.min(
                (overPercent - 0.50) *
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
            -overPercent * 100,
    };
}

/* =========================================================
   CATEGORY
========================================================= */

function categoryScore(
    spot,
    category
) {
    if (!category) {
        return 70;
    }

    const values = [
        spot.category,
        spot.cuisine,
    ]
        .filter(Boolean)
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

    if (!wanted) {
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
            .split(" ")
            .filter(Boolean);

    const partialMatch =
        wantedWords.length > 0 &&
        values.some(
            value =>
                wantedWords.every(
                    word =>
                        value.includes(
                            word
                        )
                )
        );

    if (partialMatch) {
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

    if (hasAnyWord) {
        return 65;
    }

    return 25;
}

/* =========================================================
   MANUAL LOCATION
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

    if (!wanted) {
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
        neighborhood === wanted
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
        city === wanted
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
            .split(" ")
            .filter(Boolean);

    if (
        wantedWords.length > 0
    ) {
        const searchable =
            [
                neighborhood,
                address,
                city,
            ]
                .filter(Boolean)
                .join(" ");

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
            matchedWords.length > 0
        ) {
            return 70;
        }
    }

    return 40;
}

/* =========================================================
   GPS DISTANCE
========================================================= */

function locationScore(
    distanceKm,
    locationText,
    spot
) {
    /*
     * GPS is the most reliable
     * location signal.
     *
     * Smooth exponential decay:
     * close places remain strongly
     * preferred while farther places
     * gradually lose score.
     */

    if (
        distanceKm !== null &&
        Number.isFinite(
            distanceKm
        )
    ) {
        if (
            distanceKm <= 0.25
        ) {
            return 100;
        }

        if (
            distanceKm <= 0.5
        ) {
            return 98;
        }

        if (
            distanceKm <= 1
        ) {
            return 94;
        }

        if (
            distanceKm <= 2
        ) {
            return 87;
        }

        if (
            distanceKm <= 3
        ) {
            return 78;
        }

        if (
            distanceKm <= 5
        ) {
            return 65;
        }

        if (
            distanceKm <= 10
        ) {
            return 48;
        }

        if (
            distanceKm <= 20
        ) {
            return 30;
        }

        return 15;
    }

    const manualScore =
        locationTextScore(
            spot,
            locationText
        );

    if (
        manualScore !== null
    ) {
        return manualScore;
    }

    return 45;
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

    const priorRating = 3.5;
    const priorReviews = 10;

    const adjustedRating =
        (
            rating * reviewCount +
            priorRating *
            priorReviews
        ) /
        (
            reviewCount +
            priorReviews
        );

    let score =
        clamp(
            adjustedRating * 20,
            0,
            100
        );

    /*
     * Small penalty for no review
     * history.
     */

    if (
        reviewCount === 0
    ) {
        score = 50;
    }

    return score;
}

/* =========================================================
   VERIFICATION
========================================================= */

function verificationScore(
    spot
) {
    let score = 0;

    if (
        spot.verified
    ) {
        score += 50;
    }

    if (
        spot.price_verified_at
    ) {
        score += 25;
    }

    if (
        spot.location_verified_at
    ) {
        score += 25;
    }

    return score;
}

/* =========================================================
   DATA CONFIDENCE
========================================================= */

function dataConfidenceScore(
    spot
) {
    let score = 0;
    let total = 0;

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
            total += 1;

            if (check) {
                score += 1;
            }
        }
    );

    if (!total) {
        return 0;
    }

    return (
        score / total
    ) * 100;
}

/* =========================================================
   STATUS HELPERS
========================================================= */

function distanceStatus(
    distanceKm
) {
    if (
        distanceKm === null ||
        !Number.isFinite(
            distanceKm
        )
    ) {
        return "UNKNOWN";
    }

    if (
        distanceKm <= 0.5
    ) {
        return "VERY_CLOSE";
    }

    if (
        distanceKm <= 2
    ) {
        return "NEARBY";
    }

    if (
        distanceKm <= 5
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
        locationText,
        budget,
        people = 1,
        category,
    } = options;

    let distanceKm = null;

    /*
     * GPS distance.
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
        distanceKm =
            calculateDistance(
                Number(latitude),
                Number(longitude),
                Number(
                    spot.latitude
                ),
                Number(
                    spot.longitude
                )
            );
    }

    const budgetResult =
        budgetScore(
            spot,
            budget,
            people
        );

    const locationMatch =
        locationScore(
            distanceKm,
            locationText,
            spot
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
        Number(budget) > 0
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
        categoryMatch < 35
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
            Number(budget) /
            Math.max(
                Number(people) ||
                1,
                1
            );

        if (
            prices.minimum !== null &&
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
                    Number(budget) >
                    0
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
                    Number(budget) > 0
                    ? Number(budget) /
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
    spots,
    options = {}
) {
    return (
        spots
            .map(
                spot => ({
                    ...spot,

                    match:
                        scoreSpot(
                            spot,
                            options
                        ),
                })
            )
            .sort(
                (a, b) => {
                    /*
                     * Primary:
                     * match score.
                     */

                    if (
                        b.match.score !==
                        a.match.score
                    ) {
                        return (
                            b.match.score -
                            a.match.score
                        );
                    }

                    /*
                     * Tie breaker:
                     * closer place wins.
                     */

                    const aDistance =
                        a.match
                            .distanceKm;

                    const bDistance =
                        b.match
                            .distanceKm;

                    if (
                        Number.isFinite(
                            aDistance
                        ) &&
                        Number.isFinite(
                            bDistance
                        )
                    ) {
                        return (
                            aDistance -
                            bDistance
                        );
                    }

                    if (
                        Number.isFinite(
                            bDistance
                        )
                    ) {
                        return 1;
                    }

                    if (
                        Number.isFinite(
                            aDistance
                        )
                    ) {
                        return -1;
                    }

                    /*
                     * Final tie breaker:
                     * rating.
                     */

                    return (
                        (
                            Number(
                                b.rating
                            ) || 0
                        ) -
                        (
                            Number(
                                a.rating
                            ) || 0
                        )
                    );
                }
            )
    );
}