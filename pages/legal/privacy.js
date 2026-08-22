import { useState } from "react";
import Link from "next/link";
import {
    ArrowLeft,
    Database,
    Globe,
    Lock,
    MapPin,
    ShieldCheck,
    Sparkles,
} from "lucide-react";

export default function PrivacyPage() {
    const [language, setLanguage] = useState("en");

    const fr = language === "fr";

    return (
        <LegalLayout
            title={
                fr
                    ? "Politique de confidentialité"
                    : "Privacy Policy"
            }
            subtitle={
                fr
                    ? "Comment NiceThings collecte, utilise et protège vos informations."
                    : "How NiceThings collects, uses and protects your information."
            }
            language={language}
            setLanguage={setLanguage}
        >
            <LegalSection
                icon={<ShieldCheck />}
                title={
                    fr
                        ? "1. Notre engagement"
                        : "1. Our commitment"
                }
            >
                <p>
                    {fr
                        ? "NiceThings est conçu pour vous aider à découvrir de bons endroits autour de vous avec le minimum d'informations nécessaires. Nous cherchons à utiliser vos données uniquement pour faire fonctionner, sécuriser et améliorer le service."
                        : "NiceThings is designed to help you discover great places around you while using only the information reasonably necessary. We use information to operate, secure and improve the service."}
                </p>
            </LegalSection>

            <LegalSection
                icon={<Database />}
                title={
                    fr
                        ? "2. Informations collectées"
                        : "2. Information we collect"
                }
            >
                <p>
                    {fr
                        ? "Selon les fonctionnalités que vous utilisez, NiceThings peut traiter :"
                        : "Depending on the features you use, NiceThings may process:"}
                </p>

                <ul>
                    <li>
                        {fr
                            ? "un identifiant de session anonyme ;"
                            : "an anonymous visitor/session identifier;"}
                    </li>
                    <li>
                        {fr
                            ? "votre langue préférée ;"
                            : "your preferred language;"}
                    </li>
                    <li>
                        {fr
                            ? "votre position lorsque vous autorisez l'accès à votre localisation ;"
                            : "your location when you grant location permission;"}
                    </li>
                    <li>
                        {fr
                            ? "vos critères de recherche ;"
                            : "your search criteria;"}
                    </li>
                    <li>
                        {fr
                            ? "les informations relatives aux paiements et preuves de paiement que vous envoyez ;"
                            : "payment information and payment proofs you submit;"}
                    </li>
                    <li>
                        {fr
                            ? "les informations que vous fournissez volontairement lors de l'introduction d'un spot ;"
                            : "information you voluntarily provide when introducing a spot;"}
                    </li>
                    <li>
                        {fr
                            ? "vos avis et évaluations ;"
                            : "your reviews and ratings;"}
                    </li>
                    <li>
                        {fr
                            ? "des informations techniques nécessaires au fonctionnement et à la sécurité du site."
                            : "technical information necessary for operation and security."}
                    </li>
                </ul>
            </LegalSection>

            <LegalSection
                icon={<MapPin />}
                title={
                    fr
                        ? "3. Localisation"
                        : "3. Location information"
                }
            >
                <p>
                    {fr
                        ? "NiceThings peut demander l'accès à la localisation de votre téléphone afin de trouver des spots proches de vous. Cette permission est contrôlée par votre navigateur ou votre appareil."
                        : "NiceThings may request access to your device location to find places near you. This permission is controlled by your browser or device."}
                </p>

                <p>
                    {fr
                        ? "Vous pouvez refuser cette permission. Certaines fonctionnalités de découverte basées sur la distance peuvent alors être limitées."
                        : "You can refuse this permission. Some distance-based discovery features may then be limited."}
                </p>
            </LegalSection>

            <LegalSection
                icon={<Lock />}
                title={
                    fr
                        ? "4. Paiements et preuves"
                        : "4. Payments and payment proofs"
                }
            >
                <p>
                    {fr
                        ? "L'accès découverte coûte 100 FCFA pour une période de 24 heures après validation. NiceThings peut vous demander une capture ou une autre preuve de transaction afin de vérifier manuellement le paiement."
                        : "Discovery access costs 100 FCFA for a 24-hour period after approval. NiceThings may request a screenshot or other transaction proof so that payment can be manually verified."}
                </p>

                <p>
                    {fr
                        ? "Les preuves de paiement sont destinées à la vérification administrative et doivent être conservées de manière sécurisée."
                        : "Payment proofs are used for administrative verification and should be stored securely."}
                </p>
            </LegalSection>

            <LegalSection
                icon={<Globe />}
                title={
                    fr
                        ? "5. Utilisation des informations"
                        : "5. How information is used"
                }
            >
                <p>
                    {fr
                        ? "Nous pouvons utiliser les informations pour fournir les recherches, vérifier les paiements, enregistrer les découvertes, améliorer les recommandations, prévenir les abus, traiter les demandes et améliorer NiceThings."
                        : "We may use information to provide searches, verify payments, record discoveries, improve recommendations, prevent abuse, process requests and improve NiceThings."}
                </p>
            </LegalSection>

            <LegalSection
                title={
                    fr
                        ? "6. Spots et informations publiques"
                        : "6. Spots and public information"
                }
            >
                <p>
                    {fr
                        ? "Les informations relatives aux spots peuvent être affichées publiquement afin de permettre leur découverte. Certaines informations peuvent provenir d'utilisateurs, de commerces ou de l'équipe NiceThings."
                        : "Spot information may be displayed publicly so people can discover places. Some information may come from users, businesses or the NiceThings team."}
                </p>

                <p>
                    {fr
                        ? "Nous faisons des efforts raisonnables pour vérifier les informations, mais les prix, horaires, disponibilités et autres détails peuvent changer."
                        : "We make reasonable efforts to verify information, but prices, opening hours, availability and other details may change."}
                </p>
            </LegalSection>

            <LegalSection
                title={
                    fr
                        ? "7. Vos droits et demandes"
                        : "7. Your rights and requests"
                }
            >
                <p>
                    {fr
                        ? "Vous pouvez nous contacter pour demander des informations sur les données associées à votre utilisation de NiceThings, demander une correction ou demander la suppression lorsque cela est applicable."
                        : "You may contact us to ask about information associated with your use of NiceThings, request a correction or request deletion where applicable."}
                </p>

                <p>
                    <strong>
                        NiceThings
                    </strong>
                    <br />
                    {fr
                        ? "Contact : à compléter avant lancement public."
                        : "Contact: to be completed before public launch."}
                </p>
            </LegalSection>

            <LegalSection
                title={
                    fr
                        ? "8. Modifications"
                        : "8. Changes"
                }
            >
                <p>
                    {fr
                        ? "Cette politique peut être mise à jour lorsque NiceThings évolue ou lorsque les exigences applicables changent."
                        : "This policy may be updated as NiceThings evolves or applicable requirements change."}
                </p>
            </LegalSection>

            <LegalFooter
                fr={fr}
            />
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
                </header>

                <Link
                    href="/"
                    className="nt-legal-back"
                >
                    <ArrowLeft
                        size={15}
                    />
                    {language === "fr"
                        ? "Retour à NiceThings"
                        : "Back to NiceThings"}
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

function LegalSection({
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

function LegalFooter({ fr }) {
    return (
        <div className="nt-legal-footer">
            <Link href="/legal/terms">
                {fr
                    ? "Conditions"
                    : "Terms"}
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
    );
}