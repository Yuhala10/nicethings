import { useEffect, useState } from "react";
import Link from "next/link";


const CONSENT_VERSION = "1.0";


export default function ConsentPopup() {

    const [visible, setVisible] =
        useState(false);

    const [accepted, setAccepted] =
        useState(false);


    /* =====================================================
       CHECK EXISTING CONSENT
    ====================================================== */

    useEffect(() => {

        try {

            const savedVersion =
                window.localStorage.getItem(
                    "nicethings_consent_version"
                );


            if (
                savedVersion !==
                CONSENT_VERSION
            ) {
                setVisible(true);
            }

        } catch (error) {

            console.error(
                "Consent check error:",
                error
            );

            /*
             * If localStorage is unavailable,
             * show the consent screen.
             */

            setVisible(true);
        }

    }, []);


    /* =====================================================
       ACCEPT
    ====================================================== */

    function handleAccept() {

        if (!accepted) {
            return;
        }


        try {

            window.localStorage.setItem(
                "nicethings_consent_version",
                CONSENT_VERSION
            );


            window.localStorage.setItem(
                "nicethings_consent_accepted_at",
                new Date().toISOString()
            );


            setVisible(false);

        } catch (error) {

            console.error(
                "Consent save error:",
                error
            );
        }
    }


    /*
     * Don't render anything after acceptance.
     */

    if (!visible) {
        return null;
    }


    return (
        <div
            style={{
                position:
                    "fixed",

                inset:
                    0,

                zIndex:
                    999999,

                display:
                    "flex",

                alignItems:
                    "center",

                justifyContent:
                    "center",

                padding:
                    "20px",

                background:
                    "rgba(15, 23, 42, 0.72)",

                backdropFilter:
                    "blur(8px)",

                WebkitBackdropFilter:
                    "blur(8px)",
            }}
        >

            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="nicethings-consent-title"
                style={{
                    width:
                        "min(520px, 100%)",

                    maxHeight:
                        "90vh",

                    overflowY:
                        "auto",

                    background:
                        "#ffffff",

                    borderRadius:
                        "24px",

                    padding:
                        "28px",

                    boxShadow:
                        "0 25px 80px rgba(0,0,0,0.30)",
                }}
            >

                {/* =================================================
                   HEADER
                ================================================== */}

                <div
                    style={{
                        textAlign:
                            "center",

                        marginBottom:
                            "22px",
                    }}
                >

                    <div
                        style={{
                            width:
                                "58px",

                            height:
                                "58px",

                            margin:
                                "0 auto 14px",

                            borderRadius:
                                "18px",

                            display:
                                "flex",

                            alignItems:
                                "center",

                            justifyContent:
                                "center",

                            background:
                                "#f97316",

                            color:
                                "#ffffff",

                            fontSize:
                                "27px",

                            fontWeight:
                                900,
                        }}
                    >
                        N
                    </div>


                    <h2
                        id="nicethings-consent-title"
                        style={{
                            margin:
                                0,

                            color:
                                "#111827",

                            fontSize:
                                "24px",

                            fontWeight:
                                900,
                        }}
                    >
                        Welcome to NiceThings
                    </h2>


                    <p
                        style={{
                            margin:
                                "9px 0 0",

                            color:
                                "#6b7280",

                            fontSize:
                                "14px",

                            lineHeight:
                                1.6,
                        }}
                    >
                        Before you continue, please
                        review and accept our terms,
                        privacy information and cookie
                        notice.
                    </p>

                </div>


                {/* =================================================
                   INFORMATION
                ================================================== */}

                <div
                    style={{
                        display:
                            "grid",

                        gap:
                            "12px",

                        marginBottom:
                            "22px",
                    }}
                >

                    <div
                        style={{
                            padding:
                                "15px",

                            borderRadius:
                                "15px",

                            background:
                                "#fff7ed",

                            border:
                                "1px solid #fed7aa",
                        }}
                    >

                        <strong
                            style={{
                                display:
                                    "block",

                                color:
                                    "#9a3412",

                                fontSize:
                                    "14px",

                                marginBottom:
                                    "5px",
                            }}
                        >
                            🍪 Cookies
                        </strong>

                        <span
                            style={{
                                color:
                                    "#7c2d12",

                                fontSize:
                                    "12px",

                                lineHeight:
                                    1.55,
                            }}
                        >
                            NiceThings may use
                            essential browser storage
                            and cookies to keep the
                            application working and
                            remember your preferences.
                        </span>

                    </div>


                    <div
                        style={{
                            padding:
                                "15px",

                            borderRadius:
                                "15px",

                            background:
                                "#f9fafb",

                            border:
                                "1px solid #e5e7eb",
                        }}
                    >

                        <strong
                            style={{
                                display:
                                    "block",

                                color:
                                    "#111827",

                                fontSize:
                                    "14px",

                                marginBottom:
                                    "5px",
                            }}
                        >
                            📜 Terms & Conditions
                        </strong>

                        <span
                            style={{
                                color:
                                    "#6b7280",

                                fontSize:
                                    "12px",

                                lineHeight:
                                    1.55,
                            }}
                        >
                            By using NiceThings, you
                            agree to use the service
                            responsibly and provide
                            accurate information when
                            contributing places.
                        </span>

                    </div>


                    <div
                        style={{
                            padding:
                                "15px",

                            borderRadius:
                                "15px",

                            background:
                                "#f9fafb",

                            border:
                                "1px solid #e5e7eb",
                        }}
                    >

                        <strong
                            style={{
                                display:
                                    "block",

                                color:
                                    "#111827",

                                fontSize:
                                    "14px",

                                marginBottom:
                                    "5px",
                            }}
                        >
                            🔒 Privacy
                        </strong>

                        <span
                            style={{
                                color:
                                    "#6b7280",

                                fontSize:
                                    "12px",

                                lineHeight:
                                    1.55,
                            }}
                        >
                            Your information may be
                            processed to provide
                            NiceThings services,
                            protect the platform and
                            improve the experience.
                        </span>

                    </div>

                </div>


                {/* =================================================
                   LINKS
                ================================================== */}

                <div
                    style={{
                        display:
                            "flex",

                        justifyContent:
                            "center",

                        gap:
                            "18px",

                        flexWrap:
                            "wrap",

                        marginBottom:
                            "22px",
                    }}
                >

                    <Link
                        href="/legal/terms"
                        style={{
                            color:
                                "#ea580c",

                            fontSize:
                                "12px",

                            fontWeight:
                                800,

                            textDecoration:
                                "none",
                        }}
                    >
                        Terms & Conditions
                    </Link>


                    <Link
                        href="/legal/privacy"
                        style={{
                            color:
                                "#ea580c",

                            fontSize:
                                "12px",

                            fontWeight:
                                800,

                            textDecoration:
                                "none",
                        }}
                    >
                        Privacy Policy
                    </Link>


                    <Link
                        href="/legal/cookies"
                        style={{
                            color:
                                "#ea580c",

                            fontSize:
                                "12px",

                            fontWeight:
                                800,

                            textDecoration:
                                "none",
                        }}
                    >
                        Cookie Notice
                    </Link>

                </div>


                {/* =================================================
                   CHECKBOX
                ================================================== */}

                <label
                    style={{
                        display:
                            "flex",

                        alignItems:
                            "flex-start",

                        gap:
                            "12px",

                        padding:
                            "15px",

                        borderRadius:
                            "15px",

                        border:
                            accepted
                                ? "2px solid #f97316"
                                : "1px solid #d1d5db",

                        background:
                            accepted
                                ? "#fff7ed"
                                : "#ffffff",

                        cursor:
                            "pointer",

                        marginBottom:
                            "18px",
                    }}
                >

                    <input
                        type="checkbox"
                        checked={
                            accepted
                        }
                        onChange={(
                            event
                        ) =>
                            setAccepted(
                                event.target.checked
                            )
                        }
                        style={{
                            width:
                                "20px",

                            height:
                                "20px",

                            marginTop:
                                "1px",

                            accentColor:
                                "#f97316",

                            flexShrink:
                                0,
                        }}
                    />


                    <span
                        style={{
                            color:
                                "#374151",

                            fontSize:
                                "13px",

                            lineHeight:
                                1.55,

                            fontWeight:
                                600,
                        }}
                    >
                        I have read and agree to
                        the NiceThings Terms &
                        Conditions, Privacy Policy
                        and Cookie Notice.
                    </span>

                </label>


                {/* =================================================
                   ACCEPT BUTTON
                ================================================== */}

                <button
                    type="button"
                    onClick={
                        handleAccept
                    }
                    disabled={
                        !accepted
                    }
                    style={{
                        width:
                            "100%",

                        minHeight:
                            "52px",

                        border:
                            "none",

                        borderRadius:
                            "15px",

                        background:
                            accepted
                                ? "#f97316"
                                : "#d1d5db",

                        color:
                            "#ffffff",

                        fontSize:
                            "14px",

                        fontWeight:
                            900,

                        cursor:
                            accepted
                                ? "pointer"
                                : "not-allowed",

                        transition:
                            "all 0.2s ease",

                        boxShadow:
                            accepted
                                ? "0 8px 20px rgba(249,115,22,0.25)"
                                : "none",
                    }}
                >
                    Accept & Continue
                </button>


                <p
                    style={{
                        textAlign:
                            "center",

                        margin:
                            "14px 0 0",

                        color:
                            "#9ca3af",

                        fontSize:
                            "10px",

                        lineHeight:
                            1.5,
                    }}
                >
                    You must accept these terms
                    to continue using NiceThings.
                </p>

            </div>

        </div>
    );
}