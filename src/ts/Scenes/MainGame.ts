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
    const map = this.make.tilemap({ key: "level1" });

    const tileset = map.addTilesetImage("cliffs", "cliffs");

    const backgroundLayer = map.createLayer("background", tileset, 0, 0).setAlpha(0.7);
    const cliffsLayer = map.createLayer("cliffs", tileset, 0, 0);
    cliffsLayer.setCollisionByProperty({ collides: true });
    this.matter.world.convertTiles(cliffsLayer.getTilesWithin().filter(x => x.collides), {
      friction: 0.001
    });

    const camera = this.cameras.main;
    camera.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

    const { x, y } = map.findObject("objects", obj => obj.name === "start");
    this.climber = new Climber(this.matter.world, x!, y!);
    this.climber.setFacing("right");
    camera.startFollow(this.climber, true);
    camera.deadzone = new Phaser.Geom.Rectangle(100, 100, 600, 400);

    // Setup event listeners
    this.keyA = this.input.keyboard.addKey("SPACE");
    this.keyA.on("up", () => this.keyPressedA = true, this);
    this.keyB = this.input.keyboard.addKey("SHIFT");
    this.keyB.on("up", () => this.keyPressedB = true, this);
  }

  public update() {
    this.climber.update(
      this.keyPressedA ? "pressed" : this.keyA.isDown ? "holding" : undefined,
      this.keyPressedB ? "pressed" : this.keyB.isDown ? "holding" : undefined
    );

    this.keyPressedA = false;
    this.keyPressedB = false;
  }

  public destroy() {
    this.climber.destroy();
  }

  pressingA(): boolean {
    return this.input.keyboard.checkDown(this.keyA);
  }

  pressingB(): boolean {
    return this.input.keyboard.checkDown(this.keyB);
  }
}
