import crypto from "crypto";

const ADMIN_PHONE =
    process.env.NICETHINGS_ADMIN_PHONE;

const ADMIN_CODE =
    process.env.NICETHINGS_ADMIN_CODE;

const COOKIE_NAME =
    "nicethings_admin_session";

function secret() {
    const value =
        process.env
            .NICETHINGS_ADMIN_SESSION_SECRET ||
        process.env.TAYEB_SESSION_SECRET;

    if (!value) {
        throw new Error(
            "NICETHINGS_ADMIN_SESSION_SECRET is not configured."
        );
    }

    return value;
}

function sign(value) {
    return crypto
        .createHmac(
            "sha256",
            secret()
        )
        .update(value)
        .digest("hex");
}

export function createAdminToken() {
    const expires =
        Math.floor(
            Date.now() / 1000
        ) +
        60 * 60 * 12;

    const payload =
        `admin.${expires}`;

    return `${payload}.${sign(
        payload
    )}`;
}

export function verifyAdminToken(
    token
) {
    if (!token) {
        return false;
    }

    const parts =
        token.split(".");

    if (
        parts.length !== 3
    ) {
        return false;
    }

    const [
        role,
        expires,
        signature,
    ] = parts;

    if (
        role !== "admin"
    ) {
        return false;
    }

    const expiry =
        Number(expires);

    if (
        !Number.isFinite(
            expiry
        ) ||
        expiry <
        Math.floor(
            Date.now() / 1000
        )
    ) {
        return false;
    }

    const payload =
        `${role}.${expires}`;

    const expected =
        sign(payload);

    if (
        signature.length !==
        expected.length
    ) {
        return false;
    }

    return crypto.timingSafeEqual(
        Buffer.from(
            signature
        ),
        Buffer.from(
            expected
        )
    );
}

export function getAdminCookie(
    req
) {
    const cookies =
        req.headers.cookie ||
        "";

    for (
        const cookie of cookies.split(
            ";"
        )
    ) {
        const [
            key,
            ...value
        ] =
            cookie
                .trim()
                .split("=");

        if (
            key ===
            COOKIE_NAME
        ) {
            return decodeURIComponent(
                value.join("=")
            );
        }
    }

    return null;
}

/*
 * Used by the logout API.
 */
export function getAdminCookieName() {
    return COOKIE_NAME;
}

export function requireAdmin(
    req,
    res
) {
    const token =
        getAdminCookie(
            req
        );

    if (
        !verifyAdminToken(
            token
        )
    ) {
        res.status(401).json({
            error:
                "Administrator authentication required.",
        });

        return false;
    }

    return true;
}

export {
    ADMIN_PHONE,
    ADMIN_CODE,
    COOKIE_NAME,
};