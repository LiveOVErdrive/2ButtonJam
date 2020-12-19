/* 
 * Portions copyright 2020, James Kemp.
 * Portions copyright 2020, Justin Reardon.
*/

import BackgroundAudio from "./BackgroundAudio";
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
    const snowEmitter = this.add.particles('snowflake').createEmitter({
      x: 0,
      y: 0,
      blendMode: 'SCREEN',
      speed: { min: 10, max: 50 },
      gravityY: 15,
      quantity: 1,
      lifespan: 20000,
      frequency: 1000
    });
    snowEmitter.setEmitZone({
      source: new Phaser.Geom.Line(0, -10, 640, -10),
      type: 'edge',
      quantity: 10,

    });

    const newGameText = this.createShadowedText(textYPosition * 0.70, 48, "Press space to Start");
    this.input.keyboard.once("keyup-SPACE", this.startLevel1, this);
    this.input.keyboard.on("keyup-SHIFT", this.toggleAudio, this);

    this.createShadowedText(textYPosition * 0.9, 32, "Press shift to toggle audio\nSpace: aim & jump    Shift: climb\nCollect snowflakes & reach the summit!");

    this.transitionGraphics = this.add.graphics();
    this.tweens.add({
      targets: this,
      transitionRadius: { from: 1000, to: 1 },
      duration: 500
    });
  }

  private toggleAudio() {
    this.scene.get(BackgroundAudio.Name).data.toggle(BackgroundAudio.AudioEnabled);
  }

  private startLevel1() {
    this.tweens.add({
      targets: this,
      transitionRadius: { from: 1, to: 1000 },
      duration: 500
    });
    this.time.delayedCall(
      500,
      () => this.scene.start(Level.Name, new LevelConfig(this.time.now, 1, 0, 0xffffff)),
      undefined,
      this);
  }

  private createShadowedText(textYPosition: number, fontSize: number, text: string) {
    this.add.bitmapText(this.cameras.main.centerX + 1, textYPosition + 1, "Label", text, fontSize)
      .setOrigin(0.5)
      .setCenterAlign()
      .setTint(0xeeeeee);
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
