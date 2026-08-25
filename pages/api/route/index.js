export default async function handler(req, res) {
    if (req.method !== "GET") {
        return res.status(405).json({
            error: "Method not allowed.",
        });
    }

    try {
        const {
            fromLat,
            fromLng,
            toLat,
            toLng,
        } = req.query || {};

        const startLat = Number(fromLat);
        const startLng = Number(fromLng);
        const endLat = Number(toLat);
        const endLng = Number(toLng);

        const validCoordinate = (
            latitude,
            longitude
        ) =>
            Number.isFinite(latitude) &&
            Number.isFinite(longitude) &&
            latitude >= -90 &&
            latitude <= 90 &&
            longitude >= -180 &&
            longitude <= 180;

        if (
            !validCoordinate(
                startLat,
                startLng
            ) ||
            !validCoordinate(
                endLat,
                endLng
            )
        ) {
            return res.status(400).json({
                error:
                    "Invalid route coordinates.",
            });
        }

        /*
         * OSRM expects:
         * longitude,latitude
         *
         * NOT:
         * latitude,longitude
         */

        const coordinates =
            `${startLng},${startLat};${endLng},${endLat}`;

        const url =
            `https://router.project-osrm.org/route/v1/driving/${coordinates}?overview=full&geometries=geojson&steps=true`;

        const response =
            await fetch(url, {
                method: "GET",
                headers: {
                    Accept:
                        "application/json",
                    "User-Agent":
                        "NiceThings/1.0",
                },
            });

        if (!response.ok) {
            console.error(
                "OSRM response:",
                response.status
            );

            return res.status(502).json({
                error:
                    "Unable to calculate the road route.",
            });
        }

        const data =
            await response.json();

        if (
            data?.code !==
            "Ok" ||
            !data?.routes?.length
        ) {
            return res.status(404).json({
                error:
                    "No road route was found between these locations.",
            });
        }

        const route =
            data.routes[0];

        return res.status(200).json({
            success: true,

            distanceKm:
                Number(
                    route.distance
                ) / 1000,

            distanceMeters:
                route.distance,

            durationMinutes:
                Number(
                    route.duration
                ) / 60,

            durationSeconds:
                route.duration,

            geometry:
                route.geometry,

            legs:
                route.legs || [],

            steps:
                route.legs?.[0]
                    ?.steps || [],
        });
    } catch (error) {
        console.error(
            "Route API error:",
            error
        );

        return res.status(500).json({
            error:
                "Something went wrong while calculating the route.",
        });
    }
}