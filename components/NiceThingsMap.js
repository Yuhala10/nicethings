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
   PLACE MARKER
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
   USER LOCATION ICON
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

/* =========================================================
   DISTANCE DISPLAY
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
   TIME DISPLAY
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
        Math.round(
            value
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

    /* -------------------------------------------------------
       FOLLOW USER
    ------------------------------------------------------- */

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
            !isValidCoordinates(
                latitude,
                longitude
            )
        ) {
            return;
        }

        /*
         * Keep the map centered on the
         * moving user.
         */

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

    /* -------------------------------------------------------
       ROUTE FITTING
    ------------------------------------------------------- */

    useEffect(() => {
        if (
            !routeCoordinates ||
            routeCoordinates.length <
            2
        ) {
            return;
        }

        /*
         * When a route is created,
         * show the entire route.
         */

        const bounds =
            L.latLngBounds(
                routeCoordinates
            );

        map.fitBounds(
            bounds,
            {
                padding: [
                    70,
                    70,
                ],

                maxZoom: 17,

                animate:
                    true,
            }
        );
    }, [
        map,
        routeCoordinates,
    ]);

    /* -------------------------------------------------------
       NORMAL MAP FIT
    ------------------------------------------------------- */

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
       CALCULATE ROUTE
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

        setRouteCoordinates(
            []
        );

        setRouteInfo(
            null
        );

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
                    `/api/route?${params.toString()}`
                );

            const data =
                await response.json();

            if (
                !response.ok ||
                !data?.success ||
                !data?.geometry
                    ?.coordinates
            ) {
                throw new Error(
                    data?.error ||
                    "Unable to calculate route."
                );
            }

            /*
             * GeoJSON uses:
             *
             * [longitude, latitude]
             *
             * Leaflet requires:
             *
             * [latitude, longitude]
             */

            const coordinates =
                data.geometry.coordinates.map(
                    coordinate => [
                        Number(
                            coordinate[1]
                        ),

                        Number(
                            coordinate[0]
                        ),
                    ]
                );

            setRouteCoordinates(
                coordinates
            );

            setRouteInfo({
                distanceKm:
                    data.distanceKm,

                distanceMeters:
                    data.distanceMeters,

                durationMinutes:
                    data.durationMinutes,

                durationSeconds:
                    data.durationSeconds,
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
       RE-CALCULATE ROUTE WHEN USER MOVES
    ====================================================== */

    useEffect(() => {
        if (
            !selectedSpot ||
            !userLocation
        ) {
            return;
        }

        /*
         * We intentionally don't recalculate
         * on every tiny GPS movement.
         *
         * This prevents excessive routing
         * requests and gives the map smoother
         * behavior.
         */

        const timeout =
            setTimeout(
                () => {
                    calculateRoute(
                        selectedSpot
                    );
                },
                1500
            );

        return () =>
            clearTimeout(
                timeout
            );

        /*
         * We only react to the actual latitude
         * and longitude changing.
         */

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        userLocation?.latitude,
        userLocation?.longitude,
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

        /*
         * If we have the user's current
         * position, explicitly provide it
         * as the origin.
         */

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
                    USER LOCATION
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
                        >
                            <Popup>
                                <strong>
                                    You are here
                                </strong>
                            </Popup>
                        </Marker>
                    )}

                {/* =================================================
                    ROUTE
                ================================================== */}

                {routeCoordinates.length >
                    1 && (
                        <Polyline
                            positions={
                                routeCoordinates
                            }
                            pathOptions={{
                                weight:
                                    6,

                                opacity:
                                    0.9,

                                lineCap:
                                    "round",

                                lineJoin:
                                    "round",
                            }}
                        />
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
                                                        Route
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
                ROUTE INFORMATION PANEL
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
                            "rgba(255,255,255,0.96)",

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

                                Route to
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
                            🛣️ Calculating the
                            best road route...
                        </div>
                    )}

                    {!routeLoading &&
                        routeInfo && (
                            <div
                                style={{
                                    display:
                                        "flex",

                                    gap:
                                        "16px",

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