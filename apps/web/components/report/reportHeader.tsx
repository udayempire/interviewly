import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface ReportHeaderProps {
    interviewTitle: string;
    date: string;
    time: string;
    duration: string;
}

export const ReportHeader = ({ interviewTitle, date, time, duration }: ReportHeaderProps) => {
    return (
        <div>
            <Link
                href="/home"
                className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-800 transition-colors mb-4"
            >
                <ArrowLeft className="size-4" />
                Back to Interviews
            </Link>
            <h1 className="text-2xl font-bold text-zinc-800">Interview Report</h1>
            <p className="text-sm text-zinc-400 mt-1">
                {interviewTitle} &middot; {date} &middot; {time} &middot; {duration}
            </p>
        </div>
    );
};
