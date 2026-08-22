import {
    calculateDistance,
} from "./distance";

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

function budgetScore(
    spot,
    budget,
    people
) {
    if (
        !budget ||
        budget <= 0
    ) {
        return 50;
    }

    const count =
        Math.max(
            Number(people) ||
            1,
            1
        );

    const totalBudget =
        Number(budget);

    const expectedPerPerson =
        totalBudget /
        count;

    const minimum =
        Number(
            spot.minimum_price
        ) || 0;

    const maximum =
        Number(
            spot.maximum_price
        ) ||
        Number(
            spot.average_price
        ) ||
        minimum;

    const average =
        Number(
            spot.average_price
        ) ||
        (minimum + maximum) /
        2;

    if (
        average <= 0
    ) {
        return 40;
    }

    const difference =
        Math.abs(
            average -
            expectedPerPerson
        );

    const percentage =
        difference /
        Math.max(
            expectedPerPerson,
            1
        );

    /*
     * The closer the expected spend is
     * to the user's budget, the better.
     */

    return clamp(
        100 -
        percentage * 100,
        0,
        100
    );
}

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
        .map((value) =>
            String(value)
                .toLowerCase()
        );

    const wanted =
        String(category)
            .toLowerCase();

    if (
        values.includes(
            wanted
        )
    ) {
        return 100;
    }

    return 35;
}

function ratingScore(
    spot
) {
    const rating =
        Number(
            spot.rating
        ) || 0;

    return clamp(
        rating * 20,
        0,
        100
    );
}

function verificationScore(
    spot
) {
    let score = 0;

    if (spot.verified) {
        score += 60;
    }

    if (
        spot.price_verified_at
    ) {
        score += 20;
    }

    if (
        spot.location_verified_at
    ) {
        score += 20;
    }

    return score;
}

function distanceScore(
    distanceKm
) {
    if (
        distanceKm === null
    ) {
        return 45;
    }

    if (
        distanceKm <= 0.5
    ) {
        return 100;
    }

    if (
        distanceKm <= 1
    ) {
        return 95;
    }

    if (
        distanceKm <= 2
    ) {
        return 85;
    }

    if (
        distanceKm <= 3
    ) {
        return 75;
    }

    if (
        distanceKm <= 5
    ) {
        return 60;
    }

    return 35;
}

export function scoreSpot(
    spot,
    options = {}
) {
    const {
        latitude,
        longitude,
        budget,
        people = 1,
        category,
    } = options;

    let distanceKm =
        null;

    if (
        latitude !== null &&
        latitude !== undefined &&
        longitude !== null &&
        longitude !== undefined
    ) {
        distanceKm =
            calculateDistance(
                latitude,
                longitude,
                spot.latitude,
                spot.longitude
            );
    }

    const budgetMatch =
        budgetScore(
            spot,
            budget,
            people
        );

    const distanceMatch =
        distanceScore(
            distanceKm
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

    /*
     * Initial weighting.
     *
     * Budget is the strongest signal.
     * Distance is next.
     *
     * We can tune these weights
     * once real NiceThings usage
     * produces data.
     */

    const score =
        budgetMatch * 0.30 +
        distanceMatch * 0.25 +
        categoryMatch * 0.15 +
        ratingMatch * 0.15 +
        verificationMatch * 0.15;

    return {
        score: Math.round(
            clamp(
                score,
                0,
                100
            )
        ),

        distanceKm,

        breakdown: {
            budget: Math.round(
                budgetMatch
            ),
            distance: Math.round(
                distanceMatch
            ),
            category: Math.round(
                categoryMatch
            ),
            rating: Math.round(
                ratingMatch
            ),
            verification:
                Math.round(
                    verificationMatch
                ),
        },
    };
}

export function rankSpots(
    spots,
    options = {}
) {
    return (
        spots
            .map((spot) => ({
                ...spot,
                match:
                    scoreSpot(
                        spot,
                        options
                    ),
            }))
            .sort(
                (a, b) =>
                    b.match.score -
                    a.match.score
            )
    );
}