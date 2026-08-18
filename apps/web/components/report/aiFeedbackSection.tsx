import { Card } from "../ui/card";
import { CircleCheck, AlertCircle } from "lucide-react";

interface AIFeedbackSectionProps {
    strengths: string[];
    improvements: string[];
}

export const AIFeedbackSection = ({ strengths, improvements }: AIFeedbackSectionProps) => {
    return (
        <Card className="p-6 bg-white">
            <div className="flex items-center gap-2 mb-5">
                <span className="text-lg">1</span>
                <h2 className="text-lg font-bold text-zinc-800">AI Feedback</h2>
            </div>

            {/* Strengths */}
            <div className="bg-green-50 border border-green-100 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-2 mb-3">
                    <CircleCheck className="size-5 text-green-600" />
                    <h3 className="font-semibold text-green-700">Strengths</h3>
                </div>
                <ul className="space-y-2 ml-7">
                    {strengths.map((item, index) => (
                        <li key={index} className="text-sm text-zinc-700 list-disc">{item}</li>
                    ))}
                </ul>
            </div>

            {/* Areas to Improve */}
            <div className="bg-orange-50 border border-orange-100 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                    <AlertCircle className="size-5 text-orange-500" />
                    <h3 className="font-semibold text-orange-600">Areas to Improve</h3>
                </div>
                <ul className="space-y-2 ml-7">
                    {improvements.map((item, index) => (
                        <li key={index} className="text-sm text-zinc-700 list-disc">{item}</li>
                    ))}
                </ul>
            </div>
        </Card>
    );
};
