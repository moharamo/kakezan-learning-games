import assert from 'node:assert/strict';
import test from 'node:test';

import { normalizeSpokenAnswer } from '../../src/speech/answer-normalizer.js';

test('数字と全角数字を1〜81へ正規化する', () => {
  assert.equal(normalizeSpokenAnswer('42'), 42);
  assert.equal(normalizeSpokenAnswer(' ８１。'), 81);
  assert.equal(normalizeSpokenAnswer('答えは １６ です'), 16);
});

test('漢数字の一の位と十の位を正規化する', () => {
  assert.equal(normalizeSpokenAnswer('四'), 4);
  assert.equal(normalizeSpokenAnswer('十'), 10);
  assert.equal(normalizeSpokenAnswer('二十四'), 24);
  assert.equal(normalizeSpokenAnswer('答えは七十二です'), 72);
  assert.equal(normalizeSpokenAnswer('八十一'), 81);
});

test('ひらがなとカタカナの読みを正規化する', () => {
  assert.equal(normalizeSpokenAnswer('ろく'), 6);
  assert.equal(normalizeSpokenAnswer('じゅうはち'), 18);
  assert.equal(normalizeSpokenAnswer('さんじゅうろく'), 36);
  assert.equal(normalizeSpokenAnswer('ハチジュウイチ'), 81);
  assert.equal(normalizeSpokenAnswer('答えは よんじゅうに です'), 42);
});

test('一般的な数字の読みの揺れを扱う', () => {
  assert.equal(normalizeSpokenAnswer('よん'), 4);
  assert.equal(normalizeSpokenAnswer('し'), 4);
  assert.equal(normalizeSpokenAnswer('なな'), 7);
  assert.equal(normalizeSpokenAnswer('しち'), 7);
  assert.equal(normalizeSpokenAnswer('きゅう'), 9);
  assert.equal(normalizeSpokenAnswer('く'), 9);
  assert.equal(normalizeSpokenAnswer('しじゅうく'), 49);
});

test('既知の音声認識誤変換を完全一致で補正する', () => {
  assert.equal(normalizeSpokenAnswer('重視'), 14);
  assert.equal(normalizeSpokenAnswer('答えは急にです'), 12);
  assert.equal(normalizeSpokenAnswer('喜寿'), 40);
  assert.equal(normalizeSpokenAnswer('始終に'), 42);
  assert.equal(normalizeSpokenAnswer('幼女'), 40);
  assert.equal(normalizeSpokenAnswer('喜寿ですか'), null);
  assert.equal(normalizeSpokenAnswer('今日は重視します'), null);
});

test('曖昧・不正・範囲外の入力はnullにする', () => {
  for (const input of ['', 'こんにちは', '3か4', '0', '82', '九十', 'じゅうじゅう', null]) {
    assert.equal(normalizeSpokenAnswer(input), null, String(input));
  }
});
