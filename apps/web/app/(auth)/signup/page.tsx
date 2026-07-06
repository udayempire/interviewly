"use client"
import { Button } from "@/components/ui/button";
import { Field, FieldLabel, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Eye, Mail } from "lucide-react";
import Link from "next/link";

export default function Signup() {
    return (
        <div className="grid grid-cols-2 h-screen">
            <div className="flex items-center justify-center bg-gray-100">
                hello
            </div>
            <div className="flex flex-col w-full items-center justify-center gap-6 bg-orange-50 p-8">
                <div className="px-3 text-center">
                    <h1 className="text-2xl font-bold">Hello Human</h1>
                    <h2 className="font-medium text-gray-600">Sign up to continue to our Platform</h2>
                </div>

                <form className="w-full max-w-md mt-6">
                    <FieldSet className="flex flex-col gap-4">

                        {/* Email Field */}
                        <Field className="flex flex-col gap-2 w-full">
                            <FieldLabel>Enter your Email</FieldLabel>
                            <div className="relative flex items-center w-full">
                                <span className="absolute left-3 text-gray-400 pointer-events-none">
                                    <Mail className="h-5 w-5" />
                                </span>
                                {/* Removed placeholder:px-10, pl-10 handles everything */}
                                <Input
                                    type="email"
                                    placeholder="Email"
                                    className="pl-10 w-full"
                                />
                            </div>
                        </Field>

                        {/* Password Field */}
                        <Field className="flex flex-col gap-2 w-full">
                            <FieldLabel>Create your Password</FieldLabel>
                            <div className="relative flex items-center w-full">
                                <span className="absolute left-3 text-gray-400 pointer-events-none">
                                    <Eye className="h-5 w-5" />
                                </span>
                                {/* Removed placeholder:px-10, pl-10 handles everything */}
                                <Input
                                    type="password"
                                    placeholder="Password"
                                    className="pl-10 w-full"
                                />
                            </div>
                        </Field>

                        <Field className="w-full mt-4">
                            <Button className="bg-blue-600 font-semibold w-full" type="submit">
                                Submit
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