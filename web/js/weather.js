// ============================================================================
// Frontier Defense - Dynamic Weather & Atmospheric Engine
// Provides living environmental simulation: weather cycles, wind physics,
// procedural lightning & thunder, volumetric fog, ground ripples, auroras & god rays.
// ============================================================================

class WeatherSystem {
    constructor(engine) {
        this.engine = engine;
        this.canvas = engine.canvas;
        this.ctx = engine.ctx;
        this.width = engine.width || 1280;
        this.height = engine.height || 720;

        // Settings mode: 'dynamic' (full), 'mild' (reduced), 'off' (disabled)
        this.mode = localStorage.getItem('frontier_weather_mode') || 'dynamic';
        this.autoCycle = false; // Weather applies once at stage start; no random mid-stage auto cycling

        // Comprehensive Weather Profiles (Accessible across any map)
        this.allWeathers = {
            clear: {
                id: 'clear',
                name: 'Sunlit Canopy',
                icon: '☀️',
                biomeGroup: 'Jungle / Clear',
                ambientTint: 'rgba(255, 225, 140, 0.14)',
                rainCount: 0,
                snowCount: 0,
                fogDensity: 0,
                windBase: 0.6,
                godRays: true,
                motes: 45, // golden spore/pollen sparkles
                intensity: 'Calm & Warm',
                effects: 'Golden Sunbeams & Gentle Breeze',
                desc: 'Warm golden sunlight filters down through the emerald canopy.'
            },
            rain_light: {
                id: 'rain_light',
                name: 'Tropical Drizzle',
                icon: '🌦️',
                biomeGroup: 'Jungle / Rain',
                ambientTint: 'rgba(25, 45, 40, 0.22)',
                rainCount: 80,
                snowCount: 0,
                fogDensity: 0.25,
                windBase: 1.4,
                ripples: true,
                splashes: true,
                intensity: 'Light Rainfall',
                effects: 'Expanding Water Ripples & Soft Rain',
                desc: 'A gentle tropical shower drenches the winding trails.'
            },
            thunderstorm: {
                id: 'thunderstorm',
                name: 'Monsoon Tempest',
                icon: '⛈️',
                biomeGroup: 'Storm / Gale',
                ambientTint: 'rgba(8, 14, 28, 0.52)', // deep dramatic storm darkening
                rainCount: 180,
                snowCount: 0,
                fogDensity: 0.45,
                windBase: 3.8,
                lightning: true,
                ripples: true,
                splashes: true,
                intensity: 'Violent Tempest',
                effects: 'Torrential Rain & Procedural Lightning Strikes',
                desc: 'Torrential rains and roaring lightning shake the jungle.'
            },
            fog: {
                id: 'fog',
                name: 'River Mist',
                icon: '🌫️',
                biomeGroup: 'Atmospheric',
                ambientTint: 'rgba(160, 195, 185, 0.32)',
                rainCount: 15,
                snowCount: 0,
                fogDensity: 0.85,
                windBase: 0.4,
                intensity: 'Dense Mist',
                effects: 'Volumetric Drifting Vapor Clouds',
                desc: 'A dense, humid vapor rolls off the serpentine river.'
            },
            windy: {
                id: 'windy',
                name: 'Jungle Gale',
                icon: '🍃',
                biomeGroup: 'High Winds',
                ambientTint: 'rgba(30, 48, 35, 0.18)',
                rainCount: 0,
                snowCount: 0,
                fogDensity: 0.12,
                windBase: 4.2,
                leaves: 45,
                intensity: 'Gale Force',
                effects: 'Swirling Foliage & Rapid Wind Streaks',
                desc: 'Fierce squalls tear fluttering leaves from the high branches.'
            },
            snow_light: {
                id: 'snow_light',
                name: 'Gentle Snowfall',
                icon: '❄️',
                biomeGroup: 'Tundra / Snow',
                ambientTint: 'rgba(30, 45, 75, 0.24)',
                rainCount: 0,
                snowCount: 110,
                fogDensity: 0.20,
                windBase: 1.1,
                intensity: 'Moderate Flurries',
                effects: 'Fluffy Fluttering Crystalline Snowflakes',
                desc: 'Delicate snowflakes flutter silently down over frozen rocks.'
            },
            blizzard: {
                id: 'blizzard',
                name: 'Howling Blizzard',
                icon: '🌨️',
                biomeGroup: 'Sub-Zero Storm',
                ambientTint: 'rgba(215, 240, 255, 0.38)',
                rainCount: 0,
                snowCount: 220,
                fogDensity: 0.55,
                windBase: 5.2,
                frostVignette: true,
                intensity: 'Whiteout Warning',
                effects: 'High-Speed Flurries & Icy Border Frost',
                desc: 'A howling sub-zero squall whips blinding snow horizontally!'
            },
            aurora: {
                id: 'aurora',
                name: 'Celestial Aurora',
                icon: '🌌',
                biomeGroup: 'Arctic Wonders',
                ambientTint: 'rgba(20, 10, 45, 0.34)',
                rainCount: 0,
                snowCount: 40,
                fogDensity: 0.18,
                windBase: 0.6,
                aurora: true,
                sparkles: 30,
                intensity: 'Mystical Glow',
                effects: 'Emerald & Violet Luminescent Sky Curtains',
                desc: 'Ethereal curtains of emerald and violet luminescence ripple in the sky.'
            }
        };

        // Biome default sequences
        this.biomeProfiles = {
            jungle: ['clear', 'rain_light', 'thunderstorm', 'fog', 'windy'],
            snow: ['snow_light', 'blizzard', 'aurora', 'clear', 'fog']
        };

        // Active State
        this.biomeKey = 'jungle';
        this.currentWeather = this.allWeathers.clear;
        this.targetWeather = this.allWeathers.clear;
        this.transitionProgress = 1.0;
        this.transitionDuration = 3.0; // seconds to cross-fade weather
        this.weatherTimer = 0;
        this.weatherDuration = 45.0; // seconds per natural cycle
        this.gameTime = 0;

        // Wind Physics
        this.windX = 0;
        this.windY = 0;
        this.windTargetX = 0;
        this.windGustTimer = 10.0;
        this.windGustActive = false;
        this.windGustDuration = 0;

        // Particle Systems
        this.rainParticles = [];
        this.snowParticles = [];
        this.fogClouds = [];
        this.leavesParticles = [];
        this.moteParticles = [];
        this.groundRipples = [];
        this.splashParticles = [];

        // Lightning System
        this.lightningTimer = 0;
        this.lightningBolts = [];
        this.screenFlash = 0;
        this.thunderCooldown = 0;

        // Pre-allocate fog clouds
        this.initFogClouds();
    }

    setMode(mode) {
        if (['dynamic', 'mild', 'off'].includes(mode)) {
            this.mode = mode;
            localStorage.setItem('frontier_weather_mode', mode);
            if (mode === 'off') {
                this.clearParticles();
            } else {
                this.syncParticlesWithWeather();
            }
        }
    }

    initForBiome(biomeKey, levelId = 1) {
        this.width = this.engine.width || 1280;
        this.height = this.engine.height || 720;
        this.biomeKey = (biomeKey === 'snow' || levelId >= 6) ? 'snow' : 'jungle';

        // Stage index within current biome (1 to 5)
        // Forest (Jungle): Levels 1-5 (Stage 1 to 5)
        // Glacier (Snow): Levels 6-10 (Stage 1 to 5)
        const stageInBiome = (levelId <= 5) ? levelId : (levelId - 5);

        let startKey = 'clear';
        let isHazardStage = false;

        if (this.biomeKey === 'jungle') {
            if (stageInBiome < 3) {
                // Forest stages 1 & 2: Calm default canopy, no weather hazard
                startKey = 'clear';
                isHazardStage = false;
            } else {
                // Forest stages 3, 4, 5: Weather applies once at stage start
                isHazardStage = true;
                if (stageInBiome === 3) {
                    startKey = 'rain_light'; // Stage 3: Tropical Drizzle
                } else if (stageInBiome === 4) {
                    startKey = 'fog'; // Stage 4: River Mist
                } else {
                    startKey = 'thunderstorm'; // Stage 5: Monsoon Tempest (Titan Boss)
                }
            }
        } else {
            // Glacier (Snow) biome
            if (stageInBiome < 3) {
                // Glacier stages 1 & 2: Calm default snow flurries, no weather hazard
                startKey = 'snow_light';
                isHazardStage = false;
            } else {
                // Glacier stages 3, 4, 5: Weather applies once at stage start
                isHazardStage = true;
                if (stageInBiome === 3) {
                    startKey = 'aurora'; // Stage 3: Celestial Aurora
                } else if (stageInBiome === 4) {
                    startKey = 'windy'; // Stage 4: Sub-Zero Gale
                } else {
                    startKey = 'blizzard'; // Stage 5: Howling Blizzard (Frost King Boss)
                }
            }
        }

        this.currentWeather = this.allWeathers[startKey] || this.allWeathers.clear;
        this.targetWeather = this.currentWeather;
        this.transitionProgress = 1.0;
        this.weatherTimer = 0;
        this.weatherDuration = 999999.0; // Weather remains steady throughout stage
        this.gameTime = 0;

        this.clearParticles();
        this.initFogClouds();
        this.syncParticlesWithWeather();
        this.notifyWeatherChanged(false);

        // Weather applies only once at stage starting from 3rd stage with atmospheric alert banner
        if (isHazardStage && this.mode !== 'off') {
            setTimeout(() => {
                this.notifyWeatherChanged(true);
                if (window.soundEngine) {
                    if (startKey === 'thunderstorm') {
                        setTimeout(() => this.triggerLightningStrike(), 500);
                    } else if (startKey === 'blizzard' || startKey === 'windy') {
                        window.soundEngine.playWindGust(2.5);
                    }
                }
            }, 400);
        }
    }

    clearParticles() {
        this.rainParticles = [];
        this.snowParticles = [];
        this.leavesParticles = [];
        this.moteParticles = [];
        this.groundRipples = [];
        this.splashParticles = [];
        this.lightningBolts = [];
        this.screenFlash = 0;
    }

    initFogClouds() {
        this.fogClouds = [];
        const count = 8;
        for (let i = 0; i < count; i++) {
            this.fogClouds.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height * 0.9,
                radius: 200 + Math.random() * 180,
                vx: 8 + Math.random() * 16,
                vy: -3 + Math.random() * 6,
                alpha: 0.28 + Math.random() * 0.32,
                phase: Math.random() * Math.PI * 2
            });
        }
    }

    onWaveStart(waveIndex, totalWaves) {
        // Weather applies strictly once when the stage starts and does not cycle during waves
        if (this.mode === 'off' || !this.autoCycle) return;
        const isFinalWave = (waveIndex >= totalWaves - 1);
        if (isFinalWave) {
            // Climax weather only if autoCycle was explicitly enabled by player
            if (this.biomeKey === 'jungle') {
                this.setWeather('thunderstorm', 2.0);
            } else {
                this.setWeather('blizzard', 2.0);
            }
        }
    }

    setWeather(weatherKey, transitionDuration = 1.5) {
        const next = this.allWeathers[weatherKey];
        if (!next) return;

        this.targetWeather = next;
        this.transitionDuration = transitionDuration;
        this.transitionProgress = 0.0;
        this.weatherTimer = 0;

        this.syncParticlesWithWeather();
        this.notifyWeatherChanged(true);

        // Ambient sound cue on weather change
        if (window.soundEngine) {
            if (weatherKey === 'thunderstorm') {
                setTimeout(() => this.triggerLightningStrike(), 400);
            } else if (weatherKey === 'blizzard' || weatherKey === 'windy') {
                window.soundEngine.playWindGust(2.5);
            }
        }
    }

    advanceToNextWeather(transitionDuration = 4.0) {
        const sequence = this.biomeProfiles[this.biomeKey] || Object.keys(this.allWeathers);
        const candidates = sequence.filter(k => k !== this.currentWeather.id);
        const randomKey = candidates[Math.floor(Math.random() * candidates.length)];
        this.setWeather(randomKey, transitionDuration);
    }

    cycleWeather() {
        const keys = Object.keys(this.allWeathers);
        const curId = this.targetWeather ? this.targetWeather.id : this.currentWeather.id;
        const nextIndex = (keys.indexOf(curId) + 1) % keys.length;
        this.setWeather(keys[nextIndex], 1.2);
        return this.targetWeather;
    }

    notifyWeatherChanged(isManualOrAlert = true) {
        const info = this.getCurrentWeatherInfo();
        if (window.ui && window.ui.onWeatherChanged) {
            window.ui.onWeatherChanged(info, isManualOrAlert);
        }
    }

    syncParticlesWithWeather() {
        if (this.mode === 'off') return;

        const maxRain = Math.max(this.currentWeather.rainCount || 0, this.targetWeather.rainCount || 0);
        const maxSnow = Math.max(this.currentWeather.snowCount || 0, this.targetWeather.snowCount || 0);
        const maxLeaves = Math.max(this.currentWeather.leaves || 0, this.targetWeather.leaves || 0);
        const maxMotes = Math.max((this.currentWeather.motes || 0) + (this.currentWeather.sparkles || 0), 
                                  (this.targetWeather.motes || 0) + (this.targetWeather.sparkles || 0));

        const scale = this.mode === 'mild' ? 0.5 : 1.0;

        // Populate Rain
        const targetRain = Math.round(maxRain * scale);
        while (this.rainParticles.length < targetRain) {
            this.rainParticles.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                length: 24 + Math.random() * 22,
                speed: 750 + Math.random() * 400,
                alpha: 0.60 + Math.random() * 0.35,
                thickness: 1.8 + Math.random() * 1.2
            });
        }

        // Populate Snow
        const targetSnow = Math.round(maxSnow * scale);
        while (this.snowParticles.length < targetSnow) {
            this.snowParticles.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                radius: 2.2 + Math.random() * 3.8,
                speedY: 60 + Math.random() * 80,
                flutterSpeed: 1.8 + Math.random() * 3.2,
                flutterAmp: 30 + Math.random() * 40,
                flutterOffset: Math.random() * Math.PI * 2,
                alpha: 0.65 + Math.random() * 0.35
            });
        }

        // Populate Leaves
        const targetLeaves = Math.round(maxLeaves * scale);
        while (this.leavesParticles.length < targetLeaves) {
            this.leavesParticles.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                size: 9 + Math.random() * 7,
                rotation: Math.random() * Math.PI * 2,
                rotSpeed: -4 + Math.random() * 8,
                speedX: 240 + Math.random() * 160,
                speedY: 80 + Math.random() * 70,
                color: Math.random() > 0.4 ? '#22c55e' : '#f59e0b',
                alpha: 0.75 + Math.random() * 0.25
            });
        }

        // Populate Motes / Sparkles
        const targetMotes = Math.round(maxMotes * scale);
        while (this.moteParticles.length < targetMotes) {
            this.moteParticles.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                radius: 1.8 + Math.random() * 2.8,
                vx: -20 + Math.random() * 40,
                vy: -20 + Math.random() * 40,
                alpha: 0.35 + Math.random() * 0.60,
                pulseSpeed: 1.5 + Math.random() * 2.5,
                phase: Math.random() * Math.PI * 2
            });
        }
    }

    // =========================================================================
    // UPDATE CYCLE
    // =========================================================================
    update(dt, effectiveDt) {
        if (this.mode === 'off') return;

        this.gameTime += dt;
        this.weatherTimer += dt;

        // 1. Natural Weather Cycle Progression (if Auto-Cycle enabled)
        if (this.transitionProgress >= 1.0) {
            if (this.autoCycle && this.weatherTimer >= this.weatherDuration) {
                this.weatherTimer = 0;
                this.weatherDuration = 40.0 + Math.random() * 25.0;
                this.advanceToNextWeather(3.5);
            }
        } else {
            this.transitionProgress = Math.min(1.0, this.transitionProgress + (dt / this.transitionDuration));
            if (this.transitionProgress >= 1.0) {
                this.currentWeather = this.targetWeather;
                if (window.ui && window.ui.updateHUD) window.ui.updateHUD();
            }
        }

        // 2. Wind Physics & Gusts
        const curWind = this.currentWeather.windBase || 1.0;
        const tgtWind = this.targetWeather.windBase || 1.0;
        const blendedWind = curWind + (tgtWind - curWind) * this.transitionProgress;

        this.windGustTimer -= dt;
        if (this.windGustTimer <= 0) {
            this.windGustActive = true;
            this.windGustDuration = 3.0 + Math.random() * 2.5;
            this.windGustTimer = 12.0 + Math.random() * 10.0;
            if (window.soundEngine && (this.currentWeather.id === 'thunderstorm' || this.currentWeather.id === 'blizzard' || this.currentWeather.id === 'windy')) {
                window.soundEngine.playWindGust(this.windGustDuration);
            }
        }

        let gustMultiplier = 1.0;
        if (this.windGustActive) {
            this.windGustDuration -= dt;
            gustMultiplier = 2.0 + Math.sin(this.gameTime * 4) * 0.5;
            if (this.windGustDuration <= 0) {
                this.windGustActive = false;
            }
        }

        // Wind vector oscillates organically
        this.windTargetX = (Math.sin(this.gameTime * 0.35) * 0.5 + 0.8) * blendedWind * gustMultiplier;
        this.windX += (this.windTargetX - this.windX) * Math.min(1.0, dt * 2.5);
        this.windY = Math.cos(this.gameTime * 0.3) * 0.2;

        // 3. Update Rain Particles
        const curRain = this.currentWeather.rainCount || 0;
        const tgtRain = this.targetWeather.rainCount || 0;
        const activeRainCount = Math.round(curRain + (tgtRain - curRain) * this.transitionProgress);

        for (let i = 0; i < this.rainParticles.length; i++) {
            const p = this.rainParticles[i];
            if (i >= activeRainCount) continue;

            p.x += (this.windX * 220) * effectiveDt;
            p.y += p.speed * effectiveDt;

            // Spawn ground ripple & splashes on impact
            if (p.y >= this.height) {
                if (Math.random() < 0.40 && this.groundRipples.length < 40) {
                    this.spawnGroundRipple(p.x, this.height - 4 - Math.random() * (this.height * 0.65));
                }
                p.y = -30 - Math.random() * 50;
                p.x = Math.random() * (this.width + 400) - 200;
            }
            if (p.x < -200) p.x = this.width + 100;
            if (p.x > this.width + 200) p.x = -100;
        }

        // 4. Update Snow Particles
        const curSnow = this.currentWeather.snowCount || 0;
        const tgtSnow = this.targetWeather.snowCount || 0;
        const activeSnowCount = Math.round(curSnow + (tgtSnow - curSnow) * this.transitionProgress);

        for (let i = 0; i < this.snowParticles.length; i++) {
            const s = this.snowParticles[i];
            if (i >= activeSnowCount) continue;

            const flutter = Math.sin(this.gameTime * s.flutterSpeed + s.flutterOffset) * s.flutterAmp;
            s.x += (this.windX * 110 + flutter) * effectiveDt;
            s.y += (s.speedY + (this.currentWeather.id === 'blizzard' ? 120 : 0)) * effectiveDt;

            if (s.y > this.height + 15) {
                s.y = -15;
                s.x = Math.random() * (this.width + 300) - 150;
            }
            if (s.x < -150) s.x = this.width + 50;
            if (s.x > this.width + 150) s.x = -50;
        }

        // 5. Update Leaves (Gale)
        const curLeaves = this.currentWeather.leaves || 0;
        const tgtLeaves = this.targetWeather.leaves || 0;
        const activeLeaves = Math.round(curLeaves + (tgtLeaves - curLeaves) * this.transitionProgress);

        for (let i = 0; i < this.leavesParticles.length; i++) {
            const l = this.leavesParticles[i];
            if (i >= activeLeaves) continue;

            l.x += (l.speedX * this.windX * 0.9) * effectiveDt;
            l.y += (l.speedY + Math.sin(this.gameTime * 3.5 + i) * 40) * effectiveDt;
            l.rotation += l.rotSpeed * effectiveDt;

            if (l.x > this.width + 60 || l.y > this.height + 60) {
                l.x = -40;
                l.y = Math.random() * this.height * 0.85;
            }
        }

        // 6. Update Motes / Sparkles
        for (let i = 0; i < this.moteParticles.length; i++) {
            const m = this.moteParticles[i];
            m.x += (m.vx + this.windX * 25) * effectiveDt;
            m.y += m.vy * effectiveDt;
            m.phase += m.pulseSpeed * effectiveDt;

            if (m.x < 0) m.x = this.width;
            if (m.x > this.width) m.x = 0;
            if (m.y < 0) m.y = this.height;
            if (m.y > this.height) m.y = 0;
        }

        // 7. Update Ground Ripples
        for (let i = this.groundRipples.length - 1; i >= 0; i--) {
            const r = this.groundRipples[i];
            r.life += effectiveDt;
            r.radius = (r.life / r.maxLife) * r.targetRadius;
            r.alpha = (1.0 - (r.life / r.maxLife)) * 0.75;
            if (r.life >= r.maxLife) {
                this.groundRipples.splice(i, 1);
            }
        }

        // 8. Update Water Splashes
        for (let i = this.splashParticles.length - 1; i >= 0; i--) {
            const sp = this.splashParticles[i];
            sp.x += sp.vx * effectiveDt;
            sp.y += sp.vy * effectiveDt;
            sp.vy += 260 * effectiveDt;
            sp.life += effectiveDt;
            sp.alpha = 1.0 - (sp.life / sp.maxLife);
            if (sp.life >= sp.maxLife) {
                this.splashParticles.splice(i, 1);
            }
        }

        // 9. Update Fog Clouds
        this.fogClouds.forEach(fc => {
            fc.x += (fc.vx + this.windX * 35) * effectiveDt;
            fc.y += fc.vy * effectiveDt;
            fc.phase += 0.5 * effectiveDt;
            if (fc.x - fc.radius > this.width) {
                fc.x = -fc.radius;
                fc.y = Math.random() * this.height * 0.9;
            }
        });

        // 10. Update Procedural Lightning
        if (this.currentWeather.id === 'thunderstorm' || this.targetWeather.id === 'thunderstorm') {
            this.lightningTimer -= dt;
            if (this.lightningTimer <= 0) {
                this.triggerLightningStrike();
                this.lightningTimer = 4.0 + Math.random() * 5.0; // frequent during storms
            }
        }

        // Decay screen flash
        if (this.screenFlash > 0) {
            this.screenFlash = Math.max(0, this.screenFlash - dt * 2.5);
        }

        // Decay active lightning bolts
        for (let i = this.lightningBolts.length - 1; i >= 0; i--) {
            const b = this.lightningBolts[i];
            b.life -= dt;
            if (b.life <= 0) {
                this.lightningBolts.splice(i, 1);
            }
        }
    }

    spawnGroundRipple(x, y) {
        this.groundRipples.push({
            x: x,
            y: y,
            radius: 1,
            targetRadius: 10 + Math.random() * 12,
            life: 0,
            maxLife: 0.45 + Math.random() * 0.30,
            alpha: 0.8
        });

        if (this.splashParticles.length < 30) {
            for (let j = 0; j < 3; j++) {
                this.splashParticles.push({
                    x: x,
                    y: y,
                    vx: -45 + Math.random() * 90,
                    vy: -55 - Math.random() * 65,
                    life: 0,
                    maxLife: 0.25 + Math.random() * 0.18,
                    alpha: 0.85
                });
            }
        }
    }

    triggerLightningStrike() {
        if (this.mode === 'off') return;

        const startX = 120 + Math.random() * (this.width - 240);
        const startY = 0;
        const endX = startX + (-180 + Math.random() * 360);
        const endY = 240 + Math.random() * (this.height * 0.6);

        const segments = [];
        this.generateBoltSegments(startX, startY, endX, endY, 75, segments);

        this.lightningBolts.push({
            segments: segments,
            life: 0.28,
            alpha: 1.0,
            color: '#e0f2fe'
        });

        // Trigger dramatic full-screen flash & screen shake
        this.screenFlash = 0.90;
        if (this.mode !== 'mild') {
            this.engine.screenShake = 0.55;
        }

        const thunderDelay = 120 + Math.random() * 250;
        setTimeout(() => {
            if (window.soundEngine) {
                window.soundEngine.playThunder(0.95 + Math.random() * 0.4);
            }
        }, thunderDelay);
    }

    generateBoltSegments(x1, y1, x2, y2, displace, segments, depth = 0) {
        if (depth > 4 || displace < 6) {
            segments.push({ x1, y1, x2, y2 });
            return;
        }

        const midX = (x1 + x2) / 2 + (-displace + Math.random() * (displace * 2));
        const midY = (y1 + y2) / 2 + (-displace * 0.4 + Math.random() * (displace * 0.8));

        this.generateBoltSegments(x1, y1, midX, midY, displace * 0.58, segments, depth + 1);
        this.generateBoltSegments(midX, midY, x2, y2, displace * 0.58, segments, depth + 1);

        if (depth === 2 && Math.random() < 0.6) {
            const branchEndX = midX + (-80 + Math.random() * 160);
            const branchEndY = midY + (50 + Math.random() * 90);
            this.generateBoltSegments(midX, midY, branchEndX, branchEndY, displace * 0.5, segments, depth + 2);
        }
    }

    // =========================================================================
    // LAYER 1: ATMOSPHERIC LIGHTING, GOD RAYS & AURORA (Under map objects)
    // =========================================================================
    renderAtmosphere(ctx) {
        if (this.mode === 'off') return;

        ctx.save();

        // 1. Dramatic Ambient Lighting Grade Tint
        const curTint = this.currentWeather.ambientTint || 'rgba(0,0,0,0)';
        const tgtTint = this.targetWeather.ambientTint || 'rgba(0,0,0,0)';
        
        ctx.fillStyle = this.transitionProgress >= 1.0 ? curTint : tgtTint;
        ctx.fillRect(0, 0, this.width, this.height);

        // 2. God Rays / Sunbeams (Clear)
        const curGodRays = this.currentWeather.godRays;
        const tgtGodRays = this.targetWeather.godRays;
        if (curGodRays || tgtGodRays) {
            const rayAlpha = (curGodRays ? (1.0 - this.transitionProgress) : 0) + 
                             (tgtGodRays ? this.transitionProgress : 0);
            if (rayAlpha > 0.05) {
                this.renderSunbeams(ctx, rayAlpha);
            }
        }

        // 3. Celestial Aurora Curtains (Snow Aurora)
        const curAurora = this.currentWeather.aurora;
        const tgtAurora = this.targetWeather.aurora;
        if (curAurora || tgtAurora) {
            const auroraAlpha = (curAurora ? (1.0 - this.transitionProgress) : 0) + 
                               (tgtAurora ? this.transitionProgress : 0);
            if (auroraAlpha > 0.05) {
                this.renderAurora(ctx, auroraAlpha);
            }
        }

        ctx.restore();
    }

    renderSunbeams(ctx, alpha) {
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        ctx.globalAlpha = alpha * 0.38; // high visibility sunbeams

        const rayCount = 6;
        for (let i = 0; i < rayCount; i++) {
            const shift = Math.sin(this.gameTime * 0.3 + i * 1.3) * 60;
            const x = 80 + i * 220 + shift;
            
            const grad = ctx.createLinearGradient(x, 0, x + 400, this.height);
            grad.addColorStop(0, 'rgba(255, 245, 190, 0.65)');
            grad.addColorStop(0.4, 'rgba(255, 230, 150, 0.35)');
            grad.addColorStop(1, 'rgba(255, 210, 110, 0.0)');

            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.moveTo(x - 50, 0);
            ctx.lineTo(x + 120, 0);
            ctx.lineTo(x + 520, this.height);
            ctx.lineTo(x + 250, this.height);
            ctx.closePath();
            ctx.fill();
        }
        ctx.restore();
    }

    renderAurora(ctx, alpha) {
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        ctx.globalAlpha = alpha * 0.75; // intensely glowing aurora

        const bands = [
            { col: 'rgba(52, 211, 153, 0.55)', yBase: 80, speed: 0.9 }, // Emerald
            { col: 'rgba(6, 182, 212, 0.50)', yBase: 125, speed: 0.6 },  // Cyan
            { col: 'rgba(168, 85, 247, 0.45)', yBase: 165, speed: 0.8 }  // Violet
        ];

        bands.forEach((b, idx) => {
            ctx.beginPath();
            ctx.moveTo(0, b.yBase);

            for (let x = 0; x <= this.width; x += 50) {
                const wave1 = Math.sin(x * 0.006 + this.gameTime * b.speed + idx) * 45;
                const wave2 = Math.cos(x * 0.01 - this.gameTime * 0.5 + idx * 2) * 25;
                ctx.lineTo(x, b.yBase + wave1 + wave2);
            }

            ctx.lineTo(this.width, 0);
            ctx.lineTo(0, 0);
            ctx.closePath();

            const grad = ctx.createLinearGradient(0, 0, 0, b.yBase + 110);
            grad.addColorStop(0, 'rgba(0,0,0,0)');
            grad.addColorStop(0.35, b.col);
            grad.addColorStop(1, 'rgba(0,0,0,0)');

            ctx.fillStyle = grad;
            ctx.fill();
        });

        ctx.restore();
    }

    // =========================================================================
    // LAYER 2: GROUND SPLASHES & RIPPLES (On terrain / paths)
    // =========================================================================
    renderGroundEffects(ctx) {
        if (this.mode === 'off') return;

        // 1. Water Ripples (Double concentric ring for maximum clarity)
        if (this.groundRipples.length > 0) {
            ctx.save();
            this.groundRipples.forEach(r => {
                ctx.strokeStyle = `rgba(224, 242, 254, ${r.alpha})`;
                ctx.lineWidth = 1.8;
                ctx.beginPath();
                ctx.ellipse(r.x, r.y, r.radius, r.radius * 0.45, 0, 0, Math.PI * 2);
                ctx.stroke();

                // Inner ring
                if (r.radius > 5) {
                    ctx.strokeStyle = `rgba(255, 255, 255, ${r.alpha * 0.7})`;
                    ctx.lineWidth = 1.2;
                    ctx.beginPath();
                    ctx.ellipse(r.x, r.y, r.radius * 0.55, r.radius * 0.25, 0, 0, Math.PI * 2);
                    ctx.stroke();
                }
            });
            ctx.restore();
        }

        // 2. Micro Droplet Splashes
        if (this.splashParticles.length > 0) {
            ctx.save();
            this.splashParticles.forEach(sp => {
                ctx.fillStyle = `rgba(255, 255, 255, ${sp.alpha})`;
                ctx.beginPath();
                ctx.arc(sp.x, sp.y, 1.8, 0, Math.PI * 2);
                ctx.fill();
            });
            ctx.restore();
        }
    }

    // =========================================================================
    // LAYER 3: PRECIPITATION & FLYING DEBRIS (Above units & towers)
    // =========================================================================
    renderPrecipitation(ctx) {
        if (this.mode === 'off') return;

        ctx.save();

        // 1. Volumetric Rolling Fog Clouds
        const curFog = this.currentWeather.fogDensity || 0;
        const tgtFog = this.targetWeather.fogDensity || 0;
        const activeFogDensity = curFog + (tgtFog - curFog) * this.transitionProgress;

        if (activeFogDensity > 0.05) {
            this.fogClouds.forEach(fc => {
                ctx.save();
                const radGrad = ctx.createRadialGradient(fc.x, fc.y, 0, fc.x, fc.y, fc.radius);
                const fogColor = this.biomeKey === 'snow' ? '225, 240, 255' : '205, 230, 220';
                radGrad.addColorStop(0, `rgba(${fogColor}, ${fc.alpha * activeFogDensity * 0.95})`);
                radGrad.addColorStop(0.5, `rgba(${fogColor}, ${fc.alpha * activeFogDensity * 0.45})`);
                radGrad.addColorStop(1, `rgba(${fogColor}, 0)`);

                ctx.fillStyle = radGrad;
                ctx.beginPath();
                ctx.arc(fc.x, fc.y, fc.radius, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            });
        }

        // 2. Rain Streaks (Bright, Crisp & Tilted by Wind)
        const curRain = this.currentWeather.rainCount || 0;
        const tgtRain = this.targetWeather.rainCount || 0;
        const activeRainCount = Math.round(curRain + (tgtRain - curRain) * this.transitionProgress);

        if (activeRainCount > 0) {
            ctx.save();
            ctx.strokeStyle = 'rgba(235, 248, 255, 0.85)'; // ultra bright visible rain streaks
            ctx.lineCap = 'round';

            const slantX = this.windX * 24;
            for (let i = 0; i < activeRainCount; i++) {
                const p = this.rainParticles[i];
                if (!p) continue;
                ctx.lineWidth = p.thickness;
                ctx.globalAlpha = p.alpha;
                ctx.beginPath();
                ctx.moveTo(p.x, p.y);
                ctx.lineTo(p.x + slantX, p.y + p.length);
                ctx.stroke();
            }
            ctx.restore();
        }

        // 3. Fluffy Snowflakes (Glowing White, Varied Sizes)
        const curSnow = this.currentWeather.snowCount || 0;
        const tgtSnow = this.targetWeather.snowCount || 0;
        const activeSnowCount = Math.round(curSnow + (tgtSnow - curSnow) * this.transitionProgress);

        if (activeSnowCount > 0) {
            ctx.save();
            ctx.fillStyle = '#ffffff';
            ctx.shadowColor = '#bae6fd';
            ctx.shadowBlur = 6;
            for (let i = 0; i < activeSnowCount; i++) {
                const s = this.snowParticles[i];
                if (!s) continue;
                ctx.globalAlpha = s.alpha;
                ctx.beginPath();
                ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        }

        // 4. Fluttering Jungle Leaves (Swirling Gale Winds)
        const curLeaves = this.currentWeather.leaves || 0;
        const tgtLeaves = this.targetWeather.leaves || 0;
        const activeLeaves = Math.round(curLeaves + (tgtLeaves - curLeaves) * this.transitionProgress);

        if (activeLeaves > 0) {
            ctx.save();
            for (let i = 0; i < activeLeaves; i++) {
                const l = this.leavesParticles[i];
                if (!l) continue;
                ctx.save();
                ctx.translate(l.x, l.y);
                ctx.rotate(l.rotation);
                ctx.fillStyle = l.color;
                ctx.globalAlpha = l.alpha;
                ctx.shadowColor = 'rgba(0,0,0,0.5)';
                ctx.shadowBlur = 4;
                ctx.beginPath();
                ctx.ellipse(0, 0, l.size, l.size * 0.5, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
            ctx.restore();
        }

        // 5. Spore Motes / Diamond Dust Sparkles
        const curMotes = (this.currentWeather.motes || 0) + (this.currentWeather.sparkles || 0);
        const tgtMotes = (this.targetWeather.motes || 0) + (this.targetWeather.sparkles || 0);
        const activeMotes = Math.round(curMotes + (tgtMotes - curMotes) * this.transitionProgress);

        if (activeMotes > 0) {
            ctx.save();
            const isSnow = (this.currentWeather.id === 'snow_light' || this.currentWeather.id === 'blizzard' || this.currentWeather.id === 'aurora');
            const moteColor = isSnow ? '#e0f2fe' : '#fef08a';
            ctx.shadowColor = moteColor;
            ctx.shadowBlur = 8;
            for (let i = 0; i < activeMotes; i++) {
                const m = this.moteParticles[i];
                if (!m) continue;
                const alpha = (0.35 + Math.sin(m.phase) * 0.35) * m.alpha;
                ctx.fillStyle = moteColor;
                ctx.globalAlpha = alpha;
                ctx.beginPath();
                ctx.arc(m.x, m.y, m.radius, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        }

        ctx.restore();
    }

    // =========================================================================
    // LAYER 4: POST-PROCESS OVERLAY (Lightning bolts, screen flash & frost border)
    // =========================================================================
    renderPostOverlay(ctx) {
        if (this.mode === 'off') return;

        // 1. Procedural Lightning Bolts (Electric Cyan with White Core)
        if (this.lightningBolts.length > 0) {
            ctx.save();
            this.lightningBolts.forEach(bolt => {
                // Outer ionizing glow
                ctx.strokeStyle = '#38bdf8';
                ctx.shadowColor = '#0ea5e9';
                ctx.shadowBlur = 20;
                ctx.lineWidth = 4.5;
                ctx.beginPath();
                bolt.segments.forEach(seg => {
                    ctx.moveTo(seg.x1, seg.y1);
                    ctx.lineTo(seg.x2, seg.y2);
                });
                ctx.stroke();

                // Bright white core streak
                ctx.strokeStyle = '#ffffff';
                ctx.shadowBlur = 0;
                ctx.lineWidth = 2.0;
                ctx.stroke();
            });
            ctx.restore();
        }

        // 2. Full-Screen Lightning Flash
        if (this.screenFlash > 0.02) {
            ctx.save();
            ctx.fillStyle = `rgba(235, 248, 255, ${this.screenFlash * 0.65})`;
            ctx.fillRect(0, 0, this.width, this.height);
            ctx.restore();
        }

        // 3. Frost Vignette (Blizzard sub-zero screen frost)
        const curFrost = this.currentWeather.frostVignette;
        const tgtFrost = this.targetWeather.frostVignette;
        if (curFrost || tgtFrost) {
            const frostAlpha = (curFrost ? (1.0 - this.transitionProgress) : 0) + 
                               (tgtFrost ? this.transitionProgress : 0);
            if (frostAlpha > 0.05) {
                ctx.save();
                const radGrad = ctx.createRadialGradient(
                    this.width / 2, this.height / 2, this.height * 0.30,
                    this.width / 2, this.height / 2, this.width * 0.55
                );
                radGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
                radGrad.addColorStop(0.65, `rgba(186, 230, 253, ${frostAlpha * 0.28})`);
                radGrad.addColorStop(1, `rgba(224, 248, 255, ${frostAlpha * 0.65})`);
                ctx.fillStyle = radGrad;
                ctx.fillRect(0, 0, this.width, this.height);
                ctx.restore();
            }
        }

        // 4. On-Canvas Tactical Weather Badge (Replaced by interactive DOM #btn-inlevel-weather-selector)
        // this.renderMapWeatherHUD(ctx);
    }

    renderMapWeatherHUD(ctx) {
        return; // Handled by interactive DOM button
        if (this.mode === 'off') return;
        const info = this.getCurrentWeatherInfo();

        ctx.save();
        const bx = 16;
        const by = 58;
        const bw = 245;
        const bh = 42;

        // Background pill
        ctx.fillStyle = 'rgba(15, 23, 42, 0.84)';
        ctx.strokeStyle = (info.id === 'thunderstorm') ? 'rgba(168, 85, 247, 0.75)' :
                          (info.id === 'blizzard' || info.id === 'snow_light') ? 'rgba(56, 189, 248, 0.75)' :
                          (info.id === 'aurora') ? 'rgba(52, 211, 153, 0.75)' :
                          'rgba(56, 189, 248, 0.5)';
        ctx.lineWidth = 1.5;

        // Draw rounded rectangle
        ctx.beginPath();
        const r = 10;
        ctx.moveTo(bx + r, by);
        ctx.lineTo(bx + bw - r, by);
        ctx.arcTo(bx + bw, by, bx + bw, by + r, r);
        ctx.lineTo(bx + bw, by + bh - r);
        ctx.arcTo(bx + bw, by + bh, bx + bw - r, by + bh, r);
        ctx.lineTo(bx + r, by + bh);
        ctx.arcTo(bx, by + bh, bx, by + bh - r, r);
        ctx.lineTo(bx, by + r);
        ctx.arcTo(bx, by, bx + r, by, r);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Icon + Name
        ctx.font = 'bold 13px sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${info.icon} ${info.name}`, bx + 10, by + 14);

        // Wind & Effects
        ctx.font = '10px sans-serif';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText(`🌬️ ${info.windSpeed} • ${info.intensity}`, bx + 10, by + 30);

        ctx.restore();
    }

    // Returns formatted status object for HUD pill, on-map widget & banner
    getCurrentWeatherInfo() {
        const active = this.targetWeather || this.currentWeather;
        const mph = Math.abs(Math.round(this.windX * 8));
        const dir = this.windX >= 0 ? 'East' : 'West';
        return {
            id: active.id,
            name: active.name,
            icon: active.icon,
            desc: active.desc,
            biomeGroup: active.biomeGroup || 'General',
            intensity: active.intensity || 'Normal',
            effects: active.effects || 'Standard Atmospheric Flow',
            windSpeed: `${mph} mph ${dir}`,
            windValue: mph,
            isTransitioning: this.transitionProgress < 1.0,
            autoCycle: this.autoCycle,
            mode: this.mode
        };
    }
}

window.WeatherSystem = WeatherSystem;
