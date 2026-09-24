"use client";

import Image from "next/image";
import { Lock } from "lucide-react";

interface GithubUrlProps {
  value: string;
  onChange: (val: string) => void;
}

export const GithubEntry = ({ value, onChange }: GithubUrlProps) => (
  <section className="border-b border-[#dfddd3] bg-[#fffdf8] p-5 dark:border-[#3b3a34] dark:bg-[#20201e] xl:border-b-0 xl:border-r sm:p-6">
    <div className="flex items-center gap-2.5">
      <Image src="/github.svg" alt="GitHub" width={16} height={16} className="opacity-70" />
      <div>
        <h2 className="text-sm font-semibold text-[#20201e] dark:text-[#fffdf8]">GitHub profile <span className="font-normal text-[#77746b] dark:text-[#b8b4a9]">(optional)</span></h2>
        <p className="mt-0.5 text-xs text-[#77746b] dark:text-[#b8b4a9]">Public projects only</p>
      </div>
    </div>
    <label className="mt-5 flex h-10 items-center gap-2.5 border border-[#d8d5ca] bg-[#fffdf8] px-3 focus-within:border-[#b98815] dark:border-[#4a4942] dark:bg-[#292925] dark:focus-within:border-[#d6b458]">
      <Image src="/github.svg" alt="" width={14} height={14} className="opacity-45" aria-hidden="true" />
      <input
        type="url"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="https://github.com/username"
        className="min-w-0 flex-1 bg-transparent text-[13px] text-[#20201e] outline-none placeholder:text-[#97938a] dark:text-zinc-300 dark:placeholder:text-[#9d9a91]"
      />
    </label>
    <p className="mt-3 flex items-start gap-1.5 text-xs leading-5 text-[#77746b] dark:text-[#b8b4a9]">
      <Lock className="mt-0.5 h-3 w-3 shrink-0" />
      No changes will be made to your account.
    </p>
  </section>
);
