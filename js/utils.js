/* ═══════════════════════════════════════════════════════════════
   STATE — shared across modules (plain globals, intentional)
═══════════════════════════════════════════════════════════════ */
let currentPackIdx  = 0;
let currentLevel    = 0;
let currentPairs    = [];   // pairs for this level (in original order)
let leftOrder       = [];   // shuffled indices into currentPairs
let rightOrder      = [];   // shuffled indices into currentPairs
let selectedLeft    = null; // pair index selected on the left
let selectedRight   = null; // pair index selected on the right
let connections     = {};   // leftIdx -> rightIdx (matched pairs)
let wrongPairs      = new Set();
let levelWrong      = 0;
let feedbackTimer   = null;
let drawingLine     = null;
let matchStartTime  = null;
let levelStartTime  = 0;
let levelCoins      = 0;
let celebrationOn   = false;  // toggle: fire particles on correct match
let soundOn         = true;   // toggle: sound effects

// Display-mode state (radicals pack)
let radicalItems    = [];
let radicalIdx      = 0;
let radicalWriter   = null;
let radicalStrokeCount = 0;
let radicalLoopActive  = false;

const isIOS = /iP(hone|ad|od)/.test(navigator.userAgent) ||
              (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

/* ═══════════════════════════════════════════════════════════════
   GENERIC UTILITIES
═══════════════════════════════════════════════════════════════ */
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getDotCenter(el) {
  const wrapper = document.getElementById('game-wrapper');
  const wr = wrapper.getBoundingClientRect();
  const er = el.getBoundingClientRect();
  return { x: er.left + er.width / 2 - wr.left, y: er.top + er.height / 2 - wr.top };
}

/* Coin + spark burst when a pair is correctly matched.
   Particles are appended to body and removed ONLY via animationend —
   they are never cancelled by user interaction.
   Spawned from the left and right card positions, biased outward to
   each side so they never cross the center where the feedback popup sits. */
function spawnCoins(lx, ly, rx, ry, celebEmoji = '🎉') {
  const coinPool  = isIOS ? ['⭐', '🌟'] : ['🪙', '💰'];
  const sparkPool = isIOS ? ['✨', '🌟', '⭐', '🌟', '✨', '⭐']
                          : ['✨', '🌟', '🪙', '💰', '✨', '🌟'];

  // Helper: spawn one arc particle from (ox,oy) biased toward xDir (-1=left, +1=right)
  function arc(ox, oy, emoji, cls, xDir, fs, dur, del, extraCss = '') {
    const el = document.createElement('div');
    el.className = cls;
    el.textContent = emoji;
    const cdx  = (xDir * (50 + Math.random() * 90)).toFixed(1);  // always fly outward
    const crot = (Math.random() * 60 - 30).toFixed(0);
    const jx   = (Math.random() - .5) * 30;
    const jy   = (Math.random() - .5) * 30;
    el.style.cssText =
      `left:${ox + jx - 16}px; top:${oy + jy - 16}px;` +
      `animation-duration:${dur}ms; animation-delay:${del}ms;` +
      `--cdx:${cdx}px; --crot:${crot}deg; font-size:${fs}rem;` + extraCss;
    document.body.appendChild(el);
    el.addEventListener('animationend', () => el.remove());
  }

  // Helper: spawn one radial spark from (ox,oy) biased to the outer half
  function spark(ox, oy, emoji, xDir, fs, dur, del) {
    const el = document.createElement('div');
    el.className = 'spark-particle';
    el.textContent = emoji;
    // angles in the outer 180° hemisphere (away from center)
    const baseAngle = xDir < 0 ? 90 : 270;  // left side → 90°±, right → 270°±
    const angle = baseAngle + (Math.random() - .5) * 160;
    const dist  = 70 + Math.random() * 110;
    const dx    = (Math.cos(angle * Math.PI / 180) * dist).toFixed(1);
    const dy    = (Math.sin(angle * Math.PI / 180) * dist).toFixed(1);
    const srot  = (Math.random() * 360 - 180).toFixed(0);
    el.style.cssText =
      `left:${ox - 10}px; top:${oy - 10}px;` +
      `--sdx:${dx}px; --sdy:${dy}px; --srot:${srot}deg;` +
      `font-size:${fs}rem; animation-duration:${dur}ms; animation-delay:${del}ms;`;
    document.body.appendChild(el);
    el.addEventListener('animationend', () => el.remove());
  }

  // Left side — 2 coins + 3 sparks
  arc(lx, ly, coinPool[0], 'coin-particle', -1, (1.4 + Math.random()*.8).toFixed(2), 1300 + Math.random()*500, 0);
  arc(lx, ly, coinPool[1], 'coin-particle', -1, (1.4 + Math.random()*.8).toFixed(2), 1300 + Math.random()*500, 90);
  for (let i = 0; i < 3; i++)
    spark(lx, ly, sparkPool[i], -1, (.9+Math.random()*.9).toFixed(2), 1100+Math.random()*600, Math.round(Math.random()*180));

  // Right side — 2 coins + 3 sparks
  arc(rx, ry, coinPool[0], 'coin-particle', +1, (1.4 + Math.random()*.8).toFixed(2), 1300 + Math.random()*500, 30);
  arc(rx, ry, coinPool[1], 'coin-particle', +1, (1.4 + Math.random()*.8).toFixed(2), 1300 + Math.random()*500, 120);
  for (let i = 0; i < 3; i++)
    spark(rx, ry, sparkPool[i+3], +1, (.9+Math.random()*.9).toFixed(2), 1100+Math.random()*600, Math.round(Math.random()*180));

  // One large face emoji — from whichever side has more vertical room, flying further out
  const side = Math.random() < .5 ? {x: lx, d: -1} : {x: rx, d: +1};
  arc(side.x, Math.min(ly, ry), celebEmoji, 'coin-particle', side.d,
    (3.8 + Math.random()*.8).toFixed(2), 1800 + Math.random()*400, 60,
    '--crot:0deg;');  // keep face upright
}
