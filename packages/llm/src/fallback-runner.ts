import type { ProviderCandidate } from "./fallback-config";

// Run provider candidates in order and continue after a candidate fails.
export async function runWithProviderFallback<T>(
  service: "LLM" | "STT" | "TTS",
  candidates: ProviderCandidate[],
  run: (candidate: ProviderCandidate) => Promise<T>,
  onFailure?: (candidate: ProviderCandidate, error: unknown, index: number) => void,
): Promise<T> {
  const failures: string[] = [];
  for (const [index, candidate] of candidates.entries()) {
    try {
      return await run(candidate);
    } catch (error) {
      onFailure?.(candidate, error, index);
      const reason = error instanceof Error ? error.message : String(error);
      failures.push(`${candidate.provider}${candidate.model ? `/${candidate.model}` : ""}: ${reason}`);
      console.warn(`[${service} fallback] ${candidate.provider} failed; trying next configured candidate.`);
    }
  }
  throw new Error(`All configured ${service} providers failed. ${failures.join(" | ")}`);
}
