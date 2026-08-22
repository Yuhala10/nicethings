import { useEffect, useState } from "react";
import {
    ArrowRight,
    LockKeyhole,
    ShieldCheck,
    Sparkles,
} from "lucide-react";

export default function AdminLogin() {
    const [phone, setPhone] =
        useState("");

    const [code, setCode] =
        useState("");

    const [loading, setLoading] =
        useState(false);

    const [error, setError] =
        useState("");

    useEffect(() => {
        checkExistingSession();
    }, []);

    async function checkExistingSession() {
        try {
            const response =
                await fetch(
                    "/api/admin/me"
                );

            const data =
                await response.json();

            if (
                data.authenticated
            ) {
                window.location.href =
                    "/admin";
            }
        } catch {
            // Stay on login page.
        }
    }

    async function handleLogin(
        event
    ) {
        event.preventDefault();

        setError("");

        if (
            !phone.trim() ||
            !code.trim()
        ) {
            setError(
                "Enter your administrator phone number and code."
            );

            return;
        }

        setLoading(true);

        try {
            const response =
                await fetch(
                    "/api/admin/login",
                    {
                        method: "POST",
                        headers: {
                            "Content-Type":
                                "application/json",
                        },
                        body: JSON.stringify({
                            phone:
                                phone.trim(),
                            code:
                                code.trim(),
                        }),
                    }
                );

            const data =
                await response.json();

            if (!response.ok) {
                throw new Error(
                    data.error ||
                    "Unable to sign in."
                );
            }

            window.location.href =
                "/admin";
        } catch (error) {
            setError(
                error.message
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="nt-admin-login">

            <div className="nt-admin-login-glow" />

            <section className="nt-admin-login-card">

                <div className="nt-admin-brand-mark">
                    <Sparkles
                        size={22}
                    />
                </div>

                <div className="nt-admin-eyebrow">
                    <ShieldCheck
                        size={13}
                    />
                    NiceThings Control
                </div>

                <h1>
                    Welcome back.
                </h1>

                <p>
                    Sign in securely to manage
                    NiceThings.
                </p>

                <form
                    onSubmit={
                        handleLogin
                    }
                >
                    <label>
                        Administrator phone
                    </label>

                    <input
                        value={phone}
                        onChange={(event) =>
                            setPhone(
                                event.target
                                    .value
                            )
                        }
                        placeholder="681731512"
                        inputMode="tel"
                        autoComplete="username"
                    />

                    <label>
                        Administrator code
                    </label>

                    <div className="nt-admin-code-wrap">
                        <LockKeyhole
                            size={17}
                        />

                        <input
                            value={code}
                            onChange={(event) =>
                                setCode(
                                    event.target
                                        .value
                                )
                            }
                            placeholder="Private code"
                            type="password"
                            autoComplete="current-password"
                        />
                    </div>

                    {error && (
                        <div className="nt-admin-error">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="nt-button nt-button-primary"
                        disabled={
                            loading
                        }
                    >
                        {loading
                            ? "Signing in..."
                            : "Enter dashboard"}

                        {!loading && (
                            <ArrowRight
                                size={17}
                            />
                        )}
                    </button>
                </form>

                <div className="nt-admin-login-footer">
                    <span>
                        Protected administrator
                        area
                    </span>

                    <span>
                        NiceThings
                    </span>
                </div>
            </section>
        </main>
    );
}