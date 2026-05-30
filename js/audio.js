/* ═══════════════════════════════════════════════════════════════
   AUDIO ENGINE  (Web Audio API — no files, no external service)
═══════════════════════════════════════════════════════════════ */
const _AudioCtx = window.AudioContext || window.webkitAudioContext;
let _actx = null;

function _getCtx() {
  if (!_actx) _actx = new _AudioCtx();
  if (_actx.state === 'suspended') _actx.resume();
  return _actx;
}

// Schedule a single tone: osc type, frequency, start time, duration, peak volume
function _tone(ctx, dest, type, freq, t, dur, vol) {
  const osc  = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(vol, t + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(gain);
  gain.connect(dest);
  osc.start(t);
  osc.stop(t + dur + 0.05);
}

// ✅ Correct match — warm ascending marimba chime (C5 → E5 → G5)
function playCorrect() {
  if (!soundOn) return;
  const ctx    = _getCtx();
  const master = ctx.createGain();
  master.gain.setValueAtTime(0.22, ctx.currentTime);
  master.connect(ctx.destination);
  const t = ctx.currentTime;
  _tone(ctx, master, 'triangle', 523.25, t,        0.38, 1.0);
  _tone(ctx, master, 'triangle', 659.25, t + 0.11, 0.33, 1.0);
  _tone(ctx, master, 'triangle', 783.99, t + 0.22, 0.42, 1.0);
  // Soft high shimmer on the last note
  _tone(ctx, master, 'sine',    1046.50, t + 0.22, 0.28, 0.28);
}

// ❌ Wrong match — two sawtooth "mm-mm" buzzes, descending pitch each pulse
function playWrong() {
  if (!soundOn) return;
  const ctx    = _getCtx();
  const master = ctx.createGain();
  master.gain.setValueAtTime(0.18, ctx.currentTime);
  master.connect(ctx.destination);
  const t = ctx.currentTime;

  // Two buzz pulses: higher then lower, like "mm-mm / nuh-uh"
  [{ startF: 240, endF: 180, start: 0 },
   { startF: 190, endF: 130, start: 0.23 }].forEach(({ startF, endF, start }) => {
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(startF, t + start);
    osc.frequency.exponentialRampToValueAtTime(endF, t + start + 0.18);
    gain.gain.setValueAtTime(0, t + start);
    gain.gain.linearRampToValueAtTime(1, t + start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + start + 0.20);
    osc.connect(gain);
    gain.connect(master);
    osc.start(t + start);
    osc.stop(t + start + 0.25);
  });
}

// ✏️ Pencil-on-paper stroke — quiet scratchy graphite (narrowband filtered noise,
// short bursts to evoke pencil grain rather than airy whoosh)
function playStrokeBrush(strokeNum = 0) {
  if (!soundOn) return;
  const ctx    = _getCtx();
  const master = ctx.createGain();
  master.gain.setValueAtTime(0.05, ctx.currentTime);   // much quieter overall
  master.connect(ctx.destination);
  const t = ctx.currentTime;

  // Shorter buffer — pencil scratches are crisp, not breathy
  const dur = 0.32;
  const sr  = ctx.sampleRate;
  const len = Math.floor(sr * dur);
  const buf = ctx.createBuffer(1, len, sr);
  const data = buf.getChannelData(0);

  // Sparse "grain" noise: only a fraction of samples are non-zero, giving a
  // brittle scratchy texture instead of a smooth airflow.
  const fadeIn  = Math.floor(sr * 0.012);
  const fadeOut = Math.floor(sr * 0.080);
  for (let i = 0; i < len; i++) {
    let env = 1;
    if (i < fadeIn)             env = i / fadeIn;
    else if (i > len - fadeOut) env = (len - i) / fadeOut;
    // Only ~35% of samples carry signal → granular, drier texture
    const sample = (Math.random() < 0.35) ? (Math.random() * 2 - 1) : 0;
    data[i] = sample * env;
  }

  const src = ctx.createBufferSource();
  src.buffer = buf;

  // Narrowband bandpass high in the spectrum — graphite-on-paper "skritch" lives
  // around 3–5 kHz. High Q removes the airy hiss that comes from broadband noise.
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = 3600 + (strokeNum % 5) * 220;
  bp.Q.value = 4.5;

  // High-shelf cut to roll off any remaining airy top end
  const hs = ctx.createBiquadFilter();
  hs.type = 'highshelf';
  hs.frequency.value = 6000;
  hs.gain.value = -12;

  src.connect(bp);
  bp.connect(hs);
  hs.connect(master);
  src.start(t);
  src.stop(t + dur + 0.05);
}

// 🎉 Level complete — C major fanfare arpeggio then chord sustain
function playComplete() {
  if (!soundOn) return;
  const ctx    = _getCtx();
  const master = ctx.createGain();
  master.gain.setValueAtTime(0.18, ctx.currentTime);
  master.connect(ctx.destination);
  const t = ctx.currentTime;
  // Quick arpeggio: C5 E5 G5 C6
  [523.25, 659.25, 783.99, 1046.50].forEach((f, i) =>
    _tone(ctx, master, 'triangle', f, t + i * 0.10, 0.50, 1.0)
  );
  // Warm chord sustain underneath
  [523.25, 659.25, 783.99].forEach(f =>
    _tone(ctx, master, 'sine', f, t + 0.42, 0.65, 0.45)
  );
}

function toggleSound() {
  soundOn = !soundOn;
  document.getElementById('sound-track').classList.toggle('on', soundOn);
  // Unlock AudioContext on first interaction (required by iOS/Chrome policy)
  if (soundOn) _getCtx();
}

let _tickInterval  = null;
let _tickMuted     = false;   // clock visible but tick sound silenced
let _tickStarted   = false;   // becomes true after first card tap

function playTick() {
  if (!soundOn || _tickMuted) return;
  const ctx  = _getCtx();
  const t    = ctx.currentTime;
  const osc  = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(1200, t);
  osc.frequency.exponentialRampToValueAtTime(800, t + 0.025);
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(0.18, t + 0.004);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.045);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(t);
  osc.stop(t + 0.05);
}

function _updateClock() {
  const el = document.getElementById('clock-display');
  if (!el) return;
  const secs = Math.floor((Date.now() - levelStartTime) / 1000);
  el.textContent = secs + 's';
}

function startTick() {
  stopTick();
  _tickStarted = true;
  levelStartTime = Date.now();
  const el = document.getElementById('clock-display');
  if (el) { el.classList.remove('muted'); el.classList.add('ticking'); }
  _updateClock();
  playTick();
  _tickInterval = setInterval(() => { _updateClock(); playTick(); }, 1000);
}

function stopTick() {
  if (_tickInterval) { clearInterval(_tickInterval); _tickInterval = null; }
  _tickStarted = false;
  const el = document.getElementById('clock-display');
  if (el) { el.classList.remove('ticking'); el.classList.add('muted'); }
}

// Clock widget click — toggle tick mute while keeping clock running
function toggleTickMute() {
  if (!_tickStarted) return;  // clock not active yet, nothing to toggle
  _tickMuted = !_tickMuted;
  const el = document.getElementById('clock-display');
  if (el) el.classList.toggle('muted', _tickMuted);
}
