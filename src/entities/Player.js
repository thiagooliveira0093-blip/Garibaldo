import { GAME_W, RUN, CRAWL, JUMP, DASH_SPEED, DASH_TIME, DASH_CD, POWERS, PLAYER_HP } from '../config.js';
import { sfx } from '../systems/sfx.js';

// Quadro 96x80. O ponto de origem (pés) fica em x=36, y=79: a hitbox é centrada nele,
// pois o espelhamento do sprite não espelha o corpo de física.
const ORIGIN = { x: 36 / 96, y: 79 / 80 };
const STAND = { w: 20, h: 50, ox: 26, oy: 29 };
const CROUCH = { w: 20, h: 32, ox: 26, oy: 47 };
const CAST_TIME = 0.3; // duração da animação de lançar magia

export default class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'player-fire', 0);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setOrigin(ORIGIN.x, ORIGIN.y).setDepth(10);
    this.body.setSize(STAND.w, STAND.h).setOffset(STAND.ox, STAND.oy);
    this.body.setMaxVelocity(1000, 900);

    Object.assign(this, {
      facing: 1, hp: PLAYER_HP, maxHp: PLAYER_HP, iframes: 0, dashT: 0, dashCd: 0, dashDodged: false,
      dropT: 0, cd: 0, castT: 0, power: 0, energy: 0, crouch: false, aimAngle: 0, moving: false, ghostT: 0, alive: true, t: 0,
    });
  }

  get onGround() { return this.body.blocked.down; }
  onPlatform() { return !!this.scene.plats.getTileAtWorldXY(this.x, this.y + 4); }

  hurtbox() {
    const b = this.body;
    return new Phaser.Geom.Rectangle(b.x + 3, b.y + 4, b.width - 6, b.height - 6);
  }

  setCrouch(c) {
    if (c === this.crouch) return;
    this.crouch = c;
    const b = c ? CROUCH : STAND;
    this.body.setSize(b.w, b.h, false).setOffset(b.ox, b.oy);
  }

  setPower(i) { this.power = i; }

  update(dt) {
    const s = this.scene, c = s.controls;
    this.t += dt;
    this.iframes = Math.max(0, this.iframes - dt);
    this.dashCd -= dt; this.cd -= dt; this.dropT -= dt; this.castT -= dt;

    const left = c.held('left'), right = c.held('right'), up = c.held('up'), dn = c.held('down');
    const move = (right ? 1 : 0) - (left ? 1 : 0);

    if (c.just('prev')) this.setPower((this.power + 2) % 3);
    if (c.just('next')) this.setPower((this.power + 1) % 3);
    if (c.just('p1')) this.setPower(0);
    if (c.just('p2')) this.setPower(1);
    if (c.just('p3')) this.setPower(2);

    const onGround = this.onGround;
    this.setCrouch(dn && onGround && this.dashT <= 0 && !up);

    if (this.dashT > 0) {
      this.dashT -= dt;
      this.body.setAllowGravity(false);
      this.setVelocity(this.facing * DASH_SPEED, 0);
      this.ghostT -= dt;
      if (this.ghostT <= 0) { s.fx.ghost(this); this.ghostT = 0.03; }
      if (this.dashT <= 0) this.body.setAllowGravity(true);
    } else {
      if (move) this.facing = move;
      this.moving = move !== 0;
      this.setVelocityX(move * (this.crouch ? CRAWL : RUN));

      if (c.just('jump') && onGround) {
        if (dn && this.onPlatform()) { this.dropT = 0.25; this.setCrouch(false); } // descer da plataforma
        else { this.setCrouch(false); this.setVelocityY(-JUMP); s.fx.burst(this.x, this.y, 0xbbbbaa, 6, 90); }
      }
      if (!c.held('jump') && this.body.velocity.y < -280) this.setVelocityY(-280); // pulo variável

      if (c.just('dash') && this.dashCd <= 0) {
        if (move) this.facing = move;
        this.setCrouch(false);
        this.dashT = DASH_TIME; this.dashCd = DASH_CD; this.dashDodged = false; this.castT = 0;
        sfx('dash');
      }
    }

    // não sai da tela
    const minX = s.camX + 14, maxX = s.camX + GAME_W - 14;
    if (this.x < minX) { this.x = minX; if (this.body.velocity.x < 0) this.setVelocityX(0); }
    if (this.x > maxX) { this.x = maxX; if (this.body.velocity.x > 0) this.setVelocityX(0); }

    // mira: cima = vertical, cima + direção = diagonal, baixo no ar = para baixo
    if (up) this.aimAngle = move ? -Math.PI / 4 : -Math.PI / 2;
    else if (dn && !onGround) this.aimAngle = Math.PI / 2;
    else this.aimAngle = 0;

    if (c.held('shoot') && this.cd <= 0 && this.dashT <= 0) this.fire();
    if (c.just('special') && this.energy >= 100) s.special();

    this.updateAnim();
  }

  // ombro de onde sai a magia (relativo aos pés, medido no sprite)
  shoulder() { return { x: this.x + 4 * this.facing, y: this.y + (this.crouch ? -21 : -30) }; }
  aimDir() { return { x: Math.cos(this.aimAngle) * this.facing, y: Math.sin(this.aimAngle) }; }

  fire() {
    const pw = POWERS[this.power];
    this.cd = pw.cd;
    const sh = this.shoulder(), d = this.aimDir();
    // a magia sai da orbe que flutua acima do grimório (~8px acima do ombro)
    const ox = sh.x + d.x * 24, oy = sh.y - 8 + d.y * 24;
    // animação de lançar magia (só em pé no chão; agachado/no ar mantém a pose)
    if (this.onGround && !this.crouch) { this.castT = CAST_TIME; this.playAnim('cast', true); }
    const base = Math.atan2(d.y, d.x);
    const spread = pw.kind === 'bolt' ? [-0.13, 0, 0.13] : [0];
    for (const off of spread) this.scene.firePlayerShot(ox, oy, base + off, pw);
    this.scene.fx.burst(ox, oy, pw.color, 4, 120, 0, 200);
    sfx(pw.kind);
  }

  // Toca a animação no sheet do poder atual (olhos e magia mudam de cor).
  // Ao trocar de poder no meio de uma animação, continua do mesmo quadro.
  playAnim(name, restart = false) {
    const key = `player-${POWERS[this.power].kind}-${name}`;
    const cur = this.anims.currentAnim;
    if (!restart && cur && cur.key === key) return;
    const sameBase = !restart && cur && cur.key.endsWith(`-${name}`) && this.anims.currentFrame;
    this.play({ key, startFrame: sameBase ? this.anims.currentFrame.index - 1 : 0 });
  }

  updateAnim() {
    this.setFlipX(this.facing < 0);
    let anim;
    if (!this.alive) anim = 'player-dead';
    else if (this.iframes > 1.0) anim = 'player-hurt';
    else if (this.dashT > 0) anim = 'player-dash';
    else if (this.castT > 0 && this.onGround && !this.crouch) anim = 'player-cast';
    else if (!this.onGround) anim = this.body.velocity.y < 0 ? 'player-jump' : 'player-fall';
    else if (this.crouch) anim = this.moving ? 'player-crawl' : 'player-crouch';
    else anim = this.moving ? 'player-run' : 'player-idle';
    this.playAnim(anim.slice('player-'.length));
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
