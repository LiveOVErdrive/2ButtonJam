import { BodyType } from "matter";
import Utilities from "../Utilities";

type Facing = "left" | "right";
type State = "clinging" | "prepping" | "jumping";
type KeyState = "pressed" | "holding" | undefined;

export default class Climber extends Phaser.Physics.Matter.Sprite {

  facing: Facing;
  state: State;
  sensors: { bottom: MatterJS.BodyType; left: MatterJS.BodyType; right: MatterJS.BodyType; };
  isTouching: { left: boolean; right: boolean; ground: boolean; };
  hangingConstraint: MatterJS.ConstraintType | undefined;
  touchingAt: Phaser.Types.Math.Vector2Like | undefined;

  constructor(world: Phaser.Physics.Matter.World, x: number, y: number) {
    const w = 32;
    const h = 32;
    const mainBody = world.scene.matter.bodies.rectangle(w / 2, h / 2, 24, 30, {
      chamfer: { radius: 10 },
      friction: 0.001
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

    this.touchingAt = new Phaser.Math.Vector2(x, y);
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
    this.replaceHangingConstraint(this.touchingAt);
  }

  private enterStatePrepping(): void {
    this.state = "prepping";
    this.play('preppingJump');
  }

  enterStateJumping() {
    this.state = "jumping";
    this.play('Jump');
    this.replaceHangingConstraint();

    const direction = this.facing === "left" ? -1 : 1;
    this.applyForce(new Phaser.Math.Vector2(direction * 0.02, -0.02));
  }

  enterStateFalling() {
    this.state = "jumping";
    this.play('Jump');
    this.replaceHangingConstraint();
  }

  private replaceHangingConstraint(position?: Phaser.Types.Math.Vector2Like) {
    if (this.hangingConstraint) {
      this.scene.matter.world.removeConstraint(this.hangingConstraint);
    }

    this.hangingConstraint = position ?
      this.scene.matter.add.worldConstraint(<BodyType>this.body, 14, 0.9, { pointA: position }) :
      undefined;
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
    let touchPoint: any | undefined = undefined;
    if (bodyB.isSensor) return; // We only care about collisions with physical objects
    if (bodyA === this.sensors.left) {
      this.isTouching.left = true;
      touchPoint = pair.activeContacts.length > 0 ? pair.activeContacts[0] : undefined;
    } else if (bodyA === this.sensors.right) {
      this.isTouching.right = true;
      touchPoint = pair.activeContacts.length > 0 ? pair.activeContacts[0] : undefined;
    } else if (bodyA === this.sensors.bottom) {
      this.isTouching.ground = true;
    }

    if (touchPoint) {
      // Phaser seems to have the wrong type definition for these. Need to access vertex.
      this.touchingAt = new Phaser.Math.Vector2(touchPoint.vertex.x, touchPoint.vertex.y);
    }
  }

  destroy() {
    if (this.scene.matter.world) {
      this.scene.matter.world.off("beforeupdate", this.resetTouching, this);
    }
  }
}

