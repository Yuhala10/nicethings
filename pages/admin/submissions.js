import { useEffect, useState } from "react";
import {
    ArrowLeft,
    CheckCircle2,
    MapPin,
    RefreshCw,
    ShieldCheck,
    XCircle,
} from "lucide-react";

export default function AdminSubmissions() {
    const [submissions, setSubmissions] =
        useState([]);

    const [loading, setLoading] =
        useState(true);

    const [actionLoading, setActionLoading] =
        useState("");

    const [error, setError] =
        useState("");

    useEffect(() => {
        load();
    }, []);

    async function load() {
        try {
            const auth =
                await fetch(
                    "/api/admin/me",
                    {
                        credentials:
                            "include",
                    }
                );

            const authData =
                await auth.json();

            if (
                !authData.authenticated
            ) {
                window.location.href =
                    "/admin/login";

                return;
            }

            const response =
                await fetch(
                    "/api/admin/submissions",
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
                    "Unable to load submissions."
                );
            }

            setSubmissions(
                data.submissions ||
                []
            );
        } catch (error) {
            console.error(error);

            setError(
                error.message ||
                "Unable to load submissions."
            );
        } finally {
            setLoading(false);
        }
    }

    async function review(
        submission,
        decision
    ) {
        let adminNote = null;

        if (
            decision ===
            "REJECT"
        ) {
            adminNote =
                window.prompt(
                    "Reason for rejection (optional):"
                );

            if (
                adminNote ===
                null
            ) {
                return;
            }
        } else {
            const confirmed =
                window.confirm(
                    `Approve "${submission.spot_name}" and add it to NiceThings?`
                );

            if (!confirmed) {
                return;
            }
        }

        setActionLoading(
            submission.id
        );

        try {
            const response =
                await fetch(
                    "/api/admin/submissions",
                    {
                        method:
                            "POST",

                        credentials:
                            "include",

                        headers: {
                            "Content-Type":
                                "application/json",
                        },

                        body:
                            JSON.stringify({
                                submissionId:
                                    submission.id,

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
                    "Unable to review submission."
                );
            }

            await load();
        } catch (error) {
            console.error(
                error
            );

            alert(
                error.message
            );
        } finally {
            setActionLoading(
                ""
            );
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
                            COMMUNITY DISCOVERY
                        </div>

                        <h2>
                            Spot submissions
                        </h2>

                        <p>
                            Review places
                            introduced by
                            visitors and
                            businesses.
                        </p>
                    </div>

                    <button
                        type="button"
                        className="nt-admin-icon-button"
                        onClick={
                            load
                        }
                    >
                        <RefreshCw
                            size={17}
                        />
                    </button>
                </div>

                {error && (
                    <div className="nt-admin-error">
                        {error}
                    </div>
                )}

                {submissions.length ===
                    0 ? (
                    <div className="nt-admin-empty">
                        <MapPin
                            size={28}
                        />

                        <h3>
                            No submissions
                        </h3>

                        <p>
                            New spot
                            introductions
                            will appear
                            here.
                        </p>
                    </div>
                ) : (
                    <div className="nt-admin-payment-list">
                        {submissions.map(
                            (
                                submission
                            ) => (
                                <SubmissionCard
                                    key={
                                        submission.id
                                    }
                                    submission={
                                        submission
                                    }
                                    loading={
                                        actionLoading ===
                                        submission.id
                                    }
                                    onApprove={() =>
                                        review(
                                            submission,
                                            "APPROVE"
                                        )
                                    }
                                    onReject={() =>
                                        review(
                                            submission,
                                            "REJECT"
                                        )
                                    }
                                />
                            )
                        )}
                    </div>
                )}
            </section>
        </AdminShell>
    );
}

function SubmissionCard({
    submission,
    loading,
    onApprove,
    onReject,
}) {
    return (
        <article className="nt-admin-payment">
            <div className="nt-admin-payment-top">
                <div>
                    <div className="nt-admin-payment-amount">
                        {
                            submission.spot_name
                        }
                    </div>

                    <div className="nt-admin-payment-meta">
                        {
                            submission.city
                        }

                        {submission.neighborhood
                            ? ` • ${submission.neighborhood}`
                            : ""}
                    </div>
                </div>

                <span
                    className={`nt-admin-status ${String(
                        submission.status ||
                        ""
                    ).toLowerCase()}`}
                >
                    {
                        submission.status
                    }
                </span>
            </div>

            {submission.description && (
                <p className="nt-admin-description">
                    {
                        submission.description
                    }
                </p>
            )}

            <div className="nt-admin-payment-info">
                <div>
                    <span>
                        Category
                    </span>

                    <strong>
                        {submission.category ||
                            "—"}
                    </strong>
                </div>

                <div>
                    <span>
                        Estimated price
                    </span>

                    <strong>
                        {submission.estimated_price
                            ? `${submission.estimated_price} FCFA`
                            : "—"}
                    </strong>
                </div>

                <div>
                    <span>
                        Submitted by
                    </span>

                    <strong>
                        {submission.submitted_by_name ||
                            "Anonymous"}
                    </strong>
                </div>
            </div>

            {(submission.phone ||
                submission.whatsapp ||
                submission.submitted_by_phone) && (
                    <div className="nt-admin-proof">
                        <MapPin size={16} />

                        {submission.phone ||
                            submission.whatsapp ||
                            submission.submitted_by_phone}
                    </div>
                )}

            {submission.status ===
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
                                loading
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
                                : "Approve spot"}
                        </button>
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
                        <ShieldCheck
                            size={13}
                        />

                        NiceThings Control
                    </div>

                    <h1>
                        Submissions
                    </h1>

                    <p>
                        Community spot
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
                    <ArrowLeft
                        size={16}
                    />

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
                Loading submissions...
            </p>
        </div>
    );
}