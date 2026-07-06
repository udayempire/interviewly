"use client"
import { Button } from "@/components/ui/button";
import { Field, FieldLabel, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useMutation } from "@tanstack/react-query";
import { Eye, EyeClosed, Mail, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Signup() {
    const router = useRouter();

    // Form state
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    // TanStack Query Mutation
    const { mutate: signup, isPending, error } = useMutation({
        mutationFn: async (formData: { name: string; email: string; password: string }) => {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/${process.env.NEXT_PUBLIC_API_VERSION}/auth/signup`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (!response.ok) {
                // Format Zod validation issues or backend error messages
                if (data.error && typeof data.error === "object" && "issues" in data.error) {
                    throw new Error(data.error.issues[0]?.message || "Validation failed");
                }
                throw new Error(data.error || "Failed to sign up");
            }

            return data;
        },
        onSuccess: (data) => {
            // Save JWT token and user info to localStorage
            if (data.token) {
                localStorage.setItem("token", data.token);
                localStorage.setItem("user", JSON.stringify(data.user));
            }
            // Navigate to dashboard
            router.push("/interview");
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        signup({ name, email, password });
    };

    return (
        <div className="grid grid-cols-2 h-screen">
            <div className="flex items-center justify-center bg-gray-100">
                hello
            </div>
            <div className="flex flex-col w-full items-center justify-center gap-6 bg-orange-50 p-8">
                <div className="px-3 text-center">
                    <h1 className="text-2xl font-bold">Hello Human</h1>
                    <h2 className="font-medium text-gray-600">Sign up to continue to Interviewlyy</h2>
                </div>

                <form onSubmit={handleSubmit} className="w-full max-w-md mt-6">
                    <FieldSet className="flex flex-col gap-4">

                        {/* Name Field */}
                        <Field className="flex flex-col gap-2 w-full">
                            <FieldLabel>Enter your Name</FieldLabel>
                            <div className="relative flex items-center w-full">
                                <span className="absolute left-3 text-gray-400 pointer-events-none">
                                    <User className="h-5 w-5" />
                                </span>
                                <Input
                                    type="text"
                                    placeholder="Full Name"
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="pl-10 w-full"
                                />
                            </div>
                        </Field>

                        {/* Email Field */}
                        <Field className="flex flex-col gap-2 w-full">
                            <FieldLabel>Enter your Email</FieldLabel>
                            <div className="relative flex items-center w-full">
                                <span className="absolute left-3 text-gray-400 pointer-events-none">
                                    <Mail className="h-5 w-5" />
                                </span>
                                <Input
                                    type="email"
                                    placeholder="Email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="pl-10 w-full"
                                />
                            </div>
                        </Field>

                        {/* Password Field */}
                        <Field className="flex flex-col gap-2 w-full">
                            <FieldLabel>Create your Password</FieldLabel>
                            <div className="relative flex items-center w-full">
                                <span className="absolute left-3 text-gray-400 pointer-events-none">
                                    {showPassword ? (
                                        <Eye
                                            className="h-5 w-5 cursor-pointer pointer-events-auto text-gray-500 hover:text-gray-700"
                                            onClick={() => setShowPassword(false)}
                                        />
                                    ) : (
                                        <EyeClosed
                                            className="h-5 w-5 cursor-pointer pointer-events-auto text-gray-500 hover:text-gray-700"
                                            onClick={() => setShowPassword(true)}
                                        />
                                    )}
                                </span>
                                <Input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Password (min. 6 characters)"
                                    required
                                    minLength={6}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="pl-10 w-full"
                                />
                            </div>
                        </Field>

                        {/* Error Display using TanStack Query's error object */}
                        {error && (
                            <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-md text-sm text-center">
                                {error.message}
                            </div>
                        )}

                        {/* Submit Button using TanStack Query's isPending state */}
                        <Field className="w-full mt-4">
                            <Button
                                className="bg-blue-600 hover:bg-blue-700 font-semibold w-full transition-colors"
                                type="submit"
                                disabled={isPending}
                            >
                                {isPending ? "Creating Account..." : "Create Account"}
                            </Button>
                        </Field>

                        <Link className="text-center text-sm text-blue-600 hover:underline mt-2" href={"/signin"}>
                            Already have an account? Sign in.
                        </Link>
                    </FieldSet>
                </form>
            </div>
        </div>
    );
}
