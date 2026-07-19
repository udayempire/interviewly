import { Loader2 } from "lucide-react"

export const Preparation = () => {
    return (
        <div className="flex h-screen w-full items-center justify-center bg-linear-to-b from-slate-50 to-blue-50/40 p-6">
            <div className="flex flex-col items-center text-center max-w-md w-full">

                {/* Logo / Brand mark */}
                <div className="h-20 w-20 rounded-[22px] bg-linear-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-200 mb-8">
                    <span className="text-3xl font-black text-white select-none">M</span>
                </div>

                {/* Heading */}
                <h1 className="text-3xl font-bold text-zinc-900 mb-3 leading-tight">
                    Preparing your{" "}
                    <span className="text-blue-500">Interviewer</span>
                </h1>
                <p className="text-[15px] text-zinc-500 leading-relaxed mb-10 max-w-sm">
                    We are analyzing your GitHub projects, resume,
                    and role description to prepare deep follow-up
                    questions tailored just for you.
                </p>

                {/* 3-step animated analysis cards */}
                <div className="flex items-center gap-3 mb-10 w-full justify-center">
                    {/* Step 1 — GitHub */}
                    <div className="flex flex-col items-center gap-2 w-28">
                        <div className="relative h-14 w-14 rounded-xl bg-white border border-zinc-100 shadow-sm flex items-center justify-center">
                            <svg viewBox="0 0 24 24" className="h-7 w-7 text-zinc-800" fill="currentColor">
                                <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                            </svg>
                            <span className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-green-500 border-2 border-white flex items-center justify-center">
                                <svg viewBox="0 0 24 24" className="h-2.5 w-2.5 text-white" fill="none" stroke="currentColor" strokeWidth={3.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                            </span>
                        </div>
                        <span className="text-[12px] font-medium text-zinc-600">GitHub Projects</span>
                        <span className="text-[11px] font-semibold text-green-500">Analyzed</span>
                    </div>

                    {/* Dotted connector */}
                    <div className="flex gap-1 mb-7">
                        {[...Array(4)].map((_, i) => (
                            <span key={i} className="h-1 w-1 rounded-full bg-zinc-300" />
                        ))}
                    </div>

                    {/* Step 2 — Resume */}
                    <div className="flex flex-col items-center gap-2 w-28">
                        <div className="relative h-14 w-14 rounded-xl bg-white border border-zinc-100 shadow-sm flex items-center justify-center">
                            <svg viewBox="0 0 24 24" className="h-7 w-7 text-emerald-500" fill="none" stroke="currentColor" strokeWidth={1.8}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-green-500 border-2 border-white flex items-center justify-center">
                                <svg viewBox="0 0 24 24" className="h-2.5 w-2.5 text-white" fill="none" stroke="currentColor" strokeWidth={3.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                            </span>
                        </div>
                        <span className="text-[12px] font-medium text-zinc-600">Resume</span>
                        <span className="text-[11px] font-semibold text-green-500">Analyzed</span>
                    </div>

                    {/* Dotted connector */}
                    <div className="flex gap-1 mb-7">
                        {[...Array(4)].map((_, i) => (
                            <span key={i} className="h-1 w-1 rounded-full bg-zinc-300" />
                        ))}
                    </div>

                    {/* Step 3 — Role Description (still analyzing) */}
                    <div className="flex flex-col items-center gap-2 w-28">
                        <div className="relative h-14 w-14 rounded-xl bg-white border border-zinc-100 shadow-sm flex items-center justify-center">
                            <svg viewBox="0 0 24 24" className="h-7 w-7 text-purple-400" fill="none" stroke="currentColor" strokeWidth={1.8}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                            <span className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-purple-100 border-2 border-white flex items-center justify-center">
                                <Loader2 className="h-2.5 w-2.5 text-purple-500 animate-spin" />
                            </span>
                        </div>
                        <span className="text-[12px] font-medium text-zinc-600">Role Description</span>
                        <span className="text-[11px] font-semibold text-purple-500">Analyzing...</span>
                    </div>
                </div>

                {/* Bottom connecting pill */}
                <div className="flex items-center gap-3 bg-white border border-zinc-200 rounded-2xl px-5 py-3.5 shadow-sm w-full max-w-xs">
                    <Loader2 className="h-5 w-5 text-blue-500 animate-spin shrink-0" />
                    <div className="text-left">
                        <p className="text-[13px] font-semibold text-zinc-800">Connecting to AI Interview Room...</p>
                        <p className="text-[11px] text-zinc-400">This may take a few seconds</p>
                    </div>
                </div>
            </div>
        </div>
    )

}