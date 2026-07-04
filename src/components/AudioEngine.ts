/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

class AudioEngine {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playTap(combo: number = 0) {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      
      const playState = this.ctx;
      const now = playState.currentTime;

      // Pitch-shifting index based on consecutive taps. Max pitch at combo >= 10.
      const pitchShift = Math.min(combo * 0.05, 0.5); // Up to +50% frequency rise
      const baseFreq = 400 * (1 + pitchShift);
      const chimeFreq = 1200 * (1 + pitchShift);

      // Base tap click (warm low transient)
      const osc1 = playState.createOscillator();
      const gain1 = playState.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(baseFreq, now);
      osc1.frequency.exponentialRampToValueAtTime(baseFreq * 0.4, now + 0.09);
      gain1.gain.setValueAtTime(0.08, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
      osc1.connect(gain1);
      gain1.connect(playState.destination);
      osc1.start(now);
      osc1.stop(now + 0.09);

      // Premium coin metal sheen (high chime)
      const osc2 = playState.createOscillator();
      const gain2 = playState.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(chimeFreq, now);
      osc2.frequency.exponentialRampToValueAtTime(chimeFreq * 0.7, now + 0.06);
      gain2.gain.setValueAtTime(0.05, now);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
      osc2.connect(gain2);
      gain2.connect(playState.destination);
      osc2.start(now);
      osc2.stop(now + 0.06);

      // Synthesize a fast subtle cyber-subharmonic laser beep for higher combos
      if (combo > 5) {
        const osc3 = playState.createOscillator();
        const gain3 = playState.createGain();
        osc3.type = 'triangle';
        osc3.frequency.setValueAtTime(chimeFreq * 1.5, now);
        osc3.frequency.exponentialRampToValueAtTime(chimeFreq * 2.5, now + 0.04);
        gain3.gain.setValueAtTime(0.02, now);
        gain3.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
        osc3.connect(gain3);
        gain3.connect(playState.destination);
        osc3.start(now);
        osc3.stop(now + 0.04);
      }
    } catch (e) {
      console.warn("Audio Context error", e);
    }
  }

  playReward() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      
      const playState = this.ctx;
      const now = playState.currentTime;
      
      // Synthesis of an arpeggiated coin sound chord
      const playTone = (freq: number, start: number, duration: number) => {
        const osc = playState.createOscillator();
        const gain = playState.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.12, start);
        gain.gain.exponentialRampToValueAtTime(0.01, start + duration);
        osc.connect(gain);
        gain.connect(playState.destination);
        osc.start(start);
        osc.stop(start + duration);
      };
      
      playTone(523.25, now, 0.12);     // C5
      playTone(659.25, now + 0.05, 0.12); // E5
      playTone(783.99, now + 0.1, 0.12);  // G5
      playTone(1046.50, now + 0.15, 0.2); // C6
    } catch (e) {
      console.warn("Audio Context error", e);
    }
  }

  playError() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      
      const playState = this.ctx;
      const osc = playState.createOscillator();
      const gain = playState.createGain();
      
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, playState.currentTime);
      osc.frequency.linearRampToValueAtTime(80, playState.currentTime + 0.15);
      
      gain.gain.setValueAtTime(0.08, playState.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, playState.currentTime + 0.15);
      
      osc.connect(gain);
      gain.connect(playState.destination);
      
      osc.start();
      osc.stop(playState.currentTime + 0.15);
    } catch (e) {
      console.warn("Audio Context error", e);
    }
  }

  playGameStart() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;

      const playState = this.ctx;
      const now = playState.currentTime;

      // Soft major chord with gentle linear attack and slow decay
      const playWarmTone = (freq: number, delay: number, duration: number, maxVolume: number) => {
        const osc = playState.createOscillator();
        const gain = playState.createGain();
        osc.type = 'sine'; // Super smooth sine wave
        osc.frequency.setValueAtTime(freq, now + delay);
        
        // Linear fade in (attack) to prevent pops
        gain.gain.setValueAtTime(0, now + delay);
        gain.gain.linearRampToValueAtTime(maxVolume, now + delay + 0.2);
        // Exponential fade out (decay/release)
        gain.gain.exponentialRampToValueAtTime(0.001, now + delay + duration);
        
        osc.connect(gain);
        gain.connect(playState.destination);
        osc.start(now + delay);
        osc.stop(now + delay + duration);
      };

      // Play soft arpeggiated A-major-add9 chord
      playWarmTone(110.00, 0.0, 1.5, 0.04);  // A2 (deep low floor)
      playWarmTone(220.00, 0.1, 1.5, 0.03);  // A3
      playWarmTone(277.18, 0.2, 1.4, 0.02);  // C#4
      playWarmTone(329.63, 0.3, 1.3, 0.02);  // E4
      playWarmTone(440.00, 0.4, 1.2, 0.015); // A4
    } catch (e) {
      console.warn("Audio Context error", e);
    }
  }
}

export const audioEngine = new AudioEngine();
