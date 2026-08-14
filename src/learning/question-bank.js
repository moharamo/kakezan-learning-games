/** 九九（1〜9の段、全81問）の不変な問題バンクを生成する。 */
export function generateQuestionBank() {
  const questions = [];

  for (let multiplicand = 1; multiplicand <= 9; multiplicand += 1) {
    for (let multiplier = 1; multiplier <= 9; multiplier += 1) {
      questions.push(Object.freeze({
        id: `${multiplicand}x${multiplier}`,
        multiplicand,
        multiplier,
        answer: multiplicand * multiplier,
        chapter: multiplicand,
      }));
    }
  }

  return Object.freeze(questions);
}

export const QUESTION_BANK = generateQuestionBank();

