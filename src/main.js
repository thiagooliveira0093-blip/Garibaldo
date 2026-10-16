import { GAME_W, GAME_H, GRAV } from './config.js';
import BootScene from './scenes/BootScene.js';
import TitleScene from './scenes/TitleScene.js';
import GameScene from './scenes/GameScene.js';
import UIScene from './scenes/UIScene.js';

// Abra com ?debug na URL para ver as hitboxes.
const debug = new URLSearchParams(location.search).has('debug');

window.game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: GAME_W,
  height: GAME_H,
  pixelArt: true,
  backgroundColor: '#000000',
  physics: { default: 'arcade', arcade: { gravity: { y: GRAV }, debug } },
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [BootScene, TitleScene, GameScene, UIScene],
});
