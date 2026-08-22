export function calculateDistance(
    latitude1,
    longitude1,
    latitude2,
    longitude2
) {
    if (
        !Number.isFinite(
            Number(latitude1)
        ) ||
        !Number.isFinite(
            Number(longitude1)
        ) ||
        !Number.isFinite(
            Number(latitude2)
        ) ||
        !Number.isFinite(
            Number(longitude2)
        )
    ) {
        return null;
    }

    const earthRadiusKm =
        6371;

    const lat1 =
        (Number(latitude1) *
            Math.PI) /
        180;

    const lat2 =
        (Number(latitude2) *
            Math.PI) /
        180;

    const deltaLat =
        ((Number(latitude2) -
            Number(latitude1)) *
            Math.PI) /
        180;

    const deltaLon =
        ((Number(longitude2) -
            Number(longitude1)) *
            Math.PI) /
        180;

    const a =
        Math.sin(
            deltaLat / 2
        ) **
        2 +
        Math.cos(lat1) *
        Math.cos(lat2) *
        Math.sin(
            deltaLon / 2
        ) **
        2;

    const c =
        2 *
        Math.atan2(
            Math.sqrt(a),
            Math.sqrt(1 - a)
        );

    return (
        earthRadiusKm *
        c
    );
}

export function formatDistance(
    distanceKm
) {
    if (
        distanceKm === null ||
        distanceKm === undefined
    ) {
        return null;
    }

    if (
        distanceKm < 1
    ) {
        return `${Math.round(
            distanceKm * 1000
        )} m`;
    }

    return `${distanceKm.toFixed(
        1
    )} km`;
}