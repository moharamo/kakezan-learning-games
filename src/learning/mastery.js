export const SLOW_RESPONSE_MS = 5_000;

const REVIEW_INTERVALS_MS = Object.freeze([
  10 * 60 * 1_000,
  24 * 60 * 60 * 1_000,
  3 * 24 * 60 * 60 * 1_000,
  7 * 24 * 60 * 60 * 1_000,
]);

export function createMasteryRecord(questionId) {
  return {
    questionId,
    attempts: 0,
    correctAttempts: 0,
    consecutiveCorrect: 0,
    slowCorrectAttempts: 0,
    lapseCount: 0,
    intervalLevel: 0,
    lastAnsweredAt: null,
    nextReviewAt: null,
    lastResponseTimeMs: null,
    lastCorrect: null,
    successfulDays: [],
  };
}

function dayKey(timestamp) {
  return new Date(timestamp).toISOString().slice(0, 10);
}

/**
 * 回答結果から新しい習熟レコードを返す（元データは変更しない）。
 * 速い正答だけが復習間隔を伸ばし、誤答・遅い正答は早期復習へ戻す。
 */
export function recordAttempt(record, {
  correct,
  responseTimeMs,
  answeredAt = Date.now(),
  slowThresholdMs = SLOW_RESPONSE_MS,
}) {
  if (!Number.isFinite(responseTimeMs) || responseTimeMs < 0) {
    throw new RangeError('responseTimeMs must be a non-negative finite number');
  }

  const fluent = correct && responseTimeMs <= slowThresholdMs;
  const intervalLevel = fluent
    ? Math.min(record.intervalLevel + 1, REVIEW_INTERVALS_MS.length - 1)
    : 0;
  const reviewDelay = fluent ? REVIEW_INTERVALS_MS[intervalLevel] : REVIEW_INTERVALS_MS[0];
  const successfulDays = fluent
    ? [...new Set([...record.successfulDays, dayKey(answeredAt)])]
    : [...record.successfulDays];

  return {
    ...record,
    attempts: record.attempts + 1,
    correctAttempts: record.correctAttempts + (correct ? 1 : 0),
    consecutiveCorrect: correct ? record.consecutiveCorrect + 1 : 0,
    slowCorrectAttempts: record.slowCorrectAttempts + (correct && !fluent ? 1 : 0),
    lapseCount: record.lapseCount + (correct ? 0 : 1),
    intervalLevel,
    lastAnsweredAt: answeredAt,
    nextReviewAt: answeredAt + reviewDelay,
    lastResponseTimeMs: responseTimeMs,
    lastCorrect: Boolean(correct),
    successfulDays,
  };
}

export function getMasteryStatus(record) {
  if (record.attempts === 0) return 'unseen';
  if (record.successfulDays.length >= 2 && record.intervalLevel >= 3) return 'mastered';
  if (record.intervalLevel >= 1) return 'learning';
  return 'needs-practice';
}

export function isReviewDue(record, now = Date.now()) {
  return record.nextReviewAt !== null && record.nextReviewAt <= now;
}

