/* 
 * Portions copyright 2020, James Kemp.
 * Portions copyright 2020, Justin Reardon.
*/

import Climber from "../Prefabs/Climber";


export default class MainGame extends Phaser.Scene {
  /**
   * Unique name of the scene.
   */
  public static Name = "MainGame";
  animations: Phaser.Animations.Animation[];
  climber: Climber;
  keyA: Phaser.Input.Keyboard.Key;
  keyB: Phaser.Input.Keyboard.Key;
  keyPressedA: boolean;
  keyPressedB: boolean;

  public preload(): void {
    // Preload as needed.
    this.animations = this.anims.createFromAseprite('climber');
  }

  public create(): void {
    this.matter.world.setBounds(0, 0, this.cameras.main.width, this.cameras.main.height);

    const floor = this.add.rectangle(this.cameras.main.width / 2, this.cameras.main.height - 5, this.cameras.main.width, 5, 0xffff00);
    this.addWall(100, 500);
    this.addWall(300, 400);
    this.addWall(100, 300);
    this.addWall(300, 200, 300);
    this.matter.add.gameObject(floor, { isStatic: true });

    this.climber = new Climber(this.matter.world, 108, 510);
    this.climber.setFacing("right");


    // Setup event listeners
    this.keyA = this.input.keyboard.addKey("SPACE");
    this.keyA.on("up", () => this.keyPressedA = true, this);
    this.keyB = this.input.keyboard.addKey("SHIFT");
    this.keyB.on("up", () => this.keyPressedA = true, this);
  }

  public update() {
    this.climber.update(
      this.keyPressedA ? "pressed" : undefined,
      this.keyPressedB ? "pressed" : undefined
    );

    this.keyPressedA = false;
    this.keyPressedB = false;
  }

  public destroy() {
    this.climber.destroy();
  }

  private addWall(x: number, y: number, length = 50) {
    const rect = this.add.rectangle(x, y, 5, length, 0xffff00);
    this.matter.add.gameObject(rect, {
      isStatic: true,
      friction: 1,
      frictionStatic: 700
    });
    return rect;
  }

  pressingA(): boolean {
    return this.input.keyboard.checkDown(this.keyA);
  }

  pressingB(): boolean {
    return this.input.keyboard.checkDown(this.keyB);
  }
}
