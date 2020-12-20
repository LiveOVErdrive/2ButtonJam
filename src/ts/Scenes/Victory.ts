/* 
 * Portions copyright 2020, James Kemp.
 * Portions copyright 2020, Justin Reardon.
*/

import { playSound } from "./BackgroundAudio";
import MainMenu from "./MainMenu";

export default class Victory extends Phaser.Scene {
  /**
   * Unique name of the scene.
   */
  public static Name = "Victory";

  transitionRadius = 1000;
  transitionGraphics: Phaser.GameObjects.Graphics;

  public preload(): void {
    this.anims.createFromAseprite('victory');
  }

  public create(config: { runTime: number }): void {
    this.add.sprite(0, 0, "victory").setOrigin(0, 0).play("full");
    const textYPosition = this.cameras.main.height;

    this.createShadowedText(
      textYPosition * 0.75,
      48,
      `Congratulations!\nYour run took ${(config.runTime / 1000).toFixed(1)} s!`)
      .setCenterAlign();
    this.createShadowedText(
      textYPosition * 0.9,
      32,
      "Press Space to continue")
      .setCenterAlign();
    this.input.keyboard.once("keyup-SPACE", this.openMainMenu, this);

    this.transitionGraphics = this.add.graphics();
    this.tweens.add({
      targets: this,
      transitionRadius: { from: 1000, to: 1 },
      duration: 1000
    });
  }

  private openMainMenu() {
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
      .lineStyle(this.transitionRadius, 0xffffff)
      .arc(this.cameras.main.width / 2, this.cameras.main.height / 2, 400, 0, Math.PI * 2, false, 0.02)
      .stroke()
  }
}
