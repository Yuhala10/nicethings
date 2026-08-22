import supabaseAdmin from "../../../lib/supabaseAdmin";

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({
            error: "Method not allowed.",
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

        if (
            !visitorId ||
            !spotId ||
            !numericRating ||
            numericRating < 1 ||
            numericRating > 5
        ) {
            return res.status(400).json({
                error: "Please provide a valid rating.",
            });
        }

        const {
            data: arrival,
            error: arrivalError,
        } = await supabaseAdmin
            .from("nt_arrivals")
            .select("id")
            .eq("visitor_id", visitorId)
            .eq("spot_id", spotId)
            .maybeSingle();

        if (arrivalError) {
            console.error(arrivalError);

            return res.status(500).json({
                error: "Unable to verify arrival.",
            });
        }

        if (!arrival) {
            return res.status(403).json({
                error:
                    "You can review a spot after recording your arrival.",
            });
        }

        const {
            data: existingReview,
        } = await supabaseAdmin
            .from("nt_reviews")
            .select("id")
            .eq("visitor_id", visitorId)
            .eq("spot_id", spotId)
            .maybeSingle();

        if (existingReview) {
            return res.status(409).json({
                error:
                    "You have already reviewed this spot.",
            });
        }

        const {
            data: review,
            error: reviewError,
        } = await supabaseAdmin
            .from("nt_reviews")
            .insert({
                visitor_id: visitorId,
                spot_id: spotId,
                arrival_id:
                    arrivalId ||
                    arrival.id,
                rating:
                    numericRating,
                comment:
                    comment?.trim() ||
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
            .select("id")
            .single();

        if (reviewError) {
            console.error(reviewError);

            return res.status(500).json({
                error: "Unable to save review.",
            });
        }

        /*
         * Recalculate rating.
         */

        const {
            data: reviews,
            error: ratingError,
        } = await supabaseAdmin
            .from("nt_reviews")
            .select("rating")
            .eq("spot_id", spotId);

        if (!ratingError) {
            const total =
                reviews.reduce(
                    (sum, item) =>
                        sum +
                        Number(
                            item.rating
                        ),
                    0
                );

            const count =
                reviews.length;

            const average =
                count
                    ? Number(
                        (
                            total /
                            count
                        ).toFixed(2)
                    )
                    : 0;

            await supabaseAdmin
                .from("nt_spots")
                .update({
                    rating:
                        average,
                    review_count:
                        count,
                })
                .eq("id", spotId);
        }

        return res.status(200).json({
            success: true,
            reviewId: review.id,
        });
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            error: "Unable to save review.",
        });
    }
}