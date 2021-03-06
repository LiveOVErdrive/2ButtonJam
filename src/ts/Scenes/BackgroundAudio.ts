/* 
 * Copyright 2020, Justin Reardon.
*/

import Utilities from "../Utilities";

type Sound = "die" | "jump" | "land" | "levelwin" | "pickup";

export function playSound(scene: Phaser.Scene, sound: Sound) {
  scene.scene.get(BackgroundAudio.Name).data.set(sound, true);
}

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

    const audioOn = this.data.get(BackgroundAudio.AudioEnabled);
    if (this.backgroundAudio.isPlaying && !audioOn) {
      this.backgroundAudio.stop();
    } else if (!this.backgroundAudio.isPlaying && audioOn) {
      this.backgroundAudio.play();
    }

    this.tryPlay("die", audioOn);
    this.tryPlay("jump", audioOn);
    this.tryPlay("land", audioOn);
    this.tryPlay("levelwin", audioOn);
    this.tryPlay("pickup", audioOn);
  }

  private tryPlay(sound: string, audioOn: boolean) {
    if (this.data.get(sound)) {
      if (audioOn) {
        this.sound.play(sound);
      }
      this.data.toggle(sound);
    }
  }
}