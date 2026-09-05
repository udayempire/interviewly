"use client"

import { useState } from "react"
import Image from "next/image"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useMutation } from "@tanstack/react-query"
import { Loader2, Check } from "lucide-react"

interface PersonalInfoSectionProps {
    name: string
    email: string
    githubUrl: string
    profileImageUrl: string | null
    authProvider: string
    createdAt: string
    onUpdated: () => void
}

export function PersonalInfoSection({
    name: initialName,
    email,
    githubUrl: initialGithubUrl,
    profileImageUrl,
    authProvider,
    createdAt,
    onUpdated,
}: PersonalInfoSectionProps) {
    const [name, setName] = useState(initialName)
    const [githubUrl, setGithubUrl] = useState(initialGithubUrl)

    const { mutate: updateProfile, isPending, isSuccess } = useMutation({
        mutationFn: async () => {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/${process.env.NEXT_PUBLIC_API_VERSION}/user/profile`,
                {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({ name, githubUrl }),
                }
            )
            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || "Failed to update profile")
            }
            return res.json()
        },
        onSuccess: () => {
            onUpdated()
        },
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        updateProfile()
    }

    const userInitial = name?.charAt(0)?.toUpperCase() || "U"

    return (
        <div>
            <h2 className="text-lg font-semibold text-zinc-900 mb-1">Personal Information</h2>
            <p className="text-sm text-zinc-500 mb-6">Update your name and GitHub profile link.</p>

            <form onSubmit={handleSubmit} className="space-y-5">
                {/* Avatar display */}
                <div className="flex items-center gap-4">
                    {profileImageUrl ? (
                        <Image
                            src={profileImageUrl}
                            alt="Profile"
                            width={64}
                            height={64}
                            className="rounded-full ring-2 ring-zinc-100"
                        />
                    ) : (
                        <div className="h-16 w-16 shrink-0 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm">
                            <span className="text-xl font-semibold text-white leading-none">
                                {userInitial}
                            </span>
                        </div>
                    )}
                    <div>
                        <p className="text-sm font-medium text-zinc-800">{name || "User"}</p>
                        <p className="text-xs text-zinc-400">
                            Joined {new Date(createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                            {" · "}
                            Signed up via {authProvider.charAt(0) + authProvider.slice(1).toLowerCase()}
                        </p>
                    </div>
                </div>

                {/* Name */}
                <div className="space-y-1.5">
                    <Label htmlFor="profile-name">Full Name</Label>
                    <Input
                        id="profile-name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Your name"
                    />
                </div>

                {/* Email (read-only) */}
                <div className="space-y-1.5">
                    <Label htmlFor="profile-email">Email Address</Label>
                    <Input
                        id="profile-email"
                        value={email}
                        disabled
                        className="bg-zinc-50 text-zinc-500 cursor-not-allowed"
                    />
                    <p className="text-xs text-zinc-400">Email cannot be changed.</p>
                </div>

                {/* GitHub URL */}
                <div className="space-y-1.5">
                    <Label htmlFor="profile-github">GitHub Profile URL</Label>
                    <Input
                        id="profile-github"
                        value={githubUrl}
                        onChange={(e) => setGithubUrl(e.target.value)}
                        placeholder="https://github.com/username"
                    />
                </div>

                {/* Save */}
                <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
                    {isPending ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Saving…
                        </>
                    ) : isSuccess ? (
                        <>
                            <Check className="h-4 w-4" />
                            Saved
                        </>
                    ) : (
                        "Save Changes"
                    )}
                </Button>
            </form>
        </div>
    )
}
