import Utilities from "../Utilities";

type Facing = "left" | "right";

export default class Climber extends Phaser.Physics.Matter.Sprite {

  facing: Facing;
  sensors: { bottom: MatterJS.BodyType; left: MatterJS.BodyType; right: MatterJS.BodyType; };
  isTouching: { left: boolean; right: boolean; ground: boolean; };

  constructor(world: Phaser.Physics.Matter.World, x: number, y: number) {
    const w = 32;
    const h = 32;
    const mainBody = world.scene.matter.bodies.rectangle(w / 2, h / 2, 22, 30, {
      chamfer: { radius: 10 },
      frictionStatic: 1000,
      frictionAir: 0.1,
      friction: 1,
    });
    const sensors = {
      bottom: world.scene.matter.bodies.rectangle(w / 2, h - 1, w * 0.25, 2, { isSensor: true }),
      left: world.scene.matter.bodies.rectangle(4, h / 2, 2, h * 0.5, { isSensor: true }),
      right: world.scene.matter.bodies.rectangle(27, h / 2, 2, h * 0.5, { isSensor: true })
    };

    super(world, 0, 0, 'climber', undefined, {
      parts: [mainBody, sensors.bottom, sensors.left, sensors.right]
    });

    world.scene.add.existing(this);
    this.setFixedRotation();
    this.setPosition(x, y);

    this.sensors = sensors;
    Utilities.matterCollision(world.scene).addOnCollideStart({
      objectA: [this.sensors.bottom, this.sensors.left, this.sensors.right],
      callback: this.onSensorCollide,
      context: this
    });
    Utilities.matterCollision(world.scene).addOnCollideActive({
      objectA: [this.sensors.bottom, this.sensors.left, this.sensors.right],
      callback: this.onSensorCollide,
      context: this
    });

    // Track which sensors are touching something
    this.isTouching = { left: false, right: false, ground: false };

    this.play({ key: 'Idle', repeat: -1 });
    this.setFacing("left");

  }

  update() {
    this.setIgnoreGravity(this.isTouching.left || this.isTouching.right);
  }


  setFacing(facing: Facing) {
    this.facing = facing;
    switch (facing) {
      case "left":
        this.flipX = false;
        this.displayOriginX = 22;
        break;
      case "right":
        this.flipX = true;
        this.displayOriginX = 11;
        break;
    }
  }
  onSensorCollide({ bodyA, bodyB, pair }: { bodyA: MatterJS.BodyType, bodyB: MatterJS.BodyType, pair: MatterJS.ICollisionPair }) {
    // Watch for the player colliding with walls/objects on either side and the ground below, so
    // that we can use that logic inside of update to move the player.
    // Note: we are using the "pair.separation" here. That number tells us how much bodyA and bodyB
    // overlap. We want to teleport the sprite away from walls just enough so that the player won't
    // be able to press up against the wall and use friction to hang in midair. This formula leaves
    // 0.5px of overlap with the sensor so that the sensor will stay colliding on the next tick if
    // the player doesn't move.
    if (bodyB.isSensor) return; // We only care about collisions with physical objects
    if (bodyA === this.sensors.left) {
      this.isTouching.left = true;
    } else if (bodyA === this.sensors.right) {
      this.isTouching.right = true;
    } else if (bodyA === this.sensors.bottom) {
      this.isTouching.ground = true;
    }
  }
}

