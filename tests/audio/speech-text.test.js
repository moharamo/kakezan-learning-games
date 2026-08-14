import assert from 'node:assert/strict';
import test from 'node:test';

import { hiraganaToKatakana } from '../../src/audio/speech-text.js';

test('ひらがなをカタカナへ変換する', () => {
  assert.equal(hiraganaToKatakana('いちかけるはちは、はち'), 'イチカケルハチハ、ハチ');
  assert.equal(hiraganaToKatakana('きゅうじゅう'), 'キュウジュウ');
});

test('漢字、数字、記号、既存カタカナは維持する', () => {
  assert.equal(hiraganaToKatakana('答えは42です。テスト'), '答エハ42デス。テスト');
  assert.equal(hiraganaToKatakana(''), '');
});

test('文字列以外を拒否する', () => {
  assert.throws(() => hiraganaToKatakana(null), TypeError);
  assert.throws(() => hiraganaToKatakana(42), TypeError);
});
