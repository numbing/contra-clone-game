type TrackName = 'menu' | 'stage' | 'boss' | 'victory';

interface TrackController {
  stop(): void;
}

export class MusicSystem {
  private ctx?: AudioContext;
  private currentTrack: TrackName | null = null;
  private controller: TrackController | null = null;

  async play(track: TrackName): Promise<void> {
    if (this.currentTrack === track) {
      return;
    }

    await this.ensureContext();
    this.stop();

    if (!this.ctx) {
      return;
    }

    switch (track) {
      case 'menu':
        this.controller = this.startPattern({
          pattern: [196, 0, 233, 0, 294, 0, 233, 0],
          tempo: 90,
          waveform: 'triangle',
          volume: 0.12,
          sustain: 0.4,
        });
        break;
      case 'stage':
        this.controller = this.startPattern({
          pattern: [220, 0, 277, 0, 330, 0, 277, 0, 262, 0, 330, 0, 392, 0, 330, 0],
          tempo: 132,
          waveform: 'sawtooth',
          volume: 0.16,
          sustain: 0.32,
        });
        break;
      case 'boss':
        this.controller = this.startPattern({
          pattern: [329, 0, 440, 392, 329, 0, 392, 523],
          tempo: 160,
          waveform: 'square',
          volume: 0.2,
          sustain: 0.28,
        });
        break;
      case 'victory':
        this.controller = this.startPattern({
          pattern: [330, 392, 440, 523, 440, 523, 587, 659],
          tempo: 140,
          waveform: 'triangle',
          volume: 0.14,
          sustain: 0.22,
        });
        break;
    }

    this.currentTrack = track;
  }

  stop(): void {
    if (this.controller) {
      this.controller.stop();
      this.controller = null;
    }
    this.currentTrack = null;
  }

  private async ensureContext(): Promise<void> {
    if (!this.ctx) {
      try {
        this.ctx = new AudioContext();
      } catch {
        this.ctx = undefined;
        return;
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      try {
        await this.ctx.resume();
      } catch {
        // ignored
      }
    }
  }

  private startPattern(options: {
    pattern: number[];
    tempo: number;
    waveform: OscillatorType;
    volume: number;
    sustain: number;
  }): TrackController | null {
    const ctx = this.ctx;
    if (!ctx) {
      return null;
    }

    const gain = ctx.createGain();
    gain.gain.value = options.volume;
    gain.connect(ctx.destination);

    let step = 0;
    const beatDuration = 60 / options.tempo;
    const intervalMs = beatDuration * 1000 * 0.5; // eighth notes
    const sustain = beatDuration * options.sustain;

    const timer = window.setInterval(() => {
      const freq = options.pattern[step % options.pattern.length];
      step += 1;
      if (freq <= 0) {
        return;
      }

      const osc = ctx.createOscillator();
      osc.type = options.waveform;
      osc.frequency.value = freq;

      const noteGain = ctx.createGain();
      noteGain.gain.setValueAtTime(0, ctx.currentTime);
      noteGain.gain.linearRampToValueAtTime(1, ctx.currentTime + 0.02);
      noteGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + sustain);

      osc.connect(noteGain);
      noteGain.connect(gain);

      osc.start();
      osc.stop(ctx.currentTime + sustain + 0.05);
      osc.onended = () => {
        osc.disconnect();
        noteGain.disconnect();
      };
    }, intervalMs);

    return {
      stop: () => {
        window.clearInterval(timer);
        gain.disconnect();
      },
    };
  }
}
