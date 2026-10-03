import { ArrowUpRight, Trophy } from "lucide-react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";

interface InterviewReportCardProps {
  id: string;
  title: string;
  status: string;
  timeAgo: string;
  score?: number | null;
}

export const InterviewReportCard = ({ id, title, status, timeAgo, score }: InterviewReportCardProps) => {
  const isCompleted = status === "COMPLETED";
  const queryClient = useQueryClient();

  const handlePrefetch = () => {
    if (!id || !isCompleted) return;
    queryClient.prefetchQuery({
      queryKey: ["interview-report", id],
      queryFn: async () => {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/${process.env.NEXT_PUBLIC_API_VERSION}/interview/report/${id}`,
          { credentials: "include" },
        );
        if (response.status === 202) {
          return { pending: true, report: null };
        }
        if (!response.ok) throw new Error("Failed to fetch report");
        const data = await response.json();
        return { pending: false, report: data.report };
      },
      staleTime: Infinity,
    });
  };

  return (
    <article className="group flex items-center justify-between gap-4 py-5 first:pt-5">
      <div className="min-w-0">
        <h3 className="truncate text-[15px] font-medium tracking-[-0.015em] text-[#20201e] dark:text-zinc-100">{title}</h3>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[#77746b] dark:text-zinc-400">
          <span className={`h-1.5 w-1.5 rounded-full ${isCompleted ? "bg-[#c79612]" : "bg-[#a9a59a]"}`} />
          <span>{isCompleted ? "Completed" : "abandoned"}</span>
          <span aria-hidden="true">·</span>
          <span>{timeAgo}</span>
          {score !== undefined && score !== null && (
            <>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1 font-semibold text-[#8b680d] dark:text-amber-300">
                <Trophy className="h-3 w-3 text-[#c79612] dark:text-amber-400" />
                <span>{score} pts</span>
              </span>
            </>
          )}
        </div>
      </div>
      {isCompleted ? (
        <Link
          href={`/interview/${id}/report`}
          onMouseEnter={handlePrefetch}
          onFocus={handlePrefetch}
          className="inline-flex cursor-pointer items-center gap-1.5 text-sm font-semibold text-[#51451f] transition-colors hover:text-[#20201e] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d39c13] dark:text-amber-300 dark:hover:text-amber-200"
        >
          View report
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      ) : (
        <span className="rounded-md bg-stone-200/60 px-2.5 py-1 text-xs font-medium text-[#77746b] dark:bg-zinc-800 dark:text-zinc-400">
          abandoned
        </span>
      )}
    </article>
  );
};
