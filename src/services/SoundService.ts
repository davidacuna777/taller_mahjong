/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

const SOUNDS = {
  FLIP: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3',
  MATCH: 'https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3',
  MISMATCH: 'https://assets.mixkit.co/active_storage/sfx/2572/2572-preview.mp3',
  POWERUP: 'https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3',
  WIN: 'https://assets.mixkit.co/active_storage/sfx/2020/2020-preview.mp3',
  REACTION: 'https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3',
};

class SoundService {
  private audioCache: Map<string, HTMLAudioElement> = new Map();

  constructor() {
    // Preload sounds
    Object.entries(SOUNDS).forEach(([key, url]) => {
      const audio = new Audio(url);
      audio.volume = 0.3;
      this.audioCache.set(key, audio);
    });
  }

  play(soundKey: keyof typeof SOUNDS) {
    const audio = this.audioCache.get(soundKey);
    if (audio) {
      audio.currentTime = 0;
      audio.play().catch(() => {
        // Ignore errors from browser blocking autoplay
      });
    }
  }
}

export const soundService = new SoundService();
