"use client";

import { useState } from "react";
import { ArrowLeft, Search, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { InterviewReportCard } from "@/components/home/interviewReportCard";

type InterviewItem = {
  id: string;
  description?: string | null;
  status: string;
  createdAt: string;
  report?: {
    overallScore?: number | null;
  } | null;
};

async function fetchAllInterviews() {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/${process.env.NEXT_PUBLIC_API_VERSION}/interview`,
    { credentials: "include", method: "GET" },
  );

  if (!response.ok) {
    throw new Error("Failed to fetch all interviews");
  }

  return response.json();
}

export default function AllInterviewsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "COMPLETED" | "IN_PROGRESS">("COMPLETED");

  const { data, isLoading, error } = useQuery({
    queryKey: ["interviews", "all"],
    queryFn: fetchAllInterviews,
  });

  const interviews: InterviewItem[] = data?.interviews || [];

  const filteredInterviews = interviews.filter((interview) => {
    const matchesSearch = (interview.description || "Interview session")
      .toLowerCase()
      .includes(searchQuery.toLowerCase());

    if (statusFilter === "COMPLETED") {
      return matchesSearch && interview.status === "COMPLETED";
    }
    if (statusFilter === "IN_PROGRESS") {
      return matchesSearch && interview.status !== "COMPLETED";
    }
    return matchesSearch;
  });

  const completedCount = interviews.filter((i) => i.status === "COMPLETED").length;
  const totalScored = interviews.filter((i) => i.report?.overallScore !== undefined && i.report?.overallScore !== null);
  const avgScore = totalScored.length > 0
    ? Math.round(totalScored.reduce((acc, curr) => acc + (curr.report?.overallScore || 0), 0) / totalScored.length)
    : null;

  return (
    <div className="product-page min-h-full bg-[#faf9f5] text-[#20201e] dark:bg-[#171715] dark:text-[#f4f1e8]">
      <div className="mx-auto w-full max-w-5xl px-5 py-6 sm:px-8 sm:py-8 lg:px-10 lg:py-10">
        
        {/* Header navigation */}
        <div className="mb-6">
          <Link
            href="/home"
            className="inline-flex items-center gap-2 text-sm font-medium text-[#77746b] transition-colors hover:text-[#20201e] dark:text-[#aaa69b] dark:hover:text-[#f4f1e8]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to dashboard
          </Link>
          
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#77746b] dark:text-[#aaa69b]">History</p>
              <h1 className="mt-1 text-2xl font-semibold tracking-[-0.035em] sm:text-3xl">All interviews</h1>
            </div>
            {interviews.length > 0 && (
              <div className="flex items-center gap-3 text-xs text-[#77746b] dark:text-[#aaa69b]">
                <span>Total: <strong className="font-semibold text-[#20201e] dark:text-[#f4f1e8]">{interviews.length}</strong></span>
                <span aria-hidden="true">·</span>
                <span>Completed: <strong className="font-semibold text-[#20201e] dark:text-[#f4f1e8]">{completedCount}</strong></span>
                {avgScore !== null && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>Avg Points: <strong className="font-semibold text-[#8b680d] dark:text-amber-300">{avgScore} pts</strong></span>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-[#dfddd3] pb-5 dark:border-[#3a3934]">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#77746b] dark:text-[#aaa69b]" />
            <input
              type="text"
              placeholder="Search interviews…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-md border border-[#dfddd3] bg-white py-2 pl-9 pr-3 text-sm text-[#20201e] placeholder-[#77746b] focus:border-[#c79612] focus:outline-none dark:border-[#3a3934] dark:bg-[#20201e] dark:text-[#f4f1e8] dark:placeholder-[#aaa69b]"
            />
          </div>

          <div className="flex items-center gap-1.5 self-start sm:self-auto">
            <SlidersHorizontal className="h-4 w-4 text-[#77746b] mr-1 dark:text-[#aaa69b]" />
            <button
              onClick={() => setStatusFilter("ALL")}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                statusFilter === "ALL"
                  ? "bg-[#20201e] text-white dark:bg-[#f4f1e8] dark:text-[#20201e]"
                  : "bg-stone-200/60 text-[#77746b] hover:bg-stone-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
              }`}
            >
              All ({interviews.length})
            </button>
            <button
              onClick={() => setStatusFilter("COMPLETED")}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                statusFilter === "COMPLETED"
                  ? "bg-[#20201e] text-white dark:bg-[#f4f1e8] dark:text-[#20201e]"
                  : "bg-stone-200/60 text-[#77746b] hover:bg-stone-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
              }`}
            >
              Completed ({completedCount})
            </button>
            <button
              onClick={() => setStatusFilter("IN_PROGRESS")}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                statusFilter === "IN_PROGRESS"
                  ? "bg-[#20201e] text-white dark:bg-[#f4f1e8] dark:text-[#20201e]"
                  : "bg-stone-200/60 text-[#77746b] hover:bg-stone-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
              }`}
            >
              Abandoned ({interviews.length - completedCount})
            </button>
          </div>
        </div>

        {/* Interviews List */}
        <div className="divide-y divide-[#e5e3da] dark:divide-[#3a3934]">
          {isLoading ? (
            <div className="space-y-4 py-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center justify-between py-4">
                  <div className="space-y-2">
                    <div className="h-4 w-60 animate-pulse rounded bg-[#e5e3da] dark:bg-zinc-800" />
                    <div className="h-3 w-36 animate-pulse rounded bg-[#e5e3da] dark:bg-zinc-800" />
                  </div>
                  <div className="h-4 w-20 animate-pulse rounded bg-[#e5e3da] dark:bg-zinc-800" />
                </div>
              ))}
            </div>
          ) : error ? (
            <p className="py-8 text-sm text-[#a53b31]">Could not load interviews. Please try refreshing.</p>
          ) : filteredInterviews.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-base font-medium">No interviews found.</p>
              <p className="mt-1 text-sm text-[#77746b]">
                {searchQuery ? "Try matching a different search term or clearing filters." : "Start your first practice session on the home dashboard."}
              </p>
            </div>
          ) : (
            filteredInterviews.map((interview) => (
              <InterviewReportCard
                key={interview.id}
                id={interview.id}
                title={interview.description || "Interview session"}
                status={interview.status}
                timeAgo={new Date(interview.createdAt).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
                score={interview.report?.overallScore}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
