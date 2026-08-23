import supabaseAdmin from "../../../lib/supabaseAdmin";

export default async function handler(
    req,
    res
) {
    if (
        req.method !== "POST"
    ) {
        return res.status(405).json({
            error:
                "Method not allowed.",
        });
    }

    try {
        const {
            visitorId,
            spotId,
            arrivalId,
            rating,
            comment,
            priceAccurate,
            locationAccurate,
        } = req.body || {};

        const numericRating =
            Number(rating);

        /*
         * Basic validation.
         */
        if (
            !visitorId ||
            !spotId ||
            !arrivalId ||
            !Number.isInteger(
                numericRating
            ) ||
            numericRating < 1 ||
            numericRating > 5
        ) {
            return res.status(400).json({
                error:
                    "Please provide a valid rating and arrival.",
            });
        }

        /*
         * Verify that the spot exists and is
         * publicly approved.
         */
        const {
            data: spot,
            error: spotError,
        } =
            await supabaseAdmin
                .from(
                    "nt_spots"
                )
                .select(
                    "id,status"
                )
                .eq(
                    "id",
                    spotId
                )
                .eq(
                    "status",
                    "APPROVED"
                )
                .maybeSingle();

        if (spotError) {
            console.error(
                "Spot verification:",
                spotError
            );

            return res.status(500).json({
                error:
                    "Unable to verify spot.",
            });
        }

        if (!spot) {
            return res.status(404).json({
                error:
                    "Spot not found.",
            });
        }

        /*
         * Verify the exact arrival.
         *
         * The arrival must belong to:
         *
         * visitor + spot + arrivalId
         */
        const {
            data: arrival,
            error: arrivalError,
        } =
            await supabaseAdmin
                .from(
                    "nt_arrivals"
                )
                .select(
                    `
                    id,
                    visitor_id,
                    spot_id,
                    search_id,
                    selected_at,
                    arrived_at
                    `
                )
                .eq(
                    "id",
                    arrivalId
                )
                .eq(
                    "visitor_id",
                    visitorId
                )
                .eq(
                    "spot_id",
                    spotId
                )
                .maybeSingle();

        if (arrivalError) {
            console.error(
                "Arrival verification:",
                arrivalError
            );

            return res.status(500).json({
                error:
                    "Unable to verify arrival.",
            });
        }

        if (!arrival) {
            return res.status(403).json({
                error:
                    "You can review a spot only after recording your arrival.",
            });
        }

        /*
         * Prevent the same visitor from
         * reviewing the same spot multiple times.
         */
        const {
            data: existingReview,
            error: existingReviewError,
        } =
            await supabaseAdmin
                .from(
                    "nt_reviews"
                )
                .select(
                    "id"
                )
                .eq(
                    "visitor_id",
                    visitorId
                )
                .eq(
                    "spot_id",
                    spotId
                )
                .maybeSingle();

        if (
            existingReviewError
        ) {
            console.error(
                "Existing review check:",
                existingReviewError
            );

            return res.status(500).json({
                error:
                    "Unable to check existing review.",
            });
        }

        if (existingReview) {
            return res.status(409).json({
                error:
                    "You have already reviewed this spot.",
            });
        }

        /*
         * Clean the comment.
         */
        const cleanComment =
            typeof comment ===
                "string"
                ? comment.trim()
                : "";

        /*
         * Insert review.
         */
        const {
            data: review,
            error: reviewError,
        } =
            await supabaseAdmin
                .from(
                    "nt_reviews"
                )
                .insert({
                    visitor_id:
                        visitorId,

                    spot_id:
                        spotId,

                    arrival_id:
                        arrival.id,

                    rating:
                        numericRating,

                    comment:
                        cleanComment ||
                        null,

                    price_accurate:
                        typeof priceAccurate ===
                            "boolean"
                            ? priceAccurate
                            : null,

                    location_accurate:
                        typeof locationAccurate ===
                            "boolean"
                            ? locationAccurate
                            : null,
                })
                .select(
                    "id"
                )
                .single();

        if (reviewError) {
            console.error(
                "Review creation:",
                reviewError
            );

            return res.status(500).json({
                error:
                    "Unable to save review.",
            });
        }

        /*
         * Recalculate the spot rating.
         */
        const {
            data: reviews,
            error: ratingError,
        } =
            await supabaseAdmin
                .from(
                    "nt_reviews"
                )
                .select(
                    "rating"
                )
                .eq(
                    "spot_id",
                    spotId
                );

        if (ratingError) {
            console.error(
                "Rating calculation:",
                ratingError
            );
        } else {
            const total =
                (reviews || []).reduce(
                    (
                        sum,
                        item
                    ) =>
                        sum +
                        Number(
                            item.rating
                        ),
                    0
                );

            const count =
                reviews?.length ||
                0;

            const average =
                count > 0
                    ? Number(
                        (
                            total /
                            count
                        ).toFixed(
                            2
                        )
                    )
                    : 0;

            const {
                error:
                spotUpdateError,
            } =
                await supabaseAdmin
                    .from(
                        "nt_spots"
                    )
                    .update({
                        rating:
                            average,

                        review_count:
                            count,
                    })
                    .eq(
                        "id",
                        spotId
                    );

            if (
                spotUpdateError
            ) {
                /*
                 * The review itself succeeded.
                 * Do not report the whole request as
                 * failed, but log the rating update
                 * problem for later inspection.
                 */
                console.error(
                    "Spot rating update:",
                    spotUpdateError
                );
            }
        }

        return res.status(201).json({
            success:
                true,

            reviewId:
                review.id,
        });
    } catch (
    error
    ) {
        console.error(
            "Review API error:",
            error
        );

        return res.status(500).json({
            error:
                "Unable to save review.",
        });
    }
}