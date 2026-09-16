"use client"

import { useTheme } from "@/context/ThemeProvider"
import { Sun, Moon, Monitor } from "lucide-react"

const themes = [
    {
        id: "light" as const,
        label: "Light",
        icon: Sun,
        description: "Classic light appearance",
    },
    {
        id: "dark" as const,
        label: "Dark",
        icon: Moon,
        description: "Easy on the eyes",
    },
    {
        id: "system" as const,
        label: "System",
        icon: Monitor,
        description: "Follows your OS setting",
    },
]

export function ThemeSection() {
    const { theme, setTheme } = useTheme()

    return (
        <div>
            <div className="flex items-center gap-2 mb-1">
                <h2 className="text-lg font-semibold text-foreground">Appearance</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-5">
                Choose how Interviewlyy looks to you. Select a single theme, or sync with your system.
            </p>

            <div className="grid grid-cols-3 gap-3 max-w-md">
                {themes.map(({ id, label, icon: Icon, description }) => {
                    const isActive = theme === id
                    return (
                        <button
                            key={id}
                            type="button"
                            onClick={() => setTheme(id)}
                            className={`group relative flex flex-col items-center gap-2.5 rounded-xl border-2 px-4 py-5 transition-all duration-200 cursor-pointer
                                ${isActive
                                    ? "border-blue-500 bg-blue-50/60 dark:bg-blue-950/30 shadow-sm ring-1 ring-blue-500/20"
                                    : "border-border bg-card hover:border-muted-foreground/30 hover:bg-accent"
                                }
                            `}
                        >
                            <div
                                className={`flex h-10 w-10 items-center justify-center rounded-lg transition-colors
                                    ${isActive
                                        ? "bg-blue-500 text-white shadow-md"
                                        : "bg-muted text-muted-foreground group-hover:bg-muted-foreground/10 group-hover:text-foreground"
                                    }
                                `}
                            >
                                <Icon className="h-5 w-5" />
                            </div>
                            <div className="text-center">
                                <p className={`text-sm font-semibold ${isActive ? "text-blue-700 dark:text-blue-400" : "text-foreground"}`}>
                                    {label}
                                </p>
                                <p className="text-[11px] text-muted-foreground mt-0.5 leading-tight">
                                    {description}
                                </p>
                            </div>
                            {/* Active indicator dot */}
                            {isActive && (
                                <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-blue-500 border-2 border-background shadow-sm" />
                            )}
                        </button>
                    )
                })}
            </div>
        </div>
    )
}
