/* 
 * Portions copyright 2020, James Kemp.
 * Portions copyright 2020, Justin Reardon.
*/

import Preloader from "./Preloader";

export default class Boot extends Phaser.Scene {
  /**
   * Unique name of the scene.
   */
  public static Name = "Boot";

  public preload(): void {
    // Preload as needed.
  }

  public create(): void {
    this.scene.start(Preloader.Name);
  }
}
