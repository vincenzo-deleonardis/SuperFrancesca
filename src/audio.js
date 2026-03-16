export class AudioManager {
  constructor() {
    this.ctx = null;
    this.bgmPlaying = false;
    this.bgmNodes = null;
    this.masterGain = null;
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.5;
    this.masterGain.connect(this.ctx.destination);
    this.initialized = true;
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  _ensureCtx() {
    if (!this.initialized) this.init();
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  _createReverb(duration = 1.0, decay = 2.0) {
    const rate = this.ctx.sampleRate;
    const length = rate * duration;
    const impulse = this.ctx.createBuffer(2, length, rate);
    for (let ch = 0; ch < 2; ch++) {
      const data = impulse.getChannelData(ch);
      for (let i = 0; i < length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
      }
    }
    const convolver = this.ctx.createConvolver();
    convolver.buffer = impulse;
    return convolver;
  }

  // ── background music: chiptune loop, C major, 120 BPM ──
  playBGM() {
    this._ensureCtx();
    if (this.bgmPlaying) return;
    this.bgmPlaying = true;

    const ctx = this.ctx;
    const bpm = 120;
    const beatLen = 60 / bpm;
    const barLen = beatLen * 4;

    // C major melody: C4 D4 E4 G4 | A4 G4 E4 D4 | C4 E4 G4 A4 | G4 E4 D4 C4
    const melody = [
      261.63, 293.66, 329.63, 392.00,
      440.00, 392.00, 329.63, 293.66,
      261.63, 329.63, 392.00, 440.00,
      392.00, 329.63, 293.66, 261.63
    ];

    // bass: C3 C3 F3 G3 | Am  G  F  C
    const bass = [
      130.81, 130.81, 174.61, 196.00,
      220.00, 196.00, 174.61, 130.81,
      130.81, 130.81, 174.61, 196.00,
      220.00, 196.00, 174.61, 130.81
    ];

    const bgmGain = ctx.createGain();
    bgmGain.gain.value = 0.12;
    bgmGain.connect(this.masterGain);

    const bassGain = ctx.createGain();
    bassGain.gain.value = 0.10;
    bassGain.connect(this.masterGain);

    let loopInterval;
    const scheduleLoop = () => {
      const now = ctx.currentTime;
      const totalNotes = melody.length;

      for (let i = 0; i < totalNotes; i++) {
        const noteStart = now + i * beatLen * 0.5;
        const noteEnd = noteStart + beatLen * 0.45;

        // melody: square wave
        const melOsc = ctx.createOscillator();
        melOsc.type = 'square';
        melOsc.frequency.value = melody[i];
        const melEnv = ctx.createGain();
        melEnv.gain.setValueAtTime(0, noteStart);
        melEnv.gain.linearRampToValueAtTime(0.15, noteStart + 0.01);
        melEnv.gain.setValueAtTime(0.15, noteEnd - 0.02);
        melEnv.gain.linearRampToValueAtTime(0, noteEnd);
        melOsc.connect(melEnv);
        melEnv.connect(bgmGain);
        melOsc.start(noteStart);
        melOsc.stop(noteEnd + 0.01);

        // bass: triangle wave (every other note)
        if (i % 2 === 0) {
          const bassOsc = ctx.createOscillator();
          bassOsc.type = 'triangle';
          bassOsc.frequency.value = bass[i];
          const bassEnv = ctx.createGain();
          bassEnv.gain.setValueAtTime(0, noteStart);
          bassEnv.gain.linearRampToValueAtTime(0.2, noteStart + 0.01);
          bassEnv.gain.setValueAtTime(0.2, noteEnd + beatLen * 0.3);
          bassEnv.gain.linearRampToValueAtTime(0, noteEnd + beatLen * 0.5);
          bassOsc.connect(bassEnv);
          bassEnv.connect(bassGain);
          bassOsc.start(noteStart);
          bassOsc.stop(noteEnd + beatLen * 0.55);
        }

        // hi-hat noise on every note
        if (i % 2 === 0) {
          const bufSize = ctx.sampleRate * 0.03;
          const noiseBuf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
          const data = noiseBuf.getChannelData(0);
          for (let s = 0; s < bufSize; s++) data[s] = (Math.random() * 2 - 1);
          const noiseSrc = ctx.createBufferSource();
          noiseSrc.buffer = noiseBuf;
          const noiseGain = ctx.createGain();
          noiseGain.gain.setValueAtTime(0.04, noteStart);
          noiseGain.gain.linearRampToValueAtTime(0, noteStart + 0.03);
          const hiPassFilter = ctx.createBiquadFilter();
          hiPassFilter.type = 'highpass';
          hiPassFilter.frequency.value = 8000;
          noiseSrc.connect(hiPassFilter);
          hiPassFilter.connect(noiseGain);
          noiseGain.connect(this.masterGain);
          noiseSrc.start(noteStart);
          noiseSrc.stop(noteStart + 0.04);
        }
      }
    };

    scheduleLoop();
    const loopDuration = melody.length * beatLen * 0.5;
    loopInterval = setInterval(() => {
      if (!this.bgmPlaying) { clearInterval(loopInterval); return; }
      scheduleLoop();
    }, loopDuration * 1000 - 100);

    this.bgmNodes = { bgmGain, bassGain, loopInterval };
  }

  stopBGM() {
    this.bgmPlaying = false;
    if (this.bgmNodes) {
      clearInterval(this.bgmNodes.loopInterval);
      this.bgmNodes.bgmGain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.3);
      this.bgmNodes.bassGain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.3);
      this.bgmNodes = null;
    }
  }

  // ── jump: rising frequency sweep 220→440 Hz in 80ms ──
  playJump() {
    this._ensureCtx();
    const ctx = this.ctx;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(440, now + 0.08);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.linearRampToValueAtTime(0, now + 0.12);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.13);
  }

  // ── donut collected: C→E quick ascending notes (150ms) with reverb ──
  playDonut() {
    this._ensureCtx();
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const reverb = this._createReverb(0.4, 1.5);
    reverb.connect(this.masterGain);

    const notes = [523.25, 659.25]; // C5, E5
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const gain = ctx.createGain();
      const start = now + i * 0.075;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.2, start + 0.01);
      gain.gain.linearRampToValueAtTime(0, start + 0.07);
      osc.connect(gain);
      gain.connect(reverb);
      osc.start(start);
      osc.stop(start + 0.1);
    });
  }

  // ── trampoline: low note with pitch bend upward ──
  playTrampoline() {
    this._ensureCtx();
    const ctx = this.ctx;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(100, now);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.15);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.linearRampToValueAtTime(0, now + 0.25);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.26);
  }

  // ── life lost: A→F→D descending sad notes (400ms total) ──
  playLifeLost() {
    this._ensureCtx();
    const ctx = this.ctx;
    const now = ctx.currentTime;

    const notes = [440, 349.23, 293.66]; // A4, F4, D4
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      const gain = ctx.createGain();
      const start = now + i * 0.133;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.2, start + 0.02);
      gain.gain.linearRampToValueAtTime(0, start + 0.12);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(start);
      osc.stop(start + 0.15);
    });
  }

  // ── star invincibility: bright major chord + shimmer ──
  playStar() {
    this._ensureCtx();
    const ctx = this.ctx;
    const now = ctx.currentTime;

    const chord = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    const reverb = this._createReverb(0.8, 2.0);
    reverb.connect(this.masterGain);

    chord.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const gain = ctx.createGain();
      const start = now + i * 0.04;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.12, start + 0.02);
      gain.gain.linearRampToValueAtTime(0.06, start + 0.3);
      gain.gain.linearRampToValueAtTime(0, start + 0.6);
      osc.connect(gain);
      gain.connect(reverb);
      osc.start(start);
      osc.stop(start + 0.65);
    });

    // shimmer: high oscillator with vibrato
    const shimmer = ctx.createOscillator();
    shimmer.type = 'sine';
    shimmer.frequency.value = 2093;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 12;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 80;
    lfo.connect(lfoGain);
    lfoGain.connect(shimmer.frequency);

    const shimGain = ctx.createGain();
    shimGain.gain.setValueAtTime(0, now);
    shimGain.gain.linearRampToValueAtTime(0.05, now + 0.1);
    shimGain.gain.linearRampToValueAtTime(0, now + 0.7);
    shimmer.connect(shimGain);
    shimGain.connect(reverb);
    lfo.start(now);
    shimmer.start(now);
    shimmer.stop(now + 0.75);
    lfo.stop(now + 0.75);
  }

  // ── enemy eliminated: high-frequency "pop" ──
  playEnemyKill() {
    this._ensureCtx();
    const ctx = this.ctx;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.08);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.12);
  }

  // ── level complete: happy 4-note fanfare ──
  playLevelComplete() {
    this._ensureCtx();
    const ctx = this.ctx;
    const now = ctx.currentTime;

    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    const reverb = this._createReverb(1.0, 2.5);
    reverb.connect(this.masterGain);

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'square';
      osc.frequency.value = freq;

      const gain = ctx.createGain();
      const start = now + i * 0.18;
      const isLast = i === notes.length - 1;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.12, start + 0.02);
      gain.gain.setValueAtTime(0.12, start + (isLast ? 0.3 : 0.12));
      gain.gain.linearRampToValueAtTime(0, start + (isLast ? 0.6 : 0.16));

      osc.connect(gain);
      gain.connect(reverb);
      osc.start(start);
      osc.stop(start + (isLast ? 0.65 : 0.2));
    });
  }

  playDash() {
    this._ensureCtx();
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const bufSize = ctx.sampleRate * 0.08;
    const noiseBuf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data = noiseBuf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1);
    const src = ctx.createBufferSource();
    src.buffer = noiseBuf;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2000, now);
    filter.frequency.exponentialRampToValueAtTime(400, now + 0.08);
    filter.Q.value = 2;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.linearRampToValueAtTime(0, now + 0.1);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    src.start(now);
    src.stop(now + 0.11);
  }

  playShield() {
    this._ensureCtx();
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.2);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.linearRampToValueAtTime(0, now + 0.25);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.26);
  }

  playPowerup() {
    this._ensureCtx();
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const notes = [392, 523.25, 659.25];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const gain = ctx.createGain();
      const start = now + i * 0.06;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.15, start + 0.01);
      gain.gain.linearRampToValueAtTime(0, start + 0.1);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(start);
      osc.stop(start + 0.12);
    });
  }

  playCrystal() {
    this._ensureCtx();
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const reverb = this._createReverb(1.2, 3.0);
    reverb.connect(this.masterGain);
    const notes = [783.99, 987.77, 1174.66, 1567.98];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const gain = ctx.createGain();
      const start = now + i * 0.08;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.1, start + 0.01);
      gain.gain.linearRampToValueAtTime(0.04, start + 0.3);
      gain.gain.linearRampToValueAtTime(0, start + 0.6);
      osc.connect(gain);
      gain.connect(reverb);
      osc.start(start);
      osc.stop(start + 0.65);
    });
  }

  playBossHit() {
    this._ensureCtx();
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.2);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.linearRampToValueAtTime(0, now + 0.3);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.31);
  }

  playBossDeath() {
    this._ensureCtx();
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const reverb = this._createReverb(1.5, 3.0);
    reverb.connect(this.masterGain);
    for (let i = 0; i < 8; i++) {
      const osc = ctx.createOscillator();
      osc.type = i % 2 === 0 ? 'sawtooth' : 'square';
      osc.frequency.setValueAtTime(400 - i * 40, now + i * 0.1);
      osc.frequency.exponentialRampToValueAtTime(40, now + i * 0.1 + 0.15);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.12, now + i * 0.1);
      gain.gain.linearRampToValueAtTime(0, now + i * 0.1 + 0.2);
      osc.connect(gain);
      gain.connect(reverb);
      osc.start(now + i * 0.1);
      osc.stop(now + i * 0.1 + 0.22);
    }
  }

  setVolume(v) {
    if (this.masterGain) this.masterGain.gain.value = Math.max(0, Math.min(1, v));
  }
}
