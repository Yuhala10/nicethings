import { useEffect, useState } from "react";
import {
    ArrowLeft,
    CheckCircle2,
    Clock3,
    CreditCard,
    RefreshCw,
    ShieldCheck,
    XCircle,
} from "lucide-react";

export default function AdminPayments() {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        checkAuthAndLoad();
    }, []);

    async function checkAuthAndLoad() {
        try {
            const authResponse = await fetch(
                "/api/admin/me",
                {
                    credentials: "include",
                }
            );

            const auth = await authResponse.json();

            if (!auth.authenticated) {
                window.location.href = "/admin/login";
                return;
            }

            await loadPayments();
        } catch (error) {
            console.error(error);
            setError("Unable to load payments.");
        } finally {
            setLoading(false);
        }
    }

    async function loadPayments() {
        const response = await fetch(
            "/api/admin/payments",
            {
                credentials: "include",
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.error || "Unable to load payments."
            );
        }

        setPayments(data.payments || []);
    }

    async function reviewPayment(
        payment,
        decision
    ) {
        let adminNote = null;

        if (decision === "REJECT") {
            adminNote =
                window.prompt(
                    "Reason for rejection (optional):"
                );

            if (adminNote === null) {
                return;
            }
        } else {
            const confirmed = window.confirm(
                "Approve this payment and activate 24-hour access?"
            );

            if (!confirmed) {
                return;
            }
        }

        setActionLoading(payment.id);

        try {
            const response = await fetch(
                "/api/admin/payments",
                {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        "Content-Type":
                            "application/json",
                    },
                    body: JSON.stringify({
                        paymentId: payment.id,
                        decision,
                        adminNote,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.error ||
                    "Unable to review payment."
                );
            }

            await loadPayments();
        } catch (error) {
            console.error(error);
            alert(error.message);
        } finally {
            setActionLoading("");
        }
    }

    if (loading) {
        return (
            <AdminPageShell>
                <Loading />
            </AdminPageShell>
        );
    }

    return (
        <AdminPageShell>
            <div className="nt-admin-section-header">
                <div>
                    <div className="nt-admin-section-kicker">
                        ACCESS PAYMENTS
                    </div>

                    <h2>
                        Payment requests
                    </h2>

                    <p>
                        Review 100 FCFA access
                        payments and activate
                        24-hour discovery access.
                    </p>
                </div>

                <button
                    type="button"
                    className="nt-admin-icon-button"
                    onClick={loadPayments}
                    title="Refresh"
                >
                    <RefreshCw size={17} />
                </button>
            </div>

            {error && (
                <div className="nt-admin-error">
                    {error}
                </div>
            )}

            {payments.length === 0 ? (
                <div className="nt-admin-empty">
                    <CreditCard size={28} />

                    <h3>
                        No payment requests
                    </h3>

                    <p>
                        Payment requests will
                        appear here when visitors
                        request access.
                    </p>
                </div>
            ) : (
                <div className="nt-admin-payment-list">
                    {payments.map(
                        (payment) => (
                            <PaymentCard
                                key={payment.id}
                                payment={payment}
                                loading={
                                    actionLoading ===
                                    payment.id
                                }
                                onApprove={() =>
                                    reviewPayment(
                                        payment,
                                        "APPROVE"
                                    )
                                }
                                onReject={() =>
                                    reviewPayment(
                                        payment,
                                        "REJECT"
                                    )
                                }
                            />
                        )
                    )}
                </div>
            )}
        </AdminPageShell>
    );
}

function PaymentCard({
    payment,
    loading,
    onApprove,
    onReject,
}) {
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
                        payment.status || ""
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
                        Transaction
                    </span>

                    <strong>
                        {payment.transaction_reference ||
                            "Not provided"}
                    </strong>
                </div>
            </div>

            {payment.proofUrl ? (
                <a
                    href={payment.proofUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="nt-admin-proof"
                >
                    <ShieldCheck size={16} />
                    View payment proof
                </a>
            ) : (
                <div className="nt-admin-proof missing">
                    <Clock3 size={16} />
                    Payment proof unavailable
                </div>
            )}

            {payment.status === "PENDING" && (
                <div className="nt-admin-payment-actions">
                    <button
                        type="button"
                        className="nt-admin-reject"
                        disabled={loading}
                        onClick={onReject}
                    >
                        <XCircle size={16} />
                        Reject
                    </button>

                    <button
                        type="button"
                        className="nt-admin-approve"
                        disabled={
                            loading ||
                            !payment.proofUrl
                        }
                        onClick={onApprove}
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

function AdminPageShell({
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
                        Payments
                    </h1>

                    <p>
                        Secure access management.
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
                Loading payments...
            </p>
        </div>
    );
}