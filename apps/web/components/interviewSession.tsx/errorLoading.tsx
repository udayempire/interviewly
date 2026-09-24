export const ErrorLoading = () => (
  <main className="flex h-screen items-center justify-center bg-stone-50 p-6 text-stone-900 dark:bg-zinc-950 dark:text-zinc-100">
    <div className="w-full max-w-sm border border-stone-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <h1 className="text-xl font-semibold tracking-[-0.03em]">Unable to join interview</h1>
      <p className="mt-2 text-sm leading-6 text-stone-600 dark:text-zinc-400">Check your connection and try again.</p>
      <button onClick={() => window.location.reload()} className="mt-5 h-10 bg-zinc-900 px-4 text-sm font-semibold text-white hover:bg-zinc-800 dark:bg-amber-300 dark:text-stone-900">Retry</button>
    </div>
  </main>
);
