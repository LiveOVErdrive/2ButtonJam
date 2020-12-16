/* 
 * copyright 2020, Justin Reardon.
*/

export class CollisionGroups {
  static Player = 1;
  static Wall = 2;
  static Ice = 4;
  static Spike = 8;

  static SolidObjects =
    CollisionGroups.Spike |
    CollisionGroups.Wall |
    CollisionGroups.Ice;

  static Grabbable =
    CollisionGroups.Wall |
    CollisionGroups.Ice;
}

export type CollisionEvent = {
  bodyA: MatterJS.BodyType,
  bodyB: MatterJS.BodyType,
  pair: MatterJS.ICollisionPair
};

export function matterCollision(scene: Phaser.Scene & any): any {
  return scene.matterCollision;
}