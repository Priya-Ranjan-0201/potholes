/**
 * Glanceable Audio Alert Chime for Hands-Free Driving HUD (Rule R16).
 * Produces synthesized hazard warning tones without external sound file dependencies.
 */

export class AudioAlertService {
  private audioCtx: AudioContext | null = null;
  private isMuted: boolean = false;

  private getAudioContext(): AudioContext | null {
    if (this.isMuted) return null;
    if (typeof window !== "undefined") {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        if (!this.audioCtx || this.audioCtx.state === "closed") {
          this.audioCtx = new AudioContextClass();
        }
        return this.audioCtx;
      }
    }
    return null;
  }

  /**
   * Plays a distinct double-beep road hazard warning tone.
   */
  public playHazardChime(): void {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      if (ctx.state === "suspended") {
        ctx.resume();
      }

      const now = ctx.currentTime;

      // Beep 1 (880 Hz - High A)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(880, now);
      gain1.gain.setValueAtTime(0.3, now);
      gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.15);

      // Beep 2 (659 Hz - High E)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(659, now + 0.18);
      gain2.gain.setValueAtTime(0.3, now + 0.18);
      gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.18);
      osc2.stop(now + 0.35);
    } catch {
      // Audio playback fails silently in headless test environments
    }
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
  }

  public isAudioMuted(): boolean {
    return this.isMuted;
  }
}

export const audioAlertService = new AudioAlertService();

