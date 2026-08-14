import { createMasteryRecord, isReviewDue, SLOW_RESPONSE_MS } from './mastery.js';

/** 優先度: 誤答 > 期限超過 > 遅い正答 > 未出題 > 通常復習。 */
export function calculatePriority(record, now = Date.now()) {
  if (record.attempts === 0) return 300;

  let priority = 100;
  if (record.lastCorrect === false) priority += 500;
  if (record.lastCorrect && record.lastResponseTimeMs > SLOW_RESPONSE_MS) priority += 350;

  if (isReviewDue(record, now)) {
    const overdueDays = Math.floor((now - record.nextReviewAt) / 86_400_000);
    priority += 400 + Math.min(overdueDays, 30);
  } else if (record.nextReviewAt !== null) {
    priority -= 200;
  }

  // 十分に練習した項目だけが選ばれ続けることを防ぐ。
  return priority - Math.min(record.attempts, 20);
}

/**
 * 対象問題から次問を選ぶ。同点内は注入された乱数で選び、テスト可能にする。
 */
export function selectNextQuestion(questions, masteryById = {}, {
  now = Date.now(),
  random = Math.random,
  excludeIds = [],
} = {}) {
  const excluded = new Set(excludeIds);
  const candidates = questions.filter((question) => !excluded.has(question.id));
  if (candidates.length === 0) return null;

  const ranked = candidates.map((question) => {
    const record = masteryById[question.id] ?? createMasteryRecord(question.id);
    return { question, priority: calculatePriority(record, now) };
  });
  const highest = Math.max(...ranked.map(({ priority }) => priority));
  const tied = ranked.filter(({ priority }) => priority === highest);
  const index = Math.min(Math.floor(random() * tied.length), tied.length - 1);
  return tied[index].question;
}

