import { GAME_W, GAME_H } from '../config.js';

// Fundo em camadas: céu fixo + montanhas e ruínas que andam mais devagar que a câmera.
export function createParallax(scene) {
  scene.add.image(0, 0, 'bg_sky').setOrigin(0).setScrollFactor(0).setDepth(0);
  const far = scene.add.tileSprite(0, 0, GAME_W, GAME_H, 'bg_far').setOrigin(0).setScrollFactor(0).setDepth(1);
  const mid = scene.add.tileSprite(0, 0, GAME_W, GAME_H, 'bg_mid').setOrigin(0).setScrollFactor(0).setDepth(2);
  return {
    update(camX) {
      far.tilePositionX = camX * 0.15;
      mid.tilePositionX = camX * 0.45;
    },
  };
}
