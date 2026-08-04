"use client";

import { useParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { ReportHeader } from "@/components/report/reportHeader";
import { OverallScoreRing } from "@/components/report/overallScoreRing";
import { SkillScoreCard } from "@/components/report/skillScoreCard";
import { AIFeedbackSection } from "@/components/report/aiFeedbackSection";
import { QuestionBreakdown, type QuestionRow } from "@/components/report/questionBreakdown";
import {
    MessageSquare,
    Lightbulb,
    Code2,
    LayoutGrid,
    FileCode2,
    BrainCircuit,
    Users,
    Search,
    MessageCircle,
} from "lucide-react";

// todo : Replace all placeholder data below with
// actual backend API calls using the interview ID

const placeholderSkills = [
    {
        icon: MessageSquare,
        iconColor: "text-blue-600",
        iconBgColor: "bg-blue-50",
        skillName: "Communication",
        score: 85,
        rating: "Good",
        description: "You communicated your thoughts clearly and structured your answers well.",
    },
    {
        icon: Lightbulb,
        iconColor: "text-yellow-500",
        iconBgColor: "bg-yellow-50",
        skillName: "Problem Solving",
        score: 80,
        rating: "Good",
        description: "You approached problems with good logic and broke them down effectively.",
    },
    {
        icon: Code2,
        iconColor: "text-green-600",
        iconBgColor: "bg-green-50",
        skillName: "Technical Knowledge",
        score: 84,
        rating: "Good",
        description: "You demonstrated strong understanding of core concepts and technologies.",
    },
];

const placeholderStrengths = [
    "Strong understanding of React concepts and component lifecycle.",
    "Good problem solving skills and ability to handle edge cases.",
    "Clear and structured communication throughout the interview.",
];

const placeholderImprovements = [
    "Optimize your code for better performance in large scale applications.",
    "Improve explanations for system design trade-offs.",
    "Practice more on advanced JavaScript concepts and async patterns.",
];

const placeholderQuestions: QuestionRow[] = [
    { number: 1, icon: LayoutGrid, iconColor: "text-blue-500", questionType: "React Concepts", score: "85/100", timeSpent: "6m 12s", performance: "Good" },
    { number: 2, icon: LayoutGrid, iconColor: "text-purple-500", questionType: "System Design", score: "78/100", timeSpent: "8m 45s", performance: "Good" },
    { number: 3, icon: FileCode2, iconColor: "text-yellow-500", questionType: "JavaScript", score: "90/100", timeSpent: "4m 30s", performance: "Excellent" },
    { number: 4, icon: Code2, iconColor: "text-green-500", questionType: "Coding Challenge", score: "80/100", timeSpent: "15m 20s", performance: "Good" },
    { number: 5, icon: BrainCircuit, iconColor: "text-orange-500", questionType: "Problem Solving", score: "75/100", timeSpent: "6m 05s", performance: "Good" },
    { number: 6, icon: Users, iconColor: "text-pink-500", questionType: "Behavioral", score: "88/100", timeSpent: "5m 10s", performance: "Excellent" },
    { number: 7, icon: Search, iconColor: "text-indigo-500", questionType: "Code Review", score: "—", timeSpent: "—", performance: "Skipped" },
    { number: 8, icon: MessageCircle, iconColor: "text-teal-500", questionType: "Follow-up", score: "82/100", timeSpent: "4m 00s", performance: "Good" },
];

export default function InterviewReportPage() {
    const params = useParams<{ id: string }>();
    const interviewId = params?.id;

    // TODO: Fetch report data from backend using interviewId
    // const { data: report, isLoading } = useQuery(...)

    return (
        <div className="min-h-screen bg-zinc-50">
            {/* Top bar */}
            <div className="bg-white border-b px-8 py-3 flex items-center">
                <h1 className="font-semibold text-zinc-800">interviewlyy</h1>
            </div>

            {/* Main content */}
            <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
                {/* Header */}
                <ReportHeader
                    interviewTitle="Frontend Developer Interview"
                    date="May 30, 2025"
                    time="10:30 AM"
                    duration="52 mins"
                />

                {/* Score Section */}
                <Card className="p-6 bg-white">
                    <div className="grid grid-cols-4 gap-6 items-start">
                        <OverallScoreRing
                            score={82}
                            label="Great Performance! 🎉"
                            sublabel="You scored higher than 78% of users"
                        />
                        {placeholderSkills.map((skill) => (
                            <SkillScoreCard key={skill.skillName} {...skill} />
                        ))}
                    </div>
                </Card>

                {/* AI Feedback */}
                <AIFeedbackSection
                    strengths={placeholderStrengths}
                    improvements={placeholderImprovements}
                />

                {/* Question Breakdown */}
                <QuestionBreakdown
                    totalQuestions={8}
                    answeredQuestions={7}
                    questions={placeholderQuestions}
                />
            </div>
        </div>
    );
}
