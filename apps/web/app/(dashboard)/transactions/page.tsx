"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Direction = "credit" | "deduct";
type Transaction = {
  id: string;
  delta: number;
  deltaCredits: number;
  creditReason: string;
  note: string | null;
  interviewId: string | null;
  createdAt: string;
};

const API_BASE = `${process.env.NEXT_PUBLIC_API_URL}/${process.env.NEXT_PUBLIC_API_VERSION}`;
const reasonLabels: Record<string, string> = {
  SIGNUP_BONUS: "Signup bonus",
  PURCHASE_ONE_SHOT: "One Shot plan",
  PURCHASE_INTERVIEW_READY: "Interview Ready plan",
  PURCHASE_OFFER_READY: "Offer Ready plan",
  SYSTEM_GRANTED: "System granted",
  INTERVIEW_USAGE: "Interview usage",
  INTERVIEW_REFUND: "Interview refund",
  EXPIRED: "Expired",
};

function reasonLabel(reason: string) {
  return reasonLabels[reason] ?? reason.replaceAll("_", " ");
}

export default function TransactionsPage() {
  const [direction, setDirection] = useState<Direction>("credit");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`${API_BASE}/credits/history?direction=${direction}&limit=100`, { credentials: "include" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Unable to load transactions");
        return response.json() as Promise<{ transactions: Transaction[] }>;
      })
      .then((data) => { if (!cancelled) setTransactions(data.transactions); })
      .catch(() => { if (!cancelled) setTransactions([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [direction]);

  return (
    <div className="min-h-full px-5 py-8 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">Credits</p>
          <h1 className="mt-2 text-4xl font-black tracking-[-0.055em] text-stone-900 dark:text-zinc-100">Transactions</h1>
          <p className="mt-2 text-sm text-stone-500 dark:text-zinc-400">A record of credits added and used in Interviewlyy.</p>
        </div>

        <div className="mb-4 inline-flex border border-stone-300 bg-white p-1 dark:border-zinc-700 dark:bg-zinc-900" role="tablist" aria-label="Transaction type">
          {(["credit", "deduct"] as const).map((value) => (
            <button key={value} type="button" role="tab" aria-selected={direction === value} onClick={() => setDirection(value)} className={`px-5 py-2 text-xs font-bold uppercase tracking-[0.14em] transition-colors ${direction === value ? "bg-stone-900 text-white dark:bg-amber-300 dark:text-stone-900" : "text-stone-500 hover:text-stone-900 dark:text-zinc-400 dark:hover:text-zinc-100"}`}>
              {value === "credit" ? "Credit" : "Deduct"}
            </button>
          ))}
        </div>

        <div className="overflow-hidden border border-stone-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-stone-200 bg-stone-50 text-[10px] font-bold uppercase tracking-[0.14em] text-stone-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-500">
              <tr><th className="px-5 py-4">Date</th><th className="px-5 py-4">Reason</th><th className="px-5 py-4">Change</th><th className="px-5 py-4">Interview</th></tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-zinc-800">
              {loading ? <tr><td colSpan={4} className="px-5 py-12 text-center text-stone-500">Loading transactions…</td></tr> : transactions.length === 0 ? <tr><td colSpan={4} className="px-5 py-12 text-center text-stone-500">No {direction === "credit" ? "credits" : "deductions"} yet.</td></tr> : transactions.map((transaction) => (
                <tr key={transaction.id} className="text-stone-700 dark:text-zinc-300">
                  <td className="whitespace-nowrap px-5 py-4 text-xs text-stone-500">{new Date(transaction.createdAt).toLocaleString()}</td>
                  <td className="px-5 py-4"><p className="font-medium text-stone-900 dark:text-zinc-100">{reasonLabel(transaction.creditReason)}</p></td>
                  <td className={`px-5 py-4 font-semibold ${transaction.delta > 0 ? "text-emerald-700 dark:text-emerald-400" : "text-red-700 dark:text-red-400"}`}>{transaction.delta > 0 ? "+" : ""}{transaction.deltaCredits} credits</td>
                  <td className="px-5 py-4">{transaction.interviewId ? <Link href={`/interview/${transaction.interviewId}/report`} className="text-xs font-semibold text-stone-900 underline underline-offset-4 hover:text-amber-700 dark:text-amber-300">View interview</Link> : <span className="text-xs text-stone-400">—</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
