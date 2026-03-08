import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light";
type Currency = "LKR" | "USD" | "EUR" | "GBP";

interface AppContextType {
    theme: Theme;
    currency: Currency;
    timezone: string;
    toggleTheme: () => void;
    setTheme: (theme: Theme) => void;
    setCurrency: (currency: Currency) => void;
    setTimezone: (timezone: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
    const [theme, setThemeState] = useState<Theme>(() => {
        const saved = localStorage.getItem("spendora-theme");
        return (saved as Theme) || "dark";
    });

    const [currency, setCurrencyState] = useState<Currency>(() => {
        const saved = localStorage.getItem("spendora-currency");
        return (saved as Currency) || "LKR";
    });

    const [timezone, setTimezoneState] = useState<string>(() => {
        const saved = localStorage.getItem("spendora-timezone");
        return saved || "IST";
    });

    useEffect(() => {
        const root = document.documentElement;
        root.classList.remove("dark", "light");
        root.classList.add(theme);
        localStorage.setItem("spendora-theme", theme);
    }, [theme]);

    useEffect(() => {
        localStorage.setItem("spendora-currency", currency);
    }, [currency]);

    useEffect(() => {
        localStorage.setItem("spendora-timezone", timezone);
    }, [timezone]);

    const toggleTheme = () =>
        setThemeState((prev) => (prev === "dark" ? "light" : "dark"));

    const setTheme = (t: Theme) => setThemeState(t);
    const setCurrency = (c: Currency) => setCurrencyState(c);
    const setTimezone = (tz: string) => setTimezoneState(tz);

    return (
        <AppContext.Provider value={{
            theme,
            currency,
            timezone,
            toggleTheme,
            setTheme,
            setCurrency,
            setTimezone
        }}>
            {children}
        </AppContext.Provider>
    );
}

export function useApp() {
    const context = useContext(AppContext);
    if (!context) throw new Error("useApp must be used within an AppProvider");
    return context;
}

// Alias for backward compatibility if needed, but we'll try to update usage
export const useTheme = useApp;
