"use client"

import { useQuery } from "@tanstack/react-query"
import { ApiKeySection } from "@/components/settings/apiKeySection"
import { Skeleton } from "@/components/ui/skeleton"
import { Settings as SettingsIcon } from "lucide-react"

async function fetchProfile() {
    const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/${process.env.NEXT_PUBLIC_API_VERSION}/user/profile`,
        { credentials: "include" }
    )
    if (!res.ok) throw new Error("Failed to fetch settings")
    return res.json()
}

export default function Settings() {
    const { data, isLoading, error } = useQuery({
        queryKey: ["profile"],
        queryFn: fetchProfile,
    })

    if (isLoading) {
        return (
            <div className="max-w-2xl mx-10 px-6 py-8">
                <Skeleton className="h-8 w-48 mb-2" />
                <Skeleton className="h-4 w-72 mb-8" />
                <div className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-64" />
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="max-w-2xl mx-10 px-6 py-8">
                <p className="text-red-600">Failed to load settings. Please try again.</p>
            </div>
        )
    }

    const user = data?.user

    return (
        <div className="max-w-2xl mx-10 px-6 py-8">
            <div className="mb-8">
                <div className="flex items-center gap-2.5">
                    <SettingsIcon className="h-6 w-6 text-zinc-700" />
                    <h1 className="text-2xl font-bold text-zinc-900">Settings</h1>
                </div>
                <p className="text-sm text-zinc-500 mt-1">Configure your AI preferences and integrations.</p>
            </div>

            {/* AI API Key (BYOK) */}
            <ApiKeySection
                savedProvider={user?.userProfile?.llmProvider || null}
                hasApiKey={!!user?.userProfile?.llmApiKey}
            />
        </div>
    )
}