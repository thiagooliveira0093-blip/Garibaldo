import Enemy from './Enemy.js';
import Boss from './Boss.js';
import { GAME_W } from '../config.js';
import { uiStyle } from '../systems/ui-style.js';
import { sfx } from '../systems/sfx.js';

// Soldado: metade corre até você e dá um golpe de espada (brilha em vermelho antes: role por dentro
// ou interrompa com um golpe forte); a outra metade fica longe e atira reto (agache) ou mirado.
class Grunt extends Enemy {
  constructor(scene, spawn) {
    super(scene, spawn);
    this.style = Math.random() < 0.5 ? 'melee' : 'shooter';
    this.mState = 'idle'; this.mT = 0; this.mCd = Phaser.Math.FloatBetween(0.3, 1);
    if (this.style === 'melee') { this.speedMul = 1.45; this.glowColor = 0xff3355; }
  }
  onStagger() { this.mState = 'idle'; this.mCd = 0.5; }

  behaveMelee(dt) {
    const p = this.player, dx = p.x - this.x, dy = p.y - this.y, sc = this.sc;
    this.mCd -= dt;
    if (this.mState === 'idle') {
      this.walker(0, 46 * sc);                       // aproxima até ficar colado
      const close = this.entered && Math.abs(dx) < 80 * sc && Math.abs(dy) < 70 * sc;
      if (close && this.mCd <= 0 && p.alive) {      // prepara o golpe: para e brilha
        this.mState = 'wind'; this.mT = 0.55; this.tele = this.mT; this.teleMax = this.mT;
        this.setVelocityX(0); this.facing = dx < 0 ? -1 : 1;
      }
      this.anim(this.walking ? 'walk' : 'idle');
    } else if (this.mState === 'wind') {
      this.setVelocityX(0);
      this.mT -= dt; this.tele = Math.max(0, this.mT);
      this.anim('attack');
      if (this.mT <= 0) { this.mState = 'rest'; this.mT = 0.7; this.swing(); }
    } else {                                         // descanso depois do golpe
      this.setVelocityX(0);
      this.mT -= dt;
      this.anim('idle');
      if (this.mT <= 0) { this.mState = 'idle'; this.mCd = 0.5; }
    }
  }

  swing() {
    const s = this.scene, p = this.player, sc = this.sc, f = this.facing;
    const box = new Phaser.Geom.Rectangle(f > 0 ? this.x : this.x - 78 * sc, this.y - 62 * sc, 78 * sc, 62 * sc);
    s.fx.slashArc(this.x + f * 34 * sc, this.y - 30 * sc, f, 0xff3355);
    sfx('slash');
    if (s.state !== 'play') return;
    if (Phaser.Geom.Intersects.RectangleToRectangle(p.hurtbox(), box)) {
      if (p.dashT > 0) s.perfectDodge(); else s.damagePlayer();   // rolar por dentro do golpe = esquiva perfeita
    }
  }

  behave(dt) {
    if (this.style === 'melee') { this.behaveMelee(dt); return; }
    this.walker(180, 420);
    this.enemyFire(dt, 0.5, 1.6, 2.6, () => {
      const m = this.muzzle(), pc = this.player.body.center;
      if (Math.abs(pc.y - m.y) < 40) this.scene.enemyShot(m.x, m.y, this.facing * 300, 0, 'orb');
      else this.aim(m.x, m.y, 300, 'orb');
    });
    this.anim(this.tele > 0 ? 'attack' : this.walking ? 'walk' : 'idle');
  }
  muzzle() { return { x: this.x + this.facing * 21 * this.sc, y: this.y - 34 * this.sc }; }
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
  muzzle() { return { x: this.x + this.facing * 17 * this.sc, y: this.y - 40 * this.sc }; }
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
  muzzle() { return { x: this.x, y: this.y - 2 * this.sc }; }
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
      if (this.volley % 2) s.groundWave(this.x + this.facing * 36 * this.sc, this.facing);
      else {
        const px = this.player.x;
        for (const o of [-110, 0, 110]) s.lob(this.x, this.y - 72 * this.sc, Phaser.Math.Clamp(px + o, s.camX + 20, s.camX + GAME_W - 20), 1.05);
      }
    });
    this.bang.setVisible(this.tele > 0).setPosition(this.x, this.y - 92 * this.sc);
    this.anim(this.tele > 0 ? 'attack' : this.walking ? 'walk' : 'idle');
  }
  muzzle() { return { x: this.x + this.facing * 34 * this.sc, y: this.y - 42 * this.sc }; }
  kill() { this.bang.setVisible(false); super.kill(); }
  destroy(fromScene) { if (this.bang) this.bang.destroy(); super.destroy(fromScene); }
}

const TYPES = { grunt: Grunt, caster: Caster, drone: Drone, heavy: Heavy, boss: Boss };

export function createEnemy(scene, spawn) {
  const Type = TYPES[spawn.type];
  if (!Type) { console.warn('Tipo de inimigo desconhecido:', spawn.type); return null; }
  return new Type(scene, spawn);
}
