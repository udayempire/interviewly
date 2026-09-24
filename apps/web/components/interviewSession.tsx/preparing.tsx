import { Loader2 } from "lucide-react";

export const Preparation = () => (
  <main className="flex h-screen items-center justify-center bg-stone-50 p-6 text-stone-900 dark:bg-zinc-950 dark:text-zinc-100">
    <div className="w-full max-w-sm border border-stone-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <Loader2 className="h-5 w-5 animate-spin text-amber-600 dark:text-amber-300" />
      <h1 className="mt-5 text-xl font-semibold tracking-[-0.03em]">Preparing interview</h1>
      <p className="mt-2 text-sm leading-6 text-stone-600 dark:text-zinc-400">Connecting to your interview room.</p>
    </div>
  </main>
);
