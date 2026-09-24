"use client";

import { BarChart2, Code2, Network, Server, Smile, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const suggestions: { title: string; subtitle: string; icon: LucideIcon }[] = [
  { title: "Frontend developer", subtitle: "React, Next.js, JavaScript", icon: Code2 },
  { title: "System design", subtitle: "Scalability, APIs, databases", icon: Network },
  { title: "Behavioral", subtitle: "Leadership and teamwork", icon: Smile },
  { title: "Data analyst", subtitle: "SQL, Python, analysis", icon: BarChart2 },
  { title: "Product manager", subtitle: "Product sense and metrics", icon: Users },
  { title: "DevOps engineer", subtitle: "CI/CD, Docker, Kubernetes", icon: Server },
];

interface InterviewSuggestionsProps {
  onSelect?: (title: string) => void;
}

export function InterviewSuggestions({ onSelect }: InterviewSuggestionsProps) {
  return (
    <section className="mt-9 border-t border-[#dfddd3] pt-6 dark:border-[#3a3934]" aria-labelledby="suggestions-heading">
      <h2 id="suggestions-heading" className="text-sm font-semibold text-[#20201e] dark:text-[#f4f1e8]">Start with a template</h2>
      <div className="mt-4 grid border-l border-t border-[#dfddd3] dark:border-[#3a3934] sm:grid-cols-2 lg:grid-cols-3">
        {suggestions.map(({ title, subtitle, icon: Icon }) => (
          <button
            key={title}
            type="button"
            onClick={() => onSelect?.(`${title} interview focusing on ${subtitle}`)}
            className="group flex cursor-pointer min-h-20 items-center gap-3 border-b border-r border-[#dfddd3] bg-[#fffdf8] px-4 py-3 text-left transition-colors hover:bg-[#fff7d8] focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-[#b98815] dark:border-[#3a3934] dark:bg-[#20201e] dark:hover:bg-[#342f1b]"
          >
            <Icon className="h-4 w-4 shrink-0 text-[#8b6b14]" strokeWidth={1.7} />
            <span className="min-w-0">
              <span className="block text-[13px] font-semibold text-[#20201e] dark:text-[#f4f1e8]">{title}</span>
              <span className="mt-0.5 block truncate text-xs text-[#77746b] dark:text-[#aaa69b]">{subtitle}</span>
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
