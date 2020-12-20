/* 
 * Portions copyright 2020, James Kemp.
 * Portions copyright 2020, Justin Reardon.
*/

import { playSound } from "./BackgroundAudio";
import MainMenu from "./MainMenu";

export default class GameOver extends Phaser.Scene {
  /**
   * Unique name of the scene.
   */
  public static Name = "GameOver";

  transitionRadius = 1000;
  transitionGraphics: Phaser.GameObjects.Graphics;
  transitionColour = 0x000000;

  public preload(): void {
    // Preload as needed.
  }

  public create(): void {
    this.add.image(0, 0, "gameOverBackground").setOrigin(0, 0);
    const textYPosition = this.cameras.main.height;

    const newGameText = this.createShadowedText(textYPosition * 0.8, 32, "Press Space to continue");
    newGameText.on("pointerdown", this.openMainMenu, this);
    this.input.keyboard.once("keyup-SPACE", this.openMainMenu, this);

    this.transitionGraphics = this.add.graphics();
    this.tweens.add({
      targets: this,
      transitionRadius: { from: 1000, to: 1 },
      duration: 1000
    });
  }

  private openMainMenu() {
    this.transitionColour = 0xffffff;
    this.tweens.add({
      targets: this,
      transitionRadius: { from: 1, to: 1000 },
      duration: 500
    });
    this.time.delayedCall(
      500,
      () => this.scene.start(MainMenu.Name),
      undefined,
      this);
    ;
  }

  private createShadowedText(textYPosition: number, fontSize: number, text: string) {
    this.add.bitmapText(this.cameras.main.centerX + 1, textYPosition + 1, "Label", text, fontSize)
      .setOrigin(0.5)
      .setCenterAlign()
      .setTint(0xffffff);
    return this.add.bitmapText(this.cameras.main.centerX, textYPosition, "Label", text, fontSize)
      .setOrigin(0.5)
      .setCenterAlign()
      .setTint(0);
  }

  public update(): void {
    this.transitionGraphics
      .clear()
      .lineStyle(this.transitionRadius, this.transitionColour)
      .arc(this.cameras.main.width / 2, this.cameras.main.height / 2, 400, 0, Math.PI * 2, false, 0.02)
      .stroke()
  }
}
