/* 
 * Portions copyright 2020, James Kemp.
 * Portions copyright 2020, Justin Reardon.
*/

import { CollisionCategories, matterCollision } from "../Collisions";
import { Levels } from "../Game";
import Climber from "../Prefabs/Climber";
import IceBlock from "../Prefabs/IceBlock";
import Snowflake, { SnowflakeCount } from "../Prefabs/Snowflake";
import { playSound } from "./BackgroundAudio";
import GameOver from "./GameOver";
import Victory from "./Victory";

export class LevelConfig {
  doneTime: number | undefined;

  constructor(
    public startTime: number,
    public levelNumber: number,
    public snowflakes: number,
    public transitionColor: number) { }
}

type LevelState = "live" | "dead" | "won";

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

  state: LevelState = "live"
  doneGraphics: Phaser.GameObjects.Graphics;
  doneTime: number | undefined = undefined;
  startTime: number | undefined = undefined;
  scoreCamera: Phaser.Cameras.Scene2D.Camera;
  statusContainer: Phaser.GameObjects.Container;
  snowFlakeCount: Phaser.GameObjects.BitmapText;
  elapsedTime: Phaser.GameObjects.BitmapText;
  config: LevelConfig;

  public preload(): void {
    // Preload as needed.
    this.anims.createFromAseprite('climber');
    this.anims.createFromAseprite('iceblock');
    this.anims.createFromAseprite('snowflake');
    this.anims.createFromAseprite('backdrops');
    this.cameras.main.zoom = 1;
  }

  public create(levelConfig: LevelConfig): void {
    this.config = levelConfig;
    this.startTime = undefined;
    this.doneTime = undefined;
    this.state = "live";

    const map = this.loadMap(levelConfig);


    const camera = this.cameras.main;
    camera.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

    const { x, y } = map.findObject("objects", obj => obj.name === "start");
    this.climber = new Climber(this.matter.world, x!, y!);
    this.climber.setFacing("right");
    camera.startFollow(this.climber, true);
    camera.deadzone = new Phaser.Geom.Rectangle(280, 210, 80, 60);
    camera.transparent = false;
    camera.setBackgroundColor(0x92d3ff);

    const progress = (this.config.levelNumber - 1) / Levels;
    const mountainOffset = (progress) * 400;
    // Setup backdrop
    this.add.image(0, mountainOffset, "backdrops", 0)
      .setOrigin(0, 0)
      .setScrollFactor(0.9, 0)
      .setTint(0x888888)
      .setDepth(-1);
    this.add.image(0, mountainOffset - 200 * (1 - progress), "backdrops", 1)
      .setOrigin(0, 0)
      .setScrollFactor(0.9, 0)
      .setTint(0x72a3af)
      .setDepth(-2);
    this.add.image(0, mountainOffset - 400 * (1 - progress), "backdrops", 2)
      .setOrigin(0, 0)
      .setScrollFactor(0.9, 0)
      .setTint(0x82c3ef)
      .setDepth(-4);

    // Clouds need to be tile-able
    // const clouds = this.add.tileSprite(0, 0, 1280, 0, "backdrops", 3)
    //   .setOrigin(0, 0)
    //   .setScrollFactor(0, 0)
    //   .setTint(0xffffff)
    //   .setDepth(-3);

    // this.tweens.add({
    //   targets: clouds,
    //   tilePositionX: { from: 0, to: 1280 },
    //   repeat: -1,
    //   duration: 100000
    // })

    // Setup finish sensor
    this.setupFinish(map.findObject("objects", obj => obj.name === "finish"));

    // Setup event listeners
    this.keyA = this.input.keyboard.addKey("SPACE");
    this.keyA.on("up", () => this.keyPressedA = true, this);
    this.keyB = this.input.keyboard.addKey("SHIFT");
    this.keyB.on("up", () => this.keyPressedB = true, this);

    // Setup status display
    this.statusContainer = this.add.container(0, 0);

    // Setup finish graphic
    this.doneGraphics = this.add.graphics();

    const levelDisplay = this.add.bitmapText(4, 1, "Label", `Stage ${levelConfig.levelNumber}`)
      .setTint(0xffffff);
    this.snowFlakeCount = this.add.bitmapText(110, 1, "Label", "000")
      .setTint(0xffffff)
      .setData(SnowflakeCount, levelConfig.snowflakes);

    this.elapsedTime = this.add.bitmapText(this.cameras.main.width - 6, 1, "Label", "0 s")
      .setTint(0xffffff)
      .setOrigin(1, 0);

    this.statusContainer.add(this.add.image(95, 14, "snowflake"));
    this.statusContainer.add([levelDisplay, this.snowFlakeCount, this.elapsedTime]);
    this.statusContainer.setScrollFactor(0, 0, true)
  }

  private loadMap(levelConfig: LevelConfig) {
    const map = this.make.tilemap({ key: `level${levelConfig.levelNumber}` });

    const tiles = [
      map.addTilesetImage("cliffs", "cliffs"),
      map.addTilesetImage("spikes", "spikes"),
    ];

    map.createLayer("background", tiles, 0, 0);

    const cliffsLayer = map.createLayer("cliffs", tiles, 0, 0)
      .setCollisionByProperty({ collides: true });
    cliffsLayer.getTilesWithin().filter(x => x.collides).forEach(tile => {
      if (tile.properties.iceblock) {
        new IceBlock(this.matter.world, 8 + tile.x * 16, 8 + tile.y * 16);
      } else {
        const categories = CollisionCategories.Solid |
          (tile.properties.grabbable ? CollisionCategories.Grabbable : 0) |
          (tile.properties.ground ? CollisionCategories.Ground : 0) |
          (tile.properties.fatal ? CollisionCategories.Fatal : 0);
        this.matter.world.convertTiles([tile], {
          friction: 0,
          chamfer: { radius: 2 },
          frictionStatic: 0,
          collisionFilter: {
            category: categories,
            group: 0,
            mask: CollisionCategories.Player | CollisionCategories.Solid
          }
        });
      }
    });

    const poles = map.getObjectLayer("objects").objects.forEach(obj => {
      switch (obj.name) {
        case "pole":
          this.matter.add.image(obj.x!, obj.y!, "pole", undefined, <any>{
            shape: {
              type: 'circle',
              radius: 6
            },
            isStatic: true,
            isSensor: true,
            collisionFilter: {
              category: CollisionCategories.Hangable,
              group: 0,
              mask: CollisionCategories.Player
            }
          });
          break;
        case "snowflake":
          new Snowflake(this.matter.world, obj.x!, obj.y!);
          break;
        case "finish":
          const end = this.matter.add.sprite(obj.x!, obj.y!, "endflag");
          end.setCollisionCategory(CollisionCategories.Solid);
          end.setCollidesWith(CollisionCategories.Solid);
      }
    });
    return map;
  }

  private setupFinish(obj: Phaser.Types.Tilemaps.TiledObject) {
    const finishSensor = this.matter.add.rectangle(
      obj.x!,
      obj.y!,
      40,
      54,
      {
        isSensor: true,
        isStatic: true,
        collisionFilter: {
          category: CollisionCategories.Item,
          group: 0,
          mask: CollisionCategories.Player
        }
      }
    );
    matterCollision(this).addOnCollideStart({
      objectA: this.climber,
      objectB: finishSensor,
      callback: this.onFinish,
      context: this
    });
  }

  onFinish() {
    if (this.state === "live") {
      this.state = "won";
      this.doneTime = this.time.now;
      this.climber.setVelocityY(-3);
      this.config.levelNumber++;
      playSound(this, "levelwin");

      if (this.config.levelNumber > Levels) {
        const runTime = this.doneTime - this.config.startTime;
        this.time.delayedCall(
          1000,
          () => {
            this.scene.start(Victory.Name, { runTime: runTime });
          },
          undefined,
          this);

      } else {
        this.time.delayedCall(
          1000,
          () => this.scene.restart(this.config),
          undefined,
          this);
      }
    }
  }

  public update() {

    // Update elapsed time
    this.elapsedTime.setText(`${((this.time.now - this.config.startTime) / 1000).toFixed(1)} s`);

    // Update snowflake count
    const snowflakes = <number>this.data.get(SnowflakeCount);
    if (this.snowFlakeCount.getData(SnowflakeCount) < snowflakes) {
      this.snowFlakeCount.incData(SnowflakeCount);
      this.snowFlakeCount.setText(
        (<number>this.snowFlakeCount.getData(SnowflakeCount))
          .toLocaleString(undefined, { minimumIntegerDigits: 3 }))
    }

    if (this.snowFlakeCount.getData(SnowflakeCount) < this.config.levelNumber) {
      this.snowFlakeCount.setTint(0xee0000);
    } else {
      this.snowFlakeCount.setTint(0xffffff);
    }

    // Update game state
    if (this.state === "live") {
      if (!this.cameras.main.getBounds().contains(this.climber.x, this.climber.y)) {
        playSound(this, "die");
        this.transitionToDeadState(snowflakes);
      } else if (this.climber.state === "dead") {
        this.transitionToDeadState(snowflakes);
      }
    }

    if (
      !this.cameras.main.getBounds().contains(this.climber.x, this.climber.y) ||
      (this.doneTime && this.time.now > this.doneTime + 1000)
    ) {
      this.climber.setStatic(true);
    }

    if (this.doneTime) {
      const radius = Math.max(400, 1000 - (this.time.now - this.doneTime) * 1);
      const position = this.climber.getCenter();
      this.doneGraphics
        .setVisible(true)
        .clear()
        .lineStyle(1000, this.state === "won" ? 0xffffff : 0x000000)
        .arc(position.x, position.y, radius, 0, Math.PI * 2, false, 0.02)
        .stroke()
    } else if (!this.startTime || this.startTime + 1000 > this.time.now) {
      if (!this.startTime) {
        this.startTime = this.time.now;
      }
      const radius = 200 + this.time.now - this.startTime;
      const position = this.climber.getCenter();
      this.doneGraphics
        .setVisible(true)
        .clear()
        .lineStyle(1000, this.config.transitionColor)
        .arc(position.x, position.y, radius, 0, Math.PI * 2, false, 0.02)
        .stroke()
    } else {
      this.doneGraphics.setVisible(false);
    }

    this.climber.updateAction(
      this.keyPressedA ? "pressed" : this.keyA.isDown ? "holding" : undefined,
      this.keyPressedB ? "pressed" : this.keyB.isDown ? "holding" : undefined
    );

    this.keyPressedA = false;
    this.keyPressedB = false;
  }

  private transitionToDeadState(snowflakes: number) {
    this.state = "dead";
    this.doneTime = this.time.now;
    const level = this.config.levelNumber;
    if (snowflakes >= level) {
      const newCount = Math.max(0, snowflakes - level);
      this.data.set(SnowflakeCount, newCount);
      this.config.transitionColor = 0;
      this.time.delayedCall(
        1000,
        () => this.scene.restart(),
        undefined,
        this);
    } else {
      this.time.delayedCall(
        1000,
        () => {
          this.scene.start(GameOver.Name);
        },
        undefined,
        this);
    }
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
