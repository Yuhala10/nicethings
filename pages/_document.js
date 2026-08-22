import {
    Html,
    Head,
    Main,
    NextScript,
} from "next/document";

export default function Document() {
    return (
        <Html lang="en">
            <Head>

                <meta
                    name="theme-color"
                    content="#070a10"
                />

                <meta
                    name="mobile-web-app-capable"
                    content="yes"
                />

                <meta
                    name="apple-mobile-web-app-capable"
                    content="yes"
                />

                <meta
                    name="apple-mobile-web-app-status-bar-style"
                    content="black-translucent"
                />

                <link
                    rel="manifest"
                    href="/manifest.json"
                />

                <link
                    rel="icon"
                    href="/icons/icon-192.png"
                />

                <link
                    rel="apple-touch-icon"
                    href="/icons/icon-192.png"
                />

                <meta
                    name="description"
                    content="Find genuinely nice places around you."
                />

            </Head>

            <body>
                <Main />
                <NextScript />
            </body>
        </Html>
    );
}