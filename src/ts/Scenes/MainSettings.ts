/* 
 * Portions copyright 2020, James Kemp.
 * Portions copyright 2020, Justin Reardon.
*/

import MainMenu from "./MainMenu";

export default class MainSettings extends Phaser.Scene {
  /**
   * Unique name of the scene.
   */
  public static Name = "MainSettings";

  public create(): void {
    const startYPosition = this.cameras.main.height / 4;
    const fontSize = 25;

    // Add a button to return to the main menu.
    const backText = this.add.text(this.cameras.main.centerX, startYPosition * 2, "Go Back");
    backText
      .setOrigin(0.5)
      .setFontFamily("monospace").setFontSize(fontSize).setFill("#fff")
      .setInteractive();
    backText.on("pointerdown", () => { this.scene.start(MainMenu.Name); }, this);
  }
}
