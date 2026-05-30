/* ═══════════════════════════════════════════════════════════════
   GAME SELECTOR + HELP
═══════════════════════════════════════════════════════════════ */
function openSelector() {
  const list = document.getElementById('pack-list');
  list.innerHTML = '';
  GAME_PACKS.forEach((pack, idx) => {
    const isActive = (idx === currentPackIdx);
    const block = document.createElement('div');
    block.className = 'pack-block';

    const item = document.createElement('div');
    item.className = 'pack-item' + (isActive ? ' active-pack' : '');
    item.innerHTML = `
      <div class="pack-icon">${pack.icon}</div>
      <div class="pack-info">
        <div class="pack-name">${pack.nameCN} &nbsp; ${pack.name}</div>
        <div class="pack-desc">${pack.desc}</div>
        <div class="pack-levels">${pack.levels.length} level${pack.levels.length > 1 ? 's' : ''} &nbsp;·&nbsp;
          ${pack.levels.reduce((s, l) => s + (l.pairs ? l.pairs.length : (l.items ? l.items.length : 0)), 0)} ${pack.type === 'display' ? 'items' : 'pairs'} total</div>
        <div class="pack-expand-hint">Tap to choose a level ▾</div>
      </div>`;

    const grid = document.createElement('div');
    grid.className = 'level-chip-grid' + (isActive ? ' open' : '');
    pack.levels.forEach((lvl, lvlIdx) => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'level-chip'
        + (isActive && lvlIdx === currentLevel ? ' active-level' : '');
      const stars = (lvl.shortLabel.match(/⭐/g) || []).length;
      const starStr = '⭐'.repeat(Math.min(stars, 5)) + (stars > 5 ? `×${stars}` : '');
      const cnt = lvl.pairs ? lvl.pairs.length : (lvl.items ? lvl.items.length : 0);
      const cntLabel = lvl.pairs ? 'pairs' : 'items';
      chip.innerHTML = `
        <span class="chip-stars">${starStr || '⭐'}</span>
        <span class="chip-name">Level ${lvl.id} · ${cnt} ${cntLabel}</span>`;
      chip.addEventListener('click', (e) => {
        e.stopPropagation();
        loadPack(idx, lvlIdx);
      });
      grid.appendChild(chip);
    });

    item.addEventListener('click', () => {
      // Toggle this pack's level grid; close others
      const wasOpen = grid.classList.contains('open');
      document.querySelectorAll('.level-chip-grid').forEach(g => g.classList.remove('open'));
      if (!wasOpen) grid.classList.add('open');
    });

    block.appendChild(item);
    block.appendChild(grid);
    list.appendChild(block);
  });
  document.getElementById('selector-overlay').classList.add('show');
}

function closeSelector() {
  document.getElementById('selector-overlay').classList.remove('show');
}

function loadPack(idx, levelIdx = 0) {
  // Stop any in-progress radical animation/sound from a previous pack
  radicalLoopActive = false;
  radicalWriter = null;
  currentPackIdx = idx;
  const pack = GAME_PACKS[idx];
  currentLevel   = Math.max(0, Math.min(levelIdx, pack.levels.length - 1));
  closeSelector();
  buildRound();
}

function toggleCelebration() {
  celebrationOn = !celebrationOn;
  document.getElementById('celeb-track').classList.toggle('on', celebrationOn);
  const m = document.getElementById('celeb-track-m');
  if (m) m.classList.toggle('on', celebrationOn);
}

/* ── Hamburger dropdown (mobile) ── */
function toggleMenu(e) {
  if (e) e.stopPropagation();
  const dd = document.getElementById('menu-dropdown');
  const btn = document.getElementById('menu-btn');
  if (!dd) return;
  const willOpen = !dd.classList.contains('open');
  dd.classList.toggle('open', willOpen);
  if (btn) btn.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
  if (willOpen) {
    setTimeout(() => {
      document.addEventListener('pointerdown', _menuOutsideClose, { once: true, capture: true });
    }, 0);
  }
}
function closeMenu() {
  const dd = document.getElementById('menu-dropdown');
  const btn = document.getElementById('menu-btn');
  if (dd) dd.classList.remove('open');
  if (btn) btn.setAttribute('aria-expanded', 'false');
}
function _menuOutsideClose(e) {
  const wrap = e.target.closest && e.target.closest('.menu-wrap');
  if (!wrap) closeMenu();
  else document.addEventListener('pointerdown', _menuOutsideClose, { once: true, capture: true });
}

function toggleHelp() {
  alert(
    '📖 HOW TO PLAY\n\n' +
    '1. Tap / click an item on the LEFT side.\n' +
    '2. Drag (or tap) to its matching item on the RIGHT.\n' +
    '3. A green line = correct match ✅\n' +
    '   A red flash  = wrong pair ❌\n' +
    '4. Match all pairs to finish the round!\n' +
    '5. Use "Switch Game" to choose a different category.\n\n' +
    '玩法说明：\n' +
    '点击左侧选项，拖线连到右侧对应答案。\n' +
    '绿线表示正确，红色闪烁表示错误。\n' +
    '全部连对即可过关！\n' +
    '点击"Switch Game"切换不同练习主题。'
  );
}
