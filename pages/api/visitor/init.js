import crypto from "crypto";
import supabaseAdmin from "../../../lib/supabaseAdmin";


function validVisitorId(value) {
    if (
        typeof value !== "string"
    ) {
        return false;
    }

    return /^[0-9a-fA-F-]{36}$/.test(
        value
    );
}


function normalizeLanguage(language) {
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
        } = req.body || {};


        const selectedLanguage =
            normalizeLanguage(
                language
            );


        /*
         * =====================================================
         * EXISTING VISITOR
         * =====================================================
         */

        if (
            validVisitorId(
                visitorId
            )
        ) {

            const {
                data: visitor,
                error: lookupError,
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


            /*
             * If the database lookup succeeds and the
             * visitor exists, reuse that visitor.
             */

            if (
                !lookupError &&
                visitor
            ) {

                const {
                    error:
                    updateError,
                } =
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


                if (
                    updateError
                ) {

                    console.error(
                        "Visitor update error:",
                        updateError
                    );

                    /*
                     * Don't destroy the session just because
                     * updating last_seen_at/language failed.
                     *
                     * The visitor itself is still valid.
                     */
                }


                return res.status(200).json({

                    visitorId:
                        visitor.id,

                    existing:
                        true,

                });
            }


            /*
             * If the old UUID doesn't exist anymore,
             * we deliberately continue below and create
             * a fresh visitor.
             *
             * This prevents an old localStorage value from
             * permanently blocking the user.
             */

            if (
                lookupError
            ) {

                console.error(
                    "Existing visitor lookup failed:",
                    lookupError
                );

            }

        }


        /*
         * =====================================================
         * NEW / RECOVERED ANONYMOUS VISITOR
         * =====================================================
         */

        const newVisitorId =
            crypto.randomUUID();


        const {
            data: newVisitor,
            error:
            createError,
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


        if (
            createError ||
            !newVisitor
        ) {

            console.error(
                "Visitor creation error:",
                createError
            );


            return res.status(500).json({
                error:
                    "Unable to create visitor.",
            });
        }


        /*
         * Return the new database-backed visitor ID.
         */

        return res.status(200).json({

            visitorId:
                newVisitor.id,

            existing:
                false,

        });


    } catch (
    error
    ) {

        console.error(
            "Visitor initialization error:",
            error
        );


        return res.status(500).json({

            error:
                "Unable to initialize visitor.",

        });
    }
}