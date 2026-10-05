"use client";

import { useCredits } from "@/hooks/useCredits";
import { Coins, RefreshCw, ShieldCheck } from "lucide-react";

/**
 * CreditBalance
 * Displays the user's current credit balance in the dashboard sidebar.
 * Shown as a clean stat row that integrates with the existing QuickStats design language.
 *
 * Shows:
 *  - Current balance (number of credits)
 *  - "1 credit = 15 min interview" tooltip
 *  - If enforced=false: subtle "credits not yet enforced" badge
 */
export function CreditBalance() {
    const { balance, config, isLoading, isError, refetch } = useCredits();

    if (isError) {
        return (
            <div className="flex items-center justify-between gap-4 py-4">
                <dt className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                    <Coins className="h-3.5 w-3.5 shrink-0 text-[#e5ae20]" />
                    Credits
                </dt>
                <dd>
                    <button
                        onClick={() => refetch()}
                        className="flex items-center gap-1 text-xs text-[#a53b31] hover:underline"
                    >
                        <RefreshCw className="h-3 w-3" />
                        Retry
                    </button>
                </dd>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-between gap-4 py-4">
            <dt className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                <Coins className="h-3.5 w-3.5 shrink-0 text-[#e5ae20]" aria-hidden="true" />
                <span>Credits</span>
                {config && !config.enforced && (
                    <span
                        title="Credits are tracked but not yet enforced. You can still start interviews freely."
                        className="inline-flex items-center gap-0.5 rounded-full bg-[#f0ebd4] px-1.5 py-0.5 text-[10px] font-medium text-[#77746b] dark:bg-[#2e2c26] dark:text-[#aaa69b]"
                    >
                        <ShieldCheck className="h-2.5 w-2.5" />
                        preview
                    </span>
                )}
            </dt>
            <dd className="flex flex-col items-end gap-0.5">
                <span className="text-xl font-semibold tracking-[-0.035em]">
                    {isLoading ? "–" : balance}
                </span>
                {!isLoading && config && (
                    <span className="text-[10px] text-[#aaa69b] dark:text-[#6b6861]">
                        {config.creditsPerInterview} per interview
                    </span>
                )}
            </dd>
        </div>
    );
}
