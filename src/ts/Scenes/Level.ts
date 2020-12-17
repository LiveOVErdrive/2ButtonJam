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
    this.cameras.main.zoom = 2;
  }

  public create(levelConfig: LevelConfig): void {
    const map = this.make.tilemap({ key: levelConfig.key });

    const tiles = [
      map.addTilesetImage("cliffs", "cliffs"),
      map.addTilesetImage("spikes", "spikes"),
    ];

    map.createLayer("background", tiles, 0, 0).setAlpha(0.7);

    const cliffsLayer = map.createLayer("cliffs", tiles[0], 0, 0)
      .setCollisionByProperty({ collides: true });
    this.matter.world.convertTiles(cliffsLayer.getTilesWithin().filter(x => x.collides && x.properties.grabbable), {
      friction: 0.001,
      chamfer: 4,
      collisionFilter: {
        category: CollisionCategories.Solid | CollisionCategories.Grabbable,
        group: 0,
        mask: CollisionCategories.Player
      }
    });
    this.matter.world.convertTiles(cliffsLayer.getTilesWithin().filter(x => x.collides && !x.properties.grabbable), {
      friction: 0.001,
      chamfer: 4,
      collisionFilter: {
        category: CollisionCategories.Solid,
        group: 0,
        mask: CollisionCategories.Player
      }
    });

    const spikesLayer = map.createLayer("spikes", tiles[1], 0, 0)
      .setCollisionByProperty({ collides: true });
    this.matter.world.convertTiles(spikesLayer.getTilesWithin().filter(x => x.collides), {
      friction: 1,
      chamfer: 4,
      isSensor: true,
      collisionFilter: {
        category: CollisionCategories.Solid | CollisionCategories.Fatal,
        group: 0,
        mask: CollisionCategories.Player
      },

    });

    const iceLayer = map.getLayer("ice");
    iceLayer.data.forEach(row => row.filter(t => t.properties.collides).forEach(tile => {
      new IceBlock(this.matter.world, 8 + tile.x * iceLayer.tileWidth, 8 + tile.y * iceLayer.tileHeight);
    }));

    const poles = map.getObjectLayer("objects").objects.forEach(obj => {
      switch (obj.name) {
        case "pole":
          this.matter.add.image(obj.x!, obj.y!, "pole", undefined, <any>{
            shape: {
              type: 'circle',
              radius: 2
            },
            isStatic: true,
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
    camera.deadzone = new Phaser.Geom.Rectangle(100, 100, 200, 100);

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
