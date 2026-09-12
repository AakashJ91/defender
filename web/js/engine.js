// Core Tower Defense Game Engine

// Utility: Smooth angular interpolation (shortest arc wrap)
function lerpAngle(current, target, factor) {
    let diff = (target - current) % (Math.PI * 2);
    if (diff < -Math.PI) diff += Math.PI * 2;
    if (diff > Math.PI) diff -= Math.PI * 2;
    return current + diff * factor;
}

class GameEngine {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = GAME_CONFIG.canvasWidth;
        this.height = GAME_CONFIG.canvasHeight;
        
        // High-DPI Retina smooth rendering
        this.dpr = Math.min(window.devicePixelRatio || 1, 2);
        this.canvas.width = this.width * this.dpr;
        this.canvas.height = this.height * this.dpr;
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';

        this.currentLevel = null;
        this.biome = null;
        this.lives = GAME_CONFIG.startingLives;
        this.gold = GAME_CONFIG.startingGold;
        this.score = 0;
        this.speed = 1;
        this.isPaused = false;
        this.gameOver = false;
        this.levelWon = false;

        // Entities
        this.towers = [];
        this.creeps = [];
        this.projectiles = [];
        this.particles = [];
        this.floatingTexts = [];
        this.weatherParticles = [];
        const WClass = (typeof WeatherSystem !== 'undefined') ? WeatherSystem : ((typeof window !== 'undefined' && window.WeatherSystem) ? window.WeatherSystem : null);
        this.weatherSystem = WClass ? new WClass(this) : null;

        // Waves
        this.currentWaveIndex = -1;
        this.isWaveActive = false;
        this.spawnQueue = [];
        this.spawnTimer = 0;

        // Selection & Interactions
        this.selectedSlot = null;
        this.selectedTower = null;
        this.activeSpell = null; // spell in targeting mode

        // Buffs & Effects
        this.rushDuration = 0; // seconds remaining for Battle Horn (+60% attack speed)
        this.screenShake = 0;

        // Spells Cooldowns
        this.spellCooldowns = {
            meteor: 0,
            freeze: 0,
            rush: 0
        };

        // Preload Biome Map Background Images
        this.bgImages = {
            jungle: new Image(),
            snow: new Image()
        };
        this.bgImages.jungle.src = 'assets/images/jungle_map.jpg';
        this.bgImages.snow.src = 'assets/images/snow_map.jpg';

        // Preload Enemy Sprites
        this.enemySprites = {};
        const enemyTypes = [
            'scout', 'crawler', 'bat', 'gorilla', 'shaman', 'jungle_boss',
            'frost_wolf', 'ice_revenant', 'wyvern', 'yeti', 'frost_witch', 'frost_boss'
        ];
        enemyTypes.forEach(type => {
            const img = new Image();
            img.src = `assets/images/enemies/${type}.svg`;
            this.enemySprites[type] = img;
        });

        // Preload Dart Spire Tiered Sprites (Transparent High-Res Top-Down PNGs)
        this.dartSpireSprites = {
            1: new Image(),
            2: new Image(),
            3: new Image()
        };
        this.dartSpireSprites[1].src = 'assets/images/dart_spire_t1.png';
        this.dartSpireSprites[2].src = 'assets/images/dart_spire_t2.png';
        this.dartSpireSprites[3].src = 'assets/images/dart_spire_t3.png';
        this.dartSpireSprite = this.dartSpireSprites[1];

        // Preload Bombard Cannon Tiered Sprites (Transparent High-Res Top-Down PNGs)
        this.bombardSprites = {
            1: new Image(),
            2: new Image(),
            3: new Image()
        };
        this.bombardSprites[1].src = 'assets/images/bombard_t1.png';
        this.bombardSprites[2].src = 'assets/images/bombard_t2.png';
        this.bombardSprites[3].src = 'assets/images/bombard_t3.png';
        this.bombardSprite = this.bombardSprites[1];

        // Preload Cryo Obelisk Tiered Sprites (Transparent High-Res Top-Down PNGs)
        this.cryoSprites = {
            1: new Image(),
            2: new Image(),
            3: new Image()
        };
        this.cryoSprites[1].src = 'assets/images/cryo_t1.png';
        this.cryoSprites[2].src = 'assets/images/cryo_t2.png';
        this.cryoSprites[3].src = 'assets/images/cryo_t3.png';
        this.cryoSprite = this.cryoSprites[1];

        // Preload Tesla Tower Tiered Sprites (Transparent High-Res Top-Down PNGs)
        this.teslaSprites = {
            1: new Image(),
            2: new Image(),
            3: new Image()
        };
        this.teslaSprites[1].src = 'assets/images/tesla_t1.png';
        this.teslaSprites[2].src = 'assets/images/tesla_t2.png';
        this.teslaSprites[3].src = 'assets/images/tesla_t3.png';
        this.teslaSprite = this.teslaSprites[1];

        // Preload Solar Spire Tiered Sprites (Transparent High-Res Top-Down PNGs)
        this.solarSprites = {
            1: new Image(),
            2: new Image(),
            3: new Image()
        };
        this.solarSprites[1].src = 'assets/images/solar_t1.png';
        this.solarSprites[2].src = 'assets/images/solar_t2.png';
        this.solarSprites[3].src = 'assets/images/solar_t3.png';
        this.solarSprite = this.solarSprites[1];

        // Preload Wake Spire Tiered Sprites (Transparent High-Res Top-Down PNGs)
        this.wakeSprites = {
            1: new Image(),
            2: new Image(),
            3: new Image()
        };
        this.wakeSprites[1].src = 'assets/images/wake_t1.png';
        this.wakeSprites[2].src = 'assets/images/wake_t2.png';
        this.wakeSprites[3].src = 'assets/images/wake_t3.png';
        this.wakeSprite = this.wakeSprites[1];

        // Preload Realistic Seamless Path Textures
        this.pathImages = {
            jungle: new Image(),
            snow: new Image()
        };
        this.pathImages.jungle.src = 'assets/images/jungle_path.png';
        this.pathImages.snow.src = 'assets/images/snow_path.png';
        this.pathPatterns = {};

        // Live Road Particle Systems
        this.roadParticles = [];
        this.trampleParticles = [];
        this.gameTime = 0;

        // Time tracking
        this.lastTime = performance.now();
        this.initWeather();
    }

    initRoadParticles() {
        this.roadParticles = [];
        if (!this.currentLevel || !this.currentLevel.path) return;
        const path = this.currentLevel.path;
        if (path.length < 2) return;
        const count = 38;
        for (let i = 0; i < count; i++) {
            const segIdx = Math.floor(Math.random() * (path.length - 1));
            this.roadParticles.push({
                segIdx: segIdx,
                t: Math.random(),
                lateral: (Math.random() - 0.5) * 26,
                size: 1.2 + Math.random() * 2.2,
                speed: 0.04 + Math.random() * 0.08,
                pulseSpeed: 1.8 + Math.random() * 2.5,
                pulseOffset: Math.random() * Math.PI * 2,
                alpha: 0.25 + Math.random() * 0.55
            });
        }
    }

    initWeather() {
        this.weatherParticles = [];
        const count = 80;
        for (let i = 0; i < count; i++) {
            this.weatherParticles.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                vx: -1 + Math.random() * 2,
                vy: 2 + Math.random() * 4,
                size: 1.5 + Math.random() * 2.5,
                alpha: 0.3 + Math.random() * 0.5
            });
        }
    }

    loadLevel(levelId) {
        const level = LEVELS.find(l => l.id === levelId);
        if (!level) return false;

        this.currentLevel = JSON.parse(JSON.stringify(level));
        this.biome = GAME_CONFIG.biomes[this.currentLevel.biome];
        this.lives = this.currentLevel.startingLives;
        this.gold = this.currentLevel.startingGold;
        this.score = 0;
        this.currentWaveIndex = -1;
        this.isWaveActive = false;
        this.spawnQueue = [];
        this.towers = [];
        this.creeps = [];
        this.projectiles = [];
        this.particles = [];
        this.floatingTexts = [];
        this.selectedSlot = null;
        this.selectedTower = null;
        this.activeSpell = null;
        this.gameOver = false;
        this.levelWon = false;
        this.rushDuration = 0;
        this.screenShake = 0;

        for (const k in this.spellCooldowns) {
            this.spellCooldowns[k] = 0;
        }

        if (this.weatherSystem) {
            this.weatherSystem.initForBiome(this.currentLevel.biome, this.currentLevel.id);
        } else {
            this.initWeather();
        }
        this.initRoadParticles();
        this.trampleParticles = [];
        if (window.ui) {
            window.ui.updateHUD();
            window.ui.closeModals();
        }
        return true;
    }

    startNextWave() {
        if (this.isWaveActive || this.gameOver || this.levelWon) return;
        if (this.currentWaveIndex + 1 >= this.currentLevel.waves.length) return;

        this.currentWaveIndex++;
        const waveData = this.currentLevel.waves[this.currentWaveIndex];
        this.isWaveActive = true;
        this.spawnQueue = [];

        waveData.creeps.forEach(group => {
            for (let i = 0; i < group.count; i++) {
                this.spawnQueue.push({
                    type: group.type,
                    delay: i * group.interval
                });
            }
        });

        // Sort spawn queue by delay
        this.spawnQueue.sort((a, b) => a.delay - b.delay);
        this.spawnTimer = 0;

        if (window.soundEngine) {
            window.soundEngine.playWaveStart();
        }
        if (this.weatherSystem) {
            this.weatherSystem.onWaveStart(this.currentWaveIndex, this.currentLevel.waves.length);
        }
        if (window.ui) {
            window.ui.updateHUD();
        }
    }

    spawnCreep(type) {
        const config = GAME_CONFIG.enemies[type];
        if (!config) return;

        const path = (config.type === 'air' && this.currentLevel.airPath) 
            ? this.currentLevel.airPath 
            : this.currentLevel.path;

        const creep = {
            id: Math.random().toString(36).substr(2, 9),
            type: type,
            name: config.name,
            hp: config.hp,
            maxHp: config.hp,
            speed: config.speed,
            baseSpeed: config.speed,
            armor: config.armor || 0,
            reward: config.reward,
            damageToBase: config.damageToBase || 1,
            size: config.size || 15,
            color: config.color,
            isAir: config.type === 'air',
            isBoss: !!config.isBoss,
            slowImmune: !!config.slowImmune,
            healRadius: config.healRadius || 0,
            healAmount: config.healAmount || 0,
            healCooldown: config.healCooldown || 0,
            healTimer: 0,
            shieldRadius: config.shieldRadius || 0,
            shieldAmount: config.shieldAmount || 0,
            shieldCooldown: config.shieldCooldown || 0,
            shieldTimer: 0,
            shield: 0,
            // Statuses
            frozenTime: 0,
            slowTime: 0,
            slowFactor: 1.0,
            burnTime: 0,
            burnDps: 0,
            burnTickTimer: 0,
            // Path progress
            path: path,
            pathIndex: 0,
            x: path[0].x,
            y: path[0].y,
            progressDistance: 0,
            angle: (path && path.length > 1) ? Math.atan2(path[1].y - path[0].y, path[1].x - path[0].x) : 0,
            walkTime: Math.random() * 5,
            ghostHp: config.hp,
            hitFlash: 0,
            tiltAngle: 0,
            staggerX: 0,
            staggerY: 0,
            breathTimer: Math.random() * Math.PI * 2,
            lastStepPhase: 0
        };

        this.creeps.push(creep);
    }

    buildTower(slotId, towerType) {
        const config = GAME_CONFIG.towers[towerType];
        if (!config || this.gold < config.cost) return false;

        const slot = this.currentLevel.buildSlots.find(s => s.id === slotId);
        if (!slot) return false;

        // Check if already occupied
        if (this.towers.some(t => t.slotId === slotId)) return false;

        this.gold -= config.cost;

        const tower = {
            id: Math.random().toString(36).substr(2, 9),
            slotId: slotId,
            type: towerType,
            name: config.name,
            level: 1,
            tierInfo: config,
            x: slot.x,
            y: slot.y,
            range: config.range,
            damage: config.damage,
            fireRate: config.fireRate,
            canTargetAir: config.canTargetAir,
            projectileType: config.projectileType,
            projectileSpeed: config.projectileSpeed,
            splashRadius: config.splashRadius || 0,
            slowFactor: config.slowFactor || 0,
            slowDuration: config.slowDuration || 0,
            chainCount: config.chainCount || 0,
            chainRange: config.chainRange || 0,
            burnDps: config.burnDps || 0,
            burnDuration: config.burnDuration || 0,
            knockback: config.knockback || 0,
            color: config.color,
            bulletColor: config.bulletColor,
            angle: 0,
            attackTimer: 0,
            recoil: 0,
            muzzleFlash: 0,
            barrelAlt: 0,
            totalInvested: config.cost,
            targetPriority: 'first', // first, last, strong, weak, close
            currentTarget: null
        };

        this.towers.push(tower);
        this.selectedTower = tower;
        this.selectedSlot = null;

        if (window.soundEngine) {
            window.soundEngine.playBuild();
        }
        if (window.AndroidBridge && window.AndroidBridge.vibrate) {
            window.AndroidBridge.vibrate(35);
        }
        if (window.ui) {
            window.ui.updateHUD();
            window.ui.showTowerInfo(tower);
        }
        return true;
    }

    upgradeTower(tower) {
        if (!tower) return false;
        const config = GAME_CONFIG.towers[tower.type];
        const nextUpgrade = config.upgrades.find(u => u.level === tower.level + 1);
        if (!nextUpgrade || this.gold < nextUpgrade.cost) return false;

        this.gold -= nextUpgrade.cost;
        tower.totalInvested += nextUpgrade.cost;
        tower.level = nextUpgrade.level;
        tower.name = nextUpgrade.name;
        tower.damage = nextUpgrade.damage;
        if (nextUpgrade.range) tower.range = nextUpgrade.range;
        if (nextUpgrade.fireRate) tower.fireRate = nextUpgrade.fireRate;
        if (nextUpgrade.splashRadius) tower.splashRadius = nextUpgrade.splashRadius;
        if (nextUpgrade.slowFactor) tower.slowFactor = nextUpgrade.slowFactor;
        if (nextUpgrade.slowDuration) tower.slowDuration = nextUpgrade.slowDuration;
        if (nextUpgrade.chainCount) tower.chainCount = nextUpgrade.chainCount;
        if (nextUpgrade.burnDps) tower.burnDps = nextUpgrade.burnDps;
        if (nextUpgrade.knockback) tower.knockback = nextUpgrade.knockback;

        this.addFloatingText(`LEVEL UP!`, tower.x, tower.y - 30, "#fbbf24");

        if (window.soundEngine) {
            window.soundEngine.playBuild();
        }
        if (window.ui) {
            window.ui.updateHUD();
            window.ui.showTowerInfo(tower);
        }
        return true;
    }

    sellTower(tower) {
        if (!tower) return false;
        const refund = Math.floor(tower.totalInvested * 0.7);
        this.gold += refund;

        this.towers = this.towers.filter(t => t.id !== tower.id);
        this.selectedTower = null;
        this.addFloatingText(`+${refund}G`, tower.x, tower.y - 20, "#fbbf24");

        if (window.soundEngine) {
            window.soundEngine.playCoin();
        }
        if (window.ui) {
            window.ui.updateHUD();
            window.ui.hideTowerInfo();
        }
        return true;
    }

    castSpell(spellKey, targetX, targetY) {
        const spell = GAME_CONFIG.spells[spellKey];
        if (!spell || this.gold < spell.cost || this.spellCooldowns[spellKey] > 0) return false;

        this.gold -= spell.cost;
        this.spellCooldowns[spellKey] = spell.cooldown;

        if (spellKey === 'meteor') {
            this.screenShake = 0.5;
            this.particles.push({
                type: 'meteor_strike',
                x: targetX,
                y: targetY,
                radius: spell.radius,
                life: 0.6,
                maxLife: 0.6
            });

            // Damage creeps in radius
            this.creeps.forEach(creep => {
                const dist = Math.hypot(creep.x - targetX, creep.y - targetY);
                if (dist <= spell.radius) {
                    this.damageCreep(creep, spell.damage, 'explosion');
                }
            });

            if (window.soundEngine) window.soundEngine.playSpell('meteor');
            if (window.AndroidBridge && window.AndroidBridge.vibrate) window.AndroidBridge.vibrate(80);
        } else if (spellKey === 'freeze') {
            this.creeps.forEach(creep => {
                if (!creep.slowImmune) {
                    creep.frozenTime = spell.duration;
                }
            });
            this.particles.push({
                type: 'screen_flash',
                color: 'rgba(147, 197, 253, 0.4)',
                life: 0.5,
                maxLife: 0.5
            });

            if (window.soundEngine) window.soundEngine.playSpell('freeze');
            if (window.AndroidBridge && window.AndroidBridge.vibrate) window.AndroidBridge.vibrate(50);
        } else if (spellKey === 'rush') {
            this.rushDuration = spell.duration;
            this.particles.push({
                type: 'screen_flash',
                color: 'rgba(251, 191, 36, 0.35)',
                life: 0.5,
                maxLife: 0.5
            });

            if (window.soundEngine) window.soundEngine.playSpell('rush');
            if (window.AndroidBridge && window.AndroidBridge.vibrate) window.AndroidBridge.vibrate(50);
        }

        if (window.ui) {
            window.ui.updateHUD();
        }
        return true;
    }

    damageCreep(creep, amount, type = 'normal') {
        // Physical armor reduces normal physical damage
        let effectiveDamage = amount;
        if (type === 'normal' || type === 'explosion') {
            effectiveDamage = amount * (1 - creep.armor);
        }

        // Check shield first
        if (creep.shield > 0) {
            if (creep.shield >= effectiveDamage) {
                creep.shield -= effectiveDamage;
                this.addFloatingText(`${Math.round(effectiveDamage)} [SHIELD]`, creep.x, creep.y - 12, '#93c5fd');
                return;
            } else {
                effectiveDamage -= creep.shield;
                creep.shield = 0;
            }
        }

        creep.hp -= effectiveDamage;
        creep.hitFlash = 0.18; // Instant high-contrast damage flash
        // Subtle tactile stagger kickback opposite to current travel direction
        const backAng = (creep.angle || 0) + Math.PI;
        creep.staggerX = Math.cos(backAng) * (creep.isBoss ? 2.5 : 4.5);
        creep.staggerY = Math.sin(backAng) * (creep.isBoss ? 2.5 : 4.5);

        this.addFloatingText(`-${Math.round(effectiveDamage)}`, creep.x, creep.y - 10, type === 'explosion' ? '#ef4444' : '#ffffff');

        // Particle blood/spark
        for (let i = 0; i < 4; i++) {
            this.particles.push({
                x: creep.x,
                y: creep.y,
                vx: (Math.random() - 0.5) * 80,
                vy: (Math.random() - 0.5) * 80,
                radius: 2 + Math.random() * 2,
                color: creep.color,
                life: 0.3,
                maxLife: 0.3
            });
        }

        if (creep.hp <= 0) {
            this.killCreep(creep);
        }
    }

    killCreep(creep) {
        const idx = this.creeps.indexOf(creep);
        if (idx !== -1) {
            this.creeps.splice(idx, 1);
            this.gold += creep.reward;
            this.score += creep.reward * 10;
            this.addFloatingText(`+${creep.reward}G`, creep.x, creep.y - 25, '#fbbf24');

            if (window.soundEngine) {
                window.soundEngine.playCoin();
            }

            // Burst particles
            const pCount = creep.isBoss ? 40 : 12;
            for (let i = 0; i < pCount; i++) {
                this.particles.push({
                    x: creep.x,
                    y: creep.y,
                    vx: (Math.random() - 0.5) * (creep.isBoss ? 250 : 140),
                    vy: (Math.random() - 0.5) * (creep.isBoss ? 250 : 140),
                    radius: 3 + Math.random() * 4,
                    color: creep.color,
                    life: 0.6,
                    maxLife: 0.6
                });
            }

            if (creep.isBoss) {
                this.screenShake = 0.6;
                if (window.AndroidBridge && window.AndroidBridge.vibrate) {
                    window.AndroidBridge.vibrate(120);
                }
            }

            if (window.ui) {
                window.ui.updateHUD();
            }
        }
    }

    addFloatingText(text, x, y, color = '#ffffff') {
        this.floatingTexts.push({
            text: text,
            x: x,
            y: y,
            color: color,
            alpha: 1.0,
            vy: -35,
            life: 0.7,
            maxLife: 0.7
        });
    }

    update(dt) {
        if (this.isPaused || this.gameOver || this.levelWon) return;

        // Apply speed multiplier
        const effectiveDt = dt * this.speed;
        this.gameTime = (this.gameTime || 0) + effectiveDt;

        // Update road ambient life and trample dust
        this.updateRoadParticles(effectiveDt);
        this.updateTrampleParticles(effectiveDt);

        // Screen shake decay
        if (this.screenShake > 0) {
            this.screenShake = Math.max(0, this.screenShake - dt * 2);
        }

        // Spell cooldowns
        for (const k in this.spellCooldowns) {
            if (this.spellCooldowns[k] > 0) {
                this.spellCooldowns[k] = Math.max(0, this.spellCooldowns[k] - dt);
            }
        }

        // Battle Rush buff
        if (this.rushDuration > 0) {
            this.rushDuration = Math.max(0, this.rushDuration - effectiveDt);
        }

        // Wave spawner
        if (this.isWaveActive && this.spawnQueue.length > 0) {
            this.spawnTimer += effectiveDt;
            while (this.spawnQueue.length > 0 && this.spawnTimer >= this.spawnQueue[0].delay) {
                const item = this.spawnQueue.shift();
                this.spawnCreep(item.type);
            }
        }

        // Check wave completion
        if (this.isWaveActive && this.spawnQueue.length === 0 && this.creeps.length === 0) {
            this.isWaveActive = false;
            const waveReward = this.currentLevel.waves[this.currentWaveIndex].reward;
            this.gold += waveReward;
            this.addFloatingText(`WAVE CLEAR! +${waveReward}G`, this.width / 2, 200, '#34d399');

            if (window.ui) {
                window.ui.updateHUD();
            }

            // Check if all waves completed -> Level Victory!
            if (this.currentWaveIndex >= this.currentLevel.waves.length - 1) {
                this.triggerVictory();
            }
        }

        // Update Creeps
        for (let i = this.creeps.length - 1; i >= 0; i--) {
            const creep = this.creeps[i];

            // Update hit-flash, stagger impulse, and breathing cycle
            if (creep.hitFlash > 0) creep.hitFlash = Math.max(0, creep.hitFlash - effectiveDt);
            if (creep.staggerX) creep.staggerX *= Math.pow(0.02, effectiveDt);
            if (creep.staggerY) creep.staggerY *= Math.pow(0.02, effectiveDt);
            creep.breathTimer = (creep.breathTimer || 0) + effectiveDt * 3.0;

            // Lagging ghost health bar decay for smooth damage chunks
            if (creep.ghostHp == null) creep.ghostHp = creep.hp;
            if (creep.ghostHp > creep.hp) {
                creep.ghostHp = Math.max(creep.hp, creep.ghostHp - creep.maxHp * 0.95 * effectiveDt);
            } else if (creep.ghostHp < creep.hp) {
                creep.ghostHp = creep.hp;
            }

            // Status: Frozen
            if (creep.frozenTime > 0) {
                creep.frozenTime -= effectiveDt;
                // Emit frosty sub-zero vapor
                if (Math.random() < 0.12) {
                    this.particles.push({
                        type: 'spark',
                        x: creep.x + (Math.random() - 0.5) * creep.size,
                        y: creep.y + (Math.random() - 0.5) * creep.size,
                        vx: (Math.random() - 0.5) * 12,
                        vy: -15 - Math.random() * 15,
                        radius: 1.8,
                        color: Math.random() > 0.5 ? '#bae6fd' : '#ffffff',
                        life: 0.28,
                        maxLife: 0.28
                    });
                }
                continue; // Frozen completely, cannot move or heal
            }

            // Status: Slow
            if (creep.slowTime > 0) {
                creep.slowTime -= effectiveDt;
                if (creep.slowTime <= 0) {
                    creep.slowFactor = 1.0;
                }
            } else {
                creep.slowFactor = 1.0;
            }

            // Status: Burn (DoT)
            if (creep.burnTime > 0) {
                creep.burnTime -= effectiveDt;
                creep.burnTickTimer += effectiveDt;
                if (creep.burnTickTimer >= 0.25) {
                    creep.burnTickTimer = 0;
                    this.damageCreep(creep, creep.burnDps * 0.25, 'burn');
                    if (creep.hp <= 0) continue;
                }
                // Emitting burning sparks & dark ember smoke
                if (Math.random() < 0.35) {
                    this.particles.push({
                        type: 'spark',
                        x: creep.x + (Math.random() - 0.5) * creep.size * 0.8,
                        y: creep.y + (Math.random() - 0.5) * creep.size * 0.8,
                        vx: (Math.random() - 0.5) * 20,
                        vy: -25 - Math.random() * 30,
                        radius: 2.0,
                        color: Math.random() > 0.4 ? '#f97316' : '#fbbf24',
                        life: 0.24,
                        maxLife: 0.24
                    });
                }
            }

            // Shaman Healing Aura
            if (creep.healRadius > 0) {
                creep.healTimer += effectiveDt;
                if (creep.healTimer >= creep.healCooldown) {
                    creep.healTimer = 0;
                    this.creeps.forEach(other => {
                        if (other !== creep && Math.hypot(other.x - creep.x, other.y - creep.y) <= creep.healRadius) {
                            other.hp = Math.min(other.maxHp, other.hp + creep.healAmount);
                            this.addFloatingText(`+${creep.healAmount}`, other.x, other.y - 12, '#22c55e');
                        }
                    });
                }
                // Channeling emerald spore motes
                if (Math.random() < 0.18) {
                    this.particles.push({
                        type: 'spark',
                        x: creep.x + (Math.random() - 0.5) * creep.size * 1.2,
                        y: creep.y + (Math.random() - 0.5) * creep.size * 1.2,
                        vx: (Math.random() - 0.5) * 15,
                        vy: -20 - Math.random() * 15,
                        radius: 2.2,
                        color: Math.random() > 0.5 ? '#34d399' : '#a3e635',
                        life: 0.35,
                        maxLife: 0.35
                    });
                }
            }

            // Witch Shield Aura
            if (creep.shieldRadius > 0) {
                creep.shieldTimer += effectiveDt;
                if (creep.shieldTimer >= creep.shieldCooldown) {
                    creep.shieldTimer = 0;
                    this.creeps.forEach(other => {
                        if (Math.hypot(other.x - creep.x, other.y - creep.y) <= creep.shieldRadius) {
                            other.shield = Math.min(250, other.shield + creep.shieldAmount);
                            this.addFloatingText(`+SHIELD`, other.x, other.y - 15, '#60a5fa');
                        }
                    });
                }
                // Channeling arcane crystal sparks
                if (Math.random() < 0.18) {
                    this.particles.push({
                        type: 'spark',
                        x: creep.x + (Math.random() - 0.5) * creep.size * 1.2,
                        y: creep.y + (Math.random() - 0.5) * creep.size * 1.2,
                        vx: (Math.random() - 0.5) * 15,
                        vy: -20 - Math.random() * 15,
                        radius: 2.2,
                        color: '#818cf8',
                        life: 0.35,
                        maxLife: 0.35
                    });
                }
            }

            // Movement along path
            const path = creep.path;
            const targetPoint = path[creep.pathIndex + 1];
            if (!targetPoint) {
                // Reached end of path: breach base!
                this.lives -= creep.damageToBase;
                this.screenShake = 0.4;
                this.creeps.splice(i, 1);

                if (window.soundEngine) {
                    window.soundEngine.playHit('explosion');
                }
                if (window.AndroidBridge && window.AndroidBridge.vibrate) {
                    window.AndroidBridge.vibrate(100);
                }
                if (window.ui) {
                    window.ui.updateHUD();
                }

                if (this.lives <= 0) {
                    this.lives = 0;
                    this.triggerDefeat();
                }
                continue;
            }

            const dx = targetPoint.x - creep.x;
            const dy = targetPoint.y - creep.y;
            const dist = Math.hypot(dx, dy);
            const step = creep.speed * creep.slowFactor * effectiveDt;

            if (dist > 0.01) {
                const targetAngle = Math.atan2(dy, dx);
                const prevAngle = creep.angle != null ? creep.angle : targetAngle;
                creep.angle = lerpAngle(prevAngle, targetAngle, Math.min(1, effectiveDt * 10));

                // Fluid angular turn-tilt banking (leans organically into curves)
                let angleDiff = (targetAngle - prevAngle) % (Math.PI * 2);
                if (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
                if (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
                const targetTilt = Math.max(-0.35, Math.min(0.35, angleDiff * 3.2));
                creep.tiltAngle = (creep.tiltAngle || 0) + (targetTilt - (creep.tiltAngle || 0)) * Math.min(1, effectiveDt * 8);
            }
            creep.walkTime = (creep.walkTime || 0) + effectiveDt * (creep.speed / 68) * (creep.slowFactor || 1);

            if (dist <= step) {
                creep.x = targetPoint.x;
                creep.y = targetPoint.y;
                creep.pathIndex++;
                creep.progressDistance += dist;
            } else {
                creep.x += (dx / dist) * step;
                creep.y += (dy / dist) * step;
                creep.progressDistance += step;
            }

            // Environmental footsteps, aerodynamic vortices & colossal boss tremors
            if (creep.isAir) {
                // High-speed aerial wingtip vortex wisps
                if (Math.random() < 0.16) {
                    const wingOffset = Math.sin(creep.walkTime * 14) > 0 ? 12 : -12;
                    this.particles.push({
                        type: 'smoke_puff',
                        x: creep.x - Math.cos(creep.angle) * 10 - Math.sin(creep.angle) * wingOffset,
                        y: creep.y - Math.sin(creep.angle) * 10 + Math.cos(creep.angle) * wingOffset + 12,
                        vx: -Math.cos(creep.angle) * 25,
                        vy: -Math.sin(creep.angle) * 25 + 5,
                        radius: 2.8,
                        color: 'rgba(255, 255, 255, 0.22)',
                        life: 0.25,
                        maxLife: 0.25
                    });
                }
            } else if (creep.isBoss) {
                // Boss Colossal Footstep Tremors: Trigger dust rings on step cadence impact
                const stepPhase = Math.sin(creep.walkTime * 4.2);
                if (stepPhase > 0.95 && (creep.lastStepPhase || 0) <= 0.95) {
                    this.particles.push({
                        type: 'sonic_cone',
                        x: creep.x,
                        y: creep.y + 12,
                        angle: 0,
                        radius: creep.size * 1.4,
                        color: 'rgba(245, 158, 11, 0.45)',
                        life: 0.28,
                        maxLife: 0.28
                    });
                    for (let s = 0; s < 4; s++) {
                        this.addTrampleParticle(creep.x + (Math.random() - 0.5) * 16, creep.y + (Math.random() - 0.5) * 16);
                    }
                }
                creep.lastStepPhase = stepPhase;
            } else {
                // Normal ground unit trample dust or snow flurries
                if (Math.random() < 0.20) {
                    this.addTrampleParticle(creep.x, creep.y);
                }
                // Frost creeps leave icy crystals on path
                if ((creep.type.includes('frost') || creep.type === 'ice_revenant' || creep.type === 'yeti') && Math.random() < 0.15) {
                    this.particles.push({
                        type: 'spark',
                        x: creep.x + (Math.random() - 0.5) * 8,
                        y: creep.y + (Math.random() - 0.5) * 8,
                        vx: (Math.random() - 0.5) * 10,
                        vy: -10,
                        radius: 1.6,
                        color: '#67e8f9',
                        life: 0.25,
                        maxLife: 0.25
                    });
                }
            }
        }

        // Update Towers & Attacks
        this.towers.forEach(tower => {
            let fireInterval = 1 / tower.fireRate;
            if (this.rushDuration > 0) {
                fireInterval /= 1.6; // 60% faster attack rate
            }

            // Recoil decay & muzzle flash decay
            if (tower.recoil > 0) {
                tower.recoil = Math.max(0, tower.recoil - effectiveDt * 6);
            }
            if (tower.muzzleFlash > 0) {
                tower.muzzleFlash = Math.max(0, tower.muzzleFlash - effectiveDt * 12);
            }

            tower.attackTimer += effectiveDt;

            // Find best target according to priority
            const validTargets = this.creeps.filter(c => {
                if (c.isAir && !tower.canTargetAir) return false;
                const d = Math.hypot(c.x - tower.x, c.y - tower.y);
                return d <= tower.range;
            });

            if (validTargets.length === 0) {
                tower.currentTarget = null;
                return;
            }

            let target = validTargets[0];
            if (tower.targetPriority === 'first') {
                target = validTargets.reduce((prev, curr) => curr.progressDistance > prev.progressDistance ? curr : prev);
            } else if (tower.targetPriority === 'last') {
                target = validTargets.reduce((prev, curr) => curr.progressDistance < prev.progressDistance ? curr : prev);
            } else if (tower.targetPriority === 'strong') {
                target = validTargets.reduce((prev, curr) => curr.hp > prev.hp ? curr : prev);
            } else if (tower.targetPriority === 'weak') {
                target = validTargets.reduce((prev, curr) => curr.hp < prev.hp ? curr : prev);
            } else if (tower.targetPriority === 'close') {
                target = validTargets.reduce((prev, curr) => {
                    const d1 = Math.hypot(prev.x - tower.x, prev.y - tower.y);
                    const d2 = Math.hypot(curr.x - tower.x, curr.y - tower.y);
                    return d2 < d1 ? curr : prev;
                });
            }

            tower.currentTarget = target;
            const desiredAngle = Math.atan2(target.y - tower.y, target.x - tower.x);
            tower.angle = lerpAngle(tower.angle != null ? tower.angle : desiredAngle, desiredAngle, Math.min(1, effectiveDt * 14));

            // Fire when ready
            if (tower.attackTimer >= fireInterval) {
                tower.attackTimer = 0;
                this.fireTower(tower, target);
            }
        });

        // Update Projectiles
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const p = this.projectiles[i];
            p.life -= effectiveDt;

            if (p.type === 'beam') {
                // Continuous thermal laser
                if (p.target && p.target.hp > 0) {
                    this.damageCreep(p.target, p.damage * effectiveDt, 'beam');
                    p.target.burnTime = p.burnDuration;
                    p.target.burnDps = p.burnDps;
                    // Molten slag sparks & solar thermal embers
                    if (Math.random() < 0.65) {
                        const tier = (p.tower && p.tower.level) || 1;
                        this.particles.push({
                            type: 'spark',
                            x: p.target.x + (Math.random() - 0.5) * 16,
                            y: p.target.y + (Math.random() - 0.5) * 16,
                            vx: (Math.random() - 0.5) * 80,
                            vy: (Math.random() - 0.5) * 80 - 15,
                            radius: tier === 3 ? 2.6 : 2.0,
                            color: tier === 3 ? (Math.random() > 0.4 ? '#fef08a' : '#f97316') : '#fbbf24',
                            life: 0.22,
                            maxLife: 0.22
                        });
                        if (Math.random() < 0.3) {
                            this.particles.push({
                                type: 'smoke_puff',
                                x: p.target.x + (Math.random() - 0.5) * 12,
                                y: p.target.y + (Math.random() - 0.5) * 12,
                                vx: (Math.random() - 0.5) * 20,
                                vy: -20 - Math.random() * 20,
                                radius: 3.5,
                                color: 'rgba(234, 88, 12, 0.4)',
                                life: 0.25,
                                maxLife: 0.25
                            });
                        }
                    }
                }
                if (p.life <= 0) {
                    this.projectiles.splice(i, 1);
                }
                continue;
            }

            if (p.life <= 0) {
                this.projectiles.splice(i, 1);
                continue;
            }

            // Move projectile towards target or target point
            const targetX = (p.target && p.target.hp > 0) ? p.target.x : p.targetX;
            const targetY = (p.target && p.target.hp > 0) ? p.target.y : p.targetY;
            const dx = targetX - p.x;
            const dy = targetY - p.y;
            const dist = Math.hypot(dx, dy);
            const step = p.speed * effectiveDt;

            if (dist > 0.001) {
                p.angle = Math.atan2(dy, dx);
            }

            // Continuous in-flight particle trails for archer projectiles
            if (p.towerType === 'archer') {
                p.trailTimer = (p.trailTimer || 0) - effectiveDt;
                if (p.trailTimer <= 0) {
                    p.trailTimer = 0.024; // ~40 fps trail emission
                    const lvl = p.level || (p.damage >= 100 ? 3 : (p.damage >= 40 ? 2 : 1));
                    const ang = p.angle || 0;
                    const backDist = lvl === 3 ? 12 : (lvl === 2 ? 10 : 8);
                    const trailX = p.x - Math.cos(ang) * backDist;
                    const trailY = p.y - Math.sin(ang) * backDist;

                    if (lvl === 3) {
                        // Cyan/emerald plasma vapor + hyper-velocity sparks
                        this.particles.push({
                            type: 'spark',
                            x: trailX,
                            y: trailY,
                            vx: -Math.cos(ang) * 45 + (Math.random() - 0.5) * 35,
                            vy: -Math.sin(ang) * 45 + (Math.random() - 0.5) * 35,
                            radius: 2.0,
                            color: Math.random() > 0.4 ? '#34d399' : '#6ee7b7',
                            life: 0.16,
                            maxLife: 0.16
                        });
                        this.particles.push({
                            type: 'smoke_puff',
                            x: trailX,
                            y: trailY,
                            vx: -Math.cos(ang) * 20 + (Math.random() - 0.5) * 12,
                            vy: -Math.sin(ang) * 20 + (Math.random() - 0.5) * 12,
                            radius: 3.5,
                            color: 'rgba(52, 211, 153, 0.45)',
                            life: 0.20,
                            maxLife: 0.20
                        });
                    } else if (lvl === 2) {
                        // Toxic venom vapor trail
                        this.particles.push({
                            type: 'poison_cloud',
                            x: trailX,
                            y: trailY,
                            vx: -Math.cos(ang) * 25 + (Math.random() - 0.5) * 15,
                            vy: -Math.sin(ang) * 25 + (Math.random() - 0.5) * 15,
                            drag: 0.90,
                            radius: 3.2,
                            color: 'rgba(163, 230, 53, 0.65)',
                            life: 0.20,
                            maxLife: 0.20
                        });
                    } else {
                        // Subtle aerodynamic white vapor trail
                        this.particles.push({
                            type: 'smoke_puff',
                            x: trailX,
                            y: trailY,
                            vx: -Math.cos(ang) * 18 + (Math.random() - 0.5) * 10,
                            vy: -Math.sin(ang) * 18 + (Math.random() - 0.5) * 10,
                            radius: 2.2,
                            color: 'rgba(241, 245, 249, 0.45)',
                            life: 0.14,
                            maxLife: 0.14
                        });
                    }
                }
            }

            // Continuous in-flight particle trails for cannon projectiles
            if (p.towerType === 'cannon') {
                p.trailTimer = (p.trailTimer || 0) - effectiveDt;
                if (p.trailTimer <= 0) {
                    p.trailTimer = 0.035;
                    const lvl = p.level || (p.damage >= 200 ? 3 : (p.damage >= 100 ? 2 : 1));
                    if (lvl === 3) {
                        // Volcanic molten sparks & magma smoke
                        this.particles.push({
                            type: 'spark',
                            x: p.x + (Math.random() - 0.5) * 6,
                            y: p.y + (Math.random() - 0.5) * 6,
                            vx: (Math.random() - 0.5) * 35,
                            vy: (Math.random() - 0.5) * 35,
                            radius: 2.4,
                            color: Math.random() > 0.4 ? '#ea580c' : '#fbbf24',
                            life: 0.20,
                            maxLife: 0.20
                        });
                        this.particles.push({
                            type: 'smoke_puff',
                            x: p.x,
                            y: p.y,
                            vx: (Math.random() - 0.5) * 15,
                            vy: (Math.random() - 0.5) * 15,
                            radius: 4.5,
                            color: 'rgba(67, 20, 7, 0.55)',
                            life: 0.22,
                            maxLife: 0.22
                        });
                    } else {
                        // Gunpowder smoke wisp & fuse spark
                        this.particles.push({
                            type: 'smoke_puff',
                            x: p.x,
                            y: p.y,
                            vx: (Math.random() - 0.5) * 15,
                            vy: (Math.random() - 0.5) * 15,
                            radius: 3.5,
                            color: 'rgba(100, 116, 139, 0.45)',
                            life: 0.18,
                            maxLife: 0.18
                        });
                    }
                }
            }

            // Continuous in-flight particle trails for frost projectiles
            if (p.towerType === 'frost' || p.type === 'frost_orb') {
                p.trailTimer = (p.trailTimer || 0) - effectiveDt;
                if (p.trailTimer <= 0) {
                    p.trailTimer = 0.028;
                    const lvl = p.level || (p.damage >= 70 ? 3 : (p.damage >= 30 ? 2 : 1));
                    const ang = p.angle || 0;
                    const trailX = p.x - Math.cos(ang) * 6;
                    const trailY = p.y - Math.sin(ang) * 6;

                    if (lvl === 3) {
                        // Permafrost comet: diamond ice crystals & dense sub-zero blizzard mist
                        this.particles.push({
                            type: 'spark',
                            x: trailX,
                            y: trailY,
                            vx: -Math.cos(ang) * 35 + (Math.random() - 0.5) * 25,
                            vy: -Math.sin(ang) * 35 + (Math.random() - 0.5) * 25,
                            radius: 2.2,
                            color: Math.random() > 0.4 ? '#67e8f9' : (Math.random() > 0.5 ? '#bae6fd' : '#ffffff'),
                            life: 0.22,
                            maxLife: 0.22
                        });
                        this.particles.push({
                            type: 'smoke_puff',
                            x: trailX,
                            y: trailY,
                            vx: -Math.cos(ang) * 15 + (Math.random() - 0.5) * 15,
                            vy: -Math.sin(ang) * 15 + (Math.random() - 0.5) * 15,
                            radius: 4.2,
                            color: 'rgba(186, 230, 253, 0.5)',
                            life: 0.24,
                            maxLife: 0.24
                        });
                    } else if (lvl === 2) {
                        // Glacial chill mist & cyan crystals
                        this.particles.push({
                            type: 'spark',
                            x: trailX,
                            y: trailY,
                            vx: -Math.cos(ang) * 25 + (Math.random() - 0.5) * 20,
                            vy: -Math.sin(ang) * 25 + (Math.random() - 0.5) * 20,
                            radius: 1.8,
                            color: '#38bdf8',
                            life: 0.18,
                            maxLife: 0.18
                        });
                        this.particles.push({
                            type: 'smoke_puff',
                            x: trailX,
                            y: trailY,
                            vx: -Math.cos(ang) * 12 + (Math.random() - 0.5) * 10,
                            vy: -Math.sin(ang) * 12 + (Math.random() - 0.5) * 10,
                            radius: 3.2,
                            color: 'rgba(224, 242, 254, 0.4)',
                            life: 0.18,
                            maxLife: 0.18
                        });
                    } else {
                        // Cryo chill vapor
                        this.particles.push({
                            type: 'smoke_puff',
                            x: trailX,
                            y: trailY,
                            vx: -Math.cos(ang) * 10 + (Math.random() - 0.5) * 8,
                            vy: -Math.sin(ang) * 10 + (Math.random() - 0.5) * 8,
                            radius: 2.5,
                            color: 'rgba(224, 242, 254, 0.35)',
                            life: 0.15,
                            maxLife: 0.15
                        });
                    }
                }
            }

            // Continuous in-flight particle trails for tidal wave projectiles
            if (p.towerType === 'wave' || p.type === 'tidal_wave') {
                p.trailTimer = (p.trailTimer || 0) - effectiveDt;
                if (p.trailTimer <= 0) {
                    p.trailTimer = 0.028;
                    const lvl = p.level || 1;
                    const ang = p.angle || 0;
                    const trailX = p.x - Math.cos(ang) * 10;
                    const trailY = p.y - Math.sin(ang) * 10;
                    // Lateral spray across wave crest
                    const perpAng = ang + Math.PI / 2;
                    const spread = (Math.random() - 0.5) * (lvl === 3 ? 36 : (lvl === 2 ? 26 : 18));
                    const sx = trailX + Math.cos(perpAng) * spread;
                    const sy = trailY + Math.sin(perpAng) * spread;

                    this.particles.push({
                        type: 'spark',
                        x: sx,
                        y: sy,
                        vx: -Math.cos(ang) * 30 + (Math.random() - 0.5) * 20,
                        vy: -Math.sin(ang) * 30 + (Math.random() - 0.5) * 20,
                        radius: lvl === 3 ? 2.4 : 1.8,
                        color: Math.random() > 0.4 ? '#38bdf8' : '#ffffff',
                        life: 0.2,
                        maxLife: 0.2
                    });
                    if (Math.random() < 0.4) {
                        this.particles.push({
                            type: 'smoke_puff',
                            x: sx,
                            y: sy,
                            vx: -Math.cos(ang) * 12 + (Math.random() - 0.5) * 10,
                            vy: -Math.sin(ang) * 12 + (Math.random() - 0.5) * 10,
                            radius: 3.2,
                            color: 'rgba(56, 189, 248, 0.4)',
                            life: 0.22,
                            maxLife: 0.22
                        });
                    }
                }
            }

            if (dist <= step) {
                // Hit target!
                this.onProjectileHit(p, targetX, targetY);
                this.projectiles.splice(i, 1);
            } else {
                p.x += (dx / dist) * step;
                p.y += (dy / dist) * step;
            }
        }

        // Update Particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.life -= effectiveDt;
            if (p.life <= 0) {
                this.particles.splice(i, 1);
                continue;
            }
            if (p.gravity) p.vy = (p.vy || 0) + p.gravity * effectiveDt;
            if (p.drag) {
                const df = Math.pow(p.drag, effectiveDt * 60);
                if (p.vx) p.vx *= df;
                if (p.vy) p.vy *= df;
            }
            if (p.rotSpeed) p.rot = (p.rot || 0) + p.rotSpeed * effectiveDt;
            if (p.vx) p.x += p.vx * effectiveDt;
            if (p.vy) p.y += p.vy * effectiveDt;
        }

        // Update Floating Texts
        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
            const ft = this.floatingTexts[i];
            ft.life -= effectiveDt;
            if (ft.life <= 0) {
                this.floatingTexts.splice(i, 1);
                continue;
            }
            ft.y += ft.vy * effectiveDt;
            ft.alpha = ft.life / ft.maxLife;
        }

        // Update Weather Particles & Environmental Simulation
        if (this.weatherSystem) {
            this.weatherSystem.update(dt, effectiveDt);
        } else {
            this.weatherParticles.forEach(wp => {
                wp.x += wp.vx * effectiveDt * 60;
                wp.y += wp.vy * effectiveDt * 60;
                if (wp.y > this.height) {
                    wp.y = -10;
                    wp.x = Math.random() * this.width;
                }
                if (wp.x < 0) wp.x = this.width;
                if (wp.x > this.width) wp.x = 0;
            });
        }
    }

    fireTower(tower, target) {
        tower.recoil = 1.0;
        tower.muzzleFlash = 1.0;
        tower.barrelAlt = (tower.barrelAlt || 0) + 1;

        let spawnX = tower.x;
        let spawnY = tower.y;

        if (tower.type === 'archer') {
            const tier = Math.min(3, Math.max(1, tower.level || 1));
            let barrelLength = 20;
            let lateral = 0;

            if (tier === 3) {
                barrelLength = 30;
            } else if (tier === 2) {
                barrelLength = 24;
                const isAlt = tower.barrelAlt % 2 !== 0;
                lateral = isAlt ? 6 : -6;
            } else {
                barrelLength = 20;
            }

            // True muzzle launch position along tower aim vector
            const tipX = tower.x + Math.cos(tower.angle) * barrelLength - Math.sin(tower.angle) * lateral;
            const tipY = tower.y + Math.sin(tower.angle) * barrelLength + Math.cos(tower.angle) * lateral;
            spawnX = tipX;
            spawnY = tipY;

            if (tier === 3) {
                // Tier 3: Jungle Ballista - Heavy Arcane Shockwave & Crackling Plasma
                this.particles.push({
                    type: 'sonic_cone',
                    x: tipX,
                    y: tipY,
                    angle: tower.angle,
                    radius: 26,
                    color: 'rgba(52, 211, 153, 0.9)',
                    life: 0.18,
                    maxLife: 0.18
                });

                for (let i = 0; i < 7; i++) {
                    const spd = 160 + Math.random() * 140;
                    const a = tower.angle + (Math.random() - 0.5) * 0.45;
                    this.particles.push({
                        type: 'spark',
                        x: tipX,
                        y: tipY,
                        vx: Math.cos(a) * spd,
                        vy: Math.sin(a) * spd,
                        radius: 2.2,
                        color: Math.random() > 0.4 ? '#34d399' : (Math.random() > 0.5 ? '#6ee7b7' : '#ffffff'),
                        life: 0.18,
                        maxLife: 0.18
                    });
                }

                // Dual tension limb arc flashes
                [-20, 20].forEach(wOffset => {
                    const wingX = tower.x + Math.cos(tower.angle) * 10 - Math.sin(tower.angle) * wOffset;
                    const wingY = tower.y + Math.sin(tower.angle) * 10 + Math.cos(tower.angle) * wOffset;
                    this.particles.push({
                        type: 'spark',
                        x: wingX,
                        y: wingY,
                        vx: Math.cos(tower.angle) * 80 + (Math.random() - 0.5) * 50,
                        vy: Math.sin(tower.angle) * 80 + (Math.random() - 0.5) * 50,
                        radius: 2.0,
                        color: '#34d399',
                        life: 0.14,
                        maxLife: 0.14
                    });
                });
            } else if (tier === 2) {
                // Tier 2: Swift Blowpipe - Pressurized Toxic Jade Exhaust Cloud
                this.particles.push({
                    type: 'sonic_cone',
                    x: tipX,
                    y: tipY,
                    angle: tower.angle,
                    radius: 18,
                    color: 'rgba(163, 230, 53, 0.75)',
                    life: 0.14,
                    maxLife: 0.14
                });

                for (let i = 0; i < 3; i++) {
                    this.particles.push({
                        type: 'poison_cloud',
                        x: tipX,
                        y: tipY,
                        vx: Math.cos(tower.angle + (Math.random() - 0.5) * 0.5) * (70 + Math.random() * 70),
                        vy: Math.sin(tower.angle + (Math.random() - 0.5) * 0.5) * (70 + Math.random() * 70),
                        drag: 0.88,
                        radius: 4.5 + Math.random() * 2,
                        color: 'rgba(163, 230, 53, 0.8)',
                        life: 0.22,
                        maxLife: 0.22
                    });
                }

                for (let i = 0; i < 5; i++) {
                    const spd = 130 + Math.random() * 100;
                    const a = tower.angle + (Math.random() - 0.5) * 0.4;
                    this.particles.push({
                        type: 'spark',
                        x: tipX,
                        y: tipY,
                        vx: Math.cos(a) * spd,
                        vy: Math.sin(a) * spd,
                        radius: 1.8,
                        color: Math.random() > 0.3 ? '#a3e635' : '#fef08a',
                        life: 0.16,
                        maxLife: 0.16
                    });
                }
            } else {
                // Tier 1: Dart Spire - Crisp Bodkin Crossbow Snap & Directional Sonic Cone
                this.particles.push({
                    type: 'sonic_cone',
                    x: tipX,
                    y: tipY,
                    angle: tower.angle,
                    radius: 14,
                    color: 'rgba(255, 255, 255, 0.75)',
                    life: 0.14,
                    maxLife: 0.14
                });

                for (let i = 0; i < 4; i++) {
                    const spd = 110 + Math.random() * 90;
                    const a = tower.angle + (Math.random() - 0.5) * 0.4;
                    this.particles.push({
                        type: 'spark',
                        x: tipX,
                        y: tipY,
                        vx: Math.cos(a) * spd,
                        vy: Math.sin(a) * spd,
                        radius: 1.6,
                        color: Math.random() > 0.4 ? '#fde047' : '#ffffff',
                        life: 0.14,
                        maxLife: 0.14
                    });
                }

                this.particles.push({
                    type: 'smoke_puff',
                    x: tipX + Math.cos(tower.angle) * 3,
                    y: tipY + Math.sin(tower.angle) * 3,
                    vx: Math.cos(tower.angle) * 30 + (Math.random() - 0.5) * 15,
                    vy: Math.sin(tower.angle) * 30 + (Math.random() - 0.5) * 15,
                    radius: 3.5,
                    color: 'rgba(203, 213, 225, 0.5)',
                    life: 0.20,
                    maxLife: 0.20
                });
            }
        }

        if (tower.type === 'cannon') {
            const tier = Math.min(3, Math.max(1, tower.level || 1));
            const barrelLength = tier === 3 ? 34 : (tier === 2 ? 28 : 24);
            const tipX = tower.x + Math.cos(tower.angle) * barrelLength;
            const tipY = tower.y + Math.sin(tower.angle) * barrelLength;
            spawnX = tipX;
            spawnY = tipY;

            // Heavy explosive cannon screen shake
            this.screenShake = Math.max(this.screenShake || 0, tier === 3 ? 0.22 : (tier === 2 ? 0.16 : 0.12));

            // Heavy muzzle blast sparks & flash
            const sparkCount = tier === 3 ? 12 : (tier === 2 ? 8 : 5);
            for (let i = 0; i < sparkCount; i++) {
                const spd = 120 + Math.random() * 140;
                const a = tower.angle + (Math.random() - 0.5) * 0.7;
                this.particles.push({
                    type: 'spark',
                    x: tipX,
                    y: tipY,
                    vx: Math.cos(a) * spd,
                    vy: Math.sin(a) * spd,
                    radius: tier === 3 ? 2.6 : 2.0,
                    color: tier === 3 ? (Math.random() > 0.4 ? '#ea580c' : '#fbbf24') : '#fed7aa',
                    life: 0.20,
                    maxLife: 0.20
                });
            }

            // Gunpowder / magma smoke puffs
            const puffCount = tier === 3 ? 4 : 3;
            for (let i = 0; i < puffCount; i++) {
                this.particles.push({
                    type: 'smoke_puff',
                    x: tipX + Math.cos(tower.angle) * (i * 3),
                    y: tipY + Math.sin(tower.angle) * (i * 3),
                    vx: Math.cos(tower.angle) * (35 + i * 18) + (Math.random() - 0.5) * 20,
                    vy: Math.sin(tower.angle) * (35 + i * 18) + (Math.random() - 0.5) * 20,
                    radius: 5 + i * 2,
                    color: tier === 3 ? 'rgba(67, 20, 7, 0.65)' : 'rgba(71, 85, 105, 0.6)',
                    life: 0.28,
                    maxLife: 0.28
                });
            }
        }

        if (tower.type === 'frost') {
            const tier = Math.min(3, Math.max(1, tower.level || 1));
            const tipDist = tier === 3 ? 30 : (tier === 2 ? 26 : 22);
            const tipX = tower.x + Math.cos(tower.angle) * tipDist;
            const tipY = tower.y + Math.sin(tower.angle) * tipDist;
            spawnX = tipX;
            spawnY = tipY;

            if (tier === 3) {
                this.screenShake = Math.max(this.screenShake || 0, 0.12);
            }

            // Directional sub-zero sonic frost cone
            this.particles.push({
                type: 'sonic_cone',
                x: tipX,
                y: tipY,
                angle: tower.angle,
                radius: tier === 3 ? 24 : (tier === 2 ? 20 : 16),
                color: tier === 3 ? 'rgba(186, 230, 253, 0.85)' : 'rgba(103, 232, 249, 0.8)',
                life: 0.16,
                maxLife: 0.16
            });

            // Diamond frost sparks
            const sparkCount = tier === 3 ? 9 : (tier === 2 ? 6 : 4);
            for (let i = 0; i < sparkCount; i++) {
                const spd = 100 + Math.random() * 120;
                const a = tower.angle + (Math.random() - 0.5) * 0.5;
                this.particles.push({
                    type: 'spark',
                    x: tipX,
                    y: tipY,
                    vx: Math.cos(a) * spd,
                    vy: Math.sin(a) * spd,
                    radius: tier === 3 ? 2.2 : 1.8,
                    color: Math.random() > 0.4 ? '#67e8f9' : (Math.random() > 0.5 ? '#bae6fd' : '#ffffff'),
                    life: 0.18,
                    maxLife: 0.18
                });
            }

            // Sub-zero frost vapor clouds
            const puffCount = tier === 3 ? 3 : 2;
            for (let i = 0; i < puffCount; i++) {
                this.particles.push({
                    type: 'smoke_puff',
                    x: tipX + Math.cos(tower.angle) * (i * 2),
                    y: tipY + Math.sin(tower.angle) * (i * 2),
                    vx: Math.cos(tower.angle) * (25 + i * 12) + (Math.random() - 0.5) * 15,
                    vy: Math.sin(tower.angle) * (25 + i * 12) + (Math.random() - 0.5) * 15,
                    radius: 4 + i * 2,
                    color: tier === 3 ? 'rgba(186, 230, 253, 0.55)' : 'rgba(224, 242, 254, 0.45)',
                    life: 0.22,
                    maxLife: 0.22
                });
            }
        }

        if (tower.type === 'tesla') {
            // Instant Chain Lightning
            this.fireChainLightning(tower, target);
            if (window.soundEngine) window.soundEngine.playShoot('tesla');
            return;
        }

        if (tower.type === 'flame') {
            // Continuous Beam
            this.projectiles.push({
                type: 'beam',
                tower: tower,
                target: target,
                damage: tower.damage,
                burnDps: tower.burnDps,
                burnDuration: tower.burnDuration,
                life: 0.25,
                color: tower.bulletColor
            });
            if (window.soundEngine) window.soundEngine.playShoot('flame');
            return;
        }

        if (tower.type === 'wave') {
            // Wake Spire: Sweeping Hydraulic Crescent Tidal Wave
            const initAngle = Math.atan2(target.y - spawnY, target.x - spawnX);
            this.projectiles.push({
                type: 'tidal_wave',
                towerType: 'wave',
                level: tower.level || 1,
                x: spawnX,
                y: spawnY,
                angle: initAngle,
                target: target,
                targetX: target.x,
                targetY: target.y,
                speed: tower.projectileSpeed || 360,
                damage: tower.damage,
                splashRadius: tower.splashRadius || 65,
                knockback: tower.knockback || 25,
                slowFactor: tower.slowFactor || 0.6,
                slowDuration: tower.slowDuration || 2.0,
                color: tower.bulletColor || '#38bdf8',
                life: 1.8
            });

            // Hydro muzzle discharge spray
            const lvl = tower.level || 1;
            const sprayCount = lvl === 3 ? 12 : (lvl === 2 ? 8 : 5);
            for (let i = 0; i < sprayCount; i++) {
                const a = tower.angle + (Math.random() - 0.5) * 1.1;
                const spd = 50 + Math.random() * 80;
                this.particles.push({
                    type: 'spark',
                    x: spawnX,
                    y: spawnY,
                    vx: Math.cos(a) * spd,
                    vy: Math.sin(a) * spd,
                    radius: lvl === 3 ? 2.4 : 1.8,
                    color: Math.random() > 0.4 ? '#38bdf8' : (Math.random() > 0.5 ? '#93c5fd' : '#ffffff'),
                    life: 0.22,
                    maxLife: 0.22
                });
            }

            if (window.soundEngine && typeof window.soundEngine.playShoot === 'function') {
                window.soundEngine.playShoot('frost');
            }
            return;
        }

        // Normal projectile
        const initAngle = Math.atan2(target.y - spawnY, target.x - spawnX);
        this.projectiles.push({
            type: tower.projectileType,
            towerType: tower.type,
            level: tower.level || 1,
            x: spawnX,
            y: spawnY,
            angle: initAngle,
            target: target,
            targetX: target.x,
            targetY: target.y,
            speed: tower.projectileSpeed,
            damage: tower.damage,
            splashRadius: tower.splashRadius,
            slowFactor: tower.slowFactor,
            slowDuration: tower.slowDuration,
            color: tower.bulletColor,
            life: 2.0
        });

        if (window.soundEngine) {
            window.soundEngine.playShoot(tower.type);
        }
    }

    fireChainLightning(tower, initialTarget) {
        let current = initialTarget;
        const hitTargets = [current];
        this.damageCreep(current, tower.damage, 'tesla');

        const tier = tower.level || 1;

        // Grounding ionization shockwave ring & sparks on primary target
        this.particles.push({
            type: 'explosion_wave',
            x: current.x,
            y: current.y,
            radius: tier === 3 ? 34 : (tier === 2 ? 28 : 22),
            color: tier === 3 ? '#e879f9' : '#c084fc',
            life: 0.18,
            maxLife: 0.18
        });
        const primarySparks = tier === 3 ? 9 : 6;
        for (let s = 0; s < primarySparks; s++) {
            const a = Math.random() * Math.PI * 2;
            const spd = 70 + Math.random() * 90;
            this.particles.push({
                type: 'spark',
                x: current.x,
                y: current.y,
                vx: Math.cos(a) * spd,
                vy: Math.sin(a) * spd,
                radius: 2.0,
                color: Math.random() > 0.4 ? '#e9d5ff' : '#38bdf8',
                life: 0.2,
                maxLife: 0.2
            });
        }

        for (let step = 1; step < tower.chainCount; step++) {
            const next = this.creeps.find(c => {
                if (hitTargets.includes(c)) return false;
                if (c.isAir && !tower.canTargetAir) return false;
                return Math.hypot(c.x - current.x, c.y - current.y) <= tower.chainRange;
            });

            if (!next) break;

            hitTargets.push(next);
            // Reduced damage for subsequent chain jumps
            const jumpDamage = tower.damage * Math.pow(0.75, step);
            this.damageCreep(next, jumpDamage, 'tesla');

            // Grounding sparks on subsequent chain target
            for (let s = 0; s < 5; s++) {
                const a = Math.random() * Math.PI * 2;
                const spd = 50 + Math.random() * 70;
                this.particles.push({
                    type: 'spark',
                    x: next.x,
                    y: next.y,
                    vx: Math.cos(a) * spd,
                    vy: Math.sin(a) * spd,
                    radius: 1.8,
                    color: tier === 3 ? '#f0abfc' : '#c084fc',
                    life: 0.18,
                    maxLife: 0.18
                });
            }

            current = next;
        }

        // Create visual lightning segments
        for (let i = 0; i < hitTargets.length; i++) {
            const from = i === 0 ? { x: tower.x, y: tower.y } : hitTargets[i - 1];
            const to = hitTargets[i];
            this.particles.push({
                type: 'lightning_arc',
                fromX: from.x,
                fromY: from.y,
                toX: to.x,
                toY: to.y,
                tier: tier,
                life: 0.18,
                maxLife: 0.18,
                color: tier === 3 ? '#e879f9' : (tier === 2 ? '#c084fc' : '#a855f7')
            });
        }
    }

    onProjectileHit(p, targetX, targetY) {
        if (p.splashRadius > 0) {
            // Area-of-Effect Splash
            this.creeps.forEach(creep => {
                const dist = Math.hypot(creep.x - targetX, creep.y - targetY);
                if (dist <= p.splashRadius) {
                    const falloff = 1 - (dist / p.splashRadius) * 0.4;
                    this.damageCreep(creep, p.damage * falloff, p.towerType === 'cannon' ? 'explosion' : 'freeze');

                    if (p.slowDuration > 0 && !creep.slowImmune) {
                        creep.slowTime = p.slowDuration;
                        creep.slowFactor = p.slowFactor;
                    }
                }
            });

            // Splash particles
            this.particles.push({
                type: 'explosion_wave',
                x: targetX,
                y: targetY,
                radius: p.splashRadius,
                color: p.color,
                life: 0.35,
                maxLife: 0.35
            });

            if (p.towerType === 'cannon') {
                const lvl = p.level || (p.damage >= 200 ? 3 : (p.damage >= 100 ? 2 : 1));
                this.screenShake = Math.max(this.screenShake || 0, lvl === 3 ? 0.35 : (lvl === 2 ? 0.24 : 0.18));

                // Exploding shrapnel splinters & fire sparks
                const shrapnelCount = lvl === 3 ? 14 : 9;
                for (let s = 0; s < shrapnelCount; s++) {
                    const ang = Math.random() * Math.PI * 2;
                    const spd = 90 + Math.random() * 140;
                    this.particles.push({
                        type: 'splinter',
                        x: targetX,
                        y: targetY,
                        vx: Math.cos(ang) * spd,
                        vy: Math.sin(ang) * spd - 35,
                        gravity: 260,
                        rot: Math.random() * Math.PI * 2,
                        rotSpeed: (Math.random() - 0.5) * 20,
                        length: 6 + Math.random() * 5,
                        color: lvl === 3 ? (Math.random() > 0.4 ? '#ea580c' : '#1e293b') : (Math.random() > 0.5 ? '#f97316' : '#334155'),
                        life: 0.42,
                        maxLife: 0.42
                    });
                }

                // Fiery explosion sparks
                const sparkCount = lvl === 3 ? 16 : 10;
                for (let s = 0; s < sparkCount; s++) {
                    const ang = Math.random() * Math.PI * 2;
                    const spd = 120 + Math.random() * 150;
                    this.particles.push({
                        type: 'spark',
                        x: targetX,
                        y: targetY,
                        vx: Math.cos(ang) * spd,
                        vy: Math.sin(ang) * spd,
                        radius: lvl === 3 ? 2.6 : 2.0,
                        color: lvl === 3 ? (Math.random() > 0.4 ? '#fbbf24' : '#ea580c') : '#fde047',
                        life: 0.22,
                        maxLife: 0.22
                    });
                }

                // Billowing detonation smoke puffs
                for (let s = 0; s < 4; s++) {
                    this.particles.push({
                        type: 'smoke_puff',
                        x: targetX + (Math.random() - 0.5) * 16,
                        y: targetY + (Math.random() - 0.5) * 16,
                        vx: (Math.random() - 0.5) * 30,
                        vy: (Math.random() - 0.5) * 30 - 15,
                        radius: 7 + Math.random() * 5,
                        color: lvl === 3 ? 'rgba(67, 20, 7, 0.7)' : 'rgba(71, 85, 105, 0.6)',
                        life: 0.35,
                        maxLife: 0.35
                    });
                }
            }

            if (p.towerType === 'frost' || p.type === 'frost_orb') {
                const lvl = p.level || (p.damage >= 70 ? 3 : (p.damage >= 30 ? 2 : 1));
                if (lvl === 3) {
                    this.screenShake = Math.max(this.screenShake || 0, 0.16);
                }

                // Shattering ice crystal splinters
                const shardCount = lvl === 3 ? 14 : (lvl === 2 ? 10 : 6);
                for (let s = 0; s < shardCount; s++) {
                    const ang = Math.random() * Math.PI * 2;
                    const spd = 70 + Math.random() * 120;
                    this.particles.push({
                        type: 'splinter',
                        x: targetX,
                        y: targetY,
                        vx: Math.cos(ang) * spd,
                        vy: Math.sin(ang) * spd - 20,
                        gravity: 220,
                        rot: Math.random() * Math.PI * 2,
                        rotSpeed: (Math.random() - 0.5) * 18,
                        length: 5 + Math.random() * 4,
                        color: Math.random() > 0.4 ? '#bae6fd' : (Math.random() > 0.5 ? '#67e8f9' : '#ffffff'),
                        life: 0.38,
                        maxLife: 0.38
                    });
                }

                // Diamond dust frost sparks
                const sparkCount = lvl === 3 ? 14 : 8;
                for (let s = 0; s < sparkCount; s++) {
                    const ang = Math.random() * Math.PI * 2;
                    const spd = 90 + Math.random() * 110;
                    this.particles.push({
                        type: 'spark',
                        x: targetX,
                        y: targetY,
                        vx: Math.cos(ang) * spd,
                        vy: Math.sin(ang) * spd,
                        radius: lvl === 3 ? 2.2 : 1.8,
                        color: Math.random() > 0.3 ? '#67e8f9' : '#ffffff',
                        life: 0.22,
                        maxLife: 0.22
                    });
                }

                // Sub-zero freezing vapor ring
                const puffCount = lvl === 3 ? 5 : 3;
                for (let s = 0; s < puffCount; s++) {
                    this.particles.push({
                        type: 'smoke_puff',
                        x: targetX + (Math.random() - 0.5) * 14,
                        y: targetY + (Math.random() - 0.5) * 14,
                        vx: (Math.random() - 0.5) * 20,
                        vy: (Math.random() - 0.5) * 20 - 10,
                        radius: 6 + Math.random() * 4,
                        color: lvl === 3 ? 'rgba(186, 230, 253, 0.65)' : 'rgba(224, 242, 254, 0.5)',
                        life: 0.32,
                        maxLife: 0.32
                    });
                }
            }

            if (p.towerType === 'wave' || p.type === 'tidal_wave') {
                const lvl = p.level || 1;
                this.screenShake = Math.max(this.screenShake || 0, lvl === 3 ? 0.22 : 0.14);

                // Knockback physics: push creeps backward along path
                const push = p.knockback || 25;
                this.creeps.forEach(creep => {
                    const dist = Math.hypot(creep.x - targetX, creep.y - targetY);
                    if (dist <= p.splashRadius && !creep.isBoss) {
                        if (creep.path && creep.pathIndex !== undefined) {
                            let remainingPush = push;
                            while (remainingPush > 0 && creep.pathIndex >= 0) {
                                const prevPoint = creep.path[creep.pathIndex];
                                if (!prevPoint) break;
                                const dToPrev = Math.hypot(creep.x - prevPoint.x, creep.y - prevPoint.y);
                                if (remainingPush <= dToPrev) {
                                    if (dToPrev > 0.001) {
                                        creep.x += ((prevPoint.x - creep.x) / dToPrev) * remainingPush;
                                        creep.y += ((prevPoint.y - creep.y) / dToPrev) * remainingPush;
                                    }
                                    creep.progressDistance = Math.max(0, (creep.progressDistance || 0) - remainingPush);
                                    remainingPush = 0;
                                } else {
                                    creep.x = prevPoint.x;
                                    creep.y = prevPoint.y;
                                    creep.progressDistance = Math.max(0, (creep.progressDistance || 0) - dToPrev);
                                    remainingPush -= dToPrev;
                                    creep.pathIndex--;
                                }
                            }
                            if (creep.pathIndex < 0) creep.pathIndex = 0;
                        }
                    }
                });

                // Water surge splash particles (frothing water spray droplets, foam bubbles)
                const dropCount = lvl === 3 ? 16 : 10;
                for (let s = 0; s < dropCount; s++) {
                    const ang = Math.random() * Math.PI * 2;
                    const spd = 70 + Math.random() * 120;
                    this.particles.push({
                        type: 'splinter',
                        x: targetX,
                        y: targetY,
                        vx: Math.cos(ang) * spd,
                        vy: Math.sin(ang) * spd - 25,
                        gravity: 240,
                        rot: Math.random() * Math.PI * 2,
                        rotSpeed: (Math.random() - 0.5) * 15,
                        length: 5 + Math.random() * 4,
                        color: Math.random() > 0.5 ? '#38bdf8' : '#ffffff',
                        life: 0.35,
                        maxLife: 0.35
                    });
                }
                for (let s = 0; s < 4; s++) {
                    this.particles.push({
                        type: 'smoke_puff',
                        x: targetX + (Math.random() - 0.5) * 16,
                        y: targetY + (Math.random() - 0.5) * 16,
                        vx: (Math.random() - 0.5) * 25,
                        vy: (Math.random() - 0.5) * 25 - 10,
                        radius: 6 + Math.random() * 5,
                        color: 'rgba(56, 189, 248, 0.5)',
                        life: 0.3,
                        maxLife: 0.3
                    });
                }
            }

            if (window.soundEngine) {
                window.soundEngine.playHit(p.towerType === 'cannon' ? 'explosion' : 'freeze');
            }
        } else {
            // Single target hit
            if (p.target && p.target.hp > 0) {
                this.damageCreep(p.target, p.damage, 'normal');
                if (p.slowDuration > 0 && !p.target.slowImmune) {
                    p.target.slowTime = p.slowDuration;
                    p.target.slowFactor = p.slowFactor;
                }
            }

            // Realistic High-Impact Strike Feedback for Dart Spire
            if (p.towerType === 'archer') {
                const lvl = p.level || (p.damage >= 100 ? 3 : (p.damage >= 40 ? 2 : 1));
                const impactAngle = p.angle || 0;

                if (lvl === 3) {
                    // TIER 3: Jungle Ballista - Devastating Kinetic Impact & Plasma Shatter
                    this.screenShake = Math.max(this.screenShake || 0, 0.18);

                    // Expanding kinetic plasma shockwave ring
                    this.particles.push({
                        type: 'explosion_wave',
                        x: targetX,
                        y: targetY,
                        radius: 34,
                        color: '#34d399',
                        life: 0.22,
                        maxLife: 0.22
                    });

                    // 9 Tumbling Iron & Runic Splinters with gravity
                    for (let s = 0; s < 9; s++) {
                        const ang = impactAngle + Math.PI + (Math.random() - 0.5) * 2.2;
                        const spd = 90 + Math.random() * 120;
                        this.particles.push({
                            type: 'splinter',
                            x: targetX,
                            y: targetY,
                            vx: Math.cos(ang) * spd,
                            vy: Math.sin(ang) * spd - 40,
                            gravity: 280,
                            rot: Math.random() * Math.PI * 2,
                            rotSpeed: (Math.random() - 0.5) * 24,
                            length: 7 + Math.random() * 6,
                            color: Math.random() > 0.4 ? '#34d399' : '#0f172a',
                            life: 0.45,
                            maxLife: 0.45
                        });
                    }

                    // 10 High-speed electric ricochet sparks
                    for (let s = 0; s < 10; s++) {
                        const ang = Math.random() * Math.PI * 2;
                        const spd = 130 + Math.random() * 150;
                        this.particles.push({
                            type: 'spark',
                            x: targetX,
                            y: targetY,
                            vx: Math.cos(ang) * spd,
                            vy: Math.sin(ang) * spd,
                            radius: 2.2,
                            color: Math.random() > 0.4 ? '#6ee7b7' : '#ffffff',
                            life: 0.22,
                            maxLife: 0.22
                        });
                    }

                } else if (lvl === 2) {
                    // TIER 2: Swift Blowpipe - Toxic Venom Splash & Needle Shards
                    for (let s = 0; s < 4; s++) {
                        const ang = Math.random() * Math.PI * 2;
                        const spd = 40 + Math.random() * 60;
                        this.particles.push({
                            type: 'poison_cloud',
                            x: targetX,
                            y: targetY,
                            vx: Math.cos(ang) * spd,
                            vy: Math.sin(ang) * spd,
                            drag: 0.88,
                            radius: 5 + Math.random() * 4,
                            color: 'rgba(163, 230, 53, 0.85)',
                            life: 0.35,
                            maxLife: 0.35
                        });
                    }

                    for (let s = 0; s < 6; s++) {
                        const ang = impactAngle + Math.PI + (Math.random() - 0.5) * 2.0;
                        const spd = 70 + Math.random() * 90;
                        this.particles.push({
                            type: 'splinter',
                            x: targetX,
                            y: targetY,
                            vx: Math.cos(ang) * spd,
                            vy: Math.sin(ang) * spd - 30,
                            gravity: 220,
                            rot: Math.random() * Math.PI * 2,
                            rotSpeed: (Math.random() - 0.5) * 20,
                            length: 5 + Math.random() * 4,
                            color: Math.random() > 0.3 ? '#a3e635' : '#fef08a',
                            life: 0.35,
                            maxLife: 0.35
                        });
                    }

                    for (let s = 0; s < 5; s++) {
                        const ang = Math.random() * Math.PI * 2;
                        const spd = 80 + Math.random() * 90;
                        this.particles.push({
                            type: 'spark',
                            x: targetX,
                            y: targetY,
                            vx: Math.cos(ang) * spd,
                            vy: Math.sin(ang) * spd,
                            radius: 1.8,
                            color: '#bef264',
                            life: 0.16,
                            maxLife: 0.16
                        });
                    }

                } else {
                    // TIER 1: Dart Spire - Hard Bodkin Wood Splinters & Steel Ricochets
                    for (let s = 0; s < 5; s++) {
                        const ang = impactAngle + Math.PI + (Math.random() - 0.5) * 1.8;
                        const spd = 60 + Math.random() * 80;
                        this.particles.push({
                            type: 'splinter',
                            x: targetX,
                            y: targetY,
                            vx: Math.cos(ang) * spd,
                            vy: Math.sin(ang) * spd - 25,
                            gravity: 200,
                            rot: Math.random() * Math.PI * 2,
                            rotSpeed: (Math.random() - 0.5) * 16,
                            length: 5 + Math.random() * 4,
                            color: Math.random() > 0.5 ? '#92400e' : '#b45309',
                            life: 0.32,
                            maxLife: 0.32
                        });
                    }

                    for (let s = 0; s < 4; s++) {
                        const ang = impactAngle + Math.PI + (Math.random() - 0.5) * 1.6;
                        const spd = 100 + Math.random() * 100;
                        this.particles.push({
                            type: 'spark',
                            x: targetX,
                            y: targetY,
                            vx: Math.cos(ang) * spd,
                            vy: Math.sin(ang) * spd,
                            radius: 1.5,
                            color: Math.random() > 0.4 ? '#fef08a' : '#ffffff',
                            life: 0.14,
                            maxLife: 0.14
                        });
                    }

                    this.particles.push({
                        type: 'smoke_puff',
                        x: targetX,
                        y: targetY,
                        vx: (Math.random() - 0.5) * 15,
                        vy: (Math.random() - 0.5) * 15,
                        radius: 4.5,
                        color: 'rgba(226, 232, 240, 0.6)',
                        life: 0.18,
                        maxLife: 0.18
                    });
                }
            }

            if (window.soundEngine) {
                window.soundEngine.playHit('normal');
            }
        }
    }

    triggerVictory() {
        this.levelWon = true;
        // Calculate stars based on remaining base health
        let stars = 1;
        if (this.lives >= this.currentLevel.startingLives) {
            stars = 3;
        } else if (this.lives >= Math.floor(this.currentLevel.startingLives * 0.5)) {
            stars = 2;
        }

        // Save progress to LocalStorage
        this.saveLevelProgress(this.currentLevel.id, stars, this.score);

        if (window.soundEngine) {
            window.soundEngine.playVictory();
        }
        if (window.ui) {
            window.ui.showVictoryModal(stars, this.score);
        }
    }

    triggerDefeat() {
        this.gameOver = true;
        if (window.soundEngine) {
            window.soundEngine.playDefeat();
        }
        if (window.ui) {
            window.ui.showDefeatModal();
        }
    }

    saveLevelProgress(levelId, stars, score) {
        try {
            const saved = JSON.parse(localStorage.getItem('frontier_td_progress') || '{}');
            const prev = saved[levelId] || { stars: 0, highscore: 0 };
            saved[levelId] = {
                stars: Math.max(prev.stars, stars),
                highscore: Math.max(prev.highscore, score),
                unlocked: true
            };
            // Unlock next level
            if (levelId < 10) {
                if (!saved[levelId + 1]) saved[levelId + 1] = { stars: 0, highscore: 0, unlocked: true };
                else saved[levelId + 1].unlocked = true;
            }
            localStorage.setItem('frontier_td_progress', JSON.stringify(saved));
        } catch (e) {
            console.warn('Progress save failed:', e);
        }
    }

    // -------------------------------------------------------------
    // RENDERING
    // -------------------------------------------------------------
    render() {
        this.ctx.save();
        if (this.dpr && this.dpr !== 1) {
            this.ctx.scale(this.dpr, this.dpr);
        }
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';

        // Screen shake transform
        if (this.screenShake > 0) {
            const intensity = this.screenShake * 10;
            const ox = (Math.random() - 0.5) * intensity;
            const oy = (Math.random() - 0.5) * intensity;
            this.ctx.translate(ox, oy);
        }

        // 1. Biome Background Map
        const bgImg = (this.currentLevel && this.bgImages) ? this.bgImages[this.currentLevel.biome] : null;
        if (bgImg && bgImg.complete && bgImg.naturalWidth > 0) {
            this.ctx.drawImage(bgImg, 0, 0, this.width, this.height);
            // Atmospheric ambient lighting overlay (subtle vignette to highlight towers & creeps)
            this.ctx.fillStyle = this.currentLevel.biome === 'jungle' 
                ? 'rgba(10, 25, 15, 0.20)' 
                : 'rgba(15, 23, 42, 0.16)';
            this.ctx.fillRect(0, 0, this.width, this.height);
        } else {
            this.ctx.fillStyle = this.biome ? this.biome.bgColor : '#111827';
            this.ctx.fillRect(0, 0, this.width, this.height);
        }

        // 1.5 Atmospheric Lighting, God Rays & Aurora (Under terrain)
        if (this.weatherSystem) {
            this.weatherSystem.renderAtmosphere(this.ctx);
        }

        // 2. Biome Path
        this.renderPath();

        // 2.5 Road Trample Dust, Ground Ripples & Ambient Life Particles
        this.renderTrampleParticles();
        if (this.weatherSystem) {
            this.weatherSystem.renderGroundEffects(this.ctx);
        }
        this.renderRoadParticles();

        // 3. Decorations (Trees, Rocks, Icebergs, Ruins)
        this.renderDecorations();

        // 4. Buildable Slots
        this.renderBuildSlots();

        // 5. Towers
        this.renderTowers();

        // 6. Creeps (Ground first, Air above)
        this.renderCreeps();

        // 7. Projectiles & Beams
        this.renderProjectiles();

        // 8. Particles & Explosions
        this.renderParticles();

        // 9. Floating Combat Text
        this.renderFloatingTexts();

        // 10. Weather Effects (Precipitation, Wind Debris, Fog Clouds)
        if (this.weatherSystem) {
            this.weatherSystem.renderPrecipitation(this.ctx);
        } else {
            this.renderWeather();
        }

        // 10.5 Post-Process Atmosphere (Lightning Bolts, Screen Flash, Frost Border Vignette)
        if (this.weatherSystem) {
            this.weatherSystem.renderPostOverlay(this.ctx);
        }

        // 11. Range Overlay for Selected Slot or Tower
        this.renderSelectionOverlay();

        this.ctx.restore();
    }

    renderPath() {
        if (!this.currentLevel || !this.currentLevel.path) return;
        const path = this.currentLevel.path;
        if (path.length < 2) return;
        const isJungle = !this.currentLevel.biome || this.currentLevel.biome === 'jungle';
        const biomeKey = isJungle ? 'jungle' : 'snow';

        // Cache seamless 512x512 stone pattern
        if (!this.pathPatterns[biomeKey]) {
            const img = this.pathImages[biomeKey];
            if (img && img.complete && img.naturalWidth > 0) {
                this.pathPatterns[biomeKey] = this.ctx.createPattern(img, 'repeat');
            }
        }
        const pattern = this.pathPatterns[biomeKey];

        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';

        // Helper: traces path with smooth rounded corners (anti-aliased curves)
        const traceSmooth = (radius = 30) => {
            this.ctx.beginPath();
            this.ctx.moveTo(path[0].x, path[0].y);
            for (let i = 1; i < path.length - 1; i++) {
                const curr = path[i];
                const next = path[i + 1];
                this.ctx.arcTo(curr.x, curr.y, next.x, next.y, radius);
            }
            this.ctx.lineTo(path[path.length - 1].x, path[path.length - 1].y);
        };

        // =========================================================================
        // MULTI-LAYER AUTHENTIC STONE ROADWAY
        // =========================================================================

        // 1. Terrain Trench / Soft Ambient Ground Occlusion
        this.ctx.save();
        this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.44)';
        this.ctx.lineWidth = 56;
        traceSmooth(32);
        this.ctx.stroke();

        // 2. Chiseled Cobblestone Road Shoulder / Outer Soil Kerb
        this.ctx.strokeStyle = isJungle ? '#38291a' : '#1e293b';
        this.ctx.lineWidth = 48;
        traceSmooth(30);
        this.ctx.stroke();

        // Chiseled Outer Kerb Relief Highlight (sunlit stone bevel)
        this.ctx.strokeStyle = isJungle ? 'rgba(155, 130, 95, 0.45)' : 'rgba(165, 200, 235, 0.45)';
        this.ctx.lineWidth = 45;
        traceSmooth(29);
        this.ctx.stroke();

        // 3. High-Resolution Seamless Flagstone Roadbed
        this.ctx.strokeStyle = pattern || (isJungle ? '#786650' : '#576a80');
        this.ctx.lineWidth = 40;
        traceSmooth(28);
        this.ctx.stroke();

        // 4. Subtle Inner Road Depth Shading (recessed joints & wear)
        this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.16)';
        this.ctx.lineWidth = 40;
        traceSmooth(28);
        this.ctx.stroke();

        // 5. Trodden Cart Tracks / Ruts (two subtle parallel lines)
        this.ctx.strokeStyle = isJungle ? 'rgba(235, 215, 185, 0.18)' : 'rgba(225, 242, 255, 0.22)';
        this.ctx.lineWidth = 6;
        this.ctx.setLineDash([14, 18]);
        traceSmooth(28);
        this.ctx.stroke();

        // Central worn footpath trail
        this.ctx.strokeStyle = isJungle ? 'rgba(245, 230, 200, 0.22)' : 'rgba(255, 255, 255, 0.28)';
        this.ctx.lineWidth = 2.5;
        this.ctx.setLineDash([6, 12]);
        traceSmooth(28);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
        this.ctx.restore();

        // =========================================================================
        // ROADSIDE ORGANIC EDGES (HANDCRAFTED KERB STONES, MOSS CLUMPS & FROST CRYSTALS)
        // =========================================================================
        this.ctx.save();
        for (let i = 0; i < path.length - 1; i++) {
            const p1 = path[i], p2 = path[i + 1];
            const dx = p2.x - p1.x, dy = p2.y - p1.y;
            const dist = Math.hypot(dx, dy) || 1;
            const nx = -dy / dist, ny = dx / dist;

            const stepSize = 32;
            const steps = Math.floor(dist / stepSize);
            for (let s = 1; s < steps; s++) {
                const px = p1.x + (dx / dist) * (s * stepSize);
                const py = p1.y + (dy / dist) * (s * stepSize);

                // Both left and right road kerbs
                [-22.5, 22.5].forEach((kDist, sideIdx) => {
                    const kx = px + nx * kDist;
                    const ky = py + ny * kDist;

                    // Kerb relief stone
                    this.ctx.fillStyle = isJungle ? '#443525' : '#283648';
                    this.ctx.beginPath();
                    this.ctx.ellipse(kx, ky, 3.8, 2.8, Math.atan2(dy, dx), 0, Math.PI * 2);
                    this.ctx.fill();

                    // Alternate roadside detail (moss cushion or ice crystal)
                    if ((s + sideIdx) % 2 === 0) {
                        if (isJungle) {
                            // Moss clump
                            this.ctx.fillStyle = (s % 4 === 0) ? '#166534' : '#15803d';
                            this.ctx.beginPath();
                            this.ctx.arc(kx + nx * 2, ky + ny * 2, 2.4, 0, Math.PI * 2);
                            this.ctx.fill();
                        } else {
                            // Frost crystal
                            this.ctx.fillStyle = (s % 4 === 0) ? '#e0f2fe' : '#bae6fd';
                            this.ctx.beginPath();
                            this.ctx.arc(kx + nx * 2, ky + ny * 2, 1.8, 0, Math.PI * 2);
                            this.ctx.fill();
                        }
                    }
                });
            }
        }
        this.ctx.restore();

        // =========================================================================
        // ANCIENT RUNIC WAYSTONES AT TRAIL WAYPOINTS (TURNING POINTS)
        // =========================================================================
        for (let i = 1; i < path.length - 1; i++) {
            const pt = path[i];
            const prev = path[i - 1];
            const next = path[i + 1];

            const d1x = prev.x - pt.x, d1y = prev.y - pt.y;
            const len1 = Math.hypot(d1x, d1y) || 1;
            const d2x = next.x - pt.x, d2y = next.y - pt.y;
            const len2 = Math.hypot(d2x, d2y) || 1;

            let bx = (d1x / len1) + (d2x / len2);
            let by = (d1y / len1) + (d2y / len2);
            const bLen = Math.hypot(bx, by);
            if (bLen > 0.01) {
                bx /= bLen;
                by /= bLen;
            } else {
                bx = 0; by = -1;
            }

            const wx = pt.x + bx * 27;
            const wy = pt.y + by * 27;
            this.renderWaystone(wx, wy, i, isJungle);
        }

        // =========================================================================
        // ANIMATED ENTRANCE SPAWN PORTAL (CREEP ORIGIN)
        // =========================================================================
        const p0 = path[0], p1 = path[1];
        const sDirX = p1.x - p0.x, sDirY = p1.y - p0.y;
        const sAngle = Math.atan2(sDirY, sDirX);
        let portalX = p0.x, portalY = p0.y;
        if (portalX < 0) portalX = 26;
        else if (portalX > this.width) portalX = this.width - 26;
        if (portalY < 0) portalY = 26;
        else if (portalY > this.height) portalY = this.height - 26;

        this.renderSpawnPortal(portalX, portalY, sAngle, isJungle);

        // =========================================================================
        // ANIMATED DEFENSE SANCTUARY GATEWAY (EXIT GOAL)
        // =========================================================================
        const lastIdx = path.length - 1;
        const pend = path[lastIdx], pprev = path[lastIdx - 1];
        const eDirX = pend.x - pprev.x, eDirY = pend.y - pprev.y;
        const eAngle = Math.atan2(eDirY, eDirX);

        let gateX = pend.x, gateY = pend.y;
        if (gateX < 0) gateX = 26;
        else if (gateX > this.width) gateX = this.width - 26;
        if (gateY < 0) gateY = 26;
        else if (gateY > this.height) gateY = this.height - 26;

        this.renderSanctuaryGate(gateX, gateY, eAngle, isJungle);

        // Air path dashed indicator (subtle glowing aerial flight path)
        if (this.currentLevel.airPath) {
            this.ctx.save();
            this.ctx.setLineDash([10, 14]);
            this.ctx.strokeStyle = isJungle ? 'rgba(52, 211, 153, 0.32)' : 'rgba(147, 197, 253, 0.38)';
            this.ctx.lineWidth = 2.5;
            this.ctx.beginPath();
            const aPath = this.currentLevel.airPath;
            this.ctx.moveTo(aPath[0].x, aPath[0].y);
            for (let i = 1; i < aPath.length; i++) {
                this.ctx.lineTo(aPath[i].x, aPath[i].y);
            }
            this.ctx.stroke();
            this.ctx.restore();
        }
    }

    renderWaystone(x, y, index, isJungle) {
        this.ctx.save();
        const time = this.gameTime || 0;
        const pulse = Math.sin(time * 2.6 + index * 1.4) * 0.35 + 0.65;

        // Ground shadow
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        this.ctx.beginPath();
        this.ctx.ellipse(x, y + 4, 9, 5, 0, 0, Math.PI * 2);
        this.ctx.fill();

        // Stone base
        this.ctx.fillStyle = isJungle ? '#3e372c' : '#1e293b';
        this.ctx.beginPath();
        this.ctx.ellipse(x, y, 7, 4, 0, 0, Math.PI * 2);
        this.ctx.fill();

        // Hexagonal milestone obelisk
        this.ctx.fillStyle = isJungle ? '#544c3e' : '#334155';
        this.ctx.beginPath();
        this.ctx.moveTo(x - 5, y);
        this.ctx.lineTo(x - 4, y - 13);
        this.ctx.lineTo(x, y - 16);
        this.ctx.lineTo(x + 4, y - 13);
        this.ctx.lineTo(x + 5, y);
        this.ctx.closePath();
        this.ctx.fill();

        // Highlight facet on sunlit side (left)
        this.ctx.fillStyle = isJungle ? 'rgba(255, 255, 255, 0.12)' : 'rgba(200, 230, 255, 0.18)';
        this.ctx.beginPath();
        this.ctx.moveTo(x - 5, y);
        this.ctx.lineTo(x - 4, y - 13);
        this.ctx.lineTo(x, y - 16);
        this.ctx.lineTo(x, y);
        this.ctx.closePath();
        this.ctx.fill();

        // Glowing Engraved Ancient Rune
        const runeColor = isJungle ? `rgba(52, 211, 153, ${pulse})` : `rgba(56, 189, 248, ${pulse})`;
        this.ctx.fillStyle = runeColor;
        this.ctx.fillRect(x - 1, y - 11, 2, 7);
        this.ctx.fillRect(x - 2.5, y - 9, 5, 1.5);
        this.ctx.fillRect(x - 2, y - 6, 4, 1.5);

        // Radiant Rune Light Aura
        const haloColor = isJungle ? `rgba(16, 185, 129, ${0.18 * pulse})` : `rgba(14, 165, 233, ${0.22 * pulse})`;
        this.ctx.fillStyle = haloColor;
        this.ctx.beginPath();
        this.ctx.arc(x, y - 8, 12 * pulse, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.restore();
    }

    renderSpawnPortal(x, y, angle, isJungle) {
        this.ctx.save();
        this.ctx.translate(x, y);
        this.ctx.rotate(angle);

        const time = this.gameTime || 0;
        const pulse = Math.sin(time * 3) * 0.2 + 0.8;

        // Ground shadow beneath portal
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.beginPath();
        this.ctx.ellipse(0, 0, 22, 34, 0, 0, Math.PI * 2);
        this.ctx.fill();

        // 1. Swirling Dimensional Vortex Rift
        this.ctx.save();
        this.ctx.scale(0.85, 1.25);
        this.ctx.rotate(time * 2);

        // Outer swirling energy disc
        const vortexGrad = this.ctx.createRadialGradient(0, 0, 2, 0, 0, 26);
        if (isJungle) {
            vortexGrad.addColorStop(0, '#ffffff');
            vortexGrad.addColorStop(0.25, '#34d399');
            vortexGrad.addColorStop(0.65, '#065f46');
            vortexGrad.addColorStop(1, 'rgba(4, 47, 46, 0)');
        } else {
            vortexGrad.addColorStop(0, '#ffffff');
            vortexGrad.addColorStop(0.25, '#67e8f9');
            vortexGrad.addColorStop(0.65, '#0369a1');
            vortexGrad.addColorStop(1, 'rgba(8, 47, 73, 0)');
        }
        this.ctx.fillStyle = vortexGrad;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 26 * pulse, 0, Math.PI * 2);
        this.ctx.fill();

        // Spiral vortex arms
        this.ctx.strokeStyle = isJungle ? 'rgba(167, 243, 208, 0.65)' : 'rgba(186, 230, 253, 0.7)';
        this.ctx.lineWidth = 2;
        for (let a = 0; a < 3; a++) {
            this.ctx.beginPath();
            const startA = a * (Math.PI * 2 / 3);
            for (let r = 4; r <= 22; r += 2) {
                const theta = startA + (r * 0.25);
                const px = Math.cos(theta) * r;
                const py = Math.sin(theta) * r;
                if (r === 4) this.ctx.moveTo(px, py);
                else this.ctx.lineTo(px, py);
            }
            this.ctx.stroke();
        }
        this.ctx.restore();

        // Dark central rift void
        this.ctx.fillStyle = '#050811';
        this.ctx.beginPath();
        this.ctx.ellipse(0, 0, 8, 14, 0, 0, Math.PI * 2);
        this.ctx.fill();

        // 2. Ancient Carved Stone Monolith Pillars on Road Flanks
        const pillarDist = 28;
        [-pillarDist, pillarDist].forEach((py, idx) => {
            // Pillar shadow
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
            this.ctx.beginPath();
            this.ctx.ellipse(0, py + 3, 9, 6, 0, 0, Math.PI * 2);
            this.ctx.fill();

            // Stone base pedestal
            this.ctx.fillStyle = isJungle ? '#2c3327' : '#1e293b';
            this.ctx.beginPath();
            this.ctx.ellipse(0, py, 8, 5, 0, 0, Math.PI * 2);
            this.ctx.fill();

            // Upright monolith
            this.ctx.fillStyle = isJungle ? '#44513c' : '#334155';
            this.ctx.fillRect(-6, py - 18, 12, 18);

            // Pillar cap
            this.ctx.fillStyle = isJungle ? '#5a6b50' : '#475569';
            this.ctx.beginPath();
            this.ctx.arc(0, py - 18, 6, Math.PI, Math.PI * 2);
            this.ctx.fill();

            // Glowing engraved rune
            this.ctx.fillStyle = isJungle ? `rgba(52, 211, 153, ${pulse})` : `rgba(103, 232, 249, ${pulse})`;
            this.ctx.fillRect(-2, py - 13, 4, 8);
            this.ctx.fillRect(-4, py - 9, 8, 2);
        });

        // Top stone lintel arch bar
        this.ctx.strokeStyle = isJungle ? '#374130' : '#1e293b';
        this.ctx.lineWidth = 5;
        this.ctx.beginPath();
        this.ctx.moveTo(0, -pillarDist - 16);
        this.ctx.quadraticCurveTo(-6, 0, 0, pillarDist - 16);
        this.ctx.stroke();

        this.ctx.restore();
    }

    renderSanctuaryGate(x, y, angle, isJungle) {
        this.ctx.save();
        this.ctx.translate(x, y);
        this.ctx.rotate(angle);

        const time = this.gameTime || 0;
        const flicker = Math.sin(time * 7) * 0.15 + 0.85;

        // Ground shadow
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        this.ctx.beginPath();
        this.ctx.ellipse(0, 0, 18, 32, 0, 0, Math.PI * 2);
        this.ctx.fill();

        // 1. Shimmering Defensive Energy Ward across the road
        this.ctx.save();
        this.ctx.strokeStyle = isJungle ? `rgba(52, 211, 153, ${0.45 * flicker})` : `rgba(56, 189, 248, ${0.5 * flicker})`;
        this.ctx.lineWidth = 3.5;
        this.ctx.setLineDash([6, 4]);
        this.ctx.beginPath();
        this.ctx.moveTo(0, -26);
        this.ctx.lineTo(0, 26);
        this.ctx.stroke();
        this.ctx.setLineDash([]);

        // Hexagonal ward barrier glow
        this.ctx.fillStyle = isJungle ? `rgba(16, 185, 129, ${0.12 * flicker})` : `rgba(14, 165, 233, ${0.14 * flicker})`;
        this.ctx.beginPath();
        this.ctx.ellipse(0, 0, 10, 26, 0, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();

        // 2. Fortified Watchposts / Palisade Towers
        const towerDist = 28;
        [-towerDist, towerDist].forEach((ty, idx) => {
            // Shadow
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
            this.ctx.beginPath();
            this.ctx.ellipse(0, ty + 3, 9, 6, 0, 0, Math.PI * 2);
            this.ctx.fill();

            // Fortified wood / iron post
            this.ctx.fillStyle = isJungle ? '#452b14' : '#1e293b';
            this.ctx.fillRect(-6, ty - 16, 12, 16);

            // Iron bands
            this.ctx.fillStyle = '#0f172a';
            this.ctx.fillRect(-6.5, ty - 12, 13, 2);
            this.ctx.fillRect(-6.5, ty - 5, 13, 2);

            // Spiked barricade teeth
            this.ctx.fillStyle = isJungle ? '#78350f' : '#475569';
            this.ctx.beginPath();
            this.ctx.moveTo(-6, ty - 16);
            this.ctx.lineTo(0, ty - 23);
            this.ctx.lineTo(6, ty - 16);
            this.ctx.fill();

            // Flaming brazier (Jungle) / Crystal Beacon (Snow)
            if (isJungle) {
                // Torch flame
                this.ctx.fillStyle = `rgba(251, 191, 36, ${flicker})`;
                this.ctx.beginPath();
                this.ctx.arc(0, ty - 25, 4 * flicker, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.fillStyle = `rgba(239, 68, 68, ${flicker * 0.8})`;
                this.ctx.beginPath();
                this.ctx.arc(0, ty - 24, 2.5, 0, Math.PI * 2);
                this.ctx.fill();

                // Warm ambient flame light halo
                this.ctx.fillStyle = `rgba(245, 158, 11, ${0.18 * flicker})`;
                this.ctx.beginPath();
                this.ctx.arc(0, ty - 25, 14, 0, Math.PI * 2);
                this.ctx.fill();
            } else {
                // Frost Crystal Beacon
                this.ctx.fillStyle = `rgba(186, 230, 253, ${flicker})`;
                this.ctx.beginPath();
                this.ctx.moveTo(0, ty - 28);
                this.ctx.lineTo(3.5, ty - 23);
                this.ctx.lineTo(0, ty - 18);
                this.ctx.lineTo(-3.5, ty - 23);
                this.ctx.closePath();
                this.ctx.fill();

                // Cool cyan ambient ward light halo
                this.ctx.fillStyle = `rgba(56, 189, 248, ${0.2 * flicker})`;
                this.ctx.beginPath();
                this.ctx.arc(0, ty - 23, 14, 0, Math.PI * 2);
                this.ctx.fill();
            }
        });

        this.ctx.restore();
    }

    renderRoadParticles() {
        if (!this.currentLevel || !this.currentLevel.path || !this.roadParticles) return;
        const path = this.currentLevel.path;
        if (path.length < 2) return;
        const isJungle = !this.currentLevel.biome || this.currentLevel.biome === 'jungle';
        const time = this.gameTime || 0;

        this.ctx.save();
        for (let i = 0; i < this.roadParticles.length; i++) {
            const p = this.roadParticles[i];
            if (p.segIdx >= path.length - 1) continue;

            const p1 = path[p.segIdx];
            const p2 = path[p.segIdx + 1];

            // Interpolate position along path segment
            const segX = p1.x + (p2.x - p1.x) * p.t;
            const segY = p1.y + (p2.y - p1.y) * p.t;

            // Perpendicular normal for lateral offset
            const dx = p2.x - p1.x, dy = p2.y - p1.y;
            const len = Math.hypot(dx, dy) || 1;
            const nx = -dy / len, ny = dx / len;

            // Gentle bobbing motion
            const bob = Math.sin(time * p.pulseSpeed + p.pulseOffset) * 2.5;
            const px = segX + nx * (p.lateral + bob);
            const py = segY + ny * (p.lateral + bob);

            const alphaPulse = Math.sin(time * p.pulseSpeed + p.pulseOffset) * 0.25 + 0.75;
            const alpha = p.alpha * alphaPulse;

            if (isJungle) {
                // Jungle Firefly / Glowing Spore (warm lime/gold)
                this.ctx.fillStyle = `rgba(190, 242, 100, ${alpha * 0.35})`;
                this.ctx.beginPath();
                this.ctx.arc(px, py, p.size * 2.2, 0, Math.PI * 2);
                this.ctx.fill();

                this.ctx.fillStyle = `rgba(253, 224, 71, ${alpha})`;
                this.ctx.beginPath();
                this.ctx.arc(px, py, p.size * 0.8, 0, Math.PI * 2);
                this.ctx.fill();
            } else {
                // Snow Frost Flurry / Crystal Shimmer (sparkling cyan/white)
                this.ctx.fillStyle = `rgba(186, 230, 253, ${alpha * 0.4})`;
                this.ctx.beginPath();
                this.ctx.arc(px, py, p.size * 2, 0, Math.PI * 2);
                this.ctx.fill();

                this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.9})`;
                this.ctx.beginPath();
                this.ctx.arc(px, py, p.size * 0.7, 0, Math.PI * 2);
                this.ctx.fill();
            }
        }
        this.ctx.restore();
    }

    renderTrampleParticles() {
        if (!this.trampleParticles || this.trampleParticles.length === 0) return;
        this.ctx.save();
        for (let i = 0; i < this.trampleParticles.length; i++) {
            const p = this.trampleParticles[i];
            const t = p.life / p.maxLife; // 1 down to 0
            const alpha = t * 0.32;
            this.ctx.fillStyle = `${p.color} ${alpha})`;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            this.ctx.fill();
        }
        this.ctx.restore();
    }

    updateRoadParticles(effectiveDt) {
        if (!this.currentLevel || !this.currentLevel.path || !this.roadParticles) return;
        const path = this.currentLevel.path;
        if (path.length < 2) return;
        for (let i = 0; i < this.roadParticles.length; i++) {
            const p = this.roadParticles[i];
            p.t += p.speed * effectiveDt;
            if (p.t >= 1) {
                p.t = 0;
                p.segIdx = (p.segIdx + 1) % (path.length - 1);
            }
        }
    }

    updateTrampleParticles(effectiveDt) {
        if (!this.trampleParticles) return;
        for (let i = this.trampleParticles.length - 1; i >= 0; i--) {
            const tp = this.trampleParticles[i];
            tp.life -= effectiveDt;
            tp.r += effectiveDt * 5;
            if (tp.life <= 0) {
                this.trampleParticles.splice(i, 1);
            }
        }
    }

    addTrampleParticle(x, y) {
        if (!this.trampleParticles || this.trampleParticles.length > 60) return;
        const isJungle = !this.currentLevel || !this.currentLevel.biome || this.currentLevel.biome === 'jungle';
        this.trampleParticles.push({
            x: x + (Math.random() - 0.5) * 8,
            y: y + (Math.random() - 0.5) * 6,
            r: 2.2 + Math.random() * 2,
            maxLife: 0.45,
            life: 0.45,
            color: isJungle ? 'rgba(74, 55, 36,' : 'rgba(205, 225, 245,'
        });
    }

    renderDecorations() {
        if (!this.currentLevel || !this.currentLevel.decorations) return;
        this.currentLevel.decorations.forEach(dec => {
            this.ctx.save();
            if (dec.type === 'tree') {
                // Jungle Palm / Broadleaf
                this.ctx.fillStyle = '#14532d';
                this.ctx.beginPath();
                this.ctx.arc(dec.x, dec.y, dec.size, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.fillStyle = '#16a34a';
                this.ctx.beginPath();
                this.ctx.arc(dec.x - 3, dec.y - 4, dec.size * 0.75, 0, Math.PI * 2);
                this.ctx.fill();
            } else if (dec.type === 'pine') {
                // Snow Pine Tree
                this.ctx.fillStyle = '#0f172a';
                this.ctx.beginPath();
                this.ctx.arc(dec.x, dec.y, dec.size, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.fillStyle = '#1e3a5f';
                this.ctx.beginPath();
                this.ctx.arc(dec.x, dec.y, dec.size * 0.8, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.fillStyle = '#e0f2fe'; // snow top
                this.ctx.beginPath();
                this.ctx.arc(dec.x - 2, dec.y - 2, dec.size * 0.45, 0, Math.PI * 2);
                this.ctx.fill();
            } else if (dec.type === 'iceberg') {
                // Jagged crystal/ice
                this.ctx.fillStyle = '#38bdf8';
                this.ctx.beginPath();
                this.ctx.moveTo(dec.x, dec.y - dec.size);
                this.ctx.lineTo(dec.x + dec.size, dec.y + dec.size * 0.8);
                this.ctx.lineTo(dec.x - dec.size, dec.y + dec.size * 0.8);
                this.ctx.closePath();
                this.ctx.fill();
                this.ctx.fillStyle = '#bae6fd';
                this.ctx.beginPath();
                this.ctx.moveTo(dec.x, dec.y - dec.size);
                this.ctx.lineTo(dec.x, dec.y + dec.size * 0.8);
                this.ctx.lineTo(dec.x - dec.size, dec.y + dec.size * 0.8);
                this.ctx.closePath();
                this.ctx.fill();
            } else if (dec.type === 'ruin') {
                // Ancient mossy jungle ruins / pillars
                this.ctx.fillStyle = '#475569';
                this.ctx.fillRect(dec.x - dec.size / 2, dec.y - dec.size / 2, dec.size, dec.size);
                this.ctx.strokeStyle = '#15803d';
                this.ctx.lineWidth = 3;
                this.ctx.strokeRect(dec.x - dec.size / 2, dec.y - dec.size / 2, dec.size, dec.size);
            } else if (dec.type === 'rock') {
                this.ctx.fillStyle = '#64748b';
                this.ctx.beginPath();
                this.ctx.ellipse(dec.x, dec.y, dec.size, dec.size * 0.65, 0, 0, Math.PI * 2);
                this.ctx.fill();
            } else if (dec.type === 'rune') {
                this.ctx.fillStyle = '#38bdf8';
                this.ctx.font = `${dec.size}px monospace`;
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText('❄️', dec.x, dec.y);
            }
            this.ctx.restore();
        });
    }

    renderBuildSlots() {
        if (!this.currentLevel || !this.currentLevel.buildSlots) return;
        const occupiedIds = this.towers.map(t => t.slotId);
        const time = performance.now() * 0.003;
        const isJungle = !this.currentLevel.biome || this.currentLevel.biome === 'jungle';

        this.currentLevel.buildSlots.forEach(slot => {
            if (occupiedIds.includes(slot.id)) return; // Tower covers slot

            this.ctx.save();
            const isSelected = this.selectedSlot && this.selectedSlot.id === slot.id;
            const pulse = 0.5 + 0.35 * Math.sin(time * 1.8 + slot.id);

            // 1. Soft Ambient Ground Drop Shadow
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.42)';
            this.ctx.beginPath();
            this.ctx.ellipse(slot.x, slot.y + 4, 34, 16, 0, 0, Math.PI * 2);
            this.ctx.fill();

            // 2. Tactical Outer Pedestal Base
            const baseGrad = this.ctx.createRadialGradient(slot.x, slot.y, 4, slot.x, slot.y, 30);
            if (isJungle) {
                baseGrad.addColorStop(0, isSelected ? '#1e3a2b' : '#1f2937');
                baseGrad.addColorStop(0.7, isSelected ? '#064e3b' : '#111827');
                baseGrad.addColorStop(1, isSelected ? '#022c22' : '#090d16');
            } else {
                baseGrad.addColorStop(0, isSelected ? '#1e3a5f' : '#1e293b');
                baseGrad.addColorStop(0.7, isSelected ? '#0c4a6e' : '#0f172a');
                baseGrad.addColorStop(1, isSelected ? '#082f49' : '#030712');
            }

            this.ctx.fillStyle = baseGrad;
            this.ctx.beginPath();
            this.ctx.arc(slot.x, slot.y, 30, 0, Math.PI * 2);
            this.ctx.fill();

            // 3. Chiseled Stone Rim with Radial Directional Notches
            this.ctx.strokeStyle = isSelected 
                ? (isJungle ? '#34d399' : '#38bdf8')
                : (isJungle ? '#15803d' : '#0284c7');
            this.ctx.lineWidth = isSelected ? 3.0 : 2.0;
            this.ctx.beginPath();
            this.ctx.arc(slot.x, slot.y, 30, 0, Math.PI * 2);
            this.ctx.stroke();

            // Radial decorative notches (8-directional compass points)
            this.ctx.strokeStyle = isSelected ? '#ffffff' : (isJungle ? 'rgba(52, 211, 153, 0.45)' : 'rgba(56, 189, 248, 0.45)');
            this.ctx.lineWidth = 1.8;
            for (let a = 0; a < 8; a++) {
                const angle = a * (Math.PI / 4);
                const cos = Math.cos(angle);
                const sin = Math.sin(angle);
                this.ctx.beginPath();
                this.ctx.moveTo(slot.x + cos * 24, slot.y + sin * 24);
                this.ctx.lineTo(slot.x + cos * 30, slot.y + sin * 30);
                this.ctx.stroke();
            }

            // 4. Stepped Inner Runic Platform
            this.ctx.fillStyle = isJungle ? 'rgba(6, 78, 59, 0.6)' : 'rgba(12, 74, 110, 0.6)';
            this.ctx.beginPath();
            this.ctx.arc(slot.x, slot.y, 22, 0, Math.PI * 2);
            this.ctx.fill();

            // Inner dashed runic boundary
            this.ctx.strokeStyle = isSelected 
                ? (isJungle ? '#6ee7b7' : '#7dd3fc') 
                : (isJungle ? 'rgba(110, 231, 183, 0.35)' : 'rgba(125, 211, 252, 0.35)');
            this.ctx.lineWidth = 1.2;
            this.ctx.setLineDash([4, 4]);
            this.ctx.beginPath();
            this.ctx.arc(slot.x, slot.y, 22, 0, Math.PI * 2);
            this.ctx.stroke();
            this.ctx.setLineDash([]);

            // 5. Breathing Ethereal Beacon Ring (Invites Tap / Placement)
            const beaconRadius = 31 + (isSelected ? Math.sin(time * 4) * 4 : pulse * 5);
            const beaconAlpha = isSelected ? 0.75 : (pulse * 0.4);
            this.ctx.strokeStyle = isJungle 
                ? `rgba(52, 211, 153, ${beaconAlpha})` 
                : `rgba(56, 189, 248, ${beaconAlpha})`;
            this.ctx.lineWidth = isSelected ? 2.5 : 1.5;
            this.ctx.beginPath();
            this.ctx.arc(slot.x, slot.y, beaconRadius, 0, Math.PI * 2);
            this.ctx.stroke();

            // 6. Tactical Build Emblem (Embossed Golden / Crystal Hammer Cross)
            const iconColor = isSelected ? '#ffffff' : (isJungle ? '#facc15' : '#e0f2fe');
            this.ctx.fillStyle = iconColor;
            this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.6)';
            this.ctx.lineWidth = 1;

            // Horizontal crossbar
            this.ctx.fillRect(slot.x - 10, slot.y - 3, 20, 6);
            this.ctx.strokeRect(slot.x - 10, slot.y - 3, 20, 6);
            // Vertical crossbar
            this.ctx.fillRect(slot.x - 3, slot.y - 10, 6, 20);
            this.ctx.strokeRect(slot.x - 3, slot.y - 10, 6, 20);

            // Radiant Core Gem
            this.ctx.fillStyle = isJungle ? '#34d399' : '#38bdf8';
            this.ctx.beginPath();
            this.ctx.arc(slot.x, slot.y, 3, 0, Math.PI * 2);
            this.ctx.fill();

            // Selected Radiant Vertical Beacon Light
            if (isSelected) {
                const colGrad = this.ctx.createLinearGradient(slot.x, slot.y, slot.x, slot.y - 45);
                colGrad.addColorStop(0, isJungle ? 'rgba(52, 211, 153, 0.45)' : 'rgba(56, 189, 248, 0.45)');
                colGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
                this.ctx.fillStyle = colGrad;
                this.ctx.beginPath();
                this.ctx.moveTo(slot.x - 18, slot.y);
                this.ctx.lineTo(slot.x - 8, slot.y - 45);
                this.ctx.lineTo(slot.x + 8, slot.y - 45);
                this.ctx.lineTo(slot.x + 18, slot.y);
                this.ctx.closePath();
                this.ctx.fill();
            }

            this.ctx.restore();
        });
    }

    drawLevelStar(cx, cy, outerRadius = 4.6, innerRadius = 2.2) {
        let rot = -Math.PI / 2;
        const step = Math.PI / 5;
        this.ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            this.ctx.lineTo(cx + Math.cos(rot) * outerRadius, cy + Math.sin(rot) * outerRadius);
            rot += step;
            this.ctx.lineTo(cx + Math.cos(rot) * innerRadius, cy + Math.sin(rot) * innerRadius);
            rot += step;
        }
        this.ctx.closePath();
    }

    renderTowers() {
        this.towers.forEach(tower => {
            this.ctx.save();

            // Golden Overdrive aura when Battle Horn active (Enlarged)
            if (this.rushDuration > 0) {
                this.ctx.strokeStyle = 'rgba(251, 191, 36, 0.75)';
                this.ctx.lineWidth = 5;
                this.ctx.beginPath();
                this.ctx.arc(tower.x, tower.y, 38, 0, Math.PI * 2);
                this.ctx.stroke();
            }

            // Tower ground shadow
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
            this.ctx.beginPath();
            this.ctx.ellipse(tower.x, tower.y + 6, 36, 26, 0, 0, Math.PI * 2);
            this.ctx.fill();

            const recoil = tower.recoil || 0;
            const kick = recoil * (tower.level === 3 ? -9 : (tower.level === 2 ? -7 : -5));
            const flash = tower.muzzleFlash || 0;
            const now = performance.now() + (tower.x * 13.7 + tower.y * 7.3);

            const tier = Math.min(3, Math.max(1, tower.level || 1));
            const spireSprite = (this.dartSpireSprites && this.dartSpireSprites[tier]) || this.dartSpireSprite;
            const bombardSprite = (this.bombardSprites && this.bombardSprites[tier]) || this.bombardSprite;
            const cryoSprite = (this.cryoSprites && this.cryoSprites[tier]) || this.cryoSprite;
            const teslaSprite = (this.teslaSprites && this.teslaSprites[tier]) || this.teslaSprite;
            const solarSprite = (this.solarSprites && this.solarSprites[tier]) || this.solarSprite;
            const wakeSprite = (this.wakeSprites && this.wakeSprites[tier]) || this.wakeSprite;

            if (tower.type === 'archer' && spireSprite && spireSprite.complete && spireSprite.naturalWidth > 0) {
                // =========================================================================
                // AUTHENTIC HIGH-RES TOP-DOWN DART SPIRE SPRITES (STANDALONE TRANSPARENT PNG)
                // NO CIRCULAR CUTOUT, NO OFFSET, WEAPON LIMBS & TURNTABLE FULLY PRESERVED
                // =========================================================================
                const r = tier === 3 ? 41 : (tier === 2 ? 37 : 34);

                this.ctx.translate(tower.x, tower.y);
                this.ctx.rotate(tower.angle);

                // Align weapon axis to aiming direction:
                // Tier 1 arrow points straight up (-90 deg), so +90 deg (+PI/2) aligns with aim.
                // Tier 2 & 3 arrows/arms point top-right (-45 deg), so +45 deg (+PI/4) aligns with aim.
                const spriteAngleOffset = tier === 1 ? Math.PI / 2 : Math.PI / 4;
                this.ctx.rotate(spriteAngleOffset);

                // Render transparent top-down sprite centered at true geometric origin (0, 0)
                const drawSize = tier === 3 ? 96 : (tier === 2 ? 88 : 74);
                const halfSize = drawSize / 2;
                this.ctx.drawImage(spireSprite, -halfSize, -halfSize, drawSize, drawSize);

                // Return to aiming axis for weapon attack animation & moving parts
                this.ctx.rotate(-spriteAngleOffset);

                // =========================================================================
                // DYNAMIC MECHANICAL MOVING PARTS (AMBIENT & IDLE ANIMATION)
                // =========================================================================
                if (tier === 1) {
                    // Winch Gear: rotating ratcheted bronze cog
                    const winchRot = now * 0.003;
                    this.ctx.save();
                    this.ctx.translate(-10, -10);
                    this.ctx.rotate(winchRot);
                    this.ctx.strokeStyle = '#d97706';
                    this.ctx.lineWidth = 1.6;
                    this.ctx.strokeRect(-3, -3, 6, 6);
                    this.ctx.fillStyle = '#fef08a';
                    this.ctx.beginPath();
                    this.ctx.arc(0, 0, 1.8, 0, Math.PI * 2);
                    this.ctx.fill();
                    this.ctx.restore();

                    // Idle Bowstring Breathing Tension (when not recoiling)
                    if (recoil <= 0.04) {
                        const idleVib = Math.sin(now * 0.005) * 0.8;
                        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
                        this.ctx.lineWidth = 1.0;
                        this.ctx.beginPath();
                        this.ctx.moveTo(-5, -12);
                        this.ctx.lineTo(2 + idleVib, 0);
                        this.ctx.lineTo(-5, 12);
                        this.ctx.stroke();
                    }

                    // Glint traveling along arrow shaft
                    const glintT = (now * 0.001) % 1;
                    const glintX = -4 + glintT * 18;
                    this.ctx.fillStyle = `rgba(255, 255, 255, ${0.5 * Math.sin(glintT * Math.PI)})`;
                    this.ctx.beginPath();
                    this.ctx.arc(glintX, 0, 1.3, 0, Math.PI * 2);
                    this.ctx.fill();

                } else if (tier === 2) {
                    // Rotating Revolver Drum / Jade Cylinder
                    const drumRot = now * 0.0025;
                    this.ctx.save();
                    this.ctx.translate(-4, 0);
                    this.ctx.rotate(drumRot);
                    this.ctx.strokeStyle = '#047857';
                    this.ctx.lineWidth = 1.8;
                    this.ctx.beginPath();
                    this.ctx.arc(0, 0, 6.5, 0, Math.PI * 2);
                    this.ctx.stroke();
                    for (let c = 0; c < 4; c++) {
                        const ca = c * (Math.PI / 2);
                        this.ctx.fillStyle = '#a3e635';
                        this.ctx.beginPath();
                        this.ctx.arc(Math.cos(ca) * 4.2, Math.sin(ca) * 4.2, 1.3, 0, Math.PI * 2);
                        this.ctx.fill();
                    }
                    this.ctx.restore();

                    // Pneumatic Pressure Gauge Needle
                    const gaugeAngle = Math.sin(now * 0.006) * 0.9;
                    this.ctx.strokeStyle = '#fbbf24';
                    this.ctx.lineWidth = 1.2;
                    this.ctx.beginPath();
                    this.ctx.moveTo(-11, -7);
                    this.ctx.lineTo(-11 + Math.cos(gaugeAngle) * 3.5, -7 + Math.sin(gaugeAngle) * 3.5);
                    this.ctx.stroke();

                    // Toxic Venom Droplet at ready blowpipe tip
                    const isAlt = (tower.barrelAlt % 2 !== 0);
                    const dropPulse = 0.8 + 0.4 * Math.sin(now * 0.007);
                    this.ctx.fillStyle = `rgba(163, 230, 53, ${0.8 * dropPulse})`;
                    this.ctx.beginPath();
                    this.ctx.arc(26, isAlt ? 6 : -6, 2.0 * dropPulse, 0, Math.PI * 2);
                    this.ctx.fill();

                } else {
                    // Tier 3: Rotating Compound Pulley Cams
                    const camRot = now * 0.0035;
                    [-22, 22].forEach(camY => {
                        this.ctx.save();
                        this.ctx.translate(r * 0.45, camY);
                        this.ctx.rotate(camRot * (camY < 0 ? 1 : -1));
                        this.ctx.strokeStyle = '#34d399';
                        this.ctx.lineWidth = 1.4;
                        this.ctx.beginPath();
                        this.ctx.arc(0, 0, 4.5, 0, Math.PI * 2);
                        this.ctx.stroke();
                        this.ctx.beginPath();
                        this.ctx.moveTo(-3.5, 0); this.ctx.lineTo(3.5, 0);
                        this.ctx.moveTo(0, -3.5); this.ctx.lineTo(0, 3.5);
                        this.ctx.stroke();
                        this.ctx.restore();
                    });

                    // Flowing Runic Energy Streamers
                    const flowT = (now * 0.0025) % 1;
                    for (let k = 0; k < 3; k++) {
                        const pt = (flowT + k / 3) % 1;
                        const px = -12 + pt * 28;
                        this.ctx.fillStyle = `rgba(110, 231, 183, ${0.75 * Math.sin(pt * Math.PI)})`;
                        this.ctx.beginPath();
                        this.ctx.arc(px, 0, 1.8, 0, Math.PI * 2);
                        this.ctx.fill();
                    }

                    // Hovering Runic Aim Reticle
                    const sightBob = Math.sin(now * 0.004) * 2;
                    this.ctx.strokeStyle = 'rgba(52, 211, 153, 0.55)';
                    this.ctx.lineWidth = 1.2;
                    this.ctx.beginPath();
                    this.ctx.arc(r + 14 + sightBob, 0, 4.5, 0, Math.PI * 2);
                    this.ctx.stroke();
                }

                // =========================================================================
                // MECHANICAL WEAPON ATTACK ANIMATION (RECOIL & MUZZLE FLASH)
                // =========================================================================
                const weaponSlide = -Math.sin(recoil * Math.PI) * (tower.level === 3 ? 6 : (tower.level === 2 ? 4.5 : 3.5));

                // Recoil carriage track & vibrating bowstring
                if (recoil > 0.04) {
                    this.ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
                    this.ctx.fillRect(weaponSlide - 8, -3, 16, 6);

                    // Bowstring high-tension snap vibration
                    const vib = Math.sin(recoil * 38) * 1.8;
                    this.ctx.strokeStyle = tier === 3 ? '#6ee7b7' : (tier === 2 ? '#fef08a' : '#ffffff');
                    this.ctx.lineWidth = 1.3;
                    this.ctx.beginPath();
                    this.ctx.moveTo(weaponSlide - 2, -13);
                    this.ctx.lineTo(weaponSlide + 5 + vib, 0);
                    this.ctx.lineTo(weaponSlide - 2, 13);
                    this.ctx.stroke();
                }

                // Muzzle Flash, Shockwave & Mechanical Action
                if (flash > 0) {
                    const isAlt = (tower.level === 2 && tower.barrelAlt % 2 !== 0);
                    const flashY = tower.level === 2 ? (isAlt ? 6 : -6) : 0;
                    const flashX = r + 2;

                    // Expanding kinetic shockwave ring (directional air compression)
                    const shockwaveDist = (1 - recoil) * 20;
                    const shockwaveAlpha = flash * 0.85;
                    this.ctx.save();
                    this.ctx.strokeStyle = tower.level >= 3 ? `rgba(52, 211, 153, ${shockwaveAlpha})` : (tower.level === 2 ? `rgba(163, 230, 53, ${shockwaveAlpha})` : `rgba(255, 255, 255, ${shockwaveAlpha})`);
                    this.ctx.lineWidth = 2;
                    this.ctx.beginPath();
                    this.ctx.ellipse(flashX + shockwaveDist, flashY, 5 + shockwaveDist * 0.4, 3 + shockwaveDist * 0.5, 0, -Math.PI * 0.45, Math.PI * 0.45);
                    this.ctx.stroke();
                    this.ctx.restore();

                    // Sharp directional muzzle flash starburst
                    this.ctx.fillStyle = tower.level >= 3 ? `rgba(110, 231, 183, ${flash})` : (tower.level === 2 ? `rgba(254, 240, 138, ${flash})` : `rgba(255, 255, 255, ${flash})`);
                    this.ctx.beginPath();
                    this.ctx.ellipse(flashX + 4, flashY, 10 * flash, 4.5 * flash, 0, 0, Math.PI * 2);
                    this.ctx.fill();

                    // Bright hot white core
                    this.ctx.fillStyle = '#ffffff';
                    this.ctx.beginPath();
                    this.ctx.arc(flashX + 3, flashY, 2.6 * flash, 0, Math.PI * 2);
                    this.ctx.fill();

                    // Tier 2: Blowback vent exhaust on active blowpipe barrel breech
                    if (tower.level === 2) {
                        this.ctx.fillStyle = `rgba(163, 230, 53, ${flash * 0.75})`;
                        this.ctx.beginPath();
                        this.ctx.arc(weaponSlide - 6, isAlt ? 8 : -8, 3.5 * flash, 0, Math.PI * 2);
                        this.ctx.fill();
                    }

                    // Tier 3: Dual wing tip plasma energy arcs & crackling lightning bridge
                    if (tower.level >= 3 && flash > 0.15) {
                        this.ctx.fillStyle = `rgba(52, 211, 153, ${flash * 0.9})`;
                        this.ctx.beginPath();
                        this.ctx.arc(r * 0.45, -22, 3.5 * flash, 0, Math.PI * 2);
                        this.ctx.arc(r * 0.45, 22, 3.5 * flash, 0, Math.PI * 2);
                        this.ctx.fill();

                        // Arcane energy discharge between compound limbs
                        this.ctx.strokeStyle = `rgba(110, 231, 183, ${flash * 0.75})`;
                        this.ctx.lineWidth = 1.4;
                        this.ctx.beginPath();
                        this.ctx.moveTo(r * 0.45, -22);
                        this.ctx.lineTo(r * 0.2, (Math.random() - 0.5) * 8);
                        this.ctx.lineTo(r * 0.45, 22);
                        this.ctx.stroke();
                    }
                }

            } else if (tower.type === 'cannon' && bombardSprite && bombardSprite.complete && bombardSprite.naturalWidth > 0) {
                // =========================================================================
                // AUTHENTIC HIGH-RES TOP-DOWN BOMBARD CANNON SPRITES (STANDALONE TRANSPARENT PNG)
                // TIER 1: BOMBARD CANNON | TIER 2: MORTAR BATTERY | TIER 3: MAGMA SIEGE GUN
                // =========================================================================
                this.ctx.translate(tower.x, tower.y);
                this.ctx.rotate(tower.angle);

                // Both cannon and mortar barrels in the top-down sprites point straight up (-90 deg)
                // So +Math.PI / 2 (+90 deg) aligns the cannon barrel directly with tower.angle
                const spriteAngleOffset = Math.PI / 2;
                this.ctx.rotate(spriteAngleOffset);

                const drawSize = tier === 3 ? 98 : (tier === 2 ? 88 : 78);
                const halfSize = drawSize / 2;
                this.ctx.drawImage(bombardSprite, -halfSize, -halfSize, drawSize, drawSize);

                // Return to aiming axis for weapon recoil animation & muzzle blast
                this.ctx.rotate(-spriteAngleOffset);

                // =========================================================================
                // DYNAMIC MECHANICAL MOVING PARTS (AMBIENT & IDLE ANIMATION - BOMBARD)
                // =========================================================================
                if (tier === 1) {
                    // Burning Fuse Wick & Sputtering Ember
                    const fuseSpark = Math.sin(now * 0.025);
                    this.ctx.strokeStyle = '#78350f';
                    this.ctx.lineWidth = 1.8;
                    this.ctx.beginPath();
                    this.ctx.moveTo(-10, -4);
                    this.ctx.quadraticCurveTo(-15, -8, -18, -6 + Math.sin(now * 0.005) * 1.5);
                    this.ctx.stroke();
                    this.ctx.fillStyle = fuseSpark > 0 ? '#fbbf24' : '#f97316';
                    this.ctx.beginPath();
                    this.ctx.arc(-18, -6 + Math.sin(now * 0.005) * 1.5, 2.2 + fuseSpark * 0.6, 0, Math.PI * 2);
                    this.ctx.fill();

                    // Elevation Hand-Wheel
                    const wheelRot = now * 0.002;
                    this.ctx.save();
                    this.ctx.translate(-4, 11);
                    this.ctx.rotate(wheelRot);
                    this.ctx.strokeStyle = '#d97706';
                    this.ctx.lineWidth = 1.5;
                    this.ctx.beginPath();
                    this.ctx.arc(0, 0, 4, 0, Math.PI * 2);
                    this.ctx.stroke();
                    for (let sp = 0; sp < 4; sp++) {
                        const sa = sp * (Math.PI / 2);
                        this.ctx.beginPath();
                        this.ctx.moveTo(0, 0);
                        this.ctx.lineTo(Math.cos(sa) * 5.5, Math.sin(sa) * 5.5);
                        this.ctx.stroke();
                    }
                    this.ctx.restore();

                } else if (tier === 2) {
                    // Dual Telescoping Hydraulic Elevation Pistons
                    const pistonStroke = Math.sin(now * 0.004) * 3;
                    [-14, 14].forEach(py => {
                        this.ctx.fillStyle = '#b45309';
                        this.ctx.fillRect(-10, py - 2.5, 10, 5);
                        this.ctx.fillStyle = '#e2e8f0';
                        this.ctx.fillRect(pistonStroke - 2, py - 1.5, 8, 3);
                    });

                    // Rotating Pressure Relief Valve
                    const valveRot = now * 0.006;
                    this.ctx.save();
                    this.ctx.translate(-14, 0);
                    this.ctx.rotate(valveRot);
                    this.ctx.strokeStyle = '#eab308';
                    this.ctx.lineWidth = 1.4;
                    this.ctx.beginPath();
                    this.ctx.arc(0, 0, 3.5, 0, Math.PI * 2);
                    this.ctx.stroke();
                    this.ctx.restore();

                } else {
                    // Tier 3: Bubbling Molten Magma Crucibles
                    const crucibles = [
                        { x: -20, y: -20 }, { x: 20, y: -20 },
                        { x: -20, y: 20 }, { x: 20, y: 20 }
                    ];
                    crucibles.forEach((c, idx) => {
                        const magPulse = 0.7 + 0.3 * Math.sin(now * 0.005 + idx * 1.5);
                        const swirlAng = now * 0.003 * (idx % 2 === 0 ? 1 : -1) + idx;
                        this.ctx.fillStyle = `rgba(234, 88, 12, ${0.45 * magPulse})`;
                        this.ctx.beginPath();
                        this.ctx.arc(c.x, c.y, 8 * magPulse, 0, Math.PI * 2);
                        this.ctx.fill();
                        this.ctx.fillStyle = '#ea580c';
                        this.ctx.beginPath();
                        this.ctx.arc(c.x, c.y, 4.5, 0, Math.PI * 2);
                        this.ctx.fill();
                        const bx = c.x + Math.cos(swirlAng) * 2.5;
                        const by = c.y + Math.sin(swirlAng) * 2.5;
                        this.ctx.fillStyle = '#fef08a';
                        this.ctx.beginPath();
                        this.ctx.arc(bx, by, 1.8 * magPulse, 0, Math.PI * 2);
                        this.ctx.fill();
                    });

                    // Breathing Volcanic Magma Channels
                    const heatBreath = 0.5 + 0.5 * Math.sin(now * 0.003);
                    this.ctx.strokeStyle = `rgba(251, 146, 60, ${0.65 * heatBreath})`;
                    this.ctx.lineWidth = 1.8;
                    this.ctx.beginPath();
                    this.ctx.moveTo(-16, 0); this.ctx.lineTo(-4, 0);
                    this.ctx.moveTo(0, -16); this.ctx.lineTo(0, -6);
                    this.ctx.moveTo(0, 6); this.ctx.lineTo(0, 16);
                    this.ctx.stroke();
                }

                // =========================================================================
                // MECHANICAL BOMBARD RECOIL & MUZZLE BLAST ANIMATION
                // =========================================================================
                const barrelKick = -Math.sin(recoil * Math.PI) * (tier === 3 ? 7 : (tier === 2 ? 6 : 4.5));

                // Recoil breach slide
                if (recoil > 0.05) {
                    this.ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
                    this.ctx.fillRect(-7 + barrelKick, -5, 14, 10);
                }

                // Heavy Ordnance Muzzle Blast
                if (flash > 0) {
                    const muzzleDist = tier === 3 ? 34 : (tier === 2 ? 28 : 24);
                    const flashX = muzzleDist;

                    // Heavy fiery concussion shockwave ring
                    const shockDist = (1 - recoil) * 24;
                    const shockAlpha = flash * 0.85;
                    this.ctx.save();
                    this.ctx.strokeStyle = tier === 3 ? `rgba(249, 115, 22, ${shockAlpha})` : `rgba(251, 146, 60, ${shockAlpha})`;
                    this.ctx.lineWidth = 3;
                    this.ctx.beginPath();
                    this.ctx.ellipse(flashX + shockDist, 0, 7 + shockDist * 0.5, 5 + shockDist * 0.6, 0, -Math.PI * 0.45, Math.PI * 0.45);
                    this.ctx.stroke();
                    this.ctx.restore();

                    // Fiery incandescent muzzle starburst
                    this.ctx.fillStyle = tier === 3 ? `rgba(234, 88, 12, ${flash})` : `rgba(249, 115, 22, ${flash})`;
                    this.ctx.beginPath();
                    this.ctx.ellipse(flashX + 6, 0, 14 * flash, 7 * flash, 0, 0, Math.PI * 2);
                    this.ctx.fill();

                    // Hot white incandescent core
                    this.ctx.fillStyle = '#ffffff';
                    this.ctx.beginPath();
                    this.ctx.arc(flashX + 4, 0, 4 * flash, 0, Math.PI * 2);
                    this.ctx.fill();

                    // Tier 2: Twin muzzle blast accents
                    if (tier === 2) {
                        [-6, 6].forEach(offsetY => {
                            this.ctx.fillStyle = `rgba(253, 224, 71, ${flash * 0.9})`;
                            this.ctx.beginPath();
                            this.ctx.arc(flashX + 3, offsetY, 3.5 * flash, 0, Math.PI * 2);
                            this.ctx.fill();
                        });
                    }

                    // Tier 3: Magma crucibles glowing along the volcanic platform
                    if (tier === 3 && flash > 0.1) {
                        this.ctx.fillStyle = `rgba(249, 115, 22, ${flash * 0.9})`;
                        [-24, 24].forEach(offsetY => {
                            this.ctx.beginPath();
                            this.ctx.arc(0, offsetY, 4.5 * flash, 0, Math.PI * 2);
                            this.ctx.fill();
                        });
                    }
                }

            } else if (tower.type === 'frost' && cryoSprite && cryoSprite.complete && cryoSprite.naturalWidth > 0) {
                // =========================================================================
                // AUTHENTIC HIGH-RES TOP-DOWN CRYO OBELISK SPRITES (STANDALONE TRANSPARENT PNG)
                // TIER 1: CRYO OBELISK | TIER 2: GLACIAL PYLON | TIER 3: BLIZZARD SANCTUM
                // =========================================================================
                this.ctx.translate(tower.x, tower.y);
                this.ctx.rotate(tower.angle);

                // In all 3 top-down sprites, the primary crystalline focus / obelisk points straight UP (12 o'clock / -90 deg).
                // So +Math.PI / 2 (+90 deg) aligns the frost crystal focus directly with tower.angle.
                const spriteAngleOffset = Math.PI / 2;
                this.ctx.rotate(spriteAngleOffset);

                const drawSize = tier === 3 ? 96 : (tier === 2 ? 86 : 76);
                const halfSize = drawSize / 2;
                this.ctx.drawImage(cryoSprite, -halfSize, -halfSize, drawSize, drawSize);

                // Return to aiming axis for weapon animation & discharge effects
                this.ctx.rotate(-spriteAngleOffset);

                // =========================================================================
                // SUB-ZERO RESONANCE & CRYOGENIC DISCHARGE ANIMATION
                // =========================================================================
                const tipDist = tier === 3 ? 30 : (tier === 2 ? 26 : 22);

                // Ambient sub-zero core pulse
                const pulse = 0.65 + 0.35 * Math.sin(now * 0.003);
                this.ctx.fillStyle = tier === 3 ? `rgba(56, 189, 248, ${0.15 * pulse})` : `rgba(103, 232, 249, ${0.12 * pulse})`;
                this.ctx.beginPath();
                this.ctx.arc(0, 0, drawSize * 0.22, 0, Math.PI * 2);
                this.ctx.fill();

                // =========================================================================
                // DYNAMIC MOVING PARTS & AMBIENT ANIMATION (CRYO OBELISK)
                // =========================================================================
                if (tier === 1) {
                    // 3 Orbiting Floating Ice Shard Satellites
                    const orbAng1 = now * 0.0018;
                    for (let s = 0; s < 3; s++) {
                        const ang = orbAng1 + s * (Math.PI * 2 / 3);
                        const bob = Math.sin(now * 0.004 + s) * 2.5;
                        const ox = Math.cos(ang) * 22;
                        const oy = Math.sin(ang) * 22 + bob;
                        this.ctx.save();
                        this.ctx.translate(ox, oy);
                        this.ctx.rotate(ang + Math.PI / 2);
                        this.ctx.fillStyle = '#bae6fd';
                        this.ctx.beginPath();
                        this.ctx.moveTo(0, -4); this.ctx.lineTo(2.5, 0); this.ctx.lineTo(0, 4); this.ctx.lineTo(-2.5, 0);
                        this.ctx.closePath();
                        this.ctx.fill();
                        this.ctx.fillStyle = '#ffffff';
                        this.ctx.beginPath();
                        this.ctx.arc(0, 0, 1.2, 0, Math.PI * 2);
                        this.ctx.fill();
                        this.ctx.restore();
                    }

                    // Rotating Frost Mandala
                    const mandalaRot = now * 0.0006;
                    this.ctx.save();
                    this.ctx.rotate(mandalaRot);
                    this.ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
                    this.ctx.lineWidth = 1.2;
                    for (let r = 0; r < 6; r++) {
                        const ra = r * (Math.PI / 3);
                        this.ctx.beginPath();
                        this.ctx.moveTo(0, 0);
                        this.ctx.lineTo(Math.cos(ra) * 16, Math.sin(ra) * 16);
                        this.ctx.stroke();
                    }
                    this.ctx.restore();

                } else if (tier === 2) {
                    // 4 Counter-Rotating Sub-Zero Ice Needles
                    for (let s = 0; s < 2; s++) {
                        const angCW = now * 0.0022 + s * Math.PI;
                        const angCCW = -now * 0.0028 + s * Math.PI;
                        const ox1 = Math.cos(angCW) * 26;
                        const oy1 = Math.sin(angCW) * 26;
                        this.ctx.fillStyle = '#67e8f9';
                        this.ctx.beginPath();
                        this.ctx.arc(ox1, oy1, 2.2, 0, Math.PI * 2);
                        this.ctx.fill();
                        const ox2 = Math.cos(angCCW) * 19;
                        const oy2 = Math.sin(angCCW) * 19;
                        this.ctx.fillStyle = '#ffffff';
                        this.ctx.beginPath();
                        this.ctx.arc(ox2, oy2, 1.6, 0, Math.PI * 2);
                        this.ctx.fill();
                    }

                } else {
                    // Tier 3: Hovering Diamond Permafrost Core
                    const levBob = Math.sin(now * 0.0035) * 3.5;
                    const crystalRot = now * 0.0015;
                    this.ctx.save();
                    this.ctx.translate(0, levBob);
                    this.ctx.rotate(crystalRot);
                    this.ctx.fillStyle = 'rgba(56, 189, 248, 0.4)';
                    this.ctx.beginPath();
                    this.ctx.arc(0, 0, 10, 0, Math.PI * 2);
                    this.ctx.fill();
                    this.ctx.fillStyle = '#bae6fd';
                    this.ctx.beginPath();
                    this.ctx.moveTo(0, -8); this.ctx.lineTo(6, 0); this.ctx.lineTo(0, 8); this.ctx.lineTo(-6, 0);
                    this.ctx.closePath();
                    this.ctx.fill();
                    this.ctx.strokeStyle = '#ffffff';
                    this.ctx.lineWidth = 1.3;
                    this.ctx.stroke();
                    this.ctx.fillStyle = '#ffffff';
                    this.ctx.beginPath();
                    this.ctx.moveTo(0, -4); this.ctx.lineTo(3, 0); this.ctx.lineTo(0, 4); this.ctx.lineTo(-3, 0);
                    this.ctx.closePath();
                    this.ctx.fill();
                    this.ctx.restore();

                    // Continuous Ambient Frost Lightning Arcs
                    if (Math.random() < 0.65) {
                        const monoPts = [
                            { x: -24, y: -24 }, { x: 24, y: -24 },
                            { x: -24, y: 24 }, { x: 24, y: 24 }
                        ];
                        const chosen = monoPts[Math.floor(Math.random() * monoPts.length)];
                        this.ctx.strokeStyle = 'rgba(186, 230, 253, 0.65)';
                        this.ctx.lineWidth = 1.3;
                        this.ctx.beginPath();
                        this.ctx.moveTo(chosen.x, chosen.y);
                        this.ctx.lineTo(chosen.x * 0.4 + (Math.random() - 0.5) * 6, chosen.y * 0.4 + (Math.random() - 0.5) * 6);
                        this.ctx.lineTo(0, levBob);
                        this.ctx.stroke();
                    }
                }

                // Cryogenic Muzzle Discharge & Frost Shockwave
                if (flash > 0) {
                    // Expanding sub-zero compression ring
                    const shockDist = (1 - recoil) * 22;
                    const shockAlpha = flash * 0.85;
                    this.ctx.save();
                    this.ctx.strokeStyle = tier === 3 ? `rgba(186, 230, 253, ${shockAlpha})` : `rgba(103, 232, 249, ${shockAlpha})`;
                    this.ctx.lineWidth = 2.5;
                    this.ctx.beginPath();
                    this.ctx.ellipse(tipDist + shockDist, 0, 6 + shockDist * 0.4, 4 + shockDist * 0.5, 0, -Math.PI * 0.45, Math.PI * 0.45);
                    this.ctx.stroke();
                    this.ctx.restore();

                    // Crystalline starburst flash
                    this.ctx.fillStyle = tier === 3 ? `rgba(186, 230, 253, ${flash})` : `rgba(103, 232, 249, ${flash})`;
                    this.ctx.beginPath();
                    this.ctx.ellipse(tipDist + 4, 0, 12 * flash, 6 * flash, 0, 0, Math.PI * 2);
                    this.ctx.fill();

                    // Radiant white core
                    this.ctx.fillStyle = '#ffffff';
                    this.ctx.beginPath();
                    this.ctx.arc(tipDist + 2, 0, 3.4 * flash, 0, Math.PI * 2);
                    this.ctx.fill();

                    // Tier 2: Lateral resonance bursts on side crystals
                    if (tier === 2) {
                        [-16, 16].forEach(offsetY => {
                            this.ctx.fillStyle = `rgba(103, 232, 249, ${flash * 0.8})`;
                            this.ctx.beginPath();
                            this.ctx.arc(4, offsetY, 3.0 * flash, 0, Math.PI * 2);
                            this.ctx.fill();
                        });
                    }

                    // Tier 3: 4 Monolith spire lightning arcs focusing energy into center
                    if (tier === 3 && flash > 0.15) {
                        this.ctx.strokeStyle = `rgba(186, 230, 253, ${flash * 0.9})`;
                        this.ctx.lineWidth = 1.8;
                        const monoOffsets = [
                            { x: -24, y: -24 },
                            { x: 24, y: -24 },
                            { x: -24, y: 24 },
                            { x: 24, y: 24 }
                        ];
                        monoOffsets.forEach(m => {
                            this.ctx.beginPath();
                            this.ctx.moveTo(m.x, m.y);
                            this.ctx.lineTo((Math.random() - 0.5) * 6, (Math.random() - 0.5) * 6);
                            this.ctx.stroke();
                        });
                    }
                }

            } else if (tower.type === 'tesla' && teslaSprite && teslaSprite.complete && teslaSprite.naturalWidth > 0) {
                // =========================================================================
                // AUTHENTIC HIGH-RES TOP-DOWN TESLA TOWER SPRITES (STANDALONE TRANSPARENT PNG)
                // TIER 1: TESLA TOWER | TIER 2: ARC CAPACITOR | TIER 3: STORM CONDUCTOR
                // =========================================================================
                this.ctx.translate(tower.x, tower.y);
                this.ctx.rotate(tower.angle);

                // Central electrode & discharge posts point straight up (12 o'clock / -90 deg)
                const spriteAngleOffset = Math.PI / 2;
                this.ctx.rotate(spriteAngleOffset);

                const drawSize = tier === 3 ? 98 : (tier === 2 ? 88 : 78);
                const halfSize = drawSize / 2;
                this.ctx.drawImage(teslaSprite, -halfSize, -halfSize, drawSize, drawSize);

                // Return to aiming axis for weapon discharge animation
                this.ctx.rotate(-spriteAngleOffset);

                // =========================================================================
                // HIGH-VOLTAGE TESLA DISCHARGE & IONIZING ARC ANIMATION
                // =========================================================================
                const tipDist = tier === 3 ? 28 : (tier === 2 ? 24 : 20);

                // Ambient electromagnetic field pulsation
                const pulse = 0.6 + 0.4 * Math.sin(now * 0.005);
                this.ctx.fillStyle = tier === 3 ? `rgba(168, 85, 247, ${0.16 * pulse})` : `rgba(192, 132, 252, ${0.12 * pulse})`;
                this.ctx.beginPath();
                this.ctx.arc(0, 0, drawSize * 0.24, 0, Math.PI * 2);
                this.ctx.fill();

                // =========================================================================
                // DYNAMIC MOVING PARTS & AMBIENT ANIMATION (TESLA TOWER)
                // =========================================================================
                if (tier === 1) {
                    // 1. Orbiting High-Voltage Induction Sparks
                    const arcAng = now * 0.0032;
                    for (let s = 0; s < 3; s++) {
                        const ang = arcAng + s * (Math.PI * 2 / 3);
                        const ox = Math.cos(ang) * 20;
                        const oy = Math.sin(ang) * 20;
                        this.ctx.fillStyle = '#e879f9';
                        this.ctx.beginPath();
                        this.ctx.arc(ox, oy, 2.2, 0, Math.PI * 2);
                        this.ctx.fill();
                        this.ctx.fillStyle = '#ffffff';
                        this.ctx.beginPath();
                        this.ctx.arc(ox, oy, 1.0, 0, Math.PI * 2);
                        this.ctx.fill();
                    }

                    // 2. Pulsing Electromagnetic Ionization Wave (Expanding concentric ring)
                    const wavePhase = (now * 0.018) % 20;
                    const waveAlpha = Math.max(0, 0.45 * (1 - wavePhase / 20));
                    this.ctx.strokeStyle = `rgba(192, 132, 252, ${waveAlpha})`;
                    this.ctx.lineWidth = 1.4;
                    this.ctx.beginPath();
                    this.ctx.arc(0, 0, 8 + wavePhase, 0, Math.PI * 2);
                    this.ctx.stroke();

                    // 3. Crackling micro-spark along copper coil
                    if (Math.random() < 0.4) {
                        const ca = Math.random() * Math.PI * 2;
                        const cr = 10 + Math.random() * 6;
                        this.ctx.strokeStyle = 'rgba(240, 171, 252, 0.75)';
                        this.ctx.lineWidth = 1.2;
                        this.ctx.beginPath();
                        this.ctx.moveTo(Math.cos(ca) * cr, Math.sin(ca) * cr);
                        this.ctx.lineTo(Math.cos(ca + 0.3) * (cr + 4), Math.sin(ca + 0.3) * (cr + 4));
                        this.ctx.stroke();
                    }

                } else if (tier === 2) {
                    // 1. Dual Counter-Rotating Toroidal Magnetic Stator Rings
                    const statorCW = now * 0.0028;
                    const statorCCW = -now * 0.0034;
                    // Outer CW ring
                    this.ctx.save();
                    this.ctx.rotate(statorCW);
                    this.ctx.strokeStyle = 'rgba(192, 132, 252, 0.5)';
                    this.ctx.lineWidth = 1.6;
                    this.ctx.setLineDash([6, 8]);
                    this.ctx.beginPath();
                    this.ctx.arc(0, 0, 23, 0, Math.PI * 2);
                    this.ctx.stroke();
                    this.ctx.restore();
                    // Inner CCW ring
                    this.ctx.save();
                    this.ctx.rotate(statorCCW);
                    this.ctx.strokeStyle = 'rgba(232, 121, 249, 0.6)';
                    this.ctx.lineWidth = 1.4;
                    this.ctx.setLineDash([4, 6]);
                    this.ctx.beginPath();
                    this.ctx.arc(0, 0, 15, 0, Math.PI * 2);
                    this.ctx.stroke();
                    this.ctx.restore();

                    // 2. Four Pulsating Incandescent Vacuum-Tube Filaments
                    const tubeCoords = [
                        { x: -14, y: -10 }, { x: 14, y: -10 },
                        { x: -14, y: 10 }, { x: 14, y: 10 }
                    ];
                    tubeCoords.forEach((t, i) => {
                        const hum = 0.5 + 0.5 * Math.sin(now * 0.008 + i * 1.5);
                        this.ctx.fillStyle = `rgba(240, 171, 252, ${0.25 * hum})`;
                        this.ctx.beginPath();
                        this.ctx.arc(t.x, t.y, 5, 0, Math.PI * 2);
                        this.ctx.fill();
                        this.ctx.fillStyle = `rgba(232, 121, 249, ${0.9 * hum})`;
                        this.ctx.beginPath();
                        this.ctx.arc(t.x, t.y, 2.2, 0, Math.PI * 2);
                        this.ctx.fill();
                        this.ctx.fillStyle = '#ffffff';
                        this.ctx.beginPath();
                        this.ctx.arc(t.x, t.y, 1.0, 0, Math.PI * 2);
                        this.ctx.fill();
                    });

                    // 3. Static discharge bridge between lateral capacitor horns
                    if (Math.random() < 0.35) {
                        const sideY = Math.random() < 0.5 ? -14 : 14;
                        this.ctx.strokeStyle = 'rgba(245, 208, 254, 0.7)';
                        this.ctx.lineWidth = 1.3;
                        this.ctx.beginPath();
                        this.ctx.moveTo(2, sideY);
                        this.ctx.lineTo(2 + (Math.random() - 0.5) * 5, sideY * 0.5);
                        this.ctx.lineTo(tipDist * 0.5, 0);
                        this.ctx.stroke();
                    }

                } else {
                    // Tier 3: Storm Conductor
                    // 1. High-Speed Spinning Quad-Pole Magnetic Rotor
                    const rotorAng = now * 0.0055;
                    this.ctx.save();
                    this.ctx.rotate(rotorAng);
                    for (let pole = 0; pole < 4; pole++) {
                        const pa = pole * (Math.PI / 2);
                        const px = Math.cos(pa) * 16;
                        const py = Math.sin(pa) * 16;
                        // Arm
                        this.ctx.strokeStyle = '#475569';
                        this.ctx.lineWidth = 2.2;
                        this.ctx.beginPath();
                        this.ctx.moveTo(0, 0);
                        this.ctx.lineTo(px, py);
                        this.ctx.stroke();
                        // Glowing induction head
                        this.ctx.fillStyle = '#e879f9';
                        this.ctx.beginPath();
                        this.ctx.arc(px, py, 2.8, 0, Math.PI * 2);
                        this.ctx.fill();
                        this.ctx.fillStyle = '#ffffff';
                        this.ctx.beginPath();
                        this.ctx.arc(px, py, 1.2, 0, Math.PI * 2);
                        this.ctx.fill();
                    }
                    this.ctx.restore();

                    // 2. Levitating Central Hyper-Charged Storm Orb
                    const stormBob = Math.sin(now * 0.004) * 2.2;
                    const stormJitterX = (Math.random() - 0.5) * 1.2;
                    const stormJitterY = (Math.random() - 0.5) * 1.2;
                    const scx = stormJitterX;
                    const scy = stormBob + stormJitterY;
                    this.ctx.fillStyle = 'rgba(168, 85, 247, 0.35)';
                    this.ctx.beginPath();
                    this.ctx.arc(scx, scy, 9, 0, Math.PI * 2);
                    this.ctx.fill();
                    this.ctx.fillStyle = '#e879f9';
                    this.ctx.beginPath();
                    this.ctx.arc(scx, scy, 5.5, 0, Math.PI * 2);
                    this.ctx.fill();
                    this.ctx.fillStyle = '#ffffff';
                    this.ctx.beginPath();
                    this.ctx.arc(scx, scy, 2.8, 0, Math.PI * 2);
                    this.ctx.fill();

                    // 3. Continuous Coronal Lightning Streamers from 4 Perimeter Pylons
                    if (Math.random() < 0.65) {
                        const pylonPts = [
                            { x: -24, y: -24 }, { x: 24, y: -24 },
                            { x: -24, y: 24 }, { x: 24, y: 24 }
                        ];
                        const chosenPylon = pylonPts[Math.floor(Math.random() * pylonPts.length)];
                        this.ctx.strokeStyle = 'rgba(240, 171, 252, 0.75)';
                        this.ctx.lineWidth = 1.4;
                        this.ctx.beginPath();
                        this.ctx.moveTo(chosenPylon.x, chosenPylon.y);
                        this.ctx.lineTo(chosenPylon.x * 0.5 + (Math.random() - 0.5) * 8, chosenPylon.y * 0.5 + (Math.random() - 0.5) * 8);
                        this.ctx.lineTo(scx, scy);
                        this.ctx.stroke();
                    }
                }

                // High-voltage crackling spark discharges at electrode
                if (flash > 0) {
                    // Ionizing shockwave ring
                    const shockDist = (1 - recoil) * 24;
                    const shockAlpha = flash * 0.85;
                    this.ctx.save();
                    this.ctx.strokeStyle = tier === 3 ? `rgba(232, 121, 249, ${shockAlpha})` : `rgba(192, 132, 252, ${shockAlpha})`;
                    this.ctx.lineWidth = 2.5;
                    this.ctx.beginPath();
                    this.ctx.ellipse(tipDist + shockDist, 0, 7 + shockDist * 0.4, 5 + shockDist * 0.5, 0, -Math.PI * 0.45, Math.PI * 0.45);
                    this.ctx.stroke();
                    this.ctx.restore();

                    // Blinding electric starburst
                    this.ctx.fillStyle = tier === 3 ? `rgba(232, 121, 249, ${flash})` : `rgba(192, 132, 252, ${flash})`;
                    this.ctx.beginPath();
                    this.ctx.ellipse(tipDist + 4, 0, 14 * flash, 7 * flash, 0, 0, Math.PI * 2);
                    this.ctx.fill();

                    // White-hot plasma core
                    this.ctx.fillStyle = '#ffffff';
                    this.ctx.beginPath();
                    this.ctx.arc(tipDist + 2, 0, 3.8 * flash, 0, Math.PI * 2);
                    this.ctx.fill();

                    // Tier 2: Arc capacitor twin energy arcs
                    if (tier === 2) {
                        [-14, 14].forEach(offsetY => {
                            this.ctx.fillStyle = `rgba(168, 85, 247, ${flash * 0.85})`;
                            this.ctx.beginPath();
                            this.ctx.arc(2, offsetY, 3.2 * flash, 0, Math.PI * 2);
                            this.ctx.fill();
                        });
                    }

                    // Tier 3: Storm conductor multi-point coronal lightning bridges
                    if (tier === 3 && flash > 0.1) {
                        this.ctx.strokeStyle = `rgba(240, 171, 252, ${flash * 0.95})`;
                        this.ctx.lineWidth = 1.8;
                        const coilAngles = [Math.PI / 4, 3 * Math.PI / 4, 5 * Math.PI / 4, 7 * Math.PI / 4];
                        coilAngles.forEach(ang => {
                            const cx = Math.cos(ang) * 26;
                            const cy = Math.sin(ang) * 26;
                            this.ctx.beginPath();
                            this.ctx.moveTo(cx, cy);
                            this.ctx.lineTo((Math.random() - 0.5) * 8, (Math.random() - 0.5) * 8);
                            this.ctx.stroke();
                        });
                    }
                }

            } else if (tower.type === 'flame' && solarSprite && solarSprite.complete && solarSprite.naturalWidth > 0) {
                // =========================================================================
                // AUTHENTIC HIGH-RES TOP-DOWN SOLAR SPIRE SPRITES (STANDALONE TRANSPARENT PNG)
                // TIER 1: SOLAR SPIRE | TIER 2: INFERNO CORE | TIER 3: SUN GOD RAY
                // =========================================================================
                this.ctx.translate(tower.x, tower.y);
                this.ctx.rotate(tower.angle);

                // Solar aperture / optical collimator points straight up (12 o'clock / -90 deg)
                const spriteAngleOffset = Math.PI / 2;
                this.ctx.rotate(spriteAngleOffset);

                const drawSize = tier === 3 ? 98 : (tier === 2 ? 88 : 78);
                const halfSize = drawSize / 2;
                this.ctx.drawImage(solarSprite, -halfSize, -halfSize, drawSize, drawSize);

                // Return to aiming axis for optical animation
                this.ctx.rotate(-spriteAngleOffset);

                // =========================================================================
                // CONCENTRATED SOLAR CORE & OPTICAL EMISSION PULSE
                // =========================================================================
                const tipDist = tier === 3 ? 28 : (tier === 2 ? 24 : 20);

                // Continuous solar thermal respiration pulse
                const solarGlow = 0.65 + 0.35 * Math.sin(now * 0.007);
                this.ctx.fillStyle = tier === 3 ? `rgba(245, 158, 11, ${0.18 * solarGlow})` : `rgba(239, 68, 68, ${0.14 * solarGlow})`;
                this.ctx.beginPath();
                this.ctx.arc(0, 0, drawSize * 0.22, 0, Math.PI * 2);
                this.ctx.fill();

                // =========================================================================
                // DYNAMIC MOVING PARTS & AMBIENT ANIMATION (SOLAR SPIRE)
                // =========================================================================
                if (tier === 1) {
                    // 1. Rotating Mechanical Optical Iris Diaphragm Aperture
                    const irisRot = now * 0.0014;
                    const irisAperture = 5.5 + 2.2 * Math.sin(now * 0.0032);
                    this.ctx.save();
                    this.ctx.translate(tipDist * 0.6, 0);
                    this.ctx.rotate(irisRot);
                    for (let blade = 0; blade < 6; blade++) {
                        const ba = blade * (Math.PI / 3);
                        this.ctx.strokeStyle = '#f59e0b';
                        this.ctx.lineWidth = 1.8;
                        this.ctx.beginPath();
                        this.ctx.arc(Math.cos(ba) * 7, Math.sin(ba) * 7, irisAperture, ba, ba + 1.2);
                        this.ctx.stroke();
                    }
                    this.ctx.restore();

                    // 2. Sweeping Prismatic Sunstone Lens Glint
                    const glintOffset = Math.sin(now * 0.0022) * 8;
                    this.ctx.fillStyle = 'rgba(254, 240, 138, 0.65)';
                    this.ctx.beginPath();
                    this.ctx.ellipse(tipDist * 0.6 + glintOffset, 0, 3, 7, Math.PI / 4, 0, Math.PI * 2);
                    this.ctx.fill();

                    // 3. Ambient heat shimmer convection sparks
                    if (Math.random() < 0.35) {
                        const sparkDist = tipDist * 0.6 + (Math.random() - 0.5) * 10;
                        const sparkLat = (Math.random() - 0.5) * 12;
                        this.ctx.fillStyle = '#fef08a';
                        this.ctx.beginPath();
                        this.ctx.arc(sparkDist, sparkLat, 1.3, 0, Math.PI * 2);
                        this.ctx.fill();
                    }

                } else if (tier === 2) {
                    // 1. Swirling Molten Magma Vortex in Crucible
                    const vortexRot = now * 0.0035;
                    this.ctx.save();
                    this.ctx.rotate(vortexRot);
                    for (let arm = 0; arm < 3; arm++) {
                        const aa = arm * (Math.PI * 2 / 3);
                        this.ctx.strokeStyle = 'rgba(249, 115, 22, 0.6)';
                        this.ctx.lineWidth = 2.0;
                        this.ctx.beginPath();
                        this.ctx.arc(0, 0, 11, aa, aa + 1.3);
                        this.ctx.stroke();
                    }
                    this.ctx.restore();

                    // 2. Dual Reciprocating Thermal Exhaust Valves / Pistons
                    const pistonTravel = Math.sin(now * 0.0045) * 3.2;
                    [-15, 15].forEach(vy => {
                        this.ctx.fillStyle = '#78350f';
                        this.ctx.fillRect(pistonTravel - 4, vy - 2.5, 9, 5);
                        this.ctx.strokeStyle = '#d97706';
                        this.ctx.lineWidth = 1.2;
                        this.ctx.strokeRect(pistonTravel - 4, vy - 2.5, 9, 5);
                        // Exhaust ember jet
                        const jetLen = 4 + 3 * Math.sin(now * 0.006 + vy);
                        this.ctx.fillStyle = 'rgba(251, 146, 60, 0.7)';
                        this.ctx.beginPath();
                        this.ctx.moveTo(pistonTravel - 4, vy - 2);
                        this.ctx.lineTo(pistonTravel - 4 - jetLen, vy);
                        this.ctx.lineTo(pistonTravel - 4, vy + 2);
                        this.ctx.closePath();
                        this.ctx.fill();
                    });

                    // 3. Central glowing incandescent crucible core
                    const corePulse = 0.7 + 0.3 * Math.sin(now * 0.006);
                    this.ctx.fillStyle = `rgba(254, 240, 138, ${0.85 * corePulse})`;
                    this.ctx.beginPath();
                    this.ctx.arc(0, 0, 4.2, 0, Math.PI * 2);
                    this.ctx.fill();

                } else {
                    // Tier 3: Sun God Ray
                    // 1. Four Orbiting Floating Golden Solar Prism Mirrors
                    const orbAng = now * 0.0022;
                    for (let m = 0; m < 4; m++) {
                        const ang = orbAng + m * (Math.PI / 2);
                        const mx = Math.cos(ang) * 26;
                        const my = Math.sin(ang) * 26;
                        this.ctx.save();
                        this.ctx.translate(mx, my);
                        this.ctx.rotate(ang + now * 0.004);
                        // Golden prism mirror diamond
                        this.ctx.fillStyle = '#fbbf24';
                        this.ctx.beginPath();
                        this.ctx.moveTo(0, -5); this.ctx.lineTo(3.5, 0); this.ctx.lineTo(0, 5); this.ctx.lineTo(-3.5, 0);
                        this.ctx.closePath();
                        this.ctx.fill();
                        this.ctx.strokeStyle = '#ffffff';
                        this.ctx.lineWidth = 1.1;
                        this.ctx.stroke();
                        this.ctx.restore();
                        // Reflected sunbeam thread towards central aperture
                        this.ctx.strokeStyle = 'rgba(253, 224, 71, 0.28)';
                        this.ctx.lineWidth = 1.2;
                        this.ctx.beginPath();
                        this.ctx.moveTo(mx, my);
                        this.ctx.lineTo(tipDist * 0.5, 0);
                        this.ctx.stroke();
                    }

                    // 2. Undulating Solar Chromosphere Prominence Flares
                    for (let f = 0; f < 3; f++) {
                        const fa = now * 0.0018 + f * (Math.PI * 2 / 3);
                        const fl = 14 + Math.sin(now * 0.005 + f * 2) * 3.5;
                        const fx = Math.cos(fa) * fl;
                        const fy = Math.sin(fa) * fl;
                        this.ctx.fillStyle = 'rgba(245, 158, 11, 0.55)';
                        this.ctx.beginPath();
                        this.ctx.arc(fx, fy, 2.5, 0, Math.PI * 2);
                        this.ctx.fill();
                    }

                    // 3. Central Blazing Solar Fusion Core with Coronal Glow
                    const coronaBob = Math.sin(now * 0.004) * 1.5;
                    this.ctx.fillStyle = 'rgba(253, 224, 71, 0.45)';
                    this.ctx.beginPath();
                    this.ctx.arc(0, coronaBob, 9, 0, Math.PI * 2);
                    this.ctx.fill();
                    this.ctx.fillStyle = '#ffffff';
                    this.ctx.beginPath();
                    this.ctx.arc(0, coronaBob, 4.5, 0, Math.PI * 2);
                    this.ctx.fill();
                }

                // Blazing focal lens starburst & collimator flare
                if (flash > 0 || recoil > 0) {
                    const intense = Math.max(flash, recoil);
                    // Incandescent heat shimmer ring
                    this.ctx.save();
                    this.ctx.strokeStyle = tier === 3 ? `rgba(251, 191, 36, ${intense * 0.85})` : `rgba(249, 115, 22, ${intense * 0.8})`;
                    this.ctx.lineWidth = 2.8;
                    this.ctx.beginPath();
                    this.ctx.arc(tipDist, 0, 7 + (1 - intense) * 12, 0, Math.PI * 2);
                    this.ctx.stroke();
                    this.ctx.restore();

                    // Solar starburst diamond
                    this.ctx.fillStyle = tier === 3 ? `rgba(253, 224, 71, ${intense})` : `rgba(251, 146, 60, ${intense})`;
                    this.ctx.beginPath();
                    this.ctx.ellipse(tipDist + 2, 0, 12 * intense, 5 * intense, 0, 0, Math.PI * 2);
                    this.ctx.fill();

                    // Incandescent white laser source
                    this.ctx.fillStyle = '#ffffff';
                    this.ctx.beginPath();
                    this.ctx.arc(tipDist + 1, 0, 3.5 * intense, 0, Math.PI * 2);
                    this.ctx.fill();

                    // Tier 3: 4 Orbiting solar flares focusing into the Sun God aperture
                    if (tier === 3) {
                        const rot = now * 0.006;
                        this.ctx.fillStyle = `rgba(245, 158, 11, ${intense * 0.9})`;
                        for (let k = 0; k < 4; k++) {
                            const ang = rot + (k * Math.PI / 2);
                            const fx = Math.cos(ang) * 18;
                            const fy = Math.sin(ang) * 18;
                            this.ctx.beginPath();
                            this.ctx.arc(fx, fy, 2.5, 0, Math.PI * 2);
                            this.ctx.fill();
                        }
                    }
                }

            } else if (tower.type === 'wave' && wakeSprite && wakeSprite.complete && wakeSprite.naturalWidth > 0) {
                // =========================================================================
                // AUTHENTIC HIGH-RES TOP-DOWN WAKE SPIRE SPRITES (STANDALONE TRANSPARENT PNG)
                // TIER 1: WAKE SPIRE | TIER 2: TIDAL MAELSTROM | TIER 3: LEVIATHAN'S WAKE
                // =========================================================================
                this.ctx.translate(tower.x, tower.y);
                this.ctx.rotate(tower.angle);

                // Hydraulic obelisk & wave conduits point straight up (12 o'clock / -90 deg)
                const spriteAngleOffset = Math.PI / 2;
                this.ctx.rotate(spriteAngleOffset);

                const drawSize = tier === 3 ? 98 : (tier === 2 ? 88 : 78);
                const halfSize = drawSize / 2;
                this.ctx.drawImage(wakeSprite, -halfSize, -halfSize, drawSize, drawSize);

                // Return to aiming axis for weapon animation
                this.ctx.rotate(-spriteAngleOffset);

                // =========================================================================
                // TIDAL SURGE & HYDRAULIC PRESSURE DISCHARGE ANIMATION
                // =========================================================================
                const tipDist = tier === 3 ? 28 : (tier === 2 ? 24 : 20);

                // Ambient tidal water swirl ripple
                const tidePulse = 0.6 + 0.4 * Math.sin(now * 0.004);
                this.ctx.fillStyle = tier === 3 ? `rgba(14, 165, 233, ${0.16 * tidePulse})` : `rgba(56, 189, 248, ${0.12 * tidePulse})`;
                this.ctx.beginPath();
                this.ctx.arc(0, 0, drawSize * 0.22, 0, Math.PI * 2);
                this.ctx.fill();

                // =========================================================================
                // DYNAMIC MOVING PARTS & AMBIENT ANIMATION (WAKE SPIRE)
                // =========================================================================
                if (tier === 1) {
                    // 1. Concentric Expanding Water Wave Ripples
                    const ripplePhase = (now * 0.016) % 22;
                    const rippleAlpha = Math.max(0, 0.4 * (1 - ripplePhase / 22));
                    this.ctx.strokeStyle = `rgba(56, 189, 248, ${rippleAlpha})`;
                    this.ctx.lineWidth = 1.4;
                    this.ctx.beginPath();
                    this.ctx.arc(0, 0, 10 + ripplePhase, 0, Math.PI * 2);
                    this.ctx.stroke();

                    // 2. Sloshing Hydro-Pressure Fluid Column in Obelisk
                    const fluidLevel = Math.sin(now * 0.0035) * 3;
                    this.ctx.fillStyle = 'rgba(14, 165, 233, 0.45)';
                    this.ctx.beginPath();
                    this.ctx.ellipse(tipDist * 0.4, 0, 5 + fluidLevel, 3, 0, 0, Math.PI * 2);
                    this.ctx.fill();

                    // Rising air bubble
                    const bubbleProg = (now * 0.02) % 16;
                    this.ctx.fillStyle = '#ffffff';
                    this.ctx.beginPath();
                    this.ctx.arc(tipDist * 0.4 - 8 + bubbleProg, Math.sin(bubbleProg * 0.5) * 2, 1.2, 0, Math.PI * 2);
                    this.ctx.fill();

                    // 3. Rotating Bronze Hydro-Turbine Propeller
                    const turbAng = now * 0.0042;
                    this.ctx.save();
                    this.ctx.translate(0, 0);
                    this.ctx.rotate(turbAng);
                    for (let b = 0; b < 3; b++) {
                        const ba = b * (Math.PI * 2 / 3);
                        this.ctx.strokeStyle = '#0284c7';
                        this.ctx.lineWidth = 2.0;
                        this.ctx.beginPath();
                        this.ctx.moveTo(0, 0);
                        this.ctx.lineTo(Math.cos(ba) * 7, Math.sin(ba) * 7);
                        this.ctx.stroke();
                    }
                    this.ctx.restore();

                } else if (tier === 2) {
                    // 1. Twin Counter-Rotating Hydro Whirlpool Basins on Flanks
                    const wpLeftRot = now * 0.0038;
                    const wpRightRot = -now * 0.0038;
                    // Left basin (CW)
                    this.ctx.save();
                    this.ctx.translate(2, -15);
                    this.ctx.rotate(wpLeftRot);
                    this.ctx.strokeStyle = 'rgba(56, 189, 248, 0.65)';
                    this.ctx.lineWidth = 1.5;
                    this.ctx.beginPath();
                    this.ctx.arc(0, 0, 7, 0, Math.PI * 1.5);
                    this.ctx.stroke();
                    this.ctx.fillStyle = '#ffffff';
                    this.ctx.beginPath();
                    this.ctx.arc(Math.cos(wpLeftRot * 2) * 5, Math.sin(wpLeftRot * 2) * 5, 1.3, 0, Math.PI * 2);
                    this.ctx.fill();
                    this.ctx.restore();

                    // Right basin (CCW)
                    this.ctx.save();
                    this.ctx.translate(2, 15);
                    this.ctx.rotate(wpRightRot);
                    this.ctx.strokeStyle = 'rgba(56, 189, 248, 0.65)';
                    this.ctx.lineWidth = 1.5;
                    this.ctx.beginPath();
                    this.ctx.arc(0, 0, 7, 0, Math.PI * 1.5);
                    this.ctx.stroke();
                    this.ctx.fillStyle = '#ffffff';
                    this.ctx.beginPath();
                    this.ctx.arc(Math.cos(wpRightRot * 2) * 5, Math.sin(wpRightRot * 2) * 5, 1.3, 0, Math.PI * 2);
                    this.ctx.fill();
                    this.ctx.restore();

                    // 2. Central Churning Pressure Impeller Chamber
                    const impAng = now * 0.005;
                    this.ctx.save();
                    this.ctx.rotate(impAng);
                    for (let b = 0; b < 4; b++) {
                        const ba = b * (Math.PI / 2);
                        this.ctx.fillStyle = '#38bdf8';
                        this.ctx.beginPath();
                        this.ctx.arc(Math.cos(ba) * 9, Math.sin(ba) * 9, 2.2, 0, Math.PI * 2);
                        this.ctx.fill();
                    }
                    this.ctx.restore();

                } else {
                    // Tier 3: Leviathan's Wake
                    // 1. Hovering Zero-Gravity Deforming Abyssal Hydro-Sphere
                    const hydroBob = Math.sin(now * 0.0035) * 3.0;
                    this.ctx.save();
                    this.ctx.translate(0, hydroBob);
                    // Deforming liquid boundary
                    this.ctx.fillStyle = 'rgba(14, 165, 233, 0.4)';
                    this.ctx.beginPath();
                    for (let a = 0; a < 8; a++) {
                        const ang = a * (Math.PI / 4);
                        const rad = 10 + Math.sin(now * 0.006 + a * 1.8) * 2.5;
                        const hx = Math.cos(ang) * rad;
                        const hy = Math.sin(ang) * rad;
                        if (a === 0) this.ctx.moveTo(hx, hy);
                        else this.ctx.lineTo(hx, hy);
                    }
                    this.ctx.closePath();
                    this.ctx.fill();
                    this.ctx.strokeStyle = 'rgba(186, 230, 253, 0.7)';
                    this.ctx.lineWidth = 1.3;
                    this.ctx.stroke();
                    // Dense glowing aqua center
                    this.ctx.fillStyle = '#38bdf8';
                    this.ctx.beginPath();
                    this.ctx.arc(0, 0, 5, 0, Math.PI * 2);
                    this.ctx.fill();
                    this.ctx.fillStyle = '#ffffff';
                    this.ctx.beginPath();
                    this.ctx.arc(0, 0, 2.2, 0, Math.PI * 2);
                    this.ctx.fill();
                    this.ctx.restore();

                    // 2. Four High-Velocity Water Jet Conduits from Perimeter Spires to Center
                    const conduitOffsets = [
                        { x: -24, y: -24 }, { x: 24, y: -24 },
                        { x: -24, y: 24 }, { x: 24, y: 24 }
                    ];
                    conduitOffsets.forEach((sp, idx) => {
                        const flowProg = ((now * 0.0025 + idx * 0.25) % 1);
                        const fx = sp.x * (1 - flowProg);
                        const fy = sp.y * (1 - flowProg) + hydroBob * flowProg;
                        this.ctx.fillStyle = '#bae6fd';
                        this.ctx.beginPath();
                        this.ctx.arc(fx, fy, 2.2, 0, Math.PI * 2);
                        this.ctx.fill();
                    });
                }

                // Pressurized hydraulic wave discharge
                if (flash > 0) {
                    // Sweeping crescent surge shockwave
                    const surgeDist = (1 - recoil) * 22;
                    const surgeAlpha = flash * 0.85;
                    this.ctx.save();
                    this.ctx.strokeStyle = tier === 3 ? `rgba(125, 211, 252, ${surgeAlpha})` : `rgba(56, 189, 248, ${surgeAlpha})`;
                    this.ctx.lineWidth = 3;
                    this.ctx.beginPath();
                    this.ctx.ellipse(tipDist + surgeDist, 0, 7 + surgeDist * 0.45, 6 + surgeDist * 0.55, 0, -Math.PI * 0.45, Math.PI * 0.45);
                    this.ctx.stroke();
                    this.ctx.restore();

                    // Frothing cyan/white crest starburst
                    this.ctx.fillStyle = tier === 3 ? `rgba(186, 230, 253, ${flash})` : `rgba(56, 189, 248, ${flash})`;
                    this.ctx.beginPath();
                    this.ctx.ellipse(tipDist + 4, 0, 12 * flash, 6 * flash, 0, 0, Math.PI * 2);
                    this.ctx.fill();

                    // Pure white foaming crest core
                    this.ctx.fillStyle = '#ffffff';
                    this.ctx.beginPath();
                    this.ctx.arc(tipDist + 2, 0, 3.4 * flash, 0, Math.PI * 2);
                    this.ctx.fill();

                    // Tier 2 & 3: Dual swirling vortex ripples
                    if (tier >= 2) {
                        [-14, 14].forEach(offsetY => {
                            this.ctx.fillStyle = `rgba(56, 189, 248, ${flash * 0.85})`;
                            this.ctx.beginPath();
                            this.ctx.arc(4, offsetY, 3.0 * flash, 0, Math.PI * 2);
                            this.ctx.fill();
                        });
                    }

                    // Tier 3: Leviathan abyssal surge jets
                    if (tier === 3 && flash > 0.1) {
                        this.ctx.strokeStyle = `rgba(147, 197, 253, ${flash * 0.9})`;
                        this.ctx.lineWidth = 2;
                        [-22, 22].forEach(offsetY => {
                            this.ctx.beginPath();
                            this.ctx.moveTo(0, offsetY);
                            this.ctx.quadraticCurveTo(tipDist * 0.7, offsetY * 0.5, tipDist, 0);
                            this.ctx.stroke();
                        });
                    }
                }

            } else {
                // Procedural Rendering (Enlarged scale across all tower archetypes)
                if (tower.type === 'archer') {
                    if (tower.level === 1) {
                        // Mossy square stone dais
                        this.ctx.fillStyle = '#334155';
                        this.ctx.fillRect(tower.x - 26, tower.y - 26, 52, 52);
                        this.ctx.strokeStyle = '#1e293b';
                        this.ctx.lineWidth = 2.5;
                        this.ctx.strokeRect(tower.x - 26, tower.y - 26, 52, 52);
                        this.ctx.fillStyle = '#15803d';
                        this.ctx.beginPath();
                        this.ctx.arc(tower.x - 18, tower.y - 18, 7, 0, Math.PI * 2);
                        this.ctx.arc(tower.x + 18, tower.y + 18, 8, 0, Math.PI * 2);
                        this.ctx.fill();
                        this.ctx.fillStyle = '#78350f';
                        this.ctx.beginPath();
                        this.ctx.arc(tower.x, tower.y, 20, 0, Math.PI * 2);
                        this.ctx.fill();
                    } else if (tower.level === 2) {
                        // Jade carved stepped pedestal
                        this.ctx.fillStyle = '#064e3b';
                        this.ctx.beginPath();
                        this.ctx.arc(tower.x, tower.y, 32, 0, Math.PI * 2);
                        this.ctx.fill();
                        this.ctx.strokeStyle = '#059669';
                        this.ctx.lineWidth = 3;
                        this.ctx.stroke();
                        this.ctx.fillStyle = '#047857';
                        this.ctx.beginPath();
                        this.ctx.arc(tower.x, tower.y, 25, 0, Math.PI * 2);
                        this.ctx.fill();
                        this.ctx.strokeStyle = '#b45309';
                        this.ctx.lineWidth = 2;
                        this.ctx.setLineDash([5, 7]);
                        this.ctx.beginPath();
                        this.ctx.arc(tower.x, tower.y, 29, 0, Math.PI * 2);
                        this.ctx.stroke();
                        this.ctx.setLineDash([]);
                    } else {
                        // Tier 3: Ancient runic sanctuary platform
                        this.ctx.fillStyle = '#064e3b';
                        this.ctx.beginPath();
                        this.ctx.arc(tower.x, tower.y, 36, 0, Math.PI * 2);
                        this.ctx.fill();
                        this.ctx.strokeStyle = '#34d399';
                        this.ctx.lineWidth = 3;
                        this.ctx.stroke();
                        const floorPulse = 0.5 + 0.3 * Math.sin(performance.now() * 0.003);
                        this.ctx.strokeStyle = `rgba(52, 211, 153, ${floorPulse})`;
                        this.ctx.lineWidth = 2;
                        this.ctx.beginPath();
                        this.ctx.arc(tower.x, tower.y, 27, 0, Math.PI * 2);
                        this.ctx.stroke();
                        this.ctx.fillStyle = '#022c22';
                        this.ctx.beginPath();
                        this.ctx.arc(tower.x, tower.y, 22, 0, Math.PI * 2);
                        this.ctx.fill();
                    }
                } else {
                    // Non-archer base pedestal (Enlarged to 33px)
                    this.ctx.fillStyle = '#0f172a';
                    this.ctx.beginPath();
                    this.ctx.arc(tower.x, tower.y, 33, 0, Math.PI * 2);
                    this.ctx.fill();
                    this.ctx.fillStyle = tower.color;
                    this.ctx.beginPath();
                    this.ctx.arc(tower.x, tower.y, 26, 0, Math.PI * 2);
                    this.ctx.fill();
                }

                // Turret / Cannon rotation
                this.ctx.translate(tower.x, tower.y);
                this.ctx.rotate(tower.angle);

                if (tower.type === 'archer') {
                    if (tower.level === 1) {
                        this.ctx.fillStyle = '#78350f';
                        this.ctx.fillRect(-16, -16, 32, 32);
                        this.ctx.strokeStyle = '#451a03';
                        this.ctx.lineWidth = 2;
                        this.ctx.strokeRect(-16, -16, 32, 32);
                        this.ctx.fillStyle = '#b45309';
                        this.ctx.beginPath();
                        this.ctx.arc(0, 0, 9, 0, Math.PI * 2);
                        this.ctx.fill();
                        this.ctx.fillStyle = '#92400e';
                        this.ctx.fillRect(kick - 4, -4, 22, 8);
                        this.ctx.strokeStyle = '#d97706';
                        this.ctx.lineWidth = 3.5;
                        this.ctx.beginPath();
                        this.ctx.moveTo(kick + 10, -16);
                        this.ctx.quadraticCurveTo(kick + 18, 0, kick + 10, 16);
                        this.ctx.stroke();
                        this.ctx.fillStyle = '#34d399';
                        this.ctx.fillRect(kick + 6, -2, 16, 4);
                        if (flash > 0) {
                            this.ctx.fillStyle = `rgba(255, 255, 255, ${flash})`;
                            this.ctx.beginPath();
                            this.ctx.arc(kick + 23, 0, 7 * flash, 0, Math.PI * 2);
                            this.ctx.fill();
                        }
                    } else if (tower.level === 2) {
                        this.ctx.fillStyle = '#475569';
                        this.ctx.fillRect(-18, -18, 36, 36);
                        this.ctx.strokeStyle = '#334155';
                        this.ctx.lineWidth = 2.5;
                        this.ctx.strokeRect(-18, -18, 36, 36);
                        this.ctx.fillStyle = '#d97706';
                        this.ctx.beginPath();
                        this.ctx.arc(-7, -9, 5, 0, Math.PI * 2);
                        this.ctx.arc(-7, 9, 5, 0, Math.PI * 2);
                        this.ctx.fill();
                        const alt = (tower.barrelAlt % 2 === 0);
                        const kickTop = (alt ? kick : kick * 0.35);
                        const kickBot = (!alt ? kick : kick * 0.35);
                        this.ctx.fillStyle = '#1e293b';
                        this.ctx.fillRect(kickTop - 3, -8, 28, 6);
                        this.ctx.fillRect(kickBot - 3, 2, 28, 6);
                        this.ctx.strokeStyle = '#94a3b8';
                        this.ctx.lineWidth = 4;
                        this.ctx.beginPath();
                        this.ctx.moveTo(kick + 14, -20);
                        this.ctx.quadraticCurveTo(kick + 24, 0, kick + 14, 20);
                        this.ctx.stroke();
                        this.ctx.fillStyle = '#a3e635';
                        this.ctx.fillRect(kickTop + 22, -7.5, 7, 5);
                        this.ctx.fillRect(kickBot + 22, 2.5, 7, 5);
                        if (flash > 0) {
                            this.ctx.fillStyle = `rgba(250, 204, 21, ${flash})`;
                            this.ctx.beginPath();
                            this.ctx.arc(kick + 29, alt ? -4.5 : 4.5, 9 * flash, 0, Math.PI * 2);
                            this.ctx.fill();
                        }
                    } else {
                        this.ctx.fillStyle = '#1e293b';
                        this.ctx.beginPath();
                        this.ctx.arc(0, 0, 24, 0, Math.PI * 2);
                        this.ctx.fill();
                        this.ctx.strokeStyle = '#059669';
                        this.ctx.lineWidth = 3.5;
                        this.ctx.stroke();
                        const pulse = 0.6 + Math.sin(performance.now() * 0.006) * 0.4;
                        this.ctx.fillStyle = `rgba(52, 211, 153, ${pulse})`;
                        this.ctx.font = 'bold 11px monospace';
                        this.ctx.textAlign = 'center';
                        this.ctx.textBaseline = 'middle';
                        this.ctx.fillText('ᚱ', -14, -14);
                        this.ctx.fillText('ᚲ', 14, -14);
                        this.ctx.fillText('ᚦ', -14, 14);
                        this.ctx.fillText('ᛗ', 14, 14);
                        this.ctx.fillStyle = '#064e3b';
                        this.ctx.fillRect(kick - 8, -7, 34, 14);
                        this.ctx.strokeStyle = '#34d399';
                        this.ctx.lineWidth = 2;
                        this.ctx.strokeRect(kick - 8, -7, 34, 14);
                        this.ctx.strokeStyle = '#10b981';
                        this.ctx.lineWidth = 5;
                        this.ctx.beginPath();
                        this.ctx.moveTo(kick + 16, -28);
                        this.ctx.quadraticCurveTo(kick + 30, 0, kick + 16, 28);
                        this.ctx.stroke();
                        if (recoil < 0.2) {
                            this.ctx.fillStyle = '#34d399';
                            this.ctx.beginPath();
                            this.ctx.moveTo(kick + 36, 0);
                            this.ctx.lineTo(kick + 18, -4);
                            this.ctx.lineTo(kick + 18, 4);
                            this.ctx.closePath();
                            this.ctx.fill();
                        }
                        if (flash > 0) {
                            this.ctx.fillStyle = `rgba(52, 211, 153, ${0.85 * flash})`;
                            this.ctx.beginPath();
                            this.ctx.arc(kick + 34, 0, 13 * flash, 0, Math.PI * 2);
                            this.ctx.fill();
                        }
                    }
                } else if (tower.type === 'cannon') {
                    // Heavy iron barrel with recoil and burning fuse
                    this.ctx.fillStyle = '#1e293b';
                    this.ctx.fillRect(kick - 4, -10, 30, 20);
                    this.ctx.fillStyle = '#f97316';
                    this.ctx.fillRect(kick + 20, -9, 8, 18);
                    // Elevation piston
                    this.ctx.fillStyle = '#64748b';
                    this.ctx.fillRect(kick - 6, -3, 6, 6);
                    // Sputtering fuse spark at rear
                    const fuseSpark = Math.random() < 0.6;
                    if (fuseSpark) {
                        this.ctx.fillStyle = '#fef08a';
                        this.ctx.beginPath();
                        this.ctx.arc(kick - 8, -4, 2, 0, Math.PI * 2);
                        this.ctx.fill();
                    }
                    if (flash > 0) {
                        this.ctx.fillStyle = `rgba(251, 146, 60, ${flash})`;
                        this.ctx.beginPath();
                        this.ctx.arc(kick + 28, 0, 14 * flash, 0, Math.PI * 2);
                        this.ctx.fill();
                    }
                } else if (tower.type === 'frost') {
                    // Hovering sub-zero ice spire with orbiting shards
                    const fBob = Math.sin(now * 0.004) * 2.2;
                    this.ctx.fillStyle = '#e0f2fe';
                    this.ctx.beginPath();
                    this.ctx.moveTo(26, 0);
                    this.ctx.lineTo(0, -12 + fBob);
                    this.ctx.lineTo(0, 12 + fBob);
                    this.ctx.closePath();
                    this.ctx.fill();
                    this.ctx.strokeStyle = '#38bdf8';
                    this.ctx.lineWidth = 1.5;
                    this.ctx.stroke();
                    // 2 Orbiting ice shards
                    for (let s = 0; s < 2; s++) {
                        const sang = now * 0.003 + s * Math.PI;
                        this.ctx.fillStyle = '#bae6fd';
                        this.ctx.beginPath();
                        this.ctx.arc(Math.cos(sang) * 14, Math.sin(sang) * 14, 2.5, 0, Math.PI * 2);
                        this.ctx.fill();
                    }
                } else if (tower.type === 'tesla') {
                    // High-voltage electrode with rotating electron spark
                    this.ctx.fillStyle = '#c084fc';
                    this.ctx.beginPath();
                    this.ctx.arc(10, 0, 10, 0, Math.PI * 2);
                    this.ctx.fill();
                    this.ctx.strokeStyle = '#e879f9';
                    this.ctx.lineWidth = 2;
                    this.ctx.stroke();
                    // Orbiting electron spark
                    const eang = now * 0.005;
                    this.ctx.fillStyle = '#ffffff';
                    this.ctx.beginPath();
                    this.ctx.arc(10 + Math.cos(eang) * 16, Math.sin(eang) * 16, 2.2, 0, Math.PI * 2);
                    this.ctx.fill();
                } else if (tower.type === 'flame') {
                    // Thermal barrel with fluctuating pilot flame
                    this.ctx.fillStyle = '#ef4444';
                    this.ctx.fillRect(0, -7, 26, 14);
                    this.ctx.fillStyle = '#fbbf24';
                    this.ctx.beginPath();
                    this.ctx.arc(26, 0, 7, 0, Math.PI * 2);
                    this.ctx.fill();
                    // Fluctuating pilot flame tip
                    const fTip = 4 + Math.sin(now * 0.008) * 3;
                    this.ctx.fillStyle = 'rgba(251, 146, 60, 0.85)';
                    this.ctx.beginPath();
                    this.ctx.moveTo(33, -4);
                    this.ctx.lineTo(33 + fTip, 0);
                    this.ctx.lineTo(33, 4);
                    this.ctx.closePath();
                    this.ctx.fill();
                } else if (tower.type === 'wave') {
                    // Hydro accumulator with churning fluid swirl
                    this.ctx.fillStyle = '#0284c7';
                    this.ctx.beginPath();
                    this.ctx.arc(0, 0, 14, 0, Math.PI * 2);
                    this.ctx.fill();
                    this.ctx.fillStyle = '#38bdf8';
                    this.ctx.beginPath();
                    this.ctx.arc(14, 0, 8, 0, Math.PI * 2);
                    this.ctx.fill();
                    // Churning water dot
                    const wProg = (now * 0.004);
                    this.ctx.fillStyle = '#ffffff';
                    this.ctx.beginPath();
                    this.ctx.arc(Math.cos(wProg) * 8, Math.sin(wProg) * 8, 2, 0, Math.PI * 2);
                    this.ctx.fill();
                }
            }

            this.ctx.restore();

            // Level indicators: Crisp 5-pointed golden star marks with contrast outline & specular glint
            const starY = tower.y - (tower.level >= 3 ? 41 : (tower.level === 2 ? 37 : 33));
            const starSpacing = 11;
            const starBob = Math.sin(now * 0.0035) * 0.75;

            for (let l = 0; l < tower.level; l++) {
                const offsetX = (l - (tower.level - 1) / 2) * starSpacing;
                const sx = tower.x + offsetX;
                const sy = starY + starBob;

                // 1. Dark silhouette backdrop for sharp contrast against light snow & dense jungle
                this.drawLevelStar(sx, sy, 5.4, 2.6);
                this.ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
                this.ctx.fill();
                this.ctx.strokeStyle = '#0f172a';
                this.ctx.lineWidth = 1.6;
                this.ctx.stroke();

                // 2. Radiant golden star body
                this.drawLevelStar(sx, sy, 4.4, 2.1);
                this.ctx.fillStyle = tower.level === 3 ? '#f59e0b' : '#fbbf24';
                this.ctx.fill();

                // 3. Specular upper facet glint
                this.ctx.fillStyle = '#fef08a';
                this.ctx.beginPath();
                this.ctx.arc(sx, sy - 1.2, 1.1, 0, Math.PI * 2);
                this.ctx.fill();
            }
        });
    }

    drawRoundedRect(x, y, w, h, r) {
        if (w <= 0 || h <= 0) return;
        r = Math.min(r, w / 2, h / 2);
        this.ctx.beginPath();
        if (typeof this.ctx.roundRect === 'function') {
            this.ctx.roundRect(x, y, w, h, r);
        } else {
            this.ctx.moveTo(x + r, y);
            this.ctx.lineTo(x + w - r, y);
            this.ctx.arcTo(x + w, y, x + w, y + r, r);
            this.ctx.lineTo(x + w, y + h - r);
            this.ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
            this.ctx.lineTo(x + r, y + h);
            this.ctx.arcTo(x, y + h, x, y + h - r, r);
            this.ctx.lineTo(x, y + r);
            this.ctx.arcTo(x, y, x + r, y, r);
            this.ctx.closePath();
        }
    }

    renderCreeps() {
        const now = performance.now();
        const time = (this.gameTime || 0);

        this.creeps.forEach(creep => {
            this.ctx.save();

            const walk = creep.walkTime || 0;
            const isAir = creep.isAir;
            const isBoss = creep.isBoss;
            const hpPercent = Math.max(0, creep.hp / creep.maxHp);
            const ghostHpPercent = Math.max(0, Math.min(1, (creep.ghostHp || creep.hp) / creep.maxHp));

            // =========================================================================
            // 1. GROUND FX LAYER: CONTACT SHADOWS & AURA SEALS
            // =========================================================================
            if (isAir) {
                // High-Altitude Dynamic Aerial Shadow with flight altitude bobbing
                const altBob = Math.sin(walk * 5) * 4;
                const shadowX = creep.x + 8;
                const shadowY = creep.y + 26 + altBob * 0.5;
                const shadowScale = 0.88 - (altBob * 0.02);

                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
                this.ctx.beginPath();
                this.ctx.ellipse(shadowX, shadowY, creep.size * 1.3 * shadowScale, creep.size * 0.5 * shadowScale, 0, 0, Math.PI * 2);
                this.ctx.fill();
            } else if (isBoss) {
                // Colossal Boss Threat Sigil: Rotating archaic arcane danger disc
                const bossRingAng = time * 0.8;
                this.ctx.save();
                this.ctx.translate(creep.x, creep.y + 10);
                this.ctx.scale(1.0, 0.45);

                // Heavy ambient contact shadow core
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
                this.ctx.beginPath();
                this.ctx.arc(0, 0, creep.size * 1.5, 0, Math.PI * 2);
                this.ctx.fill();

                // Outer rotating golden rune boundary
                this.ctx.strokeStyle = 'rgba(245, 158, 11, 0.45)';
                this.ctx.lineWidth = 2.5;
                this.ctx.setLineDash([12, 8, 4, 8]);
                this.ctx.beginPath();
                this.ctx.arc(0, 0, creep.size * 1.85, bossRingAng, bossRingAng + Math.PI * 2);
                this.ctx.stroke();

                // Inner pulsing threat ring
                const bPulse = 0.85 + Math.sin(time * 3) * 0.15;
                this.ctx.strokeStyle = `rgba(239, 68, 68, ${0.35 * bPulse})`;
                this.ctx.lineWidth = 1.5;
                this.ctx.setLineDash([6, 6]);
                this.ctx.beginPath();
                this.ctx.arc(0, 0, creep.size * 1.35 * bPulse, -bossRingAng, -bossRingAng + Math.PI * 2);
                this.ctx.stroke();

                this.ctx.restore();
            } else {
                // Ground Unit Contact Shadow with step cadence compression
                const stepBob = Math.abs(Math.sin(walk * 8));
                const shadowScale = 1.0 - stepBob * 0.12;

                // Soft outer ambient shadow
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.20)';
                this.ctx.beginPath();
                this.ctx.ellipse(creep.x, creep.y + 8, creep.size * 1.3 * shadowScale, creep.size * 0.55 * shadowScale, 0, 0, Math.PI * 2);
                this.ctx.fill();

                // Core contact shadow under feet
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.38)';
                this.ctx.beginPath();
                this.ctx.ellipse(creep.x, creep.y + 7, creep.size * 0.95 * shadowScale, creep.size * 0.38 * shadowScale, 0, 0, Math.PI * 2);
                this.ctx.fill();
            }

            // Occult Caster Halos (Shaman & Frost Witch)
            if (creep.type === 'shaman') {
                // Revolving druidic healing seal
                const sAng = time * 1.2;
                this.ctx.save();
                this.ctx.translate(creep.x, creep.y + 6);
                this.ctx.scale(1.0, 0.45);
                this.ctx.strokeStyle = 'rgba(52, 211, 153, 0.4)';
                this.ctx.lineWidth = 1.8;
                this.ctx.setLineDash([8, 6]);
                this.ctx.beginPath();
                this.ctx.arc(0, 0, creep.size * 1.5, sAng, sAng + Math.PI * 2);
                this.ctx.stroke();
                this.ctx.restore();
            } else if (creep.type === 'frost_witch') {
                // Revolving rime frost seal
                const wAng = -time * 1.2;
                this.ctx.save();
                this.ctx.translate(creep.x, creep.y + 6);
                this.ctx.scale(1.0, 0.45);
                this.ctx.strokeStyle = 'rgba(129, 140, 248, 0.4)';
                this.ctx.lineWidth = 1.8;
                this.ctx.setLineDash([10, 5, 2, 5]);
                this.ctx.beginPath();
                this.ctx.arc(0, 0, creep.size * 1.5, wAng, wAng + Math.PI * 2);
                this.ctx.stroke();
                this.ctx.restore();
            }

            // =========================================================================
            // 2. STATUS EFFECT AURAS: FROST PRISM, FLAMES, SHIELDS & ICE ORBS
            // =========================================================================

            // A. Chilled / Slow Status: 4 revolving glacial diamond crystals
            if (creep.slowTime > 0 && creep.frozenTime <= 0) {
                this.ctx.save();
                const orbTime = now * 0.0035;
                const orbDist = creep.size + 9;

                this.ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
                this.ctx.lineWidth = 1.2;
                this.ctx.beginPath();
                this.ctx.arc(creep.x, creep.y, orbDist, 0, Math.PI * 2);
                this.ctx.stroke();

                for (let o = 0; o < 4; o++) {
                    const oAng = orbTime + (o * Math.PI / 2);
                    const ox = creep.x + Math.cos(oAng) * orbDist;
                    const oy = creep.y + Math.sin(oAng) * orbDist;

                    // Diamond ice crystal
                    this.ctx.fillStyle = (o % 2 === 0) ? '#67e8f9' : '#bae6fd';
                    this.ctx.beginPath();
                    this.ctx.moveTo(ox, oy - 4);
                    this.ctx.lineTo(ox + 3, oy);
                    this.ctx.lineTo(ox, oy + 4);
                    this.ctx.lineTo(ox - 3, oy);
                    this.ctx.closePath();
                    this.ctx.fill();
                }
                this.ctx.restore();
            }

            // B. Burning Status (DoT): Dynamic animated flame tongues & fiery glow
            if (creep.burnTime > 0) {
                this.ctx.save();
                const fTime = now * 0.012;
                // Fiery ground reflection
                const fireGrad = this.ctx.createRadialGradient(creep.x, creep.y, 2, creep.x, creep.y, creep.size + 10);
                fireGrad.addColorStop(0, 'rgba(249, 115, 22, 0.45)');
                fireGrad.addColorStop(0.7, 'rgba(239, 68, 68, 0.20)');
                fireGrad.addColorStop(1, 'transparent');
                this.ctx.fillStyle = fireGrad;
                this.ctx.beginPath();
                this.ctx.arc(creep.x, creep.y, creep.size + 10, 0, Math.PI * 2);
                this.ctx.fill();

                // 5 Procedural flickering flame tongues licking upwards
                const flameCount = 5;
                for (let f = 0; f < flameCount; f++) {
                    const fOffset = (f - (flameCount - 1) / 2) * (creep.size * 0.45);
                    const fHeight = 8 + Math.sin(fTime + f * 1.7) * 5;
                    const fx = creep.x + fOffset;
                    const fy = creep.y + creep.size * 0.3;

                    this.ctx.fillStyle = (f % 2 === 0) ? '#ea580c' : '#f59e0b';
                    this.ctx.beginPath();
                    this.ctx.moveTo(fx - 3.5, fy);
                    this.ctx.quadraticCurveTo(fx - 1, fy - fHeight * 0.6, fx, fy - fHeight);
                    this.ctx.quadraticCurveTo(fx + 1, fy - fHeight * 0.6, fx + 3.5, fy);
                    this.ctx.closePath();
                    this.ctx.fill();

                    // Incandescent flame tip spark
                    this.ctx.fillStyle = '#fef08a';
                    this.ctx.beginPath();
                    this.ctx.arc(fx, fy - fHeight * 0.75, 1.4, 0, Math.PI * 2);
                    this.ctx.fill();
                }
                this.ctx.restore();
            }

            // C. Energy Shield Dome: Shimmering hexagonal forcefield
            if (creep.shield > 0) {
                this.ctx.save();
                const sRadius = creep.size + 10;

                // Forcefield translucent volume
                const sGrad = this.ctx.createRadialGradient(creep.x, creep.y, sRadius * 0.3, creep.x, creep.y, sRadius);
                sGrad.addColorStop(0, 'rgba(96, 165, 250, 0.08)');
                sGrad.addColorStop(0.75, 'rgba(56, 189, 248, 0.22)');
                sGrad.addColorStop(1, 'rgba(147, 197, 253, 0.45)');
                this.ctx.fillStyle = sGrad;
                this.ctx.beginPath();
                this.ctx.arc(creep.x, creep.y, sRadius, 0, Math.PI * 2);
                this.ctx.fill();

                // Electric shield rim with rotating breaks
                const sRot = now * 0.003;
                this.ctx.strokeStyle = '#60a5fa';
                this.ctx.lineWidth = 2.4;
                this.ctx.setLineDash([16, 8]);
                this.ctx.beginPath();
                this.ctx.arc(creep.x, creep.y, sRadius, sRot, sRot + Math.PI * 2);
                this.ctx.stroke();

                // Specular glint arc
                this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
                this.ctx.lineWidth = 1.6;
                this.ctx.setLineDash([]);
                this.ctx.beginPath();
                this.ctx.arc(creep.x, creep.y, sRadius - 1.5, -Math.PI * 0.75, -Math.PI * 0.35);
                this.ctx.stroke();
                this.ctx.restore();
            }

            // =========================================================================
            // 3. ANIMATED UNIT SPRITE (DIRECTIONAL BANKING, LOCOMOTION & HIT FLASH)
            // =========================================================================
            this.ctx.save();
            // Apply coordinates with tactile stagger kickback
            const renderX = creep.x + (creep.staggerX || 0);
            const renderY = creep.y + (creep.staggerY || 0);
            this.ctx.translate(renderX, renderY);

            // Dynamic rotation with organic corner banking
            const totalAngle = (creep.angle || 0) + (creep.tiltAngle || 0);
            this.ctx.rotate(totalAngle);

            // Tailored movement dynamics per enemy class
            if (isAir) {
                // Canopy Drake & Blizzard Wyvern: High-speed wing-flapping & altitude sinewave
                const flap = 1.0 + Math.sin(walk * 15) * 0.20;
                const hoverY = Math.sin(walk * 5) * 3.5;
                this.ctx.translate(0, hoverY);
                this.ctx.scale(1.0, flap);
            } else if (isBoss) {
                // Ancient Jungle Titan & Glacial Behemoth: Colossal impact cadence
                const sway = Math.sin(walk * 4.2) * 0.08;
                const bob = 1.0 + Math.abs(Math.sin(walk * 4.2)) * 0.08;
                this.ctx.rotate(sway);
                this.ctx.scale(bob, 2 - bob);
            } else if (creep.type === 'crawler' || creep.type === 'scout') {
                // Venom Crawler & Jungle Scout: Aggressive low-slung sprint & rapid leg scuttle
                const scuttle = Math.sin(walk * 15) * 0.12;
                const stretch = 1.0 + Math.sin(walk * 15) * 0.09;
                this.ctx.rotate(scuttle);
                this.ctx.scale(stretch, 2 - stretch);
            } else if (creep.type === 'shaman' || creep.type === 'frost_witch') {
                // Mystical hover levitation with subtle breathing pulse
                const hover = Math.sin(walk * 3.6) * 3.2;
                this.ctx.translate(0, hover);
                const breathe = 1.0 + Math.sin(creep.breathTimer || 0) * 0.035;
                this.ctx.scale(breathe, breathe);
            } else {
                // Heavy Beasts (Wolf, Gorilla, Revenant, Yeti): Bounding quadrupedal stride
                const lope = Math.sin(walk * 7.5) * 0.13;
                const squash = 1.0 + Math.abs(Math.sin(walk * 7.5)) * 0.11;
                this.ctx.rotate(lope);
                this.ctx.scale(squash, 2 - squash);
            }

            const sprite = this.enemySprites ? this.enemySprites[creep.type] : null;
            const spriteScaleMultiplier = isBoss ? 2.5 : (isAir ? 2.25 : 2.05);
            const spriteSize = creep.size * spriteScaleMultiplier;

            if (sprite && sprite.complete && sprite.naturalWidth > 0) {
                // Crisp directional ambient drop-shadow behind sprite
                this.ctx.save();
                this.ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
                this.ctx.shadowBlur = 6;
                this.ctx.shadowOffsetY = 2;
                this.ctx.drawImage(sprite, -spriteSize, -spriteSize, spriteSize * 2, spriteSize * 2);
                this.ctx.restore();

                // HIT-FLASH REACTION: Luminous white flash silhouette on damage
                if (creep.hitFlash > 0) {
                    const flashOpacity = Math.min(1, creep.hitFlash / 0.18);
                    this.ctx.save();
                    this.ctx.globalAlpha = flashOpacity * 0.85;
                    this.ctx.filter = 'brightness(3.0) contrast(1.5)';
                    this.ctx.drawImage(sprite, -spriteSize, -spriteSize, spriteSize * 2, spriteSize * 2);
                    this.ctx.restore();
                }
            } else {
                // High-fidelity procedural avatar fallback
                this.ctx.fillStyle = creep.color;
                this.ctx.beginPath();
                this.ctx.arc(0, 0, creep.size, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.strokeStyle = '#0f172a';
                this.ctx.lineWidth = 2;
                this.ctx.stroke();

                // Eyes facing forward (+X)
                this.ctx.fillStyle = '#fef08a';
                this.ctx.beginPath();
                this.ctx.arc(creep.size * 0.45, -creep.size * 0.25, 3.2, 0, Math.PI * 2);
                this.ctx.arc(creep.size * 0.45, creep.size * 0.25, 3.2, 0, Math.PI * 2);
                this.ctx.fill();
            }

            this.ctx.restore();

            // D. Frozen Ice Crystal Tomb (Rendered on top of the frozen unit)
            if (creep.frozenTime > 0) {
                this.ctx.save();
                this.ctx.translate(creep.x, creep.y);
                const fPulse = 0.95 + Math.sin(now * 0.006) * 0.05;
                const fSize = (creep.size + 10) * fPulse;

                // 1. Frosted cryogenic ice block volume
                const iceGrad = this.ctx.createRadialGradient(0, 0, fSize * 0.2, 0, 0, fSize);
                iceGrad.addColorStop(0, 'rgba(224, 242, 254, 0.7)');
                iceGrad.addColorStop(0.65, 'rgba(147, 197, 253, 0.55)');
                iceGrad.addColorStop(1, 'rgba(56, 189, 248, 0.85)');
                this.ctx.fillStyle = iceGrad;

                // 2. Faceted Ice Diamond Polygon
                this.ctx.beginPath();
                this.ctx.moveTo(0, -fSize * 1.15);
                this.ctx.lineTo(fSize * 0.95, -fSize * 0.45);
                this.ctx.lineTo(fSize * 0.8, fSize * 0.75);
                this.ctx.lineTo(0, fSize * 1.15);
                this.ctx.lineTo(-fSize * 0.8, fSize * 0.75);
                this.ctx.lineTo(-fSize * 0.95, -fSize * 0.45);
                this.ctx.closePath();
                this.ctx.fill();

                this.ctx.strokeStyle = '#bae6fd';
                this.ctx.lineWidth = 2.2;
                this.ctx.stroke();

                // 3. Crisp interior crystalline facet reflections
                this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
                this.ctx.lineWidth = 1.4;
                this.ctx.beginPath();
                this.ctx.moveTo(0, -fSize * 1.15);
                this.ctx.lineTo(0, fSize * 1.15);
                this.ctx.moveTo(-fSize * 0.95, -fSize * 0.45);
                this.ctx.lineTo(fSize * 0.95, -fSize * 0.45);
                this.ctx.stroke();

                this.ctx.restore();
            }

            // =========================================================================
            // 4. TACTICAL HEALTH PLATE & STATUS BADGES (ULTRA-SLEEK MODERN HUD)
            // =========================================================================
            this.ctx.save();

            const barW = Math.max(34, creep.size * 2.5);
            const barH = isBoss ? 8 : 5.5;
            const barX = creep.x - barW / 2;
            const barY = creep.y - creep.size - (isBoss ? 22 : 14);

            // Subtle adaptive opacity: full opacity when damaged or boss, subtle when full HP
            if (hpPercent < 0.99 || isBoss || creep.hitFlash > 0 || creep.frozenTime > 0 || creep.slowTime > 0 || creep.burnTime > 0 || creep.shield > 0) {
                this.ctx.globalAlpha = 1.0;
            } else {
                this.ctx.globalAlpha = 0.65;
            }

            // A. Pill Backdrop Glass Capsule
            this.ctx.fillStyle = 'rgba(8, 12, 20, 0.88)';
            this.ctx.strokeStyle = isBoss ? 'rgba(245, 158, 11, 0.8)' : 'rgba(255, 255, 255, 0.20)';
            this.ctx.lineWidth = isBoss ? 1.5 : 1.0;

            const pillRadius = barH / 2 + 1;
            this.drawRoundedRect(barX - 1.5, barY - 1.5, barW + 3, barH + 3, pillRadius);
            this.ctx.fill();
            this.ctx.stroke();

            // B. Lagging Ghost Damage Bar (Smoothly catches up to show recent damage chunk)
            if (ghostHpPercent > hpPercent) {
                this.ctx.fillStyle = '#fef08a';
                this.drawRoundedRect(barX, barY, barW * ghostHpPercent, barH, barH / 2);
                this.ctx.fill();
            }

            // C. Current Health Bar with Dynamic Gradient
            if (hpPercent > 0) {
                const hpGrad = this.ctx.createLinearGradient(barX, barY, barX + barW * hpPercent, barY);
                if (isBoss) {
                    hpGrad.addColorStop(0, '#f59e0b');
                    hpGrad.addColorStop(1, '#fbbf24');
                } else if (hpPercent > 0.5) {
                    hpGrad.addColorStop(0, '#10b981');
                    hpGrad.addColorStop(1, '#34d399');
                } else if (hpPercent > 0.25) {
                    hpGrad.addColorStop(0, '#f59e0b');
                    hpGrad.addColorStop(1, '#fde047');
                } else {
                    hpGrad.addColorStop(0, '#dc2626');
                    hpGrad.addColorStop(1, '#f87171');
                }

                this.ctx.fillStyle = hpGrad;
                this.drawRoundedRect(barX, barY, barW * hpPercent, barH, barH / 2);
                this.ctx.fill();

                // Specular upper gloss line
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
                this.ctx.fillRect(barX + 2, barY + 1, Math.max(0, barW * hpPercent - 4), 1.2);
            }

            // D. Overlaid Electric Shield Bar
            if (creep.shield > 0) {
                const shieldPercent = Math.min(1.0, creep.shield / 250);
                const shieldGrad = this.ctx.createLinearGradient(barX, barY, barX + barW * shieldPercent, barY);
                shieldGrad.addColorStop(0, 'rgba(56, 189, 248, 0.85)');
                shieldGrad.addColorStop(1, '#60a5fa');
                this.ctx.fillStyle = shieldGrad;
                this.drawRoundedRect(barX, barY, barW * shieldPercent, barH, barH / 2);
                this.ctx.fill();
            }

            // E. Segmented Phase Notches for Bosses
            if (isBoss) {
                this.ctx.strokeStyle = 'rgba(15, 23, 42, 0.8)';
                this.ctx.lineWidth = 1.5;
                for (let n = 1; n < 4; n++) {
                    const nx = barX + (barW * (n / 4));
                    this.ctx.beginPath();
                    this.ctx.moveTo(nx, barY);
                    this.ctx.lineTo(nx, barY + barH);
                    this.ctx.stroke();
                }
            }

            // F. Tactical Armor Badge (Displays armor percentage on armored units)
            if (creep.armor > 0) {
                this.ctx.font = '900 7.5px sans-serif';
                this.ctx.fillStyle = '#cbd5e1';
                this.ctx.textAlign = 'right';
                this.ctx.fillText(`🛡️${Math.round(creep.armor * 100)}%`, barX - 3, barY + barH - 1);
            }

            // G. Status Effect Micro-Chips (Burn, Freeze, Slow, Shield)
            let chipX = barX + barW + 4;
            this.ctx.font = '900 8px sans-serif';
            this.ctx.textAlign = 'left';

            if (creep.burnTime > 0) {
                this.ctx.fillText('🔥', chipX, barY + barH);
                chipX += 11;
            }
            if (creep.frozenTime > 0) {
                this.ctx.fillText('❄️', chipX, barY + barH);
                chipX += 11;
            } else if (creep.slowTime > 0) {
                this.ctx.fillText('🧊', chipX, barY + barH);
                chipX += 11;
            }
            if (creep.shield > 0) {
                this.ctx.fillText('🛡️', chipX, barY + barH);
                chipX += 11;
            }

            // H. Boss Epic Plate: Royal Crest, Name & Numerical HP
            if (isBoss) {
                // Glowing text shadow
                this.ctx.save();
                this.ctx.font = 'bold 10px sans-serif';
                this.ctx.fillStyle = '#fbbf24';
                this.ctx.shadowColor = 'rgba(245, 158, 11, 0.8)';
                this.ctx.shadowBlur = 6;
                this.ctx.textAlign = 'center';
                this.ctx.fillText(`👑 ${creep.name.toUpperCase()}`, creep.x, barY - 5);
                this.ctx.restore();

                // Numerical HP below the bar
                this.ctx.font = '800 7.5px monospace';
                this.ctx.fillStyle = '#fde68a';
                this.ctx.textAlign = 'center';
                this.ctx.fillText(`${Math.round(creep.hp)} / ${creep.maxHp}`, creep.x, barY + barH + 9);
            }

            this.ctx.restore();
            this.ctx.restore();
        });
    }

    renderProjectiles() {
        this.projectiles.forEach(p => {
            this.ctx.save();

            if (p.type === 'beam') {
                // =========================================================================
                // SOLAR RAY / SUN GOD RAY: CONCENTRATED THERMAL DEATH BEAM ATTACK ANIMATION
                // =========================================================================
                const tier = (p.tower && p.tower.level) || 1;
                const now = performance.now();
                const jitter = Math.sin(now * 0.035) * (tier === 3 ? 1.5 : 0.8);
                const pulse = 0.8 + 0.2 * Math.sin(now * 0.02);

                const tx = p.tower.x;
                const ty = p.tower.y;
                const gx = p.target.x;
                const gy = p.target.y;

                // 1. Broad outer thermal corona & heat shimmer
                const outerWidth = (tier === 3 ? 18 : (tier === 2 ? 14 : 10)) * pulse;
                this.ctx.strokeStyle = tier === 3 ? 'rgba(245, 158, 11, 0.35)' : 'rgba(239, 68, 68, 0.3)';
                this.ctx.lineWidth = outerWidth;
                this.ctx.beginPath();
                this.ctx.moveTo(tx, ty);
                this.ctx.lineTo(gx, gy);
                this.ctx.stroke();

                // 2. Focused solar plasma mid-column
                const midWidth = (tier === 3 ? 8 : (tier === 2 ? 6 : 4.5)) + jitter * 0.5;
                this.ctx.strokeStyle = tier === 3 ? '#fbbf24' : '#f97316';
                this.ctx.lineWidth = midWidth;
                this.ctx.beginPath();
                this.ctx.moveTo(tx, ty);
                this.ctx.lineTo(gx, gy);
                this.ctx.stroke();

                // 3. Incandescent white-hot fusion core
                const coreWidth = (tier === 3 ? 3.5 : (tier === 2 ? 2.5 : 2.0));
                this.ctx.strokeStyle = '#ffffff';
                this.ctx.lineWidth = coreWidth;
                this.ctx.beginPath();
                this.ctx.moveTo(tx, ty);
                this.ctx.lineTo(gx, gy);
                this.ctx.stroke();

                // 4. Optical collimator source flare at tower aperture
                this.ctx.fillStyle = '#ffffff';
                this.ctx.beginPath();
                this.ctx.arc(tx, ty, tier === 3 ? 6 : 4.5, 0, Math.PI * 2);
                this.ctx.fill();

                this.ctx.fillStyle = tier === 3 ? 'rgba(251, 191, 36, 0.8)' : 'rgba(249, 115, 22, 0.7)';
                this.ctx.beginPath();
                this.ctx.arc(tx, ty, (tier === 3 ? 14 : 10) * pulse, 0, Math.PI * 2);
                this.ctx.fill();

                // 5. Target focal melt splash at creep contact point
                this.ctx.fillStyle = tier === 3 ? '#fde047' : '#ea580c';
                this.ctx.beginPath();
                this.ctx.arc(gx, gy, (tier === 3 ? 12 : 8) * pulse, 0, Math.PI * 2);
                this.ctx.fill();

                this.ctx.fillStyle = '#ffffff';
                this.ctx.beginPath();
                this.ctx.arc(gx, gy, tier === 3 ? 4 : 2.5, 0, Math.PI * 2);
                this.ctx.fill();

                // Tier 3: Golden helix arcs wrapping around the beam
                if (tier === 3) {
                    const dist = Math.hypot(gx - tx, gy - ty);
                    const beamAngle = Math.atan2(gy - ty, gx - tx);
                    const steps = Math.floor(dist / 14);
                    this.ctx.strokeStyle = 'rgba(254, 240, 138, 0.7)';
                    this.ctx.lineWidth = 1.6;
                    this.ctx.beginPath();
                    for (let s = 0; s <= steps; s++) {
                        const t = s / steps;
                        const bx = tx + (gx - tx) * t;
                        const by = ty + (gy - ty) * t;
                        const wave = Math.sin(t * Math.PI * 6 + now * 0.015) * 5;
                        const px = bx + Math.cos(beamAngle + Math.PI / 2) * wave;
                        const py = by + Math.sin(beamAngle + Math.PI / 2) * wave;
                        if (s === 0) this.ctx.moveTo(px, py);
                        else this.ctx.lineTo(px, py);
                    }
                    this.ctx.stroke();
                }
            } else if (p.type === 'arrow') {
                const angle = p.angle !== undefined ? p.angle : (p.target ? Math.atan2(p.target.y - p.y, p.target.x - p.x) : 0);
                this.ctx.translate(p.x, p.y);
                this.ctx.rotate(angle);

                const lvl = p.level || (p.damage >= 100 ? 3 : (p.damage >= 40 ? 2 : 1));

                if (lvl === 3) {
                    // TIER 3: Heavy Runic Siege Ballista Bolt
                    // Arcane plasma glow sheath
                    this.ctx.shadowColor = '#10b981';
                    this.ctx.shadowBlur = 10;

                    // Heavy iron rail bolt shaft
                    this.ctx.fillStyle = '#1e293b';
                    this.ctx.fillRect(-14, -2.5, 20, 5);

                    // Central glowing runic channel
                    this.ctx.fillStyle = '#34d399';
                    this.ctx.fillRect(-12, -0.9, 16, 1.8);

                    // Bodkin diamond arrowhead
                    this.ctx.fillStyle = '#f1f5f9';
                    this.ctx.beginPath();
                    this.ctx.moveTo(6, -4.5);
                    this.ctx.lineTo(16, 0);
                    this.ctx.lineTo(6, 4.5);
                    this.ctx.lineTo(8.5, 0);
                    this.ctx.closePath();
                    this.ctx.fill();

                    // Plasma core on arrowhead
                    this.ctx.fillStyle = '#6ee7b7';
                    this.ctx.beginPath();
                    this.ctx.moveTo(9, -2);
                    this.ctx.lineTo(16, 0);
                    this.ctx.lineTo(9, 2);
                    this.ctx.closePath();
                    this.ctx.fill();

                    // Quad swept stabilizer fins
                    this.ctx.fillStyle = '#059669';
                    this.ctx.beginPath();
                    this.ctx.moveTo(-10, -2.5);
                    this.ctx.lineTo(-16, -7);
                    this.ctx.lineTo(-13, -2.5);
                    this.ctx.closePath();
                    this.ctx.fill();

                    this.ctx.beginPath();
                    this.ctx.moveTo(-10, 2.5);
                    this.ctx.lineTo(-16, 7);
                    this.ctx.lineTo(-13, 2.5);
                    this.ctx.closePath();
                    this.ctx.fill();

                } else if (lvl === 2) {
                    // TIER 2: High-Velocity Toxic Jade Needle
                    this.ctx.shadowColor = '#84cc16';
                    this.ctx.shadowBlur = 7;

                    // Slender jade shaft
                    this.ctx.fillStyle = '#15803d';
                    this.ctx.fillRect(-11, -1.5, 17, 3);

                    // Luminous venom core
                    this.ctx.fillStyle = '#a3e635';
                    this.ctx.fillRect(-9, -0.6, 14, 1.2);

                    // Razor barbed needle tip
                    this.ctx.fillStyle = '#d9f99d';
                    this.ctx.beginPath();
                    this.ctx.moveTo(6, -3);
                    this.ctx.lineTo(13, 0);
                    this.ctx.lineTo(6, 3);
                    this.ctx.lineTo(7.5, 0);
                    this.ctx.closePath();
                    this.ctx.fill();

                    // Brass stabilizer fin vanes
                    this.ctx.fillStyle = '#eab308';
                    this.ctx.beginPath();
                    this.ctx.moveTo(-7, -1.5);
                    this.ctx.lineTo(-13, -4.5);
                    this.ctx.lineTo(-10, -1.5);
                    this.ctx.closePath();
                    this.ctx.fill();

                    this.ctx.beginPath();
                    this.ctx.moveTo(-7, 1.5);
                    this.ctx.lineTo(-13, 4.5);
                    this.ctx.lineTo(-10, 1.5);
                    this.ctx.closePath();
                    this.ctx.fill();

                } else {
                    // TIER 1: Standard Hunting Dart / Crossbow Bolt
                    // Polished hardwood shaft
                    this.ctx.fillStyle = '#78350f';
                    this.ctx.fillRect(-9, -1.4, 14, 2.8);

                    // Steel bodkin arrowhead
                    this.ctx.fillStyle = '#cbd5e1';
                    this.ctx.beginPath();
                    this.ctx.moveTo(5, -2.8);
                    this.ctx.lineTo(12, 0);
                    this.ctx.lineTo(5, 2.8);
                    this.ctx.lineTo(6.5, 0);
                    this.ctx.closePath();
                    this.ctx.fill();

                    // Specular highlight on bodkin
                    this.ctx.fillStyle = '#ffffff';
                    this.ctx.beginPath();
                    this.ctx.moveTo(6, -1);
                    this.ctx.lineTo(11, 0);
                    this.ctx.lineTo(6, 0);
                    this.ctx.closePath();
                    this.ctx.fill();

                    // White feather fletchings
                    this.ctx.fillStyle = '#f8fafc';
                    this.ctx.beginPath();
                    this.ctx.moveTo(-5, -1.4);
                    this.ctx.lineTo(-10, -4);
                    this.ctx.lineTo(-8, -1.4);
                    this.ctx.closePath();
                    this.ctx.fill();

                    this.ctx.beginPath();
                    this.ctx.moveTo(-5, 1.4);
                    this.ctx.lineTo(-10, 4);
                    this.ctx.lineTo(-8, 1.4);
                    this.ctx.closePath();
                    this.ctx.fill();
                }
            } else if (p.type === 'bomb') {
                const angle = p.angle !== undefined ? p.angle : (p.target ? Math.atan2(p.target.y - p.y, p.target.x - p.x) : 0);
                const lvl = p.level || (p.damage >= 200 ? 3 : (p.damage >= 100 ? 2 : 1));

                if (lvl === 3) {
                    // TIER 3: Molten Volcanic Magma Orb
                    this.ctx.save();
                    this.ctx.shadowColor = '#ea580c';
                    this.ctx.shadowBlur = 12;

                    // Glowing outer volcanic crust
                    this.ctx.fillStyle = '#431407';
                    this.ctx.beginPath();
                    this.ctx.arc(p.x, p.y, 8, 0, Math.PI * 2);
                    this.ctx.fill();

                    // Glowing molten lava core
                    this.ctx.fillStyle = '#ea580c';
                    this.ctx.beginPath();
                    this.ctx.arc(p.x, p.y, 5.5, 0, Math.PI * 2);
                    this.ctx.fill();

                    // White-hot center
                    this.ctx.fillStyle = '#fef08a';
                    this.ctx.beginPath();
                    this.ctx.arc(p.x - 1.5, p.y - 1.5, 3, 0, Math.PI * 2);
                    this.ctx.fill();
                    this.ctx.restore();

                } else if (lvl === 2) {
                    // TIER 2: Heavy Rifled Mortar Shell
                    this.ctx.save();
                    this.ctx.translate(p.x, p.y);
                    this.ctx.rotate(angle);

                    // Elongated mortar projectile
                    this.ctx.fillStyle = '#334155';
                    this.ctx.fillRect(-7, -4, 14, 8);

                    // Copper drive band
                    this.ctx.fillStyle = '#d97706';
                    this.ctx.fillRect(-3, -4.5, 3, 9);

                    // Aerodynamic nose cone
                    this.ctx.fillStyle = '#94a3b8';
                    this.ctx.beginPath();
                    this.ctx.moveTo(7, -4);
                    this.ctx.lineTo(13, 0);
                    this.ctx.lineTo(7, 4);
                    this.ctx.closePath();
                    this.ctx.fill();

                    // Glowing contact fuse
                    this.ctx.fillStyle = '#f97316';
                    this.ctx.beginPath();
                    this.ctx.arc(12, 0, 1.8, 0, Math.PI * 2);
                    this.ctx.fill();
                    this.ctx.restore();

                } else {
                    // TIER 1: Heavy Cast-Iron Cannonball
                    this.ctx.fillStyle = '#1e293b';
                    this.ctx.beginPath();
                    this.ctx.arc(p.x, p.y, 6.5, 0, Math.PI * 2);
                    this.ctx.fill();

                    // Metallic rim highlight
                    this.ctx.fillStyle = '#64748b';
                    this.ctx.beginPath();
                    this.ctx.arc(p.x - 2, p.y - 2, 2.5, 0, Math.PI * 2);
                    this.ctx.fill();

                    // Specular highlight
                    this.ctx.fillStyle = '#ffffff';
                    this.ctx.beginPath();
                    this.ctx.arc(p.x - 2, p.y - 2, 1.2, 0, Math.PI * 2);
                    this.ctx.fill();

                    // Burning powder spark on back
                    this.ctx.fillStyle = '#ea580c';
                    this.ctx.beginPath();
                    this.ctx.arc(p.x + Math.cos(angle + Math.PI) * 4, p.y + Math.sin(angle + Math.PI) * 4, 2, 0, Math.PI * 2);
                    this.ctx.fill();
                }
            } else if (p.type === 'frost_orb') {
                const lvl = p.level || (p.damage >= 70 ? 3 : (p.damage >= 30 ? 2 : 1));
                const angle = p.angle !== undefined ? p.angle : (p.target ? Math.atan2(p.target.y - p.y, p.target.x - p.x) : 0);
                const spin = performance.now() * 0.008;

                this.ctx.translate(p.x, p.y);
                this.ctx.rotate(angle);

                if (lvl === 3) {
                    // TIER 3: Blizzard Sanctum - Faceted Permafrost Core with orbiting ice needles
                    // Outer chill aura
                    this.ctx.fillStyle = 'rgba(56, 189, 248, 0.32)';
                    this.ctx.beginPath();
                    this.ctx.arc(0, 0, 14, 0, Math.PI * 2);
                    this.ctx.fill();

                    // Orbiting satellite ice shards
                    for (let s = 0; s < 3; s++) {
                        const orbAng = spin * 1.6 + (s * Math.PI * 2 / 3);
                        const ox = Math.cos(orbAng) * 9;
                        const oy = Math.sin(orbAng) * 9;
                        this.ctx.fillStyle = '#bae6fd';
                        this.ctx.beginPath();
                        this.ctx.arc(ox, oy, 2, 0, Math.PI * 2);
                        this.ctx.fill();
                    }

                    // Faceted diamond core
                    this.ctx.fillStyle = '#38bdf8';
                    this.ctx.beginPath();
                    this.ctx.moveTo(11, 0);
                    this.ctx.lineTo(0, -6);
                    this.ctx.lineTo(-7, 0);
                    this.ctx.lineTo(0, 6);
                    this.ctx.closePath();
                    this.ctx.fill();
                    this.ctx.strokeStyle = '#bae6fd';
                    this.ctx.lineWidth = 1.2;
                    this.ctx.stroke();

                    // Blinding white inner facet
                    this.ctx.fillStyle = '#ffffff';
                    this.ctx.beginPath();
                    this.ctx.moveTo(7, 0);
                    this.ctx.lineTo(0, -3.5);
                    this.ctx.lineTo(-3, 0);
                    this.ctx.lineTo(0, 3.5);
                    this.ctx.closePath();
                    this.ctx.fill();

                } else if (lvl === 2) {
                    // TIER 2: Glacial Pylon - Rotating Ice Prism with chill glow
                    this.ctx.fillStyle = 'rgba(6, 182, 212, 0.32)';
                    this.ctx.beginPath();
                    this.ctx.arc(0, 0, 10, 0, Math.PI * 2);
                    this.ctx.fill();

                    // Dual elongated crystalline needle
                    this.ctx.fillStyle = '#06b6d4';
                    this.ctx.beginPath();
                    this.ctx.moveTo(9, 0);
                    this.ctx.lineTo(-2, -5);
                    this.ctx.lineTo(-6, 0);
                    this.ctx.lineTo(-2, 5);
                    this.ctx.closePath();
                    this.ctx.fill();
                    this.ctx.strokeStyle = '#67e8f9';
                    this.ctx.lineWidth = 1.2;
                    this.ctx.stroke();

                    // Crystalline spine highlight
                    this.ctx.strokeStyle = '#ffffff';
                    this.ctx.lineWidth = 1.4;
                    this.ctx.beginPath();
                    this.ctx.moveTo(8, 0);
                    this.ctx.lineTo(-4, 0);
                    this.ctx.stroke();

                } else {
                    // TIER 1: Cryo Obelisk - Aerodynamic Ice Shard
                    this.ctx.fillStyle = 'rgba(56, 189, 248, 0.28)';
                    this.ctx.beginPath();
                    this.ctx.arc(0, 0, 7.5, 0, Math.PI * 2);
                    this.ctx.fill();

                    this.ctx.fillStyle = '#67e8f9';
                    this.ctx.beginPath();
                    this.ctx.moveTo(7, 0);
                    this.ctx.lineTo(-2, -3.5);
                    this.ctx.lineTo(-4, 0);
                    this.ctx.lineTo(-2, 3.5);
                    this.ctx.closePath();
                    this.ctx.fill();

                    this.ctx.fillStyle = '#ffffff';
                    this.ctx.beginPath();
                    this.ctx.arc(2, 0, 1.8, 0, Math.PI * 2);
                    this.ctx.fill();
                }
            } else if (p.type === 'tidal_wave') {
                // =========================================================================
                // WAKE SPIRE: SWEEPING HYDRAULIC CRESCENT TIDAL WAVE ATTACK ANIMATION
                // =========================================================================
                const angle = p.angle !== undefined ? p.angle : (p.target ? Math.atan2(p.target.y - p.y, p.target.x - p.x) : 0);
                this.ctx.translate(p.x, p.y);
                this.ctx.rotate(angle);

                const lvl = p.level || 1;
                const now = performance.now();
                const frothPulse = Math.sin(now * 0.02) * 1.5;

                const waveWidth = lvl === 3 ? 34 : (lvl === 2 ? 26 : 20);
                const waveArc = lvl === 3 ? 18 : (lvl === 2 ? 14 : 11);

                // 1. Water wake shadow / undercurrent
                this.ctx.fillStyle = 'rgba(2, 132, 199, 0.3)';
                this.ctx.beginPath();
                this.ctx.ellipse(-6, 0, waveArc + 4, waveWidth * 0.7, 0, 0, Math.PI * 2);
                this.ctx.fill();

                // 2. Deep ocean blue wave body (backward sweeping crescent)
                this.ctx.fillStyle = lvl === 3 ? '#0369a1' : '#0284c7';
                this.ctx.beginPath();
                this.ctx.moveTo(waveArc, 0);
                this.ctx.quadraticCurveTo(0, -waveWidth, -waveArc * 0.6, -waveWidth * 0.9);
                this.ctx.quadraticCurveTo(-waveArc * 0.2, 0, -waveArc * 0.6, waveWidth * 0.9);
                this.ctx.quadraticCurveTo(0, waveWidth, waveArc, 0);
                this.ctx.closePath();
                this.ctx.fill();

                // 3. Translucent cyan hydraulic surge crest
                this.ctx.fillStyle = lvl === 3 ? '#38bdf8' : '#7dd3fc';
                this.ctx.beginPath();
                this.ctx.moveTo(waveArc + 2, 0);
                this.ctx.quadraticCurveTo(2, -waveWidth * 0.8, -waveArc * 0.3, -waveWidth * 0.75);
                this.ctx.quadraticCurveTo(0, 0, -waveArc * 0.3, waveWidth * 0.75);
                this.ctx.quadraticCurveTo(2, waveWidth * 0.8, waveArc + 2, 0);
                this.ctx.closePath();
                this.ctx.fill();

                // 4. Frothing whitecap curl (brilliant white leading edge)
                this.ctx.strokeStyle = '#ffffff';
                this.ctx.lineWidth = lvl === 3 ? 3.0 : 2.2;
                this.ctx.beginPath();
                this.ctx.moveTo(-waveArc * 0.4, -waveWidth * 0.85);
                this.ctx.quadraticCurveTo(waveArc + 3 + frothPulse, 0, -waveArc * 0.4, waveWidth * 0.85);
                this.ctx.stroke();

                // 5. White foam spray droplets along wave tips
                this.ctx.fillStyle = '#ffffff';
                [-waveWidth * 0.7, 0, waveWidth * 0.7].forEach(offsetY => {
                    this.ctx.beginPath();
                    this.ctx.arc(waveArc * 0.6, offsetY, lvl === 3 ? 2.2 : 1.6, 0, Math.PI * 2);
                    this.ctx.fill();
                });

                // Tier 2 & 3: Twin rotating vortex swirls inside the wave crest
                if (lvl >= 2) {
                    const rot = now * 0.012;
                    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
                    this.ctx.lineWidth = 1.4;
                    [-waveWidth * 0.45, waveWidth * 0.45].forEach(offsetY => {
                        this.ctx.beginPath();
                        this.ctx.arc(2, offsetY, 3.5, rot, rot + Math.PI * 1.3);
                        this.ctx.stroke();
                    });
                }

                // Tier 3: Leviathan abyssal mega-crest energy arcs
                if (lvl === 3) {
                    this.ctx.strokeStyle = 'rgba(186, 230, 253, 0.85)';
                    this.ctx.lineWidth = 1.5;
                    this.ctx.beginPath();
                    this.ctx.moveTo(-waveArc * 0.8, -waveWidth);
                    this.ctx.lineTo(waveArc * 0.8, -waveWidth * 0.5);
                    this.ctx.lineTo(waveArc + 4, 0);
                    this.ctx.lineTo(waveArc * 0.8, waveWidth * 0.5);
                    this.ctx.lineTo(-waveArc * 0.8, waveWidth);
                    this.ctx.stroke();
                }
            }

            this.ctx.restore();
        });
    }

    renderParticles() {
        this.particles.forEach(p => {
            this.ctx.save();

            if (p.type === 'lightning_arc') {
                // =========================================================================
                // TESLA TOWER: MULTI-SEGMENT FRACTAL CHAIN LIGHTNING ATTACK ANIMATION
                // =========================================================================
                const alpha = p.life / p.maxLife;
                const tier = p.tier || 1;
                const dx = p.toX - p.fromX;
                const dy = p.toY - p.fromY;
                const dist = Math.hypot(dx, dy);
                const normX = dist > 0.001 ? dx / dist : 1;
                const normY = dist > 0.001 ? dy / dist : 0;
                const perpX = -normY;
                const perpY = normX;

                // Generate 5-7 jagged fractal vertices
                const segCount = tier === 3 ? 7 : (tier === 2 ? 6 : 5);
                const pts = [{ x: p.fromX, y: p.fromY }];
                const jitterScale = tier === 3 ? 18 : (tier === 2 ? 14 : 10);

                for (let s = 1; s < segCount; s++) {
                    const t = s / segCount;
                    const offset = (Math.random() - 0.5) * 2 * jitterScale;
                    pts.push({
                        x: p.fromX + dx * t + perpX * offset,
                        y: p.fromY + dy * t + perpY * offset
                    });
                }
                pts.push({ x: p.toX, y: p.toY });

                // 1. Broad outer electric violet ion sheath glow
                this.ctx.strokeStyle = tier === 3 ? `rgba(232, 121, 249, ${alpha * 0.45})` : `rgba(168, 85, 247, ${alpha * 0.4})`;
                this.ctx.lineWidth = tier === 3 ? 8 : (tier === 2 ? 6.5 : 5);
                this.ctx.beginPath();
                this.ctx.moveTo(pts[0].x, pts[0].y);
                for (let k = 1; k < pts.length; k++) this.ctx.lineTo(pts[k].x, pts[k].y);
                this.ctx.stroke();

                // 2. High-energy cyan / electric blue lightning channel
                this.ctx.strokeStyle = tier === 3 ? `rgba(192, 132, 252, ${alpha * 0.9})` : `rgba(56, 189, 248, ${alpha * 0.85})`;
                this.ctx.lineWidth = tier === 3 ? 3.8 : (tier === 2 ? 3.0 : 2.4);
                this.ctx.beginPath();
                this.ctx.moveTo(pts[0].x, pts[0].y);
                for (let k = 1; k < pts.length; k++) this.ctx.lineTo(pts[k].x, pts[k].y);
                this.ctx.stroke();

                // 3. Blinding pure white core discharge
                this.ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
                this.ctx.lineWidth = tier === 3 ? 1.8 : 1.2;
                this.ctx.beginPath();
                this.ctx.moveTo(pts[0].x, pts[0].y);
                for (let k = 1; k < pts.length; k++) this.ctx.lineTo(pts[k].x, pts[k].y);
                this.ctx.stroke();

                // 4. Branching side forks arcing into air
                const forkCount = tier === 3 ? 2 : 1;
                for (let f = 0; f < forkCount; f++) {
                    const forkIdx = Math.floor(pts.length * (0.3 + f * 0.35));
                    if (pts[forkIdx]) {
                        const fp = pts[forkIdx];
                        const forkLen = (15 + Math.random() * 20) * (Math.random() > 0.5 ? 1 : -1);
                        this.ctx.strokeStyle = `rgba(240, 171, 252, ${alpha * 0.7})`;
                        this.ctx.lineWidth = 1.4;
                        this.ctx.beginPath();
                        this.ctx.moveTo(fp.x, fp.y);
                        this.ctx.lineTo(fp.x + perpX * forkLen + normX * 8, fp.y + perpY * forkLen + normY * 8);
                        this.ctx.stroke();
                    }
                }
            } else if (p.type === 'sonic_cone') {
                const progress = 1 - (p.life / p.maxLife);
                const alpha = (1 - progress) * 0.85;
                const r = p.radius * (0.4 + progress * 0.9);
                this.ctx.translate(p.x, p.y);
                this.ctx.rotate(p.angle || 0);
                this.ctx.strokeStyle = p.color;
                this.ctx.globalAlpha = alpha;
                this.ctx.lineWidth = Math.max(1, 2.8 * (1 - progress));
                this.ctx.beginPath();
                this.ctx.ellipse(progress * 14, 0, r * 0.6, r * 1.0, 0, -Math.PI * 0.42, Math.PI * 0.42);
                this.ctx.stroke();
            } else if (p.type === 'splinter') {
                const alpha = Math.min(1, p.life / (p.maxLife * 0.35));
                this.ctx.translate(p.x, p.y);
                this.ctx.rotate(p.rot || 0);
                this.ctx.fillStyle = p.color;
                this.ctx.globalAlpha = alpha;
                this.ctx.fillRect(-p.length / 2, -1, p.length, 2);
            } else if (p.type === 'spark') {
                const alpha = p.life / p.maxLife;
                this.ctx.strokeStyle = p.color;
                this.ctx.lineWidth = p.radius || 1.8;
                this.ctx.globalAlpha = alpha;
                this.ctx.beginPath();
                this.ctx.moveTo(p.x, p.y);
                const tailLen = 0.035;
                this.ctx.lineTo(p.x - (p.vx || 0) * tailLen, p.y - (p.vy || 0) * tailLen);
                this.ctx.stroke();
            } else if (p.type === 'poison_cloud' || p.type === 'smoke_puff') {
                const progress = 1 - (p.life / p.maxLife);
                const alpha = (1 - progress) * 0.75;
                const r = p.radius * (0.5 + progress * 0.9);
                this.ctx.fillStyle = p.color;
                this.ctx.globalAlpha = alpha;
                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
                this.ctx.fill();
            } else if (p.type === 'explosion_wave') {
                const progress = 1 - (p.life / p.maxLife);
                const currentRadius = p.radius * progress;
                const alpha = 1 - progress;
                this.ctx.strokeStyle = `rgba(249, 115, 22, ${alpha})`;
                this.ctx.lineWidth = 4 * alpha;
                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, currentRadius, 0, Math.PI * 2);
                this.ctx.stroke();
            } else if (p.type === 'meteor_strike') {
                const progress = 1 - (p.life / p.maxLife);
                const currentRadius = p.radius * progress;
                this.ctx.fillStyle = `rgba(239, 68, 68, ${0.4 * (1 - progress)})`;
                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, currentRadius, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.strokeStyle = '#f97316';
                this.ctx.lineWidth = 6 * (1 - progress);
                this.ctx.stroke();
            } else if (p.type === 'screen_flash') {
                this.ctx.fillStyle = p.color;
                this.ctx.fillRect(0, 0, this.width, this.height);
            } else {
                const alpha = p.life / p.maxLife;
                this.ctx.fillStyle = p.color;
                this.ctx.globalAlpha = alpha;
                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                this.ctx.fill();
            }

            this.ctx.restore();
        });
    }

    renderFloatingTexts() {
        this.floatingTexts.forEach(ft => {
            this.ctx.save();
            this.ctx.font = 'bold 13px system-ui, sans-serif';
            this.ctx.fillStyle = ft.color;
            this.ctx.globalAlpha = ft.alpha;
            this.ctx.textAlign = 'center';
            this.ctx.shadowColor = '#000000';
            this.ctx.shadowBlur = 4;
            this.ctx.fillText(ft.text, ft.x, ft.y);
            this.ctx.restore();
        });
    }

    renderWeather() {
        if (this.weatherSystem) {
            this.weatherSystem.renderPrecipitation(this.ctx);
            return;
        }
        if (!this.biome) return;
        this.ctx.save();
        this.ctx.fillStyle = this.biome.rainColor;

        if (this.biome.weather === 'rain') {
            this.ctx.strokeStyle = this.biome.rainColor;
            this.ctx.lineWidth = 1.5;
            this.ctx.beginPath();
            this.weatherParticles.forEach(wp => {
                this.ctx.moveTo(wp.x, wp.y);
                this.ctx.lineTo(wp.x - 3, wp.y + 12);
            });
            this.ctx.stroke();
        } else {
            // Snowflakes
            this.weatherParticles.forEach(wp => {
                this.ctx.globalAlpha = wp.alpha;
                this.ctx.beginPath();
                this.ctx.arc(wp.x, wp.y, wp.size, 0, Math.PI * 2);
                this.ctx.fill();
            });
        }
        this.ctx.restore();
    }

    renderSelectionOverlay() {
        // Range preview for selected tower or slot
        if (this.selectedTower) {
            this.ctx.save();
            this.ctx.strokeStyle = 'rgba(59, 130, 246, 0.7)';
            this.ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.arc(this.selectedTower.x, this.selectedTower.y, this.selectedTower.range, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.stroke();
            this.ctx.restore();
        } else if (this.selectedSlot) {
            this.ctx.save();
            this.ctx.strokeStyle = 'rgba(34, 197, 94, 0.7)';
            this.ctx.lineWidth = 2;
            this.ctx.setLineDash([6, 6]);
            this.ctx.beginPath();
            this.ctx.arc(this.selectedSlot.x, this.selectedSlot.y, 30, 0, Math.PI * 2);
            this.ctx.stroke();
            this.ctx.restore();
        }
    }
}

window.GameEngine = GameEngine;
