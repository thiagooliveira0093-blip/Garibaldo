// Mapeamento de teclas → ações. Troque aqui para remapear os controles.
const MAP = {
  left: ['A', 'LEFT'], right: ['D', 'RIGHT'], up: ['W', 'UP'], down: ['S', 'DOWN'],
  jump: ['SPACE', 'X'], attack1: ['J', 'Z'], attack2: ['K', 'U'], roll: ['SHIFT', 'C'], special: ['L', 'V'],
  prev: ['Q'], next: ['E'], gem1: ['ONE'], gem2: ['TWO'], gem3: ['THREE'],
  pause: ['P', 'ESC'], mute: ['M'], confirm: ['ENTER', 'SPACE'], restart: ['R', 'ENTER'], switch: ['T'],
};

export default class Controls {
  constructor(scene) {
    const kb = scene.input.keyboard;
    kb.addCapture('SPACE,UP,DOWN,LEFT,RIGHT');
    this.keys = {};
    for (const [action, names] of Object.entries(MAP)) this.keys[action] = names.map(n => kb.addKey(n));
    // guarda cada tecla apertada até o próximo frame, para não perder toques rápidos
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
}
