"use client";

import { MessageSquare } from "lucide-react";
import { Textarea } from "../ui/textarea";

const MAX_CHARS = 300;

interface InterviewAboutProps {
  value: string;
  onChange: (val: string) => void;
}

export const InterviewAbout = ({ value, onChange }: InterviewAboutProps) => (
  <section className="border-b border-[#dfddd3] bg-[#fffdf8] p-5 dark:border-[#3b3a34] dark:bg-[#20201e] md:border-r xl:border-b-0 sm:p-6">
    <div className="flex items-center gap-2.5">
      <MessageSquare className="h-4 w-4 text-[#8b6b14]" strokeWidth={1.7} />
      <div>
        <h2 className="text-sm font-semibold text-[#20201e] dark:text-[#fffdf8]">Interview details</h2>
        <p className="mt-0.5 text-xs text-[#77746b] dark:text-[#b8b4a9]">Role, skills, or scenario</p>
      </div>
    </div>
    <div className="relative mt-5">
      <Textarea
        maxLength={MAX_CHARS}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="e.g. Frontend developer - React, JavaScript, and system design"
        className="min-h-36 resize-none rounded-none border-[#d8d5ca] bg-[#fffdf8] pr-12 text-[13px] text-[#20201e] placeholder:text-[#97938a] focus-visible:border-[#b98815] focus-visible:ring-0 dark:border-[#4a4942] dark:bg-[#292925] dark:text-zinc-300 dark:placeholder:text-[#9d9a91] dark:focus-visible:border-[#d6b458]"
        rows={5}
      />
      <span className="absolute bottom-2 right-3 text-[11px] text-[#8a867c] dark:text-zinc-300">{value.length}/{MAX_CHARS}</span>
    </div>
  </section>
);
