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
            searchId,
            spotId,
        } = req.body || {};

        if (
            !visitorId ||
            !searchId ||
            !spotId
        ) {
            return res.status(400).json({
                error:
                    "Missing arrival information.",
            });
        }

        /*
         * Verify that the search belongs
         * to this visitor.
         */
        const {
            data: search,
            error: searchError,
        } =
            await supabaseAdmin
                .from(
                    "nt_searches"
                )
                .select(
                    "id,visitor_id"
                )
                .eq(
                    "id",
                    searchId
                )
                .eq(
                    "visitor_id",
                    visitorId
                )
                .maybeSingle();

        if (searchError) {
            console.error(
                "Search verification:",
                searchError
            );

            return res.status(500).json({
                error:
                    "Unable to verify search.",
            });
        }

        if (!search) {
            return res.status(404).json({
                error:
                    "Search not found.",
            });
        }

        /*
         * Verify that the selected spot exists
         * and is publicly approved.
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
         * Prevent duplicate arrivals for
         * the same search + spot.
         */
        const {
            data: existing,
            error: existingError,
        } =
            await supabaseAdmin
                .from(
                    "nt_arrivals"
                )
                .select(
                    "id"
                )
                .eq(
                    "search_id",
                    searchId
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

        if (existingError) {
            console.error(
                "Arrival verification:",
                existingError
            );

            return res.status(500).json({
                error:
                    "Unable to verify arrival.",
            });
        }

        if (existing) {
            return res.status(200).json({
                success:
                    true,

                arrivalId:
                    existing.id,

                alreadyRecorded:
                    true,
            });
        }

        const now =
            new Date().toISOString();

        /*
         * Record the selected/arrival event.
         */
        const {
            data: arrival,
            error: arrivalError,
        } =
            await supabaseAdmin
                .from(
                    "nt_arrivals"
                )
                .insert({
                    search_id:
                        searchId,

                    visitor_id:
                        visitorId,

                    spot_id:
                        spotId,

                    selected_at:
                        now,

                    arrived_at:
                        now,
                })
                .select(
                    "id"
                )
                .single();

        if (arrivalError) {
            console.error(
                "Arrival creation:",
                arrivalError
            );

            return res.status(500).json({
                error:
                    "Unable to record arrival.",
            });
        }

        return res.status(200).json({
            success:
                true,

            arrivalId:
                arrival.id,

            alreadyRecorded:
                false,
        });
    } catch (
    error
    ) {
        console.error(
            "Arrival API error:",
            error
        );

        return res.status(500).json({
            error:
                "Unable to record arrival.",
        });
    }
}