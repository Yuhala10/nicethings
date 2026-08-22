import {
    getAdminCookie,
    verifyAdminToken,
} from "../../../lib/adminAuth";

export default async function handler(
    req,
    res
) {
    if (
        req.method !==
        "GET"
    ) {
        return res.status(405).json({
            error:
                "Method not allowed.",
        });
    }

    const token =
        getAdminCookie(
            req
        );

    const authenticated =
        verifyAdminToken(
            token
        );

    return res.status(200).json({
        authenticated,
    });
}