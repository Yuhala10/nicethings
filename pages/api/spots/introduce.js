import supabaseAdmin from "../../../lib/supabaseAdmin";


/* =========================================================
   LOCATION VALIDATION
========================================================= */

function isValidLatitude(value) {
    const number = Number(value);

    return (
        Number.isFinite(number) &&
        number >= -90 &&
        number <= 90
    );
}


function isValidLongitude(value) {
    const number = Number(value);

    return (
        Number.isFinite(number) &&
        number >= -180 &&
        number <= 180
    );
}


/* =========================================================
   HANDLER
========================================================= */

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
            locationAccuracy,

            phone,
            whatsapp,

            estimatedPrice,

            submittedByName,
            submittedByPhone,
        } = body;


        /* =====================================================
           VISITOR VALIDATION
        ====================================================== */

        if (
            !visitorId ||
            typeof visitorId !==
            "string"
        ) {
            return res.status(400).json({
                error:
                    "Your visitor session is missing. Please refresh the app and try again.",
                visitorSessionRequired:
                    true,
            });
        }


        /*
         * Confirm that the visitor actually exists
         * in nt_visitors before using visitor_id as
         * a foreign key.
         */

        const {
            data: visitor,
            error: visitorError,
        } =
            await supabaseAdmin
                .from(
                    "nt_visitors"
                )
                .select(
                    "id"
                )
                .eq(
                    "id",
                    visitorId
                )
                .maybeSingle();


        if (
            visitorError
        ) {

            console.error(
                "Visitor validation error:",
                visitorError
            );

            return res.status(500).json({
                error:
                    "Unable to verify your visitor session.",
            });
        }


        if (
            !visitor
        ) {

            return res.status(400).json({
                error:
                    "Your visitor session has expired or is invalid. Please refresh the app and try again.",
                visitorSessionInvalid:
                    true,
            });
        }


        /* =====================================================
           REQUIRED SPOT INFORMATION
        ====================================================== */

        if (
            typeof name !==
            "string" ||
            !name.trim()
        ) {

            return res.status(400).json({
                error:
                    "Spot name is required.",
            });
        }


        if (
            typeof address !==
            "string" ||
            !address.trim()
        ) {

            return res.status(400).json({
                error:
                    "Please provide an address or clear directions.",
            });
        }


        /* =====================================================
           GPS IS MANDATORY
        ====================================================== */

        if (
            !isValidLatitude(
                latitude
            ) ||
            !isValidLongitude(
                longitude
            )
        ) {

            return res.status(400).json({
                error:
                    "You must be physically at the Spot and capture its current GPS location before submitting it.",
                locationRequired:
                    true,
            });
        }


        const numericLatitude =
            Number(
                latitude
            );


        const numericLongitude =
            Number(
                longitude
            );


        /* =====================================================
           GPS ACCURACY
        ====================================================== */

        const numericAccuracy =
            Number(
                locationAccuracy
            );


        if (
            Number.isFinite(
                numericAccuracy
            ) &&
            numericAccuracy >
            150
        ) {

            return res.status(400).json({
                error:
                    "Your GPS location is not accurate enough. Please move closer to the Spot or wait for a better GPS signal and try again.",
                locationRequired:
                    true,
                accuracyTooLow:
                    true,
                accuracy:
                    numericAccuracy,
            });
        }


        /* =====================================================
           PRICE
        ====================================================== */

        let numericPrice =
            null;


        if (
            estimatedPrice !==
            null &&
            estimatedPrice !==
            undefined &&
            String(
                estimatedPrice
            ).trim() !== ""
        ) {

            numericPrice =
                Number(
                    estimatedPrice
                );


            if (
                !Number.isFinite(
                    numericPrice
                ) ||
                numericPrice < 0
            ) {

                return res.status(400).json({
                    error:
                        "Invalid estimated price.",
                });
            }
        }


        /* =====================================================
           CREATE SPOT SUBMISSION
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

                    /* -----------------------------------------
                       VALIDATED VISITOR
                    ------------------------------------------ */

                    visitor_id:
                        visitor.id,


                    /* -----------------------------------------
                       SPOT
                    ------------------------------------------ */

                    name:
                        name.trim(),


                    category:
                        typeof category ===
                            "string" &&
                            category.trim()
                            ? category.trim()
                            : null,


                    description:
                        typeof description ===
                            "string" &&
                            description.trim()
                            ? description.trim()
                            : null,


                    /* -----------------------------------------
                       DESCRIPTIVE LOCATION
                    ------------------------------------------ */

                    address:
                        address.trim(),


                    neighborhood:
                        typeof neighborhood ===
                            "string" &&
                            neighborhood.trim()
                            ? neighborhood.trim()
                            : null,


                    city:
                        typeof city ===
                            "string" &&
                            city.trim()
                            ? city.trim()
                            : null,


                    /* -----------------------------------------
                       AUTHORITATIVE GPS
                    ------------------------------------------ */

                    latitude:
                        numericLatitude,


                    longitude:
                        numericLongitude,


                    /* -----------------------------------------
                       CONTACT
                    ------------------------------------------ */

                    phone:
                        typeof phone ===
                            "string" &&
                            phone.trim()
                            ? phone.trim()
                            : null,


                    whatsapp:
                        typeof whatsapp ===
                            "string" &&
                            whatsapp.trim()
                            ? whatsapp.trim()
                            : null,


                    /* -----------------------------------------
                       PRICE
                    ------------------------------------------ */

                    price_information:
                        numericPrice !==
                            null
                            ? String(
                                numericPrice
                            )
                            : null,


                    /*
                     * IMPORTANT:
                     *
                     * We do NOT insert:
                     *
                     * submitter_name
                     * submitter_phone
                     * estimated_price
                     *
                     * because those columns do not exist
                     * in nt_spot_submissions.
                     */

                })
                .select(
                    "id"
                )
                .single();


        /* =====================================================
           DATABASE ERROR
        ====================================================== */

        if (
            error
        ) {

            console.error(
                "NiceThings spot submission database error:",
                error
            );


            return res.status(500).json({
                error:
                    error.message ||
                    "Unable to submit the Spot.",
                details:
                    error.details ||
                    null,
                code:
                    error.code ||
                    null,
            });
        }


        /* =====================================================
           SUCCESS
        ====================================================== */

        return res.status(201).json({

            success:
                true,

            submissionId:
                data.id,

            location: {

                latitude:
                    numericLatitude,

                longitude:
                    numericLongitude,

                accuracy:
                    Number.isFinite(
                        numericAccuracy
                    )
                        ? numericAccuracy
                        : null,

            },

        });


    } catch (
    error
    ) {

        console.error(
            "NiceThings spot submission error:",
            error
        );


        return res.status(500).json({

            error:
                error?.message ||
                "Unable to submit the Spot.",

            details:
                error?.details ||
                null,

            code:
                error?.code ||
                null,

        });
    }
}