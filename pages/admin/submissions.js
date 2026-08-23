import { useEffect, useMemo, useState } from "react";

import {
    ArrowLeft,
    CheckCircle2,
    MapPin,
    RefreshCw,
    ShieldCheck,
    UserRound,
    XCircle,
} from "lucide-react";

import Link from "next/link";

import { useLanguage } from "../../lib/i18n";


export default function AdminSubmissions() {
    const {
        language,
        setLanguage,
    } = useLanguage();

    const french =
        language === "fr";


    const [
        submissions,
        setSubmissions,
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
        actionLoading,
        setActionLoading,
    ] = useState("");

    const [
        error,
        setError,
    ] = useState("");

    const [
        filter,
        setFilter,
    ] = useState("PENDING");

    const [
        search,
        setSearch,
    ] = useState("");


    /* =====================================================
       LOAD
    ====================================================== */

    useEffect(() => {
        loadSubmissions();
    }, []);


    async function loadSubmissions(
        silent = false
    ) {
        if (silent) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }

        setError("");


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
                window.location.replace(
                    "/admin/login"
                );

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
                            ? "Impossible de charger les soumissions."
                            : "Unable to load submissions."
                    )
                );
            }


            setSubmissions(
                Array.isArray(
                    data.submissions
                )
                    ? data.submissions
                    : []
            );
        } catch (
        loadError
        ) {
            console.error(
                "Admin submissions:",
                loadError
            );

            setError(
                loadError.message ||
                (
                    french
                        ? "Impossible de charger les soumissions."
                        : "Unable to load submissions."
                )
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }


    /* =====================================================
       REVIEW
    ====================================================== */

    async function review(
        submission,
        decision
    ) {
        let adminNote =
            null;


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
                        ? `Approuver « ${submission.name} » et l'ajouter à NiceThings ?`
                        : `Approve "${submission.name}" and add it to NiceThings?`
                );


            if (!confirmed) {
                return;
            }
        }


        setActionLoading(
            submission.id
        );

        setError("");


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
                            ? "Impossible de traiter cette soumission."
                            : "Unable to review this submission."
                    )
                );
            }


            await loadSubmissions(
                true
            );
        } catch (
        reviewError
        ) {
            console.error(
                "Review submission:",
                reviewError
            );

            setError(
                reviewError.message ||
                (
                    french
                        ? "Impossible de traiter cette soumission."
                        : "Unable to review this submission."
                )
            );
        } finally {
            setActionLoading(
                ""
            );
        }
    }


    /* =====================================================
       FILTER
    ====================================================== */

    const filteredSubmissions =
        useMemo(() => {
            const term =
                search
                    .trim()
                    .toLowerCase();


            return submissions.filter(
                submission => {
                    const matchesStatus =
                        filter ===
                        "ALL" ||
                        submission.status ===
                        filter;


                    if (
                        !matchesStatus
                    ) {
                        return false;
                    }


                    if (!term) {
                        return true;
                    }


                    const searchable =
                        [
                            submission.name,
                            submission.city,
                            submission.neighborhood,
                            submission.category,
                            submission.description,
                            submission.address,
                            submission.phone,
                            submission.whatsapp,
                            submission.price_information,
                            submission.opening_hours,
                            submission.status,
                        ]
                            .filter(Boolean)
                            .join(" ")
                            .toLowerCase();


                    return searchable.includes(
                        term
                    );
                }
            );
        }, [
            submissions,
            filter,
            search,
        ]);


    const pendingCount =
        submissions.filter(
            submission =>
                submission.status ===
                "PENDING"
        ).length;


    const approvedCount =
        submissions.filter(
            submission =>
                submission.status ===
                "APPROVED"
        ).length;


    const rejectedCount =
        submissions.filter(
            submission =>
                submission.status ===
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
                    <RefreshCw
                        size={28}
                        className="nt-spin"
                    />

                    <p>
                        {french
                            ? "Chargement des soumissions..."
                            : "Loading submissions..."}
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
                            ? "Soumissions"
                            : "Submissions"}
                    </h1>


                    <p>
                        {french
                            ? "Examinez les nouveaux lieux proposés par la communauté."
                            : "Review new places submitted by the community."}
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
                            loadSubmissions(
                                true
                            )
                        }
                        disabled={
                            refreshing
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

                <SubmissionStat
                    icon={
                        <RefreshCw
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


                <SubmissionStat
                    icon={
                        <CheckCircle2
                            size={19}
                        />
                    }
                    label={
                        french
                            ? "Approuvées"
                            : "Approved"
                    }
                    value={
                        approvedCount
                    }
                />


                <SubmissionStat
                    icon={
                        <XCircle
                            size={19}
                        />
                    }
                    label={
                        french
                            ? "Rejetées"
                            : "Rejected"
                    }
                    value={
                        rejectedCount
                    }
                />

            </section>


            {error && (
                <div
                    className="nt-admin-error"
                    role="alert"
                >
                    {error}
                </div>
            )}


            {/* =================================================
                SUBMISSIONS
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
                                ? "DÉCOUVERTE COMMUNAUTAIRE"
                                : "COMMUNITY DISCOVERY"}
                        </div>


                        <h2>
                            {french
                                ? "Lieux proposés"
                                : "Spot submissions"}
                        </h2>


                        <p>
                            {french
                                ? "Vérifiez les informations avant d'ajouter un lieu à la base NiceThings."
                                : "Review the information before adding a place to the NiceThings database."}
                        </p>

                    </div>

                </div>


                {/* SEARCH */}

                <div
                    className="nt-admin-search"
                >

                    <MapPin
                        size={17}
                    />


                    <input
                        type="search"
                        value={
                            search
                        }
                        onChange={event =>
                            setSearch(
                                event.target.value
                            )
                        }
                        placeholder={
                            french
                                ? "Rechercher un lieu, une ville ou une catégorie..."
                                : "Search a place, city or category..."
                        }
                    />

                </div>


                {/* FILTERS */}

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
                            ? "Approuvées"
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
                            ? "Rejetées"
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
                            ? "Toutes"
                            : "All"}
                    </FilterButton>

                </div>


                {/* RESULTS */}

                {filteredSubmissions.length ===
                    0 ? (
                    <div
                        className="nt-admin-empty"
                    >

                        <MapPin
                            size={28}
                        />

                        <h3>
                            {search
                                ? french
                                    ? "Aucun résultat."
                                    : "No results."
                                : filter ===
                                    "PENDING"
                                    ? french
                                        ? "Aucune soumission en attente."
                                        : "No pending submissions."
                                    : french
                                        ? "Aucune soumission dans cette catégorie."
                                        : "No submissions in this category."}
                        </h3>

                        <p>
                            {search
                                ? french
                                    ? "Essayez une autre recherche."
                                    : "Try another search."
                                : french
                                    ? "Les nouvelles propositions apparaîtront ici."
                                    : "New place submissions will appear here."}
                        </p>

                    </div>
                ) : (
                    <div
                        className="nt-admin-payment-list"
                    >
                        {filteredSubmissions.map(
                            submission => (
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
                                    french={
                                        french
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

        </main>
    );
}


/* =====================================================
   STAT
====================================================== */

function SubmissionStat({
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
   FILTER
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
   SUBMISSION CARD
====================================================== */

function SubmissionCard({
    submission,
    loading,
    onApprove,
    onReject,
    french,
}) {
    const submittedAt =
        submission.created_at
            ? new Date(
                submission.created_at
            ).toLocaleString(
                french
                    ? "fr-FR"
                    : "en-GB"
            )
            : null;


    const location =
        [
            submission.city,
            submission.neighborhood,
        ]
            .filter(Boolean)
            .join(
                " • "
            ) ||
        (
            french
                ? "Lieu non renseigné"
                : "Location not provided"
        );


    const contact =
        submission.phone ||
        submission.whatsapp ||
        null;


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
                        {submission.name ||
                            (
                                french
                                    ? "Lieu sans nom"
                                    : "Unnamed place"
                            )}
                    </div>


                    <div
                        className="nt-admin-payment-meta"
                    >
                        {location}
                    </div>

                </div>


                <span
                    className={`nt-admin-status ${String(
                        submission.status ||
                        ""
                    ).toLowerCase()}`}
                >
                    {submission.status ||
                        "—"}
                </span>

            </div>


            {submission.description && (
                <p
                    className="nt-admin-description"
                >
                    {
                        submission.description
                    }
                </p>
            )}


            <div
                className="nt-admin-payment-info"
            >

                <div>

                    <span>
                        {french
                            ? "Catégorie"
                            : "Category"}
                    </span>

                    <strong>
                        {submission.category ||
                            "—"}
                    </strong>

                </div>


                <div>

                    <span>
                        {french
                            ? "Prix"
                            : "Price"}
                    </span>

                    <strong>
                        {submission.price_information ||
                            "—"}
                    </strong>

                </div>


                <div>

                    <span>
                        {french
                            ? "Horaires"
                            : "Hours"}
                    </span>

                    <strong>
                        {submission.opening_hours ||
                            "—"}
                    </strong>

                </div>

            </div>


            {submission.address && (
                <div
                    className="nt-admin-proof"
                >

                    <MapPin
                        size={16}
                    />

                    <span>
                        {submission.address}
                    </span>

                </div>
            )}


            {contact && (
                <div
                    className="nt-admin-proof"
                >

                    <UserRound
                        size={16}
                    />

                    <span>
                        {contact}
                    </span>

                </div>
            )}


            {submission.latitude !=
                null &&
                submission.longitude !=
                null && (
                    <div
                        className="nt-admin-proof"
                    >

                        <MapPin
                            size={16}
                        />

                        <span>
                            {
                                submission.latitude
                            }
                            ,{" "}
                            {
                                submission.longitude
                            }
                        </span>

                    </div>
                )}


            {submittedAt && (
                <div
                    className="nt-admin-payment-meta"
                    style={{
                        marginTop:
                            "12px",
                    }}
                >
                    {french
                        ? `Soumise le ${submittedAt}`
                        : `Submitted ${submittedAt}`}
                </div>
            )}


            {submission.status ===
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

                            {loading
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
                                ? french
                                    ? "Traitement..."
                                    : "Processing..."
                                : french
                                    ? "Approuver le spot"
                                    : "Approve spot"}

                        </button>

                    </div>
                )}

        </article>
    );
}