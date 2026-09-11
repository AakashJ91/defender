// Synthesized Sound Effects Engine using Web Audio API
class SoundEngine {
    constructor() {
        this.ctx = null;
        this.muted = false;
        this.sfxVolume = 0.5;
        this.initAudioContext();
    }

    initAudioContext() {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx && !this.ctx) {
            try {
                this.ctx = new AudioCtx();
            } catch (e) {
                console.warn('AudioContext initialization deferred:', e);
            }
        }
    }

    resume() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    toggleMute() {
        this.muted = !this.muted;
        return this.muted;
    }

    playShoot(type) {
        if (this.muted || !this.ctx) return;
        this.resume();
        const now = this.ctx.currentTime;

        if (type === 'archer') {
            // Crisp bow string whoosh / snap
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(600, now);
            osc.frequency.exponentialRampToValueAtTime(150, now + 0.08);

            gain.gain.setValueAtTime(0.3 * this.sfxVolume, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.08);
        } else if (type === 'cannon') {
            // Deep resonant explosive thud
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(160, now);
            osc.frequency.exponentialRampToValueAtTime(30, now + 0.25);

            gain.gain.setValueAtTime(0.7 * this.sfxVolume, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.25);
        } else if (type === 'frost') {
            // Icy crystalline chime
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(800, now);
            osc.frequency.linearRampToValueAtTime(1200, now + 0.05);
            osc.frequency.exponentialRampToValueAtTime(400, now + 0.2);

            gain.gain.setValueAtTime(0.35 * this.sfxVolume, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.2);
        } else if (type === 'tesla') {
            // Electric zap / arc
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(250 + Math.random() * 200, now);
            osc.frequency.linearRampToValueAtTime(80, now + 0.12);

            gain.gain.setValueAtTime(0.4 * this.sfxVolume, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.12);
        } else if (type === 'flame') {
            // Sizzling burst
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(120, now);
            osc.frequency.linearRampToValueAtTime(80, now + 0.15);

            gain.gain.setValueAtTime(0.25 * this.sfxVolume, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.15);
        }
    }

    playHit(type = 'normal') {
        if (this.muted || !this.ctx) return;
        this.resume();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        if (type === 'explosion') {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(110, now);
            osc.frequency.exponentialRampToValueAtTime(25, now + 0.3);
            gain.gain.setValueAtTime(0.6 * this.sfxVolume, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        } else if (type === 'freeze') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(950, now);
            osc.frequency.exponentialRampToValueAtTime(320, now + 0.15);
            gain.gain.setValueAtTime(0.3 * this.sfxVolume, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        } else {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(300, now);
            osc.frequency.exponentialRampToValueAtTime(80, now + 0.06);
            gain.gain.setValueAtTime(0.2 * this.sfxVolume, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.06);
        }

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.3);
    }

    playCoin() {
        if (this.muted || !this.ctx) return;
        this.resume();
        const now = this.ctx.currentTime;

        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc1.type = 'sine';
        osc2.type = 'sine';
        osc1.frequency.setValueAtTime(987.77, now); // B5
        osc1.frequency.setValueAtTime(1318.51, now + 0.07); // E6

        osc2.frequency.setValueAtTime(1318.51, now);
        osc2.frequency.setValueAtTime(1760.00, now + 0.07); // A6

        gain.gain.setValueAtTime(0.25 * this.sfxVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(this.ctx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.28);
        osc2.stop(now + 0.28);
    }

    playBuild() {
        if (this.muted || !this.ctx) return;
        this.resume();
        const now = this.ctx.currentTime;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(640, now + 0.12);

        gain.gain.setValueAtTime(0.35 * this.sfxVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.14);
    }

    playWaveStart() {
        if (this.muted || !this.ctx) return;
        this.resume();
        const now = this.ctx.currentTime;

        // War horn effect
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.linearRampToValueAtTime(220, now + 0.25);
        osc.frequency.linearRampToValueAtTime(200, now + 0.6);

        gain.gain.setValueAtTime(0.05, now);
        gain.gain.linearRampToValueAtTime(0.45 * this.sfxVolume, now + 0.15);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.65);
    }

    playSpell(type) {
        if (this.muted || !this.ctx) return;
        this.resume();
        const now = this.ctx.currentTime;

        if (type === 'meteor') {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(450, now);
            osc.frequency.exponentialRampToValueAtTime(35, now + 0.5);

            gain.gain.setValueAtTime(0.7 * this.sfxVolume, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.55);
        } else if (type === 'freeze') {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(1200, now);
            osc.frequency.exponentialRampToValueAtTime(400, now + 0.4);

            gain.gain.setValueAtTime(0.5 * this.sfxVolume, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.45);
        } else if (type === 'rush') {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'square';
            osc.frequency.setValueAtTime(350, now);
            osc.frequency.exponentialRampToValueAtTime(700, now + 0.2);

            gain.gain.setValueAtTime(0.3 * this.sfxVolume, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.25);
        }
    }

    playVictory() {
        if (this.muted || !this.ctx) return;
        this.resume();
        const notes = [440, 554.37, 659.25, 880]; // A major chord fanfare
        notes.forEach((freq, idx) => {
            const now = this.ctx.currentTime + idx * 0.13;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now);
            gain.gain.setValueAtTime(0.35 * this.sfxVolume, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.4);
        });
    }

    playDefeat() {
        if (this.muted || !this.ctx) return;
        this.resume();
        const notes = [350, 311, 277, 220]; // Descending minor fanfare
        notes.forEach((freq, idx) => {
            const now = this.ctx.currentTime + idx * 0.18;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(freq, now);
            gain.gain.setValueAtTime(0.3 * this.sfxVolume, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.35);
        });
    }

    getNoiseBuffer(duration = 2.0) {
        if (!this.ctx) return null;
        if (this._cachedNoise && this._cachedNoiseDuration >= duration) {
            return this._cachedNoise;
        }
        const sampleRate = this.ctx.sampleRate;
        const bufferSize = Math.floor(sampleRate * duration);
        const buffer = this.ctx.createBuffer(1, bufferSize, sampleRate);
        const data = buffer.getChannelData(0);
        let lastOut = 0.0;
        for (let i = 0; i < bufferSize; i++) {
            // Brown/pink-ish filtered noise for softer natural acoustics
            const white = Math.random() * 2 - 1;
            lastOut = (lastOut + (0.02 * white)) / 1.02;
            data[i] = lastOut * 3.5;
        }
        this._cachedNoise = buffer;
        this._cachedNoiseDuration = duration;
        return buffer;
    }

    playThunder(intensity = 1.0) {
        if (this.muted || !this.ctx) return;
        this.resume();
        const now = this.ctx.currentTime;
        const duration = 1.4 + intensity * 0.8;
        const noiseBuffer = this.getNoiseBuffer(duration);

        if (noiseBuffer) {
            const noiseSource = this.ctx.createBufferSource();
            noiseSource.buffer = noiseBuffer;

            // Lowpass filter for deep resonant rumble
            const filter = this.ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(320 + intensity * 250, now);
            filter.frequency.exponentialRampToValueAtTime(45, now + duration);

            const gain = this.ctx.createGain();
            const maxVol = Math.min(0.8, (0.4 + intensity * 0.35) * this.sfxVolume);
            gain.gain.setValueAtTime(0.01, now);
            gain.gain.linearRampToValueAtTime(maxVol, now + 0.04);
            gain.gain.exponentialRampToValueAtTime(maxVol * 0.4, now + 0.35);
            gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

            noiseSource.connect(filter);
            filter.connect(gain);
            gain.connect(this.ctx.destination);

            noiseSource.start(now);
            if (noiseSource.stop) noiseSource.stop(now + duration);
        }

        // Sub-bass rumble oscillator
        const osc = this.ctx.createOscillator();
        const oscGain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(90 + intensity * 30, now);
        osc.frequency.exponentialRampToValueAtTime(28, now + duration);

        const subVol = Math.min(0.65, (0.35 + intensity * 0.25) * this.sfxVolume);
        oscGain.gain.setValueAtTime(0.01, now);
        oscGain.gain.linearRampToValueAtTime(subVol, now + 0.06);
        oscGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        osc.connect(oscGain);
        oscGain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + duration);
    }

    playWindGust(duration = 2.0) {
        if (this.muted || !this.ctx) return;
        this.resume();
        const now = this.ctx.currentTime;
        const noiseBuffer = this.getNoiseBuffer(duration);
        if (!noiseBuffer) return;

        const noiseSource = this.ctx.createBufferSource();
        noiseSource.buffer = noiseBuffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        if (filter.Q) filter.Q.value = 2.2;
        filter.frequency.setValueAtTime(220, now);
        filter.frequency.linearRampToValueAtTime(580, now + duration * 0.45);
        filter.frequency.linearRampToValueAtTime(180, now + duration);

        const gain = this.ctx.createGain();
        const windVol = 0.28 * this.sfxVolume;
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(windVol, now + duration * 0.35);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        noiseSource.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        noiseSource.start(now);
        if (noiseSource.stop) noiseSource.stop(now + duration);
    }

    playSplash() {
        if (this.muted || !this.ctx) return;
        this.resume();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(480 + Math.random() * 200, now);
        osc.frequency.exponentialRampToValueAtTime(140, now + 0.09);

        gain.gain.setValueAtTime(0.08 * this.sfxVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.09);
    }
}

window.soundEngine = new SoundEngine();
