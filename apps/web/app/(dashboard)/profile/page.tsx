"use client";

import { Suspense } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PersonalInfoSection } from "@/components/profile/personalInfoSection";
import { ConnectedAccountsSection } from "@/components/profile/connectedAccountsSection";
import { ResumeSection } from "@/components/profile/resumeSection";
import { ChangePasswordSection } from "@/components/profile/changePasswordSection";
import { Skeleton } from "@/components/ui/skeleton";

type Account = { provider: string };
type ResumeData = { skills?: string[]; name?: string; currentRole?: string };
type ProfileUser = { name?: string; email?: string; accounts?: Account[]; authProvider?: string; createdAt?: string; userProfile?: { githubUrl?: string; profileImageUrl?: string | null; resumeText?: ResumeData | null; hasResumePdf?: boolean; }; };

async function fetchProfile() {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/${process.env.NEXT_PUBLIC_API_VERSION}/user/profile`, { credentials: "include" });
  if (!response.ok) throw new Error("Failed to fetch profile");
  return response.json() as Promise<{ user?: ProfileUser }>;
}

function ProfileLoading() {
  return <div className="w-full max-w-3xl px-5 py-7 sm:px-8 lg:px-10 lg:py-8"><Skeleton className="h-3 w-16" /><Skeleton className="mt-3 h-9 w-40" /><Skeleton className="mt-9 h-48 w-full" /></div>;
}

function ProfileContent() {
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery({ queryKey: ["profile"], queryFn: fetchProfile });
  const handleUpdated = () => queryClient.invalidateQueries({ queryKey: ["profile"] });

  if (isLoading) return <ProfileLoading />;
  if (error) return <div className="w-full max-w-3xl px-5 py-8 text-sm text-red-700 dark:text-red-400 sm:px-8">Failed to load profile. Please try again.</div>;

  const user = data?.user;
  const linkedProviders = user?.accounts?.map((account) => account.provider) || [];
  return <div className="min-h-full bg-stone-50 text-stone-900 dark:bg-zinc-950 dark:text-zinc-100"><main className="w-full max-w-3xl px-5 py-7 sm:px-8 lg:px-10 lg:py-8"><header className="border-b border-stone-200 pb-6 dark:border-zinc-800"><p className="text-[11px] font-bold uppercase tracking-[0.18em] text-stone-500 dark:text-zinc-400">Account</p><h1 className="mt-1 text-3xl font-semibold tracking-[-0.045em]">Profile</h1></header><div className="divide-y divide-stone-200 dark:divide-zinc-800"><section className="py-7"><PersonalInfoSection name={user?.name || ""} email={user?.email || ""} githubUrl={user?.userProfile?.githubUrl || ""} profileImageUrl={user?.userProfile?.profileImageUrl || null} authProvider={user?.authProvider || "EMAIL"} createdAt={user?.createdAt || ""} onUpdated={handleUpdated} /></section><section className="py-7"><ConnectedAccountsSection linkedProviders={linkedProviders} authProvider={user?.authProvider || "EMAIL"} /></section><section className="py-7"><ResumeSection resumeData={user?.userProfile?.resumeText || null} hasResumePdf={user?.userProfile?.hasResumePdf || false} onUpdated={handleUpdated} /></section><section className="py-7"><ChangePasswordSection hasEmailAccount={linkedProviders.includes("EMAIL")} /></section></div></main></div>;
}

export default function Profile() { return <Suspense fallback={<ProfileLoading />}><ProfileContent /></Suspense>; }
