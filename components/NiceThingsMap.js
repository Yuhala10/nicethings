import {
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    MapContainer,
    Marker,
    Popup,
    TileLayer,
    Polyline,
    useMap,
} from "react-leaflet";

import L from "leaflet";

import "leaflet/dist/leaflet.css";

import {
    MapPin,
    Navigation,
    Route,
    Clock3,
    X,
} from "lucide-react";

/* =========================================================
   MARKERS
========================================================= */

const defaultIcon = L.icon({
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

const userIcon = L.divIcon({
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
   VALID COORDINATES
========================================================= */

function isValidCoordinates(
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

/* =========================================================
   FORMAT DISTANCE
========================================================= */

function formatDistance(
    distanceKm
) {
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
   FORMAT TIME
========================================================= */

function formatDuration(
    minutes
) {
    const value =
        Number(
            minutes
        );

    if (
        !Number.isFinite(
            value
        ) ||
        value < 0
    ) {
        return null;
    }

    const rounded =
        Math.max(
            1,
            Math.round(
                value
            )
        );

    if (
        rounded < 60
    ) {
        return `${rounded} min`;
    }

    const hours =
        Math.floor(
            rounded / 60
        );

    const remaining =
        rounded % 60;

    if (
        remaining ===
        0
    ) {
        return `${hours} h`;
    }

    return `${hours} h ${remaining} min`;
}

/* =========================================================
   MAP CONTROLLER
========================================================= */

function MapController({
    userLocation,
    spots,
    followUser,
    routeCoordinates,
}) {
    const map =
        useMap();

    const points =
        useMemo(() => {
            const result =
                [];

            if (
                userLocation &&
                isValidCoordinates(
                    userLocation.latitude,
                    userLocation.longitude
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
                    if (
                        isValidCoordinates(
                            spot?.latitude,
                            spot?.longitude
                        )
                    ) {
                        result.push([
                            Number(
                                spot.latitude
                            ),
                            Number(
                                spot.longitude
                            ),
                        ]);
                    }
                }
            );

            return result;
        }, [
            userLocation,
            spots,
        ]);

    /* =====================================================
       FOLLOW USER

       IMPORTANT:
       When a route is visible, we DO NOT
       recenter the map on the user.

       Otherwise the route-fit operation gets
       immediately overridden and the route can
       appear to be missing/off-screen.
    ====================================================== */

    useEffect(() => {
        if (
            !followUser ||
            !userLocation ||
            routeCoordinates?.length >
            1
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
            !isValidCoordinates(
                latitude,
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
        routeCoordinates,
    ]);

    /* =====================================================
       FIT ENTIRE ROUTE

       This is the important part.

       We show the complete road route from
       the user to the selected place.
    ====================================================== */

    useEffect(() => {
        if (
            !routeCoordinates ||
            routeCoordinates.length <
            2
        ) {
            return;
        }

        const bounds =
            L.latLngBounds(
                routeCoordinates
            );

        /*
         * Make sure Leaflet knows the container
         * has its correct dimensions.
         */

        map.invalidateSize(
            false
        );

        /*
         * Small delay allows the map to finish
         * rendering before fitting the route.
         */

        const timer =
            setTimeout(() => {
                map.fitBounds(
                    bounds,
                    {
                        paddingTopLeft: [
                            50,
                            110,
                        ],

                        paddingBottomRight: [
                            50,
                            70,
                        ],

                        maxZoom: 17,

                        animate:
                            true,
                    }
                );
            }, 100);

        return () =>
            clearTimeout(
                timer
            );
    }, [
        map,
        routeCoordinates,
    ]);

    /* =====================================================
       NORMAL MAP FIT

       Only used when there is NO route.
    ====================================================== */

    useEffect(() => {
        if (
            followUser ||
            routeCoordinates?.length >
            1 ||
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
        routeCoordinates,
    ]);

    return null;
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
    const [
        selectedSpot,
        setSelectedSpot,
    ] = useState(null);

    const [
        routeCoordinates,
        setRouteCoordinates,
    ] = useState([]);

    const [
        routeInfo,
        setRouteInfo,
    ] = useState(null);

    const [
        routeLoading,
        setRouteLoading,
    ] = useState(false);

    const [
        routeError,
        setRouteError,
    ] = useState("");

    const validSpots =
        spots.filter(
            spot =>
                isValidCoordinates(
                    spot?.latitude,
                    spot?.longitude
                )
        );

    const defaultCenter = [
        5.9631,
        10.1591,
    ];

    /* =====================================================
       CALCULATE ROAD ROUTE
    ====================================================== */

    async function calculateRoute(
        spot
    ) {
        if (
            !spot ||
            !userLocation
        ) {
            setRouteError(
                "Your current location is required to calculate a route."
            );

            return;
        }

        const fromLat =
            Number(
                userLocation.latitude
            );

        const fromLng =
            Number(
                userLocation.longitude
            );

        const toLat =
            Number(
                spot.latitude
            );

        const toLng =
            Number(
                spot.longitude
            );

        if (
            !isValidCoordinates(
                fromLat,
                fromLng
            ) ||
            !isValidCoordinates(
                toLat,
                toLng
            )
        ) {
            setRouteError(
                "Valid location coordinates are required."
            );

            return;
        }

        setSelectedSpot(
            spot
        );

        setRouteLoading(
            true
        );

        setRouteError(
            ""
        );

        /*
         * Don't immediately clear the existing
         * route during a GPS refresh.
         *
         * This prevents visual flickering.
         */

        try {
            const params =
                new URLSearchParams({
                    fromLat:
                        String(
                            fromLat
                        ),

                    fromLng:
                        String(
                            fromLng
                        ),

                    toLat:
                        String(
                            toLat
                        ),

                    toLng:
                        String(
                            toLng
                        ),
                });

            const response =
                await fetch(
                    `/api/route?${params.toString()}`,
                    {
                        method:
                            "GET",

                        cache:
                            "no-store",
                    }
                );

            const data =
                await response.json();

            if (
                !response.ok ||
                !data?.success ||
                !data?.geometry
                    ?.coordinates ||
                data.geometry.coordinates
                    .length <
                2
            ) {
                throw new Error(
                    data?.error ||
                    "No road route was found."
                );
            }

            /*
             * OSRM / GeoJSON:
             *
             * [longitude, latitude]
             *
             * Leaflet:
             *
             * [latitude, longitude]
             */

            const coordinates =
                data.geometry.coordinates
                    .map(
                        coordinate => {
                            const longitude =
                                Number(
                                    coordinate[0]
                                );

                            const latitude =
                                Number(
                                    coordinate[1]
                                );

                            if (
                                !isValidCoordinates(
                                    latitude,
                                    longitude
                                )
                            ) {
                                return null;
                            }

                            return [
                                latitude,
                                longitude,
                            ];
                        }
                    )
                    .filter(
                        Boolean
                    );

            if (
                coordinates.length <
                2
            ) {
                throw new Error(
                    "The routing service returned an invalid route."
                );
            }

            setRouteCoordinates(
                coordinates
            );

            setRouteInfo({
                distanceKm:
                    Number(
                        data.distanceKm
                    ),

                distanceMeters:
                    Number(
                        data.distanceMeters
                    ),

                durationMinutes:
                    Number(
                        data.durationMinutes
                    ),

                durationSeconds:
                    Number(
                        data.durationSeconds
                    ),
            });
        } catch (
        error
        ) {
            console.error(
                "Route calculation:",
                error
            );

            setRouteError(
                error?.message ||
                "Unable to calculate the road route."
            );
        } finally {
            setRouteLoading(
                false
            );
        }
    }

    /* =====================================================
       CLOSE ROUTE
    ====================================================== */

    function clearRoute() {
        setSelectedSpot(
            null
        );

        setRouteCoordinates(
            []
        );

        setRouteInfo(
            null
        );

        setRouteError(
            ""
        );
    }

    /* =====================================================
       GPS ROUTE REFRESH

       Only refresh after the user has moved
       enough to make the old route stale.

       We don't route on every tiny GPS update.
    ====================================================== */

    const [
        lastRoutedLocation,
        setLastRoutedLocation,
    ] = useState(null);

    function calculateStraightDistanceKm(
        lat1,
        lng1,
        lat2,
        lng2
    ) {
        const earthRadius =
            6371;

        const dLat =
            (
                Number(
                    lat2
                ) -
                Number(
                    lat1
                )
            ) *
            Math.PI /
            180;

        const dLng =
            (
                Number(
                    lng2
                ) -
                Number(
                    lng1
                )
            ) *
            Math.PI /
            180;

        const a =
            Math.sin(
                dLat / 2
            ) **
            2 +
            Math.cos(
                Number(
                    lat1
                ) *
                Math.PI /
                180
            ) *
            Math.cos(
                Number(
                    lat2
                ) *
                Math.PI /
                180
            ) *
            Math.sin(
                dLng / 2
            ) **
            2;

        return (
            earthRadius *
            2 *
            Math.atan2(
                Math.sqrt(
                    a
                ),
                Math.sqrt(
                    1 - a
                )
            )
        );
    }

    useEffect(() => {
        if (
            !selectedSpot ||
            !userLocation
        ) {
            return;
        }

        if (
            !isValidCoordinates(
                userLocation.latitude,
                userLocation.longitude
            )
        ) {
            return;
        }

        /*
         * First location after route creation.
         */

        if (
            !lastRoutedLocation
        ) {
            setLastRoutedLocation({
                latitude:
                    Number(
                        userLocation.latitude
                    ),

                longitude:
                    Number(
                        userLocation.longitude
                    ),
            });

            return;
        }

        const movedKm =
            calculateStraightDistanceKm(
                lastRoutedLocation.latitude,
                lastRoutedLocation.longitude,
                userLocation.latitude,
                userLocation.longitude
            );

        /*
         * Recalculate only after approximately
         * 50 metres of movement.
         */

        if (
            movedKm <
            0.05
        ) {
            return;
        }

        const timer =
            setTimeout(
                async () => {
                    await calculateRoute(
                        selectedSpot
                    );

                    setLastRoutedLocation({
                        latitude:
                            Number(
                                userLocation.latitude
                            ),

                        longitude:
                            Number(
                                userLocation.longitude
                            ),
                    });
                },
                800
            );

        return () =>
            clearTimeout(
                timer
            );

        // calculateRoute intentionally omitted
        // because it is recreated on render.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        userLocation?.latitude,
        userLocation?.longitude,
        selectedSpot?.id,
    ]);

    /* =====================================================
       GOOGLE MAPS FALLBACK
    ====================================================== */

    function openGoogleMaps(
        spot
    ) {
        if (
            !spot ||
            !isValidCoordinates(
                spot.latitude,
                spot.longitude
            )
        ) {
            return;
        }

        const destination =
            `${spot.latitude},${spot.longitude}`;

        let url =
            `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                destination
            )}`;

        if (
            userLocation &&
            isValidCoordinates(
                userLocation.latitude,
                userLocation.longitude
            )
        ) {
            const origin =
                `${userLocation.latitude},${userLocation.longitude}`;

            url +=
                `&origin=${encodeURIComponent(
                    origin
                )}`;
        }

        window.open(
            url,
            "_blank",
            "noopener,noreferrer"
        );
    }

    /* =====================================================
       RENDER
    ====================================================== */

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
                    routeCoordinates={
                        routeCoordinates
                    }
                />

                {/* =================================================
                    USER
                ================================================== */}

                {userLocation &&
                    isValidCoordinates(
                        userLocation.latitude,
                        userLocation.longitude
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
                            zIndexOffset={
                                1000
                            }
                        >
                            <Popup>
                                <strong>
                                    You are here
                                </strong>
                            </Popup>
                        </Marker>
                    )}

                {/* =================================================
                    ROUTE CASING

                    Thick dark casing makes the road route
                    visible even on bright map tiles.
                ================================================== */}

                {routeCoordinates.length >
                    1 && (
                        <>
                            <Polyline
                                positions={
                                    routeCoordinates
                                }
                                pathOptions={{
                                    color:
                                        "#111827",

                                    weight:
                                        11,

                                    opacity:
                                        0.85,

                                    lineCap:
                                        "round",

                                    lineJoin:
                                        "round",
                                }}
                                interactive={
                                    false
                                }
                            />

                            <Polyline
                                positions={
                                    routeCoordinates
                                }
                                pathOptions={{
                                    color:
                                        "#f97316",

                                    weight:
                                        7,

                                    opacity:
                                        1,

                                    lineCap:
                                        "round",

                                    lineJoin:
                                        "round",
                                }}
                                interactive={
                                    false
                                }
                            />
                        </>
                    )}

                {/* =================================================
                    PLACE MARKERS
                ================================================== */}

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
                                spot?.distanceKm
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

                        const isSelected =
                            selectedSpot?.id ===
                            spot.id;

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
                                zIndexOffset={
                                    isSelected
                                        ? 1000
                                        : 0
                                }
                            >
                                <Popup>
                                    <div
                                        style={{
                                            minWidth:
                                                "220px",
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
                                                    {Math.round(
                                                        matchScore
                                                    )}
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
                                                    setSelectedSpot(
                                                        spot
                                                    );

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
                                                    calculateRoute(
                                                        spot
                                                    )
                                                }
                                                disabled={
                                                    routeLoading &&
                                                    isSelected
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

                                                    fontWeight:
                                                        700,
                                                }}
                                            >
                                                <Navigation
                                                    size={
                                                        14
                                                    }
                                                    style={{
                                                        verticalAlign:
                                                            "middle",

                                                        marginRight:
                                                            "4px",
                                                    }}
                                                />

                                                {routeLoading &&
                                                    isSelected
                                                    ? "Calculating..."
                                                    : "Route here"}
                                            </button>
                                        </div>

                                        {isSelected &&
                                            routeInfo && (
                                                <div
                                                    style={{
                                                        marginTop:
                                                            "10px",

                                                        paddingTop:
                                                            "10px",

                                                        borderTop:
                                                            "1px solid rgba(0,0,0,0.08)",

                                                        fontSize:
                                                            "12px",
                                                    }}
                                                >
                                                    <strong>
                                                        Road route
                                                    </strong>

                                                    <div>
                                                        📏{" "}
                                                        {formatDistance(
                                                            routeInfo.distanceKm
                                                        )}
                                                    </div>

                                                    <div>
                                                        ⏱️{" "}
                                                        {formatDuration(
                                                            routeInfo.durationMinutes
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                        {isSelected &&
                                            routeError && (
                                                <div
                                                    style={{
                                                        marginTop:
                                                            "10px",

                                                        fontSize:
                                                            "12px",

                                                        lineHeight:
                                                            1.4,
                                                    }}
                                                >
                                                    {routeError}
                                                </div>
                                            )}

                                        <button
                                            type="button"
                                            onClick={() =>
                                                openGoogleMaps(
                                                    spot
                                                )
                                            }
                                            style={{
                                                width:
                                                    "100%",

                                                marginTop:
                                                    "9px",

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
                                            🧭 Open in Google Maps
                                        </button>
                                    </div>
                                </Popup>
                            </Marker>
                        );
                    }
                )}
            </MapContainer>

            {/* =================================================
                ROUTE INFORMATION
            ================================================== */}

            {selectedSpot && (
                <div
                    style={{
                        position:
                            "absolute",

                        top:
                            "14px",

                        left:
                            "14px",

                        right:
                            "14px",

                        zIndex:
                            1000,

                        maxWidth:
                            "380px",

                        background:
                            "rgba(255,255,255,0.97)",

                        backdropFilter:
                            "blur(12px)",

                        borderRadius:
                            "16px",

                        padding:
                            "13px 15px",

                        boxShadow:
                            "0 10px 30px rgba(0,0,0,0.16)",
                    }}
                >
                    <div
                        style={{
                            display:
                                "flex",

                            alignItems:
                                "center",

                            justifyContent:
                                "space-between",

                            gap:
                                "10px",
                        }}
                    >
                        <div
                            style={{
                                minWidth:
                                    0,
                            }}
                        >
                            <div
                                style={{
                                    fontSize:
                                        "11px",

                                    textTransform:
                                        "uppercase",

                                    letterSpacing:
                                        "0.08em",

                                    opacity:
                                        0.6,

                                    marginBottom:
                                        "3px",
                                }}
                            >
                                <Route
                                    size={
                                        13
                                    }
                                    style={{
                                        verticalAlign:
                                            "middle",

                                        marginRight:
                                            "4px",
                                    }}
                                />

                                Road route
                            </div>

                            <strong
                                style={{
                                    display:
                                        "block",

                                    overflow:
                                        "hidden",

                                    textOverflow:
                                        "ellipsis",

                                    whiteSpace:
                                        "nowrap",
                                }}
                            >
                                {
                                    selectedSpot.name
                                }
                            </strong>
                        </div>

                        <button
                            type="button"
                            onClick={
                                clearRoute
                            }
                            aria-label="Close route"
                            style={{
                                border:
                                    "none",

                                background:
                                    "transparent",

                                cursor:
                                    "pointer",

                                padding:
                                    "5px",
                            }}
                        >
                            <X
                                size={
                                    18
                                }
                            />
                        </button>
                    </div>

                    {routeLoading && (
                        <div
                            style={{
                                marginTop:
                                    "9px",

                                fontSize:
                                    "12px",
                            }}
                        >
                            🛣️ Finding the best road route...
                        </div>
                    )}

                    {!routeLoading &&
                        routeInfo && (
                            <div
                                style={{
                                    display:
                                        "flex",

                                    gap:
                                        "20px",

                                    marginTop:
                                        "10px",

                                    fontSize:
                                        "12px",
                                }}
                            >
                                <div>
                                    <div
                                        style={{
                                            opacity:
                                                0.6,
                                        }}
                                    >
                                        Distance
                                    </div>

                                    <strong>
                                        {formatDistance(
                                            routeInfo.distanceKm
                                        )}
                                    </strong>
                                </div>

                                <div>
                                    <div
                                        style={{
                                            opacity:
                                                0.6,
                                        }}
                                    >
                                        <Clock3
                                            size={
                                                12
                                            }
                                            style={{
                                                verticalAlign:
                                                    "middle",

                                                marginRight:
                                                    "3px",
                                            }}
                                        />

                                        ETA
                                    </div>

                                    <strong>
                                        {formatDuration(
                                            routeInfo.durationMinutes
                                        )}
                                    </strong>
                                </div>
                            </div>
                        )}

                    {!routeLoading &&
                        routeError && (
                            <div
                                style={{
                                    marginTop:
                                        "9px",

                                    fontSize:
                                        "12px",

                                    lineHeight:
                                        1.4,
                                }}
                            >
                                {routeError}
                            </div>
                        )}
                </div>
            )}

            {/* =================================================
                LEGEND
            ================================================== */}

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