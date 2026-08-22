import { useEffect, useState } from "react";
import {
    ArrowLeft,
    CheckCircle2,
    MapPin,
    RefreshCw,
    ShieldCheck,
    XCircle,
} from "lucide-react";

export default function AdminSpots() {
    const [spots, setSpots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        load();
    }, []);

    async function load() {
        try {
            const auth = await fetch(
                "/api/admin/me",
                {
                    credentials: "include",
                }
            );

            const authData =
                await auth.json();

            if (!authData.authenticated) {
                window.location.href =
                    "/admin/login";
                return;
            }

            const response =
                await fetch(
                    "/api/admin/spots",
                    {
                        credentials:
                            "include",
                    }
                );

            const data =
                await response.json();

            if (!response.ok) {
                throw new Error(
                    data.error ||
                    "Unable to load spots."
                );
            }

            setSpots(
                data.spots || []
            );
        } catch (error) {
            console.error(error);
            setError(
                error.message ||
                "Unable to load spots."
            );
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <AdminShell>
                <Loading />
            </AdminShell>
        );
    }

    return (
        <AdminShell>
            <section className="nt-admin-section">
                <div className="nt-admin-section-header">
                    <div>
                        <div className="nt-admin-section-kicker">
                            DISCOVERY DATABASE
                        </div>

                        <h2>
                            Spots
                        </h2>

                        <p>
                            Manage places
                            available to NiceThings
                            visitors.
                        </p>
                    </div>

                    <button
                        className="nt-admin-icon-button"
                        onClick={load}
                        type="button"
                    >
                        <RefreshCw size={17} />
                    </button>
                </div>

                {error && (
                    <div className="nt-admin-error">
                        {error}
                    </div>
                )}

                {spots.length === 0 ? (
                    <div className="nt-admin-empty">
                        <MapPin size={28} />

                        <h3>
                            No spots yet
                        </h3>

                        <p>
                            Approved places
                            will appear here.
                        </p>
                    </div>
                ) : (
                    <div className="nt-admin-payment-list">
                        {spots.map(
                            (spot) => (
                                <SpotRow
                                    key={
                                        spot.id
                                    }
                                    spot={spot}
                                />
                            )
                        )}
                    </div>
                )}
            </section>
        </AdminShell>
    );
}

function SpotRow({
    spot,
}) {
    return (
        <article className="nt-admin-payment">
            <div className="nt-admin-payment-top">
                <div>
                    <div className="nt-admin-payment-amount">
                        {spot.name}
                    </div>

                    <div className="nt-admin-payment-meta">
                        {spot.address ||
                            spot.neighborhood ||
                            spot.city ||
                            "Location not provided"}
                    </div>
                </div>

                <span
                    className={`nt-admin-status ${String(
                        spot.status || ""
                    ).toLowerCase()}`}
                >
                    {spot.status}
                </span>
            </div>

            <div className="nt-admin-payment-info">
                <div>
                    <span>
                        Category
                    </span>

                    <strong>
                        {spot.category ||
                            "—"}
                    </strong>
                </div>

                <div>
                    <span>
                        Price
                    </span>

                    <strong>
                        {spot.minimum_price !=
                            null &&
                            spot.maximum_price !=
                            null
                            ? `${spot.minimum_price}–${spot.maximum_price} FCFA`
                            : "Not verified"}
                    </strong>
                </div>

                <div>
                    <span>
                        Rating
                    </span>

                    <strong>
                        ⭐{" "}
                        {spot.rating ??
                            "0"}
                    </strong>
                </div>
            </div>

            {spot.latitude != null &&
                spot.longitude != null && (
                    <div className="nt-admin-proof">
                        <MapPin size={16} />

                        {spot.latitude},{" "}
                        {spot.longitude}
                    </div>
                )}

            {spot.verified && (
                <div className="nt-admin-proof">
                    <CheckCircle2 size={16} />
                    NiceThings verified
                </div>
            )}
        </article>
    );
}

function AdminShell({
    children,
}) {
    return (
        <main className="nt-admin-page">
            <header className="nt-admin-header">
                <div>
                    <div className="nt-admin-eyebrow">
                        <ShieldCheck size={13} />
                        NiceThings Control
                    </div>

                    <h1>
                        Spots
                    </h1>

                    <p>
                        Discovery database
                        management.
                    </p>
                </div>

                <button
                    type="button"
                    className="nt-admin-logout"
                    onClick={() =>
                    (window.location.href =
                        "/admin")
                    }
                >
                    <ArrowLeft size={16} />
                    Dashboard
                </button>
            </header>

            {children}
        </main>
    );
}

function Loading() {
    return (
        <div className="nt-admin-loading">
            <RefreshCw
                size={28}
                className="nt-spin"
            />

            <p>
                Loading spots...
            </p>
        </div>
    );
}