// Synthesized Sound Effects Engine using Web Audio API
class SoundEngine {
    constructor() {
        this.ctx = null;
        this.muted = false;
        this.sfxVolume = 0.5;
        this.cutsceneNodes = [];
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

    stopCutsceneAudio() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        if (this.cutsceneNodes && this.cutsceneNodes.length > 0) {
            this.cutsceneNodes.forEach(item => {
                try {
                    if (item.gain) {
                        item.gain.gain.cancelScheduledValues(now);
                        item.gain.gain.setValueAtTime(item.gain.gain.value, now);
                        item.gain.gain.linearRampToValueAtTime(0.0001, now + 0.3);
                    }
                    if (item.osc) {
                        item.osc.stop(now + 0.35);
                    }
                } catch (e) {}
            });
            this.cutsceneNodes = [];
        }
    }

    playDialogueBlip() {
        if (this.muted || !this.ctx) return;
        this.resume();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(980 + Math.random() * 240, now);
        osc.frequency.exponentialRampToValueAtTime(640, now + 0.035);

        gain.gain.setValueAtTime(0.045 * this.sfxVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.035);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.035);
    }

    playIntroTheme() {
        if (this.muted || !this.ctx) return;
        this.resume();
        this.stopCutsceneAudio();

        const now = this.ctx.currentTime;
        const masterGain = this.ctx.createGain();
        masterGain.gain.setValueAtTime(0.001, now);
        masterGain.gain.linearRampToValueAtTime(0.42 * this.sfxVolume, now + 1.2);
        masterGain.connect(this.ctx.destination);
        this.cutsceneNodes.push({ gain: masterGain });

        // Deep mysterious atmospheric drone
        const droneFrequencies = [55, 82.4, 110]; // A1, E2, A2
        droneFrequencies.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = idx === 0 ? 'sine' : 'triangle';
            osc.frequency.setValueAtTime(freq, now);

            // Gentle slow detune pulse
            osc.frequency.linearRampToValueAtTime(freq + (idx === 1 ? 1.5 : -1.0), now + 8);

            gain.gain.setValueAtTime(0.25 / droneFrequencies.length, now);
            osc.connect(gain);
            gain.connect(masterGain);
            osc.start(now);
            this.cutsceneNodes.push({ osc: osc, gain: gain });
        });

        // Eerie ancient pentatonic chime arpeggios
        const melodyNotes = [
            { note: 440, time: 0.8 },    // A4
            { note: 523.25, time: 1.6 }, // C5
            { note: 659.25, time: 2.4 }, // E5
            { note: 587.33, time: 3.2 }, // D5
            { note: 440, time: 4.2 },    // A4
            { note: 392.00, time: 5.2 }, // G4
            { note: 440, time: 6.2 }     // A4
        ];

        melodyNotes.forEach(m => {
            const mTime = now + m.time;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(m.note, mTime);

            gain.gain.setValueAtTime(0.0001, mTime);
            gain.gain.linearRampToValueAtTime(0.18, mTime + 0.08);
            gain.gain.exponentialRampToValueAtTime(0.0001, mTime + 0.85);

            osc.connect(gain);
            gain.connect(masterGain);
            osc.start(mTime);
            osc.stop(mTime + 0.9);
            this.cutsceneNodes.push({ osc: osc, gain: gain });
        });

        // Tribal war drum pulse
        const drumTimes = [0.4, 1.2, 2.0, 2.8, 3.6, 4.4, 5.2, 6.0, 6.8, 7.6];
        drumTimes.forEach((dOffset, dIdx) => {
            const dTime = now + dOffset;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(dIdx % 2 === 0 ? 90 : 70, dTime);
            osc.frequency.exponentialRampToValueAtTime(32, dTime + 0.22);

            gain.gain.setValueAtTime(0.24, dTime);
            gain.gain.exponentialRampToValueAtTime(0.001, dTime + 0.22);

            osc.connect(gain);
            gain.connect(masterGain);
            osc.start(dTime);
            osc.stop(dTime + 0.23);
            this.cutsceneNodes.push({ osc: osc, gain: gain });
        });
    }

    playGrandFinaleTheme() {
        if (this.muted || !this.ctx) return;
        this.resume();
        this.stopCutsceneAudio();

        const now = this.ctx.currentTime;
        const masterGain = this.ctx.createGain();
        masterGain.gain.setValueAtTime(0.001, now);
        masterGain.gain.linearRampToValueAtTime(0.48 * this.sfxVolume, now + 0.6);
        masterGain.connect(this.ctx.destination);
        this.cutsceneNodes.push({ gain: masterGain });

        // Triumphant orchestral brass fanfare (D major -> G major -> A major -> high D)
        const chords = [
            { time: 0.1, duration: 0.8, freqs: [293.66, 369.99, 440.00] }, // D4, F#4, A4
            { time: 0.9, duration: 0.8, freqs: [392.00, 493.88, 587.33] }, // G4, B4, D5
            { time: 1.7, duration: 1.0, freqs: [440.00, 554.37, 659.25] }, // A4, C#5, E5
            { time: 2.8, duration: 2.8, freqs: [293.66, 440.00, 587.33, 880.00] } // Majestic D5 chord
        ];

        chords.forEach(c => {
            const chordStart = now + c.time;
            c.freqs.forEach(f => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                const filter = this.ctx.createBiquadFilter();

                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(f, chordStart);

                filter.type = 'lowpass';
                filter.frequency.setValueAtTime(1400, chordStart);
                filter.frequency.exponentialRampToValueAtTime(900, chordStart + c.duration);

                gain.gain.setValueAtTime(0.001, chordStart);
                gain.gain.linearRampToValueAtTime(0.16 / c.freqs.length, chordStart + 0.08);
                gain.gain.setValueAtTime(0.14 / c.freqs.length, chordStart + c.duration * 0.7);
                gain.gain.exponentialRampToValueAtTime(0.0001, chordStart + c.duration);

                osc.connect(filter);
                filter.connect(gain);
                gain.connect(masterGain);

                osc.start(chordStart);
                osc.stop(chordStart + c.duration + 0.05);
                this.cutsceneNodes.push({ osc: osc, gain: gain });
            });
        });

        // Shimmering victory harp arpeggio run
        const harpNotes = [
            { note: 293.66, time: 2.2 }, // D4
            { note: 369.99, time: 2.32 }, // F#4
            { note: 440.00, time: 2.44 }, // A4
            { note: 587.33, time: 2.56 }, // D5
            { note: 739.99, time: 2.68 }, // F#5
            { note: 880.00, time: 2.80 }, // A5
            { note: 1174.66, time: 2.92 } // D6
        ];

        harpNotes.forEach(h => {
            const hTime = now + h.time;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(h.note, hTime);

            gain.gain.setValueAtTime(0.0001, hTime);
            gain.gain.linearRampToValueAtTime(0.12, hTime + 0.04);
            gain.gain.exponentialRampToValueAtTime(0.0001, hTime + 0.75);

            osc.connect(gain);
            gain.connect(masterGain);
            osc.start(hTime);
            osc.stop(hTime + 0.8);
            this.cutsceneNodes.push({ osc: osc, gain: gain });
        });
    }

    playFireworkSound() {
        if (this.muted || !this.ctx) return;
        this.resume();
        const now = this.ctx.currentTime;

        // Ascending rocket whistle
        const whistleOsc = this.ctx.createOscillator();
        const whistleGain = this.ctx.createGain();
        whistleOsc.type = 'sine';
        whistleOsc.frequency.setValueAtTime(320 + Math.random() * 80, now);
        whistleOsc.frequency.exponentialRampToValueAtTime(1400 + Math.random() * 300, now + 0.28);

        whistleGain.gain.setValueAtTime(0.09 * this.sfxVolume, now);
        whistleGain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

        whistleOsc.connect(whistleGain);
        whistleGain.connect(this.ctx.destination);
        whistleOsc.start(now);
        whistleOsc.stop(now + 0.29);

        // Burst explosion & crackle
        const burstTime = now + 0.26;
        const burstNoise = this.getNoiseBuffer(0.8);
        if (burstNoise) {
            const noiseSource = this.ctx.createBufferSource();
            noiseSource.buffer = burstNoise;

            const filter = this.ctx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.setValueAtTime(450, burstTime);
            filter.Q.value = 1.2;

            const gain = this.ctx.createGain();
            gain.gain.setValueAtTime(0.35 * this.sfxVolume, burstTime);
            gain.gain.exponentialRampToValueAtTime(0.001, burstTime + 0.7);

            noiseSource.connect(filter);
            filter.connect(gain);
            gain.connect(this.ctx.destination);

            noiseSource.start(burstTime);
            noiseSource.stop(burstTime + 0.75);
        }
    }
}

window.soundEngine = new SoundEngine();
