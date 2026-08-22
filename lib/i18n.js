import {
    createContext,
    useContext,
    useEffect,
    useState,
} from "react";

import translations from "./translations";

const LanguageContext =
    createContext(null);

export function LanguageProvider({
    children,
}) {
    const [language, setLanguage] =
        useState("en");

    useEffect(() => {
        const saved =
            localStorage.getItem(
                "nicethings_language"
            );

        if (
            saved === "en" ||
            saved === "fr"
        ) {
            setLanguage(saved);
        }
    }, []);

    function changeLanguage(next) {
        if (
            next !== "en" &&
            next !== "fr"
        ) {
            return;
        }

        setLanguage(next);

        localStorage.setItem(
            "nicethings_language",
            next
        );
    }

    function t(key) {
        return (
            translations[
            language
            ]?.[key] ??
            translations.en[key] ??
            key
        );
    }

    return (
        <LanguageContext.Provider
            value={{
                language,
                setLanguage:
                    changeLanguage,
                t,
            }}
        >
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context =
        useContext(
            LanguageContext
        );

    if (!context) {
        throw new Error(
            "useLanguage must be used inside LanguageProvider"
        );
    }

    return context;
}