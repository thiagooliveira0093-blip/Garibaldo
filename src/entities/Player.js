import { GAME_W } from '../config.js';
import { CHARACTERS, variantOf } from '../characters.js';
import { sfx } from '../systems/sfx.js';

// Quadro 96x80. O ponto de origem (pés) fica em x=36, y=79: a hitbox é centrada nele,
// pois o espelhamento do sprite não espelha o corpo de física.
const ORIGIN = { x: 36 / 96, y: 79 / 80 };
// Heróis desenhados em 1,5x para leitura melhor. As hitboxes abaixo estão em pixels do MUNDO
// (a largura vem de characters.js); aqui elas são convertidas para as unidades do sprite.
const SCALE = 1.5;
const STAND_H = 62, CROUCH_H = 40;
const COYOTE_TIME = 0.1, JUMP_BUFFER = 0.12;   // segundos de tolerância do pulo

export default class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, charId = 'mage') {
    const char = CHARACTERS[charId];
    super(scene, x, y, `${char.id}-${variantOf(char, 0)}`, 0);
    this.char = char;
    this.powers = char.powers;
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setOrigin(ORIGIN.x, ORIGIN.y).setScale(SCALE).setDepth(10);
    const w = char.body.w / SCALE;
    this.standBox = { w, h: STAND_H / SCALE, ox: 36 - w / 2, oy: 79 - STAND_H / SCALE };      // base sempre nos pés (y=79)
    this.crouchBox = { w, h: CROUCH_H / SCALE, ox: 36 - w / 2, oy: 79 - CROUCH_H / SCALE };
    this.body.setSize(this.standBox.w, this.standBox.h).setOffset(this.standBox.ox, this.standBox.oy);
    this.body.setMaxVelocity(1000, 900);

    // brilho na borda: destaca o herói contra o cenário (só com WebGL)
    this.rim = this.preFX ? this.preFX.addGlow(char.rim, 2.4, 0, false, 0.1, 9) : null;

    Object.assign(this, {
      facing: 1, hp: char.stats.hp, maxHp: char.stats.hp, iframes: 0, dashT: 0, dashCd: 0, dashDodged: false, dashHits: new Set(),
      dropT: 0, cd: 0, castT: 0, meleeT: 0, meleeCd: 0, meleeHit: true, jumpsLeft: char.stats.airJumps, coyoteT: 0, jumpBufT: 0,
      power: 0, energy: 0, crouch: false, aimAngle: 0, moving: false, ghostT: 0, alive: true, t: 0,
    });
  }

  get onGround() { return this.body.blocked.down; }
  onPlatform() { return !!this.scene.plats.getTileAtWorldXY(this.x, this.y + 4); }
  get weapon() { return this.powers[this.power]; }

  hurtbox() {
    const b = this.body;
    return new Phaser.Geom.Rectangle(b.x + 3, b.y + 4, b.width - 6, b.height - 6);
  }

  setCrouch(c) {
    if (c === this.crouch) return;
    this.crouch = c;
    const b = c ? this.crouchBox : this.standBox;
    this.body.setSize(b.w, b.h, false).setOffset(b.ox, b.oy);
  }

  // no mago o brilho da borda acompanha a cor do poder selecionado
  setPower(i) {
    if (i < 0 || i >= this.powers.length) return;
    this.power = i;
    if (this.rim && this.char.variantByPower) this.rim.color = this.powers[i].color;
  }

  update(dt) {
    const s = this.scene, c = s.controls, st = this.char.stats, dash = this.char.dash, melee = this.char.melee;
    this.t += dt;
    this.iframes = Math.max(0, this.iframes - dt);
    this.dashCd -= dt; this.cd -= dt; this.dropT -= dt; this.castT -= dt;
    this.meleeT -= dt; this.meleeCd -= dt;

    const left = c.held('left'), right = c.held('right'), up = c.held('up'), dn = c.held('down');
    const move = (right ? 1 : 0) - (left ? 1 : 0);

    if (c.just('prev')) this.setPower((this.power + this.powers.length - 1) % this.powers.length);
    if (c.just('next')) this.setPower((this.power + 1) % this.powers.length);
    if (c.just('p1')) this.setPower(0);
    if (c.just('p2')) this.setPower(1);
    if (c.just('p3')) this.setPower(2);

    const onGround = this.onGround;
    if (onGround) this.jumpsLeft = st.airJumps;
    this.setCrouch(dn && onGround && this.dashT <= 0 && this.meleeT <= 0 && !up);

    if (this.dashT > 0) {
      this.dashT -= dt;
      this.body.setAllowGravity(false);
      this.setVelocity(this.facing * dash.speed, 0);
      this.ghostT -= dt;
      if (this.ghostT <= 0) { s.fx.ghost(this); this.ghostT = 0.03; }
      if (dash.hitDmg) s.dashStrike(this);
      if (this.dashT <= 0) this.body.setAllowGravity(true);
    } else {
      if (move) this.facing = move;
      this.moving = move !== 0;
      this.setVelocityX(move * (this.crouch ? st.crawl : st.run) * (this.meleeT > 0 ? melee.moveFactor : 1));

      // Pulo com tolerância: o "coyote time" deixa pular logo depois de sair da borda e o buffer
      // lembra de um aperto de pulo feito um instante antes de pousar.
      if (c.just('jump')) this.jumpBufT = JUMP_BUFFER;
      this.jumpBufT -= dt;
      if (onGround) this.coyoteT = COYOTE_TIME; else this.coyoteT -= dt;
      if (this.jumpBufT > 0 && (onGround || this.coyoteT > 0)) {
        this.jumpBufT = 0; this.coyoteT = 0;
        if (onGround && dn && this.onPlatform()) { this.dropT = 0.25; this.setCrouch(false); } // descer da plataforma
        else { this.setCrouch(false); this.setVelocityY(-st.jump); s.fx.burst(this.x, this.y, 0xbbbbaa, 6, 90); }
      } else if (c.just('jump') && this.jumpsLeft > 0) { // pulo duplo (só com aperto novo, no ar)
        this.jumpsLeft--; this.jumpBufT = 0;
        this.setVelocityY(-st.jump * 0.9);
        s.fx.burst(this.x, this.y - 4, 0xffffff, 8, 140, 0, 350);
        sfx('dash');
      }
      if (!c.held('jump') && this.body.velocity.y < -280) this.setVelocityY(-280); // pulo variável

      if (c.just('dash') && this.dashCd <= 0) {
        if (move) this.facing = move;
        this.setCrouch(false);
        this.dashT = dash.time; this.dashCd = dash.cd; this.dashDodged = false; this.castT = 0; this.meleeT = 0;
        this.dashHits.clear();
        sfx('dash');
      }
    }

    // não sai da tela
    const minX = s.camX + 20, maxX = s.camX + GAME_W - 20;
    if (this.x < minX) { this.x = minX; if (this.body.velocity.x < 0) this.setVelocityX(0); }
    if (this.x > maxX) { this.x = maxX; if (this.body.velocity.x > 0) this.setVelocityX(0); }

    // mira: cima = vertical, cima + direção = diagonal, baixo no ar = para baixo
    if (up) this.aimAngle = move ? -Math.PI / 4 : -Math.PI / 2;
    else if (dn && !onGround) this.aimAngle = Math.PI / 2;
    else this.aimAngle = 0;

    // golpe corpo a corpo: acerta no quadro do corte, não no início da animação
    if (c.just('melee') && this.meleeCd <= 0 && this.dashT <= 0 && this.meleeT <= 0) {
      this.setCrouch(false);
      this.meleeT = melee.time; this.meleeCd = melee.cd; this.meleeHit = false; this.castT = 0;
      this.playAnim('melee', true);
      sfx(melee.sfx);
    }
    if (this.meleeT > 0 && !this.meleeHit && melee.time - this.meleeT >= melee.hitAt) { this.meleeHit = true; s.meleeStrike(this); }

    if (c.held('shoot') && this.cd <= 0 && this.dashT <= 0 && this.meleeT <= 0) this.fire();
    if (c.just('special') && this.energy >= 100) s.special();

    this.updateAnim();
  }

  // ombro de onde sai o ataque (relativo aos pés, medido no sprite)
  shoulder() {
    const [dx, dy] = this.crouch ? this.char.shoulder.crouch : this.char.shoulder.stand;
    return { x: this.x + dx * SCALE * this.facing, y: this.y + dy * SCALE };
  }
  // animação de ataque à distância conforme a mira: horizontal, diagonal ou para cima
  shootAnim() { return this.aimAngle < -1.2 ? 'shootUp' : this.aimAngle < -0.3 ? 'shootDiag' : 'shoot'; }
  aimDir() { return { x: Math.cos(this.aimAngle) * this.facing, y: Math.sin(this.aimAngle) }; }

  fire() {
    const pw = this.weapon, [dist, dy] = this.char.muzzle;
    this.cd = pw.cd;
    const sh = this.shoulder(), d = this.aimDir();
    const ox = sh.x + d.x * dist * SCALE, oy = sh.y + (dy + d.y * dist) * SCALE;
    // animação de ataque (em pé, no chão ou no ar; agachado mantém a pose)
    if (!this.crouch) { this.castT = this.char.shootTime; this.playAnim(this.shootAnim(), true); }
    const base = Math.atan2(d.y, d.x);
    for (const off of pw.spread || [0]) this.scene.firePlayerShot(ox, oy, base + off, pw, this.facing);
    this.scene.fx.burst(ox, oy, pw.color, 4, 120, 0, 200);
    sfx(pw.sfx);
  }

  // Toca a animação no sheet atual (no mago, o sheet muda de cor com o poder).
  // Ao trocar de poder no meio de uma animação, continua do mesmo quadro.
  playAnim(name, restart = false) {
    const key = `${this.char.id}-${variantOf(this.char, this.power)}-${name}`;
    const cur = this.anims.currentAnim;
    if (!restart && cur && cur.key === key) return;
    // shoot, shootDiag e shootUp são a mesma animação em ângulos diferentes: troca mantendo o quadro
    const family = n => (n.startsWith('shoot') ? 'shoot' : n);
    const sameBase = !restart && cur && family(cur.key.split('-')[2]) === family(name) && this.anims.currentFrame;
    this.play({ key, startFrame: sameBase ? this.anims.currentFrame.index - 1 : 0 });
  }

  updateAnim() {
    this.setFlipX(this.facing < 0);
    let anim;
    if (!this.alive) anim = 'dead';
    else if (this.iframes > 1.0) anim = 'hurt';
    else if (this.dashT > 0) anim = 'dash';
    else if (this.meleeT > 0) anim = 'melee';
    else if (this.castT > 0 && !this.crouch) anim = this.shootAnim();
    else if (!this.onGround) anim = this.body.velocity.y < 0 ? 'jump' : 'fall';
    else if (this.crouch) anim = this.moving ? 'crawl' : 'crouch';
    else anim = this.moving ? 'run' : 'idle';
    this.playAnim(anim);
    const blink = this.alive && this.iframes > 0 && Math.floor(this.iframes * 18) % 2 === 0;
    this.setAlpha(blink ? 0.25 : 1);
  }

  die() {
    this.alive = false;
    this.setVelocity(0, 0);
    this.setCrouch(false);
    this.updateAnim();
  }
}
