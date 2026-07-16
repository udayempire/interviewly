"use client"

import { useState } from "react";
import { InterviewAbout } from "@/components/interview/interviewAbout";
import { GithubEntry } from "@/components/interview/githubEntry";
import { ResumeEntry } from "@/components/interview/resumeEntry";
import { InterviewSuggestions } from "@/components/interview/interviewSuggestions";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

export default function Interview() {
    // Shared state — lifted so suggestions can fill the textarea
    const [description, setDescription] = useState("");
    const [githubUrl, setGithubUrl] = useState("");
    const [topic, setTopic] = useState("");
    const [resumeFile, setResumeFile] = useState<File | null>(null);
    const router = useRouter();
    const { mutate: createInterview, isPending, error } = useMutation({
        mutationFn: async () => {
            const formData = new FormData();
            formData.append("description", description);
            formData.append("githubUrl", githubUrl);
            if (resumeFile) {
                formData.append("resume", resumeFile);
            }
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/${process.env.NEXT_PUBLIC_API_VERSION}/user/interview`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                },
                body: formData,
            });
            const data = await response.json();
            if (!response.ok || !data.success) {
                throw new Error(data.Error || "Failed to create Interview");
            }
            return data.interview;
        },
        onSuccess: (data) => {
            router.push(`/interview/${data.id}/session`)
        },
        onError: (error) => {
            // Handle error, e.g., show an error message
            console.error("Error creating interview:", error);
        },
    });
    const handleSubmit = () => {
        createInterview();
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Page heading */}
            <div className="flex flex-col items-center gap-2 mb-14">
                <h1 className="text-3xl font-semibold">Create your AI Interview</h1>
                <p className="text-sm text-gray-500">
                    Practice real conversations, get instant feedback and improve faster
                </p>
            </div>

            {/* Three input cards */}
            <div className="grid grid-cols-3 gap-4">
                {/* Card 1: topic is controlled from this page */}
                <InterviewAbout value={description} onChange={setDescription} />
                <GithubEntry value={githubUrl} onChange={setGithubUrl} />
                <ResumeEntry onFileChange={setResumeFile} />
            </div>

            {/* Create Interview CTA */}
            <div className="flex flex-col items-center gap-3 mt-8">
                <button
                    onClick={handleSubmit}
                    disabled={isPending}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-[14px] px-8 py-3 rounded-md transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <p>{isPending ? "Creating..." : "Create Interview"}</p>
                </button>
                {error && <p className="text-red-500 text-sm">{error.message}</p>}
            </div>

            {/* Suggestions — clicking fills the topic textarea above */}
            <InterviewSuggestions onSelect={(title) => setTopic(title)} />
        </div>
    )
}