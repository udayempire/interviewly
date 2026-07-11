"use client"

import { useState } from "react"
import { InterviewAbout } from "@/components/interview/interviewAbout"
import { GithubEntry } from "@/components/interview/githubEntry"
import { ResumeEntry } from "@/components/interview/resumeEntry"
import { InterviewSuggestions } from "@/components/interview/interviewSuggestions"
import { ShieldCheck } from "lucide-react"

export default function Interview() {
    // Shared state — lifted so suggestions can fill the textarea
    const [topic, setTopic] = useState("")

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Page heading */}
            <div className="flex flex-col items-center gap-2 mb-14">
                <h1 className="text-3xl font-semibold">Create your AI Interview</h1>
                <p className="text-sm text-gray-500">
                    Practice real conversations, get instant feedback and improve faster
                </p>
            </div>

            {/* Three input cards */}
            <div className="grid grid-cols-3 gap-4">
                {/* Card 1: topic is controlled from this page */}
                <InterviewAbout value={topic} onChange={setTopic} />
                <GithubEntry />
                <ResumeEntry />
            </div>

            {/* Create Interview CTA */}
            <div className="flex flex-col items-center gap-3 mt-8">
                <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-[14px] px-8 py-3 rounded-md transition-colors cursor-pointer">
                    <p>Create Interview</p>
                </button>

                {/* Privacy note */}
                {/* <div className="flex items-center gap-1.5 text-[12.5px] text-zinc-400">
                    <ShieldCheck className="h-3.5 w-3.5 text-zinc-400" strokeWidth={1.75} />
                    <span>Your data is private and secure</span>
                </div> */}
            </div>

            {/* Suggestions — clicking fills the topic textarea above */}
            <InterviewSuggestions onSelect={(title) => setTopic(title)} />
        </div>
    )
}