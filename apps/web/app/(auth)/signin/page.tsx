"use client"
import { Button } from "@/components/ui/button";
import { Field, FieldLabel, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import Link from "next/link";

export default function Signin() {
    return (
        <div className="grid grid-cols-2 h-screen">
            <div className="flex flex-col w-full items-center justify-center bg-orange-50 p-8">
                <div className="px-3 text-center mb-6">
                    <h1 className="text-2xl font-bold">Welcome back, Human</h1>
                    <h2 className="font-medium text-gray-600">Sign In to continue using our Platform</h2>
                </div>

                <form className="w-full max-w-md">
                    {/* Added flex flex-col gap-6 to stack fields neatly with spacing */}
                    <FieldSet className="flex flex-col gap-6">
                        <Field className="flex flex-col gap-2 w-full">
                            <FieldLabel>Enter your Email</FieldLabel>
                            {/* pl-4 ensures text starts exactly where the placeholder does */}
                            <Input type="email" placeholder="Email" className="pl-4 w-full" />
                        </Field>

                        <Field className="flex flex-col gap-2 w-full">
                            <FieldLabel>Enter your password</FieldLabel>
                            <Input type="password" placeholder="Password" className="pl-4 w-full" />
                        </Field>

                        <Field className="w-full mt-4">
                            <Button className="bg-blue-600 font-semibold w-full" type="submit">
                                Continue
                            </Button>
                        </Field>

                        <Link className="text-center text-sm text-blue-600 hover:underline mt-2" href={"/signup"}>
                            New to this Platform? Sign up to register.
                        </Link>
                    </FieldSet>
                </form>
            </div>
            <div className="flex items-center justify-center bg-gray-100">
                hello
            </div>
        </div>
    );
}