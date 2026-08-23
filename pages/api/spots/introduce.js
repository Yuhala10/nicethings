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
        const body =
            req.body || {};

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

        if (
            !name ||
            !String(name).trim()
        ) {
            return res.status(400).json({
                error:
                    "Spot name is required.",
            });
        }

        if (
            !address ||
            !String(address).trim()
        ) {
            return res.status(400).json({
                error:
                    "Spot address is required.",
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

        /*
         * The final database stores price information
         * as text because submissions can contain things
         * such as:
         *
         * "5,000 - 10,000 FCFA"
         *
         * "Around 3,000 FCFA"
         *
         * "Affordable"
         */

        let cleanPriceInformation =
            priceInformation
                ? String(
                    priceInformation
                ).trim()
                : null;

        /*
         * Backward compatibility with the existing
         * introduce form if it still sends estimatedPrice.
         */

        if (
            !cleanPriceInformation &&
            estimatedPrice !==
            undefined &&
            estimatedPrice !==
            null &&
            String(
                estimatedPrice
            ).trim()
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
           COORDINATES
        ====================================================== */

        let cleanLatitude =
            null;

        let cleanLongitude =
            null;


        if (
            latitude !==
            undefined &&
            latitude !==
            null &&
            String(latitude).trim()
        ) {
            const value =
                Number(latitude);

            if (
                Number.isFinite(
                    value
                ) &&
                value >= -90 &&
                value <= 90
            ) {
                cleanLatitude =
                    value;
            }
        }


        if (
            longitude !==
            undefined &&
            longitude !==
            null &&
            String(longitude).trim()
        ) {
            const value =
                Number(longitude);

            if (
                Number.isFinite(
                    value
                ) &&
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
        } =
            await supabaseAdmin
                .from(
                    "nt_spot_submissions"
                )
                .insert({
                    visitor_id:
                        visitorId ||
                        null,

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
                .select(
                    "id"
                )
                .single();


        if (error) {
            console.error(
                "Spot submission error:",
                error
            );

            return res.status(500).json({
                error:
                    "Unable to submit the spot.",
            });
        }


        return res.status(201).json({
            success:
                true,

            submissionId:
                data.id,
        });
    } catch (
    error
    ) {
        console.error(
            "Spot submission API:",
            error
        );

        return res.status(500).json({
            error:
                "Unable to submit the spot.",
        });
    }
}