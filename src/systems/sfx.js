// Efeitos sonoros sintetizados (placeholder). Para usar arquivos de áudio,
// carregue-os no BootScene e troque sfx() por scene.sound.play(chave).
let actx = null, muted = false;
const lastPlayed = {};

// [forma de onda, freq inicial, freq final, volume, duração, intervalo mínimo]
const SFX = {
  fire:    ['sawtooth', 320, 110, 0.06, 0.12, 0],
  ice:     ['triangle', 900, 500, 0.06, 0.10, 0],
  bolt:    ['square',  1300, 300, 0.03, 0.06, 0],
  hit:     ['square',   220,  80, 0.04, 0.07, 0.03],
  slash:   ['sawtooth', 1400, 250, 0.07, 0.16, 0],
  hurt:    ['sawtooth', 200,  40, 0.15, 0.35, 0],
  boom:    ['sawtooth', 120,  30, 0.12, 0.40, 0.05],
  enemy:   ['sine',     520, 240, 0.03, 0.12, 0.04],
  dash:    ['triangle', 300, 800, 0.05, 0.12, 0],
  pick:    ['sine',     600, 1300, 0.07, 0.18, 0],
  special: ['sawtooth',  70, 700, 0.12, 0.70, 0],
  graze:   ['sine',    1500, 1900, 0.025, 0.05, 0.08],
  xp:      ['sine',     900, 1500, 0.02, 0.07, 0.04],
  coin:    ['square',  1200, 1800, 0.025, 0.08, 0.05],
  levelup: ['triangle', 400, 1800, 0.09, 0.55, 0],
  dodge:   ['triangle', 400, 1600, 0.08, 0.30, 0],
};

export function initAudio() {
  if (actx) { if (actx.state === 'suspended') actx.resume(); return; }
  try { actx = new (window.AudioContext || window.webkitAudioContext)(); } catch (_) { actx = null; }
}
export function toggleMute() { muted = !muted; return muted; }
export const isMuted = () => muted;

export function sfx(name) {
  if (!actx || muted) return;
  const s = SFX[name]; if (!s) return;
  const t = actx.currentTime;
  if (s[5] && lastPlayed[name] && t - lastPlayed[name] < s[5]) return;
  lastPlayed[name] = t;
  const o = actx.createOscillator(), g = actx.createGain();
  o.type = s[0];
  o.frequency.setValueAtTime(s[1], t);
  o.frequency.exponentialRampToValueAtTime(s[2], t + s[4]);
  g.gain.setValueAtTime(s[3], t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + s[4]);
  o.connect(g); g.connect(actx.destination);
  o.start(t); o.stop(t + s[4] + 0.02);
}
