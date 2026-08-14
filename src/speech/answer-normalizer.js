const ONES = new Map([
  ['いち', 1], ['に', 2], ['さん', 3],
  ['よん', 4], ['し', 4], ['ご', 5], ['ろく', 6],
  ['なな', 7], ['しち', 7], ['はち', 8],
  ['きゅう', 9], ['く', 9],
]);

const KANJI_DIGITS = new Map([
  ['一', 1], ['二', 2], ['三', 3], ['四', 4], ['五', 5],
  ['六', 6], ['七', 7], ['八', 8], ['九', 9],
]);

// Exact-match aliases observed in Japanese speech recognition. Keeping these
// separate from numeral parsing prevents unrelated sentences from being scored.
const RECOGNITION_ALIASES = new Map([
  ['重視', 14],
  ['急に', 12],
  ['喜寿', 40],
  ['始終に', 42],
  ['幼女', 40],
]);

/**
 * Convert a Japanese speech-recognition result into an answer from 1 to 81.
 * Returns null for ambiguous, malformed, or out-of-range input.
 */
export function normalizeSpokenAnswer(transcript) {
  if (typeof transcript !== 'string') return null;

  let value = transcript
    .normalize('NFKC')
    .trim()
    .replace(/[\s、。,.!?！？「」『』（）()]/gu, '')
    .replace(/^(?:こたえ|答え)(?:は|が)?/u, '')
    .replace(/(?:です|でした|だよ|だ|になります|かな)$/u, '');

  if (!value) return null;

  if (/^\d{1,2}$/u.test(value)) return inRange(Number(value));
  if (RECOGNITION_ALIASES.has(value)) return RECOGNITION_ALIASES.get(value);

  value = katakanaToHiragana(value);
  const kanaNumber = parseKanaNumber(value);
  if (kanaNumber !== null) return inRange(kanaNumber);

  return inRange(parseKanjiNumber(value));
}

function parseKanaNumber(value) {
  if (ONES.has(value)) return ONES.get(value);

  const tenAt = value.indexOf('じゅう');
  if (tenAt < 0 || tenAt !== value.lastIndexOf('じゅう')) return null;

  const tensText = value.slice(0, tenAt);
  const onesText = value.slice(tenAt + 'じゅう'.length);
  const tens = tensText === '' ? 1 : ONES.get(tensText);
  const ones = onesText === '' ? 0 : ONES.get(onesText);
  return tens === undefined || ones === undefined ? null : tens * 10 + ones;
}

function parseKanjiNumber(value) {
  if (KANJI_DIGITS.has(value)) return KANJI_DIGITS.get(value);
  const tenAt = value.indexOf('十');
  if (tenAt < 0 || tenAt !== value.lastIndexOf('十')) return null;

  const tensText = value.slice(0, tenAt);
  const onesText = value.slice(tenAt + 1);
  const tens = tensText === '' ? 1 : KANJI_DIGITS.get(tensText);
  const ones = onesText === '' ? 0 : KANJI_DIGITS.get(onesText);
  return tens === undefined || ones === undefined ? null : tens * 10 + ones;
}

function katakanaToHiragana(value) {
  return [...value].map((character) => {
    const code = character.codePointAt(0);
    return code >= 0x30a1 && code <= 0x30f6
      ? String.fromCodePoint(code - 0x60)
      : character;
  }).join('');
}

function inRange(value) {
  return Number.isInteger(value) && value >= 1 && value <= 81 ? value : null;
}
