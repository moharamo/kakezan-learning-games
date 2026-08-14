import { answerNinjaQuestion, createNinjaSession, getNinjaProgress, NINJA_LEVELS } from './ninja-session.js';

const LEVELS = [
  { id: 'egg', icon: '🥚', name: 'みならい', note: '5もん・12びょう' },
  { id: 'chick', icon: '🐣', name: 'しゅぎょう中', note: '7もん・9びょう' },
  { id: 'hen', icon: '🐔', name: 'じょうにん', note: '10もん・7びょう' },
  { id: 'star', icon: '⭐', name: 'めんきょかいでん', note: '15もん・5びょう' },
];
const TECHNIQUES = ['💨 ぶんしん', '🌪️ たつまき', '✨ かわりみ', '🥷 しゅりけん'];

export function mountNinjaGame({ app, save, persist, playEffect, getReading, speak, onExit }) {
  save.ninja ??= { completedLevel: -1, mastery: {}, missions: 0, best: {} };
  let levelIndex = 0;
  let session = null;
  let answer = '';
  let locked = false;
  let timerActive = false;
  let questionStartedAt = 0;
  let countdown = null;
  let readingFallback = null;

  function stopTimers() {
    clearInterval(countdown);
    clearTimeout(readingFallback);
    countdown = null;
    readingFallback = null;
    timerActive = false;
  }

  function renderHome() {
    window.scrollTo(0, 0);
    stopTimers(); session = null;
    app.innerHTML = `<header class="ninja-header"><button id="ninja-exit" class="nav-back" aria-label="ゲームいちらんへ もどる">‹ ゲームいちらん</button><div><p class="eyebrow">ランダム 九九の さいしゅうしゅぎょう</p><h1>🥷 九九にんじゃ</h1></div></header>
      <section class="ninja-welcome"><div aria-hidden="true">🥷📜💨</div><h2>九九の じゅつを きわめよう！</h2><p>81もんから ばらばらに でるよ。まきものが とじるまえに こたえよう。</p></section>
      <div class="ninja-levels">${LEVELS.map((level, index) => `<button data-ninja-level="${index}"><span>${level.icon}</span><span><strong>${level.name}</strong><small>${level.note}</small></span><em>はじめる ▶</em></button>`).join('')}</div>`;
    document.querySelector('#ninja-exit').addEventListener('click', onExit);
    document.querySelectorAll('[data-ninja-level]').forEach((button) => button.addEventListener('click', () => startMission(Number(button.dataset.ninjaLevel))));
  }

  function startMission(index) {
    levelIndex = index;
    session = createNinjaSession(LEVELS[index].id, { masteryById: save.ninja.mastery });
    beginQuestion();
  }

  function beginQuestion() {
    stopTimers();
    answer = ''; locked = false; timerActive = false;
    renderQuestion('まきものを よんでいるよ…', 'reading');
    const q = session.currentQuestion;
    const entry = getReading(q);
    let started = false;
    const startOnce = () => {
      if (started || session?.currentQuestion?.id !== q.id || locked) return;
      started = true;
      startCountdown(q.id);
    };
    speak(entry?.standard.prompt || `${q.multiplicand} かける ${q.multiplier} は`, startOnce);
    readingFallback = setTimeout(startOnce, 2600);
  }

  function renderQuestion(message, mood) {
    window.scrollTo(0, 0);
    const q = session.currentQuestion;
    const progress = getNinjaProgress(session);
    app.innerHTML = `<header class="ninja-game-header"><nav class="game-nav" aria-label="もどる"><button id="ninja-game-exit" class="nav-back">‹ ゲームいちらん</button><button id="ninja-quit" class="nav-home" aria-label="レベルをえらぶ">⌂</button></nav><strong>${LEVELS[levelIndex].icon} ${LEVELS[levelIndex].name}</strong><span>${progress.answered + 1} / ${progress.total}</span></header>
      <section class="ninja-game-card" data-mood="${mood}">
        <div class="ninja-timer" aria-label="のこりじかん"><i id="ninja-timer-bar"></i></div>
        <div class="ninja-stage" aria-hidden="true"><span class="ninja-moon">🌙</span><span class="ninja-clouds">☁️　☁️</span><span class="ninja-hero">🥷</span><span class="ninja-smoke">💨</span></div>
        <div class="ninja-scroll"><small>九九の まきもの</small><h1>${q.multiplicand}<span>×</span>${q.multiplier}<span>＝</span><b>${answer || '？'}</b></h1></div>
        <p class="ninja-message" role="status">${message}</p>
        <div class="ninja-pad" aria-label="すうじで こたえる">
          ${[1,2,3,4,5,6,7,8,9].map((digit) => `<button data-ninja-digit="${digit}" ${timerActive && !locked ? '' : 'disabled'}>${digit}</button>`).join('')}
          <button id="ninja-erase" aria-label="ひとつ けす" ${timerActive && !locked ? '' : 'disabled'}>←</button>
          <button data-ninja-digit="0" ${timerActive && !locked ? '' : 'disabled'}>0</button>
          <button id="ninja-submit" class="ninja-ok" ${timerActive && !locked && answer ? '' : 'disabled'}>決定</button>
        </div>
      </section>`;
    document.querySelector('#ninja-game-exit').addEventListener('click', onExit);
    document.querySelector('#ninja-quit').addEventListener('click', renderHome);
    document.querySelectorAll('[data-ninja-digit]').forEach((button) => button.addEventListener('click', () => enterDigit(button.dataset.ninjaDigit)));
    document.querySelector('#ninja-erase').addEventListener('click', () => { answer = answer.slice(0, -1); updateAnswer(); });
    document.querySelector('#ninja-submit').addEventListener('click', submitAnswer);
  }

  function startCountdown(questionId) {
    if (session?.currentQuestion?.id !== questionId || locked) return;
    timerActive = true;
    questionStartedAt = Date.now();
    renderQuestion('数字を おして、じゅつを だそう！', 'ready');
    const limit = NINJA_LEVELS[LEVELS[levelIndex].id].timeLimitMs;
    const deadline = questionStartedAt + limit;
    countdown = setInterval(() => {
      if (session?.currentQuestion?.id !== questionId || locked) { clearInterval(countdown); return; }
      const remaining = Math.max(0, deadline - Date.now());
      const bar = document.querySelector('#ninja-timer-bar');
      if (bar) {
        const ratio = remaining / limit;
        bar.style.width = `${ratio * 100}%`;
        bar.style.background = ratio < .3 ? '#df4b42' : ratio < .6 ? '#f3bd3c' : '#4aa76a';
      }
      if (remaining === 0) handleTimeout(limit);
    }, 100);
  }

  function enterDigit(digit) {
    if (!timerActive || locked || answer.length >= 2) return;
    answer += digit; playEffect('tap', save.effects); updateAnswer();
  }

  function updateAnswer() {
    const value = document.querySelector('.ninja-scroll b');
    if (value) value.textContent = answer || '？';
    const submit = document.querySelector('#ninja-submit');
    if (submit) submit.disabled = !answer;
  }

  function submitAnswer() {
    if (!answer || !timerActive || locked) return;
    resolveQuestion(Number(answer), Date.now() - questionStartedAt, false);
  }

  function handleTimeout(limit) {
    if (locked) return;
    resolveQuestion(null, limit, true);
  }

  function resolveQuestion(value, responseTimeMs, timedOut) {
    locked = true; stopTimers();
    const q = session.currentQuestion;
    const result = answerNinjaQuestion(session, value, responseTimeMs, { timedOut });
    session = result.state; save.ninja.mastery = session.masteryById; persist();
    const mood = result.feedback.correct ? 'correct' : timedOut ? 'timeout' : 'wrong';
    const technique = TECHNIQUES[(session.attempts.length - 1) % TECHNIQUES.length];
    const message = result.feedback.correct ? `${technique}の じゅつ！ せいかい！` : timedOut ? `まきものが とじた！ ${q.answer} だよ` : `おしい！ ${q.answer} だよ`;
    playEffect(result.feedback.correct ? 'correct' : 'try-again', save.effects);
    renderFeedback(q, message, mood, technique);
    if (session.completed) {
      readingFallback = setTimeout(() => { if (session?.completed) finishMission(); }, result.feedback.correct ? 900 : 1300);
      return;
    }
    readingFallback = setTimeout(() => { if (session?.currentQuestion) beginQuestion(); }, result.feedback.correct ? 900 : 1300);
  }

  function renderFeedback(q, message, mood, technique) {
    window.scrollTo(0, 0);
    const progress = getNinjaProgress(session);
    app.innerHTML = `<header class="ninja-game-header"><nav class="game-nav" aria-label="もどる"><button id="ninja-game-exit" class="nav-back">‹ ゲームいちらん</button><button id="ninja-quit" class="nav-home" aria-label="レベルをえらぶ">⌂</button></nav><strong>${LEVELS[levelIndex].icon} ${LEVELS[levelIndex].name}</strong><span>${progress.answered} / ${progress.total}</span></header>
      <section class="ninja-game-card" data-mood="${mood}"><div class="ninja-result-scene"><span>🥷</span><b>${mood === 'correct' ? technique.split(' ')[0] : '💨'}</b></div><div class="ninja-scroll"><small>${q.multiplicand} × ${q.multiplier}</small><h1>${q.multiplicand}<span>×</span>${q.multiplier}<span>＝</span><b>${q.answer}</b></h1></div><p class="ninja-message" role="status">${message}</p></section>`;
    document.querySelector('#ninja-game-exit').addEventListener('click', onExit);
    document.querySelector('#ninja-quit').addEventListener('click', renderHome);
  }

  function finishMission() {
    window.scrollTo(0, 0);
    const progress = getNinjaProgress(session);
    save.ninja.completedLevel = Math.max(save.ninja.completedLevel, levelIndex);
    save.ninja.missions += 1;
    save.ninja.best[LEVELS[levelIndex].id] = Math.max(save.ninja.best[LEVELS[levelIndex].id] || 0, progress.correct);
    persist();
    app.innerHTML = `<nav class="game-nav" aria-label="もどる"><button id="ninja-finish-exit" class="nav-back">‹ ゲームいちらん</button><button id="ninja-finish-levels" class="nav-home" aria-label="レベルをえらぶ">⌂</button></nav><section class="ninja-finish"><div>🥷📜✨</div><p class="eyebrow">しゅぎょう おわり！</p><h1>${progress.correct} / ${progress.total} せいかい</h1><p>${TECHNIQUES.slice(0, Math.min(4, progress.correct)).join('　')}</p><div><button id="ninja-again">もういちど</button><button id="ninja-next">${levelIndex < 3 ? 'つぎの しゅぎょう' : 'レベルを えらぶ'}</button></div></section>`;
    document.querySelector('#ninja-finish-exit').addEventListener('click', onExit);
    document.querySelector('#ninja-finish-levels').addEventListener('click', renderHome);
    document.querySelector('#ninja-again').addEventListener('click', () => startMission(levelIndex));
    document.querySelector('#ninja-next').addEventListener('click', () => levelIndex < 3 ? startMission(levelIndex + 1) : renderHome());
  }

  renderHome();
}
