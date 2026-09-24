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
            <h2 className="text-lg font-semibold text-stone-900 dark:text-zinc-100">Personal information</h2>
            <p className="mt-1 text-sm text-stone-600 dark:text-zinc-400">Your name and GitHub profile.</p>

            <form onSubmit={handleSubmit} className="mt-6 max-w-xl space-y-5">
                {/* Avatar display */}
                <div className="flex items-center gap-4">
                    {profileImageUrl ? (
                        <Image
                            src={profileImageUrl}
                            alt="Profile"
                            width={64}
                            height={64}
                            className="rounded-full ring-2 ring-border"
                        />
                    ) : (
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-zinc-900 dark:bg-amber-300">
                            <span className="text-lg font-semibold leading-none text-amber-300 dark:text-stone-900">
                                {userInitial}
                            </span>
                        </div>
                    )}
                    <div>
                        <p className="text-sm font-medium text-foreground">{name || "User"}</p>
                        <p className="text-xs text-muted-foreground">
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
                        className="rounded-none"
                    />
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                    <div className="space-y-1.5">
                        <Label htmlFor="profile-email">Email address</Label>
                        <Input id="profile-email" value={email} disabled className="cursor-not-allowed rounded-none bg-muted text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">Email cannot be changed.</p>
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="profile-github">GitHub profile</Label>
                        <Input id="profile-github" value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)} placeholder="https://github.com/username" className="rounded-none" />
                    </div>
                </div>

                <div className="flex justify-start">
                <Button type="submit" disabled={isPending} className="w-full rounded-none bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-amber-300 dark:text-stone-900 dark:hover:bg-amber-200 sm:w-auto">
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
                </div>
            </form>
        </div>
    )
}
