// Mapeamento de entrada → ações. Troque aqui para remapear.
// Mouse: clique ESQUERDO = ataque fraco ("light"), clique DIREITO = ataque forte ("heavy"), e o cursor mira.
// Sem mouse, J = fraco e K = forte (o ataque vai para o lado em que o herói está olhando).
const MAP = {
  left: ['A', 'LEFT'], right: ['D', 'RIGHT'], down: ['S', 'DOWN'],
  jump: ['SPACE', 'W', 'UP', 'X'], light: ['J', 'Z'], heavy: ['K', 'U'], roll: ['SHIFT', 'C'], special: ['L', 'V', 'F'],
  prev: ['Q'], next: ['E'], gem1: ['ONE'], gem2: ['TWO'], gem3: ['THREE'],
  pause: ['P', 'ESC'], mute: ['M'], confirm: ['ENTER', 'SPACE'], restart: ['R', 'ENTER'], switch: ['T'],
};
const MOUSE_ACTIVE_MS = 3500;   // por quanto tempo o mouse conta como "em uso" depois de mexer

export default class Controls {
  constructor(scene) {
    this.scene = scene;
    const kb = scene.input.keyboard;
    kb.addCapture('SPACE,UP,DOWN,LEFT,RIGHT');
    this.keys = {};
    for (const [action, names] of Object.entries(MAP)) this.keys[action] = names.map(n => kb.addKey(n));
    // guarda cada aperto até o próximo frame, para não perder toques rápidos
    this.queue = new Set();
    this.pressed = new Set();
    const onDown = e => { if (!e.repeat) this.queue.add(e.keyCode); };
    kb.on('keydown', onDown);

    // mouse: o clique direito não pode abrir o menu do navegador
    const input = scene.input;
    if (input.mouse) input.mouse.disableContextMenu();
    this.actionQueue = new Set();
    this.actionPressed = new Set();
    this.mouseT = -1e9;
    this.lastSource = 'key';   // de onde veio o último ataque: 'mouse' ou 'key'
    const onPointerDown = p => {
      this.mouseT = scene.time.now;
      if (p.button === 0) this.actionQueue.add('light'); else if (p.button === 2) this.actionQueue.add('heavy');
    };
    const onPointerMove = () => { this.mouseT = scene.time.now; };
    input.on('pointerdown', onPointerDown);
    input.on('pointermove', onPointerMove);
    scene.events.once('shutdown', () => {
      kb.off('keydown', onDown); input.off('pointerdown', onPointerDown); input.off('pointermove', onPointerMove);
    });
  }

  // Chamar uma vez por frame, antes de ler just().
  poll() {
    this.pressed = this.queue; this.queue = new Set();
    this.actionPressed = this.actionQueue; this.actionQueue = new Set();
    if (this.actionPressed.size) this.lastSource = 'mouse';
    else if (this.keyJust('light') || this.keyJust('heavy')) this.lastSource = 'key';
  }

  keyHeld(action) { return this.keys[action].some(k => k.isDown); }
  keyJust(action) { return this.keys[action].some(k => this.pressed.has(k.keyCode)); }

  held(action) {
    const p = this.scene.input.activePointer;
    if (action === 'light' && p.leftButtonDown()) return true;
    if (action === 'heavy' && p.rightButtonDown()) return true;
    return this.keyHeld(action);
  }
  just(action) { return this.keyJust(action) || this.actionPressed.has(action); }

  // posição do cursor no mundo do jogo (a câmera anda, então converte)
  pointerWorld() {
    const p = this.scene.input.activePointer;
    return this.scene.cameras.main.getWorldPoint(p.x, p.y);
  }
  get mouseActive() { return this.scene.time.now - this.mouseT < MOUSE_ACTIVE_MS; }
}
