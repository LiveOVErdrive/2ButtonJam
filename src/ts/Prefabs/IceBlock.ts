/* 
 * copyright 2020, Justin Reardon.
*/

import { CollisionEvent, CollisionCategories, matterCollision } from "../Collisions";

const msBeforeFlash = 1000;
const msBeforeCrumble = 2000;
const msBeforeFall = msBeforeCrumble + 200;

export default class IceBlock extends Phaser.Physics.Matter.Sprite {
  private lastTouch: number | undefined = undefined;
  private crumbled = false;

  constructor(world: Phaser.Physics.Matter.World, x: number, y: number) {
    super(world, x, y, 'iceblock', 0, {
      chamfer: { radius: 4 },
      isStatic: true,
      friction: 0,
      collisionFilter: {
        category: CollisionCategories.Solid | CollisionCategories.Grabbable,
        group: 0,
        mask: CollisionCategories.Player
      }
    });

    world.scene.add.existing(this);
    this.setFixedRotation();
    this.setIgnoreGravity(true);

    matterCollision(world.scene).addOnCollideStart({
      objectA: this,
      callback: this.onTouched,
      context: this
    });

    matterCollision(world.scene).addOnCollideActive({
      objectA: this,
      callback: this.onTouched,
      context: this
    });

    matterCollision(world.scene).addOnCollideEnd({
      objectA: this,
      callback: this.onTouchStopped,
      context: this
    });

    this.scene.events.on('update', this.update, this);
  }

  update() {
    if (!this.crumbled && this.lastTouch && this.lastTouch + msBeforeFlash < this.scene.time.now) {
      this.play({ key: "flashing", repeat: 5 });
      this.scene.time.delayedCall(msBeforeCrumble, () => {
        this.setDepth(1);
        this.play("crumble");
      }, undefined, this);
      this.scene.time.delayedCall(msBeforeFall, () => {
        this.setCollidesWith(0);
        this.setIgnoreGravity(false);
        this.setStatic(false);
      }, undefined, this);
      this.crumbled = true;
    }
  }

  onTouched({ bodyA, bodyB, pair }: CollisionEvent) {
    if (this.lastTouch) {
      return;
    }

    // Make touches that happened at about the same time happen at the same time.
    this.lastTouch = Math.floor(this.scene.time.now / 100) * 100;
  }

  onTouchStopped({ bodyA, bodyB, pair }: CollisionEvent) {
    this.lastTouch = undefined;
  }

}