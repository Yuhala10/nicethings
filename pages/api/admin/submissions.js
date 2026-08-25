import supabaseAdmin from "../../../lib/supabaseAdmin";
import { requireAdmin } from "../../../lib/adminAuth";

export default async function handler(req, res) {
    if (!requireAdmin(req, res)) {
        return;
    }

    if (req.method === "GET") {
        return getSubmissions(req, res);
    }

    if (req.method === "POST") {
        return reviewSubmission(req, res);
    }

    return res.status(405).json({
        error: "Method not allowed.",
    });
}

/* =========================================================
   GET SUBMISSIONS
========================================================= */

async function getSubmissions(req, res) {
    try {
        const {
            data,
            error,
        } = await supabaseAdmin
            .from("nt_spot_submissions")
            .select("*")
            .order("created_at", {
                ascending: false,
            });

        if (error) {
            console.error(
                "Admin submissions:",
                error
            );

            return res.status(500).json({
                error:
                    error.message ||
                    "Unable to load submissions.",
            });
        }

        return res.status(200).json({
            submissions: data || [],
        });
    } catch (error) {
        console.error(
            "Get submissions error:",
            error
        );

        return res.status(500).json({
            error:
                error.message ||
                "Unable to load submissions.",
        });
    }
}

/* =========================================================
   REVIEW SUBMISSION
========================================================= */

async function reviewSubmission(req, res) {
    try {
        const {
            submissionId,
            decision,
            adminNote,
        } = req.body || {};

        if (
            !submissionId ||
            !["APPROVE", "REJECT"].includes(
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
        } = await supabaseAdmin
            .from("nt_spot_submissions")
            .select("*")
            .eq("id", submissionId)
            .maybeSingle();

        if (submissionError) {
            console.error(
                "Submission lookup:",
                submissionError
            );

            return res.status(500).json({
                error:
                    submissionError.message ||
                    "Unable to load submission.",
            });
        }

        if (!submission) {
            return res.status(404).json({
                error:
                    "Submission not found.",
            });
        }

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
            decision === "REJECT"
        ) {
            const {
                error: rejectError,
            } =
                await supabaseAdmin
                    .from(
                        "nt_spot_submissions"
                    )
                    .update({
                        status:
                            "REJECTED",

                        admin_note:
                            adminNote ||
                            null,

                        reviewed_at:
                            now,

                        updated_at:
                            now,
                    })
                    .eq(
                        "id",
                        submission.id
                    );

            if (rejectError) {
                console.error(
                    "Submission rejection:",
                    rejectError
                );

                return res.status(500).json({
                    error:
                        rejectError.message ||
                        "Unable to reject submission.",
                });
            }

            try {
                await supabaseAdmin
                    .from(
                        "nt_admin_audit_log"
                    )
                    .insert({
                        action:
                            "SUBMISSION_REJECTED",

                        target_type:
                            "submission",

                        target_id:
                            submission.id,

                        note:
                            adminNote ||
                            null,
                    });
            } catch (auditError) {
                console.error(
                    "Rejection audit:",
                    auditError
                );
            }

            return res.status(200).json({
                success: true,
            });
        }

        /* =================================================
           APPROVE
        ================================================== */

        /*
         * Convert submitted price text into the numeric
         * fields used by nt_spots.
         */

        const priceText =
            submission.price_information
                ? String(
                    submission.price_information
                )
                : "";

        const priceMatches =
            priceText.match(
                /\d[\d\s,.]*/g
            ) || [];

        const prices =
            priceMatches
                .map((value) =>
                    Number(
                        value
                            .replace(
                                /\s/g,
                                ""
                            )
                            .replace(
                                /,/g,
                                ""
                            )
                            .replace(
                                /\./g,
                                ""
                            )
                    )
                )
                .filter(
                    (value) =>
                        Number.isFinite(
                            value
                        ) &&
                        value > 0
                );

        const minimumPrice =
            prices.length > 0
                ? Math.min(
                    ...prices
                )
                : null;

        const maximumPrice =
            prices.length > 1
                ? Math.max(
                    ...prices
                )
                : minimumPrice;

        const averagePrice =
            minimumPrice !==
                null &&
                maximumPrice !==
                null
                ? Math.round(
                    (
                        minimumPrice +
                        maximumPrice
                    ) / 2
                )
                : null;

        /* =================================================
           CREATE PUBLIC SPOT
        ================================================== */

        const {
            data: spot,
            error: spotError,
        } =
            await supabaseAdmin
                .from("nt_spots")
                .insert({
                    name:
                        submission.name,

                    description:
                        submission.description ||
                        null,

                    category:
                        submission.category ||
                        "other",

                    city:
                        submission.city ||
                        "Yaoundé",

                    neighborhood:
                        submission.neighborhood ||
                        null,

                    address:
                        submission.address ||
                        null,

                    latitude:
                        submission.latitude ??
                        null,

                    longitude:
                        submission.longitude ??
                        null,

                    phone:
                        submission.phone ||
                        null,

                    whatsapp:
                        submission.whatsapp ||
                        null,

                    average_price:
                        averagePrice,

                    minimum_price:
                        minimumPrice,

                    maximum_price:
                        maximumPrice,

                    rating:
                        0,

                    review_count:
                        0,

                    verified:
                        true,

                    status:
                        "APPROVED",

                    featured:
                        false,

                    created_by:
                        submission.visitor_id ||
                        null,
                })
                .select("id")
                .single();

        if (spotError) {
            console.error(
                "Spot creation:",
                spotError
            );

            return res.status(500).json({
                error:
                    spotError.message ||
                    "Unable to create the approved spot.",
            });
        }

        /* =================================================
           MARK SUBMISSION APPROVED
        ================================================== */

        /*
         * IMPORTANT:
         * nt_spot_submissions does NOT contain spot_id.
         * Therefore we only update its own fields here.
         */

        const {
            error: approveError,
        } =
            await supabaseAdmin
                .from(
                    "nt_spot_submissions"
                )
                .update({
                    status:
                        "APPROVED",

                    admin_note:
                        adminNote ||
                        null,

                    reviewed_at:
                        now,

                    updated_at:
                        now,
                })
                .eq(
                    "id",
                    submission.id
                );

        if (approveError) {
            console.error(
                "Submission approval update:",
                approveError
            );

            return res.status(500).json({
                error:
                    approveError.message ||
                    "Spot was created but submission status could not be updated.",
            });
        }

        /* =================================================
           AUDIT LOG
        ================================================== */

        try {
            const {
                error: auditError,
            } =
                await supabaseAdmin
                    .from(
                        "nt_admin_audit_log"
                    )
                    .insert({
                        action:
                            "SUBMISSION_APPROVED",

                        target_type:
                            "submission",

                        target_id:
                            submission.id,

                        note:
                            adminNote ||
                            null,
                    });

            if (auditError) {
                console.error(
                    "Approval audit:",
                    auditError
                );
            }
        } catch (auditError) {
            console.error(
                "Approval audit exception:",
                auditError
            );
        }

        return res.status(200).json({
            success: true,

            spotId:
                spot.id,
        });
    } catch (error) {
        console.error(
            "Submission review error:",
            error
        );

        return res.status(500).json({
            error:
                error.message ||
                "Unable to review submission.",
        });
    }
}