import supabaseAdmin from "../../../lib/supabaseAdmin";
import { requireAdmin } from "../../../lib/adminAuth";

export default async function handler(
    req,
    res
) {
    if (
        !requireAdmin(
            req,
            res
        )
    ) {
        return;
    }

    if (
        req.method === "GET"
    ) {
        return getSubmissions(
            req,
            res
        );
    }

    if (
        req.method === "POST"
    ) {
        return reviewSubmission(
            req,
            res
        );
    }

    return res.status(405).json({
        error:
            "Method not allowed.",
    });
}


/* =========================================================
   GET SUBMISSIONS
========================================================= */

async function getSubmissions(
    req,
    res
) {
    try {
        const {
            data,
            error,
        } =
            await supabaseAdmin
                .from(
                    "nt_submissions"
                )
                .select(`
                    id,
                    visitor_id,
                    spot_name,
                    category,
                    description,
                    address,
                    neighborhood,
                    city,
                    latitude,
                    longitude,
                    phone,
                    whatsapp,
                    estimated_price,
                    submitted_by_name,
                    submitted_by_phone,
                    status,
                    admin_note,
                    created_at,
                    reviewed_at
                `)
                .order(
                    "created_at",
                    {
                        ascending:
                            false,
                    }
                );


        if (error) {
            console.error(
                "Admin submissions:",
                error
            );

            return res.status(500).json({
                error:
                    "Unable to load submissions.",
            });
        }


        return res.status(200).json({
            submissions:
                data || [],
        });
    } catch (
    error
    ) {
        console.error(
            "Get submissions error:",
            error
        );

        return res.status(500).json({
            error:
                "Unable to load submissions.",
        });
    }
}


/* =========================================================
   REVIEW SUBMISSION
========================================================= */

async function reviewSubmission(
    req,
    res
) {
    try {
        const {
            submissionId,
            decision,
            adminNote,
        } =
            req.body || {};


        if (
            !submissionId ||
            ![
                "APPROVE",
                "REJECT",
            ].includes(
                decision
            )
        ) {
            return res.status(400).json({
                error:
                    "Invalid submission review.",
            });
        }


        /* =================================================
           LOAD SUBMISSION
        ================================================== */

        const {
            data: submission,
            error: submissionError,
        } =
            await supabaseAdmin
                .from(
                    "nt_submissions"
                )
                .select(
                    "*"
                )
                .eq(
                    "id",
                    submissionId
                )
                .maybeSingle();


        if (submissionError) {
            console.error(
                "Submission lookup:",
                submissionError
            );

            return res.status(500).json({
                error:
                    "Unable to load submission.",
            });
        }


        if (!submission) {
            return res.status(404).json({
                error:
                    "Submission not found.",
            });
        }


        /* =================================================
           PREVENT DOUBLE REVIEW
        ================================================== */

        if (
            submission.status !==
            "PENDING"
        ) {
            return res.status(409).json({
                error:
                    "This submission has already been reviewed.",
            });
        }


        const now =
            new Date().toISOString();


        /* =================================================
           REJECT
        ================================================== */

        if (
            decision ===
            "REJECT"
        ) {
            const {
                error:
                rejectError,
            } =
                await supabaseAdmin
                    .from(
                        "nt_submissions"
                    )
                    .update({
                        status:
                            "REJECTED",

                        admin_note:
                            adminNote ||
                            null,

                        reviewed_at:
                            now,
                    })
                    .eq(
                        "id",
                        submission.id
                    );


            if (
                rejectError
            ) {
                console.error(
                    "Submission rejection:",
                    rejectError
                );

                return res.status(500).json({
                    error:
                        "Unable to reject submission.",
                });
            }


            return res.status(200).json({
                success:
                    true,
            });
        }


        /* =================================================
           APPROVE
        ================================================== */

        /*
         * Convert the community submission into
         * a real NiceThings spot.
         *
         * We map only columns that actually exist
         * in nt_spots.
         */

        const estimatedPrice =
            submission.estimated_price !=
                null
                ? Number(
                    submission.estimated_price
                )
                : null;


        const {
            data: spot,
            error: spotError,
        } =
            await supabaseAdmin
                .from(
                    "nt_spots"
                )
                .insert({
                    name:
                        submission.spot_name,

                    description:
                        submission.description ||
                        null,

                    category:
                        submission.category ||
                        null,

                    address:
                        submission.address ||
                        null,

                    neighborhood:
                        submission.neighborhood ||
                        null,

                    city:
                        submission.city ||
                        "Yaoundé",

                    latitude:
                        submission.latitude ||
                        null,

                    longitude:
                        submission.longitude ||
                        null,

                    phone:
                        submission.phone ||
                        null,

                    whatsapp:
                        submission.whatsapp ||
                        null,

                    minimum_price:
                        Number.isFinite(
                            estimatedPrice
                        )
                            ? estimatedPrice
                            : null,

                    maximum_price:
                        Number.isFinite(
                            estimatedPrice
                        )
                            ? estimatedPrice
                            : null,

                    average_price:
                        Number.isFinite(
                            estimatedPrice
                        )
                            ? estimatedPrice
                            : null,

                    currency:
                        "XAF",

                    rating:
                        0,

                    review_count:
                        0,

                    verified:
                        false,

                    featured:
                        false,

                    status:
                        "APPROVED",

                    submitted_by:
                        submission.visitor_id ||
                        null,
                })
                .select(
                    "id"
                )
                .single();


        if (
            spotError
        ) {
            console.error(
                "Spot creation:",
                spotError
            );

            return res.status(500).json({
                error:
                    "Unable to create the approved spot.",
            });
        }


        /* =================================================
           MARK SUBMISSION APPROVED
        ================================================== */

        const {
            error:
            approveError,
        } =
            await supabaseAdmin
                .from(
                    "nt_submissions"
                )
                .update({
                    status:
                        "APPROVED",

                    admin_note:
                        adminNote ||
                        null,

                    reviewed_at:
                        now,
                })
                .eq(
                    "id",
                    submission.id
                );


        if (
            approveError
        ) {
            console.error(
                "Submission approval update:",
                approveError
            );

            /*
             * The spot has already been created.
             * Tell the admin exactly what happened.
             */

            return res.status(500).json({
                error:
                    "Spot was created but the submission status could not be updated. Please inspect the records.",
            });
        }


        return res.status(200).json({
            success:
                true,

            spotId:
                spot.id,
        });
    } catch (
    error
    ) {
        console.error(
            "Submission review error:",
            error
        );

        return res.status(500).json({
            error:
                "Unable to review submission.",
        });
    }
}