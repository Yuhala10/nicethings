export function getCurrentLocation() {
    return new Promise(
        (resolve, reject) => {
            if (
                typeof window ===
                "undefined" ||
                !navigator.geolocation
            ) {
                reject(
                    new Error(
                        "Geolocation is not available."
                    )
                );

                return;
            }

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    resolve({
                        latitude:
                            position
                                .coords
                                .latitude,

                        longitude:
                            position
                                .coords
                                .longitude,

                        accuracy:
                            position
                                .coords
                                .accuracy,
                    });
                },
                (error) => {
                    reject(
                        error
                    );
                },
                {
                    enableHighAccuracy:
                        true,

                    timeout:
                        12000,

                    maximumAge:
                        60000,
                }
            );
        }
    );
}

export function isValidCoordinates(
    latitude,
    longitude
) {
    return (
        Number.isFinite(
            Number(latitude)
        ) &&
        Number.isFinite(
            Number(longitude)
        ) &&
        Number(latitude) >=
        -90 &&
        Number(latitude) <=
        90 &&
        Number(longitude) >=
        -180 &&
        Number(longitude) <=
        180
    );
}