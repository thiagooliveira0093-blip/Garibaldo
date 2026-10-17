// Mapeamento de teclas → ações. Troque aqui para remapear os controles.
// O herói só se move e rola: as armas atacam sozinhas.
const MAP = {
  left: ['A', 'LEFT'], right: ['D', 'RIGHT'], up: ['W', 'UP'], down: ['S', 'DOWN'],
  dash: ['SPACE', 'SHIFT', 'C'],
  pick1: ['ONE'], pick2: ['TWO'], pick3: ['THREE'],
  pause: ['P', 'ESC'], mute: ['M'], confirm: ['ENTER', 'SPACE'], restart: ['R', 'ENTER'], switch: ['T'],
};

export default class Controls {
  constructor(scene) {
    const kb = scene.input.keyboard;
    kb.addCapture('SPACE,UP,DOWN,LEFT,RIGHT');
    this.keys = {};
    for (const [action, names] of Object.entries(MAP)) this.keys[action] = names.map(n => kb.addKey(n));
    // guarda cada aperto até o próximo frame, para não perder toques rápidos
    this.queue = new Set();
    this.pressed = new Set();
    const onDown = e => { if (!e.repeat) this.queue.add(e.keyCode); };
    kb.on('keydown', onDown);
    scene.events.once('shutdown', () => kb.off('keydown', onDown));
  }

  // Chamar uma vez por frame, antes de ler just().
  poll() {
    this.pressed = this.queue;
    this.queue = new Set();
  }

  held(action) { return this.keys[action].some(k => k.isDown); }
  just(action) { return this.keys[action].some(k => this.pressed.has(k.keyCode)); }

  // direção de movimento normalizada (diagonais não são mais rápidas)
  get move() {
    let x = (this.held('right') ? 1 : 0) - (this.held('left') ? 1 : 0);
    let y = (this.held('down') ? 1 : 0) - (this.held('up') ? 1 : 0);
    if (x && y) { x *= Math.SQRT1_2; y *= Math.SQRT1_2; }
    return { x, y };
  }
}
