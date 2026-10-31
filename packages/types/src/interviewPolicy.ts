// // Shared practice interview settings.
// export const PRACTICE_INTERVIEW_POLICY = {
//   heartbeatIntervalMs: 30_000, // Ping interval.
//   reconnectWindowMs: 2 * 60_000, // Time allowed to reconnect.
//   connectionLeaseMs: 70_000, // Lease before a dead connection is detected.
//   inactivityWarningAfterMs: [60_000, 30_000, 30_000] as const, // Delays between warnings.
//   inactivityEndGraceMs: 30_000, // Grace after the final warning.
//   maximumRecordingMs: 120_000, // Limit before warning on a long recording.
//   minimumAnsweredFollowUps: 2, // Minimum answers required for a report.
//   lifecycleSweepIntervalMs: 10_000, // Interval for lifecycle recovery checks.
//   reconnectExpiryBatchSize: 100, // Maximum reconnects processed per sweep.
//   reportRecoveryBatchSize: 20, // Maximum reports recovered per sweep.
//   staleInterviewTimeoutMs: 2 * 60 * 60_000, // Timeout for forgotten interviews.
// };

// Shared practice interview settings.
export const PRACTICE_INTERVIEW_POLICY = {
  heartbeatIntervalMs: 5_000, // Ping every 5 seconds.
  reconnectWindowMs: 20_000, // 20 seconds to reconnect.
  connectionLeaseMs: 12_000, // Detect dead connection.
  inactivityWarningAfterMs: [10_000, 5_000, 5_000] as const, // works
  inactivityEndGraceMs: 15_000, // 5 seconds after final warning. //works
  maximumRecordingMs: 40_000, // 20 seconds max recording. //worrks
  minimumAnsweredFollowUps: 2, //works
  lifecycleSweepIntervalMs: 2_000, // Check every 2 seconds.
  reconnectExpiryBatchSize: 100,
  reportRecoveryBatchSize: 20,
  staleInterviewTimeoutMs: 2 * 60_000, // 2 minutes.
};
