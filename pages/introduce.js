import { useState } from "react";

import {
    ArrowLeft,
    Check,
    MapPin,
    Send,
    Sparkles,
} from "lucide-react";

import AppShell from "../components/layout/AppShell";
import { useLanguage } from "../lib/i18n";
import { NICE_THINGS } from "../lib/constants";


export default function IntroducePage() {
    const {
        language,
        setLanguage,
        t,
    } = useLanguage();


    /* =====================================================
       FORM
    ====================================================== */

    const [form, setForm] =
        useState({
            name: "",
            category: "",
            description: "",
            address: "",
            neighborhood: "",
            city:
                NICE_THINGS.defaultCity ||
                "Yaoundé",
            phone: "",
            whatsapp: "",
            estimatedPrice: "",
            submittedByName: "",
            submittedByPhone: "",
        });


    const [loading, setLoading] =
        useState(false);

    const [submitted, setSubmitted] =
        useState(false);

    const [error, setError] =
        useState("");


    /* =====================================================
       UPDATE FORM
    ====================================================== */

    function update(
        field,
        value
    ) {
        setForm(
            current => ({
                ...current,
                [field]: value,
            })
        );
    }


    /* =====================================================
       CATEGORY NAME
    ====================================================== */

    function getCategoryName(
        category
    ) {
        if (!category) {
            return "";
        }

        if (
            language === "fr"
        ) {
            return (
                category.fr ||
                category.en ||
                category.id
            );
        }

        return (
            category.en ||
            category.fr ||
            category.id
        );
    }


    /* =====================================================
       SUBMIT
    ====================================================== */

    async function submit(
        event
    ) {
        event.preventDefault();

        setError("");


        if (
            !form.name.trim() ||
            !form.address.trim()
        ) {
            setError(
                t(
                    "introduceRequired"
                )
            );

            return;
        }


        let visitorId =
            null;


        if (
            typeof window !==
            "undefined"
        ) {
            visitorId =
                localStorage.getItem(
                    "nicethings_visitor_id"
                );
        }


        setLoading(true);


        try {
            const response =
                await fetch(
                    "/api/spots/introduce",
                    {
                        method:
                            "POST",

                        headers: {
                            "Content-Type":
                                "application/json",
                        },

                        body:
                            JSON.stringify({
                                visitorId,
                                ...form,

                                name:
                                    form.name.trim(),

                                category:
                                    form.category ||
                                    null,

                                description:
                                    form.description.trim() ||
                                    null,

                                address:
                                    form.address.trim(),

                                neighborhood:
                                    form.neighborhood.trim() ||
                                    null,

                                city:
                                    form.city.trim() ||
                                    NICE_THINGS.defaultCity ||
                                    "Yaoundé",

                                phone:
                                    form.phone.trim() ||
                                    null,

                                whatsapp:
                                    form.whatsapp.trim() ||
                                    null,

                                estimatedPrice:
                                    form.estimatedPrice
                                        ? Number(
                                            form.estimatedPrice
                                        )
                                        : null,

                                submittedByName:
                                    form.submittedByName.trim() ||
                                    null,

                                submittedByPhone:
                                    form.submittedByPhone.trim() ||
                                    null,
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
                    t(
                        "introduceError"
                    )
                );
            }


            setSubmitted(
                true
            );
        } catch (
        submitError
        ) {
            console.error(
                "NiceThings introduce error:",
                submitError
            );

            setError(
                submitError.message ||
                t(
                    "introduceError"
                )
            );
        } finally {
            setLoading(
                false
            );
        }
    }


    /* =====================================================
       SUCCESS
    ====================================================== */

    if (
        submitted
    ) {
        return (
            <AppShell>

                <main
                    className="nt-introduce-page"
                >

                    <div
                        className="nt-introduce-success"
                    >

                        <div
                            className="nt-success-icon"
                        >
                            <Check
                                size={30}
                            />
                        </div>


                        <Sparkles
                            size={17}
                        />


                        <h1>
                            {t(
                                "introduceSuccessTitle"
                            )}
                        </h1>


                        <p>
                            {t(
                                "introduceSuccessDescription"
                            )}
                        </p>


                        <button
                            type="button"
                            className="nt-introduce-primary"
                            onClick={() =>
                                window.location.href =
                                "/"
                            }
                        >
                            {t(
                                "backToNiceThings"
                            )}
                        </button>

                    </div>

                </main>

            </AppShell>
        );
    }


    /* =====================================================
       PAGE
    ====================================================== */

    return (
        <AppShell>

            <main
                className="nt-introduce-page"
            >

                <div
                    className="nt-introduce-shell"
                >

                    {/* =================================================
                        HEADER
                    ================================================== */}

                    <header
                        className="nt-introduce-header"
                    >

                        <button
                            type="button"
                            onClick={() =>
                                window.history.back()
                            }
                        >

                            <ArrowLeft
                                size={17}
                            />

                            {t(
                                "back"
                            )}

                        </button>


                        <div>

                            <Sparkles
                                size={16}
                            />

                            NiceThings

                        </div>


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

                    </header>


                    {/* =================================================
                        HERO
                    ================================================== */}

                    <section
                        className="nt-introduce-hero"
                    >

                        <div
                            className="nt-introduce-eyebrow"
                        >

                            <MapPin
                                size={13}
                            />

                            {t(
                                "introduceEyebrow"
                            )}

                        </div>


                        <h1>
                            {t(
                                "introduceTitle"
                            )}
                        </h1>


                        <p>
                            {t(
                                "introduceDescription"
                            )}
                        </p>

                    </section>


                    {/* =================================================
                        FORM
                    ================================================== */}

                    <form
                        className="nt-introduce-form"
                        onSubmit={
                            submit
                        }
                    >

                        {/* =================================================
                            NAME
                        ================================================== */}

                        <FormInput
                            label={t(
                                "spotName"
                            )}
                            required
                            value={
                                form.name
                            }
                            onChange={value =>
                                update(
                                    "name",
                                    value
                                )
                            }
                            placeholder={t(
                                "spotNamePlaceholder"
                            )}
                        />


                        {/* =================================================
                            CATEGORY
                        ================================================== */}

                        <div
                            className="nt-introduce-category-field"
                        >

                            <label>
                                {t(
                                    "category"
                                )}
                            </label>


                            <p
                                style={{
                                    margin:
                                        "4px 0 12px",
                                    color:
                                        "var(--nt-muted)",
                                    fontSize:
                                        "0.78rem",
                                }}
                            >
                                {t(
                                    "introduceCategoryHelp"
                                )}
                            </p>


                            <div
                                className="nt-category-grid"
                            >

                                {NICE_THINGS.categories.map(
                                    item => {

                                        const selected =
                                            form.category ===
                                            item.id;


                                        return (
                                            <button
                                                key={
                                                    item.id
                                                }
                                                type="button"
                                                className={
                                                    selected
                                                        ? "nt-category-card selected"
                                                        : "nt-category-card"
                                                }
                                                onClick={() =>
                                                    update(
                                                        "category",
                                                        selected
                                                            ? ""
                                                            : item.id
                                                    )
                                                }
                                                aria-pressed={
                                                    selected
                                                }
                                            >

                                                <div
                                                    className="nt-category-icon"
                                                >

                                                    <span
                                                        aria-hidden="true"
                                                    >
                                                        {
                                                            item.icon
                                                        }
                                                    </span>

                                                </div>


                                                <strong>
                                                    {getCategoryName(
                                                        item
                                                    )}
                                                </strong>

                                            </button>
                                        );
                                    }
                                )}

                            </div>

                        </div>


                        {/* =================================================
                            NEIGHBORHOOD
                        ================================================== */}

                        <FormInput
                            label={t(
                                "neighborhood"
                            )}
                            value={
                                form.neighborhood
                            }
                            onChange={value =>
                                update(
                                    "neighborhood",
                                    value
                                )
                            }
                            placeholder={t(
                                "neighborhoodPlaceholder"
                            )}
                        />


                        {/* =================================================
                            ADDRESS
                        ================================================== */}

                        <FormInput
                            label={t(
                                "address"
                            )}
                            required
                            value={
                                form.address
                            }
                            onChange={value =>
                                update(
                                    "address",
                                    value
                                )
                            }
                            placeholder={t(
                                "addressPlaceholder"
                            )}
                        />


                        {/* =================================================
                            CITY
                        ================================================== */}

                        <FormInput
                            label={t(
                                "city"
                            )}
                            value={
                                form.city
                            }
                            onChange={value =>
                                update(
                                    "city",
                                    value
                                )
                            }
                            placeholder={t(
                                "cityPlaceholder"
                            )}
                        />


                        {/* =================================================
                            PRICE
                        ================================================== */}

                        <FormInput
                            label={t(
                                "approximateSpend"
                            )}
                            value={
                                form.estimatedPrice
                            }
                            onChange={value =>
                                update(
                                    "estimatedPrice",
                                    value
                                )
                            }
                            type="number"
                            min="0"
                            placeholder={t(
                                "approximateSpendPlaceholder"
                            )}
                        />


                        {/* =================================================
                            PHONE
                        ================================================== */}

                        <FormInput
                            label={t(
                                "spotPhone"
                            )}
                            value={
                                form.phone
                            }
                            onChange={value =>
                                update(
                                    "phone",
                                    value
                                )
                            }
                            type="tel"
                            placeholder={t(
                                "phonePlaceholder"
                            )}
                        />


                        {/* =================================================
                            WHATSAPP
                        ================================================== */}

                        <FormInput
                            label="WhatsApp"
                            value={
                                form.whatsapp
                            }
                            onChange={value =>
                                update(
                                    "whatsapp",
                                    value
                                )
                            }
                            type="tel"
                            placeholder={t(
                                "whatsappPlaceholder"
                            )}
                        />


                        {/* =================================================
                            ABOUT YOU
                        ================================================== */}

                        <div
                            className="nt-introduce-divider"
                        >

                            <span>
                                {t(
                                    "aboutYou"
                                )}
                            </span>

                        </div>


                        <FormInput
                            label={t(
                                "yourName"
                            )}
                            value={
                                form.submittedByName
                            }
                            onChange={value =>
                                update(
                                    "submittedByName",
                                    value
                                )
                            }
                            placeholder={t(
                                "yourNamePlaceholder"
                            )}
                        />


                        <FormInput
                            label={t(
                                "yourPhone"
                            )}
                            value={
                                form.submittedByPhone
                            }
                            onChange={value =>
                                update(
                                    "submittedByPhone",
                                    value
                                )
                            }
                            type="tel"
                            placeholder={t(
                                "yourPhonePlaceholder"
                            )}
                        />


                        {/* =================================================
                            DESCRIPTION
                        ================================================== */}

                        <div>

                            <label
                                htmlFor="spotDescription"
                            >
                                {t(
                                    "describeSpot"
                                )}
                            </label>


                            <textarea
                                id="spotDescription"
                                value={
                                    form.description
                                }
                                onChange={event =>
                                    update(
                                        "description",
                                        event
                                            .target
                                            .value
                                    )
                                }
                                placeholder={t(
                                    "describeSpotPlaceholder"
                                )}
                                rows={5}
                                maxLength={
                                    2000
                                }
                            />

                        </div>


                        {/* =================================================
                            ERROR
                        ================================================== */}

                        {error && (
                            <div
                                className="nt-introduce-error"
                                role="alert"
                            >
                                {error}
                            </div>
                        )}


                        {/* =================================================
                            SUBMIT
                        ================================================== */}

                        <button
                            type="submit"
                            disabled={
                                loading
                            }
                            className="nt-introduce-primary"
                        >

                            {loading ? (
                                <>
                                    <span
                                        className="nt-loading-spinner"
                                        style={{
                                            width:
                                                "18px",
                                            height:
                                                "18px",
                                            borderWidth:
                                                "2px",
                                            borderColor:
                                                "rgba(255,255,255,0.35)",
                                            borderTopColor:
                                                "#FFFFFF",
                                        }}
                                    />

                                    {t(
                                        "sending"
                                    )}
                                </>
                            ) : (
                                <>
                                    <span>
                                        {t(
                                            "introduceSpot"
                                        )}
                                    </span>

                                    <Send
                                        size={17}
                                    />
                                </>
                            )}

                        </button>


                        {/* =================================================
                            REVIEW NOTE
                        ================================================== */}

                        <p
                            style={{
                                margin:
                                    "12px 0 0",
                                textAlign:
                                    "center",
                                color:
                                    "var(--nt-muted)",
                                fontSize:
                                    "0.75rem",
                                lineHeight:
                                    "1.5",
                            }}
                        >
                            {t(
                                "introduceReviewNote"
                            )}
                        </p>

                    </form>

                </div>

            </main>

        </AppShell>
    );
}


/* =====================================================
   REUSABLE FORM INPUT
====================================================== */

function FormInput({
    label,
    value,
    onChange,
    placeholder,
    type = "text",
    required = false,
    min,
}) {
    return (
        <div>

            <label>
                {label}

                {required && (
                    <span>
                        {" "}
                        *
                    </span>
                )}
            </label>


            <input
                type={type}
                value={value}
                placeholder={
                    placeholder
                }
                required={
                    required
                }
                min={
                    min
                }
                onChange={event =>
                    onChange(
                        event
                            .target
                            .value
                    )
                }
            />

        </div>
    );
}