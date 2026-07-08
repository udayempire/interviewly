"use client"

import {
    Code2,
    Network,
    Smile,
    BarChart2,
    Users,
    Server,
} from "lucide-react"
import { Card } from "@/components/ui/card"

const suggestions = [
    {
        title: "Frontend Developer Interview",
        subtitle: "React, Next.js, JavaScript",
        icon: Code2,
        iconBg: "bg-blue-50",
        iconColor: "text-blue-500",
    },
    {
        title: "System Design Interview",
        subtitle: "Scalability, APIs, Databases",
        icon: Network,
        iconBg: "bg-orange-50",
        iconColor: "text-orange-500",
    },
    {
        title: "Behavioral Interview",
        subtitle: "Leadership, Teamwork, Problem Solving",
        icon: Smile,
        iconBg: "bg-teal-50",
        iconColor: "text-teal-500",
    },
    {
        title: "Data Analyst Interview",
        subtitle: "SQL, Python, Data Analysis",
        icon: BarChart2,
        iconBg: "bg-violet-50",
        iconColor: "text-violet-500",
    },
    {
        title: "Product Manager Interview",
        subtitle: "Product Sense, Metrics, Strategy",
        icon: Users,
        iconBg: "bg-purple-50",
        iconColor: "text-purple-500",
    },
    {
        title: "DevOps Engineer Interview",
        subtitle: "CI/CD, Docker, Kubernetes",
        icon: Server,
        iconBg: "bg-indigo-50",
        iconColor: "text-indigo-500",
    },
]

interface SuggestionCardProps {
    title: string
    subtitle: string
    icon: React.ElementType
    iconBg: string
    iconColor: string
    onClick?: () => void
}

function SuggestionCard({ title, subtitle, icon: Icon, iconBg, iconColor, onClick }: SuggestionCardProps) {
    return (
        <Card
            onClick={onClick}
            className="flex justify-start items-center gap-3.5 p-4 rounded-xl border border-zinc-100 bg-white hover:border-blue-200 hover:bg-blue-50/30 transition-all duration-150 cursor-pointer "
        >
            <div className={`shrink-0 h-10 w-10 rounded-lg ${iconBg} flex items-center justify-center`}>
                <Icon className={`h-5 w-5 ${iconColor}`} strokeWidth={1.75} />
            </div>
            <div className="min-w-0">
                <p className="text-[13.5px] font-semibold text-zinc-800 leading-tight truncate">{title}</p>
                <p className="text-[12px] text-zinc-400 mt-0.5 leading-tight">{subtitle}</p>
            </div>
        </Card>
    )
}

interface InterviewSuggestionsProps {
    onSelect?: (title: string) => void
}

export function InterviewSuggestions({ onSelect }: InterviewSuggestionsProps) {
    return (
        <div className="mt-10 border py-6 px-6 rounded-md">
            <p className="text-[13.5px] font-semibold text-zinc-700 mb-4">
                Suggestions to get started
            </p>
            <div className="grid grid-cols-3 gap-3">
                {suggestions.map((s) => (
                    <SuggestionCard
                        key={s.title}
                        {...s}
                        onClick={() => onSelect?.(`${s.title} focusing on ${s.subtitle}`)}
                    />
                ))}
            </div>
        </div>
    )
}
