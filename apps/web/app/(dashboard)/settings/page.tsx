"use client";

import { useQuery } from "@tanstack/react-query";
import { ApiKeySection } from "@/components/settings/apiKeySection";
import { ThemeSection } from "@/components/settings/themeSection";
import { Skeleton } from "@/components/ui/skeleton";

type UserSettings = { userProfile?: { llmProvider?: string | null; hasLlmApiKey?: boolean; llmApiKey?: string | null; useCustomKey?: boolean; } };

async function fetchProfile() {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/${process.env.NEXT_PUBLIC_API_VERSION}/user/profile`, { credentials: "include" });
  if (!response.ok) throw new Error("Failed to fetch settings");
  return response.json() as Promise<{ user?: UserSettings }>;
}

function SettingsLoading() { return <div className="w-full max-w-3xl px-5 py-7 sm:px-8 lg:px-10 lg:py-8"><Skeleton className="h-3 w-16" /><Skeleton className="mt-3 h-9 w-32" /><Skeleton className="mt-9 h-32 w-full" /></div>; }

export default function Settings() {
  const { data, isLoading, error } = useQuery({ queryKey: ["profile"], queryFn: fetchProfile });
  if (isLoading) return <SettingsLoading />;
  if (error) return <div className="w-full max-w-3xl px-5 py-8 text-sm text-red-700 dark:text-red-400 sm:px-8">Failed to load settings. Please try again.</div>;
  const profile = data?.user?.userProfile;

  return <div className="min-h-full bg-stone-50 text-stone-900 dark:bg-zinc-950 dark:text-zinc-100"><main className="w-full max-w-3xl px-5 py-7 sm:px-8 lg:px-10 lg:py-8"><header className="border-b border-stone-200 pb-6 dark:border-zinc-800"><p className="text-[11px] font-bold uppercase tracking-[0.18em] text-stone-500 dark:text-zinc-400">Account</p><h1 className="mt-1 text-3xl font-semibold tracking-[-0.045em]">Settings</h1></header><div className="divide-y divide-stone-200 dark:divide-zinc-800"><section className="py-7"><ThemeSection /></section><section className="py-7"><ApiKeySection savedProvider={profile?.llmProvider || null} hasApiKey={Boolean(profile?.hasLlmApiKey || profile?.llmApiKey)} useCustomKey={profile?.useCustomKey ?? false} /></section></div></main></div>;
}
