import { useEffect, useState } from "react";

import {
    ArrowRight,
    LockKeyhole,
    ShieldCheck,
    Sparkles,
} from "lucide-react";

import { useLanguage } from "../../lib/i18n";


export default function AdminLogin() {
    const {
        language,
        setLanguage,
    } = useLanguage();

    const [
        phone,
        setPhone,
    ] = useState("");

    const [
        code,
        setCode,
    ] = useState("");

    const [
        loading,
        setLoading,
    ] = useState(false);

    const [
        checkingSession,
        setCheckingSession,
    ] = useState(true);

    const [
        error,
        setError,
    ] = useState("");


    const french =
        language === "fr";


    /* =====================================================
       CHECK EXISTING ADMIN SESSION
    ====================================================== */

    useEffect(() => {
        checkExistingSession();
    }, []);


    async function checkExistingSession() {
        try {
            const response =
                await fetch(
                    "/api/admin/me",
                    {
                        method:
                            "GET",
                        credentials:
                            "include",
                    }
                );


            const data =
                await response.json();


            if (
                data.authenticated
            ) {
                window.location.replace(
                    "/admin"
                );

                return;
            }
        } catch (
        sessionError
        ) {
            console.error(
                "Admin session check:",
                sessionError
            );
        } finally {
            setCheckingSession(
                false
            );
        }
    }


    /* =====================================================
       LOGIN
    ====================================================== */

    async function handleLogin(
        event
    ) {
        event.preventDefault();

        setError("");


        const cleanPhone =
            phone.trim();

        const cleanCode =
            code.trim();


        if (
            !cleanPhone ||
            !cleanCode
        ) {
            setError(
                french
                    ? "Entrez votre numéro administrateur et votre code."
                    : "Enter your administrator phone number and code."
            );

            return;
        }


        setLoading(
            true
        );


        try {
            const response =
                await fetch(
                    "/api/admin/login",
                    {
                        method:
                            "POST",

                        headers: {
                            "Content-Type":
                                "application/json",
                        },

                        credentials:
                            "include",

                        body:
                            JSON.stringify({
                                phone:
                                    cleanPhone,

                                code:
                                    cleanCode,
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
                            ? "Impossible de vous connecter."
                            : "Unable to sign in."
                    )
                );
            }


            window.location.replace(
                "/admin"
            );
        } catch (
        loginError
        ) {
            console.error(
                "Admin login error:",
                loginError
            );

            setError(
                loginError.message ||
                (
                    french
                        ? "Impossible de vous connecter."
                        : "Unable to sign in."
                )
            );
        } finally {
            setLoading(
                false
            );
        }
    }


    /* =====================================================
       SESSION CHECK SCREEN
    ====================================================== */

    if (
        checkingSession
    ) {
        return (
            <main
                className="nt-admin-login"
            >

                <div
                    className="nt-admin-login-glow"
                />


                <section
                    className="nt-admin-login-card"
                >

                    <div
                        className="nt-admin-brand-mark"
                    >
                        <Sparkles
                            size={22}
                        />
                    </div>


                    <div
                        className="nt-admin-eyebrow"
                    >

                        <ShieldCheck
                            size={13}
                        />

                        NiceThings Control

                    </div>


                    <p
                        style={{
                            marginTop:
                                "20px",
                        }}
                    >
                        {french
                            ? "Vérification de votre session..."
                            : "Checking your session..."}
                    </p>

                </section>

            </main>
        );
    }


    /* =====================================================
       LOGIN PAGE
    ====================================================== */

    return (
        <main
            className="nt-admin-login"
        >

            <div
                className="nt-admin-login-glow"
            />


            <section
                className="nt-admin-login-card"
            >

                {/* =========================================
                    BRAND
                ========================================== */}

                <div
                    className="nt-admin-brand-mark"
                >
                    <Sparkles
                        size={22}
                    />
                </div>


                <div
                    className="nt-admin-eyebrow"
                >

                    <ShieldCheck
                        size={13}
                    />

                    NiceThings Control

                </div>


                {/* =========================================
                    LANGUAGE
                ========================================== */}

                <div
                    className="nt-language-switch"
                    style={{
                        marginTop:
                            "14px",
                    }}
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


                {/* =========================================
                    INTRO
                ========================================== */}

                <h1>
                    {french
                        ? "Bienvenue."
                        : "Welcome back."}
                </h1>


                <p>
                    {french
                        ? "Connectez-vous pour gérer NiceThings en toute sécurité."
                        : "Sign in securely to manage NiceThings."}
                </p>


                {/* =========================================
                    FORM
                ========================================== */}

                <form
                    onSubmit={
                        handleLogin
                    }
                >

                    {/* PHONE */}

                    <label
                        htmlFor="admin-phone"
                    >
                        {french
                            ? "Numéro administrateur"
                            : "Administrator phone"}
                    </label>


                    <input
                        id="admin-phone"
                        value={
                            phone
                        }
                        onChange={event =>
                            setPhone(
                                event
                                    .target
                                    .value
                            )
                        }
                        placeholder="681731512"
                        inputMode="tel"
                        autoComplete="username"
                        disabled={
                            loading
                        }
                    />


                    {/* CODE */}

                    <label
                        htmlFor="admin-code"
                    >
                        {french
                            ? "Code administrateur"
                            : "Administrator code"}
                    </label>


                    <div
                        className="nt-admin-code-wrap"
                    >

                        <LockKeyhole
                            size={17}
                        />


                        <input
                            id="admin-code"
                            value={
                                code
                            }
                            onChange={event =>
                                setCode(
                                    event
                                        .target
                                        .value
                                )
                            }
                            placeholder={
                                french
                                    ? "Code privé"
                                    : "Private code"
                            }
                            type="password"
                            autoComplete="current-password"
                            disabled={
                                loading
                            }
                        />

                    </div>


                    {/* ERROR */}

                    {error && (
                        <div
                            className="nt-admin-error"
                            role="alert"
                        >
                            {error}
                        </div>
                    )}


                    {/* SUBMIT */}

                    <button
                        type="submit"
                        className="nt-button nt-button-primary"
                        disabled={
                            loading
                        }
                    >

                        {loading
                            ? french
                                ? "Connexion..."
                                : "Signing in..."
                            : french
                                ? "Ouvrir le tableau de bord"
                                : "Enter dashboard"}


                        {!loading && (
                            <ArrowRight
                                size={17}
                            />
                        )}

                    </button>

                </form>


                {/* =========================================
                    FOOTER
                ========================================== */}

                <div
                    className="nt-admin-login-footer"
                >

                    <span>
                        {french
                            ? "Zone administrateur protégée"
                            : "Protected administrator area"}
                    </span>


                    <span>
                        NiceThings
                    </span>

                </div>

            </section>

        </main>
    );
}