"use client"

import { MessageSquare } from "lucide-react"
import { Textarea } from "../ui/textarea"
import { useState } from "react"

const MAX_CHARS = 300

export const InterviewAbout = () => {
    const [value, setValue] = useState("")

    return (
        <div className="border border-zinc-200 p-5 rounded-lg bg-white flex flex-col gap-5">
            {/* Header */}
            <div className="flex items-start gap-3">
                <div className="shrink-0 h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center">
                    <MessageSquare className="h-4.5 w-4.5 text-blue-600" />
                </div>
                <div>
                    <h2 className="font-semibold text-[14px] text-zinc-900 leading-tight">
                        1. What kind of interview?
                    </h2>
                    <p className="text-[12.5px] text-zinc-400 mt-0.5">
                        Describe the role, skills or scenario
                    </p>
                </div>
            </div>

            {/* Textarea */}
            <div className="relative">
                <Textarea
                    maxLength={MAX_CHARS}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder="e.g. Frontend Developer interview focusing on React, JavaScript, and System Design..."
                    className="resize-none min-h-[200px] text-[13px] text-zinc-700 placeholder:text-zinc-400 border-zinc-200 rounded-lg bg-zinc-50 focus-visible:ring-1 focus-visible:ring-blue-400 focus-visible:border-blue-400 placeholder:text-sm"
                    rows={5}
                />
                {/* Character counter */}
                <span className="absolute bottom-2.5 right-3 text-[11px] text-zinc-400 select-none">
                    {value.length}/{MAX_CHARS}
                </span>
            </div>
        </div>
    )
}