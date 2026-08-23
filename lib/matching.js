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


/* =====================================================
   TEXT NORMALIZATION
===================================================== */

function normalizeText(
    value
) {
    return String(
        value || ""
    )
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


/* =====================================================
   BUDGET SCORE
===================================================== */

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

    return clamp(
        100 -
        percentage * 100,
        0,
        100
    );
}


/* =====================================================
   CATEGORY SCORE
===================================================== */

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

    if (
        values.includes(
            wanted
        )
    ) {
        return 100;
    }

    /*
     * Also allow partial text matches.
     *
     * Example:
     * "fast food"
     * can match
     * "fast-food".
     */

    const wantedWords =
        wanted.split(" ")
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

    return 35;
}


/* =====================================================
   MANUAL LOCATION SCORE
===================================================== */

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

    /*
     * Exact neighborhood match.
     *
     * This is the strongest manual
     * location signal.
     */

    if (
        neighborhood === wanted
    ) {
        return 100;
    }


    /*
     * User may type:
     *
     * "Bastos"
     *
     * while database contains:
     *
     * "Bastos Supérieur"
     */

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


    /*
     * Address match.
     */

    if (
        address &&
        address.includes(
            wanted
        )
    ) {
        return 90;
    }


    /*
     * City match.
     */

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


    /*
     * Search individual words in
     * neighborhood/address/city.
     */

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


    /*
     * No meaningful manual-location
     * match.
     */

    return 40;
}


/* =====================================================
   LOCATION SCORE
===================================================== */

function locationScore(
    distanceKm,
    locationText,
    spot
) {
    /*
     * GPS takes priority whenever
     * coordinates are available.
     */

    if (
        distanceKm !== null
    ) {
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


    /*
     * No GPS:
     *
     * use the manually entered
     * neighborhood / city / address.
     */

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


    /*
     * No usable location.
     */

    return 45;
}


/* =====================================================
   RATING SCORE
===================================================== */

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


/* =====================================================
   VERIFICATION SCORE
===================================================== */

function verificationScore(
    spot
) {
    let score = 0;

    if (
        spot.verified
    ) {
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


/* =====================================================
   SCORE ONE SPOT
===================================================== */

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


    let distanceKm =
        null;


    /*
     * GPS distance.
     */

    if (
        latitude !== null &&
        latitude !==
        undefined &&
        longitude !== null &&
        longitude !==
        undefined &&
        spot.latitude !==
        null &&
        spot.latitude !==
        undefined &&
        spot.longitude !==
        null &&
        spot.longitude !==
        undefined
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


    /*
     * Existing NiceThings
     * weighting.
     *
     * Budget       30%
     * Location     25%
     * Category     15%
     * Rating       15%
     * Verification 15%
     */

    const score =
        budgetMatch * 0.30 +
        locationMatch * 0.25 +
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
            budget:
                Math.round(
                    budgetMatch
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
        },
    };
}


/* =====================================================
   RANK SPOTS
===================================================== */

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
                (a, b) =>
                    b.match.score -
                    a.match.score
            )
    );
}