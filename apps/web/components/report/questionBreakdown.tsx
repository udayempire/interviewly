import { Card } from "../ui/card";
import { type LucideIcon } from "lucide-react";

export interface QuestionRow {
    number: number;
    icon: LucideIcon;
    iconColor?: string;
    questionType: string;
    score: string;       // e.g. "85/100" or "—"
    timeSpent: string;   // e.g. "6m 12s" or "—"
    performance: string; // "Excellent" | "Good" | "Average" | "Skipped"
}

interface QuestionBreakdownProps {
    totalQuestions: number;
    answeredQuestions: number;
    questions: QuestionRow[];
}

const performanceColor: Record<string, string> = {
    Excellent: "text-blue-600 bg-blue-50",
    Good: "text-green-600 bg-green-50",
    Average: "text-yellow-600 bg-yellow-50",
    Poor: "text-red-600 bg-red-50",
    Skipped: "text-zinc-400 bg-zinc-100",
};

export const QuestionBreakdown = ({
    totalQuestions,
    answeredQuestions,
    questions,
}: QuestionBreakdownProps) => {
    return (
        <Card className="p-6 bg-white">
            <h2 className="text-lg font-bold text-zinc-800">Question Breakdown</h2>
            <p className="text-sm text-zinc-400 mt-1 mb-4">
                {answeredQuestions} out of {totalQuestions} questions answered
            </p>

            {/* Table header */}
            <div className="grid grid-cols-[40px_1fr_120px_120px_120px] gap-2 px-3 py-2 text-xs font-semibold text-zinc-400 uppercase tracking-wide border-b">
                <span>#</span>
                <span>Question Type</span>
                <span>Your Score</span>
                <span>Time Spent</span>
                <span className="text-right">Performance</span>
            </div>

            {/* Question rows */}
            {questions.map((q) => {
                const Icon = q.icon;
                const colors = performanceColor[q.performance] || "text-zinc-400 bg-zinc-100";

                return (
                    <div
                        key={q.number}
                        className="grid grid-cols-[40px_1fr_120px_120px_120px] gap-2 px-3 py-3 items-center border-b last:border-b-0 hover:bg-zinc-50 transition-colors"
                    >
                        <span className="text-sm font-medium text-zinc-500">{q.number}</span>
                        <div className="flex items-center gap-3">
                            <Icon className={`size-5 ${q.iconColor || "text-zinc-500"}`} />
                            <span className="text-sm font-medium text-zinc-700">{q.questionType}</span>
                        </div>
                        <span className="text-sm font-medium text-zinc-700">{q.score}</span>
                        <span className="text-sm text-zinc-500">{q.timeSpent}</span>
                        <div className="flex justify-end">
                            <span className={`text-xs font-semibold px-3 py-1 rounded-full ${colors}`}>
                                {q.performance}
                            </span>
                        </div>
                    </div>
                );
            })}
        </Card>
    );
};
