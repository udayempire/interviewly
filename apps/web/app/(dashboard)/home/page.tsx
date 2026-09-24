"use client";

import { useState } from "react";
import { ChevronRight, Mic, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { InterviewActionCards } from "@/components/home/interviewActionCards";
import { InterviewReportCard } from "@/components/home/interviewReportCard";
import { QuickStats } from "@/components/home/quickStats";

type RecentInterview = {
  id: string;
  description?: string | null;
  status: string;
  createdAt: string;
};

async function fetchRecentInterviews() {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/${process.env.NEXT_PUBLIC_API_VERSION}/interview?limit=5`,
    { credentials: "include", method: "GET" },
  );

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

  return (
    <div className="product-page min-h-full bg-[#faf9f5] text-[#20201e] dark:bg-[#171715] dark:text-[#f4f1e8]">
      <div className="mx-auto w-full max-w-7xl px-5 py-5 sm:px-8 sm:py-7 lg:px-10 lg:py-8">

        <section className="grid gap-10 py-5 lg:grid-cols-[minmax(0,1fr)_19rem] lg:items-end lg:py-0">
          <div className="max-w-2xl">
            {/*<p className="mb-4 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-[#77746b]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#e5ae20]" />
              Ready when you are
            </p>*/}
            <h1 className="pb-6 text-2xl font-semibold leading-[1.02] tracking-[-0.045em] text-[#20201e] dark:text-[#f4f1e8] sm:text-4xl lg:text-5xl">
              Prepare for your next interview.
            </h1>
          </div>
        </section>

        <section className="border-y border-[#dfddd3] py-6 dark:border-[#3a3934]" aria-labelledby="practice-heading">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#77746b] dark:text-[#aaa69b]">Practice</p>
              <h2 id="practice-heading" className="mt-1 text-xl font-semibold tracking-[-0.035em]">Choose your next step</h2>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <InterviewActionCards
              title="Start an interview"
              description="Build a fresh practice session around your experience, resume, and work."
              buttonDescription="Create interview"
              icon={Plus}
              onClick={() => router.push("/interview")}
              featured
            />
            <InterviewActionCards
              title="Join an interview"
              description="Enter the interview code shared by your recruiter or company to begin."
              buttonDescription="Join with a code"
              icon={Mic}
              onClick={() => setJoinDialogOpen(true)}
            />
          </div>
        </section>

        <section className="grid gap-7 py-8 lg:grid-cols-[minmax(0,1fr)_17rem] lg:py-9">
          <div>
            <div className="flex items-end justify-between gap-4 border-b border-[#dfddd3] pb-4 dark:border-[#3a3934]">
              <div>
                <h2 className="mt-1 text-xl font-semibold tracking-[-0.035em]">Recent interviews</h2>
              </div>
              <Link href="/all-interviews" className="group inline-flex items-center gap-1 text-sm font-semibold text-[#51451f] transition-colors hover:text-[#20201e] dark:text-[#e7c75f] dark:hover:text-[#f4f1e8]">
                View all
                <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>

            <div className="divide-y divide-[#e5e3da] dark:divide-[#3a3934]">
              {isLoading ? (
                <p className="py-8 text-sm text-[#77746b]">Loading your recent interviews…</p>
              ) : error ? (
                <p className="py-8 text-sm text-[#a53b31]">We couldn&apos;t load your recent interviews. Please try again.</p>
              ) : interviews.length === 0 ? (
                <div className="py-10">
                  <p className="text-base font-medium">Your practice history will appear here.</p>
                  <p className="mt-1 text-sm leading-6 text-[#77746b]">Start with one focused conversation and build from there.</p>
                </div>
              ) : (
                interviews.map((interview: RecentInterview) => (
                  <InterviewReportCard
                    key={interview.id}
                    title={interview.description || "Interview session"}
                    status={interview.status}
                    timeAgo={new Date(interview.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                  />
                ))
              )}
            </div>
          </div>

          <aside className="border-t border-[#dfddd3] pt-6 dark:border-[#3a3934] lg:border-l lg:border-t-0 lg:pl-7 lg:pt-0">
            <QuickStats />
          </aside>
        </section>
      </div>

      <Dialog open={joinDialogOpen} onOpenChange={setJoinDialogOpen}>
        <DialogContent className="border-[#d5d2c8] bg-[#fffdf8] dark:border-[#3a3934] dark:bg-[#20201e] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold tracking-[-0.035em] text-[#20201e] dark:text-[#f4f1e8]">Join an interview</DialogTitle>
            <DialogDescription className="leading-6 text-[#625f57] dark:text-[#c0bdb3]">
              This feature is currently in progress. Stay tuned!
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
}
