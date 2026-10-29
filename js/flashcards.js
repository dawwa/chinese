/* ═══════════════════════════════════════════════════════════════
   FLASH CARD ENGINE — 生字字卡 (pack type 'flashcard')
   One round = one deck: a textbook unit, a whole book, the ⭐ review
   list, or last round's misses. Cards marked 再练 come back a few
   cards later until known; each miss gives the character a ⭐ that is
   saved on this device and builds the review list (生字本).
═══════════════════════════════════════════════════════════════ */
const FC_STORE_KEY = 'hanziFlash.v1';
const fcStore = (() => {
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(FC_STORE_KEY)) || {}; } catch (e) {}
  return {
    stars:     saved.stars || {},
    lastLevel: saved.lastLevel || 0,
    settings:  Object.assign({ pinyin: 'tap', mode: 'read', shuffle: true }, saved.settings),
  };
})();

function fcSave() {
  try { localStorage.setItem(FC_STORE_KEY, JSON.stringify(fcStore)); } catch (e) {}
}

let fcSpecialDeck = null;  // { title, cards } replaces the unit deck; set by loadPack()
let fcCards       = [];    // this round's cards: [char, pinyin, words]
let fcQueue       = [];    // indices into fcCards still to answer
let fcState       = [];    // per card: '' | 'again' | 'known' (first try) | 'learned' (after practice)
let fcShownIdx    = -1;    // card on screen (stays put while a 选拼音 answer is shown)
let fcUndoStack   = [];
let fcChoice      = null;  // { answer, options } for the card on screen
let fcLocked      = false; // 选拼音 answer revealed, waiting for the next card
let fcStartTime   = 0;
let fcPinyinShown = false;
let fcWordsShown  = false;
let fcPinyinTimer = null;
let fcNextTimer   = null;
let fcSyllables   = null;  // every reading in the data, for 选拼音 distractors

const fcReadings = card => card[1].split(', ');
const fcIsChoice = () => fcStore.settings.mode === 'choice';

/* ── Decks ── */
function fcBookDeck(bookIdx) {
  const book = HANZI_BOOKS[bookIdx];
  return { title: `📚 ${book.name} 整册`, cards: book.units.flat() };
}

// Most-missed first; each character uses the grade where it was first taught
function fcReviewDeck() {
  const first = new Map();
  HANZI_BOOKS.forEach(b => b.units.forEach(u => u.forEach(c => { if (!first.has(c[0])) first.set(c[0], c); })));
  const chars = Object.keys(fcStore.stars).filter(ch => first.has(ch));
  chars.sort((a, b) => fcStore.stars[b] - fcStore.stars[a]);
  return { title: '⭐ 生字本', cards: chars.map(ch => first.get(ch)) };
}

/* ── Round lifecycle ── */
function fcStartRound() {
  fcStop();
  const lv = PACK_HANZI.levels[currentLevel];
  const deck = fcSpecialDeck || { title: lv.shortLabel, cards: lv.cards };
  if (!fcSpecialDeck) { fcStore.lastLevel = currentLevel; fcSave(); }
  fcCards = deck.cards;
  const order = [...fcCards.keys()];
  fcQueue = fcStore.settings.shuffle ? shuffle(order) : order;
  fcState = fcCards.map(() => '');
  fcUndoStack = [];
  fcStartTime = 0;
  document.getElementById('level-complete-bar').style.display = 'none';
  const clk = document.getElementById('clock-display');
  if (clk) { clk.textContent = '0s'; clk.classList.remove('ticking'); clk.classList.add('muted'); }
  const info = document.getElementById('round-info');
  info.style.display = '';
  info.textContent = `${deck.title} — ${fcCards.length} 个生字：先读一读，再看拼音和组词`;
  updateLevelBadge();
  fcSyncToolbar();
  fcRender();
}

function fcRestart() {
  document.getElementById('complete-overlay').classList.remove('show');
  stopTick();
  fcStartRound();
}

function fcStop() {
  clearTimeout(fcPinyinTimer);
  clearTimeout(fcNextTimer);
  fcLocked = false;
  if ('speechSynthesis' in window) speechSynthesis.cancel();
}

function fcBeginClock() {
  if (fcStartTime) return;
  fcStartTime = Date.now();
  startTick();
}

/* ── Card rendering ── */
function fcRender() {
  clearTimeout(fcNextTimer);
  fcLocked = false;
  fcShownIdx = fcQueue[0];
  const card = fcCards[fcShownIdx];
  if (!card) return;
  const [ch, pinyin, words] = card;
  document.getElementById('fc-char').textContent = ch;
  document.getElementById('fc-pinyin-text').textContent = pinyin;
  document.getElementById('fc-words-list').replaceChildren(...words.split(' ').filter(Boolean).map(w => {
    const span = document.createElement('span');
    span.className = 'flash-word';
    span.textContent = w;
    return span;
  }));
  document.getElementById('fc-stars').textContent = '⭐'.repeat(fcStore.stars[ch] || 0);
  document.getElementById('fc-left').textContent = `还剩 ${fcQueue.length} 张`;
  document.getElementById('fc-undo').disabled = !fcUndoStack.length;
  fcShowWords(false);
  fcApplyPinyinSetting();
  const choice = fcIsChoice();
  document.getElementById('fc-answer-read').style.display = choice ? 'none' : '';
  document.getElementById('fc-answer-choice').style.display = choice ? '' : 'none';
  if (choice) fcRenderChoices(card);
  fcRenderStrip();
  fcUpdateScore();
  const el = document.getElementById('flash-card');
  el.classList.remove('fc-in');
  void el.offsetWidth;
  el.classList.add('fc-in');
}

function fcShowPinyin(show) {
  fcPinyinShown = show;
  document.getElementById('fc-pinyin').classList.toggle('hidden', !show);
  document.getElementById('fc-pinyin-btn').textContent = show ? '👀' : '🙈';
}

function fcApplyPinyinSetting() {
  clearTimeout(fcPinyinTimer);
  const bar = document.getElementById('fc-pinyin-timer');
  bar.style.animation = 'none';
  const setting = fcStore.settings.pinyin;
  fcShowPinyin(!fcIsChoice() && setting === 'show');
  if (fcIsChoice() || !/^\d+$/.test(setting)) return;
  void bar.offsetWidth;
  bar.style.animation = `fcPinyinTimer ${setting}ms linear forwards`;
  fcPinyinTimer = setTimeout(() => fcShowPinyin(true), +setting);
}

function fcTogglePinyin() {
  if (fcIsChoice() && !fcLocked) return;   // would give the answer away
  clearTimeout(fcPinyinTimer);
  document.getElementById('fc-pinyin-timer').style.animation = 'none';
  fcShowPinyin(!fcPinyinShown);
}

function fcShowWords(show) {
  fcWordsShown = show;
  document.getElementById('fc-words').classList.toggle('hidden', !show);
  document.getElementById('fc-words-btn').textContent = show ? '👀' : '🙈';
}

function fcToggleWords() { fcShowWords(!fcWordsShown); }

function fcRenderStrip() {
  const strip = document.getElementById('fc-strip');
  if (fcCards.length > 40) { strip.replaceChildren(); return; }
  strip.replaceChildren(...fcCards.map((c, i) => {
    const chip = document.createElement('span');
    chip.className = `fc-chip ${fcState[i]}` + (i === fcShownIdx ? ' current' : '');
    chip.textContent = c[0];
    return chip;
  }));
}

function fcUpdateScore() {
  const done = fcState.filter(s => s === 'known' || s === 'learned').length;
  document.getElementById('score-correct').textContent = done;
  document.getElementById('score-total').textContent = fcCards.length;
  document.getElementById('score-wrong').textContent = fcState.filter(s => s === 'again' || s === 'learned').length;
  document.getElementById('progress-bar').style.width = (fcCards.length ? Math.round(done / fcCards.length * 100) : 0) + '%';
}

/* ── Read aloud ── */
function fcSpeak() {
  const card = fcCards[fcShownIdx];
  if (!card || !('speechSynthesis' in window)) return;
  if (fcIsChoice() && !fcLocked) return;   // would give the answer away
  fcSay(card);
}

function fcSay(card) {
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance([card[0], ...card[2].split(' ').filter(Boolean)].join('，'));
  u.lang = 'zh-CN';
  u.rate = 0.8;
  const voices = speechSynthesis.getVoices();
  u.voice = voices.find(v => /^zh[-_]CN/i.test(v.lang)) || voices.find(v => /^zh/i.test(v.lang)) || null;
  speechSynthesis.speak(u);
}

/* ── Answering ── */
function fcSetStars(ch, n) {
  if (n > 0) fcStore.stars[ch] = n; else delete fcStore.stars[ch];
  fcSave();
}

const fcAdjustStars = (ch, d) => fcSetStars(ch, Math.max(0, Math.min(5, (fcStore.stars[ch] || 0) + d)));

function fcMark(i, known) {
  const ch = fcCards[i][0];
  fcQueue.shift();
  if (known) {
    if (fcState[i] === 'again') fcState[i] = 'learned';
    else { fcState[i] = 'known'; fcAdjustStars(ch, -1); }
  } else {
    if (fcState[i] !== 'again') fcAdjustStars(ch, +1);
    fcState[i] = 'again';
    fcQueue.splice(Math.min(3, fcQueue.length), 0, i);
  }
}

function fcAnswer(known) {
  if (fcIsChoice() || fcLocked || !fcQueue.length) return;
  fcBeginClock();
  const i = fcQueue[0];
  const ch = fcCards[i][0];
  fcUndoStack.push({ queue: [...fcQueue], state: [...fcState], ch, stars: fcStore.stars[ch] || 0 });
  fcMark(i, known);
  if (known) { playCorrect(); fcCelebrate(); } else playStrokeBrush(0);
  fcAdvance();
}

function fcUndo() {
  if (fcIsChoice() || fcLocked) return;
  const last = fcUndoStack.pop();
  if (!last) return;
  fcQueue = last.queue;
  fcState = last.state;
  fcSetStars(last.ch, last.stars);
  fcRender();
}

function fcAdvance() {
  if (fcQueue.length) { fcRender(); return; }
  fcRenderStrip();
  fcUpdateScore();
  fcComplete();
}

function fcCelebrate() {
  if (!celebrationOn) return;
  const r = document.getElementById('flash-card').getBoundingClientRect();
  const y = r.top + r.height / 2;
  spawnCoins(r.left + 24, y, r.right - 24, y);
}

/* ── 选拼音 (multiple choice) ── */
const fcToneless = py => py.normalize('NFD').replace(/[\u0300\u0301\u0304\u030c]/g, '').normalize('NFC');
const fcInitial  = base => (base.match(/^(zh|ch|sh|[bpmfdtnlgkhjqxrzcsyw])/) || [''])[0];

// Wrong options sound close: the same syllable in other tones first, then a shared initial or final
function fcPinyinOptions(card) {
  if (!fcSyllables) fcSyllables = [...new Set(HANZI_BOOKS.flatMap(b => b.units.flat().flatMap(c => fcReadings(c))))];
  const readings = fcReadings(card);
  const answer = readings[0];
  const base = fcToneless(answer);
  const ini = fcInitial(base);
  const fin = base.slice(ini.length);
  const pool = fcSyllables.filter(s => !readings.includes(s));
  const sameSound = shuffle(pool.filter(s => fcToneless(s) === base));
  const similar = shuffle(pool.filter(s => {
    const b = fcToneless(s);
    const i = fcInitial(b);
    return b !== base && (i === ini || b.slice(i.length) === fin);
  }));
  const wrong = sameSound.slice(0, 2);
  for (const s of [...similar, ...shuffle(pool)]) {
    if (wrong.length === 3) break;
    if (!wrong.includes(s)) wrong.push(s);
  }
  return { answer, options: shuffle([answer, ...wrong]) };
}

function fcRenderChoices(card) {
  fcChoice = fcPinyinOptions(card);
  document.getElementById('fc-answer-choice').replaceChildren(...fcChoice.options.map((py, k) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'flash-choice';
    b.textContent = py;
    b.dataset.key = k + 1;
    b.onclick = () => fcChoose(k);
    return b;
  }));
}

function fcChoose(k) {
  if (!fcIsChoice() || fcLocked || !fcQueue.length || !fcChoice || k >= fcChoice.options.length) return;
  fcBeginClock();
  fcLocked = true;
  const i = fcQueue[0];
  const right = fcChoice.options[k] === fcChoice.answer;
  const buttons = document.querySelectorAll('#fc-answer-choice .flash-choice');
  buttons.forEach((b, n) => {
    b.disabled = true;
    if (fcChoice.options[n] === fcChoice.answer) b.classList.add('correct');
  });
  fcShowPinyin(true);
  fcMark(i, right);
  if (right) {
    playCorrect();
    fcCelebrate();
  } else {
    buttons[k].classList.add('wrong');
    playWrong();
    if ('speechSynthesis' in window) fcSay(fcCards[i]);
  }
  fcUndoStack = [];
  fcRenderStrip();
  fcUpdateScore();
  fcNextTimer = setTimeout(fcAdvance, right ? 700 : 1800);
}

/* ── Round complete ── */
function fcComplete() {
  stopTick();
  const total = fcCards.length;
  const firstTry = fcState.filter(s => s === 'known').length;
  const missed = fcCards.filter((c, i) => fcState[i] === 'learned');
  const secs = ((Date.now() - fcStartTime) / 1000).toFixed(1);
  document.getElementById('co-emoji').textContent = missed.length ? '💪' : '🏆';
  document.getElementById('co-stars').textContent = missed.length === 0 ? '⭐⭐⭐' : missed.length <= 2 ? '⭐⭐' : '⭐';
  document.getElementById('co-title').textContent = missed.length ? '学会啦！Well done!' : '全部认识！Perfect!';
  document.getElementById('co-stats').textContent = `一次认识 ${firstTry} / ${total}  |  再练 ${missed.length}  |  ⏱ ${secs}s`;
  const bar = document.getElementById('level-complete-bar');
  bar.textContent = `📇 ${total} 个生字 · ⏱ ${secs}s`;
  bar.style.display = '';

  const btn = document.getElementById('co-btn');
  const lv = PACK_HANZI.levels[currentLevel];
  const next = PACK_HANZI.levels[currentLevel + 1];
  if (!fcSpecialDeck && next) {
    btn.textContent = next.book === lv.book ? `▶ ${next.unit}` : `▶ ${next.bookName} ${next.unit}`;
    btn.onclick = nextLevel;
  } else {
    btn.textContent = '🔄 再来一次';
    btn.onclick = fcRestart;
  }
  const alt = document.getElementById('co-btn-alt');
  alt.style.display = missed.length ? '' : 'none';
  alt.textContent = `🔁 再练错字 (${missed.length})`;
  alt.onclick = () => {
    fcSpecialDeck = { title: '🔁 错字再练', cards: missed };
    fcRestart();
  };
  document.getElementById('complete-overlay').classList.add('show');
  playComplete();
}

/* ── Toolbar settings (remembered on this device) ── */
function fcSyncToolbar() {
  const { mode, pinyin, shuffle: shuffled } = fcStore.settings;
  document.getElementById('fc-mode-read').classList.toggle('active', mode === 'read');
  document.getElementById('fc-mode-choice').classList.toggle('active', mode === 'choice');
  const select = document.getElementById('fc-pinyin-setting');
  select.value = pinyin;
  select.disabled = mode === 'choice';
  document.getElementById('fc-shuffle').classList.toggle('active', shuffled);
}

function fcSetMode(mode) {
  if (fcLocked || fcStore.settings.mode === mode) return;
  fcStore.settings.mode = mode;
  fcSave();
  fcSyncToolbar();
  fcUndoStack = [];
  if (fcQueue.length) fcRender();
}

function fcSetPinyinSetting(value) {
  fcStore.settings.pinyin = value;
  fcSave();
  fcApplyPinyinSetting();
}

function fcToggleShuffle() {
  fcStore.settings.shuffle = !fcStore.settings.shuffle;
  fcSave();
  fcSyncToolbar();
  if (fcState.every(s => !s)) fcStartRound();   // nothing answered yet: reorder now, else next round
}

/* ── Game selector: book → unit, plus whole-book and ⭐ review decks ── */
function fcPackSummary() {
  const total = HANZI_BOOKS.reduce((n, b) => n + b.units.flat().length, 0);
  return `${HANZI_BOOKS.length} 册 · ${PACK_HANZI.levels.length} 个单元 · ${total} 个生字`;
}

function fcBuildSelectorGrid(grid, packIdx) {
  const inPack = currentPackIdx === packIdx;
  const here = inPack ? currentLevel : fcStore.lastLevel;
  const select = document.createElement('select');
  select.className = 'fc-book-select';
  select.setAttribute('aria-label', '选择课本');
  HANZI_BOOKS.forEach((b, bi) => select.add(new Option(`📘 ${b.name}`, bi)));
  select.value = PACK_HANZI.levels[here] ? PACK_HANZI.levels[here].book : 0;

  const renderChips = () => {
    grid.querySelectorAll('.level-chip').forEach(c => c.remove());
    const bi = +select.value;
    PACK_HANZI.levels.forEach((lv, li) => {
      if (lv.book !== bi) return;
      grid.appendChild(fcSelectorChip(lv.unit, lv.cards.map(c => c[0]).join(''), `${lv.cards.length} 字`,
        inPack && !fcSpecialDeck && li === currentLevel, () => loadPack(packIdx, li)));
    });
    const book = fcBookDeck(bi);
    const firstUnit = PACK_HANZI.levels.findIndex(lv => lv.book === bi);
    grid.appendChild(fcSelectorChip('📚 整册复习', HANZI_BOOKS[bi].name, `${book.cards.length} 字`, false,
      () => loadPack(packIdx, firstUnit, book), 'chip-special'));
    const review = fcReviewDeck();
    grid.appendChild(fcSelectorChip('⭐ 生字本', review.cards.length ? review.cards.map(c => c[0]).join('') : '答错的字会放在这里',
      `${review.cards.length} 字`, false, review.cards.length ? () => loadPack(packIdx, here, review) : null, 'chip-special'));
  };
  select.addEventListener('change', renderChips);
  grid.appendChild(select);
  renderChips();
}

function fcSelectorChip(title, preview, count, active, onPick, extraCls = '') {
  const chip = document.createElement('button');
  chip.type = 'button';
  chip.className = `level-chip ${extraCls}` + (active ? ' active-level' : '');
  [['chip-stars', title], ['chip-preview', preview], ['chip-name', count]].forEach(([cls, text]) => {
    const span = document.createElement('span');
    span.className = cls;
    span.textContent = text;
    chip.appendChild(span);
  });
  if (onPick) chip.addEventListener('click', e => { e.stopPropagation(); onPick(); });
  else chip.disabled = true;
  return chip;
}

const FC_HELP =
  '📇 生字字卡 HOW TO USE\n\n' +
  '1. Read the big character aloud, then tap 拼音 to check (or let it appear after 1–5 s).\n' +
  '2. Tap 组词 to see words with it. 🔊 reads the character and its words.\n' +
  '3. Tap ✅ 认识 if you knew it, 🔁 再练 if not — that card comes back a few cards later.\n' +
  '4. 🔤 选拼音: pick the right pinyin from 4 choices.\n' +
  '5. Missed characters get a ⭐ and go into ⭐ 生字本 (saved on this device) for review.\n' +
  '6. Use "Switch Game" to pick a book and unit, the whole book, or 生字本.\n\n' +
  '⌨️ Space/P 拼音 · F 组词 · Enter 朗读 · →/D 认识 · ↓/S 再练 · ←/A 上一张 · 1–4 选拼音\n\n' +
  '玩法说明：\n' +
  '先大声读出生字，再点「拼音」检查；点「组词」看词语，🔊 听读音。\n' +
  '认识点 ✅，不认识点 🔁，这张卡过一会儿会再出现。\n' +
  '答错的字会加 ⭐，放进「生字本」方便复习。';

/* ── Keyboard shortcuts ── */
document.addEventListener('keydown', e => {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  if (!document.getElementById('flash-stage').classList.contains('show')) return;
  if (document.querySelector('.selector-overlay.show, .complete-overlay.show')) return;
  if (/^(SELECT|INPUT|TEXTAREA)$/.test(e.target.tagName)) return;
  const k = e.key.toLowerCase();
  const choice = fcIsChoice();
  if (k === ' ' || k === 'p') fcTogglePinyin();
  else if (k === 'f') fcToggleWords();
  else if (k === 'enter') fcSpeak();
  else if (!choice && (k === 'arrowright' || k === 'd')) fcAnswer(true);
  else if (!choice && (k === 'arrowdown' || k === 's')) fcAnswer(false);
  else if (!choice && (k === 'arrowleft' || k === 'a')) fcUndo();
  else if (choice && /^[1-4]$/.test(k)) fcChoose(+k - 1);
  else return;
  e.preventDefault();
});
