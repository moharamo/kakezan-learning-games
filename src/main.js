import { parseAudioData } from './audio/parse-audio-data.js';
import { hiraganaToKatakana } from './audio/speech-text.js';
import { playEffect } from './audio/sound-effects.js';
import { answerRhythmQuestion, createRhythmSession, getRhythmProgress } from './games/rhythm-session.js';
import { mountRocketGame } from './games/rocket-ui.js';
import { mountTrainGame } from './games/train-ui.js';
import { mountNinjaGame } from './games/ninja-ui.js';
import { normalizeSpokenAnswer } from './speech/answer-normalizer.js';
import { isSpeechRecognitionSupported, recognizeOnce } from './speech/speech-recognizer.js';

const app = document.querySelector('#app');
const TABLE_ORDER = [1, 2, 3, 4, 5, 6, 7, 8, 9];
const SAVE_KEY = 'kakezan-rhythm-v1';
let readings = new Map();
let session = null;
let selectedDan = null;
let listening = false;
let keypadAnswer = '';
let keypadOpen = false;
let save = loadSave();

function loadSave() {
  try {
    return { completed: {}, voice: true, effects: true, ...JSON.parse(localStorage.getItem(SAVE_KEY)) };
  } catch {
    return { completed: {}, voice: true, effects: true };
  }
}

function persist() {
  localStorage.setItem(SAVE_KEY, JSON.stringify(save));
}

async function loadReadings() {
  const response = await fetch('./public/data/kakezan-readings.csv');
  if (!response.ok) throw new Error('readings-unavailable');
  readings = new Map(parseAudioData(await response.text()).map((entry) => [entry.id, entry]));
}

function entryFor(question) {
  return readings.get(question.id);
}

function speak(text, callback) {
  if (!save.voice || !('speechSynthesis' in window)) {
    callback?.();
    return;
  }
  speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'ja-JP';
  utterance.rate = 0.78;
  if (callback) utterance.onend = callback;
  speechSynthesis.speak(utterance);
}

function renderHub() {
  session = null;
  selectedDan = null;
  app.innerHTML = `
    <header class="hub-header">
      <div><p class="eyebrow">あそんで おぼえる</p><h1>九九ゲームひろば</h1></div>
      <div class="hub-mascot" aria-hidden="true">🎮</div>
    </header>
    <section class="hub-hero">
      <div class="hub-path" aria-hidden="true"><span>🎵</span><i></i><span>🚀</span><i></i><span>🚂</span><i></i><span>🥷</span></div>
      <h2>ゲームで、すこしずつ 九九マスターへ！</h2>
      <p>じゅんばんに あそぶと、すこしずつ むずかしくなるよ。</p>
    </section>
    <section aria-labelledby="games-heading">
      <div class="hub-section-title"><h2 id="games-heading">ゲームを えらぼう</h2></div>
      <div class="game-menu">
        <button class="game-menu-card available rhythm-menu-card" id="rhythm-game">
          <span class="game-order">1</span><span class="game-emoji" aria-hidden="true">🎤🎵</span>
          <span class="game-copy"><strong>九九リズム</strong><small>九九の よみかたと じゅんばんを おぼえよう</small></span>
          <span class="play-mark">あそぶ ▶</span>
        </button>
        <button class="game-menu-card available rocket-menu-card" id="rocket-game"><span class="game-order">2</span><span class="game-emoji" aria-hidden="true">🚀🪐</span><span class="game-copy"><strong>九九ロケット</strong><small>じゅんばんなしで、そのだんを おもいだそう</small></span><span class="play-mark">あそぶ ▶</span></button>
        <button class="game-menu-card available train-menu-card" id="train-game"><span class="game-order">3</span><span class="game-emoji" aria-hidden="true">🚂🚉</span><span class="game-copy"><strong>九九れっしゃ</strong><small>おぼえた だんを まぜて こたえよう</small></span><span class="play-mark">あそぶ ▶</span></button>
        <button class="game-menu-card available ninja-menu-card" id="ninja-game"><span class="game-order">4</span><span class="game-emoji" aria-hidden="true">🥷📜</span><span class="game-copy"><strong>九九にんじゃ</strong><small>81もんから、じかんないに こたえよう</small></span><span class="play-mark">あそぶ ▶</span></button>
      </div>
    </section>`;
  document.querySelector('#rhythm-game').addEventListener('click', renderRhythmHome);
  document.querySelector('#rocket-game').addEventListener('click', () => mountRocketGame({ app, save, persist, playEffect, getReading: entryFor, speak, onExit: renderHub }));
  document.querySelector('#train-game').addEventListener('click', () => mountTrainGame({ app, save, persist, playEffect, getReading: entryFor, speak, onExit: renderHub }));
  document.querySelector('#ninja-game').addEventListener('click', () => mountNinjaGame({ app, save, persist, playEffect, getReading: entryFor, speak, onExit: renderHub }));
}

function comingGame(order, emoji, name, description) {
  return `<article class="game-menu-card coming" aria-label="${name} じゅんびちゅう">
    <span class="game-order">${order}</span><span class="game-emoji" aria-hidden="true">${emoji}</span>
    <span class="game-copy"><strong>${name}</strong><small>${description}</small><em>じゅんびちゅう</em></span>
    <span class="lock-mark" aria-hidden="true">🔒</span>
  </article>`;
}

function renderRhythmHome() {
  window.scrollTo(0, 0);
  session = null;
  selectedDan = null;
  app.innerHTML = `
    <header class="topbar rhythm-topbar">
      <button id="hub-back" class="nav-back" aria-label="ゲームいちらんへ もどる">‹ ゲームいちらん</button>
      <div class="rhythm-title"><div><p class="eyebrow">こえで かなでる</p><h1>🎵 九九リズム</h1></div></div>
      <div class="sound-toggles">
        <button id="voice-toggle" aria-pressed="${save.voice}">${save.voice ? '🔊' : '🔇'}<span>よみ</span></button>
        <button id="effect-toggle" aria-pressed="${save.effects}">${save.effects ? '🎵' : '🔕'}<span>おと</span></button>
      </div>
    </header>
    <section class="welcome-card">
      <div class="welcome-music" aria-hidden="true">🎤🎵</div>
      <div><h2>どの だんを えんそうする？</h2><p>九九の つづきを こたえて、バンドを かんせいさせよう！</p></div>
    </section>
    <section aria-labelledby="dan-heading">
      <h2 id="dan-heading" class="section-heading">だんを えらぼう</h2>
      <div class="dan-grid">
        ${TABLE_ORDER.map((dan, index) => `<button class="dan-button" data-dan="${dan}"><span>${['🥁','🎸','🎹','🎺'][index % 4]}</span><strong>${dan}のだん</strong><small>えんそうする</small></button>`).join('')}
      </div>
    </section>
    <p class="mic-note">🎤 はじめてのときは、マイクを「きょか」してね。</p>`;

  document.querySelector('#voice-toggle').addEventListener('click', () => toggleSetting('voice'));
  document.querySelector('#effect-toggle').addEventListener('click', () => toggleSetting('effects'));
  document.querySelector('#hub-back').addEventListener('click', renderHub);
  document.querySelectorAll('[data-dan]').forEach((button) => button.addEventListener('click', () => startGame(Number(button.dataset.dan))));
}

function toggleSetting(key) {
  save[key] = !save[key];
  persist();
  playEffect('tap', save.effects);
  renderRhythmHome();
}

function startGame(dan) {
  selectedDan = dan;
  session = createRhythmSession(dan);
  keypadAnswer = '';
  keypadOpen = false;
  renderGame();
  window.setTimeout(readPrompt, 350);
}

function readPrompt() {
  if (!session?.currentQuestion) return;
  const entry = entryFor(session.currentQuestion);
  const prompt = entry?.traditional.prompt || `${session.dan} かける ${session.currentQuestion.multiplier}`;
  speak(hiraganaToKatakana(prompt));
}

function renderGame(message = 'マイクを おして、こたえを いおう', mood = 'ready', displayQuestion = session.currentQuestion, showingAnswer = false) {
  window.scrollTo(0, 0);
  const question = displayQuestion;
  const entry = entryFor(question);
  const progress = getRhythmProgress(session);
  const band = progress.introduced >= 8 ? '🎤🎸🥁🎹🎺' : progress.introduced >= 6 ? '🎤🎸🥁🎹' : progress.introduced >= 3 ? '🎤🎸🥁' : '🎤🥁';
  const speechSupported = isSpeechRecognitionSupported();
  app.innerHTML = `
    <header class="game-header compact-game-header"><nav class="game-nav" aria-label="もどる"><button id="game-list-button" class="nav-back" aria-label="ゲームいちらんへもどる">‹ いちらん</button><button id="back-button" class="nav-home" aria-label="だんをえらぶ">⌂</button></nav><strong>${selectedDan}のだん</strong><span>${progress.introduced} / 9</span></header>
    <section class="rhythm-card" data-mood="${mood}">
      <div class="crack-track" aria-label="9もんちゅう ${progress.introduced}もん">
        ${Array.from({ length: 9 }, (_, index) => `<span class="${index < progress.introduced ? 'done' : ''}">${index < progress.introduced ? '♪' : '·'}</span>`).join('')}
      </div>
      <div class="music-stage has-meaning"><div class="music-band" aria-hidden="true">${band}</div><div class="music-notes" aria-hidden="true">♪　♫　♪</div>
        <div class="rhythm-groups" style="--group-count:${question.multiplier}" aria-label="${question.multiplicand}こずつが ${question.multiplier}つ">
          ${Array.from({ length: question.multiplier }, (_, groupIndex) => `<span class="rhythm-group" style="--group-index:${groupIndex}">${Array.from({ length: question.multiplicand }, () => '<i>♪</i>').join('')}</span>`).join('')}
        </div>
        <p class="multiplication-meaning"><strong>${question.multiplicand}こずつ</strong>が <strong>${question.multiplier}つ</strong>${showingAnswer ? `<br><span>${Array.from({ length: question.multiplier }, () => question.multiplicand).join('＋')}＝${question.answer}</span>` : ''}</p>
      </div>
      <p class="prompt-label">つづきは なあに？</p>
      <h1 class="rhythm-prompt"><span>${question.multiplicand}</span><span class="math-sign">×</span><span>${question.multiplier}</span><span class="math-sign">＝</span></h1>
      <p class="traditional-reading">${entry?.traditional.prompt || `${question.multiplicand} かける ${question.multiplier}`}</p>
      <button class="replay-button" id="replay-button" ${showingAnswer ? 'disabled' : ''}>🔊 もういちど きく</button>
      <p class="game-message" id="game-message" role="status">${message}</p>
      <div class="rhythm-answer-actions">
        ${speechSupported ? `<button class="microphone-button" id="microphone-button" ${listening || showingAnswer ? 'disabled' : ''}><span>${listening ? '👂' : '🎤'}</span><strong>${showingAnswer ? 'つぎの もんだいへ…' : listening ? 'きいているよ…' : 'こえで こたえる'}</strong></button>` : `<div class="unsupported-message">🎤🚫 こえを きけないよ</div>`}
        <button class="keypad-launch" id="keypad-launch" ${showingAnswer ? 'disabled' : ''}>🔢 すうじで<br>こたえる</button>
      </div>
      <div class="keypad-overlay ${keypadOpen ? 'is-open' : ''}" id="keypad-overlay" aria-hidden="${!keypadOpen}">
        <button class="keypad-backdrop" id="keypad-backdrop" aria-label="すうじパッドを とじる"></button>
        <section class="keypad-sheet" role="dialog" aria-modal="true" aria-label="すうじで こたえる">
          <header class="keypad-sheet-header">
            <div class="sheet-question"><span>${question.multiplicand} × ${question.multiplier} ＝</span><strong class="keypad-answer" id="keypad-answer">${keypadAnswer || '？'}</strong></div>
            <button class="keypad-close" id="keypad-close" aria-label="とじる">×</button>
          </header>
          <div class="number-pad">
            ${[1,2,3,4,5,6,7,8,9].map((digit) => `<button data-digit="${digit}">${digit}</button>`).join('')}
            <button id="erase-button" aria-label="ひとつ けす">←</button>
            <button data-digit="0">0</button>
            <button id="submit-keypad" class="ok-key">こたえる</button>
          </div>
        </section>
      </div>
    </section>`;

  document.querySelector('#game-list-button').addEventListener('click', renderHub);
  document.querySelector('#back-button').addEventListener('click', renderRhythmHome);
  document.querySelector('#replay-button').addEventListener('click', readPrompt);
  document.querySelector('#microphone-button')?.addEventListener('click', beginListening);
  document.querySelector('#keypad-launch').addEventListener('click', openKeypad);
  document.querySelector('#keypad-backdrop').addEventListener('click', closeKeypad);
  document.querySelector('#keypad-close').addEventListener('click', closeKeypad);
  document.querySelectorAll('[data-digit]').forEach((button) => button.addEventListener('click', () => enterDigit(button.dataset.digit)));
  document.querySelector('#erase-button').addEventListener('click', () => { keypadAnswer = keypadAnswer.slice(0, -1); updateKeypad(); });
  document.querySelector('#submit-keypad').addEventListener('click', submitKeypad);
}

function openKeypad() {
  keypadOpen = true;
  playEffect('tap', save.effects);
  document.querySelector('.rhythm-card')?.classList.add('keypad-open');
  const overlay = document.querySelector('#keypad-overlay');
  overlay?.classList.add('is-open');
  overlay?.setAttribute('aria-hidden', 'false');
  document.querySelector('[data-digit="1"]')?.focus();
}

function closeKeypad() {
  keypadOpen = false;
  document.querySelector('.rhythm-card')?.classList.remove('keypad-open');
  const overlay = document.querySelector('#keypad-overlay');
  overlay?.classList.remove('is-open');
  overlay?.setAttribute('aria-hidden', 'true');
  document.querySelector('#keypad-launch')?.focus();
}

async function beginListening() {
  if (listening) return;
  listening = true;
  playEffect('tap', save.effects);
  renderGame('きいているよ…　ゆっくり いってね', 'listening');
  try {
    const transcripts = await recognizeOnce();
    const values = transcripts.map(normalizeSpokenAnswer).filter((value) => value !== null);
    const expected = session.currentQuestion.answer;
    const answer = values.includes(expected) ? expected : values[0];
    listening = false;
    if (answer === undefined) {
      renderGame(`「${transcripts[0] || ''}」って きこえたよ。もういちど おしえてね`, 'unsure');
      return;
    }
    handleAnswer(answer, `「${transcripts[0]}」って きこえたよ`);
  } catch (error) {
    listening = false;
    const denied = ['not-allowed', 'service-not-allowed'].includes(error.message);
    renderGame(denied ? 'マイクを つかえなかったよ。すうじでも あそべるよ' : 'こえが きこえなかったよ。もういちど やってみよう', 'unsure');
  }
}

function enterDigit(digit) {
  if (keypadAnswer.length >= 2) return;
  playEffect('tap', save.effects);
  keypadAnswer += digit;
  updateKeypad();
}

function updateKeypad() {
  const element = document.querySelector('#keypad-answer');
  if (element) element.textContent = keypadAnswer || '？';
}

function submitKeypad() {
  if (!keypadAnswer) return;
  const answer = Number(keypadAnswer);
  keypadAnswer = '';
  handleAnswer(answer, `${answer} だね`);
}

function handleAnswer(answer, heardMessage) {
  keypadOpen = false;
  const answeredQuestion = session.currentQuestion;
  const entry = entryFor(answeredQuestion);
  const result = answerRhythmQuestion(session, answer);
  session = result.state;
  if (result.feedback.correct) {
    playEffect('correct', save.effects);
    renderFeedback(`${heardMessage}　せいかい！`, 'correct', entry?.traditional.full, 1500, answeredQuestion);
  } else {
    playEffect('try-again', save.effects);
    renderFeedback(`${heardMessage}　おしい！ ${result.feedback.correctAnswer} だよ`, 'wrong', entry?.traditional.full, 2300, answeredQuestion);
  }
}

function renderFeedback(message, mood, spokenText, delay, answeredQuestion) {
  if (session.completed) {
    finishGame();
    return;
  }
  renderGame(message, mood, answeredQuestion, true);
  speak(spokenText ? hiraganaToKatakana(spokenText) : message);
  window.setTimeout(() => {
    renderGame();
    readPrompt();
  }, delay);
}

function finishGame() {
  window.scrollTo(0, 0);
  save.completed[selectedDan] = true;
  persist();
  playEffect('hatch', save.effects);
  app.innerHTML = `<nav class="game-nav" aria-label="もどる"><button id="finish-game-list" class="nav-back">‹ ゲームいちらん</button><button id="home-button" class="nav-home" aria-label="だんをえらぶ">⌂</button></nav><section class="finish-card music-finish"><div class="finished-band">🎤🎸🥁🎹🎺</div><p class="eyebrow">ライブ せいこう！</p><h1>${selectedDan}のだん、できた！</h1><p>みんなで えんそう できたよ。</p><div class="finish-actions"><button id="again-button" class="primary-button">もういちど</button></div></section>`;
  speak(`${selectedDan}のだん、ぜんぶ いえたね。ライブ せいこう`);
  document.querySelector('#again-button').addEventListener('click', () => startGame(selectedDan));
  document.querySelector('#finish-game-list').addEventListener('click', renderHub);
  document.querySelector('#home-button').addEventListener('click', renderRhythmHome);
}

try {
  await loadReadings();
  renderHub();
} catch {
  app.innerHTML = '<section class="error-card"><h1>よみこめませんでした</h1><p>かいはつサーバーから ひらいてください。</p></section>';
}
