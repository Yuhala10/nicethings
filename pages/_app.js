import { useEffect } from "react";

import "../styles/globals.css";

import {
    LanguageProvider,
} from "../lib/i18n";

import ConsentPopup from "../components/ConsentPopup";


export default function App({
    Component,
    pageProps,
}) {

    /* =====================================================
       SERVICE WORKER
    ====================================================== */

    useEffect(() => {

        if (
            "serviceWorker" in
            navigator
        ) {

            navigator.serviceWorker
                .register("/sw.js")
                .catch(
                    (error) =>
                        console.error(
                            "Service worker:",
                            error
                        )
                );
        }

    }, []);


    /* =====================================================
       APP
    ====================================================== */

    return (
        <LanguageProvider>

            <Component
                {...pageProps}
            />

            <ConsentPopup />

        </LanguageProvider>
    );
}