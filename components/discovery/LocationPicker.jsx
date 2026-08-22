// components/discovery/LocationPicker.jsx

import {
    MapPin,
    Search,
    Navigation,
    LoaderCircle,
} from "lucide-react";
import { useLanguage } from "../../lib/i18n";

export default function LocationPicker({
    mode,
    setMode,
    location,
    setLocation,
    onUseLocation,
    locating,
    error,
}) {
    const { t, language } = useLanguage();

    const isFrench = language === "fr";

    return (
        <section className="nt-discovery-card">
            <div className="nt-discovery-card-heading">
                <div className="nt-discovery-number">
                    01
                </div>

                <div>
                    <span className="nt-discovery-kicker">
                        {t("location")}
                    </span>

                    <h2>
                        {isFrench
                            ? "Où êtes-vous ?"
                            : "Where are you?"}
                    </h2>
                </div>
            </div>

            <div className="nt-location-tabs">
                <button
                    type="button"
                    className={
                        mode === "gps"
                            ? "nt-location-tab nt-location-tab-active"
                            : "nt-location-tab"
                    }
                    onClick={() =>
                        setMode("gps")
                    }
                >
                    <Navigation size={17} />

                    <span>
                        {t(
                            "useMyLocation"
                        )}
                    </span>
                </button>

                <button
                    type="button"
                    className={
                        mode === "area"
                            ? "nt-location-tab nt-location-tab-active"
                            : "nt-location-tab"
                    }
                    onClick={() =>
                        setMode("area")
                    }
                >
                    <Search size={17} />

                    <span>
                        {t("searchArea")}
                    </span>
                </button>
            </div>

            {mode === "gps" ? (
                <button
                    type="button"
                    className="nt-location-action"
                    onClick={onUseLocation}
                    disabled={locating}
                >
                    <span className="nt-location-action-icon">
                        {locating ? (
                            <LoaderCircle
                                size={20}
                                className="nt-spin"
                            />
                        ) : (
                            <MapPin
                                size={20}
                            />
                        )}
                    </span>

                    <span className="nt-location-action-text">
                        <strong>
                            {locating
                                ? isFrench
                                    ? "Localisation..."
                                    : "Locating..."
                                : location
                                    ? location
                                    : t(
                                        "useMyLocation"
                                    )}
                        </strong>

                        <small>
                            {isFrench
                                ? "Utilisez votre position actuelle"
                                : "Use your current position"}
                        </small>
                    </span>
                </button>
            ) : (
                <div className="nt-area-input-wrap">
                    <Search
                        size={19}
                    />

                    <input
                        type="text"
                        value={location}
                        onChange={(event) =>
                            setLocation(
                                event.target.value
                            )
                        }
                        placeholder={
                            isFrench
                                ? "Ex. Mvan, Bastos, Centre-ville..."
                                : "e.g. Mvan, Bastos, Downtown..."
                        }
                        autoComplete="off"
                    />
                </div>
            )}

            {error && (
                <p className="nt-field-error">
                    {error}
                </p>
            )}
        </section>
    );
}