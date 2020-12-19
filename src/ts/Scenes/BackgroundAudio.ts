/* 
 * Copyright 2020, Justin Reardon.
*/

import Utilities from "../Utilities";


export default class BackgroundAudio extends Phaser.Scene {
  /**
   * Unique name of the scene.
   */
  public static Name = "BackgroundAudio";

  public static AudioEnabled = "AudioEnabled";

  audioSupported: boolean;
  backgroundAudio: Phaser.Sound.BaseSound;

  public preload(): void {
    try {
      this.backgroundAudio = this.sound.add("background", { loop: true });
      this.audioSupported = true;
    } catch (e) {
      Utilities.Log("Could not init audio: " + e)
      this.audioSupported = false;
    }
    this.data.toggle(BackgroundAudio.AudioEnabled);
  }

  public create(): void {
  }

  public update() {
    if (!this.audioSupported) {
      return;
    }

    if (this.backgroundAudio.isPlaying && !this.data.get(BackgroundAudio.AudioEnabled)) {
      this.backgroundAudio.stop();
    } else if (!this.backgroundAudio.isPlaying && this.data.get(BackgroundAudio.AudioEnabled)) {
      this.backgroundAudio.play();
    }
  }
}