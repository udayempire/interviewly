"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  ArrowLeft,
  Bot,
  User,
  MessageSquare,
  AlertCircle,
  Clock,
  FileText,
} from "lucide-react";

interface TranscriptMessage {
  id: string;
  role: "USER" | "ASSISTANT";
  content: string;
  questionNum?: number;
  createdAt: string;
}

interface TranscriptData {
  id: string;
  description: string;
  startedAt: string;
  completedAt: string | null;
  status: string;
  messages: TranscriptMessage[];
}

async function fetchInterviewTranscript(interviewId: string): Promise<TranscriptData> {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/${process.env.NEXT_PUBLIC_API_VERSION}/interview/${interviewId}/transcript`,
    { credentials: "include" },
  );

  if (!response.ok) {
    throw new Error("Failed to fetch interview transcript");
  }

  const data = await response.json();
  return data.interview;
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

function formatDuration(startedAt: string, completedAt: string | null) {
  if (!completedAt) return "In progress";
  const seconds = Math.floor(
    (new Date(completedAt).getTime() - new Date(startedAt).getTime()) / 1000,
  );
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}

function LoadingTranscript() {
  return (
    <main className="min-h-screen bg-stone-50 text-stone-900 dark:bg-zinc-950 dark:text-zinc-100">
      <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="h-4 w-32 animate-pulse rounded bg-stone-200 dark:bg-zinc-800" />
        <div className="mt-6 h-8 w-64 animate-pulse rounded bg-stone-200 dark:bg-zinc-800" />
        <div className="mt-3 h-4 w-48 animate-pulse rounded bg-stone-200 dark:bg-zinc-800" />

        <div className="mt-10 space-y-6">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className={`flex items-start gap-3 ${
                i % 2 === 1 ? "flex-row-reverse" : ""
              }`}
            >
              <div className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-stone-200 dark:bg-zinc-800" />
              <div
                className={`h-24 w-2/3 animate-pulse rounded-2xl bg-stone-200 dark:bg-zinc-800`}
              />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

function TranscriptError() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-stone-50 p-6 text-stone-900 dark:bg-zinc-950 dark:text-zinc-100">
      <section className="w-full max-w-sm rounded-xl border border-stone-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
        <h1 className="mt-4 text-lg font-semibold tracking-[-0.02em]">
          Could not load transcript
        </h1>
        <p className="mt-2 text-sm leading-6 text-stone-600 dark:text-zinc-400">
          We couldn&apos;t load the transcript messages. Please try again.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="mt-5 rounded-lg bg-zinc-900 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-zinc-800 dark:bg-amber-400 dark:text-stone-950 dark:hover:bg-amber-300"
        >
          Retry
        </button>
      </section>
    </main>
  );
}

export default function InterviewTranscriptPage() {
  const params = useParams<{ id: string }>();
  const interviewId = params?.id;

  const { data: interview, isLoading, isError } = useQuery({
    queryKey: ["interview-transcript", interviewId],
    queryFn: () => fetchInterviewTranscript(interviewId!),
    enabled: !!interviewId,
    staleTime: 1000 * 60 * 5,
  });

  if (isLoading) return <LoadingTranscript />;
  if (isError || !interview) return <TranscriptError />;

  return (
    <main className="min-h-screen bg-stone-50 text-stone-900 dark:bg-zinc-950 dark:text-zinc-100">
      <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Header Navigation */}
        <div className="flex items-center justify-between border-b border-stone-200 pb-5 dark:border-zinc-800">
          <Link
            href={`/interview/${interviewId}/report`}
            className="inline-flex items-center gap-2 text-sm font-medium text-stone-600 transition-colors hover:text-stone-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to report
          </Link>
          <div className="flex items-center gap-2 text-xs font-medium text-stone-500 dark:text-zinc-400">
            <MessageSquare className="h-3.5 w-3.5" />
            {interview.messages.length} messages
          </div>
        </div>

        {/* Title & Info */}
        <div className="mt-6 border-b border-stone-200 pb-6 dark:border-zinc-800">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-amber-600 dark:text-amber-400">
            Interview Transcript
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-stone-900 dark:text-zinc-100 sm:text-3xl">
            {interview.description || "Technical Interview"}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-stone-600 dark:text-zinc-400">
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-stone-400" />
              {formatDate(interview.startedAt)} at {formatTime(interview.startedAt)}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-stone-400" />
              Duration: {formatDuration(interview.startedAt, interview.completedAt)}
            </span>
          </div>
        </div>

        {/* Chat System Container */}
        <div className="mt-8 space-y-6">
          {interview.messages.length === 0 ? (
            <div className="rounded-xl border border-dashed border-stone-300 p-8 text-center text-sm text-stone-500 dark:border-zinc-800 dark:text-zinc-400">
              No transcript messages recorded for this interview.
            </div>
          ) : (
            interview.messages.map((msg) => {
              const isUser = msg.role === "USER";
              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-3 ${
                    isUser ? "flex-row-reverse" : "flex-row"
                  }`}
                >
                  {/* Avatar */}
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold shadow-sm ${
                      isUser
                        ? "bg-amber-400 text-stone-950 dark:bg-amber-400 dark:text-stone-950"
                        : "bg-zinc-200 text-stone-700 dark:bg-zinc-800 dark:text-zinc-300"
                    }`}
                  >
                    {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                  </div>

                  {/* Message Bubble */}
                  <div
                    className={`group relative max-w-[85%] rounded-2xl px-5 py-3.5 text-sm leading-relaxed shadow-sm sm:max-w-[75%] ${
                      isUser
                        ? "rounded-tr-none bg-amber-400 text-stone-950 dark:bg-amber-400 dark:text-stone-950"
                        : "rounded-tl-none bg-zinc-200/90 text-stone-900 dark:bg-zinc-800/90 dark:text-zinc-100"
                    }`}
                  >
                    <div className="mb-1 flex items-center justify-between gap-4 text-[11px] opacity-75">
                      <span className="font-semibold tracking-wide">
                        {isUser ? "You (Candidate)" : "AI Interviewer"}
                      </span>
                      <span>{formatTime(msg.createdAt)}</span>
                    </div>
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </main>
  );
}
