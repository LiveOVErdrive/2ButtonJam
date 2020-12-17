/* 
 * copyright 2020, Justin Reardon.
*/

import { CollisionEvent, CollisionCategories, matterCollision } from "../Collisions";

export default class Snowflake extends Phaser.Physics.Matter.Sprite {
  private collected = false;

  constructor(world: Phaser.Physics.Matter.World, x: number, y: number) {
    super(world, x, y, 'snowflake', 0, <any>{
      shape: {
        type: 'circle',
        radius: 7
      },
      isStatic: true,
      isSensor: true,
      collisionFilter: {
        category: CollisionCategories.Item,
        group: 0,
        mask: CollisionCategories.Player
      }
    });

    world.scene.add.existing(this);
    this.play({ key: "Spin", repeat: -1 });

    matterCollision(world.scene).addOnCollideStart({
      objectA: this,
      callback: this.onTouched,
      context: this
    });
  }

  onTouched({ bodyA, bodyB, pair }: CollisionEvent) {
    if (this.collected) {
      return;
    }

    this.collected = true;
    this.setToSleep();
    this.play({ key: "Pickup", hideOnComplete: true });
    this.scene.data.inc('snowflakes')
  }

}