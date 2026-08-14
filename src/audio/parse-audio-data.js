const COLUMN_COUNT = 7;
const MAX_SOURCE_LENGTH = 100_000;
const MAX_FIELD_LENGTH = 200;

/**
 * Parse the seven-column UTF-8 data used for multiplication read-aloud text.
 * No HTML is produced here; consumers must assign returned strings via textContent.
 */
export function parseAudioData(source, { requireComplete = true } = {}) {
  if (typeof source !== 'string') {
    throw new TypeError('Audio data must be a string');
  }
  if (source.length > MAX_SOURCE_LENGTH) {
    throw new RangeError('Audio data is too large');
  }

  const normalized = source.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
  if (normalized.includes('\0')) {
    throw new SyntaxError('Audio data contains a null character');
  }

  const lines = normalized.split('\n');
  if (lines.at(-1) === '') lines.pop();
  if (lines.length === 0 || lines.some((line) => line.trim() === '')) {
    throw new SyntaxError('Audio data contains an empty row');
  }

  const seen = new Set();
  const entries = lines.map((line, index) => {
    const fields = parseCsvRow(line, index + 1);
    if (fields.length !== COLUMN_COUNT) {
      throw new SyntaxError(`Row ${index + 1} must have exactly ${COLUMN_COUNT} columns`);
    }
    if (fields.some((field) => field.length === 0 || field.length > MAX_FIELD_LENGTH)) {
      throw new SyntaxError(`Row ${index + 1} contains an empty or oversized field`);
    }

    const match = /^([1-9])×([1-9])=(\d{1,2})$/u.exec(fields[0]);
    if (!match) throw new SyntaxError(`Row ${index + 1} has an invalid expression`);
    const left = Number(match[1]);
    const right = Number(match[2]);
    const answer = Number(match[3]);
    if (answer !== left * right) {
      throw new SyntaxError(`Row ${index + 1} has an incorrect product`);
    }

    const id = `${left}x${right}`;
    if (seen.has(id)) throw new SyntaxError(`Row ${index + 1} duplicates ${id}`);
    seen.add(id);

    return Object.freeze({
      id,
      left,
      right,
      answer,
      standard: Object.freeze({ full: fields[1], prompt: fields[2], answer: fields[3] }),
      traditional: Object.freeze({ full: fields[4], prompt: fields[5], answer: fields[6] }),
    });
  });

  if (requireComplete && entries.length !== 81) {
    throw new SyntaxError(`Audio data must contain 81 rows; received ${entries.length}`);
  }
  return Object.freeze(entries);
}

function parseCsvRow(line, rowNumber) {
  const fields = [];
  let field = '';
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"') {
      if (quoted && line[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (quoted || field.length === 0) {
        quoted = !quoted;
      } else {
        throw new SyntaxError(`Row ${rowNumber} has an unexpected quote`);
      }
    } else if (character === ',' && !quoted) {
      fields.push(field.trim());
      field = '';
    } else {
      field += character;
    }
  }
  if (quoted) throw new SyntaxError(`Row ${rowNumber} has an unclosed quote`);
  fields.push(field.trim());
  return fields;
}
