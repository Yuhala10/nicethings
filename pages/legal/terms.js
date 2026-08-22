import { useState } from "react";
import Link from "next/link";
import {
    ArrowLeft,
    CheckCircle2,
    CreditCard,
    MapPin,
    Sparkles,
} from "lucide-react";

export default function TermsPage() {
    const [language, setLanguage] = useState("en");

    const fr = language === "fr";

    return (
        <LegalLayout
            title={
                fr
                    ? "Conditions d'utilisation"
                    : "Terms of Use"
            }
            subtitle={
                fr
                    ? "Les règles qui encadrent l'utilisation de NiceThings."
                    : "The rules governing your use of NiceThings."
            }
            language={language}
            setLanguage={setLanguage}
        >
            <Section
                icon={<CheckCircle2 />}
                title={
                    fr
                        ? "1. À propos de NiceThings"
                        : "1. About NiceThings"
                }
            >
                <p>
                    {fr
                        ? "NiceThings est une plateforme de découverte destinée à aider les utilisateurs à trouver des endroits intéressants autour d'eux, notamment des lieux où manger, boire ou passer un bon moment."
                        : "NiceThings is a discovery platform designed to help users find interesting places around them, including places to eat, drink or spend time."}
                </p>
            </Section>

            <Section
                icon={<CreditCard />}
                title={
                    fr
                        ? "2. Accès découverte"
                        : "2. Discovery access"
                }
            >
                <p>
                    {fr
                        ? "Certaines recherches nécessitent un accès découverte de 100 FCFA. Après validation manuelle du paiement, l'accès est activé pendant 24 heures."
                        : "Some searches require a 100 FCFA discovery access pass. After manual payment verification, access is activated for 24 hours."}
                </p>

                <p>
                    {fr
                        ? "Le délai de 24 heures commence à partir de l'activation et non au moment où la demande de paiement est envoyée."
                        : "The 24-hour period begins when access is activated, not when a payment request is submitted."}
                </p>

                <p>
                    {fr
                        ? "Un paiement en attente ne constitue pas une activation."
                        : "A pending payment does not constitute an activated pass."}
                </p>
            </Section>

            <Section
                title={
                    fr
                        ? "3. Paiements"
                        : "3. Payments"
                }
            >
                <p>
                    {fr
                        ? "Le paiement peut initialement être vérifié manuellement. L'utilisateur doit fournir une preuve suffisamment lisible permettant de vérifier la transaction."
                        : "Payments may initially be verified manually. Users must provide sufficiently clear proof that allows the transaction to be verified."}
                </p>

                <p>
                    {fr
                        ? "NiceThings peut rejeter une preuve qui ne peut pas être vérifiée ou qui semble irrégulière."
                        : "NiceThings may reject proof that cannot be verified or appears irregular."}
                </p>
            </Section>

            <Section
                icon={<MapPin />}
                title={
                    fr
                        ? "4. Informations sur les spots"
                        : "4. Spot information"
                }
            >
                <p>
                    {fr
                        ? "NiceThings fournit des informations de découverte. Les prix, horaires, menus, disponibilités et descriptions peuvent évoluer sans préavis."
                        : "NiceThings provides discovery information. Prices, hours, menus, availability and descriptions may change without notice."}
                </p>

                <p>
                    {fr
                        ? "Vous devez confirmer les informations importantes directement auprès du commerce lorsque nécessaire."
                        : "You should confirm important information directly with the business when necessary."}
                </p>
            </Section>

            <Section
                title={
                    fr
                        ? "5. Navigation"
                        : "5. Navigation"
                }
            >
                <p>
                    {fr
                        ? "Les directions peuvent utiliser des services de cartographie tiers. NiceThings ne contrôle pas les routes, fermetures, conditions de circulation ou changements de carte."
                        : "Directions may use third-party mapping services. NiceThings does not control roads, closures, traffic conditions or map changes."}
                </p>
            </Section>

            <Section
                title={
                    fr
                        ? "6. Introduire un spot"
                        : "6. Introducing a spot"
                }
            >
                <p>
                    {fr
                        ? "Toute personne peut proposer un spot. Les informations doivent être honnêtes, utiles et ne pas contenir de contenu illégal, frauduleux, trompeur ou portant atteinte aux droits d'autrui."
                        : "Anyone may suggest a spot. Information should be honest and useful and must not contain illegal, fraudulent, misleading or rights-infringing content."}
                </p>

                <p>
                    {fr
                        ? "NiceThings peut vérifier, modifier, refuser, suspendre ou supprimer une proposition."
                        : "NiceThings may verify, edit, reject, suspend or remove a submission."}
                </p>
            </Section>

            <Section
                title={
                    fr
                        ? "7. Avis"
                        : "7. Reviews"
                }
            >
                <p>
                    {fr
                        ? "Les avis doivent refléter une expérience réelle. Les faux avis, manipulations, contenus offensants ou tentatives de manipulation du classement peuvent être supprimés."
                        : "Reviews should reflect genuine experiences. Fake reviews, manipulation, abusive content or attempts to manipulate rankings may be removed."}
                </p>
            </Section>

            <Section
                title={
                    fr
                        ? "8. Disponibilité du service"
                        : "8. Service availability"
                }
            >
                <p>
                    {fr
                        ? "Nous cherchons à maintenir NiceThings disponible et fiable, mais aucun service en ligne ne peut être garanti sans interruption."
                        : "We aim to keep NiceThings available and reliable, but no online service can be guaranteed to operate without interruption."}
                </p>
            </Section>

            <Section
                title={
                    fr
                        ? "9. Utilisation interdite"
                        : "9. Prohibited use"
                }
            >
                <ul>
                    <li>
                        {fr
                            ? "fraude ou tentative de fraude ;"
                            : "fraud or attempted fraud;"}
                    </li>
                    <li>
                        {fr
                            ? "soumission répétée de fausses informations ;"
                            : "repeated submission of false information;"}
                    </li>
                    <li>
                        {fr
                            ? "abus du système de paiement ;"
                            : "payment abuse;"}
                    </li>
                    <li>
                        {fr
                            ? "attaque ou tentative de contournement de la sécurité ;"
                            : "attacking or attempting to bypass security;"}
                    </li>
                    <li>
                        {fr
                            ? "utilisation du service à des fins illégales."
                            : "using the service for unlawful purposes."}
                    </li>
                </ul>
            </Section>

            <Section
                title={
                    fr
                        ? "10. Contact"
                        : "10. Contact"
                }
            >
                <p>
                    {fr
                        ? "Les coordonnées officielles de NiceThings doivent être ajoutées avant le lancement commercial."
                        : "Official NiceThings contact details should be added before commercial launch."}
                </p>
            </Section>

            <div className="nt-legal-footer">
                <Link href="/legal/privacy">
                    {fr
                        ? "Confidentialité"
                        : "Privacy"}
                </Link>

                <Link href="/legal/cookies">
                    Cookies
                </Link>

                <Link href="/legal/data-rights">
                    {fr
                        ? "Droits sur les données"
                        : "Data rights"}
                </Link>
            </div>
        </LegalLayout>
    );
}

function LegalLayout({
    title,
    subtitle,
    language,
    setLanguage,
    children,
}) {
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
                                language === "en"
                                    ? "active"
                                    : ""
                            }
                            onClick={() =>
                                setLanguage("en")
                            }
                        >
                            EN
                        </button>

                        <button
                            className={
                                language === "fr"
                                    ? "active"
                                    : ""
                            }
                            onClick={() =>
                                setLanguage("fr")
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
                    {language === "fr"
                        ? "Retour"
                        : "Back"}
                </Link>

                <section className="nt-legal-hero">
                    <span>
                        NiceThings
                    </span>

                    <h1>
                        {title}
                    </h1>

                    <p>
                        {subtitle}
                    </p>
                </section>

                <article className="nt-legal-content">
                    {children}
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