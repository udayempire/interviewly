'use client'
import { useEffect, useState } from "react";
import { InterviewActionCards } from "@/components/home/interviewActionCards";
import { InterviewReportCard } from "@/components/home/interviewReportCard";
import { QuickStats } from "@/components/home/quickStats";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

async function fetchRecentInterviews() {
    const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/${process.env.NEXT_PUBLIC_API_VERSION}/interview?limit=5`,
        {
            credentials: "include",
            method: "GET"
        }
    )
    if (!response.ok) {
        throw new Error("Failed to fetch recent interviews");
    }
    return response.json();
}

export default function Home() {
    const router = useRouter();
    const [joinDialogOpen, setJoinDialogOpen] = useState(false);
    const { data, isLoading, error } = useQuery({
        queryKey: ["interviews", { limit: 5 }],
        queryFn: fetchRecentInterviews,
    });
    const interviews = data?.interviews || [];

    useEffect(() => {
        const fetchRecentInterviews = async () => {
            try {
                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/${process.env.NEXT_PUBLIC_API_VERSION}/interview?limit=5`,
                    {
                        credentials: "include",
                        method: "GET",
                    }
                );

                if (response.ok) {
                    const data = await response.json();
                    console.log(data);
                } else {
                    console.error("Failed to fetch recent interviews");
                }
            } catch (error) {
                console.error("Failed to fetch recent interviews", error);
            }
        };
        fetchRecentInterviews();
    }, []);

    return (
        <div className="grid grid-cols-[70%_30%] min-h-screen">
            <div className="p-6">
                <div className="space-y-2">
                    <h1 className="text-2xl font-bold">Welcome back, Uday ! 👋</h1>
                    <h2 className="text-md  text-gray-700">What would you like to do today?</h2>
                </div>
                <div className="grid grid-cols-2 gap-4 p-2 mt-6">
                    <InterviewActionCards
                        title={"Join an Interview"}
                        description={"Enter an Interview code provided by your company/recruiter to join."}
                        buttonDescription={"Join Interview"}
                        onClick={() => setJoinDialogOpen(true)}
                    />
                    <InterviewActionCards
                        title={"Create Instant Interview"}
                        description={"Start a practice Interview instantly with your resume and Github."}
                        buttonDescription={"Create Interview"}
                        onClick={() => router.push("/interview")}
                    />
                </div>
                <div className="mt-8">
                    <div className="flex justify-between">
                        <h1 className="font-bold text-[18px]"> Your Recent Interviews</h1>
                        <Link href="/all-interviews" className="text-blue-600 font-semibold">View All</Link>
                    </div>
                    <div className="space-y-1.5 mt-6">
                        {isLoading ? (
                            <p className="text-sm text-gray-500">Loading recent interviews...</p>
                        ) : error ? (
                            <p className="text-sm text-red-500">Failed to load interviews.</p>
                        ) : interviews.length === 0 ? (
                            <p className="text-sm text-gray-500">No interviews found.</p>
                        ) : (
                            interviews.map((interview: any) => (
                                <InterviewReportCard
                                    key={interview.id}
                                    title={interview.description || "Interview Session"}
                                    status={interview.status}
                                    timeAgo={new Date(interview.createdAt).toLocaleDateString()}
                                />
                            ))
                        )}
                    </div>
                </div>

            </div>

            <div className="px-2">
                <QuickStats />
            </div>

            {/* Join Interview Dialog */}
            <Dialog open={joinDialogOpen} onOpenChange={setJoinDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold">Join an Interview</DialogTitle>
                        <DialogDescription>
                            This feature is currently in progress. Stay tuned!
                        </DialogDescription>
                    </DialogHeader>
                </DialogContent>
            </Dialog>
        </div>
    );
}