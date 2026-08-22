const VISITOR_STORAGE_KEY =
    "nicethings_visitor_id";

export function getVisitorId() {
    if (typeof window === "undefined") {
        return null;
    }

    return localStorage.getItem(
        VISITOR_STORAGE_KEY
    );
}

export function setVisitorId(
    visitorId
) {
    if (
        typeof window === "undefined" ||
        !visitorId
    ) {
        return;
    }

    localStorage.setItem(
        VISITOR_STORAGE_KEY,
        visitorId
    );
}

export function clearVisitorId() {
    if (typeof window === "undefined") {
        return;
    }

    localStorage.removeItem(
        VISITOR_STORAGE_KEY
    );
}

export async function initializeVisitor(
    language = "en"
) {
    if (
        typeof window === "undefined"
    ) {
        return null;
    }

    const existing =
        getVisitorId();

    try {
        const response =
            await fetch(
                "/api/visitor/init",
                {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "application/json",
                    },
                    body: JSON.stringify({
                        visitorId:
                            existing,
                        language,
                    }),
                }
            );

        const data =
            await response.json();

        if (
            !response.ok ||
            !data.visitorId
        ) {
            throw new Error(
                data.error ||
                "Unable to initialize visitor."
            );
        }

        setVisitorId(
            data.visitorId
        );

        return data.visitorId;
    } catch (error) {
        console.error(
            "Visitor initialization:",
            error
        );

        return null;
    }
}