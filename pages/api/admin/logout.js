import {
    getAdminCookieName,
} from "../../../lib/adminAuth";

export default async function handler(
    req,
    res
) {
    if (
        req.method !==
        "POST"
    ) {
        return res.status(405).json({
            error:
                "Method not allowed.",
        });
    }

    const isProduction =
        process.env.NODE_ENV ===
        "production";

    const cookieParts = [
        `${getAdminCookieName()}=`,
        "Path=/",
        "HttpOnly",
        "SameSite=Lax",
        "Max-Age=0",
        "Expires=Thu, 01 Jan 1970 00:00:00 GMT",
    ];

    if (
        isProduction
    ) {
        cookieParts.push(
            "Secure"
        );
    }

    res.setHeader(
        "Set-Cookie",
        cookieParts.join(
            "; "
        )
    );

    return res.status(200).json({
        success: true,
    });
}