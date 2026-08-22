import { useEffect, useState } from "react";
import {
    CheckCircle2,
    Clock3,
    CreditCard,
    LogOut,
    MapPin,
    RefreshCw,
    ShieldCheck,
    Sparkles,
    Users,
    XCircle,
} from "lucide-react";

export default function AdminDashboard() {
    const [loading, setLoading] =
        useState(true);

    const [payments, setPayments] =
        useState([]);

    const [error, setError] =
        useState("");

    const [actionLoading, setActionLoading] =
        useState("");

    useEffect(() => {
        initialise();
    }, []);

    async function initialise() {
        try {
            const response =
                await fetch(
                    "/api/admin/me",
                    {
                        credentials:
                            "include",
                    }
                );

            const session =
                await response.json();

            if (
                !session.authenticated
            ) {
                window.location.href =
                    "/admin/login";

                return;
            }

            await loadPayments();
        } catch (error) {
            console.error(
                error
            );

            setError(
                "Unable to load the administrator dashboard."
            );
        } finally {
            setLoading(false);
        }
    }

    async function loadPayments() {
        setError("");

        const response =
            await fetch(
                "/api/admin/payments",
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
                "Unable to load payments."
            );
        }

        setPayments(
            data.payments || []
        );
    }

    async function reviewPayment(
        payment,
        decision,
        adminNote = null
    ) {
        setActionLoading(
            payment.id
        );

        try {
            const response =
                await fetch(
                    "/api/admin/payments",
                    {
                        method: "POST",

                        credentials:
                            "include",

                        headers: {
                            "Content-Type":
                                "application/json",
                        },

                        body: JSON.stringify({
                            paymentId:
                                payment.id,

                            decision,

                            adminNote,
                        }),
                    }
                );

            const data =
                await response.json();

            if (!response.ok) {
                throw new Error(
                    data.error ||
                    `Unable to ${decision ===
                        "APPROVE"
                        ? "approve"
                        : "reject"
                    } payment.`
                );
            }

            await loadPayments();

            return data;
        } catch (error) {
            console.error(
                error
            );

            alert(
                error.message
            );

            throw error;
        } finally {
            setActionLoading(
                ""
            );
        }
    }

    async function handleApprove(
        payment
    ) {
        const confirmed =
            window.confirm(
                "Approve this 100 FCFA payment and activate 24-hour access?"
            );

        if (!confirmed) {
            return;
        }

        await reviewPayment(
            payment,
            "APPROVE"
        );
    }

    async function handleReject(
        payment
    ) {
        const note =
            window.prompt(
                "Optional reason for rejection:"
            );

        if (
            note === null
        ) {
            return;
        }

        await reviewPayment(
            payment,
            "REJECT",
            note.trim() ||
            null
        );
    }

    async function handleLogout() {
        try {
            await fetch(
                "/api/admin/logout",
                {
                    method: "POST",

                    credentials:
                        "include",
                }
            );
        } finally {
            window.location.href =
                "/admin/login";
        }
    }

    const pending =
        payments.filter(
            (payment) =>
                payment.status ===
                "PENDING"
        );

    const approved =
        payments.filter(
            (payment) =>
                payment.status ===
                "APPROVED"
        );

    const rejected =
        payments.filter(
            (payment) =>
                payment.status ===
                "REJECTED"
        );

    const revenue =
        approved.reduce(
            (total, payment) =>
                total +
                Number(
                    payment.amount ||
                    0
                ),
            0
        );

    if (loading) {
        return (
            <main className="nt-admin-page">
                <div className="nt-admin-loading">
                    <Sparkles
                        size={28}
                    />

                    <p>
                        Loading NiceThings
                        Control...
                    </p>
                </div>
            </main>
        );
    }

    return (
        <main className="nt-admin-page">

            <header className="nt-admin-header">

                <div>
                    <div className="nt-admin-eyebrow">
                        <ShieldCheck
                            size={13}
                        />

                        NiceThings Control
                    </div>

                    <h1>
                        Good to see you.
                    </h1>

                    <p>
                        Manage payments,
                        access and discovery
                        activity.
                    </p>
                </div>

                <div className="nt-admin-header-actions">

                    <button
                        type="button"
                        className="nt-admin-icon-button"
                        onClick={
                            loadPayments
                        }
                        title="Refresh"
                    >
                        <RefreshCw
                            size={17}
                        />
                    </button>

                    <button
                        type="button"
                        className="nt-admin-logout"
                        onClick={
                            handleLogout
                        }
                    >
                        <LogOut
                            size={16}
                        />

                        Logout
                    </button>

                </div>

            </header>

            <section className="nt-admin-stats">

                <StatCard
                    icon={
                        <Clock3
                            size={19}
                        />
                    }
                    label="Pending"
                    value={
                        pending.length
                    }
                />

                <StatCard
                    icon={
                        <CheckCircle2
                            size={19}
                        />
                    }
                    label="Approved"
                    value={
                        approved.length
                    }
                />

                <StatCard
                    icon={
                        <XCircle
                            size={19}
                        />
                    }
                    label="Rejected"
                    value={
                        rejected.length
                    }
                />

                <StatCard
                    icon={
                        <CreditCard
                            size={19}
                        />
                    }
                    label="Revenue"
                    value={`${revenue} FCFA`}
                />

            </section>

            <section className="nt-admin-section">

                <div className="nt-admin-section-header">

                    <div>

                        <div className="nt-admin-section-kicker">
                            PAYMENT QUEUE
                        </div>

                        <h2>
                            Access requests
                        </h2>

                        <p>
                            Verify 100 FCFA
                            payments before
                            activating 24-hour
                            discovery access.
                        </p>

                    </div>

                    <div className="nt-admin-pending-pill">
                        <span />

                        {pending.length}{" "}
                        pending
                    </div>

                </div>

                {error && (
                    <div className="nt-admin-error">
                        {error}
                    </div>
                )}

                {pending.length ===
                    0 ? (
                    <div className="nt-admin-empty">

                        <CheckCircle2
                            size={27}
                        />

                        <h3>
                            Everything is
                            clear.
                        </h3>

                        <p>
                            There are no
                            pending payment
                            requests right
                            now.
                        </p>

                    </div>
                ) : (
                    <div className="nt-admin-payment-list">

                        {pending.map(
                            (
                                payment
                            ) => (
                                <PaymentRow
                                    key={
                                        payment.id
                                    }
                                    payment={
                                        payment
                                    }
                                    loading={
                                        actionLoading ===
                                        payment.id
                                    }
                                    onApprove={() =>
                                        handleApprove(
                                            payment
                                        )
                                    }
                                    onReject={() =>
                                        handleReject(
                                            payment
                                        )
                                    }
                                />
                            )
                        )}

                    </div>
                )}

            </section>

            <section className="nt-admin-section">

                <div className="nt-admin-section-header">

                    <div>

                        <div className="nt-admin-section-kicker">
                            PLATFORM
                        </div>

                        <h2>
                            NiceThings snapshot
                        </h2>

                    </div>

                </div>

                <div className="nt-admin-snapshot-grid">

                    <Snapshot
                        icon={
                            <Users
                                size={19}
                            />
                        }
                        title="Visitors"
                        text="Anonymous discovery sessions are connected to every access pass and search."
                    />

                    <Snapshot
                        icon={
                            <MapPin
                                size={19}
                            />
                        }
                        title="Spots"
                        text="Approved places are available to the discovery engine."
                    />

                    <Snapshot
                        icon={
                            <Sparkles
                                size={19}
                            />
                        }
                        title="Discoveries"
                        text="Searches, selections and arrivals form the NiceThings discovery data."
                    />

                </div>

            </section>

            <footer className="nt-admin-footer">
                NiceThings Control • Secure
                administrator environment
            </footer>

        </main>
    );
}

function StatCard({
    icon,
    label,
    value,
}) {
    return (
        <div className="nt-admin-stat">

            <div className="nt-admin-stat-icon">
                {icon}
            </div>

            <div>

                <span>
                    {label}
                </span>

                <strong>
                    {value}
                </strong>

            </div>

        </div>
    );
}

function PaymentRow({
    payment,
    loading,
    onApprove,
    onReject,
}) {
    const [showProof, setShowProof] =
        useState(false);

    return (
        <article className="nt-admin-payment">

            <div className="nt-admin-payment-top">

                <div>

                    <div className="nt-admin-payment-amount">
                        {payment.amount}{" "}
                        {payment.currency}
                    </div>

                    <div className="nt-admin-payment-meta">
                        {new Date(
                            payment.created_at
                        ).toLocaleString()}
                    </div>

                </div>

                <span
                    className={`nt-admin-status ${String(
                        payment.status ||
                        ""
                    ).toLowerCase()}`}
                >
                    {payment.status}
                </span>

            </div>

            <div className="nt-admin-payment-info">

                <div>

                    <span>
                        Visitor
                    </span>

                    <strong>
                        {payment.visitor_id}
                    </strong>

                </div>

                <div>

                    <span>
                        Payment ID
                    </span>

                    <strong>
                        {payment.id}
                    </strong>

                </div>

            </div>

            {payment.proofUrl ? (
                <>
                    <button
                        type="button"
                        className="nt-admin-proof"
                        onClick={() =>
                            setShowProof(
                                (value) =>
                                    !value
                            )
                        }
                    >
                        <ShieldCheck
                            size={16}
                        />

                        <span>
                            {showProof
                                ? "Hide payment proof"
                                : "View payment proof"}
                        </span>
                    </button>

                    {showProof && (
                        <div className="nt-admin-proof-viewer">
                            <img
                                src={
                                    payment.proofUrl
                                }
                                alt="Payment proof"
                            />
                        </div>
                    )}
                </>
            ) : (
                <div className="nt-admin-proof missing">

                    <Clock3
                        size={16}
                    />

                    <span>
                        Payment proof not
                        uploaded yet
                    </span>

                </div>
            )}

            {payment.admin_note && (
                <div className="nt-admin-note">

                    <strong>
                        Admin note
                    </strong>

                    <p>
                        {
                            payment.admin_note
                        }
                    </p>

                </div>
            )}

            {payment.status ===
                "PENDING" && (
                    <div className="nt-admin-payment-actions">

                        <button
                            type="button"
                            className="nt-admin-reject"
                            disabled={
                                loading
                            }
                            onClick={
                                onReject
                            }
                        >
                            <XCircle
                                size={16}
                            />

                            Reject
                        </button>

                        <button
                            type="button"
                            className="nt-admin-approve"
                            disabled={
                                loading ||
                                !payment.proofUrl
                            }
                            onClick={
                                onApprove
                            }
                        >
                            {loading ? (
                                <RefreshCw
                                    size={16}
                                    className="nt-spin"
                                />
                            ) : (
                                <CheckCircle2
                                    size={16}
                                />
                            )}

                            {loading
                                ? "Processing..."
                                : "Approve & activate"}
                        </button>

                    </div>
                )}

        </article>
    );
}

function Snapshot({
    icon,
    title,
    text,
}) {
    return (
        <div className="nt-admin-snapshot">

            <div className="nt-admin-stat-icon">
                {icon}
            </div>

            <h3>
                {title}
            </h3>

            <p>
                {text}
            </p>

        </div>
    );
}