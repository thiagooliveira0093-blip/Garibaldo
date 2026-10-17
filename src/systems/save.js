// Progresso salvo no navegador (ouro acumulado entre partidas). Tudo protegido: se o navegador
// bloquear o armazenamento, o jogo continua funcionando sem salvar.
const KEY = 'garibaldo.save.v1';

export function loadSave() {
  try { return { gold: 0, best: 0, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch (_) { return { gold: 0, best: 0 }; }
}
export function writeSave(data) {
  try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (_) { /* sem armazenamento */ }
}
// soma o ouro da partida e guarda o melhor tempo
export function recordRun(gold, seconds, won) {
  const s = loadSave();
  s.gold += gold;
  if (won || seconds > s.best) s.best = Math.max(s.best, seconds);
  writeSave(s);
  return s;
}
