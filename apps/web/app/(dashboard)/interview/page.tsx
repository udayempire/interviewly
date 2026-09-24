"use client";

import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { InterviewAbout } from "@/components/interview/interviewAbout";
import { GithubEntry } from "@/components/interview/githubEntry";
import { ResumeEntry } from "@/components/interview/resumeEntry";
import { InterviewSuggestions } from "@/components/interview/interviewSuggestions";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

export default function Interview() {
  const [description, setDescription] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [hasSavedResume, setHasSavedResume] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function fetchAutofill() {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/${process.env.NEXT_PUBLIC_API_VERSION}/user/interview-prefilldata`,
          { credentials: "include" },
        );
        const data = await res.json();
        if (data.success) {
          if (data.githubUrl) setGithubUrl((current) => current || data.githubUrl);
          if (data.hasResume) setHasSavedResume(true);
        }
      } catch {
        // Prefill is optional.
      }
    }
    fetchAutofill();
  }, []);

  const { mutate: createInterview, isPending, error } = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      formData.append("description", description);
      formData.append("githubUrl", githubUrl);
      if (resumeFile) formData.append("resume", resumeFile);
      else if (hasSavedResume) formData.append("useProfileResume", "true");

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/${process.env.NEXT_PUBLIC_API_VERSION}/interview/create`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.Error || "Failed to create interview");
      return data.interview;
    },
    onSuccess: (data) => router.push(`/interview/${data.id}/session`),
    onError: (mutationError) => console.error("Error creating interview:", mutationError),
  });

  return (
    <div className="product-page min-h-full bg-[#faf9f5] text-[#20201e] dark:bg-[#171715] dark:text-[#f4f1e8]">
      <div className="mx-auto w-full max-w-7xl px-5 py-5 sm:px-8 sm:py-7 lg:px-10 lg:py-8">
        <header className="border-b border-[#dfddd3] pb-5 dark:border-[#3a3934]">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#77746b] dark:text-[#aaa69b]">Practice</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-[-0.045em] text-[#20201e] dark:text-[#f4f1e8] sm:text-4xl">Create interview</h1>
        </header>

        <main className="py-7">
          <div className="grid border-y border-[#dfddd3] dark:border-[#3a3934] md:grid-cols-2 xl:grid-cols-3">
            <InterviewAbout value={description} onChange={setDescription} />
            <GithubEntry value={githubUrl} onChange={setGithubUrl} />
            <ResumeEntry onFileChange={setResumeFile} hasSavedResume={hasSavedResume} />
          </div>

          <div className="mt-6 flex flex-col justify-center items-center gap-3 sm:flex-row sm:items-center">
            <button
              onClick={() => createInterview()}
              disabled={isPending}
              className="inline-flex h-10 cursor-pointer border dark:border-yellow-500 items-center gap-2 bg-[#20201e] px-4 text-sm font-semibold text-[#fffdf7] transition-transform hover:-translate-y-0.5 hover:bg-[#33332f] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d39c13] disabled:cursor-not-allowed disabled:opacity-55"
            >
              {isPending ? "Creating…" : "Create interview"}
              {!isPending && <ArrowRight className="h-4 w-4" />}
            </button>
            {error && <p className="text-sm text-[#a53b31]">{error.message}</p>}
          </div>

          <InterviewSuggestions onSelect={setDescription} />
        </main>
      </div>
    </div>
  );
}
