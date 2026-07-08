import { InterviewActionCards } from "@/components/home/interviewActionCards";
import { InterviewReportCard } from "@/components/home/interviewReportCard";
import { QuickStats } from "@/components/home/quickStats";
import Link from "next/link";

export default function Home() {
    return (
        <div className="grid grid-cols-[70%_30%] min-h-screen">
            <div className="p-6">
                <div className="space-y-2">
                    <h1 className="text-2xl font-bold">Welcome back, Uday ! 👋</h1>
                    <h2 className="text-lg font-ex text-gray-700">What would you like to do today?</h2>
                </div>
                <div className="grid grid-cols-2 gap-4 p-2 mt-6">
                    <InterviewActionCards
                        title={"Join an Interview"}
                        description={"Enter an Interview code provided by your company/recruiter to join."}
                        buttonDescription={"Join Interview"}
                    />
                    <InterviewActionCards
                        title={"Create Instant Interview"}
                        description={"Start a practice Interview instantly with your resume and Github."}
                        buttonDescription={"Create Interview"}
                    />
                </div>
                <div className="mt-8">
                    <div className="flex justify-between">
                        <h1 className="font-bold text-[18px]"> Your Recent Interviews</h1>
                        <Link href="/all-interviews" className="text-blue-600 font-semibold">View All</Link>
                    </div>
                    <div className="space-y-1.5 mt-6">
                        <InterviewReportCard title={"Frontend Developer Interview"} status="Completed" timeAgo={"2 Days ago"} />
                        <InterviewReportCard title={"Frontend Developer Interview"} status="Processing" timeAgo={"2 Days ago"} />
                        <InterviewReportCard title={"Frontend Developer Interview"} status="Completed" timeAgo={"2 Days ago"} />
                        <InterviewReportCard title={"Frontend Developer Interview"} status="Completed" timeAgo={"2 Days ago"} />
                    </div>
                </div>

            </div>

            <div className="px-2">
                <QuickStats />
            </div>
        </div>
    );
}