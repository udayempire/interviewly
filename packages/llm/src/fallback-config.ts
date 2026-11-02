// Defines one provider attempt in an env-configured fallback chain.
export interface ProviderCandidate {
  provider: string;
  model?: string;
  apiKeyEnv?: string;
}

type Service = "LLM" | "STT" | "TTS";

// Resolve the configured primary and ordered fallbacks for one AI service.
export function getProviderChain(service: Service, tier?: "FREE" | "PREMIUM"): ProviderCandidate[] {
  const provider = (getTierSetting(service, "PROVIDER", tier) || defaultProvider(service)).toLowerCase();
  const model = getTierSetting(service, "MODEL", tier);
  const candidates: ProviderCandidate[] = [{ provider, model, apiKeyEnv: defaultApiKeyEnv(provider, tier) }];
  const fallbackConfig = getTierSetting(service, "FALLBACKS", tier);
  if (!fallbackConfig) {
    const fallbackProvider = defaultFallbackProvider(service, provider);
    candidates.push({ provider: fallbackProvider, apiKeyEnv: defaultApiKeyEnv(fallbackProvider, tier) });
    return candidates;
  }
  return [...candidates, ...parseProviderChain(fallbackConfig, `${tier === "PREMIUM" ? "PREMIUM_" : ""}${service}_FALLBACKS`, tier)];
}

// Parse an ordered provider:model:key-variable list.
function parseProviderChain(config: string, variableName: string, tier?: "FREE" | "PREMIUM"): ProviderCandidate[] {
  const candidates: ProviderCandidate[] = [];
  for (const item of config.split(",").map((value) => value.trim()).filter(Boolean)) {
    const [fallbackProvider, fallbackModel, apiKeyEnv, ...extra] = item.split(":").map((value) => value.trim());
    if (!fallbackProvider || extra.length > 0) {
      throw new Error(`Invalid ${variableName} entry "${item}". Use provider:model:API_KEY_ENV.`);
    }
    candidates.push({
      provider: fallbackProvider.toLowerCase(),
      model: fallbackModel || undefined,
      apiKeyEnv: apiKeyEnv || defaultApiKeyEnv(fallbackProvider, tier),
    });
  }
  return candidates;
}

// Read premium settings first and fall back to the shared unprefixed setting.
function getTierSetting(service: Service, setting: "PROVIDER" | "MODEL" | "FALLBACKS", tier?: "FREE" | "PREMIUM"): string | undefined {
  const settingName = setting === "FALLBACKS" ? `${service}_FALLBACKS` : `DEFAULT_${service}_${setting}`;
  const premiumValue = tier === "PREMIUM" ? process.env[`PREMIUM_${settingName}`]?.trim() : undefined;
  return premiumValue || process.env[settingName]?.trim() || undefined;
}

// Read the candidate's key from its configured environment variable.
export function getCandidateApiKey(candidate: ProviderCandidate): string | undefined {
  return candidate.apiKeyEnv ? process.env[candidate.apiKeyEnv] : undefined;
}

// Select the default provider for a service when no environment override exists.
function defaultProvider(service: Service): string {
  if (service === "LLM") return "groq";
  if (service === "STT") return "groq";
  return "deepgram";
}

// Preserve the built-in alternate provider when no explicit chain is configured.
function defaultFallbackProvider(service: Service, primary: string): string {
  if (service === "LLM") return primary === "groq" ? "gemini" : "groq";
  return primary === "deepgram" ? "groq" : "deepgram";
}

// Map a provider name to its conventional platform API-key variable.
function defaultApiKeyEnv(provider: string, tier?: "FREE" | "PREMIUM"): string {
  const providerKey = `${provider.toUpperCase()}_API_KEY`;
  const premiumProviderKey = `PREMIUM_${providerKey}`;
  return tier === "PREMIUM" && process.env[premiumProviderKey] ? premiumProviderKey : providerKey;
}
