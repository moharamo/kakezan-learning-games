import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { parseAudioData } from '../src/audio/parse-audio-data.js';

const ENGINE = process.env.VOICEVOX_ENGINE || 'http://127.0.0.1:50021';
const SPEAKER = 2; // 四国めたん・ノーマル
const metadataOnly = process.argv.includes('--metadata-only');
const outputDirectory = join(process.cwd(), 'public', 'audio', 'voicevox');
const csv = await readFile(join(process.cwd(), 'public', 'data', 'kakezan-readings.csv'), 'utf8');
const entries = parseAudioData(csv);
const lines = [];

function normalize(text) {
  return text.normalize('NFKC').replace(/[\s、。！？?]/g, '').replace(/[ァ-ヶ]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0x60));
}

function toKatakana(text) {
  return text.replace(/[ぁ-ゖ]/g, (char) => String.fromCharCode(char.charCodeAt(0) + 0x60));
}

function add(key, text, fileStem) {
  lines.push({ key: normalize(key), text: text.normalize('NFC'), file: `./public/audio/voicevox/${fileStem}.wav` });
}

for (const entry of entries) {
  const id = entry.id.replace('x', '-');
  add(entry.standard.prompt, toKatakana(entry.standard.prompt), `standard-prompt-${id}`);
  add(entry.traditional.prompt, toKatakana(entry.traditional.prompt), `traditional-prompt-${id}`);
  add(entry.traditional.full, toKatakana(entry.traditional.full), `traditional-full-${id}`);
  add(`こたえが${entry.answer}になる${entry.left}のだんはどれ`, `答えが${entry.answer}になる${entry.left}の段はどれ？`, `rocket-challenge-${id}`);
}

for (let dan = 1; dan <= 9; dan += 1) {
  add(`${dan}のだん、ぜんぶいえたね。ライブせいこう`, `${dan}の段、全部言えたね。ライブ成功！`, `rhythm-finish-${dan}`);
}

const uniqueByKey = new Map(lines.map((line) => [line.key, line]));
const synthesisLines = [...new Map([...uniqueByKey.values()].map((line) => [line.file, line])).values()];
const manifest = Object.fromEntries([...uniqueByKey.values()].map(({ key, text, file }) => [key, { text, file }]));

await mkdir(outputDirectory, { recursive: true });
await writeFile(join(process.cwd(), 'public', 'audio', 'voice-lines.txt'), `${synthesisLines.map((line) => line.text).join('\n')}\n`, 'utf8');
await writeFile(join(process.cwd(), 'public', 'audio', 'voice-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

if (!metadataOnly) for (const [index, line] of synthesisLines.entries()) {
  const queryResponse = await fetch(`${ENGINE}/audio_query?speaker=${SPEAKER}&text=${encodeURIComponent(line.text)}`, { method: 'POST' });
  if (!queryResponse.ok) throw new Error(`audio_query failed: ${queryResponse.status} ${line.text}`);
  const query = await queryResponse.json();
  query.speedScale = 1.05;
  query.prePhonemeLength = 0.08;
  query.postPhonemeLength = 0.08;
  const synthesisResponse = await fetch(`${ENGINE}/synthesis?speaker=${SPEAKER}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(query),
  });
  if (!synthesisResponse.ok) throw new Error(`synthesis failed: ${synthesisResponse.status} ${line.text}`);
  await writeFile(join(process.cwd(), line.file.replace('./', '')), Buffer.from(await synthesisResponse.arrayBuffer()));
  if ((index + 1) % 25 === 0 || index + 1 === synthesisLines.length) console.log(`${index + 1}/${synthesisLines.length}`);
}
