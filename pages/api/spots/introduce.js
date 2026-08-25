import supabaseAdmin from "../../../lib/supabaseAdmin";

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({
            error: "Method not allowed.",
        });
    }

    try {
        const body = req.body || {};

        const {
            visitorId,
            name,
            category,
            description,
            address,
            neighborhood,
            city,
            latitude,
            longitude,
            phone,
            whatsapp,
            priceInformation,
            estimatedPrice,
            openingHours,
        } = body;

        /* =====================================================
           VALIDATION
        ====================================================== */

        if (!name || !String(name).trim()) {
            return res.status(400).json({
                error: "Spot name is required.",
            });
        }

        if (!address || !String(address).trim()) {
            return res.status(400).json({
                error: "Spot address is required.",
            });
        }

        /* =====================================================
           NORMALIZE
        ====================================================== */

        const cleanName =
            String(name).trim();

        const cleanAddress =
            String(address).trim();

        const cleanCategory =
            category
                ? String(category).trim()
                : null;

        const cleanDescription =
            description
                ? String(description).trim()
                : null;

        const cleanNeighborhood =
            neighborhood
                ? String(neighborhood).trim()
                : null;

        const cleanCity =
            city
                ? String(city).trim()
                : "Yaoundé";

        const cleanPhone =
            phone
                ? String(phone).trim()
                : null;

        const cleanWhatsapp =
            whatsapp
                ? String(whatsapp).trim()
                : null;

        let cleanPriceInformation =
            priceInformation
                ? String(
                    priceInformation
                ).trim()
                : null;

        /*
         * Backward compatibility with older
         * introduce forms.
         */

        if (
            !cleanPriceInformation &&
            estimatedPrice !== undefined &&
            estimatedPrice !== null &&
            String(estimatedPrice).trim()
        ) {
            cleanPriceInformation =
                `${String(
                    estimatedPrice
                ).trim()} FCFA`;
        }

        const cleanOpeningHours =
            openingHours
                ? String(
                    openingHours
                ).trim()
                : null;

        /* =====================================================
           VISITOR VALIDATION
        ====================================================== */

        /*
         * visitor_id is optional in the database.
         *
         * However, if the browser sends a visitorId,
         * we first verify that it actually exists in
         * nt_visitors.
         *
         * This prevents the foreign-key error:
         *
         * nt_spot_submissions_visitor_id_fkey
         *
         * If the visitor does not exist, we simply use
         * null instead of blocking the spot submission.
         */

        let cleanVisitorId = null;

        if (visitorId) {
            const {
                data: visitor,
                error: visitorError,
            } = await supabaseAdmin
                .from("nt_visitors")
                .select("id")
                .eq(
                    "id",
                    visitorId
                )
                .maybeSingle();

            if (visitorError) {
                console.error(
                    "Visitor lookup error:",
                    visitorError
                );

                /*
                 * Do not fail the spot submission.
                 *
                 * visitor_id is optional, so we simply
                 * continue with null.
                 */
            }

            if (visitor) {
                cleanVisitorId =
                    visitor.id;
            }
        }

        /* =====================================================
           COORDINATES
        ====================================================== */

        let cleanLatitude = null;
        let cleanLongitude = null;

        if (
            latitude !== undefined &&
            latitude !== null &&
            String(latitude).trim()
        ) {
            const value =
                Number(latitude);

            if (
                Number.isFinite(value) &&
                value >= -90 &&
                value <= 90
            ) {
                cleanLatitude =
                    value;
            }
        }

        if (
            longitude !== undefined &&
            longitude !== null &&
            String(longitude).trim()
        ) {
            const value =
                Number(longitude);

            if (
                Number.isFinite(value) &&
                value >= -180 &&
                value <= 180
            ) {
                cleanLongitude =
                    value;
            }
        }

        /* =====================================================
           CREATE SUBMISSION
        ====================================================== */

        const {
            data,
            error,
        } = await supabaseAdmin
            .from(
                "nt_spot_submissions"
            )
            .insert({
                visitor_id:
                    cleanVisitorId,

                name:
                    cleanName,

                category:
                    cleanCategory,

                description:
                    cleanDescription,

                address:
                    cleanAddress,

                neighborhood:
                    cleanNeighborhood,

                city:
                    cleanCity,

                latitude:
                    cleanLatitude,

                longitude:
                    cleanLongitude,

                phone:
                    cleanPhone,

                whatsapp:
                    cleanWhatsapp,

                price_information:
                    cleanPriceInformation,

                opening_hours:
                    cleanOpeningHours,

                status:
                    "PENDING",
            })
            .select("id")
            .single();

        /* =====================================================
           DATABASE ERROR
        ====================================================== */

        if (error) {
            console.error(
                "Spot submission error:",
                error
            );

            return res.status(500).json({
                error:
                    error.message ||
                    "Unable to submit the spot.",
            });
        }

        /* =====================================================
           SUCCESS
        ====================================================== */

        return res.status(201).json({
            success: true,

            submissionId:
                data.id,
        });
    } catch (error) {
        console.error(
            "Spot submission API:",
            error
        );

        return res.status(500).json({
            error:
                error.message ||
                "Unable to submit the spot.",
        });
    }
}