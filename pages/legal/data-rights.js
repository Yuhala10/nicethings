import { useState } from "react";
import Link from "next/link";
import {
    ArrowLeft,
    Database,
    Download,
    ShieldCheck,
    Sparkles,
    Trash2,
} from "lucide-react";

export default function DataRightsPage() {
    const [language, setLanguage] =
        useState("en");

    const fr =
        language === "fr";

    return (
        <main className="nt-legal-page">
            <div className="nt-legal-shell">

                <header className="nt-legal-header">
                    <Link
                        href="/"
                        className="nt-legal-brand"
                    >
                        <Sparkles
                            size={17}
                        />
                        NiceThings
                    </Link>

                    <div className="nt-language-switch">
                        <button
                            className={
                                !fr
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
                            className={
                                fr
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
                </header>

                <Link
                    href="/"
                    className="nt-legal-back"
                >
                    <ArrowLeft
                        size={15}
                    />

                    {fr
                        ? "Retour"
                        : "Back"}
                </Link>

                <section className="nt-legal-hero">
                    <ShieldCheck
                        size={28}
                    />

                    <span>
                        NiceThings
                    </span>

                    <h1>
                        {fr
                            ? "Vos droits sur vos données"
                            : "Your Data Rights"}
                    </h1>

                    <p>
                        {fr
                            ? "Des informations simples sur les demandes que vous pouvez effectuer concernant vos données."
                            : "Simple information about requests you can make regarding your information."}
                    </p>
                </section>

                <article className="nt-legal-content">

                    <RightsSection
                        icon={<Database />}
                        title={
                            fr
                                ? "Accéder à vos données"
                                : "Access your information"
                        }
                    >
                        <p>
                            {fr
                                ? "Vous pouvez demander quelles informations sont associées à votre utilisation de NiceThings, sous réserve des exigences de vérification nécessaires."
                                : "You may ask what information is associated with your use of NiceThings, subject to any necessary verification requirements."}
                        </p>
                    </RightsSection>

                    <RightsSection
                        icon={<Download />}
                        title={
                            fr
                                ? "Demander une copie"
                                : "Request a copy"
                        }
                    >
                        <p>
                            {fr
                                ? "Lorsque cela est applicable, vous pouvez demander une copie des informations personnelles que NiceThings conserve à votre sujet."
                                : "Where applicable, you may request a copy of personal information NiceThings holds about you."}
                        </p>
                    </RightsSection>

                    <RightsSection
                        title={
                            fr
                                ? "Corriger une information"
                                : "Correct information"
                        }
                    >
                        <p>
                            {fr
                                ? "Si une information est incorrecte ou incomplète, vous pouvez demander sa correction."
                                : "If information is inaccurate or incomplete, you may request a correction."}
                        </p>
                    </RightsSection>

                    <RightsSection
                        icon={<Trash2 />}
                        title={
                            fr
                                ? "Demander la suppression"
                                : "Request deletion"
                        }
                    >
                        <p>
                            {fr
                                ? "Vous pouvez demander la suppression des données personnelles lorsque leur conservation n'est plus nécessaire ou lorsqu'une autre base légale ne justifie pas leur conservation."
                                : "You may request deletion of personal information where continued retention is no longer necessary or where another lawful basis does not require retention."}
                        </p>
                    </RightsSection>

                    <RightsSection
                        title={
                            fr
                                ? "Vérification"
                                : "Verification"
                        }
                    >
                        <p>
                            {fr
                                ? "Pour protéger les utilisateurs, NiceThings peut demander des informations raisonnables afin de vérifier l'identité du demandeur avant de traiter certaines demandes."
                                : "To protect users, NiceThings may request reasonable information to verify the identity of a requester before processing certain requests."}
                        </p>
                    </RightsSection>

                    <RightsSection
                        title={
                            fr
                                ? "Comment nous contacter"
                                : "How to contact us"
                        }
                    >
                        <p>
                            {fr
                                ? "Avant le lancement public, ajoutez ici votre adresse e-mail ou autre moyen officiel de contact dédié aux demandes relatives aux données."
                                : "Before public launch, add your official email address or other dedicated contact method for data-related requests here."}
                        </p>

                        <div className="nt-legal-contact-placeholder">
                            {fr
                                ? "Contact officiel à compléter"
                                : "Official contact to be added"}
                        </div>
                    </RightsSection>

                    <div className="nt-legal-footer">
                        <Link href="/legal/privacy">
                            {fr
                                ? "Confidentialité"
                                : "Privacy"}
                        </Link>

                        <Link href="/legal/terms">
                            {fr
                                ? "Conditions"
                                : "Terms"}
                        </Link>

                        <Link href="/legal/cookies">
                            Cookies
                        </Link>
                    </div>

                </article>

            </div>
        </main>
    );
}

function RightsSection({
    icon,
    title,
    children,
}) {
    return (
        <section className="nt-legal-section">

            {icon && (
                <div className="nt-legal-icon">
                    {icon}
                </div>
            )}

            <h2>
                {title}
            </h2>

            {children}

        </section>
    );
}