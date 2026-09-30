import { executeLLMWithFallback, validateApiKey, type ChatMessage } from "./index.js";

// ─── Provider registry ────────────────────────────────────────────────────────
// To add a new provider to the full test suite, add one entry here.
// All three test groups (fallback, invalid-key validation, valid-key validation)
// will pick it up automatically.

interface ProviderConfig {
    /** Provider name passed to createLLMProvider / validateApiKey */
    name: string;
    /** Environment variable that holds the real platform API key */
    envKey: string;
    /** A syntactically plausible but definitely-invalid key for rejection tests */
    invalidKey: string;
}

const PROVIDERS: ProviderConfig[] = [
    {
        name: "groq",
        envKey: "GROQ_API_KEY",
        invalidKey: "gsk_invalid_dummy_api_key_99999",
    },
    {
        name: "gemini",
        envKey: "GEMINI_API_KEY",
        invalidKey: "invalid_gemini_api_key_99999",
    },
];

// ─── Tiny logging helpers ─────────────────────────────────────────────────────

function header(n: number, label: string) {
    console.log(`\n👉 Test ${n}: ${label}`);
}

function pass(n: number, msg: string) {
    console.log(`  ✅ Test ${n} PASSED: ${msg}\n`);
}

function fail(n: number, msg: string) {
    console.error(`  ❌ Test ${n} FAILED: ${msg}\n`);
}

function errored(n: number, err: unknown) {
    console.error(`  ❌ Test ${n} ERROR:`, err, "\n");
}

function logResponse(result: Awaited<ReturnType<typeof executeLLMWithFallback>>) {
    console.log("  Text    :", result.response.text.trim());
    console.log("  Model   :", result.response.model, "| Provider:", result.response.provider);
    console.log("  Tokens  : prompt =", result.response.usage.promptTokens,
        "| completion =", result.response.usage.completionTokens);
    console.log("  Fallback:", JSON.stringify(result.fallbackNotice));
}

// ─── Tests ────────────────────────────────────────────────────────────────────

async function runTests() {
    console.log("==================================================");
    console.log("🧪 Starting LLM Fallback Execution Service Tests");
    console.log("==================================================");

    const messages: ChatMessage[] = [
        { role: "user", content: "Say 'Hello' in a single word." },
    ];

    let n = 0; // auto-incrementing test counter

    // ── Group A: Default platform-key execution ───────────────────────────────
    // One test for the "no custom key" path. It exercises whatever provider
    // DEFAULT_LLM_PROVIDER resolves to; we don't care which one it is here.

    header(++n, "Normal platform-key execution (default provider, no fallback expected)");
    try {
        const result = await executeLLMWithFallback({
            messages,
            userProfile: { useCustomKey: false, llmApiKey: null, llmProvider: null },
        });
        logResponse(result);
        result.fallbackNotice.occurred === false
            ? pass(n, "Executed with platform key — no fallback triggered.")
            : fail(n, "Fallback occurred unexpectedly.");
    } catch (err) {
        errored(n, err);
    }

    // ── Group B: Invalid custom key → fallback to platform ────────────────────
    // One test per registered provider. Each supplies a bad key; the function
    // should catch the rejection and transparently retry with the platform key.

    for (const provider of PROVIDERS) {
        header(++n, `Invalid custom key — ${provider.name} (fallback expected)`);
        try {
            const result = await executeLLMWithFallback({
                messages,
                userProfile: {
                    useCustomKey: true,
                    llmProvider: provider.name,
                    llmApiKey: provider.invalidKey,
                },
            });
            logResponse(result);
            result.fallbackNotice.occurred && result.fallbackNotice.reason
                ? pass(n, `${provider.name} custom key rejected (${result.fallbackNotice.reason}); fell back to platform key.`)
                : fail(n, "Expected fallbackNotice.occurred === true with a reason.");
        } catch (err) {
            errored(n, err);
        }
    }

    // ── Group C: validateApiKey — invalid key rejected ────────────────────────
    // One test per provider. Each uses the same dummy key as Group B; the
    // validator should return { valid: false } without throwing.

    for (const provider of PROVIDERS) {
        header(++n, `validateApiKey — invalid key rejected (${provider.name})`);
        try {
            const result = await validateApiKey(provider.name, provider.invalidKey);
            console.log("  Result:", JSON.stringify(result));
            result.valid === false && result.error
                ? pass(n, `Invalid ${provider.name} key correctly rejected (${result.error}).`)
                : fail(n, "Expected valid === false with an error code.");
        } catch (err) {
            errored(n, err);
        }
    }

    // ── Group D: validateApiKey — real platform key accepted ──────────────────
    // One test per provider. Reads the real key from the environment.
    // If the env var is missing the test is skipped with a warning rather than
    // failing, so the suite can run in a CI environment that only has one key set.

    for (const provider of PROVIDERS) {
        header(++n, `validateApiKey — real platform key accepted (${provider.name})`);
        const realKey = process.env[provider.envKey] ?? "";
        if (!realKey) {
            console.warn(`  ⚠️  ${provider.envKey} is not set — skipping.\n`);
            continue;
        }
        try {
            const result = await validateApiKey(provider.name, realKey);
            console.log("  Result:", JSON.stringify(result));
            result.valid === true
                ? pass(n, `${provider.name} platform key is valid and accepted.`)
                : fail(n, `Expected valid === true, got error: ${result.error}`);
        } catch (err) {
            errored(n, err);
        }
    }

    console.log("==================================================");
    console.log(`🎉 All ${n} Tests Completed!`);
    console.log("==================================================\n");
}

runTests();
