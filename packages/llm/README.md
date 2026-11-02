# llm

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run index.ts
```

This project was created using `bun init` in bun v1.3.14. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.

## Provider fallback configuration

The provider chain is configured with environment variables. Each fallback entry has the form `provider:model:API_KEY_ENV`; entries run left to right. Use a blank model or key variable to use the provider's default. If no fallback list is set, LLM uses the other built-in provider (Gemini/Groq), and STT/TTS use the other built-in speech provider (Groq/Deepgram).

For local backend development, put keys in the **monorepo root `.env`** file. In production, define them in the backend service's environment or secret manager. The provider determines the primary key variable (`gemini` → `GEMINI_API_KEY`, `groq` → `GROQ_API_KEY`, `deepgram` → `DEEPGRAM_API_KEY`). Fallback entries can point to additional provider-specific or alternate key variables. Do not put keys in frontend `NEXT_PUBLIC_*` variables or commit them.

### `.env.example` template

This example is documented here for copying into your local root `.env`; it is not a separate file.

```dotenv
DEFAULT_LLM_PROVIDER=groq
DEFAULT_LLM_MODEL=openai/gpt-oss-20b
LLM_FALLBACKS=gemini:gemini-2.5-flash:GEMINI_API_KEY

# Premium overrides; omit a setting to inherit the Free/default setting.
PREMIUM_DEFAULT_LLM_PROVIDER=groq
PREMIUM_DEFAULT_LLM_MODEL=openai/gpt-oss-120b
PREMIUM_LLM_FALLBACKS=gemini:gemini-2.5-flash:GEMINI_API_KEY

DEFAULT_STT_PROVIDER=deepgram
DEFAULT_STT_MODEL=nova-3
STT_FALLBACKS=groq:whisper-large-v3:GROQ_API_KEY_ALT_1

DEFAULT_TTS_PROVIDER=deepgram
DEFAULT_TTS_MODEL=aura-2-thalia-en
TTS_FALLBACKS=groq:canopylabs/orpheus-v1-english:GROQ_API_KEY_ALT_1

GEMINI_API_KEY=<Gemini key>
GROQ_API_KEY=<Groq key>
DEEPGRAM_API_KEY=<Deepgram key>
GROQ_API_KEY_ALT_1=<Groq key used by fallback entries>
GROQ_API_KEY_ALT_2=<another Groq key, can serve the same model>
GEMINI_API_KEY_ALT=<Gemini key used by fallback entries>
DEEPGRAM_API_KEY_ALT=<Deepgram key used by fallback entries>
```

Unprefixed model settings are the Free/default chain. `PREMIUM_` settings override them for Premium users. **If a `PREMIUM_` setting is omitted, Premium users use the corresponding unprefixed Free/default setting.** Both tiers use the same provider keys by default, so you do not need duplicate `PREMIUM_GROQ_API_KEY` or similar variables. Add tier-specific provider keys only if you intentionally want separate provider accounts or spend limits. Repeated provider/model entries with different key variable names enable multiple keys for the same model. Keep keys in the deployment secret manager and restart backend processes after rotating environment values. LLM user-provided keys are tried first when enabled; platform fallback candidates are used if that key fails.
