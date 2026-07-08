"use client"

import Image from "next/image"
import { Lock } from "lucide-react"
import { useState } from "react"

export const GithubEntry = () => {
    const [value, setValue] = useState("")

    return (
        <div className="border border-zinc-200 p-5 rounded-lg bg-white flex flex-col gap-5">
            {/* Header */}
            <div className="flex items-start gap-3">
                <div className="shrink-0 h-9 w-9 rounded-lg bg-[#f0fdf4] flex items-center justify-center">
                    <Image src="/github.svg" alt="GitHub" width={18} height={18} className="opacity-80" />
                </div>
                <div>
                    <h2 className="font-semibold text-[14px] text-zinc-900 leading-tight">
                        2. Add your GitHub{" "}
                        <span className="font-normal text-zinc-400">(optional)</span>
                    </h2>
                    <p className="text-[12.5px] text-zinc-400 mt-0.5">
                        We&apos;ll analyze your projects
                    </p>
                </div>
            </div>

            {/* GitHub URL input */}
            <div className="flex items-center gap-2.5 border border-zinc-200 rounded-lg px-3 py-2.5 bg-zinc-50 focus-within:ring-1 focus-within:ring-blue-400 focus-within:border-blue-400 transition-all">
                <Image src="/github.svg" alt="GitHub" width={15} height={15} className="opacity-50 shrink-0" />
                <input
                    type="text"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder="https://github.com/username"
                    className="flex-1 bg-transparent text-[13px] text-zinc-700 placeholder:text-zinc-400 outline-none border-none"
                />
            </div>

            {/* Privacy note */}
            <div className="flex items-start gap-2 text-[12px] text-zinc-400">
                <Lock className="h-3.5 w-3.5 mt-0.5 shrink-0 text-zinc-400" />
                <p>We only read public data. No changes will be made.</p>
            </div>
        </div>
    )
}
