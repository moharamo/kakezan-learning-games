import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeVoiceKey } from '../../src/audio/voice-player.js';

test('音声キーの空白と句読点を除きカタカナをひらがなにする', () => {
  assert.equal(normalizeVoiceKey('インイチガ、 イチ。'), 'いんいちがいち');
});

