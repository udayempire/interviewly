import { InterviewAbout } from "@/components/interview/interviewAbout";
import { GithubEntry } from "@/components/interview/githubEntry";
import { ResumeEntry } from "@/components/interview/resumeEntry";
import { Sparkles } from "lucide-react";

export default function Interview() {
    return (
        <div className="p-6 max-w-6xl mx-auto">
            {/* Page heading */}
            <div className="flex flex-col items-center gap-2 mb-14">
                <h1 className="text-3xl font-semibold">Create your AI Interview</h1>
                <p className="text-sm text-gray-500">
                    Practice real conversations, get instant feedback and improve faster
                </p>
            </div>

            {/* Three cards */}
            <div className="grid grid-cols-3 gap-4">
                <InterviewAbout />
                <GithubEntry />
                <ResumeEntry />
            </div>

            {/* Create Interview CTA */}
            <div className="flex justify-center mt-8">
                <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-[14px] px-8 py-3 rounded-md transition-colors cursor-pointer">
                    Create Interview
                </button>
            </div>
        </div>
    );
}