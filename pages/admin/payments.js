import { useEffect, useState } from "react";

import {
    ArrowLeft,
    CheckCircle2,
    Clock3,
    CreditCard,
    ExternalLink,
    RefreshCw,
    ShieldCheck,
    XCircle,
} from "lucide-react";

import Link from "next/link";

import { useLanguage } from "../../lib/i18n";


export default function AdminPaymentsPage() {
    const {
        language,
        setLanguage,
    } = useLanguage();

    const french =
        language === "fr";


    const [
        payments,
        setPayments,
    ] = useState([]);

    const [
        loading,
        setLoading,
    ] = useState(true);

    const [
        refreshing,
        setRefreshing,
    ] = useState(false);

    const [
        error,
        setError,
    ] = useState("");

    const [
        actionId,
        setActionId,
    ] = useState("");

    const [
        filter,
        setFilter,
    ] = useState("PENDING");


    /* =====================================================
       LOAD PAYMENTS
    ====================================================== */

    useEffect(() => {
        loadPayments();
    }, []);


    async function loadPayments(
        silent = false
    ) {
        if (silent) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }

        setError("");


        try {
            const response =
                await fetch(
                    "/api/admin/payments",
                    {
                        method:
                            "GET",

                        credentials:
                            "include",
                    }
                );


            let data = {};

            try {
                data =
                    await response.json();
            } catch {
                data = {};
            }


            if (
                response.status ===
                401
            ) {
                window.location.replace(
                    "/admin/login"
                );

                return;
            }


            if (
                !response.ok
            ) {
                throw new Error(
                    data.error ||
                    (
                        french
                            ? "Impossible de charger les paiements."
                            : "Unable to load payments."
                    )
                );
            }


            setPayments(
                Array.isArray(
                    data.payments
                )
                    ? data.payments
                    : []
            );
        } catch (
        loadError
        ) {
            console.error(
                "Admin payments:",
                loadError
            );

            setError(
                loadError.message ||
                (
                    french
                        ? "Impossible de charger les paiements."
                        : "Unable to load payments."
                )
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }


    /* =====================================================
       REVIEW PAYMENT
    ====================================================== */

    async function reviewPayment(
        payment,
        decision
    ) {
        let adminNote = null;


        if (
            decision ===
            "REJECT"
        ) {
            adminNote =
                window.prompt(
                    french
                        ? "Motif du rejet (facultatif) :"
                        : "Reason for rejection (optional):"
                );


            if (
                adminNote ===
                null
            ) {
                return;
            }


            adminNote =
                adminNote.trim() ||
                null;
        }


        if (
            decision ===
            "APPROVE"
        ) {
            const confirmed =
                window.confirm(
                    french
                        ? "Approuver ce paiement et activer l'accès pendant 24 heures ?"
                        : "Approve this payment and activate 24-hour access?"
                );


            if (!confirmed) {
                return;
            }


            if (
                !payment.proofUrl
            ) {
                setError(
                    french
                        ? "Impossible d'approuver un paiement sans preuve."
                        : "A payment cannot be approved without proof."
                );

                return;
            }
        }


        setActionId(
            payment.id
        );

        setError("");


        try {
            const response =
                await fetch(
                    "/api/admin/payments",
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
                                paymentId:
                                    payment.id,

                                decision,

                                adminNote,
                            }),
                    }
                );


            let data = {};

            try {
                data =
                    await response.json();
            } catch {
                data = {};
            }


            if (
                response.status ===
                401
            ) {
                window.location.replace(
                    "/admin/login"
                );

                return;
            }


            if (
                !response.ok
            ) {
                throw new Error(
                    data.error ||
                    (
                        french
                            ? "Impossible de traiter ce paiement."
                            : "Unable to process this payment."
                    )
                );
            }


            await loadPayments(
                true
            );
        } catch (
        reviewError
        ) {
            console.error(
                "Review payment:",
                reviewError
            );

            setError(
                reviewError.message ||
                (
                    french
                        ? "Impossible de traiter ce paiement."
                        : "Unable to process this payment."
                )
            );
        } finally {
            setActionId("");
        }
    }


    /* =====================================================
       FILTER
    ====================================================== */

    const filteredPayments =
        payments.filter(
            payment => {

                if (
                    filter ===
                    "ALL"
                ) {
                    return true;
                }

                return (
                    payment.status ===
                    filter
                );
            }
        );


    const pendingCount =
        payments.filter(
            payment =>
                payment.status ===
                "PENDING"
        ).length;


    const approvedCount =
        payments.filter(
            payment =>
                payment.status ===
                "APPROVED"
        ).length;


    const rejectedCount =
        payments.filter(
            payment =>
                payment.status ===
                "REJECTED"
        ).length;


    /* =====================================================
       LOADING
    ====================================================== */

    if (
        loading
    ) {
        return (
            <main
                className="nt-admin-page"
            >

                <div
                    className="nt-admin-loading"
                >

                    <CreditCard
                        size={28}
                    />

                    <p>
                        {french
                            ? "Chargement des paiements..."
                            : "Loading payments..."}
                    </p>

                </div>

            </main>
        );
    }


    /* =====================================================
       PAGE
    ====================================================== */

    return (
        <main
            className="nt-admin-page"
        >

            {/* =================================================
                HEADER
            ================================================== */}

            <header
                className="nt-admin-header"
            >

                <div>

                    <Link
                        href="/admin"
                        className="nt-admin-back"
                    >

                        <ArrowLeft
                            size={16}
                        />

                        {french
                            ? "Tableau de bord"
                            : "Dashboard"}

                    </Link>


                    <div
                        className="nt-admin-eyebrow"
                    >

                        <ShieldCheck
                            size={13}
                        />

                        NiceThings Control

                    </div>


                    <h1>
                        {french
                            ? "Paiements"
                            : "Payments"}
                    </h1>


                    <p>
                        {french
                            ? "Vérifiez les paiements et gérez les accès."
                            : "Review payments and manage access."}
                    </p>

                </div>


                <div
                    className="nt-admin-header-actions"
                >

                    <div
                        className="nt-language-switch"
                    >

                        <button
                            type="button"
                            className={
                                language ===
                                    "en"
                                    ? "active"
                                    : ""
                            }
                            onClick={() =>
                                setLanguage(
                                    "en"
                                )
                            }
                        >
                            EN
                        </button>


                        <button
                            type="button"
                            className={
                                language ===
                                    "fr"
                                    ? "active"
                                    : ""
                            }
                            onClick={() =>
                                setLanguage(
                                    "fr"
                                )
                            }
                        >
                            FR
                        </button>

                    </div>


                    <button
                        type="button"
                        className="nt-admin-icon-button"
                        onClick={() =>
                            loadPayments(
                                true
                            )
                        }
                        disabled={
                            refreshing
                        }
                        title={
                            french
                                ? "Actualiser"
                                : "Refresh"
                        }
                    >

                        <RefreshCw
                            size={17}
                            className={
                                refreshing
                                    ? "nt-spin"
                                    : ""
                            }
                        />

                    </button>

                </div>

            </header>


            {/* =================================================
                STATS
            ================================================== */}

            <section
                className="nt-admin-stats"
            >

                <PaymentStat
                    icon={
                        <Clock3
                            size={19}
                        />
                    }
                    label={
                        french
                            ? "En attente"
                            : "Pending"
                    }
                    value={
                        pendingCount
                    }
                />


                <PaymentStat
                    icon={
                        <CheckCircle2
                            size={19}
                        />
                    }
                    label={
                        french
                            ? "Approuvés"
                            : "Approved"
                    }
                    value={
                        approvedCount
                    }
                />


                <PaymentStat
                    icon={
                        <XCircle
                            size={19}
                        />
                    }
                    label={
                        french
                            ? "Rejetés"
                            : "Rejected"
                    }
                    value={
                        rejectedCount
                    }
                />

            </section>


            {/* =================================================
                ERROR
            ================================================== */}

            {error && (
                <div
                    className="nt-admin-error"
                    role="alert"
                >
                    {error}
                </div>
            )}


            {/* =================================================
                FILTERS
            ================================================== */}

            <section
                className="nt-admin-section"
            >

                <div
                    className="nt-admin-section-header"
                >

                    <div>

                        <div
                            className="nt-admin-section-kicker"
                        >
                            {french
                                ? "GESTION DES PAIEMENTS"
                                : "PAYMENT MANAGEMENT"}
                        </div>


                        <h2>
                            {french
                                ? "Demandes d'accès"
                                : "Access requests"}
                        </h2>

                    </div>


                    <div
                        className="nt-admin-filters"
                    >

                        <FilterButton
                            active={
                                filter ===
                                "PENDING"
                            }
                            onClick={() =>
                                setFilter(
                                    "PENDING"
                                )
                            }
                        >
                            {french
                                ? "En attente"
                                : "Pending"}
                        </FilterButton>


                        <FilterButton
                            active={
                                filter ===
                                "APPROVED"
                            }
                            onClick={() =>
                                setFilter(
                                    "APPROVED"
                                )
                            }
                        >
                            {french
                                ? "Approuvés"
                                : "Approved"}
                        </FilterButton>


                        <FilterButton
                            active={
                                filter ===
                                "REJECTED"
                            }
                            onClick={() =>
                                setFilter(
                                    "REJECTED"
                                )
                            }
                        >
                            {french
                                ? "Rejetés"
                                : "Rejected"}
                        </FilterButton>


                        <FilterButton
                            active={
                                filter ===
                                "ALL"
                            }
                            onClick={() =>
                                setFilter(
                                    "ALL"
                                )
                            }
                        >
                            {french
                                ? "Tous"
                                : "All"}
                        </FilterButton>

                    </div>

                </div>


                {/* =================================================
                    EMPTY
                ================================================== */}

                {filteredPayments.length ===
                    0 ? (
                    <div
                        className="nt-admin-empty"
                    >

                        <CreditCard
                            size={28}
                        />


                        <h3>
                            {filter ===
                                "PENDING"
                                ? french
                                    ? "Aucun paiement en attente."
                                    : "No pending payments."
                                : french
                                    ? "Aucun paiement dans cette catégorie."
                                    : "No payments in this category."}
                        </h3>


                        <p>
                            {french
                                ? "Les nouvelles demandes apparaîtront ici."
                                : "New requests will appear here."}
                        </p>

                    </div>
                ) : (
                    <div
                        className="nt-admin-payment-list"
                    >

                        {filteredPayments.map(
                            payment => (
                                <PaymentCard
                                    key={
                                        payment.id
                                    }
                                    payment={
                                        payment
                                    }
                                    french={
                                        french
                                    }
                                    actionLoading={
                                        actionId ===
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

            </section>

        </main>
    );
}


/* =====================================================
   PAYMENT STAT
====================================================== */

function PaymentStat({
    icon,
    label,
    value,
}) {
    return (
        <div
            className="nt-admin-stat"
        >

            <div
                className="nt-admin-stat-icon"
            >
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


/* =====================================================
   FILTER BUTTON
====================================================== */

function FilterButton({
    active,
    onClick,
    children,
}) {
    return (
        <button
            type="button"
            className={
                active
                    ? "nt-admin-filter active"
                    : "nt-admin-filter"
            }
            onClick={
                onClick
            }
        >
            {children}
        </button>
    );
}


/* =====================================================
   PAYMENT CARD
====================================================== */

function PaymentCard({
    payment,
    french,
    actionLoading,
    onApprove,
    onReject,
}) {
    const [
        proofOpen,
        setProofOpen,
    ] = useState(false);


    const createdAt =
        payment.created_at
            ? new Date(
                payment.created_at
            ).toLocaleString(
                french
                    ? "fr-FR"
                    : "en-GB"
            )
            : "—";


    const reviewedAt =
        payment.reviewed_at
            ? new Date(
                payment.reviewed_at
            ).toLocaleString(
                french
                    ? "fr-FR"
                    : "en-GB"
            )
            : null;


    const status =
        payment.status ||
        "UNKNOWN";


    const statusClass =
        status.toLowerCase();


    return (
        <article
            className="nt-admin-payment"
        >

            {/* =================================================
                TOP
            ================================================== */}

            <div
                className="nt-admin-payment-top"
            >

                <div>

                    <div
                        className="nt-admin-payment-amount"
                    >
                        {Number(
                            payment.amount ||
                            0
                        ).toLocaleString(
                            "fr-FR"
                        )}{" "}
                        {payment.currency ||
                            "XAF"}
                    </div>


                    <div
                        className="nt-admin-payment-meta"
                    >
                        {createdAt}
                    </div>

                </div>


                <span
                    className={`nt-admin-status ${statusClass}`}
                >
                    {status}
                </span>

            </div>


            {/* =================================================
                DETAILS
            ================================================== */}

            <div
                className="nt-admin-payment-info"
            >

                <div>

                    <span>
                        {french
                            ? "Visiteur"
                            : "Visitor"}
                    </span>


                    <strong>
                        {
                            payment.visitor_id
                        }
                    </strong>

                </div>


                <div>

                    <span>
                        {french
                            ? "Référence"
                            : "Transaction reference"}
                    </span>


                    <strong>
                        {payment.transaction_reference ||
                            "—"}
                    </strong>

                </div>


                <div>

                    <span>
                        {french
                            ? "Pass d'accès"
                            : "Access pass"}
                    </span>


                    <strong>
                        {
                            payment.access_pass_id
                        }
                    </strong>

                </div>

            </div>


            {/* =================================================
                PAYMENT PROOF
            ================================================== */}

            {payment.proofUrl ? (
                <div
                    className="nt-admin-proof-section"
                >

                    <button
                        type="button"
                        className="nt-admin-proof"
                        onClick={() =>
                            setProofOpen(
                                current =>
                                    !current
                            )
                        }
                    >

                        <ShieldCheck
                            size={16}
                        />


                        {proofOpen
                            ? french
                                ? "Masquer la preuve"
                                : "Hide payment proof"
                            : french
                                ? "Afficher la preuve de paiement"
                                : "View payment proof"}

                    </button>


                    {proofOpen && (
                        <div
                            className="nt-admin-proof-viewer"
                        >

                            <img
                                src={
                                    payment.proofUrl
                                }
                                alt={
                                    french
                                        ? "Preuve de paiement"
                                        : "Payment proof"
                                }
                            />


                            <a
                                href={
                                    payment.proofUrl
                                }
                                target="_blank"
                                rel="noreferrer"
                                className="nt-admin-proof-link"
                            >

                                <ExternalLink
                                    size={15}
                                />

                                {french
                                    ? "Ouvrir dans un nouvel onglet"
                                    : "Open in new tab"}

                            </a>

                        </div>
                    )}

                </div>
            ) : (
                <div
                    className="nt-admin-proof missing"
                >

                    <XCircle
                        size={16}
                    />

                    {french
                        ? "Aucune preuve de paiement."
                        : "No payment proof uploaded."}

                </div>
            )}


            {/* =================================================
                ADMIN NOTE
            ================================================== */}

            {payment.admin_note && (
                <div
                    className="nt-admin-note"
                >

                    <strong>
                        {french
                            ? "Note administrateur"
                            : "Admin note"}
                    </strong>


                    <p>
                        {
                            payment.admin_note
                        }
                    </p>

                </div>
            )}


            {/* =================================================
                REVIEWED
            ================================================== */}

            {reviewedAt && (
                <div
                    className="nt-admin-payment-meta"
                    style={{
                        marginTop:
                            "12px",
                    }}
                >
                    {french
                        ? `Traité le ${reviewedAt}`
                        : `Reviewed ${reviewedAt}`}
                </div>
            )}


            {/* =================================================
                ACTIONS
            ================================================== */}

            {status ===
                "PENDING" && (
                    <div
                        className="nt-admin-payment-actions"
                    >

                        <button
                            type="button"
                            className="nt-admin-reject"
                            disabled={
                                actionLoading
                            }
                            onClick={
                                onReject
                            }
                        >

                            <XCircle
                                size={16}
                            />

                            {actionLoading
                                ? french
                                    ? "Traitement..."
                                    : "Processing..."
                                : french
                                    ? "Rejeter"
                                    : "Reject"}

                        </button>


                        <button
                            type="button"
                            className="nt-admin-approve"
                            disabled={
                                actionLoading ||
                                !payment.proofUrl
                            }
                            onClick={
                                onApprove
                            }
                        >

                            {actionLoading ? (
                                <RefreshCw
                                    size={16}
                                    className="nt-spin"
                                />
                            ) : (
                                <CheckCircle2
                                    size={16}
                                />
                            )}


                            {actionLoading
                                ? french
                                    ? "Traitement..."
                                    : "Processing..."
                                : french
                                    ? "Approuver et activer"
                                    : "Approve & activate"}

                        </button>

                    </div>
                )}

        </article>
    );
}