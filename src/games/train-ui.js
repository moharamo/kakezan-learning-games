import { answerTrainQuestion, buildTrainChoices, createTrainSession, getTrainProgress, TRAIN_LEVELS } from './train-session.js';
import { trackEvent, trackPageView } from '../analytics.js';

const LEVELS = [
  { id: 'egg', icon: '🥚', name: 'たまご', note: '2つの だんを まぜる' },
  { id: 'chick', icon: '🐣', name: 'ひよこ', note: '3つの だんを まぜる' },
  { id: 'hen', icon: '🐔', name: 'にわとり', note: '5つの だんを まぜる' },
  { id: 'star', icon: '⭐', name: 'チャレンジ', note: '9つの だんを ぜんぶ まぜる' },
];

export function mountTrainGame({ app, save, persist, playEffect, getReading, speak, onExit }) {
  save.train ??= { completedLevel: -1, journeys: 0, mastery: {} };
  let levelIndex = 0;
  let selectedTables = [];
  let session = null;
  let locked = false;
  let choices = [];
  let questionStartedAt = 0;

  function renderHome() {
    window.scrollTo(0, 0);
    session = null;
    app.innerHTML = `<header class="train-header"><button id="train-exit" class="nav-back" aria-label="ゲームいちらんへ もどる">‹ ゲームいちらん</button><div><p class="eyebrow">まぜて はしる</p><h1>🚂 九九れっしゃ</h1></div></header>
      <section class="train-welcome"><div aria-hidden="true">🚂🚃🚃</div><h2>九九の えきを めぐろう！</h2><p>いろいろな だんを まぜて、こたえるたびに つぎの えきへ。</p></section>
      <div class="train-levels">${LEVELS.map((level, index) => `<button data-train-level="${index}"><span>${level.icon}</span><span><strong>${level.name}</strong><small>${level.note}</small></span><em>しゅっぱつ ▶</em></button>`).join('')}</div>`;
    document.querySelector('#train-exit').addEventListener('click', onExit);
    document.querySelectorAll('[data-train-level]').forEach((button) => button.addEventListener('click', () => { const idx = Number(button.dataset.trainLevel); trackEvent('game_open', { game: 'train', level: LEVELS[idx].id }); trackPageView('/train/' + LEVELS[idx].id, `九九れっしゃ ${LEVELS[idx].name}`); chooseTables(idx); }));
  }

  function chooseTables(index) {
    levelIndex = index;
    const level = LEVELS[index];
    const needed = TRAIN_LEVELS[level.id].tables;
    if (needed >= 9) {
      selectedTables = Array.from({ length: 9 }, (_, table) => table + 1);
      startJourney();
      return;
    }
    window.scrollTo(0, 0);
    selectedTables = [];
    const availableTables = Array.from({ length: 9 }, (_, index) => index + 1);
    app.innerHTML = `<header class="train-header"><nav class="game-nav" aria-label="もどる"><button id="train-exit" class="nav-back">‹ ゲームいちらん</button><button id="train-back" class="nav-home" aria-label="レベルをえらぶ">⌂</button></nav><div><p class="eyebrow">${level.icon} ${level.name}</p><h1>のる だんを えらぼう</h1></div></header>
      <section class="ticket-card"><span>🎫</span><div><strong><b id="train-selected-count">0</b> / ${needed} えらんでね</strong><small>えらんだ だんが、ばらばらに でるよ</small></div></section>
      <div class="train-table-grid">${availableTables.map((table) => `<button data-train-table="${table}"><span>🚉</span><strong>${table}のだん</strong></button>`).join('')}</div>
      <button class="train-depart" id="train-depart" disabled>🚂 しゅっぱつ！</button>`;
    document.querySelector('#train-exit').addEventListener('click', onExit);
    document.querySelector('#train-back').addEventListener('click', renderHome);
    document.querySelectorAll('[data-train-table]').forEach((button) => button.addEventListener('click', () => {
      const table = Number(button.dataset.trainTable);
      if (selectedTables.includes(table)) selectedTables = selectedTables.filter((item) => item !== table);
      else if (selectedTables.length < needed) selectedTables.push(table);
      button.classList.toggle('selected', selectedTables.includes(table));
      document.querySelector('#train-selected-count').textContent = selectedTables.length;
      document.querySelector('#train-depart').disabled = selectedTables.length !== needed;
      playEffect('tap', save.effects);
    }));
    document.querySelector('#train-depart').addEventListener('click', startJourney);
  }

  function startJourney() {
    session = createTrainSession(selectedTables, LEVELS[levelIndex].id, { masteryById: save.train.mastery });
    locked = false;
    choices = buildTrainChoices(session.currentQuestion);
    questionStartedAt = Date.now();
    renderQuestion();
    setTimeout(readQuestion, 350);
  }

  function readQuestion() {
    if (!session?.currentQuestion) return;
    const reading = getReading(session.currentQuestion);
    speak(reading?.standard.prompt || `${session.currentQuestion.multiplicand} かける ${session.currentQuestion.multiplier}`);
  }

  function renderQuestion(message = 'せいかいの せんろを えらぼう！', mood = 'ready') {
    window.scrollTo(0, 0);
    const q = session.currentQuestion;
    const progress = getTrainProgress(session);
    app.innerHTML = `<header class="train-game-header compact-game-header"><nav class="game-nav" aria-label="もどる"><button id="train-game-exit" class="nav-back" aria-label="ゲームいちらんへもどる">‹ いちらん</button><button id="train-quit" class="nav-home" aria-label="レベルをえらぶ">⌂</button></nav><strong>${LEVELS[levelIndex].icon} ${selectedTables.join('・')}のだん</strong><span>${progress.answered + 1} / ${progress.total}</span></header>
      <section class="train-game-card" data-mood="${mood}">
        <div class="rail-progress"><i style="width:${progress.percent}%"></i>${Array.from({ length: 5 }, (_, index) => `<span style="left:${index * 24 + 2}%">${index * 25 <= progress.percent ? '🚉' : '·'}</span>`).join('')}</div>
        <h1 class="train-equation">${q.multiplicand}<small>×</small>${q.multiplier}<small>＝</small><b>？</b></h1>
        <button class="train-listen" id="train-listen">🔊 もんだいを きく</button>
        <p class="train-message" role="status">${message}</p>
        <div class="train-branch-scene">
          <span class="branch-sky" aria-hidden="true">☁️　　☀️　　☁️</span>
          <div class="branch-choices">${choices.map((choice, index) => `<button data-train-choice="${choice}" aria-label="${choice}の せんろ"><span>${['🌲','🎁','🌈'][index]}</span><strong>${choice}</strong></button>`).join('')}</div>
          <div class="branch-rails" aria-hidden="true"><i></i><i></i><i></i></div>
          <span class="branch-train" aria-hidden="true">🚂🚃</span>
        </div>
      </section>`;
    document.querySelector('#train-game-exit').addEventListener('click', onExit);
    document.querySelector('#train-quit').addEventListener('click', renderHome);
    document.querySelector('#train-listen').addEventListener('click', readQuestion);
    document.querySelectorAll('[data-train-choice]').forEach((button) => button.addEventListener('click', () => chooseTrack(Number(button.dataset.trainChoice), button)));
  }

  function chooseTrack(value, button) {
    if (locked) return;
    if (value !== session.currentQuestion.answer) {
      locked = true;
      button.classList.add('wrong-track');
      document.querySelector('.branch-train')?.classList.add('turn-back');
      playEffect('try-again', save.effects);
      document.querySelector('.train-message').textContent = `${value}の みちは ちがうみたい。もどって もういちど！`;
      setTimeout(() => {
        if (!session?.currentQuestion) return;
        locked = false;
        renderQuestion('べつの せんろを えらんでみよう', 'wrong');
      }, 900);
      return;
    }
    const track = [...button.parentElement.children].indexOf(button);
    locked = true;
    button.classList.add('right-track');
    document.querySelector('.branch-train')?.classList.add(`take-track-${track}`);
    playEffect('correct', save.effects);
    setTimeout(() => submitAnswer(value, `${value}の せんろへ しゅっぱつ！`), 600);
  }

  function submitAnswer(value, heard) {
    const result = answerTrainQuestion(session, value, Date.now() - questionStartedAt);
    session = result.state; save.train.mastery = session.masteryById; persist();
    const message = `${heard}　せいかい！ つぎの ぶんきへ！`;
    if (session.completed) { setTimeout(() => finishJourney(message), 700); return; }
    renderQuestion(message, 'correct');
    setTimeout(() => {
      if (!session?.currentQuestion) return;
      locked = false;
      choices = buildTrainChoices(session.currentQuestion);
      questionStartedAt = Date.now();
      renderQuestion();
      setTimeout(readQuestion, 250);
    }, 950);
  }

  function finishJourney(lastMessage) {
    window.scrollTo(0, 0);
    const progress = getTrainProgress(session);
    // analytics: train complete
    try { trackEvent('game_complete', { game: 'train', level: LEVELS[levelIndex].id, correct: progress.correct, total: progress.total }); } catch (e) { console.debug('analytics error', e); }
    save.train.completedLevel = Math.max(save.train.completedLevel, levelIndex);
    save.train.journeys += 1; persist();
    app.innerHTML = `<nav class="game-nav" aria-label="もどる"><button id="train-finish-exit" class="nav-back">‹ ゲームいちらん</button><button id="train-home" class="nav-home" aria-label="レベルをえらぶ">⌂</button></nav><section class="train-finish"><div>🚂🎉🚉</div><p class="eyebrow">しゅうてんに とうちゃく！</p><h1>${progress.total}この えきを まわれたよ</h1><p>${lastMessage}</p><p>${progress.correct}もん せいかい！</p><div><button id="train-again">もういちど</button></div></section>`;
    document.querySelector('#train-finish-exit').addEventListener('click', onExit);
    document.querySelector('#train-again').addEventListener('click', startJourney);
    document.querySelector('#train-home').addEventListener('click', renderHome);
  }

  renderHome();
}
