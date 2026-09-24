"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  AlertCircle,
  Brain,
  Code2,
  Lightbulb,
  Loader2,
  MessageSquare,
  Users,
} from "lucide-react";
import { ReportHeader } from "@/components/report/reportHeader";
import { OverallScoreRing } from "@/components/report/overallScoreRing";
import { SkillScoreCard } from "@/components/report/skillScoreCard";
import { AIFeedbackSection } from "@/components/report/aiFeedbackSection";

interface Breakdown {
  technicalKnowledge: number;
  communication: number;
  problemSolving: number;
  relevantExperience: number;
  overallImpression: number;
}
interface ReportData {
  id: string;
  interviewId: string;
  strengths: string[];
  improvements: string[];
  detailedFeedback: string;
  aiSummary: string;
  overallScore: number;
  breakdown: Breakdown;
  createdAt: string;
  interview: {
    description: string;
    startedAt: string;
    completedAt: string | null;
  };
}

function formatDuration(startedAt: string, completedAt: string | null) {
  if (!completedAt) return "—";
  const seconds = Math.floor(
    (new Date(completedAt).getTime() - new Date(startedAt).getTime()) / 1000,
  );
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}
function scoreLabel(score: number) {
  if (score >= 75) return "Strong performance";
  if (score >= 60) return "Solid foundation";
  return "Practice opportunity";
}

function GeneratingReport() {
  const steps = [
    "Reviewing interview transcript",
    "Evaluating technical depth",
    "Evaluating communication",
    "Preparing feedback",
  ];
  const [step, setStep] = useState(0);
  useEffect(() => {
    const timer = setInterval(
      () => setStep((current) => (current + 1) % steps.length),
      2500,
    );
    return () => clearInterval(timer);
  }, [steps.length]);
  return (
    <main className="flex min-h-screen items-center justify-center bg-stone-50 p-6 text-stone-900 dark:bg-zinc-950 dark:text-zinc-100">
      <section className="w-full max-w-sm border border-stone-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex h-10 w-10 items-center justify-center bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
          <Brain className="h-5 w-5" />
        </div>
        <h1 className="mt-5 text-xl font-semibold tracking-[-0.03em]">
          Preparing your report
        </h1>
        <p className="mt-2 text-sm leading-6 text-stone-600 dark:text-zinc-400">
          Your interview has ended. We&apos;re preparing your feedback.
        </p>
        <div className="mt-7 flex items-center gap-3 border-t border-stone-200 pt-4 dark:border-zinc-800">
          <Loader2 className="h-4 w-4 animate-spin text-amber-700 dark:text-amber-300" />
          <p className="text-sm font-medium text-stone-700 dark:text-zinc-300">
            {steps[step]}…
          </p>
        </div>
      </section>
    </main>
  );
}

function ReportError() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-stone-50 p-6 text-stone-900 dark:bg-zinc-950 dark:text-zinc-100">
      <section className="w-full max-w-sm border border-stone-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
        <h1 className="mt-5 text-xl font-semibold tracking-[-0.03em]">
          Could not load report
        </h1>
        <p className="mt-2 text-sm leading-6 text-stone-600 dark:text-zinc-400">
          Please refresh the page and try again.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="mt-5 h-10 bg-zinc-900 px-4 text-sm font-semibold text-white hover:bg-zinc-800 dark:bg-amber-300 dark:text-stone-900"
        >
          Retry
        </button>
      </section>
    </main>
  );
}

export default function InterviewReportPage() {
  const params = useParams<{ id: string }>();
  const interviewId = params?.id;
  const [report, setReport] = useState<ReportData | null>(null);
  const [status, setStatus] = useState<
    "loading" | "pending" | "ready" | "error"
  >("loading");

  useEffect(() => {
    if (!interviewId) return;
    let cancelled = false;
    async function poll() {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/${process.env.NEXT_PUBLIC_API_VERSION}/interview/report/${interviewId}`,
          { credentials: "include" },
        );
        if (cancelled) return;
        if (response.status === 202) {
          setStatus("pending");
          setTimeout(poll, 3000);
          return;
        }
        if (!response.ok) {
          setStatus("error");
          return;
        }
        const data = await response.json();
        setReport(data.report);
        setStatus("ready");
      } catch {
        if (!cancelled) setStatus("error");
      }
    }
    poll();
    return () => {
      cancelled = true;
    };
  }, [interviewId]);

  if (status === "loading" || status === "pending") return <GeneratingReport />;
  if (status === "error" || !report) return <ReportError />;

  const breakdown = report.breakdown ?? ({} as Breakdown);
  const skills = [
    {
      icon: MessageSquare,
      skillName: "Communication",
      score: breakdown.communication ?? 0,
      rating: breakdown.communication >= 75 ? "Strong" : "Needs work",
      description: "Clarity and confidence in communicating your ideas.",
    },
    {
      icon: Lightbulb,
      skillName: "Problem solving",
      score: breakdown.problemSolving ?? 0,
      rating: breakdown.problemSolving >= 75 ? "Strong" : "Needs work",
      description: "How you broke down and reasoned through problems.",
    },
    {
      icon: Code2,
      skillName: "Technical knowledge",
      score: breakdown.technicalKnowledge ?? 0,
      rating: breakdown.technicalKnowledge >= 75 ? "Strong" : "Needs work",
      description: "Understanding of relevant concepts and technologies.",
    },
    {
      icon: Users,
      skillName: "Experience",
      score: breakdown.relevantExperience ?? 0,
      rating: breakdown.relevantExperience >= 75 ? "Strong" : "Needs work",
      description: "Relevance and depth of your examples.",
    },
  ];

  return (
    <main className="min-h-screen bg-stone-50 text-stone-900 dark:bg-zinc-950 dark:text-zinc-100">
      <div className="mx-auto w-full max-w-6xl px-5 py-7 sm:px-8 lg:px-10 lg:py-10">
        <ReportHeader
          interviewTitle={report.interview.description || "Interview"}
          date={formatDate(report.interview.startedAt)}
          time={formatTime(report.interview.startedAt)}
          duration={formatDuration(
            report.interview.startedAt,
            report.interview.completedAt,
          )}
        />
        {report.aiSummary && (
          <section className="border-b border-stone-200 py-7 dark:border-zinc-800">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-stone-500 dark:text-zinc-400">
              Summary
            </p>
            <p className="mt-3 max-w-3xl text-base leading-7 text-stone-700 dark:text-zinc-300">
              {report.aiSummary}
            </p>
          </section>
        )}
        <section className="grid gap-8 border-b border-stone-200 py-8 dark:border-zinc-800 lg:grid-cols-[13rem_1fr]">
          <OverallScoreRing
            score={report.overallScore}
            label={scoreLabel(report.overallScore)}
            sublabel={`Overall score: ${report.overallScore}/100`}
          />
          <div className="grid gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
            {skills.map((skill) => (
              <SkillScoreCard key={skill.skillName} {...skill} />
            ))}
          </div>
        </section>
        <div className="py-8">
          <AIFeedbackSection
            strengths={report.strengths}
            improvements={report.improvements}
          />
        </div>
        {report.detailedFeedback && (
          <section className="border-t border-stone-200 py-7 dark:border-zinc-800">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-stone-500 dark:text-zinc-400">
              Detailed feedback
            </p>
            <p className="mt-4 max-w-3xl whitespace-pre-line text-sm leading-7 text-stone-700 dark:text-zinc-300">
              {report.detailedFeedback}
            </p>
          </section>
        )}
      </div>
    </main>
  );
}
