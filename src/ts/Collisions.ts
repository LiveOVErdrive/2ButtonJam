/* 
 * copyright 2020, Justin Reardon.
*/

export class CollisionCategories {
  static Player = 1;
  static Solid = 2;
  static Grabbable = 4;
  static Hangable = 8;
  static Item = 0x40000000;
  static Fatal = 0x80000000;
}

export type CollisionEvent = {
  bodyA: MatterJS.BodyType,
  bodyB: MatterJS.BodyType,
  pair: MatterJS.ICollisionPair
};

export function matterCollision(scene: Phaser.Scene & any): any {
  return scene.matterCollision;
}