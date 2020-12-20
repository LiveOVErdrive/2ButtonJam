/* 
 * Portions copyright 2020, James Kemp.
 * Portions copyright 2020, Justin Reardon.
*/

import 'phaser';
import Boot from "./Scenes/Boot";
import Preloader from "./Scenes/Preloader";
import MainMenu from "./Scenes/MainMenu";
import Level from "./Scenes/Level";
import PhaserMatterCollisionPlugin from "phaser-matter-collision-plugin";
import GameOver from './Scenes/GameOver';
import Victory from './Scenes/Victory';
import BackgroundAudio from './Scenes/BackgroundAudio';

const gameWidth = 640;
const gameHeight = 480;

function gameConfig(debug: boolean): Phaser.Types.Core.GameConfig {
  return {
    width: gameWidth,
    height: gameHeight,
    type: Phaser.AUTO,
    parent: "content",
    title: "Summit",
    render: {
      pixelArt: true
    },
    physics: {
      default: "matter",
      matter: {
        enableSleeping: false,
        debug: debug ? {
          showAxes: false,
          showAngleIndicator: true,
          angleColor: 0xe81153,

          showBroadphase: false,
          broadphaseColor: 0xffb400,

          showBounds: false,
          boundsColor: 0xffffff,

          showVelocity: true,
          velocityColor: 0x00aeef,

          showCollisions: true,
          collisionColor: 0xf5950c,

          showSeparation: false,
          separationColor: 0xffa500,

          showBody: true,
          showStaticBody: true,
          showInternalEdges: true,

          renderFill: false,
          renderLine: true,

          fillColor: 0x106909,
          fillOpacity: 1,
          lineColor: 0x28de19,
          lineOpacity: 1,
          lineThickness: 1,

          staticFillColor: 0x0d177b,
          staticLineColor: 0x1327e4,

          showSleeping: true,
          staticBodySleepOpacity: 1,
          sleepFillColor: 0x464646,
          sleepLineColor: 0x999a99,

          showSensors: true,
          sensorFillColor: 0x0d177b,
          sensorLineColor: 0x1327e4,

          showPositions: true,
          positionSize: 4,
          positionColor: 0xe042da,

          showJoint: true,
          jointColor: 0xe0e042,
          jointLineOpacity: 1,
          jointLineThickness: 2,

          pinSize: 4,
          pinColor: 0x42e0e0,

          springColor: 0xe042e0,

          anchorColor: 0xefefef,
          anchorSize: 4,

          showConvexHulls: false,
          hullColor: 0xd703d0
        } : undefined
      }
    },
    plugins: {
      scene: [
        {
          plugin: PhaserMatterCollisionPlugin, // The plugin class
          key: "matterCollision", // Where to store in Scene.Systems, e.g. scene.sys.matterCollision
          mapping: "matterCollision" // Where to store in the Scene, e.g. scene.matterCollision
        }
      ]
    }
  };
}

export const Levels = 6;

export default class Game extends Phaser.Game {
  constructor(config: Phaser.Types.Core.GameConfig) {

    super(config);

    this.scene.add(Boot.Name, Boot);
    this.scene.add(Preloader.Name, Preloader);
    this.scene.add(BackgroundAudio.Name, BackgroundAudio);
    this.scene.add(MainMenu.Name, MainMenu);
    this.scene.add(Level.Name, Level);
    this.scene.add(GameOver.Name, GameOver);
    this.scene.add(Victory.Name, Victory);
    this.scene.start(Boot.Name);
  }
}

/**
 * Workaround for inability to scale in Phaser 3.
 * From http://www.emanueleferonato.com/2018/02/16/how-to-scale-your-html5-games-if-your-framework-does-not-feature-a-scale-manager-or-if-you-do-not-use-any-framework/
 */
function resize(): void {
  const canvas = document.querySelector("canvas");
  if (!canvas) {
    return;
  }

  const width = window.innerWidth;
  const height = window.innerHeight;
  const wratio = width / height;
  const ratio = Number(gameWidth) / Number(gameHeight);
  if (wratio < ratio) {
    canvas.style.width = width + "px";
    canvas.style.height = (width / ratio) + "px";
  } else {
    canvas.style.width = (height * ratio) + "px";
    canvas.style.height = height + "px";
  }
}

window.onload = (): void => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const game = new Game(gameConfig(false));
  // Uncomment the following two lines if you want the game to scale to fill the entire page, but keep the game ratio.
  resize();
  window.addEventListener("resize", () => resize, true);
};
