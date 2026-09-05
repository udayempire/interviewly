"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useMutation } from "@tanstack/react-query"
import { Loader2, Check, Eye, EyeOff } from "lucide-react"

interface ChangePasswordSectionProps {
    hasEmailAccount: boolean
}

export function ChangePasswordSection({ hasEmailAccount }: ChangePasswordSectionProps) {
    const [currentPassword, setCurrentPassword] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [showCurrent, setShowCurrent] = useState(false)
    const [showNew, setShowNew] = useState(false)
    const [validationError, setValidationError] = useState("")

    const { mutate: changePassword, isPending, isSuccess, error } = useMutation({
        mutationFn: async () => {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/${process.env.NEXT_PUBLIC_API_VERSION}/user/profile/password`,
                {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({ currentPassword, newPassword }),
                }
            )
            const data = await res.json()
            if (!res.ok) {
                throw new Error(data.error || "Failed to change password")
            }
            return data
        },
        onSuccess: () => {
            setCurrentPassword("")
            setNewPassword("")
            setConfirmPassword("")
        },
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        setValidationError("")

        if (newPassword.length < 6) {
            setValidationError("Password must be at least 6 characters")
            return
        }
        if (newPassword !== confirmPassword) {
            setValidationError("Passwords do not match")
            return
        }

        changePassword()
    }

    return (
        <div>
            <h2 className="text-lg font-semibold text-zinc-900 mb-1">
                {hasEmailAccount ? "Change Password" : "Set Password"}
            </h2>
            <p className="text-sm text-zinc-500 mb-6">
                {hasEmailAccount
                    ? "Update your account password."
                    : "Set a password to enable email + password sign-in alongside your social login."
                }
            </p>

            <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
                {/* Current password — only show if user has an existing EMAIL account */}
                {hasEmailAccount && (
                    <div className="space-y-1.5">
                        <Label htmlFor="current-password">Current Password</Label>
                        <div className="relative">
                            <Input
                                id="current-password"
                                type={showCurrent ? "text" : "password"}
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                placeholder="Enter current password"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowCurrent(!showCurrent)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 cursor-pointer"
                            >
                                {showCurrent ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                            </button>
                        </div>
                    </div>
                )}

                {/* New password */}
                <div className="space-y-1.5">
                    <Label htmlFor="new-password">New Password</Label>
                    <div className="relative">
                        <Input
                            id="new-password"
                            type={showNew ? "text" : "password"}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="At least 6 characters"
                            required
                            minLength={6}
                        />
                        <button
                            type="button"
                            onClick={() => setShowNew(!showNew)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 cursor-pointer"
                        >
                            {showNew ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                        </button>
                    </div>
                </div>

                {/* Confirm password */}
                <div className="space-y-1.5">
                    <Label htmlFor="confirm-password">Confirm New Password</Label>
                    <Input
                        id="confirm-password"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Repeat new password"
                        required
                        minLength={6}
                    />
                </div>

                {/* Errors */}
                {(validationError || error) && (
                    <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                        {validationError || (error as Error).message}
                    </p>
                )}

                {/* Success */}
                {isSuccess && (
                    <p className="text-sm text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-md px-3 py-2">
                        Password updated successfully.
                    </p>
                )}

                <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
                    {isPending ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Updating…
                        </>
                    ) : isSuccess ? (
                        <>
                            <Check className="h-4 w-4" />
                            Updated
                        </>
                    ) : (
                        hasEmailAccount ? "Change Password" : "Set Password"
                    )}
                </Button>
            </form>
        </div>
    )
}
