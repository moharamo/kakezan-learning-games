import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { parseAudioData } from '../../src/audio/parse-audio-data.js';

const row = (left, right) => {
  const expression = `${left}×${right}=${left * right}`;
  return `${expression},標準全文,標準問題,標準答え,唱え方全文,唱え方問題,唱え方答え`;
};

test('parses and freezes all 81 multiplication records', () => {
  const source = Array.from({ length: 9 }, (_, leftIndex) =>
    Array.from({ length: 9 }, (_, rightIndex) => row(leftIndex + 1, rightIndex + 1)),
  ).flat().join('\n');

  const records = parseAudioData(`\uFEFF${source}\r\n`);
  assert.equal(records.length, 81);
  assert.deepEqual(records[71], {
    id: '8x9', left: 8, right: 9, answer: 72,
    standard: { full: '標準全文', prompt: '標準問題', answer: '標準答え' },
    traditional: { full: '唱え方全文', prompt: '唱え方問題', answer: '唱え方答え' },
  });
  assert.equal(Object.isFrozen(records[0].standard), true);
});

test('rejects malformed, incorrect, duplicate, and incomplete data', () => {
  assert.throws(() => parseAudioData('2×3=7,a,b,c,d,e,f', { requireComplete: false }), /incorrect product/);
  assert.throws(() => parseAudioData('2×3=6,a,b,c,d,e', { requireComplete: false }), /exactly 7 columns/);
  assert.throws(() => parseAudioData(`${row(2, 3)}\n${row(2, 3)}`, { requireComplete: false }), /duplicates/);
  assert.throws(() => parseAudioData(row(1, 1)), /81 rows/);
});

test('the supplied UTF-8 file matches the supported format', async (context) => {
  const suppliedPath = 'C:/Users/m08ra/Downloads/kakezan_81mon_7koumoku_v2.txt';
  let source;
  try {
    source = await readFile(suppliedPath, 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') return context.skip('The user-supplied fixture is not available');
    throw error;
  }
  const records = parseAudioData(source);
  assert.equal(records[0].id, '1x1');
  assert.equal(records.at(-1).id, '9x9');
});
