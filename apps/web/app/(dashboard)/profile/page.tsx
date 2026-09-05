"use client"

import { useQuery, useQueryClient } from "@tanstack/react-query"
import { PersonalInfoSection } from "@/components/profile/personalInfoSection"
import { ConnectedAccountsSection } from "@/components/profile/connectedAccountsSection"
import { ResumeSection } from "@/components/profile/resumeSection"
import { ChangePasswordSection } from "@/components/profile/changePasswordSection"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"

async function fetchProfile() {
    const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/${process.env.NEXT_PUBLIC_API_VERSION}/user/profile`,
        { credentials: "include" }
    )
    if (!res.ok) throw new Error("Failed to fetch profile")
    return res.json()
}

export default function Profile() {
    const queryClient = useQueryClient()
    const { data, isLoading, error } = useQuery({
        queryKey: ["profile"],
        queryFn: fetchProfile,
    })

    const handleUpdated = () => {
        queryClient.invalidateQueries({ queryKey: ["profile"] })
    }

    if (isLoading) {
        return (
            <div className="max-w-2xl mx-10 px-6 py-8">
                <Skeleton className="h-8 w-48 mb-2" />
                <Skeleton className="h-4 w-72 mb-8" />
                <div className="space-y-6">
                    <div className="flex items-center gap-4">
                        <Skeleton className="h-16 w-16 rounded-full" />
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-48" />
                        </div>
                    </div>
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="max-w-2xl mx-auto px-6 py-8">
                <p className="text-red-600">Failed to load profile. Please try again.</p>
            </div>
        )
    }

    const user = data?.user
    const linkedProviders = user?.accounts?.map((a: any) => a.provider) || []
    const hasEmailAccount = linkedProviders.includes("EMAIL")

    return (
        <div className="max-w-2xl mx-10 px-6 py-8">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-zinc-900">Profile Settings</h1>
                <p className="text-sm text-zinc-500 mt-1">Manage your account and preferences.</p>
            </div>

            {/* Personal Information */}
            <PersonalInfoSection
                name={user?.name || ""}
                email={user?.email || ""}
                githubUrl={user?.userProfile?.githubUrl || ""}
                profileImageUrl={user?.userProfile?.profileImageUrl || null}
                authProvider={user?.authProvider || "EMAIL"}
                createdAt={user?.createdAt || ""}
                onUpdated={handleUpdated}
            />

            <Separator className="my-8" />

            {/* Connected Accounts */}
            <ConnectedAccountsSection
                linkedProviders={linkedProviders}
                authProvider={user?.authProvider || "EMAIL"}
            />

            <Separator className="my-8" />

            {/* Resume Upload */}
            <ResumeSection
                resumeData={user?.userProfile?.resumeText || null}
                onUpdated={handleUpdated}
            />

            <Separator className="my-8" />

            {/* Change Password */}
            <ChangePasswordSection hasEmailAccount={hasEmailAccount} />
        </div>
    )
}