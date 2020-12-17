/* 
 * Portions copyright 2020, James Kemp.
 * Portions copyright 2020, Justin Reardon.
*/

import SplashScreen from "./SplashScreen";
import Utilities from "../Utilities";
import Level, { LevelConfig } from "./Level";

export default class Preloader extends Phaser.Scene {
  /**
   * Unique name of the scene.
   */
  public static Name = "Preloader";

  public preload(): void {
    this.addProgressBar();

    this.load.path = "assets/";

    this.load.aseprite('climber', 'sprites/player/climber.png', 'sprites/player/climber.json');
    this.load.aseprite('iceblock', 'sprites/world/iceblock.png', 'sprites/world/iceblock.json');

    this.load.image("cliffs", "sprites/world/cliff.png");
    this.load.image("iceblock", "sprites/world/iceblock.png");
    this.load.image("spikes", "sprites/world/spikes.png");
    this.load.image("pole", "sprites/world/pole_noanim.png");
    this.load.tilemapTiledJSON("level1", "maps/level1.json");
  }

  public create(): void {
    this.scene.start(Level.Name, new LevelConfig("level1"));
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
    /** Customizable. This text color will be used around the progress bar. */
    const outerTextColor = '#ffffff';

    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(width / 4, height / 2 - 30, width / 2, 50);

    const loadingText = this.make.text({
      x: width / 2,
      y: height / 2 - 50,
      text: "Loading...",
      style: {
        font: "20px monospace"
      }
    });
    loadingText.setOrigin(0.5, 0.5);

    const percentText = this.make.text({
      x: width / 2,
      y: height / 2 - 5,
      text: "0%",
      style: {
        font: "18px monospace"
      }
    });
    percentText.setOrigin(0.5, 0.5);

    const assetText = this.make.text({
      x: width / 2,
      y: height / 2 + 50,
      text: "",
      style: {
        font: "18px monospace"
      }
    });

    assetText.setOrigin(0.5, 0.5);

    this.load.on("progress", (value: number) => {
      percentText.setText(parseInt(value * 100 + "", 10) + "%");
      progressBar.clear();
      progressBar.fillStyle(0xffffff, 1);
      progressBar.fillRect((width / 4) + 10, (height / 2) - 30 + 10, (width / 2 - 10 - 10) * value, 30);
    });

    this.load.on("fileprogress", (file: Phaser.Loader.File) => {
      assetText.setText("Loading asset: " + file.key);
    });

    this.load.on("complete", () => {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
      percentText.destroy();
      assetText.destroy();
    });
  }
}
