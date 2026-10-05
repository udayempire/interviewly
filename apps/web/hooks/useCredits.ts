/**
 * useCredits.ts
 * React Query hook to fetch the current user's credit balance.
 */

import { useQuery } from "@tanstack/react-query";

const API_BASE = `${process.env.NEXT_PUBLIC_API_URL}/${process.env.NEXT_PUBLIC_API_VERSION}`;

export interface CreditBalance {
    balance: number;
    config: {
        creditsPerInterview: number;
        signupBonus: number;
        enforced: boolean;
    };
}

async function fetchCreditBalance(): Promise<CreditBalance> {
    const res = await fetch(`${API_BASE}/credits/balance`, {
        credentials: "include",
        method: "GET",
    });
    if (!res.ok) throw new Error("Failed to fetch credit balance");
    const data = await res.json();
    return { balance: data.balance, config: data.config };
}

export function useCredits() {
    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ["credits-balance"],
        queryFn: fetchCreditBalance,
        staleTime: 30_000, // re-fetch every 30s max
    });

    return {
        balance: data?.balance ?? 0,
        config: data?.config,
        isLoading,
        isError: !!error,
        refetch,
    };
}
