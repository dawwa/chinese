/* ═══════════════════════════════════════════════════════════════
   MATCHING ENGINE — 连线 game
   Renders left/right columns, handles drag + tap-tap interaction,
   draws SVG connector lines, validates pairs, and shows feedback.
═══════════════════════════════════════════════════════════════ */

/* ── Card renderer (generic: pinyin + chinese + image) ── */
function buildCardInner(cardData) {
  const parts = [];
  if (cardData.pinyin)               parts.push(`<div class="card-pinyin">${cardData.pinyin}</div>`);
  if (cardData.chinese && !cardData.img) parts.push(`<div class="card-chinese">${cardData.chinese}</div>`);
  if (cardData.img)                  parts.push(`<img class="card-img" src="${cardData.img}" alt="${cardData.chinese || ''}"
      onerror="this.outerHTML='<div class=\\'img-error\\'>图片加载失败</div>'" />`);
  return parts.join('');
}

function renderColumns() {
  const colL = document.getElementById('col-left');
  const colR = document.getElementById('col-right');
  colL.innerHTML = '';
  colR.innerHTML = '';

  leftOrder.forEach(pairIdx => {
    const pair = currentPairs[pairIdx];
    const card = document.createElement('div');
    card.className = 'match-card left-card';
    card.dataset.pairIdx = pairIdx;
    card.innerHTML = `
      <div class="card-row">
        <div class="card-content">${buildCardInner(pair.left)}</div>
        <div class="dot-right" id="dot-left-${pairIdx}"></div>
      </div>`;
    card.addEventListener('pointerdown', e => onLeftDown(e, pairIdx));
    colL.appendChild(card);
  });

  rightOrder.forEach(pairIdx => {
    const pair = currentPairs[pairIdx];
    const card = document.createElement('div');
    card.className = 'match-card right-card';
    card.dataset.pairIdx = pairIdx;
    card.innerHTML = `
      <div class="card-row">
        <div class="dot-left" id="dot-right-${pairIdx}"></div>
        <div class="card-content">${buildCardInner(pair.right)}</div>
      </div>`;
    card.addEventListener('pointerdown', e => onRightDown(e, pairIdx));
    colR.appendChild(card);
  });
}

/* ── SVG line helpers ── */
function clearSVG() { document.getElementById('line-canvas').innerHTML = ''; }

function makeLine(cls) {
  const svg  = document.getElementById('line-canvas');
  const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  line.setAttribute('class', `connector-line ${cls}`);
  svg.appendChild(line);
  return line;
}

function setLinePath(lineEl, x1, y1, x2, y2) {
  const mx = (x1 + x2) / 2;
  lineEl.setAttribute('d', `M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`);
}

function removeDrawingLine() {
  if (drawingLine) { drawingLine.remove(); drawingLine = null; }
}

/* ── Interaction: left card (drag or tap) ── */
function onLeftDown(e, pairIdx) {
  e.preventDefault();
  if (connections[pairIdx] !== undefined) return;

  // Complete a right→left tap-tap connection
  if (selectedRight !== null) {
    const rightPairIdx = selectedRight;
    clearRightSelection();
    removeDrawingLine();
    attemptConnect(pairIdx, rightPairIdx, pairIdx === rightPairIdx);
    return;
  }

  if (selectedLeft === pairIdx) { clearLeftSelection(); removeDrawingLine(); return; }

  clearLeftSelection();
  removeDrawingLine();

  selectedLeft  = pairIdx;
  matchStartTime = Date.now();
  if (!_tickStarted) startTick();
  document.querySelector(`.left-card[data-pair-idx="${pairIdx}"]`).classList.add('selected');

  const dot    = document.getElementById(`dot-left-${pairIdx}`);
  const origin = getDotCenter(dot);
  drawingLine  = makeLine('line-pending');
  setLinePath(drawingLine, origin.x, origin.y, origin.x, origin.y);

  const startX = e.clientX, startY = e.clientY;
  let isDrag = false;
  let rafId = null;
  let cachedWr = document.getElementById('game-wrapper').getBoundingClientRect();

  function onMove(ev) {
    if (!drawingLine) return;
    if (!isDrag && (Math.abs(ev.clientX - startX) > 8 || Math.abs(ev.clientY - startY) > 8)) isDrag = true;
    if (rafId) return;
    rafId = requestAnimationFrame(() => {
      rafId = null;
      if (drawingLine) setLinePath(drawingLine, origin.x, origin.y, ev.clientX - cachedWr.left, ev.clientY - cachedWr.top);
    });
  }

  function onUp(ev) {
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup',   onUp);
    if (rafId) { cancelAnimationFrame(rafId); rafId = null; }

    const el        = document.elementFromPoint(ev.clientX, ev.clientY);
    const rightCard = el && el.closest('.right-card');

    if (rightCard && selectedLeft !== null) {
      const rightPairIdx = parseInt(rightCard.dataset.pairIdx);
      if (connections[rightPairIdx] === undefined) {
        const leftPairIdx = selectedLeft;
        clearLeftSelection();
        removeDrawingLine();
        attemptConnect(leftPairIdx, rightPairIdx, leftPairIdx === rightPairIdx);
        return;
      }
    }

    removeDrawingLine();
    if (isDrag) clearLeftSelection();
  }

  window.addEventListener('pointermove', onMove, { passive: true });
  window.addEventListener('pointerup',   onUp);
}

/* ── Interaction: right card (tap-tap mode) ── */
function onRightDown(e, rightPairIdx) {
  e.preventDefault();
  if (connections[rightPairIdx] !== undefined) return;

  // Complete a left→right tap-tap connection
  if (selectedLeft !== null) {
    const leftPairIdx = selectedLeft;
    clearLeftSelection();
    removeDrawingLine();
    attemptConnect(leftPairIdx, rightPairIdx, leftPairIdx === rightPairIdx);
    return;
  }

  // Toggle right selection off
  if (selectedRight === rightPairIdx) { clearRightSelection(); removeDrawingLine(); return; }

  clearRightSelection();
  removeDrawingLine();

  selectedRight  = rightPairIdx;
  matchStartTime  = Date.now();
  if (!_tickStarted) startTick();
  document.querySelector(`.right-card[data-pair-idx="${rightPairIdx}"]`).classList.add('selected');

  const dot    = document.getElementById(`dot-right-${rightPairIdx}`);
  const origin = getDotCenter(dot);
  drawingLine  = makeLine('line-pending');
  setLinePath(drawingLine, origin.x, origin.y, origin.x, origin.y);

  const startX = e.clientX, startY = e.clientY;
  let isDrag = false;
  let rafId = null;
  let cachedWr = document.getElementById('game-wrapper').getBoundingClientRect();

  function onMove(ev) {
    if (!drawingLine) return;
    if (!isDrag && (Math.abs(ev.clientX - startX) > 8 || Math.abs(ev.clientY - startY) > 8)) isDrag = true;
    if (rafId) return;
    rafId = requestAnimationFrame(() => {
      rafId = null;
      if (drawingLine) setLinePath(drawingLine, ev.clientX - cachedWr.left, ev.clientY - cachedWr.top, origin.x, origin.y);
    });
  }

  function onUp(ev) {
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup',   onUp);
    if (rafId) { cancelAnimationFrame(rafId); rafId = null; }

    const el       = document.elementFromPoint(ev.clientX, ev.clientY);
    const leftCard = el && el.closest('.left-card');

    if (leftCard && selectedRight !== null) {
      const leftPairIdx = parseInt(leftCard.dataset.pairIdx);
      if (connections[leftPairIdx] === undefined) {
        const rPairIdx = selectedRight;
        clearRightSelection();
        removeDrawingLine();
        attemptConnect(leftPairIdx, rightPairIdx, leftPairIdx === rPairIdx);
        return;
      }
    }

    removeDrawingLine();
    if (isDrag) clearRightSelection();
  }

  window.addEventListener('pointermove', onMove, { passive: true });
  window.addEventListener('pointerup',   onUp);
}

function clearLeftSelection() {
  if (selectedLeft !== null) {
    const card = document.querySelector(`.left-card[data-pair-idx="${selectedLeft}"]`);
    if (card) card.classList.remove('selected');
    selectedLeft = null;
  }
}

function clearRightSelection() {
  if (selectedRight !== null) {
    const card = document.querySelector(`.right-card[data-pair-idx="${selectedRight}"]`);
    if (card) card.classList.remove('selected');
    selectedRight = null;
  }
}

/* ── Connection logic ── */
function attemptConnect(leftPairIdx, rightPairIdx, correct) {
  const leftDot  = document.getElementById(`dot-left-${leftPairIdx}`);
  const rightDot = document.getElementById(`dot-right-${rightPairIdx}`);
  const p1 = getDotCenter(leftDot);
  const p2 = getDotCenter(rightDot);
  const elapsedMs = matchStartTime ? Date.now() - matchStartTime : 0;
  matchStartTime  = null;

  if (correct) {
    connections[leftPairIdx] = rightPairIdx;
    levelCoins++;
    const line = makeLine('line-correct');
    setLinePath(line, p1.x, p1.y, p2.x, p2.y);
    // Spawn coins at screen midpoint of the connection
    if (celebrationOn) {
      const wr = document.getElementById('game-wrapper').getBoundingClientRect();
      const CELEB_POOL = ['🎉', '🥳', '😄', '😀', '😎', '🤩', '🙃', '😜'];
      const celebEmoji = CELEB_POOL[Math.floor(Math.random() * CELEB_POOL.length)];
      spawnCoins(wr.left + p1.x, wr.top + p1.y, wr.left + p2.x, wr.top + p2.y, celebEmoji);
    }
    document.querySelector(`.left-card[data-pair-idx="${leftPairIdx}"]`).classList.add('matched');
    document.querySelector(`.right-card[data-pair-idx="${rightPairIdx}"]`).classList.add('matched');
    showFeedback(true, currentPairs[leftPairIdx], elapsedMs);
    playCorrect();
    updateScoreboard();
    if (Object.keys(connections).length === currentPairs.length) setTimeout(showRoundComplete, 950);
  } else {
    levelWrong++;
    const key = `${leftPairIdx}-${rightPairIdx}`;
    if (!wrongPairs.has(key)) {
      wrongPairs.add(key);
      const line = makeLine('line-wrong');
      setLinePath(line, p1.x, p1.y, p2.x, p2.y);
      line.classList.add('line-flash');
      setTimeout(() => line.remove(), 900);
    }
    [['left-card', leftPairIdx], ['right-card', rightPairIdx]].forEach(([cls, idx]) => {
      const c = document.querySelector(`.${cls}[data-pair-idx="${idx}"]`);
      if (c) { c.classList.add('wrong'); setTimeout(() => c.classList.remove('wrong'), 400); }
    });
    showFeedback(false, null, 0);
    playWrong();
    updateScoreboard();
  }
}

/* ── Feedback popup ── */
function showFeedback(correct, pair = null, elapsedMs = 0) {
  clearTimeout(feedbackTimer);
  const fb = document.getElementById('feedback');

  const CORRECT_MSGS = [
    'Correct! 正确！', 'Nice! 好棒！', 'Great! 太棒！',
    'Perfect! 完美！', 'Awesome! 厉害！', 'Brilliant! 真聪明！'
  ];

  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  document.getElementById('fb-emoji').textContent = correct ? '' : '❌';
  document.getElementById('fb-msg').textContent   = correct ? pick(CORRECT_MSGS) : 'Try again! 再试试！';

  if (correct && pair) {
    const l = pair.left, r = pair.right;
    const imgSrc = l.img || r.img || null;
    const fbImg  = document.getElementById('fb-img');
    const fbName = document.getElementById('fb-name');
    const fbSubEl = document.getElementById('fb-sub');
    const pack = GAME_PACKS[currentPackIdx];

    // Celebration emoji is launched as a particle — hide it from the popup
    document.getElementById('fb-emoji').style.display = 'none';
    if (imgSrc) {
      fbImg.src = imgSrc;
      fbImg.alt = l.chinese || r.chinese || '';
      fbImg.style.display = 'block';
      fbImg.style.animation = 'none';
      fbImg.offsetWidth;
      fbImg.style.animation = '';
    } else {
      fbImg.style.display = 'none';
    }

    if (pack.id === 'strokes') {
      // Show "横 (héng)" above the image, hide sub
      const chinese = l.chinese || '';
      const pinyin  = l.pinyin  || '';
      fbName.innerHTML = `<span class="fb-pinyin">(${pinyin})</span><br>${chinese}`;
      fbName.style.display = 'block';
      fbSubEl.textContent = '';
      fbSubEl.classList.remove('zh-phrase');
    } else if (pack.id === 'measure' && l.chinese && r.chinese) {
      fbName.style.display = 'none';
      fbSubEl.textContent = `一${l.chinese}${r.chinese}`;
      fbSubEl.classList.add('zh-phrase');
    } else {
      fbName.style.display = 'none';
      const lStr = [l.pinyin, l.chinese].filter(Boolean).join(' ');
      const rStr = [r.pinyin, r.chinese].filter(Boolean).join(' ');
      fbSubEl.textContent = `${lStr}  ↔  ${rStr}`;
      fbSubEl.classList.remove('zh-phrase');
    }
  } else {
    document.getElementById('fb-img').style.display = 'none';
    document.getElementById('fb-emoji').style.display = '';
    document.getElementById('fb-name').style.display = 'none';
    const fbSubEl = document.getElementById('fb-sub');
    fbSubEl.classList.remove('zh-phrase');
    fbSubEl.textContent = "That doesn't match — try a different pair.";
  }

  // Per-match timer badge
  const fbTimer = document.getElementById('fb-timer');
  if (correct && elapsedMs > 0) {
    fbTimer.textContent = `⏱ ${(elapsedMs / 1000).toFixed(1)}s`;
    fbTimer.style.display = '';
  } else {
    fbTimer.style.display = 'none';
  }

  fb.classList.add('show');

  // Dismiss on the very next pointer event anywhere on the page
  const dismiss = () => {
    clearTimeout(feedbackTimer);
    fb.classList.remove('show');
  };
  feedbackTimer = setTimeout(dismiss, correct ? 1400 : 1200);
  document.addEventListener('pointerdown', dismiss, { once: true, capture: true });
}

/* ── Level complete overlay ── */
function showRoundComplete() {
  const pack    = GAME_PACKS[currentPackIdx];
  const isLast  = currentLevel === pack.levels.length - 1;
  const matched = Object.keys(connections).length;
  const attempts = matched + levelWrong;
  const accuracy = attempts === 0 ? 100 : Math.round(matched / attempts * 100);
  const stars    = levelWrong === 0 ? '⭐⭐⭐' : levelWrong <= 2 ? '⭐⭐' : '⭐';

  document.getElementById('co-emoji').textContent = isLast ? '🏆' : '🎉';
  document.getElementById('co-stars').textContent = stars;
  document.getElementById('co-title').textContent = isLast ? '全部完成！All Done!' : '太棒了！Great job!';

  const totalSecs = ((Date.now() - levelStartTime) / 1000).toFixed(1);
  document.getElementById('co-stats').textContent = isLast
    ? `All ${matched} pairs mastered! 🎊  ⏱ ${totalSecs}s`
    : `Accuracy: ${accuracy}%  |  Mistakes: ${levelWrong}  |  ⏱ ${totalSecs}s`;
  // Show coin + time summary in top header
  const bar = document.getElementById('level-complete-bar');
  bar.innerHTML = `🪙 ${levelCoins} coin${levelCoins !== 1 ? 's' : ''} collected &nbsp;·&nbsp; ⏱ ${totalSecs}s total`;
  bar.style.display = '';

  const btn = document.getElementById('co-btn');
  if (isLast) {
    btn.textContent = '🔄 Play Again';
    btn.onclick = resetAll;
  } else {
    btn.textContent = `▶ Level ${currentLevel + 2}`;
    btn.onclick = nextLevel;
  }

  document.getElementById('complete-overlay').classList.add('show');
  stopTick();
  playComplete();
}
