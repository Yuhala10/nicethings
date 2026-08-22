import { useEffect } from "react";
import "../styles/globals.css";
import { LanguageProvider } from "../lib/i18n";

export default function App({
    Component,
    pageProps,
}) {
    useEffect(() => {
        if (
            "serviceWorker" in
            navigator
        ) {
            navigator.serviceWorker
                .register("/sw.js")
                .catch((error) => {
                    console.error(
                        "Service worker:",
                        error
                    );
                });
        }
    }, []);

    return (
        <LanguageProvider>
            <Component
                {...pageProps}
            />
        </LanguageProvider>
    );
}