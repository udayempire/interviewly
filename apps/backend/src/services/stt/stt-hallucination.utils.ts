// Generic transcript filtering — provider-agnostic hallucination detection.
//
// isLikelyHallucination: Whisper was trained on subtitled web video, so when
// handed audio with no speech in it the language-model prior takes over from the
// absent acoustic evidence and it emits the boilerplate that recurs over silent
// stretches. Those strings must never land in the transcript as candidate turns.
//
// This module is kept generic: the substring/exact-match lists below target
// Whisper artifacts, but the detection logic itself is provider-neutral and can
// be reused for any STT provider that produces similar artifacts.

// Matched against the raw lowercased transcript: these come straight out of
// Whisper's subtitle training data and never occur in a real interview answer.
const HALLUCINATED_SUBSTRINGS = [
    "amara.org",
    "subtitles by",
    "subtitling by",
    "captions by",
    "subscribe to my channel",
    "transcription by castingwords",
];

// Matched only when the phrase is the ENTIRE transcript - a candidate can
// legitimately say "thank you" mid-answer, but a turn consisting of nothing but
// these carries no interview content and is almost always a silence artifact.
const HALLUCINATED_TRANSCRIPTS = new Set([
    "you", "thank you", "thanks", "thank you very much", "thank you so much",
    "thank you for watching", "thanks for watching",
    "thank you for watching this video", "please subscribe",
    "like and subscribe", "bye", "bye bye", "goodbye", "okay bye",
    "music", "applause", "silence", "blank audio", "inaudible", "laughter",
    "hmm", "mm", "mhm", "uh", "um", "ah", "oh", "eh",
]);

/**
 * True when a transcript should be discarded instead of recorded as a candidate
 * turn. Second line of defence behind the client-side speech gate.
 *
 * @param transcript - Raw transcript string returned by the STT provider.
 */
export function isLikelyHallucination(transcript: string): boolean {
    const lower = transcript.toLowerCase();
    if (HALLUCINATED_SUBSTRINGS.some(phrase => lower.includes(phrase))) return true;

    const normalized = lower
        .replace(/[\[\]()*]/g, " ")                    // [MUSIC], (applause)
        .replace(/[.,!?;:"''""]/g, "")
        .replace(/\s+/g, " ")
        .trim();
    if (!normalized) return true;
    return HALLUCINATED_TRANSCRIPTS.has(normalized);
}
