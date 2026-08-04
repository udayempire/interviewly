import { Card } from "../ui/card";
import { type LucideIcon } from "lucide-react";

interface SkillScoreCardProps {
    icon: LucideIcon;
    iconColor?: string;
    iconBgColor?: string;
    skillName: string;
    score: number;
    maxScore?: number;
    rating: string;
    description: string;
}

export const SkillScoreCard = ({
    icon: Icon,
    iconColor = "text-blue-600",
    iconBgColor = "bg-blue-50",
    skillName,
    score,
    maxScore = 100,
    rating,
    description,
}: SkillScoreCardProps) => {
    const ratingColor = rating === "Excellent"
        ? "text-blue-600"
        : rating === "Good"
            ? "text-green-600"
            : rating === "Average"
                ? "text-yellow-600"
                : "text-red-600";

    return (
        <Card className="p-5 flex flex-col items-center text-center gap-2 bg-white">
            <div className={`p-3 rounded-xl ${iconBgColor}`}>
                <Icon className={`size-6 ${iconColor}`} />
            </div>
            <p className="text-sm font-medium text-zinc-500">{skillName}</p>
            <div className="flex items-baseline gap-0.5">
                <span className="text-3xl font-bold text-zinc-800">{score}</span>
                <span className="text-sm text-zinc-400">/{maxScore}</span>
            </div>
            <span className={`text-sm font-semibold ${ratingColor}`}>{rating}</span>
            <p className="text-xs text-zinc-400 leading-relaxed">{description}</p>
        </Card>
    );
};
