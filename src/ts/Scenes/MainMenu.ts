/* 
 * Portions copyright 2020, James Kemp.
 * Portions copyright 2020, Justin Reardon.
*/

import Level, { LevelConfig } from "./Level";

export default class MainMenu extends Phaser.Scene {
  /**
   * Unique name of the scene.
   */
  public static Name = "MainMenu";

  transitionRadius = 1000;
  transitionGraphics: Phaser.GameObjects.Graphics;

  public preload(): void {
    // Preload as needed.
  }

  public create(): void {
    this.add.image(0, 0, "titleBackground").setOrigin(0, 0);
    const textYPosition = this.cameras.main.height;

    const newGameText = this.createShadowedText(textYPosition * 0.75, 48, "Press Space to Start");
    this.input.keyboard.once("keyup-SPACE", this.startLevel1, this);

    this.createShadowedText(textYPosition * 0.9, 32, "Jump: Hold and release Space\nClimb: Shift");

    this.transitionGraphics = this.add.graphics();
    this.tweens.add({
      targets: this,
      transitionRadius: { from: 1000, to: 1 },
      duration: 500
    });
  }

  private startLevel1() {
    this.tweens.add({
      targets: this,
      transitionRadius: { from: 1, to: 1000 },
      duration: 500
    });
    this.time.delayedCall(
      500,
      () => this.scene.start(Level.Name, new LevelConfig("level1", 0, 0xffffff)),
      undefined,
      this);
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
