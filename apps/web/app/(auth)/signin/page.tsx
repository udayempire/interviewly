"use client"
import { Button } from "@/components/ui/button";
import { Field, FieldLabel, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useMutation } from "@tanstack/react-query";
import { Eye, EyeClosed, Mail } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";



export default function Signin() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);


    const { mutate: signin, isPending, error } = useMutation({
        mutationFn: async (formData: { email: string, password: string }) => {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/${process.env.NEXT_PUBLIC_API_VERSION}/auth/signin`, {
                method: "POST",
                headers: {
                    "Content-type": "application/json",
                },
                body: JSON.stringify(formData)
            })
            const data = await response.json();
            if (!response.ok) {
                if (data.error && typeof data.error === "object" && "issues" in data.error) {
                    throw new Error(data.error.issues[0]?.message || "Validation failed");
                }
                throw new Error(data.error || "Failed to sign up");
            };
            return data;
        },
        onSuccess: (data) => {
            if (data.token) {
                localStorage.setItem("token", data.token);
                localStorage.setItem("user", JSON.stringify(data.user));
            }
            ; router.push("/dashboard")
        }
    });
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        signin({ email, password })
    };
    return (
        <div className="grid grid-cols-2 h-screen">
            <div className="relative flex w-full flex-col items-center justify-center overflow-hidden bg-gray-100 p-8">
                <div
                    className="pointer-events-none absolute inset-0 opacity-50"
                    style={{
                        backgroundImage: "url('/noise.svg')",
                        backgroundRepeat: "repeat",
                    }}
                />
                <div className="flex flex-col w-full items-center justify-center gap-6 bg-white p-8 max-w-xl rounded-sm shadow-2xl">
                    <div className="relative z-10 flex w-full flex-col items-center">
                        <div className="px-3 text-center">
                            <h1 className="text-2xl font-bold">Welcome back, Human</h1>
                            <h2 className="font-medium text-gray-600">Sign In to continue using our Interviewlyy</h2>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="w-full max-w-md mt-6">
                        {/* Added flex flex-col gap-6 to stack fields neatly with spacing */}
                        <FieldSet className="flex flex-col gap-6">
                            <Field className="flex flex-col gap-2 w-full">
                                <FieldLabel>Enter your Email</FieldLabel>
                                <div className="relative">
                                    <Mail className="w-5 h-5 absolute left-3 top-2 text-gray-400" />
                                    <Input type="email"
                                        value={email}
                                        onChange={(e) => {
                                            setEmail(e.target.value)
                                        }}
                                        placeholder="Email" className="pl-10 w-full" />
                                </div>
                            </Field>

                            <Field className="flex flex-col gap-2 w-full">
                                <FieldLabel>Enter your password</FieldLabel>
                                <div className="relative">
                                    <span className="absolute left-3 top-2 text-gray-400 pointer-events-none">
                                        {showPassword ?
                                            <Eye className="h-5 w-5 cursor-pointer pointer-events-auto text-gray-500 hover:text-gray-700" onClick={() => {
                                                setShowPassword(false)
                                            }} /> :
                                            <EyeClosed className="h-5 w-5 cursor-pointer pointer-events-auto text-gray-500 hover:text-gray-700" onClick={() => {
                                                setShowPassword(true)
                                            }} />
                                        }
                                    </span>
                                    <Input
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Password"
                                        className="w-full pl-10"
                                        value={password}
                                        onChange={(e) => {
                                            setPassword(e.target.value);
                                        }}
                                    />
                                </div>
                            </Field>
                            {error && (
                                <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-md text-sm text-center">
                                    {error.message}
                                </div>
                            )}
                            <Field className="w-full mt-4">
                                <Button
                                    className="bg-blue-600 font-semibold w-full"
                                    type="submit"
                                    disabled={isPending}
                                >
                                    {isPending ? "Please wait" : "Log In"}
                                </Button>
                            </Field>

                            <Link className="text-center text-sm text-blue-600 hover:underline mt-2" href={"/signup"}>
                                <span className="text-blue-500 hover:underline-offset-2 hover:text-blue-700 hover:underline">
                                    New to this Platform? Sign up to register.
                                </span>
                            </Link>
                        </FieldSet>
                    </form>
                </div>
            </div>
            <div className="flex items-center justify-center bg-gray-50">
                hello
            </div>
        </div>
    );
}