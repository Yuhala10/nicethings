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

import { useLanguage } from "../../lib/i18n";


export default function AdminDashboard() {
    const {
        language,
        setLanguage,
    } = useLanguage();

    const french =
        language === "fr";


    const [
        loading,
        setLoading,
    ] = useState(true);

    const [
        payments,
        setPayments,
    ] = useState([]);

    const [
        error,
        setError,
    ] = useState("");

    const [
        actionLoading,
        setActionLoading,
    ] = useState("");


    /* =====================================================
       INITIALISE
    ====================================================== */

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


            let session = {};

            try {
                session =
                    await response.json();
            } catch {
                session = {};
            }


            if (
                !session.authenticated
            ) {
                window.location.replace(
                    "/admin/login"
                );

                return;
            }


            await loadPayments();
        } catch (
        dashboardError
        ) {
            console.error(
                "Admin dashboard:",
                dashboardError
            );

            setError(
                french
                    ? "Impossible de charger le tableau de bord."
                    : "Unable to load the administrator dashboard."
            );
        } finally {
            setLoading(
                false
            );
        }
    }


    /* =====================================================
       LOAD PAYMENTS
    ====================================================== */

    async function loadPayments() {
        setError("");


        try {
            const response =
                await fetch(
                    "/api/admin/payments",
                    {
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
        paymentError
        ) {
            console.error(
                "Load payments:",
                paymentError
            );

            setError(
                paymentError.message ||
                (
                    french
                        ? "Impossible de charger les paiements."
                        : "Unable to load payments."
                )
            );
        }
    }


    /* =====================================================
       REVIEW PAYMENT
    ====================================================== */

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
                !response.ok
            ) {
                throw new Error(
                    data.error ||
                    (
                        french
                            ? "Impossible de traiter le paiement."
                            : "Unable to process payment."
                    )
                );
            }


            await loadPayments();

            return data;
        } catch (
        reviewError
        ) {
            console.error(
                "Payment review:",
                reviewError
            );

            setError(
                reviewError.message
            );

            return null;
        } finally {
            setActionLoading(
                ""
            );
        }
    }


    /* =====================================================
       APPROVE
    ====================================================== */

    async function handleApprove(
        payment
    ) {
        const confirmed =
            window.confirm(
                french
                    ? "Approuver ce paiement de 100 FCFA et activer l'accès pendant 24 heures ?"
                    : "Approve this 100 FCFA payment and activate 24-hour access?"
            );


        if (!confirmed) {
            return;
        }


        await reviewPayment(
            payment,
            "APPROVE"
        );
    }


    /* =====================================================
       REJECT
    ====================================================== */

    async function handleReject(
        payment
    ) {
        const note =
            window.prompt(
                french
                    ? "Motif du rejet (facultatif) :"
                    : "Optional reason for rejection:"
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


    /* =====================================================
       LOGOUT
    ====================================================== */

    async function handleLogout() {
        try {
            await fetch(
                "/api/admin/logout",
                {
                    method:
                        "POST",

                    credentials:
                        "include",
                }
            );
        } catch (
        logoutError
        ) {
            console.error(
                "Admin logout:",
                logoutError
            );
        } finally {
            window.location.replace(
                "/admin/login"
            );
        }
    }


    /* =====================================================
       STATS
    ====================================================== */

    const pending =
        payments.filter(
            payment =>
                payment.status ===
                "PENDING"
        );


    const approved =
        payments.filter(
            payment =>
                payment.status ===
                "APPROVED"
        );


    const rejected =
        payments.filter(
            payment =>
                payment.status ===
                "REJECTED"
        );


    const revenue =
        approved.reduce(
            (
                total,
                payment
            ) =>
                total +
                Number(
                    payment.amount ||
                    0
                ),
            0
        );


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

                    <Sparkles
                        size={28}
                    />

                    <p>
                        {french
                            ? "Chargement de NiceThings Control..."
                            : "Loading NiceThings Control..."}
                    </p>

                </div>

            </main>
        );
    }


    /* =====================================================
       DASHBOARD
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
                            ? "Bienvenue."
                            : "Good to see you."}
                    </h1>


                    <p>
                        {french
                            ? "Gérez les paiements, les accès et l'activité de découverte."
                            : "Manage payments, access and discovery activity."}
                    </p>

                </div>


                <div
                    className="nt-admin-header-actions"
                >

                    {/* LANGUAGE */}

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
                            aria-pressed={
                                language ===
                                "en"
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
                            aria-pressed={
                                language ===
                                "fr"
                            }
                        >
                            FR
                        </button>

                    </div>


                    <button
                        type="button"
                        className="nt-admin-icon-button"
                        onClick={
                            loadPayments
                        }
                        title={
                            french
                                ? "Actualiser"
                                : "Refresh"
                        }
                        aria-label={
                            french
                                ? "Actualiser"
                                : "Refresh"
                        }
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

                        {french
                            ? "Déconnexion"
                            : "Logout"}

                    </button>

                </div>

            </header>


            {/* =================================================
                STATS
            ================================================== */}

            <section
                className="nt-admin-stats"
            >

                <StatCard
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
                        pending.length
                    }
                />


                <StatCard
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
                        approved.length
                    }
                />


                <StatCard
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
                        rejected.length
                    }
                />


                <StatCard
                    icon={
                        <CreditCard
                            size={19}
                        />
                    }
                    label={
                        french
                            ? "Revenus"
                            : "Revenue"
                    }
                    value={`${revenue.toLocaleString(
                        "fr-FR"
                    )} FCFA`}
                />

            </section>


            {/* =================================================
                PAYMENT QUEUE
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
                                ? "FILE DES PAIEMENTS"
                                : "PAYMENT QUEUE"}
                        </div>


                        <h2>
                            {french
                                ? "Demandes d'accès"
                                : "Access requests"}
                        </h2>


                        <p>
                            {french
                                ? "Vérifiez les paiements de 100 FCFA avant d'activer l'accès de 24 heures."
                                : "Verify 100 FCFA payments before activating 24-hour discovery access."}
                        </p>

                    </div>


                    <div
                        className="nt-admin-pending-pill"
                    >

                        <span />

                        {pending.length}{" "}

                        {french
                            ? "en attente"
                            : "pending"}

                    </div>

                </div>


                {error && (
                    <div
                        className="nt-admin-error"
                        role="alert"
                    >
                        {error}
                    </div>
                )}


                {pending.length ===
                    0 ? (
                    <div
                        className="nt-admin-empty"
                    >

                        <CheckCircle2
                            size={27}
                        />


                        <h3>
                            {french
                                ? "Tout est clair."
                                : "Everything is clear."}
                        </h3>


                        <p>
                            {french
                                ? "Aucune demande de paiement n'est actuellement en attente."
                                : "There are no pending payment requests right now."}
                        </p>

                    </div>
                ) : (
                    <div
                        className="nt-admin-payment-list"
                    >

                        {pending.map(
                            payment => (
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
                                    french={
                                        french
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


            {/* =================================================
                PLATFORM SNAPSHOT
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
                                ? "PLATEFORME"
                                : "PLATFORM"}
                        </div>


                        <h2>
                            {french
                                ? "Aperçu de NiceThings"
                                : "NiceThings snapshot"}
                        </h2>

                    </div>

                </div>


                <div
                    className="nt-admin-snapshot-grid"
                >

                    <Snapshot
                        icon={
                            <Users
                                size={19}
                            />
                        }
                        title={
                            french
                                ? "Visiteurs"
                                : "Visitors"
                        }
                        text={
                            french
                                ? "Les sessions anonymes sont associées aux accès et aux recherches."
                                : "Anonymous discovery sessions are connected to access passes and searches."
                        }
                    />


                    <Snapshot
                        icon={
                            <MapPin
                                size={19}
                            />
                        }
                        title={
                            french
                                ? "Spots"
                                : "Spots"
                        }
                        text={
                            french
                                ? "Les lieux approuvés sont disponibles dans le moteur de découverte."
                                : "Approved places are available to the discovery engine."
                        }
                    />


                    <Snapshot
                        icon={
                            <Sparkles
                                size={19}
                            />
                        }
                        title={
                            french
                                ? "Découvertes"
                                : "Discoveries"
                        }
                        text={
                            french
                                ? "Les recherches, sélections et arrivées forment les données de découverte."
                                : "Searches, selections and arrivals form the NiceThings discovery data."
                        }
                    />

                </div>

            </section>


            {/* =================================================
                ADMIN NAVIGATION
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
                                ? "GESTION"
                                : "MANAGEMENT"}
                        </div>


                        <h2>
                            {french
                                ? "Administration"
                                : "Administration"}
                        </h2>

                    </div>

                </div>


                <div
                    className="nt-admin-snapshot-grid"
                >

                    <AdminLink
                        href="/admin/payments"
                        icon={
                            <CreditCard
                                size={19}
                            />
                        }
                        title={
                            french
                                ? "Paiements"
                                : "Payments"
                        }
                        text={
                            french
                                ? "Consulter et traiter les demandes de paiement."
                                : "View and process payment requests."
                        }
                    />


                    <AdminLink
                        href="/admin/spots"
                        icon={
                            <MapPin
                                size={19}
                            />
                        }
                        title={
                            french
                                ? "Spots"
                                : "Spots"
                        }
                        text={
                            french
                                ? "Gérer les lieux approuvés et leurs informations."
                                : "Manage approved places and their information."
                        }
                    />


                    <AdminLink
                        href="/admin/submissions"
                        icon={
                            <Sparkles
                                size={19}
                            />
                        }
                        title={
                            french
                                ? "Soumissions"
                                : "Submissions"
                        }
                        text={
                            french
                                ? "Examiner les nouveaux lieux proposés."
                                : "Review newly submitted places."
                        }
                    />

                </div>

            </section>


            {/* =================================================
                FOOTER
            ================================================== */}

            <footer
                className="nt-admin-footer"
            >
                NiceThings Control •{" "}
                {french
                    ? "environnement administrateur sécurisé"
                    : "Secure administrator environment"}
            </footer>

        </main>
    );
}


/* =====================================================
   STAT CARD
====================================================== */

function StatCard({
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
   PAYMENT ROW
====================================================== */

function PaymentRow({
    payment,
    loading,
    french,
    onApprove,
    onReject,
}) {
    const [
        showProof,
        setShowProof,
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


    return (
        <article
            className="nt-admin-payment"
        >

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
                    className={`nt-admin-status ${String(
                        payment.status ||
                        ""
                    ).toLowerCase()}`}
                >
                    {payment.status}
                </span>

            </div>


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
                        {payment.visitor_id}
                    </strong>

                </div>


                <div>

                    <span>
                        {french
                            ? "ID paiement"
                            : "Payment ID"}
                    </span>


                    <strong>
                        {payment.id}
                    </strong>

                </div>

            </div>


            {/* =============================================
                PROOF
            ============================================== */}

            {payment.proofUrl ? (
                <>
                    <button
                        type="button"
                        className="nt-admin-proof"
                        onClick={() =>
                            setShowProof(
                                value =>
                                    !value
                            )
                        }
                    >

                        <ShieldCheck
                            size={16}
                        />


                        <span>
                            {showProof
                                ? french
                                    ? "Masquer la preuve"
                                    : "Hide payment proof"
                                : french
                                    ? "Voir la preuve de paiement"
                                    : "View payment proof"}
                        </span>

                    </button>


                    {showProof && (
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

                        </div>
                    )}
                </>
            ) : (
                <div
                    className="nt-admin-proof missing"
                >

                    <Clock3
                        size={16}
                    />


                    <span>
                        {french
                            ? "Aucune preuve de paiement"
                            : "Payment proof not uploaded yet"}
                    </span>

                </div>
            )}


            {/* =============================================
                ADMIN NOTE
            ============================================== */}

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


            {/* =============================================
                ACTIONS
            ============================================== */}

            {payment.status ===
                "PENDING" && (
                    <div
                        className="nt-admin-payment-actions"
                    >

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


                            {french
                                ? "Rejeter"
                                : "Reject"}

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


/* =====================================================
   SNAPSHOT
====================================================== */

function Snapshot({
    icon,
    title,
    text,
}) {
    return (
        <div
            className="nt-admin-snapshot"
        >

            <div
                className="nt-admin-stat-icon"
            >
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


/* =====================================================
   ADMIN LINK
====================================================== */

function AdminLink({
    href,
    icon,
    title,
    text,
}) {
    return (
        <a
            href={href}
            className="nt-admin-snapshot nt-admin-management-link"
        >

            <div
                className="nt-admin-stat-icon"
            >
                {icon}
            </div>


            <h3>
                {title}
            </h3>


            <p>
                {text}
            </p>

        </a>
    );
}