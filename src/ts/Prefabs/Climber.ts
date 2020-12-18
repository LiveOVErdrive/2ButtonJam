/* 
 * copyright 2020, Justin Reardon.
*/

import { BodyType } from "matter";
import { CollisionEvent, CollisionCategories, matterCollision } from "../Collisions";

type Facing = "left" | "right" | "down" | "up";
type State = "clinging" | "hanging" | "standing" | "prepping" | "jumping" | "climbing" | "dead";
type KeyState = "pressed" | "holding" | undefined;

export default class Climber extends Phaser.Physics.Matter.Sprite {

  facing: Facing;
  state: State;
  sensors: { bottom: MatterJS.BodyType; top: MatterJS.BodyType; left: MatterJS.BodyType; right: MatterJS.BodyType; };
  isTouching: { left: boolean; right: boolean; top: boolean; ground: boolean; };
  hangingConstraint: MatterJS.ConstraintType | undefined;
  touchingAt: Phaser.Math.Vector2 | undefined;
  aimer: Phaser.GameObjects.Image;
  aimingDisplay: Phaser.Tweens.Tween | undefined;
  lastJump: number;

  constructor(world: Phaser.Physics.Matter.World, x: number, y: number) {
    const w = 32;
    const h = 40;
    const mainBody = world.scene.matter.bodies.rectangle(w / 2, h / 2, 24, 32, {
      chamfer: { radius: 10 },
      collisionFilter: {
        category: CollisionCategories.Player,
        group: 0,
        mask: CollisionCategories.Solid | CollisionCategories.Fatal | CollisionCategories.Item
      }
    });
    const sensorSettings: MatterJS.IChamferableBodyDefinition = {
      isSensor: true,
      collisionFilter: {
        category: CollisionCategories.Player,
        group: 0,
        mask: CollisionCategories.Grabbable | CollisionCategories.Hangable
      }
    };
    const sensors = {
      bottom: world.scene.matter.bodies.rectangle(w / 2, h - 5, w * 0.25, 2, sensorSettings),
      top: world.scene.matter.bodies.rectangle(w / 2, 3, w * 0.6, 4, sensorSettings),
      left: world.scene.matter.bodies.rectangle(4, h / 2 - 6, 4, h * 0.35, sensorSettings),
      right: world.scene.matter.bodies.rectangle(28, h / 2 - 6, 4, h * 0.35, sensorSettings)
    };

    super(world, 0, 0, 'climber', undefined, {
      parts: [mainBody, sensors.bottom, sensors.top, sensors.left, sensors.right],
      friction: 0,
      frictionStatic: 0.0,
      slop: 0.01,
      restitution: 0
    });

    world.scene.add.existing(this);
    this.setFixedRotation();
    this.displayOriginY = 22;
    this.setPosition(x, y);

    this.sensors = sensors;
    matterCollision(world.scene).addOnCollideStart({
      objectA: [this.sensors.bottom, this.sensors.top, this.sensors.left, this.sensors.right],
      callback: this.onSensorCollide,
      context: this
    });
    matterCollision(world.scene).addOnCollideActive({
      objectA: [this.sensors.bottom, this.sensors.top, this.sensors.left, this.sensors.right],
      callback: this.onSensorCollide,
      context: this
    });

    // Spikes only collide with the body proper
    matterCollision(world.scene).addOnCollideStart({
      objectA: mainBody,
      callback: this.onBodyCollide,
      context: this
    });

    // Track which sensors are touching something
    this.isTouching = { left: false, right: false, top: false, ground: false };
    world.scene.matter.world.on("beforeupdate", this.resetTouching, this);
    this.aimer = world.scene.add.image(x, y, "aim").setAlpha(0);

    // Setup initial state
    this.enterStateFalling();
    this.lastJump = 0;
  }

  updateAction(keyA: KeyState, keyB: KeyState) {
    if (this.isTouching.top) {
      this.setFacing("down");
    } else if (this.isTouching.left && !this.isTouching.right && !this.isTouching.ground) {
      this.setFacing("right");
    } else if (!this.isTouching.left && this.isTouching.right && !this.isTouching.ground) {
      this.setFacing("left");
    } else if (this.isTouching.ground) {
      this.setFacing("up");
    }

    switch (this.state) {
      case "clinging":
        if (transitionToPreppingKeys(keyA, keyB)) {
          this.enterStatePrepping();
        } else if (keyB === "holding" && this.touchingAt) {
          this.enterStateClimbing(this.touchingAt);
        } else if (!this.isTouching.left && !this.isTouching.right) {
          this.enterStateFalling();
        }
        break;
      case "hanging":
        if (transitionToPreppingKeys(keyA, keyB)) {
          this.enterStatePrepping();
        } else if (!this.isTouching.top) {
          this.enterStateFalling();
        }
        break;
      case "standing":
        if (transitionToPreppingKeys(keyA, keyB)) {
          this.enterStatePrepping();
        } else if (!this.isTouching.ground) {
          this.enterStateFalling();
        }
        break;
      case "prepping":
        if (!keyA) {
          this.enterStateJumping();
        } else if (
          !this.isTouching.left &&
          !this.isTouching.right &&
          !this.isTouching.top &&
          !this.isTouching.ground
        ) {
          this.enterStateFalling();
        }
        break;
      case "jumping":
        this.tryFinishJump();
    }

    // Handle leaving the prepping state.
    if (this.state !== "prepping" && this.aimingDisplay) {
      this.aimingDisplay.stop();
      this.aimingDisplay = undefined;
    }
  }

  private tryFinishJump() {
    if (this.isTouching.top) {
      this.enterStateHanging(true);
    } else if ((this.isTouching.left || this.isTouching.right) && !this.isTouching.ground) {
      this.enterStateClinging(true);
    } else if (this.isTouching.ground) {
      this.enterStateStanding();
    }
  }

  private enterStateClinging(updateConstraint: boolean) {
    this.state = "clinging";
    this.play({ key: 'Idle', repeat: -1, repeatDelay: 2000 });

    if (updateConstraint) {
      this.replaceHangingConstraint(this.touchingAt);
    }
  }

  private enterStateHanging(updateConstraint: boolean) {
    this.state = "hanging";
    this.playAfterRepeat({ key: 'hang', repeat: -1, repeatDelay: 2000 });

    if (updateConstraint) {
      this.replaceHangingConstraint(this.touchingAt);
    }
  }

  private enterStateStanding() {
    this.state = "standing";
    this.play({ key: 'Slide', repeat: -1, repeatDelay: 2000 });
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

        const top = this.getTopCenter();
        if (
          this.scene.matter.intersectRect(climbFrom.x - 2, climbFrom.y - 2, 4, 4).length === 0 ||
          this.scene.matter.intersectPoint(top.x, top.y - 24).length > 0
        ) {
          this.play("Idle")
          this.enterStateClinging(false);
          return;
        }
        const direction = this.facing === "left" ? -1 : 1;
        this.applyForce(new Phaser.Math.Vector2(direction * 0.0, -0.03));

        this.scene.time.delayedCall(
          150,
          () => {
            if (this.state !== "climbing") {
              return;
            }
            this.replaceHangingConstraint(climbFrom);
            this.enterStateClinging(false);
          }
        )
      }
    )
  }

  private enterStatePrepping(): void {

    if (this.state === "clinging") {
      this.play('preppingJump');
    }

    this.state = "prepping";

    let start;
    let stop;
    let length;
    switch (this.facing) {
      case "left":
        start = 90 - 15;
        stop = 270 - 15;
        length = 150;
        break;
      case "right":
        start = 90 - 15;
        stop = -90 + 15;
        length = 150;
        break;
      case "down":
        start = 270 - 15;
        stop = -90 + 15;
        length = 330;
        break;
      case "up":
        start = 180 + 15;
        stop = 360 - 15;
        length = 150;
    }

    const animation = this.scene.tweens.addCounter({
      from: start,
      to: stop,
      duration: length * 5,
      hold: 100,
      yoyo: true,
      repeat: -1,
      onUpdate: (tween: Phaser.Tweens.Tween) => {
        if (!this.aimingDisplay || !this.touchingAt) {
          return;
        }

        const angle = Phaser.Math.DegToRad(tween.getValue());
        const position = new Phaser.Math.Vector2().setToPolar(angle, 50);
        this.aimer.setAlpha(1);
        this.aimer.setPosition(Math.round(position.x + this.touchingAt.x), Math.round(position.y + this.touchingAt.y));
      },
      onUpdateScope: this
    })

    this.aimingDisplay = animation;
  }

  enterStateJumping() {
    this.state = "jumping";
    this.play('Jump');
    this.replaceHangingConstraint();

    if (!this.aimingDisplay) {
      throw new Error("aimingDisplay should not be null when jumping");
    }

    const direction = Phaser.Math.DegToRad(this.aimingDisplay.getValue());
    const jumpForce = new Phaser.Math.Vector2().setToPolar(direction, 0.02);
    if (jumpForce.y > 0) {
      jumpForce.y *= 1;
    } else {
      jumpForce.y = jumpForce.y + -0.01;
    }
    this.applyForce(jumpForce);
    this.lastJump = this.scene.time.now;
    this.scene.tweens.add({
      targets: this.aimer,
      alpha: { from: 1, to: 0 },
      duration: 200
    })
  }

  enterStateFalling() {
    this.state = "jumping";
    this.play('Jump');
    this.replaceHangingConstraint();
  }

  enterStateDead() {
    this.state = "dead";
    this.play('DEATH');
    this.replaceHangingConstraint();
    this.setCollidesWith(0);
    this.setVelocityX(0);
    this.setVelocityY(-2);
  }

  private replaceHangingConstraint(position?: Phaser.Math.Vector2, elasticity = 1) {
    if (this.hangingConstraint) {
      this.scene.matter.world.removeConstraint(this.hangingConstraint);
    }

    if (position) {
      const intersections = this.scene.matter.intersectRect(position.x - 2, position.y - 2, 4, 4);
      if (intersections.length === 0) {
        position = undefined;
      }

      let offsetX = 0;
      let offsetY = 0;
      switch (this.facing) {
        case "down":
          offsetY = -15;
          break;
        case "left":
          offsetX = 11;
          offsetY = -8;
          break;
        case "right":
          offsetX = -11;
          offsetY = -8;
          break;
      }


      this.hangingConstraint = position ?
        this.scene.matter.add.worldConstraint(<BodyType>this.body, 1, elasticity, {
          pointA: new Phaser.Math.Vector2(Math.round(position.x), Math.round(position.y)),
          damping: 1,
          pointB: { x: offsetX, y: offsetY }
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
        this.displayOriginY = 22;
        break;
      case "right":
        this.flipX = true;
        this.displayOriginX = 13;
        this.displayOriginY = 22;
        break;
      case "down":
        this.flipX = true;
        this.displayOriginX = 18;
        this.displayOriginY = 18;
        break;
      case "up":
        this.flipX = true;
        this.displayOriginX = 18;
        this.displayOriginY = 23;
        break;
    }
  }

  resetTouching() {
    this.isTouching.left = false;
    this.isTouching.right = false;
    this.isTouching.ground = false;
    this.isTouching.top = false;
  }

  onSensorCollide({ bodyA, bodyB, pair }: CollisionEvent) {
    // Watch for the player colliding with walls/objects on either side and the ground below, so
    // that we can use that logic inside of update to move the player.
    let touchPoint: any | undefined = undefined;
    let facing: Facing | undefined;
    if (
      // Don't touch anything immediately after jumping.
      this.scene.time.now - 100 < this.lastJump ||
      !(bodyB.collisionFilter.category & (CollisionCategories.Grabbable | CollisionCategories.Hangable | CollisionCategories.Ground))
    ) {
      return; // We only care about collisions with physical objects
    }

    if (bodyB.collisionFilter.category & CollisionCategories.Grabbable) {
      if (bodyA === this.sensors.left) {
        this.isTouching.left = true;
        facing = "right";
      } else if (bodyA === this.sensors.right) {
        this.isTouching.right = true;
        facing = "left";
      }
    } else if (bodyB.collisionFilter.category & CollisionCategories.Hangable) {
      if (bodyA === this.sensors.left || bodyA === this.sensors.right || bodyA === this.sensors.top) {
        facing = "down";
        this.isTouching.top = true;

      }
    }

    if (!facing && bodyA === this.sensors.bottom && (bodyB.collisionFilter.category & CollisionCategories.Ground)) {
      this.isTouching.ground = true;
      facing = "up";
    }

    if (facing) {
      // Find the highest contact point.
      touchPoint = pair.activeContacts.reduce((max: MatterJS.Vector | undefined, x) => !max ? x : (x.y < max.y ? x : max), undefined);
    }

    if (touchPoint) {
      // Phaser seems to have the wrong type definition for these. Need to access vertex.
      this.touchingAt = new Phaser.Math.Vector2(touchPoint.vertex.x, touchPoint.vertex.y);
      if (facing !== "down") {
        if (this.touchingAt.x > bodyB.bounds.min.x && this.touchingAt.x < bodyB.bounds.max.x) {
          const midPoint = bodyB.bounds.min.x / 2 + bodyB.bounds.max.x / 2;
          if (this.touchingAt.x < midPoint) {
            this.touchingAt.x = bodyB.bounds.min.x;
          } else {
            this.touchingAt.x = bodyB.bounds.max.x;
          }
        }
      } else if (facing === "down") {
        if (this.touchingAt.y > bodyB.bounds.min.y && this.touchingAt.y < bodyB.bounds.max.y) {
          this.touchingAt.y = bodyB.bounds.max.y;
        }
      }
    }
  }

  onBodyCollide({ bodyA, bodyB, pair }: CollisionEvent) {
    if (this.state === "dead") {
      return;
    }

    if (bodyB.collisionFilter.category & CollisionCategories.Fatal) {
      this.enterStateDead();
    }
  }

  destroy() {
    if (this.scene.matter.world) {
      this.scene.matter.world.off("beforeupdate", this.resetTouching, this);
    }
  }
}

function transitionToPreppingKeys(keyA: string | undefined, keyB: string | undefined) {
  return keyA === "holding" && !keyB;
}

function steppedRange(start: number, stop: number, step: number) {
  start += step;
  const range: number[] = [];
  while (start != stop) {
    range.push(start);
    start += step;
  }
  return range;
}
