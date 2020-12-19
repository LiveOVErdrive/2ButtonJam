/* 
 * Portions copyright 2020, James Kemp.
 * Portions copyright 2020, Justin Reardon.
*/

import SplashScreen from "./SplashScreen";
import Utilities from "../Utilities";
import Level, { LevelConfig } from "./Level";
import MainMenu from "./MainMenu";
import { Levels } from "../Game";

export default class Preloader extends Phaser.Scene {
  /**
   * Unique name of the scene.
   */
  public static Name = "Preloader";

  public preload(): void {
    this.addProgressBar();

    this.load.path = "assets/";

    this.load.aseprite('aim', 'sprites/icons/aim.png', 'sprites/icons/aim.json');
    this.load.aseprite('climber', 'sprites/player/climber.png', 'sprites/player/climber.json');
    this.load.aseprite('endflag', 'sprites/world/endflag.png', 'sprites/world/endflag.json');
    this.load.aseprite('iceblock', 'sprites/world/iceblock.png', 'sprites/world/iceblock.json');
    this.load.aseprite('snowflake', 'sprites/items/snowflake.png', 'sprites/items/snowflake.json');

    this.load.image("titleBackground", "sprites/screens/titleFull.png");
    this.load.image("gameOverBackground", "sprites/screens/gameOver.png");
    this.load.image("victoryBackground", "sprites/screens/gameOver.png");

    this.load.image("cliffs", "sprites/world/cliff.png");
    this.load.image("iceblock", "sprites/world/iceblock.png");
    this.load.image("spikes", "sprites/world/spikes.png");
    this.load.image("pole", "sprites/world/pole_noanim.png");

    for (let i = 1; i <= Levels; i++) {
      this.load.tilemapTiledJSON(`level${i}`, `maps/level${i}.json`);
    }

    this.load.bitmapFont("Label", "fonts/kenney_pixel_32.png", "fonts/kenney_pixel_32.xml");
  }

  public create(): void {
    this.scene.start(MainMenu.Name, new LevelConfig(this.time.now, 1, 0, 0xffffff));
  }

  public update(): void {
    // preload handles updates to the progress bar, so nothing should be needed here.
  }

  /**
   * Adds a progress bar to the display, showing the percentage of assets loaded and their name.
   */
  private addProgressBar(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(width / 4, height / 2 - 30, width / 2, 50);

    this.load.on("progress", (value: number) => {
      progressBar.clear();
      progressBar.fillStyle(0xffffff, 1);
      progressBar.fillRect((width / 4) + 10, (height / 2) - 30 + 10, (width / 2 - 10 - 10) * value, 30);
    });

    this.load.on("complete", () => {
      progressBar.destroy();
      progressBox.destroy();
    });
  }
}
