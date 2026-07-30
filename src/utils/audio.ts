class AudioSynth {
  private ctx: AudioContext | null = null;
  private volume: number = 0.5; // master volume

  private initCtx() {
    if (!this.ctx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        this.ctx = new AudioCtxClass();
      }
    }
    // resume context if suspended (security browser policy)
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
  }

  // Sweet chime for correct answer
  playCorrect() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();

      osc1.type = 'triangle';
      osc2.type = 'sine';

      // Arpeggio chord root to double octave
      osc1.frequency.setValueAtTime(523.25, t); // C5
      osc1.frequency.exponentialRampToValueAtTime(783.99, t + 0.15); // G5
      osc1.frequency.exponentialRampToValueAtTime(1046.50, t + 0.3); // C6

      osc2.frequency.setValueAtTime(659.25, t + 0.08); // E5
      osc2.frequency.exponentialRampToValueAtTime(1318.51, t + 0.3); // E6

      gainNode.gain.setValueAtTime(0, t);
      gainNode.gain.linearRampToValueAtTime(0.18 * this.volume, t + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.001, t + 0.65);

      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(this.ctx.destination);

      osc1.start(t);
      osc2.start(t + 0.08);

      osc1.stop(t + 0.7);
      osc2.stop(t + 0.7);
    } catch (e) {
      console.warn("Could not play synthesized audio:", e);
    }
  }

  // Soft low buzzer for incorrect answer
  playIncorrect() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, t);
      osc.frequency.linearRampToValueAtTime(120, t + 0.3);

      gainNode.gain.setValueAtTime(0, t);
      gainNode.gain.linearRampToValueAtTime(0.15 * this.volume, t + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

      // Low pass filter to make it sound muffled and less harsh
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(400, t);

      osc.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.5);
    } catch (e) {
      console.warn("Could not play synthesized audio:", e);
    }
  }

  // Realistic soccer referee whistle
  playWhistle() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;

      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'sine';

      // Soccer whistle frequencies
      osc1.frequency.setValueAtTime(2000, t);
      osc2.frequency.setValueAtTime(2150, t);

      // Rapid vibrato
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      lfo.frequency.value = 45;
      lfoGain.gain.value = 15;

      lfo.connect(lfoGain);
      lfoGain.connect(osc1.frequency);
      lfoGain.connect(osc2.frequency);

      gainNode.gain.setValueAtTime(0, t);
      gainNode.gain.linearRampToValueAtTime(0.15 * this.volume, t + 0.08);
      gainNode.gain.setValueAtTime(0.15 * this.volume, t + 0.32);
      gainNode.gain.linearRampToValueAtTime(0.001, t + 0.45);

      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(this.ctx.destination);

      lfo.start(t);
      osc1.start(t);
      osc2.start(t);

      lfo.stop(t + 0.45);
      osc1.stop(t + 0.45);
      osc2.stop(t + 0.45);
    } catch (e) {
      console.warn("Could not play synthesized audio:", e);
    }
  }

  // Thud sound when kicking the ball
  playKick() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(160, t);
      osc.frequency.exponentialRampToValueAtTime(45, t + 0.12);

      gainNode.gain.setValueAtTime(0.25 * this.volume, t);
      gainNode.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

      osc.connect(gainNode);
      gainNode.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.2);
    } catch (e) {
      console.warn("Could not play synthesized audio:", e);
    }
  }

  // Save impact sound
  playSave() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;

      const bufferSize = this.ctx.sampleRate * 0.15;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noiseNode = this.ctx.createBufferSource();
      noiseNode.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(220, t);
      filter.Q.setValueAtTime(3.0, t);

      const gainNode = this.ctx.createGain();
      gainNode.gain.setValueAtTime(0.3 * this.volume, t);
      gainNode.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

      noiseNode.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(this.ctx.destination);

      noiseNode.start(t);
      noiseNode.stop(t + 0.15);
    } catch (e) {
      console.warn("Could not play synthesized audio:", e);
    }
  }

  // Metallic post/crossbar hit sound
  playPostHit() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;

      // 1. High metallic ring (resonance of structural post)
      const oscMetal1 = this.ctx.createOscillator();
      const oscMetal2 = this.ctx.createOscillator();
      const gainMetal = this.ctx.createGain();

      oscMetal1.type = 'sine';
      oscMetal1.frequency.setValueAtTime(800, t); // Metallic resonance frequency
      oscMetal1.frequency.exponentialRampToValueAtTime(950, t + 0.05);

      oscMetal2.type = 'sine';
      oscMetal2.frequency.setValueAtTime(1180, t); // Dissonant high pitch
      oscMetal2.frequency.exponentialRampToValueAtTime(1130, t + 0.05);

      gainMetal.gain.setValueAtTime(0.25 * this.volume, t);
      gainMetal.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

      oscMetal1.connect(gainMetal);
      oscMetal2.connect(gainMetal);
      gainMetal.connect(this.ctx.destination);

      // 2. Heavy leather ball thud (impact)
      const oscThud = this.ctx.createOscillator();
      const gainThud = this.ctx.createGain();

      oscThud.type = 'triangle';
      oscThud.frequency.setValueAtTime(180, t);
      oscThud.frequency.exponentialRampToValueAtTime(40, t + 0.08);

      gainThud.gain.setValueAtTime(0.35 * this.volume, t);
      gainThud.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

      oscThud.connect(gainThud);
      gainThud.connect(this.ctx.destination);

      oscMetal1.start(t);
      oscMetal2.start(t);
      oscThud.start(t);

      oscMetal1.stop(t + 0.3);
      oscMetal2.stop(t + 0.3);
      oscThud.stop(t + 0.2);
    } catch (e) {
      console.warn("Could not play synthesized audio:", e);
    }
  }

  // Stadium cheering crowd roar
  playCheer() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;

      const bufferSize = this.ctx.sampleRate * 2.2;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        data[i] = (lastOut * 0.85 + white * 0.15);
        lastOut = data[i];
      }

      const noiseNode = this.ctx.createBufferSource();
      noiseNode.buffer = buffer;

      const filter1 = this.ctx.createBiquadFilter();
      filter1.type = 'bandpass';
      filter1.frequency.setValueAtTime(350, rParamSweep(t));
      // sweep frequency to simulate rising cheers
      filter1.frequency.exponentialRampToValueAtTime(750, t + 0.4);
      filter1.frequency.exponentialRampToValueAtTime(420, t + 1.8);
      filter1.Q.setValueAtTime(1.5, t);

      const filter2 = this.ctx.createBiquadFilter();
      filter2.type = 'peaking';
      filter2.frequency.setValueAtTime(1400, t);
      filter2.gain.setValueAtTime(8, t);

      const gainNode = this.ctx.createGain();
      gainNode.gain.setValueAtTime(0, t);
      gainNode.gain.linearRampToValueAtTime(0.35 * this.volume, t + 0.12);
      gainNode.gain.exponentialRampToValueAtTime(0.22 * this.volume, t + 1.0);
      gainNode.gain.exponentialRampToValueAtTime(0.001, t + 2.2);

      noiseNode.connect(filter1);
      filter1.connect(filter2);
      filter2.connect(gainNode);
      gainNode.connect(this.ctx.destination);

      noiseNode.start(t);
      noiseNode.stop(t + 2.2);
    } catch (e) {
      console.warn("Could not play synthesized audio:", e);
    }
  }

  playGoalCelebration() {
    this.playWhistle();
    setTimeout(() => {
      this.playCheer();
    }, 150);
  }
}

// Small helper to avoid typescript warning or build error
function rParamSweep(val: number) {
  return val;
}

export const audioSynth = new AudioSynth();
