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

    const drumGain = ctx.createGain();
    drumGain.gain.value = options.volume * 0.9;
    drumGain.connect(ctx.destination);

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

    let beatStep = 0;
    const drumTimer = window.setInterval(() => {
      const now = ctx.currentTime;
      playKick(now);
      if (beatStep % 2 === 1) {
        playSnare(now + beatDuration * 0.5);
      }
      if (beatStep % 4 === 0) {
        playHiHat(now + beatDuration * 0.25);
      }
      beatStep = (beatStep + 1) % 8;
    }, beatDuration * 1000);

    const playKick = (time: number) => {
      const osc = ctx.createOscillator();
      const gainEnv = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(160, time);
      osc.frequency.exponentialRampToValueAtTime(50, time + 0.22);
      gainEnv.gain.setValueAtTime(0.7, time);
      gainEnv.gain.exponentialRampToValueAtTime(0.001, time + 0.32);
      osc.connect(gainEnv);
      gainEnv.connect(drumGain);
      osc.start(time);
      osc.stop(time + 0.4);
    };

    const playSnare = (time: number) => {
      const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.25, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i += 1) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 2);
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const gainEnv = ctx.createGain();
      gainEnv.gain.setValueAtTime(0.4, time);
      gainEnv.gain.exponentialRampToValueAtTime(0.001, time + 0.2);
      noise.connect(gainEnv);
      gainEnv.connect(drumGain);
      noise.start(time);
      noise.stop(time + 0.25);
    };

    const playHiHat = (time: number) => {
      const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.1, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i += 1) {
        data[i] = (Math.random() * 2 - 1) * 0.6;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const bandpass = ctx.createBiquadFilter();
      bandpass.type = 'highpass';
      bandpass.frequency.value = 8000;
      const gainEnv = ctx.createGain();
      gainEnv.gain.setValueAtTime(0.25, time);
      gainEnv.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
      noise.connect(bandpass);
      bandpass.connect(gainEnv);
      gainEnv.connect(drumGain);
      noise.start(time);
      noise.stop(time + 0.1);
    };

    return {
      stop: () => {
        window.clearInterval(timer);
        window.clearInterval(drumTimer);
        gain.disconnect();
        drumGain.disconnect();
      },
    };
  }
}
