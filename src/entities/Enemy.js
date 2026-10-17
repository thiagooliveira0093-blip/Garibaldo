import { GAME_W, ENEMIES, ICE_SLOW } from '../config.js';
import { FRAME } from '../assets.js';

// Base de todos os inimigos. Cada tipo implementa behave(dt) e muzzle().
export default class Enemy extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, spawn) {
    const def = ENEMIES[spawn.type];
    super(scene, spawn.x, spawn.y, def.sheet, 0);
    this.def = def;
    this.kind = spawn.type;
    scene.add.existing(this);
    scene.physics.add.existing(this);
    scene.enemies.add(this); // o grupo reseta o corpo; por isso a configuração vem depois
    this.sc = def.scale || 1;
    this.setOrigin(0.5, 1).setScale(this.sc).setDepth(9);
    const [w, h, ox, oy] = def.body;
    this.body.setSize(w, h).setOffset(ox, oy);
    this.body.setAllowGravity(def.gravity);
    if (!def.gravity) this.body.setImmovable(true);

    Object.assign(this, {
      hp: def.hp, maxHp: def.hp, facing: -1, fireT: Phaser.Math.FloatBetween(0.6, 1.4),
      tele: 0, teleMax: 1, slowT: 0, flashT: 0, spawnT: 0, spawnMax: 1, entered: false,
      volley: 0, dead: false, t: Math.random() * 10, walking: false, glowColor: 0xc04bff,
      stunT: 0, turnLock: 0, lockFacing: -1,
    });
    this.glow = scene.add.image(0, 0, 'proj', FRAME.glow).setDepth(14).setBlendMode('ADD').setVisible(false);
    this.anim('idle');
  }

  anim(name) { this.play(`${this.def.sheet}-${name}`, true); }
  get player() { return this.scene.player; }
  bodyRect() { const b = this.body; return new Phaser.Geom.Rectangle(b.x, b.y, b.width, b.height); }

  // aparece com fade (usado por magos e chefe)
  fadeIn(time) { this.spawnT = time; this.spawnMax = time; this.setAlpha(0); }

  tick(dt) {
    if (this.dead) return;
    this.slowT = Math.max(0, this.slowT - dt);
    this.flashT -= dt;
    if (this.flashT <= 0) { if (this.slowT > 0) this.setTint(0x9be7ff); else this.clearTint(); }
    this.anims.timeScale = this.slowT > 0 ? ICE_SLOW.factor : 1;

    if (this.spawnT > 0) {
      this.spawnT -= dt;
      this.setAlpha(1 - Math.max(0, this.spawnT) / this.spawnMax);
      return;
    }
    this.turnLock -= dt;
    if (this.stunT > 0) { // atordoado: perde a ação, desliza com o empurrão e volta ao normal
      this.stunT -= dt;
      this.tele = 0;
      if (this.def.gravity) this.setVelocityX(this.body.velocity.x * Math.exp(-6 * dt));
      this.anim('idle');
      this.setFlipX(this.facing < 0);
      this.updateGlow();
      return;
    }
    this.behave(this.slowT > 0 ? dt * ICE_SLOW.factor : dt);
    if (this.turnLock > 0) this.facing = this.lockFacing;   // rolaram por ele: continua olhando para o outro lado
    this.setFlipX(this.facing < 0);
    this.updateGlow();
    // Sem dano ao encostar (como no Dead Cells): só ataques com sinal antes machucam.
  }

  flashHit() { this.flashT = 0.06; this.setTintFill(0xffffff); }

  // golpe forte interrompe o que ele estava fazendo (chefe e brutamontes têm armadura)
  stagger(time, knock = 0) {
    this.stunT = Math.max(this.stunT, time);
    this.tele = 0;
    this.fireT = Math.max(this.fireT, 0.7);
    if (this.def.gravity) this.setVelocityX(knock);
    this.onStagger();
  }
  onStagger() {}

  // atira com "telegrafia": brilha por teleTime segundos antes, para o player poder reagir
  enemyFire(dt, teleTime, cdMin, cdMax, fn) {
    if (!this.entered) return;
    if (this.tele > 0) {
      this.tele -= dt;
      if (this.tele <= 0) { fn(); this.fireT = Phaser.Math.FloatBetween(cdMin, cdMax); }
    } else {
      this.fireT -= dt;
      if (this.fireT <= 0) { this.tele = teleTime; this.teleMax = teleTime; }
    }
  }

  updateGlow() {
    if (this.tele > 0) {
      const m = this.muzzle(), k = 1 - this.tele / this.teleMax;
      this.glow.setVisible(true).setPosition(m.x, m.y).setScale(0.2 + k * 0.7).setTint(this.glowColor);
    } else this.glow.setVisible(false);
  }

  muzzle() { return { x: this.x, y: this.y - this.body.height / 2 }; }

  aim(x, y, speed, kind, off = 0) {
    const c = this.player.body.center;
    const a = Math.atan2(c.y - y, c.x - x) + off;
    return this.scene.enemyShot(x, y, Math.cos(a) * speed, Math.sin(a) * speed, kind);
  }

  // anda mantendo distância do player; entra na tela se nasceu fora dela
  walker(near, far) {
    const s = this.scene, d = this.player.x - this.x, hw = this.body.width / 2;
    let mv = 0;
    if (!this.entered) {
      mv = this.x < s.camX + GAME_W / 2 ? 1 : -1;
      this.facing = mv;
      if (this.x - hw > s.camX + 10 && this.x + hw < s.camX + GAME_W - 10) this.entered = true;
    } else {
      this.facing = d < 0 ? -1 : 1;
      if (this.tele <= 0) {
        const ad = Math.abs(d);
        if (ad > far) mv = Math.sign(d); else if (ad < near) mv = -Math.sign(d);
      }
    }
    this.setVelocityX(mv * this.def.speed * (this.speedMul || 1) * (this.slowT > 0 ? ICE_SLOW.factor : 1));
    if (this.entered) this.x = Phaser.Math.Clamp(this.x, s.camX + hw + 5, s.camX + GAME_W - hw - 5);
    this.walking = mv !== 0;
  }

  kill() {
    this.dead = true;
    this.body.enable = false;
    this.setActive(false).setVisible(false);
    this.glow.setVisible(false);
    this.scene.time.delayedCall(0, () => this.destroy());
  }

  destroy(fromScene) {
    if (this.glow) this.glow.destroy();
    super.destroy(fromScene);
  }
}
