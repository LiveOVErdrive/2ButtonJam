import Climber from "./Climber";

declare namespace Phaser.GameObjects {
  interface GameObjectFactory {
    climber(): Climber
  }
}