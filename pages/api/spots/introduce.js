import supabaseAdmin from "../../../lib/supabaseAdmin";


/* =========================================================
   LOCATION VALIDATION
========================================================= */

function isValidLatitude(
    value
) {
    const number =
        Number(value);

    return (
        Number.isFinite(
            number
        ) &&
        number >= -90 &&
        number <= 90
    );
}


function isValidLongitude(
    value
) {
    const number =
        Number(value);

    return (
        Number.isFinite(
            number
        ) &&
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
        req.method !==
        "POST"
    ) {
        return res.status(
            405
        ).json({
            error:
                "Method not allowed.",
        });
    }


    try {
        const body =
            req.body ||
            {};


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
           REQUIRED BASIC INFORMATION
        ====================================================== */

        if (
            typeof name !==
            "string" ||
            !name.trim()
        ) {
            return res.status(
                400
            ).json({
                error:
                    "Spot name is required.",
            });
        }


        if (
            typeof address !==
            "string" ||
            !address.trim()
        ) {
            return res.status(
                400
            ).json({
                error:
                    "Please provide an address or clear directions.",
            });
        }


        /* =====================================================
           GPS IS NOW MANDATORY
        ====================================================== */

        if (
            !isValidLatitude(
                latitude
            ) ||
            !isValidLongitude(
                longitude
            )
        ) {
            return res.status(
                400
            ).json({
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


        /*
         * Accuracy is not used to calculate distance.
         *
         * It is only a quality check for the registration
         * location.
         *
         * If the browser supplied an accuracy value and it
         * is extremely poor, reject the submission.
         */

        if (
            Number.isFinite(
                numericAccuracy
            ) &&
            numericAccuracy >
            150
        ) {
            return res.status(
                400
            ).json({
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
                numericPrice <
                0
            ) {
                return res.status(
                    400
                ).json({
                    error:
                        "Invalid estimated price.",
                });
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
                    "nt_submissions"
                )
                .insert({
                    visitor_id:
                        visitorId ||
                        null,

                    spot_name:
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

                    /*
                     * Address is descriptive only.
                     *
                     * It is NOT used to determine the
                     * geographic coordinates.
                     */

                    address:
                        address.trim(),

                    /*
                     * Neighborhood is also descriptive only.
                     *
                     * The Spot's actual location is latitude
                     * + longitude.
                     */

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
                            : "Yaoundé",


                    /* =========================================
                       AUTHORITATIVE LOCATION
                    ========================================== */

                    latitude:
                        numericLatitude,

                    longitude:
                        numericLongitude,


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

                    estimated_price:
                        numericPrice,

                    submitted_by_name:
                        typeof submittedByName ===
                            "string" &&
                            submittedByName.trim()
                            ? submittedByName.trim()
                            : null,

                    submitted_by_phone:
                        typeof submittedByPhone ===
                            "string" &&
                            submittedByPhone.trim()
                            ? submittedByPhone.trim()
                            : null,
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
                "NiceThings spot submission:",
                error
            );

            return res.status(
                500
            ).json({
                error:
                    "Unable to submit the Spot.",
            });
        }


        /* =====================================================
           SUCCESS
        ====================================================== */

        return res.status(
            201
        ).json({
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

        return res.status(
            500
        ).json({
            error:
                "Unable to submit the Spot.",
        });
    }
}