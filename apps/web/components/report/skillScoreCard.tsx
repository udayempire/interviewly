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
        <Card className="p-5 flex flex-col items-center text-center gap-2 bg-card">
            <div className={`p-3 rounded-xl ${iconBgColor}`}>
                <Icon className={`size-6 ${iconColor}`} />
            </div>
            <p className="text-sm font-medium text-muted-foreground">{skillName}</p>
            <div className="flex items-baseline gap-0.5">
                <span className="text-3xl font-bold text-foreground">{score}</span>
                <span className="text-sm text-muted-foreground">/{maxScore}</span>
            </div>
            <span className={`text-sm font-semibold ${ratingColor}`}>{rating}</span>
            <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
        </Card>
    );
};
