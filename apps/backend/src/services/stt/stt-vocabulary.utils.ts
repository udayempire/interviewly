// Vocabulary extraction utilities for STT prompt conditioning.
//
// buildSTTVocabulary: Whisper's `prompt` is conditioning text, not an
// instruction. It is prepended as though it were the transcript of the audio
// immediately preceding the clip, which shifts the decoder's prior toward that
// vocabulary. Feeding it the candidate's own stack makes correct spellings
// ("PostgreSQL", "Next.js") more probable than phonetic guesses
// ("post gres cue el", "next JS").
//
// These utilities are provider-agnostic. Other STT providers that accept
// a conditioning vocabulary (e.g. keyterm boosting) can consume them too.

// Whisper's decoder context is 448 tokens with half reserved for output, so the
// prompt budget is ~224. Term lists tokenize poorly (2-4 tokens each), so these
// caps stay well clear of it.
export const MAX_VOCAB_TERMS = 60;
export const MAX_VOCAB_CHARS = 500;

// resumeText and githubData are untyped Json columns, so bound the walk.
export const MAX_JSON_DEPTH = 8;
export const MAX_STRINGS_SCANNED = 4000;

// Anything that cannot appear inside a technical term. Keeps "Next.js", "C++",
// "CI/CD", "OAuth2", "socket.io-client" intact.
export const TERM_SPLIT = /[^A-Za-z0-9.+#\-_/]+/;
// Trailing "+" and "#" are load-bearing ("C++", "C#"), so they are not trimmed.
export const TRIM_LEAD = /^[.+#\-_/]+/;
export const TRIM_TAIL = /[.\-_/]+$/;

// Capitalised words that carry no vocabulary value - generic resume/GitHub
// scaffolding and ordinary English that happens to start a sentence.
export const STOPWORDS = new Set([
    "a", "an", "and", "or", "the", "in", "on", "at", "to", "for", "with", "by",
    "from", "of", "as", "is", "was", "were", "be", "been", "am", "are", "this",
    "that", "these", "those", "my", "our", "their", "its", "it", "we", "you",
    "he", "she", "they", "i", "not", "no", "yes", "all", "any", "more", "most",
    "other", "some", "such", "than", "then", "there", "here", "when", "where",
    "which", "while", "who", "whom", "how", "why", "also", "into", "over",
    "under", "about", "after", "before", "during", "between", "through",
    "january", "february", "march", "april", "may", "june", "july", "august",
    "september", "october", "november", "december", "present", "current",
    "university", "college", "school", "institute", "bachelor", "bachelors",
    "master", "masters", "degree", "gpa", "cgpa", "experience", "education",
    "skills", "skill", "projects", "project", "summary", "objective",
    "certifications", "achievements", "awards", "languages", "interests",
    "company", "team", "developer", "engineer", "engineering", "intern",
    "internship", "manager", "senior", "junior", "lead", "full", "stack",
    "frontend", "backend", "software", "web", "app", "application", "system",
    "systems", "worked", "built", "developed", "created", "designed",
    "implemented", "managed", "led", "used", "using", "improved", "increased",
    "reduced", "responsible", "collaborated", "various", "including",
    "multiple", "description", "name", "title", "role", "date", "start", "end",
    "location", "city", "state", "country", "email", "phone", "address", "url",
    "link", "links", "github", "linkedin", "twitter", "portfolio", "resume",
    "cv", "null", "true", "false", "none", "undefined", "public", "private",
    "main", "master_branch", "readme", "license", "repo", "repository",
    "repositories", "commit", "commits", "branch", "pull", "issue", "issues",
]);

// The accept rule below keys off capitals, digits, or "./+/#", which misses
// all-lowercase terms. These are the ones worth boosting anyway.
export const LOWERCASE_TECH = new Set([
    "npm", "pnpm", "yarn", "bun", "node", "deno", "webpack", "vite", "rollup",
    "esbuild", "babel", "eslint", "prettier", "jest", "vitest", "cypress",
    "playwright", "nginx", "apache", "docker", "kubectl", "helm", "terraform",
    "ansible", "jenkins", "redis", "postgres", "postgresql", "mysql",
    "sqlite", "mongodb", "mongo", "kafka", "rabbitmq", "elasticsearch",
    "python", "java", "javascript", "typescript", "golang", "rust", "ruby",
    "php", "kotlin", "swift", "scala", "django", "flask", "fastapi", "rails",
    "express", "nest", "spring", "prisma", "drizzle", "sequelize", "graphql",
    "grpc", "rest", "oauth", "jwt", "websocket", "websockets", "ffmpeg",
    "pytorch", "tensorflow", "numpy", "pandas", "sklearn", "keras", "opencv",
    "linux", "ubuntu", "bash", "zsh", "git", "vim", "tmux", "turborepo",
]);

export function collectStrings(value: unknown, out: string[], depth = 0): void {
    if (out.length >= MAX_STRINGS_SCANNED) return;
    if (typeof value === "string") {
        out.push(value);
        return;
    }
    if (depth >= MAX_JSON_DEPTH || value === null || typeof value !== "object") return;
    // Values only - JSON keys are schema scaffolding, not candidate vocabulary.
    for (const child of Array.isArray(value) ? value : Object.values(value)) {
        collectStrings(child, out, depth + 1);
        if (out.length >= MAX_STRINGS_SCANNED) return;
    }
}

export function isVocabularyTerm(term: string): boolean {
    if (term.length < 2 || term.length > 30) return false;
    const lower = term.toLowerCase();
    if (STOPWORDS.has(lower)) return false;
    if (!/[A-Za-z]/.test(term)) return false; // bare numbers, version strings
    if (LOWERCASE_TECH.has(lower)) return true;
    return (
        /[A-Z]/.test(term) ||   // Kubernetes, PostgreSQL, Redis, GraphQL
        /\d/.test(term) ||      // S3, OAuth2, k8s, Web3
        /[.+#/]/.test(term)     // Next.js, C++, C#, CI/CD
    );
}

/**
 * Builds a comma-separated term list from arbitrary JSON sources
 * (resume text, GitHub payloads). Returns undefined when nothing useful is
 * found, so callers can omit the parameter entirely.
 *
 * Kept to a plain term list on purpose: off-distribution prompt text can
 * increase hallucination, and Whisper occasionally leaks prompt content into
 * the transcript.
 */
export function buildSTTVocabulary(...sources: unknown[]): string | undefined {
    const strings: string[] = [];
    for (const source of sources) collectStrings(source, strings);

    // Rank by frequency so the candidate's dominant stack survives the cap.
    const ranked = new Map<string, { term: string; count: number }>();
    for (const raw of strings) {
        for (const token of raw.split(TERM_SPLIT)) {
            const term = token.replace(TRIM_LEAD, "").replace(TRIM_TAIL, "");
            if (!isVocabularyTerm(term)) continue;
            const key = term.toLowerCase();
            const seen = ranked.get(key);
            if (seen) seen.count += 1;
            else ranked.set(key, { term, count: 1 });
        }
    }
    if (ranked.size === 0) return undefined;

    const terms: string[] = [];
    let chars = 0;
    for (const { term } of [...ranked.values()].sort((a, b) => b.count - a.count)) {
        if (terms.length >= MAX_VOCAB_TERMS) break;
        if (chars + term.length + 2 > MAX_VOCAB_CHARS) break;
        terms.push(term);
        chars += term.length + 2;
    }
    return terms.join(", ");
}
