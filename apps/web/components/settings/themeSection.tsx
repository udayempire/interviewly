"use client";

import { useTheme } from "@/context/ThemeProvider";
import { Monitor, Moon, Sun } from "lucide-react";

const themes = [{ id: "light" as const, label: "Light", icon: Sun }, { id: "dark" as const, label: "Dark", icon: Moon }, { id: "system" as const, label: "System", icon: Monitor }];

export function ThemeSection() {
  const { theme, setTheme } = useTheme();
  return <div><h2 className="text-lg font-semibold text-stone-900 dark:text-zinc-100">Appearance</h2><p className="mt-1 text-sm text-stone-600 dark:text-zinc-400">Choose the theme for this device.</p><div className="mt-5 grid max-w-md grid-cols-3 border border-stone-200 dark:border-zinc-800">{themes.map(({ id, label, icon: Icon }) => { const active = theme === id; return <button key={id} type="button" onClick={() => setTheme(id)} className={`flex flex-col items-center gap-2 border-l border-stone-200 px-3 py-4 text-sm font-medium transition-colors first:border-l-0 dark:border-zinc-800 ${active ? "bg-amber-50 text-amber-800 dark:bg-amber-950/30 dark:text-amber-300" : "bg-white text-stone-600 hover:bg-stone-50 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800"}`}><Icon className="h-4 w-4" />{label}</button>; })}</div></div>;
}
