import Utilities from "../Utilities";

type Facing = "left" | "right";
type State = "clinging" | "prepping" | "jumping";
type KeyState = "pressed" | "holding" | undefined;

export default class Climber extends Phaser.Physics.Matter.Sprite {

  facing: Facing;
  state: State;
  sensors: { bottom: MatterJS.BodyType; left: MatterJS.BodyType; right: MatterJS.BodyType; };
  isTouching: { left: boolean; right: boolean; ground: boolean; };

  constructor(world: Phaser.Physics.Matter.World, x: number, y: number) {
    const w = 32;
    const h = 32;
    const mainBody = world.scene.matter.bodies.rectangle(w / 2, h / 2, 24, 30, {
      chamfer: { radius: 10 },
      friction: 1
    });
    const sensors = {
      bottom: world.scene.matter.bodies.rectangle(w / 2, h - 1, w * 0.25, 2, { isSensor: true }),
      left: world.scene.matter.bodies.rectangle(4, h / 2 - 8, 4, h * 0.25, { isSensor: true }),
      right: world.scene.matter.bodies.rectangle(28, h / 2 - 8, 4, h * 0.25, { isSensor: true })
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
    world.scene.matter.world.on("beforeupdate", this.resetTouching, this);

    // Setup initial state
    this.enterStateClinging();
  }

  update(keyA: KeyState, keyB: KeyState) {
    if (this.isTouching.left && !this.isTouching.right && !this.isTouching.ground) {
      this.setFacing("right");
    } else if (!this.isTouching.left && this.isTouching.right && !this.isTouching.ground) {
      this.setFacing("left");
    }

    switch (this.state) {
      case "clinging":
        if (keyA === "pressed") {
          this.enterStatePrepping();
        } else if (!this.isTouching.left && !this.isTouching.right) {
          this.enterStateFalling();
        }
        break;
      case "prepping":
        if (keyB === "pressed") {
          this.enterStateClinging()
        } else if (keyA === "pressed") {
          this.enterStateJumping();
        } else if (!this.isTouching.left && !this.isTouching.right) {
          this.enterStateFalling();
        }
        break;
      case "jumping":
        if (this.isTouching.left || this.isTouching.right) {
          this.enterStateClinging();
        }
    }
  }

  private enterStateClinging() {
    this.state = "clinging";
    this.play({ key: 'Idle', repeat: -1, repeatDelay: 2000 });
    this.setIgnoreGravity(true);
  }

  private enterStatePrepping(): void {
    this.state = "prepping";
    this.play('preppingJump');
    this.setIgnoreGravity(true);
  }

  enterStateJumping() {
    this.state = "jumping";
    this.play('Jump');
    this.setIgnoreGravity(false);

    const direction = this.facing === "left" ? -1 : 1;
    this.applyForce(new Phaser.Math.Vector2(direction * 0.02, -0.02));
  }

  enterStateFalling() {
    this.state = "jumping";
    this.play('Jump');
    this.setIgnoreGravity(false);
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

  resetTouching() {
    this.isTouching.left = false;
    this.isTouching.right = false;
    this.isTouching.ground = false;
  }

  onSensorCollide({ bodyA, bodyB, pair }: { bodyA: MatterJS.BodyType, bodyB: MatterJS.BodyType, pair: MatterJS.ICollisionPair }) {
    // Watch for the player colliding with walls/objects on either side and the ground below, so
    // that we can use that logic inside of update to move the player.
    if (bodyB.isSensor) return; // We only care about collisions with physical objects
    if (bodyA === this.sensors.left) {
      this.isTouching.left = true;
      if (pair.separation < 2) this.x -= 1;
    } else if (bodyA === this.sensors.right) {
      this.isTouching.right = true;
      if (pair.separation < 2) this.x += 1;
    } else if (bodyA === this.sensors.bottom) {
      this.isTouching.ground = true;
    }
  }

  destroy() {
    if (this.scene.matter.world) {
      this.scene.matter.world.off("beforeupdate", this.resetTouching, this);
    }
  }
}

