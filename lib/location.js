export function getCurrentLocation() {
    return new Promise((resolve, reject) => {
        if (
            typeof window === "undefined" ||
            !navigator.geolocation
        ) {
            reject(
                new Error(
                    "Geolocation is not available on this device."
                )
            );

            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const latitude =
                    position.coords.latitude;

                const longitude =
                    position.coords.longitude;

                const accuracy =
                    position.coords.accuracy;

                if (
                    !Number.isFinite(latitude) ||
                    !Number.isFinite(longitude)
                ) {
                    reject(
                        new Error(
                            "Invalid location coordinates."
                        )
                    );

                    return;
                }

                resolve({
                    latitude,
                    longitude,
                    accuracy,
                });
            },

            (error) => {
                let message =
                    "Unable to access your location.";

                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        message =
                            "Location permission was denied. Please allow NiceThings to use your location.";
                        break;

                    case error.POSITION_UNAVAILABLE:
                        message =
                            "Your location is temporarily unavailable. Please check your phone's location settings and try again.";
                        break;

                    case error.TIMEOUT:
                        message =
                            "Getting your location took too long. Please try again.";
                        break;

                    default:
                        message =
                            "Unable to access your location. Please try again.";
                }

                const locationError =
                    new Error(message);

                locationError.code =
                    error.code;

                reject(locationError);
            },

            {
                enableHighAccuracy: true,

                timeout: 30000,

                maximumAge: 30000,
            }
        );
    });
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
        Number(latitude) >= -90 &&
        Number(latitude) <= 90 &&
        Number(longitude) >= -180 &&
        Number(longitude) <= 180
    );
}