import { useState } from "react";
import Link from "next/link";
import {
    ArrowLeft,
    Cookie,
    Settings,
    Sparkles,
} from "lucide-react";

export default function CookiesPage() {
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
                    <Cookie
                        size={28}
                    />

                    <span>
                        NiceThings
                    </span>

                    <h1>
                        {fr
                            ? "Politique relative aux cookies"
                            : "Cookie Policy"}
                    </h1>

                    <p>
                        {fr
                            ? "Une explication simple de la façon dont NiceThings utilise les technologies de stockage."
                            : "A simple explanation of how NiceThings uses cookies and storage technologies."}
                    </p>
                </section>

                <article className="nt-legal-content">

                    <Section
                        title={
                            fr
                                ? "1. Que sont les cookies ?"
                                : "1. What are cookies?"
                        }
                    >
                        <p>
                            {fr
                                ? "Les cookies sont de petits éléments de données stockés par votre navigateur. NiceThings peut également utiliser localStorage et des technologies similaires pour conserver certaines informations nécessaires au fonctionnement de l'application."
                                : "Cookies are small pieces of data stored by your browser. NiceThings may also use localStorage and similar technologies to keep information needed for the application to function."}
                        </p>
                    </Section>

                    <Section
                        icon={
                            <Settings />
                        }
                        title={
                            fr
                                ? "2. Ce que NiceThings utilise"
                                : "2. What NiceThings uses"
                        }
                    >
                        <ul>
                            <li>
                                {fr
                                    ? "préférences de langue ;"
                                    : "language preferences;"}
                            </li>
                            <li>
                                {fr
                                    ? "identifiant de session du visiteur ;"
                                    : "visitor session identifier;"}
                            </li>
                            <li>
                                {fr
                                    ? "préférences et état de l'application ;"
                                    : "application preferences and state;"}
                            </li>
                            <li>
                                {fr
                                    ? "sessions d'administration sécurisées."
                                    : "secure administrator sessions."}
                            </li>
                        </ul>
                    </Section>

                    <Section
                        title={
                            fr
                                ? "3. Cookies nécessaires"
                                : "3. Necessary cookies"
                        }
                    >
                        <p>
                            {fr
                                ? "Certains éléments de stockage sont nécessaires pour que NiceThings fonctionne correctement. Ils peuvent notamment maintenir une session ou mémoriser une préférence."
                                : "Some storage technologies are necessary for NiceThings to work correctly. They may maintain a session or remember a preference."}
                        </p>
                    </Section>

                    <Section
                        title={
                            fr
                                ? "4. Localisation"
                                : "4. Location"
                        }
                    >
                        <p>
                            {fr
                                ? "La localisation n'est pas obtenue silencieusement. Le navigateur doit vous demander votre permission. Vous pouvez la refuser ou la désactiver dans les paramètres de votre appareil."
                                : "Location is not obtained silently. Your browser must request permission. You can refuse it or disable it through your device settings."}
                        </p>
                    </Section>

                    <Section
                        title={
                            fr
                                ? "5. Services tiers"
                                : "5. Third-party services"
                        }
                    >
                        <p>
                            {fr
                                ? "Certaines fonctionnalités peuvent utiliser des services tiers, notamment des services de cartographie. Ces services peuvent avoir leurs propres politiques relatives aux cookies et aux données."
                                : "Some features may use third-party services, including mapping services. Those services may have their own cookie and data policies."}
                        </p>
                    </Section>

                    <Section
                        title={
                            fr
                                ? "6. Contrôle"
                                : "6. Your control"
                        }
                    >
                        <p>
                            {fr
                                ? "Vous pouvez supprimer les données locales de NiceThings via les paramètres de votre navigateur. Cela peut vous déconnecter ou réinitialiser certaines préférences."
                                : "You can clear NiceThings local data through your browser settings. This may sign you out or reset certain preferences."}
                        </p>
                    </Section>

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

                        <Link href="/legal/data-rights">
                            {fr
                                ? "Droits sur les données"
                                : "Data rights"}
                        </Link>
                    </div>

                </article>

            </div>
        </main>
    );
}

function Section({
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