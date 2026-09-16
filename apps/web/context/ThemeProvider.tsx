"use client"

import { createContext, useContext, useEffect, useState, useCallback } from "react"

type Theme = "light" | "dark" | "system"

interface ThemeContextValue {
    theme: Theme
    setTheme: (theme: Theme) => void
    resolvedTheme: "light" | "dark"
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

function getSystemTheme(): "light" | "dark" {
    if (typeof window === "undefined") return "light"
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

function applyTheme(resolved: "light" | "dark") {
    const root = document.documentElement
    if (resolved === "dark") {
        root.classList.add("dark")
    } else {
        root.classList.remove("dark")
    }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setThemeState] = useState<Theme>("system")
    const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light")
    const [mounted, setMounted] = useState(false)

    // Resolve theme and apply it
    const resolveAndApply = useCallback((t: Theme) => {
        const resolved = t === "system" ? getSystemTheme() : t
        setResolvedTheme(resolved)
        applyTheme(resolved)
    }, [])

    // Initialize from localStorage on mount
    useEffect(() => {
        const stored = localStorage.getItem("theme") as Theme | null
        const initial = stored || "system"
        setThemeState(initial)
        resolveAndApply(initial)
        setMounted(true)
    }, [resolveAndApply])

    // Listen for system theme changes when in "system" mode
    useEffect(() => {
        if (!mounted) return

        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
        const handler = () => {
            if (theme === "system") {
                resolveAndApply("system")
            }
        }
        mediaQuery.addEventListener("change", handler)
        return () => mediaQuery.removeEventListener("change", handler)
    }, [theme, mounted, resolveAndApply])

    const setTheme = useCallback((newTheme: Theme) => {
        setThemeState(newTheme)
        localStorage.setItem("theme", newTheme)
        resolveAndApply(newTheme)
    }, [resolveAndApply])

    // Prevent flash — render children immediately but context is ready
    return (
        <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
            {children}
        </ThemeContext.Provider>
    )
}

export function useTheme() {
    const ctx = useContext(ThemeContext)
    if (!ctx) throw new Error("useTheme must be used within a ThemeProvider")
    return ctx
}
