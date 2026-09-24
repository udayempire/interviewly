"use client";

import { useQuery } from "@tanstack/react-query";

const API_BASE = `${process.env.NEXT_PUBLIC_API_URL}/${process.env.NEXT_PUBLIC_API_VERSION}`;

async function fetchQuickStats() {
  const response = await fetch(`${API_BASE}/interview/stats/quick`, {
    credentials: "include",
    method: "GET",
  });
  if (!response.ok) throw new Error("Failed to fetch stats");
  return response.json();
}

function formatTime(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

export const QuickStats = () => {
  const { data, isLoading } = useQuery({ queryKey: ["quick-stats"], queryFn: fetchQuickStats });
  const stats = data?.stats;
  const items = [
    { label: "Interviews", value: stats?.totalInterviews ?? 0 },
    { label: "Completed", value: stats?.completed ?? 0 },
    { label: "Average score", value: stats?.avgScore ?? 0 },
    { label: "Practice time", value: formatTime(stats?.totalTimeMinutes ?? 0) },
  ];

  return (
    <section aria-labelledby="quick-stats-heading">
      <h2 id="quick-stats-heading" className="mt-1 text-xl font-semibold tracking-[-0.035em] text-[#20201e]">Progress</h2>
      <dl className="mt-6 divide-y divide-[#dfddd3] border-y border-[#dfddd3]">
        {items.map(({ label, value }) => (
          <div key={label} className="flex items-baseline justify-between gap-4 py-4">
            <dt className="text-sm text-[#625f57]">{label}</dt>
            <dd className="text-xl font-semibold tracking-[-0.035em] text-[#20201e]">{isLoading ? "–" : value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
};
