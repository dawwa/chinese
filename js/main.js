/* ═══════════════════════════════════════════════════════════════
   ROUND ORCHESTRATOR + NAVIGATION + INIT
═══════════════════════════════════════════════════════════════ */
function buildRound() {
  const pack  = GAME_PACKS[currentPackIdx];
  const level = pack.levels[currentLevel];

  // Display-mode pack (e.g., radicals): swap UI and short-circuit matching logic
  if (pack.type === 'display') {
    document.getElementById('columns').style.display = 'none';
    document.getElementById('line-canvas').style.display = 'none';
    document.getElementById('radical-stage').classList.add('show');
    document.getElementById('level-complete-bar').style.display = 'none';
    radicalItems = level.items || [];
    radicalIdx   = 0;
    renderRadical();
    updateLevelBadge();
    updateAttribution();
    const roundInfo = document.getElementById('round-info');
    if (roundInfo) roundInfo.style.display = 'none';
    return;
  }

  // Matching-mode (default): restore normal UI
  document.getElementById('columns').style.display = '';
  document.getElementById('line-canvas').style.display = '';
  document.getElementById('radical-stage').classList.remove('show');
  const roundInfo = document.getElementById('round-info');
  if (roundInfo) roundInfo.style.display = '';

  currentPairs = level.pairs;
  leftOrder    = shuffle([...Array(currentPairs.length).keys()]);
  rightOrder   = shuffle([...Array(currentPairs.length).keys()]);
  connections  = {};
  wrongPairs   = new Set();
  levelWrong   = 0;
  selectedLeft  = null;
  selectedRight = null;
  drawingLine   = null;
  matchStartTime = null;
  levelStartTime = 0;
  levelCoins     = 0;
  document.getElementById('level-complete-bar').style.display = 'none';
  const clk = document.getElementById('clock-display');
  if (clk) { clk.textContent = '0s'; clk.classList.remove('ticking'); clk.classList.add('muted'); }
  renderColumns();
  clearSVG();
  updateLevelBadge();
  updateRoundInfo();
  updateScoreboard();
  updateAttribution();
}

/* ── Scoreboard / header info ── */
function updateScoreboard() {
  const matched = Object.keys(connections).length;
  document.getElementById('score-correct').textContent = matched;
  document.getElementById('score-total').textContent   = currentPairs.length;
  document.getElementById('score-wrong').textContent   = levelWrong;

  const pack        = GAME_PACKS[currentPackIdx];
  if (pack.type === 'display') {
    document.getElementById('progress-bar').style.width = '0%';
    return;
  }
  const totalPairs  = pack.levels.reduce((s, l) => s + (l.pairs ? l.pairs.length : 0), 0);
  const doneBefore  = pack.levels.slice(0, currentLevel).reduce((s, l) => s + (l.pairs ? l.pairs.length : 0), 0);
  const pct         = totalPairs ? Math.round((doneBefore + matched) / totalPairs * 100) : 0;
  document.getElementById('progress-bar').style.width = pct + '%';
}

function updateLevelBadge() {
  const pack  = GAME_PACKS[currentPackIdx];
  const lv    = pack.levels[currentLevel];
  const total = pack.levels.length;
  const badge = document.getElementById('level-badge');
  badge.textContent = `${lv.shortLabel} of ${total}`;
  badge.className   = `level-badge ${lv.cls}`;
}

function updateRoundInfo() {
  const lv  = GAME_PACKS[currentPackIdx].levels[currentLevel];
  document.getElementById('round-info').textContent =
    `${lv.label} — match all ${currentPairs.length} pairs to advance`;
}

function updateAttribution() {
  const pack   = GAME_PACKS[currentPackIdx];
  const footer = document.getElementById('attr-img');
  footer.style.display = pack.attribution ? 'block' : 'none';
  if (pack.attribution) footer.innerHTML = pack.attribution;

  document.getElementById('app-title').textContent =
    `${pack.icon} ${pack.nameCN} — ${pack.name}`;
}

/* ── Navigation ── */
function nextLevel() {
  document.getElementById('complete-overlay').classList.remove('show');
  currentLevel++;
  const pack = GAME_PACKS[currentPackIdx];
  if (currentLevel >= pack.levels.length) { resetAll(); return; }
  buildRound();
}

function retryLevel() {
  clearSVG();
  leftOrder    = shuffle([...Array(currentPairs.length).keys()]);
  rightOrder   = shuffle([...Array(currentPairs.length).keys()]);
  connections  = {};
  wrongPairs   = new Set();
  levelWrong   = 0;
  selectedLeft  = null;
  selectedRight = null;
  matchStartTime = null;
  levelStartTime = 0;
  levelCoins     = 0;
  document.getElementById('level-complete-bar').style.display = 'none';
  const clk = document.getElementById('clock-display');
  if (clk) { clk.textContent = '0s'; clk.classList.remove('ticking'); clk.classList.add('muted'); }
  renderColumns();
  updateRoundInfo();
  updateScoreboard();
}

function resetAll() {
  document.getElementById('complete-overlay').classList.remove('show');
  stopTick();
  currentLevel = 0;
  levelWrong   = 0;
  buildRound();
}

/* ── Resize: redraw matched connector lines ── */
window.addEventListener('resize', () => {
  clearSVG();
  Object.entries(connections).forEach(([leftPairIdx, rightPairIdx]) => {
    const ld = document.getElementById(`dot-left-${leftPairIdx}`);
    const rd = document.getElementById(`dot-right-${rightPairIdx}`);
    if (ld && rd) {
      const line = makeLine('line-correct');
      setLinePath(line, ...Object.values(getDotCenter(ld)), ...Object.values(getDotCenter(rd)));
    }
  });
});

/* ── Init ── */
document.getElementById('score-coin-icon').textContent = isIOS ? '⭐' : '🪙';
document.getElementById('clock-display').addEventListener('click', toggleTickMute);
buildRound();
