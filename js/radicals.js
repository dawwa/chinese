/* ═══════════════════════════════════════════════════════════════
   RADICALS DISPLAY ENGINE (parent-led, Hanzi Writer animation)
═══════════════════════════════════════════════════════════════ */
function renderRadical() {
  if (!radicalItems.length) return;
  const item = radicalItems[radicalIdx];
  const target = document.getElementById('radical-writer');
  target.innerHTML = ''; // clear previous SVG
  radicalWriter = null;
  radicalLoopActive = false;
  radicalStrokeCount = 0;

  document.getElementById('radical-pinyin').textContent  = item.pinyin || '';
  document.getElementById('radical-name-cn').textContent = item.nameCN || item.char;
  document.getElementById('radical-progress').textContent =
    `${radicalIdx + 1} / ${radicalItems.length}`;

  // Reset name reveal to hidden for each new radical (student names it first)
  const nameGroup = document.getElementById('radical-name-group');
  if (nameGroup) nameGroup.classList.add('hidden');
  const nameBtn = document.getElementById('reveal-name-btn');
  if (nameBtn) nameBtn.innerHTML = '🏷️ Name';

  const examplesEl = document.getElementById('radical-examples');
  // Reset to hidden state for each new radical
  examplesEl.classList.add('hidden');
  const btn = document.getElementById('reveal-examples-btn');
  if (btn) btn.innerHTML = '👀 Examples';
  // Rebuild contents: placeholder + chips
  examplesEl.innerHTML = '';
  const placeholder = document.createElement('div');
  placeholder.className = 'radical-examples-placeholder';
  placeholder.textContent = '··· 点击查看 Tap to reveal ···';
  placeholder.onclick = toggleRadicalExamples;
  examplesEl.appendChild(placeholder);
  (item.examples || []).forEach(ch => {
    const span = document.createElement('span');
    span.className = 'radical-example';
    span.textContent = ch;
    examplesEl.appendChild(span);
  });

  if (typeof HanziWriter === 'undefined') {
    console.warn('[radicals] HanziWriter not loaded — showing plain glyph');
    target.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;height:100%;font-family:var(--font-zh);font-size:5rem;color:#4a2c00;">${item.char}</div>`;
    return;
  }

  try {
    radicalWriter = HanziWriter.create(target, item.char, {
      width: 200,
      height: 200,
      padding: 10,
      strokeColor: '#1a1a1a',
      radicalColor: '#1a1a1a',
      outlineColor: '#e8c9a0',
      delayBetweenStrokes: 350,
      strokeAnimationSpeed: 1,
      delayBetweenLoops: 1500,
      showOutline: true,
      showCharacter: false,
      onLoadCharDataSuccess: (charData) => {
        radicalStrokeCount = (charData && charData.strokes) ? charData.strokes.length : 0;
        radicalLoopActive = true;
        radicalAnimateLoop(item.char);
      },
      onLoadCharDataError: (reason) => {
        const msg = reason && reason.message ? reason.message : String(reason);
        console.warn('[radicals] no data for', item.char, reason);
        target.innerHTML =
          `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;font-family:var(--font-zh);gap:6px;">
             <div style="font-size:4.5rem;color:#4a2c00;line-height:1;">${item.char}</div>
             <div style="font-size:.7rem;color:#c0392b;font-family:'Segoe UI',sans-serif;text-align:center;padding:0 6px;">
               ⚠ no stroke data<br/><span style="opacity:.7">${msg.slice(0,80)}</span>
             </div>
           </div>`;
      },
    });
  } catch (e) {
    console.error('[radicals] HanziWriter.create failed', e);
    target.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;height:100%;font-family:var(--font-zh);font-size:5rem;color:#4a2c00;">${item.char}</div>`;
  }
}

function radicalNext() {
  if (!radicalItems.length) return;
  radicalLoopActive = false;
  if (radicalIdx < radicalItems.length - 1) {
    radicalIdx++;
    renderRadical();
  } else {
    const pack = GAME_PACKS[currentPackIdx];
    if (currentLevel < pack.levels.length - 1) {
      currentLevel++;
      buildRound();
    } else {
      radicalIdx = 0;
      renderRadical();
    }
  }
}

function radicalPrev() {
  if (!radicalItems.length) return;
  radicalLoopActive = false;
  if (radicalIdx > 0) {
    radicalIdx--;
    renderRadical();
  }
}

function radicalReplay() {
  if (!radicalWriter) return;
  radicalLoopActive = true;
  const item = radicalItems[radicalIdx];
  // Hide any in-progress strokes, then re-run our chained animator
  try { radicalWriter.hideCharacter({ duration: 0 }); } catch (e) {}
  radicalAnimateLoop(item.char);
}

function toggleRadicalExamples() {
  const el  = document.getElementById('radical-examples');
  const btn = document.getElementById('reveal-examples-btn');
  const wasHidden = el.classList.contains('hidden');
  el.classList.toggle('hidden');
  if (btn) btn.innerHTML = wasHidden ? '🙈 Examples' : '👀 Examples';
}

function toggleRadicalName() {
  const el  = document.getElementById('radical-name-group');
  const btn = document.getElementById('reveal-name-btn');
  if (!el) return;
  const wasHidden = el.classList.contains('hidden');
  el.classList.toggle('hidden');
  if (btn) btn.innerHTML = wasHidden ? '🙈 Name' : '🏷️ Name';
}

// Chain animateStroke() one stroke at a time so we can play a sound per stroke.
// Hanzi Writer's animateCharacter()/loopCharacterAnimation() don't expose
// per-stroke callbacks, so we drive the animation manually.
function radicalAnimateLoop(char) {
  if (!radicalWriter || !radicalLoopActive || radicalStrokeCount <= 0) return;
  const myWriter = radicalWriter;
  const myChar   = char;

  const animateOne = (i) => {
    // Bail if the user navigated away or replayed
    if (!radicalLoopActive || radicalWriter !== myWriter) return;
    if (i >= radicalStrokeCount) {
      // Finished one full pass — pause, hide, and restart the loop
      setTimeout(() => {
        if (!radicalLoopActive || radicalWriter !== myWriter) return;
        try { myWriter.hideCharacter({ duration: 300 }); } catch (e) {}
        setTimeout(() => {
          if (!radicalLoopActive || radicalWriter !== myWriter) return;
          radicalAnimateLoop(myChar);
        }, 600);
      }, 1200);
      return;
    }
    playStrokeBrush(i);
    try {
      myWriter.animateStroke(i, {
        onComplete: () => setTimeout(() => animateOne(i + 1), 220),
      });
    } catch (e) {
      console.error('[radicals] animateStroke failed', e);
    }
  };
  animateOne(0);
}
