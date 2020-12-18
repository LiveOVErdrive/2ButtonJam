/* 
 * Portions copyright 2020, James Kemp.
 * Portions copyright 2020, Justin Reardon.
*/

import { CollisionCategories } from "../Collisions";
import Climber from "../Prefabs/Climber";
import IceBlock from "../Prefabs/IceBlock";
import Snowflake from "../Prefabs/Snowflake";

export class LevelConfig {
  constructor(public key: string) { }
}

export default class Level extends Phaser.Scene {
  /**
   * Unique name of the scene.
   */
  public static Name = "Level";
  climber: Climber;
  keyA: Phaser.Input.Keyboard.Key;
  keyB: Phaser.Input.Keyboard.Key;
  keyPressedA: boolean;
  keyPressedB: boolean;

  public preload(): void {
    // Preload as needed.
    this.anims.createFromAseprite('climber');
    this.anims.createFromAseprite('iceblock');
    this.anims.createFromAseprite('snowflake');
    this.cameras.main.zoom = 1;
  }

  public create(levelConfig: LevelConfig): void {
    const map = this.make.tilemap({ key: levelConfig.key });

    const tiles = [
      map.addTilesetImage("cliffs", "cliffs"),
      map.addTilesetImage("spikes", "spikes"),
    ];

    map.createLayer("background", tiles, 0, 0).setAlpha(0.7);

    const cliffsLayer = map.createLayer("cliffs", tiles, 0, 0)
      .setCollisionByProperty({ collides: true });
    cliffsLayer.getTilesWithin().filter(x => x.collides).forEach(tile => {
      if (tile.properties.iceblock) {
        new IceBlock(this.matter.world, 8 + tile.x * 16, 8 + tile.y * 16);
      } else {
        const categories =
          CollisionCategories.Solid |
          (tile.properties.grabbable ? CollisionCategories.Grabbable : 0) |
          (tile.properties.fatal ? CollisionCategories.Fatal : 0);
        this.matter.world.convertTiles([tile], <any>{
          shape: {
            type: 'rectange',
          },
          friction: 0.001,
          chamfer: 2,
          collisionFilter: {
            category: categories,
            group: 0,
            mask: CollisionCategories.Player
          }
        })
      }


    });

    const poles = map.getObjectLayer("objects").objects.forEach(obj => {
      switch (obj.name) {
        case "pole":
          this.matter.add.image(obj.x!, obj.y!, "pole", undefined, <any>{
            shape: {
              type: 'circle',
              radius: 2
            },
            isStatic: true,
            isSensor: true,
            collisionFilter: {
              category: CollisionCategories.Hangable,
              group: 0,
              mask: CollisionCategories.Player
            }
          })
          break;
        case "snowflake":
          new Snowflake(this.matter.world, obj.x!, obj.y!);
          break;
      }
    });

    const camera = this.cameras.main;
    camera.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

    const { x, y } = map.findObject("objects", obj => obj.name === "start");
    this.climber = new Climber(this.matter.world, x!, y!);
    this.climber.setFacing("right");
    camera.startFollow(this.climber, true);
    camera.deadzone = new Phaser.Geom.Rectangle(160, 120, 160, 120);

    // Setup event listeners
    this.keyA = this.input.keyboard.addKey("SPACE");
    this.keyA.on("up", () => this.keyPressedA = true, this);
    this.keyB = this.input.keyboard.addKey("SHIFT");
    this.keyB.on("up", () => this.keyPressedB = true, this);
  }

  public update() {
    this.climber.updateAction(
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
