import {
    useEffect,
    useMemo,
} from "react";

import {
    MapContainer,
    Marker,
    Popup,
    TileLayer,
    useMap,
} from "react-leaflet";

import L from "leaflet";

import "leaflet/dist/leaflet.css";

import {
    MapPin,
} from "lucide-react";

/* =========================================================
   DEFAULT PLACE MARKER
========================================================= */

const defaultIcon =
    L.icon({
        iconUrl:
            "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",

        iconRetinaUrl:
            "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",

        shadowUrl:
            "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",

        iconSize: [
            25,
            41,
        ],

        iconAnchor: [
            12,
            41,
        ],

        popupAnchor: [
            1,
            -34,
        ],

        shadowSize: [
            41,
            41,
        ],
    });

/* =========================================================
   USER LOCATION MARKER
========================================================= */

const userIcon =
    L.divIcon({
        className:
            "nicethings-user-location-marker",

        html: `
            <div class="nicethings-user-location-dot">
                <div class="nicethings-user-location-pulse"></div>
            </div>
        `,

        iconSize: [
            28,
            28,
        ],

        iconAnchor: [
            14,
            14,
        ],
    });

/* =========================================================
   MAP CONTROLLER
========================================================= */

function MapController({
    userLocation,
    spots,
    followUser,
}) {
    const map =
        useMap();

    const points =
        useMemo(() => {
            const result = [];

            if (
                userLocation &&
                Number.isFinite(
                    Number(
                        userLocation.latitude
                    )
                ) &&
                Number.isFinite(
                    Number(
                        userLocation.longitude
                    )
                )
            ) {
                result.push([
                    Number(
                        userLocation.latitude
                    ),
                    Number(
                        userLocation.longitude
                    ),
                ]);
            }

            spots.forEach(
                spot => {
                    const latitude =
                        Number(
                            spot?.latitude
                        );

                    const longitude =
                        Number(
                            spot?.longitude
                        );

                    if (
                        Number.isFinite(
                            latitude
                        ) &&
                        Number.isFinite(
                            longitude
                        )
                    ) {
                        result.push([
                            latitude,
                            longitude,
                        ]);
                    }
                }
            );

            return result;
        }, [
            userLocation,
            spots,
        ]);

    /*
     * Follow the user while
     * Follow My Location is ON.
     */

    useEffect(() => {
        if (
            !followUser ||
            !userLocation
        ) {
            return;
        }

        const latitude =
            Number(
                userLocation.latitude
            );

        const longitude =
            Number(
                userLocation.longitude
            );

        if (
            !Number.isFinite(
                latitude
            ) ||
            !Number.isFinite(
                longitude
            )
        ) {
            return;
        }

        map.setView(
            [
                latitude,
                longitude,
            ],
            Math.max(
                map.getZoom(),
                15
            ),
            {
                animate:
                    true,
            }
        );
    }, [
        map,
        userLocation,
        followUser,
    ]);

    /*
     * When not following the user,
     * fit the map around the relevant
     * locations.
     */

    useEffect(() => {
        if (
            followUser ||
            !points.length
        ) {
            return;
        }

        if (
            points.length ===
            1
        ) {
            map.setView(
                points[0],
                14
            );

            return;
        }

        const bounds =
            L.latLngBounds(
                points
            );

        map.fitBounds(
            bounds,
            {
                padding: [
                    50,
                    50,
                ],

                maxZoom: 15,
            }
        );
    }, [
        map,
        points,
        followUser,
    ]);

    return null;
}

/* =========================================================
   DISTANCE
========================================================= */

function formatDistance(
    distanceKm
) {
    if (
        distanceKm ===
        null ||
        distanceKm ===
        undefined
    ) {
        return null;
    }

    const distance =
        Number(
            distanceKm
        );

    if (
        !Number.isFinite(
            distance
        ) ||
        distance < 0
    ) {
        return null;
    }

    if (
        distance < 1
    ) {
        return `${Math.round(
            distance * 1000
        )} m`;
    }

    return `${distance.toFixed(
        1
    )} km`;
}

/* =========================================================
   DIRECTIONS
========================================================= */

function openDirections(
    latitude,
    longitude
) {
    if (
        !Number.isFinite(
            Number(latitude)
        ) ||
        !Number.isFinite(
            Number(longitude)
        )
    ) {
        return;
    }

    const url =
        `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
            `${latitude},${longitude}`
        )}`;

    window.open(
        url,
        "_blank",
        "noopener,noreferrer"
    );
}

/* =========================================================
   MAIN MAP
========================================================= */

export default function NiceThingsMap({
    spots = [],
    userLocation = null,
    onSelectSpot,
    followUser = false,
}) {
    const validSpots =
        spots.filter(
            spot => {
                const latitude =
                    Number(
                        spot?.latitude
                    );

                const longitude =
                    Number(
                        spot?.longitude
                    );

                return (
                    Number.isFinite(
                        latitude
                    ) &&
                    Number.isFinite(
                        longitude
                    )
                );
            }
        );

    /*
     * Cameroon fallback.
     */

    const defaultCenter = [
        5.9631,
        10.1591,
    ];

    return (
        <div
            className="nicethings-map-wrapper"
            style={{
                width:
                    "100%",

                height:
                    "min(70vh, 650px)",

                minHeight:
                    "480px",

                borderRadius:
                    "24px",

                overflow:
                    "hidden",

                position:
                    "relative",

                background:
                    "#eef1f3",
            }}
        >
            <MapContainer
                center={
                    defaultCenter
                }
                zoom={6}
                scrollWheelZoom={
                    true
                }
                style={{
                    width:
                        "100%",

                    height:
                        "100%",
                }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <MapController
                    userLocation={
                        userLocation
                    }
                    spots={
                        validSpots
                    }
                    followUser={
                        followUser
                    }
                />

                {/* USER LOCATION */}

                {userLocation &&
                    Number.isFinite(
                        Number(
                            userLocation.latitude
                        )
                    ) &&
                    Number.isFinite(
                        Number(
                            userLocation.longitude
                        )
                    ) && (
                        <Marker
                            position={[
                                Number(
                                    userLocation.latitude
                                ),
                                Number(
                                    userLocation.longitude
                                ),
                            ]}
                            icon={
                                userIcon
                            }
                        >
                            <Popup>
                                <strong>
                                    You are here
                                </strong>
                            </Popup>
                        </Marker>
                    )}

                {/* PLACE MARKERS */}

                {validSpots.map(
                    spot => {
                        const latitude =
                            Number(
                                spot.latitude
                            );

                        const longitude =
                            Number(
                                spot.longitude
                            );

                        const distance =
                            formatDistance(
                                spot
                                    ?.distanceKm
                            );

                        const matchScore =
                            Number(
                                spot
                                    ?.match
                                    ?.score
                            );

                        const budgetStatus =
                            spot
                                ?.match
                                ?.budgetStatus;

                        return (
                            <Marker
                                key={
                                    spot.id
                                }
                                position={[
                                    latitude,
                                    longitude,
                                ]}
                                icon={
                                    defaultIcon
                                }
                            >
                                <Popup>
                                    <div
                                        style={{
                                            minWidth:
                                                "210px",
                                        }}
                                    >
                                        <strong
                                            style={{
                                                display:
                                                    "block",

                                                fontSize:
                                                    "16px",

                                                marginBottom:
                                                    "6px",
                                            }}
                                        >
                                            {
                                                spot.name
                                            }
                                        </strong>

                                        {spot.category && (
                                            <div
                                                style={{
                                                    fontSize:
                                                        "13px",

                                                    marginBottom:
                                                        "6px",
                                                }}
                                            >
                                                {
                                                    spot.category
                                                }
                                            </div>
                                        )}

                                        {distance && (
                                            <div
                                                style={{
                                                    fontSize:
                                                        "13px",

                                                    marginBottom:
                                                        "5px",
                                                }}
                                            >
                                                📍{" "}
                                                {
                                                    distance
                                                }{" "}
                                                away
                                            </div>
                                        )}

                                        {Number.isFinite(
                                            matchScore
                                        ) && (
                                                <div
                                                    style={{
                                                        fontSize:
                                                            "13px",

                                                        fontWeight:
                                                            700,

                                                        marginBottom:
                                                            "5px",
                                                    }}
                                                >
                                                    ✨{" "}
                                                    {
                                                        Math.round(
                                                            matchScore
                                                        )
                                                    }
                                                    % match
                                                </div>
                                            )}

                                        {budgetStatus ===
                                            "WITHIN_BUDGET" && (
                                                <div
                                                    style={{
                                                        fontSize:
                                                            "12px",

                                                        marginBottom:
                                                            "10px",
                                                    }}
                                                >
                                                    ✓ Within your budget
                                                </div>
                                            )}

                                        {budgetStatus ===
                                            "NEAR_BUDGET" && (
                                                <div
                                                    style={{
                                                        fontSize:
                                                            "12px",

                                                        marginBottom:
                                                            "10px",
                                                    }}
                                                >
                                                    Close to your budget
                                                </div>
                                            )}

                                        {budgetStatus ===
                                            "ABOVE_BUDGET" && (
                                                <div
                                                    style={{
                                                        fontSize:
                                                            "12px",

                                                        marginBottom:
                                                            "10px",
                                                    }}
                                                >
                                                    ⚠ Above your budget
                                                </div>
                                            )}

                                        <div
                                            style={{
                                                display:
                                                    "flex",

                                                gap:
                                                    "7px",

                                                flexWrap:
                                                    "wrap",
                                            }}
                                        >
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    if (
                                                        onSelectSpot
                                                    ) {
                                                        onSelectSpot(
                                                            spot
                                                        );
                                                    }
                                                }}
                                                style={{
                                                    border:
                                                        "none",

                                                    borderRadius:
                                                        "9px",

                                                    padding:
                                                        "8px 10px",

                                                    cursor:
                                                        "pointer",
                                                }}
                                            >
                                                View place
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    openDirections(
                                                        latitude,
                                                        longitude
                                                    )
                                                }
                                                style={{
                                                    border:
                                                        "none",

                                                    borderRadius:
                                                        "9px",

                                                    padding:
                                                        "8px 10px",

                                                    cursor:
                                                        "pointer",
                                                }}
                                            >
                                                🧭 Directions
                                            </button>
                                        </div>
                                    </div>
                                </Popup>
                            </Marker>
                        );
                    }
                )}
            </MapContainer>

            {/* LEGEND */}

            <div
                style={{
                    position:
                        "absolute",

                    left:
                        "14px",

                    bottom:
                        "14px",

                    zIndex:
                        1000,

                    background:
                        "rgba(255,255,255,0.94)",

                    backdropFilter:
                        "blur(10px)",

                    borderRadius:
                        "14px",

                    padding:
                        "10px 12px",

                    boxShadow:
                        "0 8px 24px rgba(0,0,0,0.12)",

                    fontSize:
                        "12px",
                }}
            >
                <div
                    style={{
                        display:
                            "flex",

                        alignItems:
                            "center",

                        gap:
                            "7px",

                        marginBottom:
                            "5px",
                    }}
                >
                    <span className="nicethings-map-user-dot" />

                    Your location
                </div>

                <div
                    style={{
                        display:
                            "flex",

                        alignItems:
                            "center",

                        gap:
                            "7px",
                    }}
                >
                    <MapPin
                        size={
                            14
                        }
                    />

                    NiceThings places
                </div>
            </div>
        </div>
    );
}