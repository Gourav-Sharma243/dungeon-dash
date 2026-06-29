export class Audio {
    constructor() {
                this.ctx = null;

                this.masterGain = null;

                this.muted = false;

                this.volume = 0.3;

                this.initialized = false;
    }

        init() {
        if (this.initialized) return;

        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.value = this.volume;
            this.masterGain.connect(this.ctx.destination);
            this.initialized = true;
            console.log('[Audio] Initialized — Web Audio API');
        } catch (e) {
            console.warn('[Audio] Web Audio API not available:', e.message);
        }
    }

        resume() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

        play(name) {
        if (!this.initialized || this.muted) return;
        this.resume();

        const sounds = {
            hit: () => this._playHit(),
            swing: () => this._playSwing(),
            pickup: () => this._playPickup(),
            death: () => this._playDeath(),
            step: () => this._playStep(),
            levelup: () => this._playLevelUp(),
            select: () => this._playSelect(),
            explosion: () => this._playExplosion(),
            heal: () => this._playHeal(),
        };

        const fn = sounds[name];
        if (fn) fn();
    }

        setVolume(vol) {
        this.volume = Math.max(0, Math.min(1, vol));
        if (this.masterGain) {
            this.masterGain.gain.value = this.volume;
        }
    }

        toggleMute() {
        this.muted = !this.muted;
        if (this.masterGain) {
            this.masterGain.gain.value = this.muted ? 0 : this.volume;
        }
        return this.muted;
    }

        _createOsc(type, freq, duration, volume = 0.3) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.value = freq;
        gain.gain.value = volume;
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(this.ctx.currentTime);
        osc.stop(this.ctx.currentTime + duration);
        return { osc, gain };
    }

        _playHit() {
        const t = this.ctx.currentTime;
        const { gain } = this._createOsc('square', 200, 0.15, 0.25);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);

        const { gain: g2 } = this._createOsc('sawtooth', 100, 0.08, 0.2);
        g2.gain.exponentialRampToValueAtTime(0.01, t + 0.08);
    }

        _playSwing() {
        const t = this.ctx.currentTime;
        const { osc, gain } = this._createOsc('sine', 300, 0.12, 0.15);
        osc.frequency.exponentialRampToValueAtTime(100, t + 0.12);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);
    }

        _playPickup() {
        const t = this.ctx.currentTime;
        const { osc, gain } = this._createOsc('square', 600, 0.15, 0.15);
        osc.frequency.setValueAtTime(600, t);
        osc.frequency.setValueAtTime(800, t + 0.05);
        osc.frequency.setValueAtTime(1000, t + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
    }

        _playDeath() {
        const t = this.ctx.currentTime;
        const { osc, gain } = this._createOsc('square', 400, 0.5, 0.25);
        osc.frequency.exponentialRampToValueAtTime(80, t + 0.5);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.5);

        const { gain: g2 } = this._createOsc('sawtooth', 60, 0.4, 0.15);
        g2.gain.exponentialRampToValueAtTime(0.01, t + 0.4);
    }

        _playStep() {
        const t = this.ctx.currentTime;
        const freq = 100 + Math.random() * 50;
        const { gain } = this._createOsc('triangle', freq, 0.05, 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.05);
    }

        _playLevelUp() {
        const t = this.ctx.currentTime;
        const notes = [523, 659, 784, 1047]; 
        notes.forEach((freq, i) => {
            const { gain } = this._createOsc('square', freq, 0.3, 0.12);
            const { osc: o2 } = this._createOsc('triangle', freq, 0.3, 0.08);
            o2.frequency.setValueAtTime(freq, t + i * 0.12);
            gain.gain.setValueAtTime(0.12, t + i * 0.12);
            gain.gain.exponentialRampToValueAtTime(0.01, t + i * 0.12 + 0.3);
        });
    }

        _playSelect() {
        const t = this.ctx.currentTime;
        const { osc, gain } = this._createOsc('square', 440, 0.08, 0.1);
        osc.frequency.setValueAtTime(660, t + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.08);
    }

        _playExplosion() {
        const t = this.ctx.currentTime;
        const { osc, gain } = this._createOsc('sawtooth', 150, 0.3, 0.2);
        osc.frequency.exponentialRampToValueAtTime(30, t + 0.3);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);

        const { osc: o2, gain: g2 } = this._createOsc('square', 80, 0.15, 0.15);
        o2.frequency.setValueAtTime(200, t + 0.02);
        o2.frequency.setValueAtTime(50, t + 0.08);
        g2.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
    }

        _playHeal() {
        const t = this.ctx.currentTime;
        const { osc, gain } = this._createOsc('sine', 400, 0.3, 0.15);
        osc.frequency.linearRampToValueAtTime(800, t + 0.15);
        osc.frequency.linearRampToValueAtTime(600, t + 0.3);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
    }
}
