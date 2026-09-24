import { ArrowUpRight } from "lucide-react";

interface InterviewReportCardProps {
  title: string;
  status: string;
  timeAgo: string;
}

export const InterviewReportCard = ({ title, status, timeAgo }: InterviewReportCardProps) => {
  const isCompleted = status === "COMPLETED";

  return (
    <article className="group flex items-center justify-between gap-4 py-5 first:pt-5">
      <div className="min-w-0">
        <h3 className="truncate text-[15px] font-medium tracking-[-0.015em] text-[#20201e]">{title}</h3>
        <div className="mt-2 flex items-center gap-2 text-xs text-[#77746b]">
          <span className={`h-1.5 w-1.5 rounded-full ${isCompleted ? "bg-[#c79612]" : "bg-[#a9a59a]"}`} />
          <span>{isCompleted ? "Completed" : status}</span>
          <span aria-hidden="true">·</span>
          <span>{timeAgo}</span>
        </div>
      </div>
      <button
        type="button"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#51451f]  transition-all hover:text-[#20201e]  focus:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d39c13] cursor-pointer"
      >
        View report
        <ArrowUpRight className="h-3.5 w-3.5" />
      </button>
    </article>
  );
};
