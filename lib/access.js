const FREE_LAUNCH_UNTIL =
    process.env.NICETHINGS_FREE_LAUNCH_UNTIL ||
    "2026-08-31T00:00:00+01:00";

export const ACCESS_PRICE = 100;
export const ACCESS_DURATION_HOURS = 24;
export const MOMO_NUMBER =
    process.env.NICETHINGS_MOMO_NUMBER ||
    "681731512";

export function isLaunchFree() {
    return (
        new Date() <
        new Date(FREE_LAUNCH_UNTIL)
    );
}

export function getAccessMode() {
    return isLaunchFree()
        ? "FREE_LAUNCH"
        : "PAID";
}

export function getAccessConfig() {
    return {
        mode: getAccessMode(),
        freeLaunch: isLaunchFree(),
        price: ACCESS_PRICE,
        currency: "XAF",
        durationHours:
            ACCESS_DURATION_HOURS,
        momoNumber: MOMO_NUMBER,
        freeLaunchUntil:
            FREE_LAUNCH_UNTIL,
    };
}

export function isAccessActive(
    expiresAt
) {
    if (!expiresAt) {
        return false;
    }

    return (
        new Date(expiresAt) >
        new Date()
    );
}