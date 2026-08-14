/** Convert hiragana characters to katakana without changing other characters. */
export function hiraganaToKatakana(value) {
  if (typeof value !== 'string') {
    throw new TypeError('Speech text must be a string');
  }

  return [...value].map((character) => {
    const code = character.codePointAt(0);
    return code >= 0x3041 && code <= 0x3096
      ? String.fromCodePoint(code + 0x60)
      : character;
  }).join('');
}
