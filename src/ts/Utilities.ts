/* 
 * Portions copyright 2020, James Kemp.
 * Portions copyright 2020, Justin Reardon.
*/

import PhaserMatterCollisionPlugin from "phaser-matter-collision-plugin";

export default class Utilities {
  /**
   * Logs a particular message to the console.
   * @param message Message to log.
   */
  public static Log(message: string): void {
    console.log((new Date()).toISOString() + " : " + message);
  }
}
