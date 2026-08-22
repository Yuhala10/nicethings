import {
    useEffect,
} from "react";

import "../styles/globals.css";

import {
    initializeVisitor,
} from "../lib/visitor";

export default function App({
    Component,
    pageProps,
}) {
    useEffect(() => {
        initializeVisitor(
            "en"
        );

        if (
            "serviceWorker" in
            navigator
        ) {
            navigator.serviceWorker
                .register(
                    "/sw.js"
                )
                .catch(
                    (error) =>
                        console.error(
                            "Service worker:",
                            error
                        )
                );
        }
    }, []);

    return (
        <Component
            {...pageProps}
        />
    );
}