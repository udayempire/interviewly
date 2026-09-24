"use client"

import { Calendar, ChartNoAxesCombined, CheckCircle, Clock } from "lucide-react"
import { useQuery } from "@tanstack/react-query"

const API_BASE = `${process.env.NEXT_PUBLIC_API_URL}/${process.env.NEXT_PUBLIC_API_VERSION}`;

async function fetchQuickStats() {
    const response = await fetch(`${API_BASE}/interview/stats/quick`, {
        credentials: "include",
        method: "GET",
    });
    if (!response.ok) {
        throw new Error("Failed to fetch stats");
    }
    return response.json();
}

function formatTime(minutes: number): string {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

export const QuickStats = () => {
    const { data, isLoading } = useQuery({
        queryKey: ["quick-stats"],
        queryFn: fetchQuickStats,
    });

    const stats = data?.stats;

    return (
        <div className="p-3 px-3 border border-border rounded-md">
            <h1 className="font-bold text-[18px]"> Quick Stats </h1>
            <div className="grid grid-cols-2 gap-x-4 gap-y-3 w-full max-w-md mt-4">
                <div className="border p-2 px-4 rounded-md py-3">
                    <div className="flex justify-between items-start">
                        <div className=" space-y-2">
                            <h1 className="font-bold">{isLoading ? "–" : stats?.totalInterviews ?? 0}</h1>
                            <p className="text-muted-foreground text-md">Interviews</p>
                        </div>
                        <div>
                            <Calendar />
                        </div>
                    </div>
                </div>
                <div className="border p-2 px-4 rounded-md py-3">
                    <div className="flex justify-between items-start">
                        <div className="space-y-2">
                            <h1 className="font-bold">{isLoading ? "–" : stats?.completed ?? 0}</h1>
                            <p className="text-muted-foreground text-md">Completed</p>
                        </div>
                        <div className="text-green-600">
                            <CheckCircle />
                        </div>
                    </div>
                </div>
                <div className="border p-2 px-4 rounded-md py-3">
                    <div className="flex justify-between items-start">
                        <div className="space-y-2">
                            <h1 className="font-bold">{isLoading ? "–" : stats?.avgScore ?? 0}</h1>
                            <p className="text-muted-foreground text-md">Avg. Score</p>
                        </div>
                        <div className="text-purple-600">
                            <ChartNoAxesCombined />
                        </div>
                    </div>
                </div>
                <div className="border p-2 px-4 rounded-md py-3">
                    <div className="flex justify-between items-start">
                        <div className="space-y-2">
                            <h1 className="font-bold">{isLoading ? "–" : formatTime(stats?.totalTimeMinutes ?? 0)}</h1>
                            <p className="text-muted-foreground text-md">Total Time</p>
                        </div>
                        <div className="text-orange-400">
                            <Clock />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}