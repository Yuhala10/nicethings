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
        "nt-user-location-marker",

    html: `
        <div
            style="
                width:18px;
                height:18px;
                border-radius:50%;
                background:#f97316;
                border:4px solid white;
                box-shadow:0 2px 10px rgba(0,0,0,.35);
            "
        ></div>
    `,

    iconSize: [
        18,
        18,
    ],

    iconAnchor: [
        9,
        9,
    ],
});

/* =========================================================
   HELPERS
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

function formatDistance(
    distanceKm
) {
    const value =
        Number(
            distanceKm
        );

    if (
        !Number.isFinite(
            value
        ) ||
        value < 0
    ) {
        return "—";
    }

    if (
        value < 1
    ) {
        return `${Math.round(
            value * 1000
        )} m`;
    }

    return `${value.toFixed(
        1
    )} km`;
}

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
        return "—";
    }

    if (
        value < 60
    ) {
        return `${Math.round(
            value
        )} min`;
    }

    const hours =
        Math.floor(
            value / 60
        );

    const remaining =
        Math.round(
            value % 60
        );

    if (
        remaining ===
        0
    ) {
        return `${hours} h`;
    }

    return `${hours} h ${remaining} min`;
}

/* =========================================================
   MAP AUTO FIT
========================================================= */

function RouteFitBounds({
    coordinates,
}) {
    const map =
        useMap();

    useEffect(() => {
        if (
            !map ||
            !Array.isArray(
                coordinates
            ) ||
            coordinates.length <
            2
        ) {
            return;
        }

        const bounds =
            L.latLngBounds(
                coordinates
            );

        if (
            !bounds.isValid()
        ) {
            return;
        }

        map.fitBounds(
            bounds,
            {
                padding: [
                    45,
                    45,
                ],

                maxZoom:
                    17,

                animate:
                    true,
            }
        );
    }, [
        map,
        coordinates,
    ]);

    return null;
}

/* =========================================================
   FOLLOW USER
========================================================= */

function FollowUser({
    userLocation,
    enabled,
}) {
    const map =
        useMap();

    useEffect(() => {
        if (
            !enabled ||
            !userLocation ||
            !isValidCoordinates(
                userLocation.latitude,
                userLocation.longitude
            )
        ) {
            return;
        }

        map.setView(
            [
                Number(
                    userLocation.latitude
                ),
                Number(
                    userLocation.longitude
                ),
            ],
            map.getZoom() <
                15
                ? 15
                : map.getZoom(),
            {
                animate:
                    true,
            }
        );
    }, [
        enabled,
        userLocation?.latitude,
        userLocation?.longitude,
        map,
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

    /*
     * Destination selected from results.js.
     *
     * When View on map is pressed, ResultsPage passes
     * the selected place here.
     */
    selectedSpot:
    externalSelectedSpot = null,
}) {
    const [
        selectedSpot,
        setSelectedSpot,
    ] = useState(
        null
    );

    const [
        routeCoordinates,
        setRouteCoordinates,
    ] = useState(
        []
    );

    const [
        routeInfo,
        setRouteInfo,
    ] = useState(
        null
    );

    const [
        routeLoading,
        setRouteLoading,
    ] = useState(
        false
    );

    const [
        routeError,
        setRouteError,
    ] = useState(
        ""
    );

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
                data.geometry
                    .coordinates
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
       EXTERNAL SELECTED SPOT

       ResultsPage selects a place through
       "View on map".

       The route is then calculated automatically.
    ====================================================== */

    useEffect(() => {
        if (
            !externalSelectedSpot
        ) {
            return;
        }

        if (
            !userLocation
        ) {
            setSelectedSpot(
                externalSelectedSpot
            );

            setRouteError(
                "Your current location is required to calculate a road route."
            );

            return;
        }

        if (
            selectedSpot?.id ===
            externalSelectedSpot?.id &&
            routeCoordinates.length >
            1
        ) {
            return;
        }

        setSelectedSpot(
            externalSelectedSpot
        );

        calculateRoute(
            externalSelectedSpot
        );

        // calculateRoute is intentionally omitted.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        externalSelectedSpot?.id,
        userLocation?.latitude,
        userLocation?.longitude,
    ]);
    /* =====================================================
       CLEAR ROUTE
    ====================================================== */

    function clearRoute() {
        setRouteCoordinates(
            []
        );

        setRouteInfo(
            null
        );

        setRouteError(
            ""
        );

        setRouteLoading(
            false
        );
    }

    /* =====================================================
       SELECT SPOT
    ====================================================== */

    function handleSelectSpot(
        spot
    ) {
        if (
            !spot
        ) {
            return;
        }

        setSelectedSpot(
            spot
        );

        if (
            typeof onSelectSpot ===
            "function"
        ) {
            onSelectSpot(
                spot
            );
        }

        /*
         * Automatically calculate the road route
         * when a user selects a place directly
         * from the map.
         */
        if (
            userLocation &&
            isValidCoordinates(
                userLocation.latitude,
                userLocation.longitude
            ) &&
            isValidCoordinates(
                spot.latitude,
                spot.longitude
            )
        ) {
            calculateRoute(
                spot
            );
        } else {
            setRouteError(
                "Your current location is required to show the road route."
            );
        }
    }

    /* =====================================================
       FOLLOWING USER / ROUTE REFRESH

       When the user's live GPS moves approximately
       50 metres or more, refresh the road route.

       This keeps the route useful while travelling.
    ====================================================== */

    const [
        lastRoutedLocation,
        setLastRoutedLocation,
    ] = useState(
        null
    );

    function distanceBetweenPoints(
        lat1,
        lon1,
        lat2,
        lon2
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

        const dLon =
            (
                Number(
                    lon2
                ) -
                Number(
                    lon1
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
                dLon / 2
            ) **
            2;

        const c =
            2 *
            Math.atan2(
                Math.sqrt(
                    a
                ),
                Math.sqrt(
                    1 - a
                )
            );

        return (
            earthRadius *
            c
        );
    }

    useEffect(() => {
        if (
            !followUser ||
            !selectedSpot ||
            !userLocation
        ) {
            return;
        }

        if (
            !isValidCoordinates(
                userLocation.latitude,
                userLocation.longitude
            ) ||
            !isValidCoordinates(
                selectedSpot.latitude,
                selectedSpot.longitude
            )
        ) {
            return;
        }

        /*
         * First GPS position while following.
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

            calculateRoute(
                selectedSpot
            );

            return;
        }

        const movedKm =
            distanceBetweenPoints(
                lastRoutedLocation.latitude,
                lastRoutedLocation.longitude,
                userLocation.latitude,
                userLocation.longitude
            );

        /*
         * Recalculate after approximately 50 metres.
         */
        if (
            movedKm >=
            0.05
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

            calculateRoute(
                selectedSpot
            );
        }

        // calculateRoute intentionally omitted.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        followUser,
        selectedSpot?.id,
        userLocation?.latitude,
        userLocation?.longitude,
        lastRoutedLocation,
    ]);

    /* =====================================================
       MAP CENTER
    ====================================================== */

    const mapCenter =
        useMemo(() => {
            if (
                userLocation &&
                isValidCoordinates(
                    userLocation.latitude,
                    userLocation.longitude
                )
            ) {
                return [
                    Number(
                        userLocation.latitude
                    ),

                    Number(
                        userLocation.longitude
                    ),
                ];
            }

            if (
                selectedSpot &&
                isValidCoordinates(
                    selectedSpot.latitude,
                    selectedSpot.longitude
                )
            ) {
                return [
                    Number(
                        selectedSpot.latitude
                    ),

                    Number(
                        selectedSpot.longitude
                    ),
                ];
            }

            if (
                validSpots.length >
                0
            ) {
                return [
                    Number(
                        validSpots[0]
                            .latitude
                    ),

                    Number(
                        validSpots[0]
                            .longitude
                    ),
                ];
            }

            return defaultCenter;
        }, [
            userLocation,
            selectedSpot,
            validSpots,
        ]);

    /* =====================================================
       ROUTE DISPLAY

       Outer dark line makes the route visible against
       any map background.

       Inner orange line makes it immediately obvious
       which road the user should follow.
    ====================================================== */

    const hasRoute =
        Array.isArray(
            routeCoordinates
        ) &&
        routeCoordinates.length >=
        2;

    /* =====================================================
       GOOGLE MAPS FALLBACK
    ====================================================== */

    function openGoogleMaps() {
        if (
            !selectedSpot ||
            !isValidCoordinates(
                selectedSpot.latitude,
                selectedSpot.longitude
            )
        ) {
            return;
        }

        const destination =
            `${Number(
                selectedSpot.latitude
            )},${Number(
                selectedSpot.longitude
            )}`;

        let url;

        if (
            userLocation &&
            isValidCoordinates(
                userLocation.latitude,
                userLocation.longitude
            )
        ) {
            const origin =
                `${Number(
                    userLocation.latitude
                )},${Number(
                    userLocation.longitude
                )}`;

            url =
                `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(
                    origin
                )}&destination=${encodeURIComponent(
                    destination
                )}&travelmode=driving`;
        } else {
            url =
                `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                    destination
                )}&travelmode=driving`;
        }

        window.open(
            url,
            "_blank",
            "noopener,noreferrer"
        );
    }

    /* =====================================================
       MAP UI
    ====================================================== */

    return (
        <div
            className="nt-map-wrapper"
            style={{
                position:
                    "relative",

                width:
                    "100%",

                minHeight:
                    "520px",

                borderRadius:
                    "20px",

                overflow:
                    "hidden",
            }}
        >
            <MapContainer
                center={
                    mapCenter
                }
                zoom={
                    14
                }
                scrollWheelZoom={
                    true
                }
                style={{
                    width:
                        "100%",

                    height:
                        "520px",

                    minHeight:
                        "520px",
                }}
            >
                <TileLayer
                    attribution='&copy; OpenStreetMap contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* =================================================
                   KEEP USER CENTERED WHEN FOLLOWING
                ================================================== */}

                <FollowUser
                    userLocation={
                        userLocation
                    }
                    enabled={
                        followUser
                    }
                />

                {/* =================================================
                   FIT COMPLETE ROAD ROUTE
                ================================================== */}

                {hasRoute && (
                    <RouteFitBounds
                        coordinates={
                            routeCoordinates
                        }
                    />
                )}

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

                                {userLocation.accuracy && (
                                    <div
                                        style={{
                                            marginTop:
                                                "4px",

                                            fontSize:
                                                "12px",
                                        }}
                                    >
                                        Accuracy:
                                        {" "}
                                        ±
                                        {Math.round(
                                            userLocation.accuracy
                                        )}
                                        m
                                    </div>
                                )}
                            </Popup>
                        </Marker>
                    )}

                {/* =================================================
                   PLACE MARKERS
                ================================================== */}

                {validSpots.map(
                    spot => {
                        const isSelected =
                            selectedSpot?.id ===
                            spot.id;

                        return (
                            <Marker
                                key={
                                    spot.id
                                }
                                position={[
                                    Number(
                                        spot.latitude
                                    ),

                                    Number(
                                        spot.longitude
                                    ),
                                ]}
                                icon={
                                    defaultIcon
                                }
                                eventHandlers={{
                                    click:
                                        () =>
                                            handleSelectSpot(
                                                spot
                                            ),
                                }}
                            >
                                <Popup>
                                    <div
                                        style={{
                                            minWidth:
                                                "180px",
                                        }}
                                    >
                                        <strong>
                                            {
                                                spot.name
                                            }
                                        </strong>

                                        {spot.neighborhood && (
                                            <div
                                                style={{
                                                    marginTop:
                                                        "5px",

                                                    fontSize:
                                                        "12px",
                                                }}
                                            >
                                                <MapPin
                                                    size={
                                                        12
                                                    }
                                                />{" "}
                                                {
                                                    spot.neighborhood
                                                }
                                            </div>
                                        )}

                                        {spot.distanceKm !==
                                            undefined &&
                                            spot.distanceKm !==
                                            null && (
                                                <div
                                                    style={{
                                                        marginTop:
                                                            "5px",

                                                        fontSize:
                                                            "12px",
                                                    }}
                                                >
                                                    {
                                                        formatDistance(
                                                            spot.distanceKm
                                                        )
                                                    }
                                                </div>
                                            )}

                                        <button
                                            type="button"
                                            onClick={() =>
                                                handleSelectSpot(
                                                    spot
                                                )
                                            }
                                            style={{
                                                marginTop:
                                                    "10px",

                                                width:
                                                    "100%",

                                                padding:
                                                    "8px 10px",

                                                border:
                                                    "none",

                                                borderRadius:
                                                    "8px",

                                                cursor:
                                                    "pointer",

                                                background:
                                                    "#f97316",

                                                color:
                                                    "white",

                                                fontWeight:
                                                    700,
                                            }}
                                        >
                                            <Route
                                                size={
                                                    14
                                                }
                                            />

                                            {" "}
                                            Route here
                                        </button>
                                    </div>
                                </Popup>
                            </Marker>
                        );
                    }
                )}

                {/* =================================================
                   THICK ROAD ROUTE

                   OUTER:
                   11px dark casing

                   INNER:
                   7px orange route

                   This creates a very visible route that
                   can be followed on the map.
                ================================================== */}

                {hasRoute && (
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
                                    0.95,

                                lineCap:
                                    "round",

                                lineJoin:
                                    "round",
                            }}
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
                        />
                    </>
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
                            "430px",

                        padding:
                            "14px 16px",

                        borderRadius:
                            "16px",

                        background:
                            "rgba(255,255,255,0.96)",

                        boxShadow:
                            "0 6px 25px rgba(0,0,0,0.18)",

                        backdropFilter:
                            "blur(8px)",
                    }}
                >
                    <div
                        style={{
                            display:
                                "flex",

                            alignItems:
                                "flex-start",

                            justifyContent:
                                "space-between",

                            gap:
                                "12px",
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
                                    display:
                                        "flex",

                                    alignItems:
                                        "center",

                                    gap:
                                        "7px",

                                    fontSize:
                                        "0.75rem",

                                    fontWeight:
                                        700,

                                    color:
                                        "#f97316",

                                    textTransform:
                                        "uppercase",

                                    letterSpacing:
                                        "0.04em",
                                }}
                            >
                                <Route
                                    size={
                                        14
                                    }
                                />

                                Destination
                            </div>

                            <div
                                style={{
                                    marginTop:
                                        "4px",

                                    fontSize:
                                        "1rem",

                                    fontWeight:
                                        800,

                                    color:
                                        "#111827",

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
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={
                                clearRoute
                            }
                            aria-label="Clear route"
                            style={{
                                width:
                                    "32px",

                                height:
                                    "32px",

                                flexShrink:
                                    0,

                                display:
                                    "flex",

                                alignItems:
                                    "center",

                                justifyContent:
                                    "center",

                                border:
                                    "none",

                                borderRadius:
                                    "50%",

                                background:
                                    "#f3f4f6",

                                color:
                                    "#374151",

                                cursor:
                                    "pointer",
                            }}
                        >
                            <X
                                size={
                                    17
                                }
                            />
                        </button>
                    </div>

                    {/* =================================================
                       ROUTE LOADING
                    ================================================== */}

                    {routeLoading && (
                        <div
                            style={{
                                marginTop:
                                    "10px",

                                display:
                                    "flex",

                                alignItems:
                                    "center",

                                gap:
                                    "8px",

                                fontSize:
                                    "0.82rem",

                                color:
                                    "#4b5563",
                            }}
                        >
                            <span
                                style={{
                                    width:
                                        "15px",

                                    height:
                                        "15px",

                                    border:
                                        "2px solid #d1d5db",

                                    borderTopColor:
                                        "#f97316",

                                    borderRadius:
                                        "50%",

                                    display:
                                        "inline-block",

                                    animation:
                                        "ntMapSpin 0.8s linear infinite",
                                }}
                            />

                            Calculating road route...
                        </div>
                    )}

                    {/* =================================================
                       ROUTE INFORMATION
                    ================================================== */}

                    {!routeLoading &&
                        hasRoute &&
                        routeInfo && (
                            <div
                                style={{
                                    display:
                                        "flex",

                                    alignItems:
                                        "center",

                                    gap:
                                        "8px",

                                    flexWrap:
                                        "wrap",

                                    marginTop:
                                        "10px",
                                }}
                            >
                                <div
                                    style={{
                                        display:
                                            "flex",

                                        alignItems:
                                            "center",

                                        gap:
                                            "5px",

                                        padding:
                                            "7px 9px",

                                        borderRadius:
                                            "9px",

                                        background:
                                            "#fff7ed",

                                        color:
                                            "#9a3412",

                                        fontSize:
                                            "0.78rem",

                                        fontWeight:
                                            700,
                                    }}
                                >
                                    <Navigation
                                        size={
                                            14
                                        }
                                    />

                                    {formatDistance(
                                        routeInfo.distanceKm
                                    )}
                                </div>

                                <div
                                    style={{
                                        display:
                                            "flex",

                                        alignItems:
                                            "center",

                                        gap:
                                            "5px",

                                        padding:
                                            "7px 9px",

                                        borderRadius:
                                            "9px",

                                        background:
                                            "#fff7ed",

                                        color:
                                            "#9a3412",

                                        fontSize:
                                            "0.78rem",

                                        fontWeight:
                                            700,
                                    }}
                                >
                                    <Clock3
                                        size={
                                            14
                                        }
                                    />

                                    {formatDuration(
                                        routeInfo.durationMinutes
                                    )}
                                </div>

                                <span
                                    style={{
                                        fontSize:
                                            "0.74rem",

                                        color:
                                            "#6b7280",
                                    }}
                                >
                                    Follow the orange road
                                </span>
                            </div>
                        )}

                    {/* =================================================
                       ROUTE ERROR
                    ================================================== */}

                    {!routeLoading &&
                        routeError && (
                            <div
                                style={{
                                    marginTop:
                                        "10px",

                                    padding:
                                        "9px 10px",

                                    borderRadius:
                                        "9px",

                                    background:
                                        "#fef2f2",

                                    color:
                                        "#991b1b",

                                    fontSize:
                                        "0.78rem",

                                    lineHeight:
                                        1.4,
                                }}
                            >
                                {
                                    routeError
                                }
                            </div>
                        )}

                    {/* =================================================
                       GOOGLE MAPS BUTTON
                    ================================================== */}

                    {selectedSpot && (
                        <button
                            type="button"
                            onClick={
                                openGoogleMaps
                            }
                            style={{
                                marginTop:
                                    "10px",

                                width:
                                    "100%",

                                display:
                                    "flex",

                                alignItems:
                                    "center",

                                justifyContent:
                                    "center",

                                gap:
                                    "7px",

                                padding:
                                    "9px 12px",

                                border:
                                    "1px solid #e5e7eb",

                                borderRadius:
                                    "10px",

                                background:
                                    "white",

                                color:
                                    "#111827",

                                fontWeight:
                                    700,

                                fontSize:
                                    "0.8rem",

                                cursor:
                                    "pointer",
                            }}
                        >
                            <Navigation
                                size={
                                    15
                                }
                            />

                            Open directions in Google Maps
                        </button>
                    )}
                </div>
            )}

            {/* =================================================
               MAP LEGEND
            ================================================== */}

            <div
                style={{
                    position:
                        "absolute",

                    bottom:
                        "18px",

                    left:
                        "18px",

                    zIndex:
                        999,

                    padding:
                        "9px 11px",

                    borderRadius:
                        "10px",

                    background:
                        "rgba(255,255,255,0.94)",

                    boxShadow:
                        "0 3px 12px rgba(0,0,0,0.15)",

                    fontSize:
                        "0.72rem",
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
                    <span
                        style={{
                            width:
                                "24px",

                            height:
                                "7px",

                            borderRadius:
                                "20px",

                            background:
                                "#f97316",

                            display:
                                "inline-block",
                        }}
                    />

                    <span>
                        Route
                    </span>
                </div>

                {userLocation && (
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
                        <span
                            style={{
                                width:
                                    "12px",

                                height:
                                    "12px",

                                borderRadius:
                                    "50%",

                                background:
                                    "#f97316",

                                border:
                                    "2px solid white",

                                boxShadow:
                                    "0 1px 4px rgba(0,0,0,.3)",

                                display:
                                    "inline-block",
                            }}
                        />

                        <span>
                            Your location
                        </span>
                    </div>
                )}
            </div>

            {/* =================================================
               SPINNING ANIMATION
            ================================================== */}

            <style jsx>{`
                @keyframes ntMapSpin {
                    from {
                        transform: rotate(0deg);
                    }

                    to {
                        transform: rotate(360deg);
                    }
                }
            `}</style>
        </div>
    );
}