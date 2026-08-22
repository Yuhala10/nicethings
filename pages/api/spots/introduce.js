import supabaseAdmin from "../../../lib/supabaseAdmin";

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({
            error: "Method not allowed.",
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
            phone,
            whatsapp,
            estimatedPrice,
            submittedByName,
            submittedByPhone,
        } = body;

        if (
            !name?.trim() ||
            !address?.trim()
        ) {
            return res.status(400).json({
                error:
                    "Spot name and address are required.",
            });
        }

        const {
            data,
            error,
        } = await supabaseAdmin
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
                    category?.trim() ||
                    null,

                description:
                    description?.trim() ||
                    null,

                address:
                    address.trim(),

                neighborhood:
                    neighborhood?.trim() ||
                    null,

                city:
                    city?.trim() ||
                    "Yaoundé",

                phone:
                    phone?.trim() ||
                    null,

                whatsapp:
                    whatsapp?.trim() ||
                    null,

                estimated_price:
                    estimatedPrice
                        ? Number(
                            estimatedPrice
                        )
                        : null,

                submitted_by_name:
                    submittedByName?.trim() ||
                    null,

                submitted_by_phone:
                    submittedByPhone?.trim() ||
                    null,
            })
            .select("id")
            .single();

        if (error) {
            console.error(
                error
            );

            return res.status(500).json({
                error:
                    "Unable to submit the spot.",
            });
        }

        return res.status(201).json({
            success: true,
            submissionId:
                data.id,
        });
    } catch (error) {
        console.error(
            error
        );

        return res.status(500).json({
            error:
                "Unable to submit the spot.",
        });
    }
}