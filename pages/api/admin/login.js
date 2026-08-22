import {
    ADMIN_PHONE,
    ADMIN_CODE,
    COOKIE_NAME,
    createAdminToken,
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

    const {
        phone,
        code,
    } =
        req.body || {};

    if (
        phone?.trim() !==
        ADMIN_PHONE ||
        code?.trim() !==
        ADMIN_CODE
    ) {
        return res.status(401).json({
            error:
                "Invalid administrator credentials.",
        });
    }

    const token =
        createAdminToken();

    const secure =
        process.env.NODE_ENV ===
        "production";

    const cookie = [
        `${COOKIE_NAME}=${encodeURIComponent(
            token
        )}`,
        "Path=/",
        "HttpOnly",
        "SameSite=Lax",
        "Max-Age=43200",
    ];

    if (secure) {
        cookie.push(
            "Secure"
        );
    }

    res.setHeader(
        "Set-Cookie",
        cookie.join(
            "; "
        )
    );

    return res.status(200).json({
        success: true,
    });
}