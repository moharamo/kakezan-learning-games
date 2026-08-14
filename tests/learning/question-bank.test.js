import test from 'node:test';
import assert from 'node:assert/strict';
import { generateQuestionBank } from '../../src/learning/question-bank.js';

test('九九1〜9の全81問を重複なく生成する', () => {
  const bank = generateQuestionBank();
  assert.equal(bank.length, 81);
  assert.equal(new Set(bank.map(({ id }) => id)).size, 81);
  assert.deepEqual(bank[0], { id: '1x1', multiplicand: 1, multiplier: 1, answer: 1, chapter: 1 });
  assert.deepEqual(bank.at(-1), { id: '9x9', multiplicand: 9, multiplier: 9, answer: 81, chapter: 9 });
});

