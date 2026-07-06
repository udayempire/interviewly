"use client"
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MailIcon, LockKeyholeOpen } from "lucide-react";
import Link from "next/link";

interface SigninFormProps {
    email: string;
    password: string;
    onEmailChange: (value: string) => void;
    onPasswordChange: (value: string) => void;
    onSubmit: () => void;
    isPending: boolean;
    error: string | null;
}

export const SigninForm = ({ email, password, onEmailChange, onPasswordChange, onSubmit, isPending, error }: SigninFormProps) => {
    return (
        <div className="flex items-center justify-center">
            <div className="w-full max-w-md">
                <h1 className="text-center text-[24px] font-semibold">Sign In</h1>
                <div className="flex flex-col gap-4 mt-12">
                    <div className="relative">
                        <MailIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-500" />
                        <Input
                            type="email"
                            placeholder="Enter Email / number"
                            className="pl-10 py-6"
                            value={email}
                            onChange={(e) => onEmailChange(e.target.value)}
                        />
                    </div>
                    <div className="relative">
                        <LockKeyholeOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-500" />
                        <Input
                            type="password"
                            placeholder="Enter password"
                            className="pl-10 py-6"
                            value={password}
                            onChange={(e) => onPasswordChange(e.target.value)}
                        />
                    </div>

                    {error && (
                        <p className="text-red-500 text-sm text-center">
                            {error}
                        </p>
                    )}

                    <Button
                        className="rounded-3xl py-6 text-[16px]"
                        onClick={() => onSubmit()}
                        disabled={isPending}
                    >
                        {isPending ? "Signing in..." : "Sign in"}
                    </Button>
                </div>

                <div className="text-center text-[15px] font-bold mt-4 text-blue-600">
                    <Link href="/reset-password">
                        Reset your password
                    </Link>
                </div>
            </div>
        </div>
    );
};