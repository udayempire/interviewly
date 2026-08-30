"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { ReportHeader } from "@/components/report/reportHeader";
import { OverallScoreRing } from "@/components/report/overallScoreRing";
import { SkillScoreCard } from "@/components/report/skillScoreCard";
import { AIFeedbackSection } from "@/components/report/aiFeedbackSection";
import {
    MessageSquare,
    Lightbulb,
    Code2,
    Brain,
    Users,
    Loader2,
    AlertCircle,
} from "lucide-react";
interface Breakdown {
    technicalKnowledge: number;
    communication: number;
    problemSolving: number;
    relevantExperience: number;
    overallImpression: number;
}

interface ReportData {
    id: string;
    interviewId: string;
    strengths: string[];
    improvements: string[];
    detailedFeedback: string;
    aiSummary: string;
    overallScore: number;
    breakdown: Breakdown;
    createdAt: string;
    interview: {
        description: string;
        startedAt: string;
        completedAt: string | null;
    };
}

// Helpers 

function formatDuration(startedAt: string, completedAt: string | null): string {
    if (!completedAt) return "—";
    const ms = new Date(completedAt).getTime() - new Date(startedAt).getTime();
    const totalSecs = Math.floor(ms / 1000);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins}m ${secs}s`;
}

function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
}

function formatTime(iso: string): string {
    return new Date(iso).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
    });
}

function scoreLabel(score: number): string {
    if (score >= 90) return "Exceptional 🌟";
    if (score >= 75) return "Great Performance! 🎉";
    if (score >= 60) return "Good Effort 👍";
    if (score >= 40) return "Needs Improvement";
    return "Keep Practising";
}

// Loading screen

function GeneratingReport() {
    const steps = [
        "Reviewing interview transcript…",
        "Analysing technical depth…",
        "Evaluating communication…",
        "Generating personalised feedback…",
        "Almost ready…",
    ];
    const [step, setStep] = useState(0);

    useEffect(() => {
        const t = setInterval(() => setStep((s) => (s + 1) % steps.length), 2500);
        return () => clearInterval(t);
    }, []);

    return (
        <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center gap-6 px-4">
            <div className="flex flex-col items-center gap-4 text-center">
                <div className="relative">
                    <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center">
                        <Brain size={36} className="text-blue-600" />
                    </div>
                    <Loader2 size={28} className="text-blue-500 animate-spin absolute -bottom-1 -right-1" />
                </div>
                <h1 className="text-2xl font-semibold text-zinc-800">Generating your report</h1>
                <p className="text-zinc-500 text-sm max-w-xs">
                    Our AI is evaluating your interview. This usually takes under a minute.
                </p>
                <p className="text-blue-600 text-sm font-medium animate-pulse min-h-[20px]">
                    {steps[step]}
                </p>
            </div>
        </div>
    );
}

// Error screen

function ReportError() {
    return (
        <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center gap-4 px-4 text-center">
            <AlertCircle size={48} className="text-red-400" />
            <h1 className="text-xl font-semibold text-zinc-800">Could not load report</h1>
            <p className="text-zinc-500 text-sm max-w-xs">
                Something went wrong fetching your report. Please try refreshing the page.
            </p>
        </div>
    );
}

// Main page 

export default function InterviewReportPage() {
    const params = useParams<{ id: string }>();
    const interviewId = params?.id;

    const [report, setReport] = useState<ReportData | null>(null);
    const [status, setStatus] = useState<"loading" | "pending" | "ready" | "error">("loading");

    useEffect(() => {
        if (!interviewId) return;
        const token = localStorage.getItem("token");
        if (!token) { setStatus("error"); return; }

        let cancelled = false;

        async function poll() {
            try {
                const res = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/${process.env.NEXT_PUBLIC_API_VERSION}/interview/report/${interviewId}`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                if (cancelled) return;

                if (res.status === 202) {
                    // Still generating — try again in 3 seconds
                    setStatus("pending");
                    setTimeout(poll, 3000);
                    return;
                }

                if (!res.ok) {
                    setStatus("error");
                    return;
                }

                const data = await res.json();
                setReport(data.report);
                setStatus("ready");
            } catch {
                if (!cancelled) setStatus("error");
            }
        }

        poll();
        return () => { cancelled = true; };
    }, [interviewId]);

    if (status === "loading" || status === "pending") return <GeneratingReport />;
    if (status === "error" || !report) return <ReportError />;

    const breakdown = report.breakdown ?? {};
    const skillCards = [
        {
            icon: MessageSquare,
            iconColor: "text-blue-600",
            iconBgColor: "bg-blue-50",
            skillName: "Communication",
            score: breakdown.communication ?? 0,
            rating: breakdown.communication >= 75 ? "Good" : "Needs Work",
            description: "How clearly and confidently you communicated your ideas.",
        },
        {
            icon: Lightbulb,
            iconColor: "text-yellow-500",
            iconBgColor: "bg-yellow-50",
            skillName: "Problem Solving",
            score: breakdown.problemSolving ?? 0,
            rating: breakdown.problemSolving >= 75 ? "Good" : "Needs Work",
            description: "Your ability to break down problems and reason through solutions.",
        },
        {
            icon: Code2,
            iconColor: "text-green-600",
            iconBgColor: "bg-green-50",
            skillName: "Technical Knowledge",
            score: breakdown.technicalKnowledge ?? 0,
            rating: breakdown.technicalKnowledge >= 75 ? "Good" : "Needs Work",
            description: "Depth of understanding of core concepts and technologies.",
        },
        {
            icon: Users,
            iconColor: "text-purple-600",
            iconBgColor: "bg-purple-50",
            skillName: "Experience",
            score: breakdown.relevantExperience ?? 0,
            rating: breakdown.relevantExperience >= 75 ? "Good" : "Needs Work",
            description: "Relevance and depth of your real-world experience.",
        },
    ];

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
                    interviewTitle={report.interview.description ?? "Interview"}
                    date={formatDate(report.interview.startedAt)}
                    time={formatTime(report.interview.startedAt)}
                    duration={formatDuration(report.interview.startedAt, report.interview.completedAt)}
                />

                {/* AI Summary */}
                {report.aiSummary && (
                    <Card className="p-6 bg-white">
                        <p className="text-sm text-zinc-500 font-medium mb-1">AI Summary</p>
                        <p className="text-zinc-700 leading-relaxed">{report.aiSummary}</p>
                    </Card>
                )}

                {/* Score Section */}
                <Card className="p-6 bg-white">
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6 items-start">
                        <OverallScoreRing
                            score={report.overallScore}
                            label={scoreLabel(report.overallScore)}
                            sublabel={`Overall score: ${report.overallScore}/100`}
                        />
                        {skillCards.map((skill) => (
                            <SkillScoreCard key={skill.skillName} {...skill} />
                        ))}
                    </div>
                </Card>

                {/* AI Feedback */}
                <AIFeedbackSection
                    strengths={report.strengths}
                    improvements={report.improvements}
                />

                {/* Detailed Feedback */}
                {report.detailedFeedback && (
                    <Card className="p-6 bg-white">
                        <p className="text-sm text-zinc-500 font-medium mb-2">Detailed Feedback</p>
                        <p className="text-zinc-700 leading-relaxed whitespace-pre-line">
                            {report.detailedFeedback}
                        </p>
                    </Card>
                )}
            </div>
        </div>
    );
}
