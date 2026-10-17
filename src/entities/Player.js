import { GAME_W } from '../config.js';
import { CHARACTERS, variantOf, aimSetOf, muzzleOf } from '../characters.js';
import { WEAPONS, GEMS } from '../weapons.js';
import { sfx } from '../systems/sfx.js';

// Quadro 96x80. O ponto de origem (pés) fica em x=36, y=79: a hitbox é centrada nele,
// pois o espelhamento do sprite não espelha o corpo de física.
const ORIGIN = { x: 36 / 96, y: 79 / 80 };
// Heróis desenhados em 1,5x para leitura melhor. As hitboxes abaixo estão em pixels do MUNDO
// (a largura vem de characters.js); aqui elas são convertidas para as unidades do sprite.
const SCALE = 1.5;
const STAND_H = 62, CROUCH_H = 40;
const COYOTE_TIME = 0.1, JUMP_BUFFER = 0.12;   // segundos de tolerância do pulo
const ACTIONS = ['attack1', 'attack2'];        // tecla de cada slot de arma (J e K)
const NO_SLOT = -1;

export default class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, charId = 'mage') {
    const char = CHARACTERS[charId];
    super(scene, x, y, `${char.id}-${variantOf(char, 0)}`, 0);
    this.char = char;
    this.weapons = char.weapons.map(id => WEAPONS[id]);
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
      facing: 1, hp: char.stats.hp, maxHp: char.stats.hp, iframes: 0, alive: true, t: 0,
      dashT: 0, rollT: 0, rollCd: 0, dashDodged: false,       // dashT = invulnerável (primeira parte do rolamento)
      dropT: 0, cd: 0, castT: 0, castType: 'ring', charging: false,
      meleeT: 0, meleeHit: true, meleeBuf: 0, comboStep: 0, comboT: 0, curStep: char.sword.combo[0], lungeV: 0,
      chargeSlot: NO_SLOT, charge: 0,
      jumpsLeft: char.stats.airJumps, coyoteT: 0, jumpBufT: 0,
      gem: 0, energy: 0, crouch: false, aimAngle: 0, moving: false, ghostT: 0,
    });
  }

  get onGround() { return this.body.blocked.down; }
  onPlatform() { return !!this.scene.plats.getTileAtWorldXY(this.x, this.y + 4); }
  get gemData() { return GEMS[this.gem]; }
  hasRing() { return this.weapons.some(w => w.type === 'ring'); }
  bonus(type) { return this.char.bonus[type] || 1; }

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

  // gema do Anel (1 / 2 / 3): no mago, o brilho da borda acompanha a cor
  setGem(i) {
    if (i < 0 || i >= GEMS.length || !this.hasRing()) return;
    this.gem = i;
    if (this.rim && this.char.variantByGem) this.rim.color = GEMS[i].color;
  }

  // ---------------------------------------------------------------- loop
  update(dt) {
    const s = this.scene, c = s.controls, st = this.char.stats;
    this.t += dt;
    this.iframes = Math.max(0, this.iframes - dt);
    this.dashT = Math.max(0, this.dashT - dt);
    this.rollT -= dt; this.rollCd -= dt; this.cd -= dt; this.dropT -= dt; this.castT -= dt;
    this.meleeT -= dt; this.comboT -= dt; this.meleeBuf -= dt;
    this.lungeV *= Math.exp(-11 * dt);

    const left = c.held('left'), right = c.held('right'), up = c.held('up'), dn = c.held('down');
    const move = (right ? 1 : 0) - (left ? 1 : 0);

    if (c.just('prev')) this.setGem((this.gem + GEMS.length - 1) % GEMS.length);
    if (c.just('next')) this.setGem((this.gem + 1) % GEMS.length);
    if (c.just('gem1')) this.setGem(0);
    if (c.just('gem2')) this.setGem(1);
    if (c.just('gem3')) this.setGem(2);

    const onGround = this.onGround;
    if (onGround) this.jumpsLeft = st.airJumps;
    if (this.rollT <= 0 && !this.body.allowGravity) this.body.setAllowGravity(true);

    // aperto de rolamento: cancela ataques e dá invulnerabilidade
    if (c.just('roll') && this.rollCd <= 0 && this.rollT <= 0) this.startRoll(move);

    if (this.rollT > 0) {
      const r = this.char.roll;
      this.setVelocity(this.facing * r.speed * (0.65 + 0.35 * (this.rollT / r.time)), 0); // desacelera no fim
      this.ghostT -= dt;
      if (this.ghostT <= 0) { s.fx.ghost(this); this.ghostT = 0.035; }
      s.rollThrough(this);   // rolar por dentro de um inimigo o deixa de costas
    } else {
      this.setCrouch(dn && onGround && this.meleeT <= 0 && this.chargeSlot === NO_SLOT && !up);
      if (move && this.meleeT <= 0) this.facing = move;
      this.moving = move !== 0;
      let factor = 1;
      if (this.meleeT > 0) factor = this.char.sword.moveFactor;
      else if (this.chargeSlot !== NO_SLOT) factor = this.weapons[this.chargeSlot].moveFactor;
      this.setVelocityX(move * (this.crouch ? st.crawl : st.run) * factor + this.lungeV * this.facing);

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
    }

    // não sai da tela
    const minX = s.camX + 20, maxX = s.camX + GAME_W - 20;
    if (this.x < minX) { this.x = minX; if (this.body.velocity.x < 0) this.setVelocityX(0); }
    if (this.x > maxX) { this.x = maxX; if (this.body.velocity.x > 0) this.setVelocityX(0); }

    // mira (arco e anel): cima = vertical, cima + direção = diagonal
    if (up) this.aimAngle = move ? -Math.PI / 4 : -Math.PI / 2;
    else this.aimAngle = 0;

    if (this.rollT <= 0) this.updateWeapons(dt, c);
    if (c.just('special') && this.energy >= 100) s.special();

    this.updateAnim();
  }

  // ---------------------------------------------------------------- rolamento
  startRoll(move) {
    const r = this.char.roll;
    if (move) this.facing = move;
    this.setCrouch(false);
    this.rollT = r.time; this.dashT = r.iframes; this.rollCd = r.time + r.cd; this.dashDodged = false;
    this.cancelAttacks();
    this.body.setAllowGravity(false);
    this.setVelocityY(0);
    this.scene.fx.burst(this.x, this.y - 4, 0xbbbbaa, 6, 110, 0, 300);
    sfx('dash');
  }

  cancelAttacks() {
    this.meleeT = 0; this.meleeBuf = 0; this.lungeV = 0; this.castT = 0;
    this.chargeSlot = NO_SLOT; this.charge = 0;
  }

  // ---------------------------------------------------------------- armas
  canAct() { return this.rollT <= 0; }
  canShoot() { return this.cd <= 0 && this.rollT <= 0 && this.meleeT <= 0; }

  updateWeapons(dt, c) {
    const s = this.scene;

    // golpe de espada: tem prioridade e cancela a carga do arco
    this.weapons.forEach((w, i) => {
      if (w.type === 'melee' && c.just(ACTIONS[i])) { this.chargeSlot = NO_SLOT; this.charge = 0; this.tryMelee(); }
    });
    // um aperto guardado entra assim que o golpe anterior permitir (buffer do combo)
    if (this.meleeBuf > 0 && this.canChain()) { this.meleeBuf = 0; this.startMelee(); }
    // o golpe acerta no quadro do corte, não no início da animação
    if (this.meleeT > 0 && !this.meleeHit && this.curStep.time - this.meleeT >= this.curStep.hitAt) {
      this.meleeHit = true;
      s.meleeStrike(this, this.curStep, this.comboStep);
    }

    // arco em carga: segura para encher, solta para atirar
    if (this.chargeSlot !== NO_SLOT) {
      const w = this.weapons[this.chargeSlot];
      if (this.meleeT > 0) { this.chargeSlot = NO_SLOT; this.charge = 0; return; }
      if (c.held(ACTIONS[this.chargeSlot])) {
        const before = this.charge;
        this.charge = Math.min(w.maxCharge, this.charge + dt);
        if (before < w.maxCharge && this.charge >= w.maxCharge) { // carga total: avisa
          s.fx.burst(this.x + this.facing * 24, this.y - 40, 0xffffff, 8, 160, 0, 300);
          sfx('graze');
        }
      } else this.releaseBow(w);
      return;
    }

    this.weapons.forEach((w, i) => {
      const act = ACTIONS[i];
      if (w.type === 'ring' && c.held(act) && this.canShoot()) this.fireRing(w);
      else if (w.type === 'bow' && c.just(act) && this.canShoot()) { this.chargeSlot = i; this.charge = 0; }
    });
  }

  // --- espada: combo de 3 golpes
  canChain() {
    if (this.rollT > 0) return false;
    if (this.meleeT <= 0) return true;
    const st = this.curStep;
    return this.meleeHit && st.time - this.meleeT >= st.hitAt + 0.05;   // pode encadear logo depois do corte
  }

  tryMelee() {
    if (this.canChain()) this.startMelee(); else this.meleeBuf = 0.2;
  }

  startMelee() {
    const m = this.char.sword;
    // continua o combo se o golpe anterior foi recente; senão volta para o 1º
    this.comboStep = this.comboT > 0 && this.comboStep >= 0 && this.meleeHit ? (this.comboStep + 1) % m.combo.length : 0;
    const st = m.combo[this.comboStep];
    this.curStep = st;
    this.setCrouch(false);
    this.meleeT = st.time; this.meleeHit = false; this.comboT = st.time + 0.3;
    this.castT = 0; this.chargeSlot = NO_SLOT; this.charge = 0;
    this.lungeV = st.lunge;                                   // impulso para a frente
    this.playAnim('melee', true);
    this.anims.timeScale = (6 / this.char.rates.melee) / st.time;   // a animação dura o mesmo que o golpe
    sfx(m.sfx);
  }

  // --- anel: magia teleguiada com o efeito da gema
  fireRing(w) {
    const gem = this.gemData;
    this.cd = w.cd;
    const shot = { ...gem, dmg: gem.dmg * this.bonus('ring'), homing: w.homing };
    this.launch(shot, 'ring', gem.spread);
    this.scene.fx.burst(this.muzzle('ring').x, this.muzzle('ring').y, gem.color, 4, 120, 0, 200);
    sfx(gem.sfx);
  }

  // --- arco: toque = flecha fraca, carga = mais dano e velocidade; carga alta atravessa
  releaseBow(w) {
    const tap = this.charge < w.minCharge, frac = Phaser.Math.Clamp(this.charge / w.maxCharge, 0, 1);
    const pierce = !tap && frac >= w.pierceAt;
    const dmg = (tap ? w.tapDmg : Phaser.Math.Linear(w.tapDmg + 1, w.dmgMax, frac)) * this.bonus('bow');
    const speed = tap ? w.tapSpeed : Phaser.Math.Linear(w.tapSpeed, w.speedMax, frac);
    const shot = {
      kind: 'arrow', color: pierce ? 0xffffff : w.color, dmg, speed, radius: w.radius, sprite: w.sprite,
      solid: true, breaks: true, pierce, life: 1.4, sfx: 'bolt', trail: pierce ? 0xfff4c2 : null,
    };
    this.cd = w.cd;
    this.chargeSlot = NO_SLOT; this.charge = 0;
    this.launch(shot, 'bow');
    sfx('bolt');
  }

  // ---------------------------------------------------------------- mira e disparo
  shoulder() {
    const [dx, dy] = this.crouch ? this.char.shoulder.crouch : this.char.shoulder.stand;
    return { x: this.x + dx * SCALE * this.facing, y: this.y + dy * SCALE };
  }
  aimDir() { return { x: Math.cos(this.aimAngle) * this.facing, y: Math.sin(this.aimAngle) }; }

  // ponta da arma (de onde sai o tiro), acompanhando a mira
  muzzle(type) {
    const [dist, dy] = muzzleOf(this.char, type), sh = this.shoulder(), d = this.aimDir();
    return { x: sh.x + d.x * dist * SCALE, y: sh.y + (dy + d.y * dist) * SCALE };
  }

  launch(shot, type, spread = [0]) {
    const m = this.muzzle(type), d = this.aimDir(), base = Math.atan2(d.y, d.x);
    // animação de ataque (em pé, no chão ou no ar; agachado mantém a pose)
    if (!this.crouch) {
      this.castT = this.char.aimTime; this.castType = type;
      this.playAnim(this.aimAnim(type), true, type === 'ring' ? 2 : 4);   // pula direto para o quadro do disparo
    }
    for (const off of spread) this.scene.firePlayerShot(m.x, m.y, base + off, shot, this.facing);
  }

  // animação de mira de uma arma à distância: horizontal, diagonal ou para cima
  aimAnim(type) { return type + (this.aimAngle < -1.2 ? 'Up' : this.aimAngle < -0.3 ? 'Diag' : ''); }
  aimDirIndex() { return this.aimAngle < -1.2 ? 2 : this.aimAngle < -0.3 ? 1 : 0; }

  // ---------------------------------------------------------------- animação
  // Toca a animação no sheet atual (no mago, o sheet muda de cor com a gema).
  // Ao trocar de gema ou de ângulo de mira no meio de uma animação, continua do mesmo quadro.
  playAnim(name, restart = false, startFrame = 0) {
    const key = `${this.char.id}-${variantOf(this.char, this.gem)}-${name}`;
    const cur = this.anims.currentAnim;
    if (!restart && cur && cur.key === key) return;
    const family = n => n.replace(/(Diag|Up)$/, '');
    const sameBase = !restart && cur && family(cur.key.split('-')[2]) === family(name) && this.anims.currentFrame;
    this.anims.timeScale = 1;
    this.play({ key, startFrame: sameBase ? this.anims.currentFrame.index - 1 : startFrame });
  }

  updateAnim() {
    this.setFlipX(this.facing < 0);
    this.setScale(SCALE, this.rollT > 0 ? SCALE * 0.82 : SCALE);   // agacha no rolamento (a hitbox também diminui)
    const wasCharging = this.charging;
    this.charging = false;
    let anim;
    if (!this.alive) anim = 'dead';
    else if (this.iframes > 1.0) anim = 'hurt';
    else if (this.rollT > 0) anim = 'roll';
    else if (this.meleeT > 0) anim = 'melee';
    else if (this.chargeSlot !== NO_SLOT && !this.crouch) {
      // puxando o arco: o quadro acompanha a carga (0 a 3 = arco cada vez mais esticado)
      const w = this.weapons[this.chargeSlot], set = aimSetOf(this.char, 'bow');
      const idx = Math.min(3, Math.floor((this.charge / w.maxCharge) * 4));
      this.anims.stop();
      this.setFrame(set[this.aimDirIndex()] + idx);
      this.charging = true;
      this.finishAnimFx();
      return;
    } else if (this.castT > 0 && !this.crouch) anim = this.aimAnim(this.castType);
    else if (!this.onGround) anim = this.body.velocity.y < 0 ? 'jump' : 'fall';
    else if (this.crouch) anim = this.moving ? 'crawl' : 'crouch';
    else anim = this.moving ? 'run' : 'idle';
    this.playAnim(anim, wasCharging);
    this.finishAnimFx();
  }

  finishAnimFx() {
    const blink = this.alive && this.iframes > 0 && Math.floor(this.iframes * 18) % 2 === 0;
    this.setAlpha(blink ? 0.25 : 1);
  }

  die() {
    this.alive = false;
    this.setVelocity(0, 0);
    this.setCrouch(false);
    this.cancelAttacks();
    this.body.setAllowGravity(true);
    this.setScale(SCALE);
    this.updateAnim();
  }
}
