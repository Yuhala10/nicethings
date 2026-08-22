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
            searchId,
            spotId,
        } = req.body || {};

        if (
            !visitorId ||
            !searchId ||
            !spotId
        ) {
            return res.status(400).json({
                error: "Missing arrival information.",
            });
        }

        const {
            data: search,
            error: searchError,
        } = await supabaseAdmin
            .from("nt_searches")
            .select("id,visitor_id")
            .eq("id", searchId)
            .eq("visitor_id", visitorId)
            .maybeSingle();

        if (searchError) {
            console.error(searchError);

            return res.status(500).json({
                error: "Unable to verify search.",
            });
        }

        if (!search) {
            return res.status(404).json({
                error: "Search not found.",
            });
        }

        const {
            data: existing,
            error: existingError,
        } = await supabaseAdmin
            .from("nt_arrivals")
            .select("id")
            .eq("search_id", searchId)
            .eq("spot_id", spotId)
            .maybeSingle();

        if (existingError) {
            console.error(existingError);

            return res.status(500).json({
                error: "Unable to verify arrival.",
            });
        }

        if (existing) {
            return res.status(200).json({
                success: true,
                arrivalId: existing.id,
                alreadyRecorded: true,
            });
        }

        const {
            data: arrival,
            error: arrivalError,
        } = await supabaseAdmin
            .from("nt_arrivals")
            .insert({
                search_id: searchId,
                visitor_id: visitorId,
                spot_id: spotId,
                selected_at: new Date().toISOString(),
                arrived_at: new Date().toISOString(),
            })
            .select("id")
            .single();

        if (arrivalError) {
            console.error(arrivalError);

            return res.status(500).json({
                error: "Unable to record arrival.",
            });
        }

        return res.status(200).json({
            success: true,
            arrivalId: arrival.id,
        });
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            error: "Unable to record arrival.",
        });
    }
}