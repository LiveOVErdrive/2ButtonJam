import { BodyType } from "matter";
import Utilities from "../Utilities";

type Facing = "left" | "right";
type State = "clinging" | "prepping" | "jumping" | "climbing";
type KeyState = "pressed" | "holding" | undefined;

export default class Climber extends Phaser.Physics.Matter.Sprite {

  facing: Facing;
  state: State;
  sensors: { bottom: MatterJS.BodyType; left: MatterJS.BodyType; right: MatterJS.BodyType; };
  isTouching: { left: boolean; right: boolean; ground: boolean; };
  hangingConstraint: MatterJS.ConstraintType | undefined;
  touchingAt: Phaser.Math.Vector2 | undefined;

  constructor(world: Phaser.Physics.Matter.World, x: number, y: number) {
    const w = 32;
    const h = 40;
    const mainBody = world.scene.matter.bodies.rectangle(w / 2, h / 2, 24, 30, {
      chamfer: { radius: 10 },
      friction: 0.5
    });
    const sensors = {
      bottom: world.scene.matter.bodies.rectangle(w / 2, h - 5, w * 0.25, 2, { isSensor: true }),
      left: world.scene.matter.bodies.rectangle(4, h / 2 - 8, 4, h * 0.25, { isSensor: true }),
      right: world.scene.matter.bodies.rectangle(28, h / 2 - 8, 4, h * 0.25, { isSensor: true })
    };

    super(world, 0, 0, 'climber', undefined, {
      parts: [mainBody, sensors.bottom, sensors.left, sensors.right]
    });

    world.scene.add.existing(this);
    this.setFixedRotation();
    this.displayOriginY = 22;
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
    this.enterStateClinging(true);
  }

  update(keyA: KeyState, keyB: KeyState) {
    if (this.isTouching.left && !this.isTouching.right && !this.isTouching.ground) {
      this.setFacing("right");
    } else if (!this.isTouching.left && this.isTouching.right && !this.isTouching.ground) {
      this.setFacing("left");
    }

    switch (this.state) {
      case "clinging":
        if (keyA === "holding") {
          this.enterStatePrepping();
        } else if (keyB === "holding" && this.touchingAt) {
          this.enterStateClimbing(this.touchingAt);
        } else if (!this.isTouching.left && !this.isTouching.right) {
          this.enterStateFalling();
        }
        break;
      case "prepping":
        if (keyB === "pressed") {
          this.enterStateClinging(true)
        } else if (keyA !== "holding") {
          this.enterStateJumping();
        } else if (!this.isTouching.left && !this.isTouching.right) {
          this.enterStateFalling();
        }
        break;
      case "jumping":
        if (this.isTouching.left || this.isTouching.right) {
          this.enterStateClinging(true);
        }
    }
  }

  private enterStateClinging(updateConstraint: boolean) {
    this.state = "clinging";
    this.playAfterRepeat({ key: 'Idle', repeat: -1, repeatDelay: 2000 });

    if (updateConstraint) {
      this.replaceHangingConstraint(this.touchingAt);
    }
  }

  private enterStateClimbing(position: Phaser.Math.Vector2) {
    const climbFrom = new Phaser.Math.Vector2(position.x, position.y - 24);


    this.state = "climbing";
    this.play("climb").playAfterRepeat("Idle");
    this.scene.time.delayedCall(
      100,
      () => {
        if (this.state !== "climbing") {
          return;
        }

        if (this.scene.matter.intersectPoint(climbFrom.x, climbFrom.y).length === 0) {
          this.play("Idle")
          this.enterStateClinging(false);
          return;
        }
        this.replaceHangingConstraint(climbFrom, 0.1);

        const direction = this.facing === "left" ? -1 : 1;
        this.applyForce(new Phaser.Math.Vector2(direction * 0.0, -0.03));

        this.scene.time.delayedCall(
          200,
          () => {
            if (this.state !== "climbing") {
              return;
            }
            this.enterStateClinging(true);
          }
        )
      }
    )
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

  private replaceHangingConstraint(position?: Phaser.Math.Vector2, elasticity = 1) {


    if (this.hangingConstraint) {
      this.scene.matter.world.removeConstraint(this.hangingConstraint);
    }

    if (position) {
      const intersections = this.scene.matter.intersectPoint(position.x, position.y);
      if (intersections.length === 0) {
        position = undefined;
      }

      this.hangingConstraint = position ?
        this.scene.matter.add.worldConstraint(<BodyType>this.body, 12, elasticity, {
          pointA: new Phaser.Math.Vector2(Math.round(position.x), Math.round(position.y)),
          damping: 1
        }) :
        undefined;
    } else {
      this.hangingConstraint = undefined;
    }


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
    let facing: Facing | undefined;
    if (bodyB.isSensor) return; // We only care about collisions with physical objects
    if (bodyA === this.sensors.left) {
      this.isTouching.left = true;
      facing = "right";
    } else if (bodyA === this.sensors.right) {
      this.isTouching.right = true;
      facing = "left";
    } else if (bodyA === this.sensors.bottom) {
      this.isTouching.ground = true;
    }

    if (facing) {
      // Find the highest contact point.
      touchPoint = pair.activeContacts.reduce((max: MatterJS.Vector | undefined, x) => !max ? x : (x.y < max.y ? x : max), undefined);
    }

    if (touchPoint) {
      // Phaser seems to have the wrong type definition for these. Need to access vertex.
      this.touchingAt = new Phaser.Math.Vector2(touchPoint.vertex.x, touchPoint.vertex.y);
      if (facing) {
        if (this.touchingAt.x > bodyB.bounds.min.x && this.touchingAt.x < bodyB.bounds.max.x) {
          const midPoint = bodyB.bounds.min.x / 2 + bodyB.bounds.max.x / 2;
          if (this.touchingAt.x < midPoint) {
            this.touchingAt.x = bodyB.bounds.min.x;
          } else {
            this.touchingAt.x = bodyB.bounds.max.x;

          }
        }
      }
    }
  }

  destroy() {
    if (this.scene.matter.world) {
      this.scene.matter.world.off("beforeupdate", this.resetTouching, this);
    }
  }
}

