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
        iconBg: "bg-blue-50 dark:bg-blue-950/30",
        iconColor: "text-blue-500",
    },
    {
        title: "System Design Interview",
        subtitle: "Scalability, APIs, Databases",
        icon: Network,
        iconBg: "bg-orange-50 dark:bg-orange-950/30",
        iconColor: "text-orange-500",
    },
    {
        title: "Behavioral Interview",
        subtitle: "Leadership, Teamwork, Problem Solving",
        icon: Smile,
        iconBg: "bg-teal-50 dark:bg-teal-950/30",
        iconColor: "text-teal-500",
    },
    {
        title: "Data Analyst Interview",
        subtitle: "SQL, Python, Data Analysis",
        icon: BarChart2,
        iconBg: "bg-violet-50 dark:bg-violet-950/30",
        iconColor: "text-violet-500",
    },
    {
        title: "Product Manager Interview",
        subtitle: "Product Sense, Metrics, Strategy",
        icon: Users,
        iconBg: "bg-purple-50 dark:bg-purple-950/30",
        iconColor: "text-purple-500",
    },
    {
        title: "DevOps Engineer Interview",
        subtitle: "CI/CD, Docker, Kubernetes",
        icon: Server,
        iconBg: "bg-indigo-50 dark:bg-indigo-950/30",
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
            className="flex justify-start items-center gap-3.5 p-4 rounded-xl border border-border bg-card hover:border-blue-200 dark:hover:border-blue-800 hover:bg-blue-50/30 dark:hover:bg-blue-950/20 transition-all duration-150 cursor-pointer "
        >
            <div className={`shrink-0 h-7 w-7 rounded-lg ${iconBg} flex items-center justify-center`}>
                <Icon className={`h-5 w-5 ${iconColor}`} strokeWidth={1.75} />
            </div>
            <div className="">
                <p className="text-[13.5px] font-semibold text-foreground leading-tight truncate">{title}</p>
                <p className="text-[12px] text-muted-foreground mt-0.5 leading-tight">{subtitle}</p>
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
            <p className="text-[13.5px] font-semibold text-foreground mb-4">
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
