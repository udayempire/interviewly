// Shared practice interview settings.
export const PRACTICE_INTERVIEW_POLICY = {
  heartbeatIntervalMs: 30_000, // Ping interval.
  reconnectWindowMs: 4 * 60_000, // Time allowed to reconnect.
  connectionLeaseMs: 70_000, // Lease before a dead connection is detected.
  inactivityWarningAfterMs: [60_000, 30_000, 30_000] as const, // Delays between no-speech warnings.
  inactivityEndGraceMs: 30_000, // Grace after the final warning.
  maximumRecordingMs: 5 * 60_000, // Long-answer warning threshold.
  minimumAnsweredFollowUps: 3, // Minimum answers required for a report.
  lifecycleSweepIntervalMs: 10_000, // Interval for lifecycle recovery checks.
  reconnectExpiryBatchSize: 100,
  reportRecoveryBatchSize: 20,
  staleInterviewTimeoutMs: 2 * 60 * 60_000, // Timeout for forgotten interviews.
  reportPollIntervalMs: 1_000, // Refresh pending report status.
};


// - reconnectExpiryBatchSize: checks at most 100 interviews whose reconnect windows expired.
// - reportRecoveryBatchSize: recovers at most 20 pending or missing report jobs.

// They’re batch-size limits for load control, not per-interview timeouts. If more items are waiting, later scheduler passes process the rest.