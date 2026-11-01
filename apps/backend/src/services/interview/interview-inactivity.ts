import { PRACTICE_INTERVIEW_POLICY } from "./interview-policy";

// Create a pausable inactivity timer for one connected interview session.
export function createInterviewInactivityMonitor(options: {
    onWarning: (warningNumber: number) => void;
    onTimeout: () => void;
}) {
    let timeout: ReturnType<typeof setTimeout> | undefined;
    let warningIndex = 0;
    let timerStartedAt = 0;
    let remainingMs: number = PRACTICE_INTERVIEW_POLICY.inactivityWarningAfterMs[0];
    let stopped = false;

    // Schedule the next warning or the final inactivity timeout.
    function schedule(delayMs: number) {
        if (stopped) return;
        clearTimeout(timeout);
        remainingMs = delayMs;
        timerStartedAt = Date.now();
        timeout = setTimeout(() => {
            if (warningIndex < PRACTICE_INTERVIEW_POLICY.inactivityWarningAfterMs.length) {
                warningIndex += 1;
                options.onWarning(warningIndex);
                const nextDelay = PRACTICE_INTERVIEW_POLICY.inactivityWarningAfterMs[warningIndex]
                    ?? PRACTICE_INTERVIEW_POLICY.inactivityEndGraceMs;
                schedule(nextDelay);
                return;
            }
            options.onTimeout();
        }, delayMs);
    }

    // Start or reset the response timer after a candidate activity event.
    function reset() {
        warningIndex = 0;
        schedule(PRACTICE_INTERVIEW_POLICY.inactivityWarningAfterMs[0]);
    }

    // Pause the timer while the candidate is recording or the AI audio is playing.
    function pause() {
        if (!timeout) return;
        clearTimeout(timeout);
        timeout = undefined;
        remainingMs = Math.max(0, remainingMs - (Date.now() - timerStartedAt));
    }

    // Resume a paused timer without restarting the candidate's warning sequence.
    function resume() {
        if (!timeout && !stopped) schedule(remainingMs);
    }

    // Stop the timer permanently when the socket closes or interview ends.
    function stop() {
        stopped = true;
        clearTimeout(timeout);
        timeout = undefined;
    }

    return { reset, pause, resume, stop };
}
