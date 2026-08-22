import crypto from "crypto";
import supabaseAdmin from "../../../lib/supabaseAdmin";

function validVisitorId(
    value
) {
    if (
        typeof value !==
        "string"
    ) {
        return false;
    }

    return /^[0-9a-fA-F-]{36}$/.test(
        value
    );
}

function normalizeLanguage(
    language
) {
    return language === "fr"
        ? "fr"
        : "en";
}

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
            language,
        } =
            req.body || {};

        const selectedLanguage =
            normalizeLanguage(
                language
            );

        /*
         * Returning visitor
         */
        if (
            validVisitorId(
                visitorId
            )
        ) {
            const {
                data: visitor,
                error,
            } =
                await supabaseAdmin
                    .from(
                        "nt_visitors"
                    )
                    .select(
                        "id,language"
                    )
                    .eq(
                        "id",
                        visitorId
                    )
                    .maybeSingle();

            if (error) {
                console.error(
                    error
                );

                return res
                    .status(500)
                    .json({
                        error:
                            "Unable to load visitor.",
                    });
            }

            if (visitor) {
                await supabaseAdmin
                    .from(
                        "nt_visitors"
                    )
                    .update({
                        last_seen_at:
                            new Date().toISOString(),
                        language:
                            selectedLanguage,
                    })
                    .eq(
                        "id",
                        visitor.id
                    );

                return res.status(200).json({
                    visitorId:
                        visitor.id,
                    existing: true,
                });
            }
        }

        /*
         * New anonymous visitor
         */
        const newVisitorId =
            crypto.randomUUID();

        const {
            data: visitor,
            error,
        } =
            await supabaseAdmin
                .from(
                    "nt_visitors"
                )
                .insert({
                    id:
                        newVisitorId,
                    language:
                        selectedLanguage,
                })
                .select(
                    "id"
                )
                .single();

        if (error) {
            console.error(
                error
            );

            return res
                .status(500)
                .json({
                    error:
                        "Unable to create visitor.",
                });
        }

        return res.status(200).json({
            visitorId:
                visitor.id,
            existing: false,
        });
    } catch (error) {
        console.error(
            error
        );

        return res.status(500).json({
            error:
                "Unable to initialize visitor.",
        });
    }
}