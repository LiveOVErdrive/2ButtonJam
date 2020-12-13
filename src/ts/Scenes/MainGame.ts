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
    this.addWall(300, 200);
    this.matter.add.gameObject(floor, { isStatic: true });

    this.climber = new Climber(this.matter.world, 108, 500);
    this.climber.setFacing("right");

  }

  public update() {
    this.climber.update();
  }

  private addWall(x: number, y: number) {
    this.matter.add.gameObject(this.add.rectangle(x, y, 5, 50, 0xffff00), {
      isStatic: true,
      friction: 1
    });
  }
}
