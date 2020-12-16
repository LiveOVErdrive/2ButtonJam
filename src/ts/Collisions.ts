/* 
 * copyright 2020, Justin Reardon.
*/

export const CollisionGroups = {
  Player: 1,
  Wall: 2,
  Ice: 4
}

export type CollisionEvent = {
  bodyA: MatterJS.BodyType,
  bodyB: MatterJS.BodyType,
  pair: MatterJS.ICollisionPair
};

export function matterCollision(scene: Phaser.Scene & any): any {
  return scene.matterCollision;
}