import Enemy from './Enemy.js';
import Boss from './Boss.js';
import { GAME_W } from '../config.js';
import { uiStyle } from '../systems/ui-style.js';

// Soldado: anda no chão e atira reto (agache para desviar) ou mirado se você estiver acima.
class Grunt extends Enemy {
  behave(dt) {
    this.walker(180, 420);
    this.enemyFire(dt, 0.5, 1.6, 2.6, () => {
      const m = this.muzzle(), pc = this.player.body.center;
      if (Math.abs(pc.y - m.y) < 40) this.scene.enemyShot(m.x, m.y, this.facing * 300, 0, 'orb');
      else this.aim(m.x, m.y, 300, 'orb');
    });
    this.anim(this.tele > 0 ? 'attack' : this.walking ? 'walk' : 'idle');
  }
  muzzle() { return { x: this.x + this.facing * 21, y: this.y - 34 }; }
}

// Mago: aparece numa plataforma, leque de 3 orbes; a cada 3 ataques um orbe vermelho lento.
class Caster extends Enemy {
  constructor(scene, spawn) {
    super(scene, spawn);
    this.entered = true;
    this.fadeIn(0.6);
    scene.fx.burst(this.x, this.y - 30, 0xc04bff, 20, 200, 0, 600);
  }
  behave(dt) {
    this.facing = this.player.x < this.x ? -1 : 1;
    this.glowColor = (this.volley + 1) % 3 === 0 ? 0xff3355 : 0xc04bff;
    this.enemyFire(dt, 0.65, 2.2, 3.0, () => {
      const m = this.muzzle();
      this.volley++;
      if (this.volley % 3 === 0) this.aim(m.x, m.y, 190, 'big');
      else for (const o of [-0.28, 0, 0.28]) this.aim(m.x, m.y, 250, 'orb', o);
    });
    this.anim(this.tele > 0 ? 'attack' : 'idle');
  }
  muzzle() { return { x: this.x + this.facing * 17, y: this.y - 40 }; }
}

// Drone: desce do céu até a altura marcada no Tiled e fica rondando o player.
class Drone extends Enemy {
  constructor(scene, spawn) {
    super(scene, spawn);
    this.hoverY = spawn.y;
    this.y = -40;
    this.side = Math.random() < 0.5 ? -1 : 1;
    this.entered = true;
  }
  behave(dt) {
    const s = this.scene;
    this.t += dt;
    const tx = this.player.x + this.side * 170 + Math.sin(this.t * 0.9) * 90;
    this.x += (tx - this.x) * Math.min(1, dt * 0.9);
    this.y += (this.hoverY + Math.sin(this.t * 2.2) * 14 - this.y) * Math.min(1, dt * 2);
    this.x = Phaser.Math.Clamp(this.x, s.camX + 20, s.camX + GAME_W - 20);
    this.facing = this.player.x < this.x ? -1 : 1;
    if (this.y > 60) this.enemyFire(dt, 0.45, 1.8, 2.8, () => { const m = this.muzzle(); this.aim(m.x, m.y, 290, 'orb'); });
    this.anim(this.tele > 0 ? 'attack' : 'idle');
  }
  muzzle() { return { x: this.x, y: this.y - 2 }; }
}

// Brutamontes: alterna onda de chão (pule!) e 3 morteiros na sua posição.
class Heavy extends Enemy {
  constructor(scene, spawn) {
    super(scene, spawn);
    this.glowColor = 0xff9933;
    this.bang = scene.add.text(0, 0, '!', uiStyle(24, '#ffdd33')).setOrigin(0.5).setDepth(16).setVisible(false);
  }
  behave(dt) {
    this.walker(260, 480);
    this.enemyFire(dt, 0.8, 2.3, 3.1, () => {
      const s = this.scene;
      this.volley++;
      if (this.volley % 2) s.groundWave(this.x + this.facing * 36, this.facing);
      else {
        const px = this.player.x;
        for (const o of [-110, 0, 110]) s.lob(this.x, this.y - 72, Phaser.Math.Clamp(px + o, s.camX + 20, s.camX + GAME_W - 20), 1.05);
      }
    });
    this.bang.setVisible(this.tele > 0).setPosition(this.x, this.y - 92);
    this.anim(this.tele > 0 ? 'attack' : this.walking ? 'walk' : 'idle');
  }
  muzzle() { return { x: this.x + this.facing * 34, y: this.y - 42 }; }
  kill() { this.bang.setVisible(false); super.kill(); }
  destroy(fromScene) { if (this.bang) this.bang.destroy(); super.destroy(fromScene); }
}

const TYPES = { grunt: Grunt, caster: Caster, drone: Drone, heavy: Heavy, boss: Boss };

export function createEnemy(scene, spawn) {
  const Type = TYPES[spawn.type];
  if (!Type) { console.warn('Tipo de inimigo desconhecido:', spawn.type); return null; }
  return new Type(scene, spawn);
}
