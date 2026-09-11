// Core Tower Defense Game Engine
class GameEngine {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = GAME_CONFIG.canvasWidth;
        this.height = GAME_CONFIG.canvasHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;

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

        // Preload Dart Spire Top-Down Sprite
        this.dartSpireSprite = new Image();
        this.dartSpireSprite.src = 'assets/images/dart_spire_topdown.jpg';

        // Time tracking
        this.lastTime = performance.now();
        this.initWeather();
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

        this.initWeather();
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
            progressDistance: 0
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

            // Status: Frozen
            if (creep.frozenTime > 0) {
                creep.frozenTime -= effectiveDt;
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
            tower.angle = Math.atan2(target.y - tower.y, target.x - tower.x);

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
                    // Spark particles
                    if (Math.random() < 0.4) {
                        this.particles.push({
                            x: p.target.x + (Math.random() - 0.5) * 20,
                            y: p.target.y + (Math.random() - 0.5) * 20,
                            vx: (Math.random() - 0.5) * 60,
                            vy: (Math.random() - 0.5) * 60,
                            radius: 2,
                            color: '#ef4444',
                            life: 0.2,
                            maxLife: 0.2
                        });
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

        // Update Weather Particles
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

    fireTower(tower, target) {
        tower.recoil = 1.0;
        tower.muzzleFlash = 1.0;
        tower.barrelAlt = (tower.barrelAlt || 0) + 1;

        if (tower.type === 'archer') {
            const barrelLength = tower.level === 3 ? 26 : (tower.level === 2 ? 22 : 16);
            const tipX = tower.x + Math.cos(tower.angle) * barrelLength;
            const tipY = tower.y + Math.sin(tower.angle) * barrelLength;

            // Attack animation muzzle flash sparks
            const sparkCount = tower.level === 3 ? 6 : (tower.level === 2 ? 4 : 2);
            for (let i = 0; i < sparkCount; i++) {
                this.particles.push({
                    x: tipX,
                    y: tipY,
                    vx: Math.cos(tower.angle + (Math.random() - 0.5) * 0.9) * (70 + Math.random() * 90),
                    vy: Math.sin(tower.angle + (Math.random() - 0.5) * 0.9) * (70 + Math.random() * 90),
                    radius: tower.level === 3 ? 3.0 : 1.8,
                    color: tower.level === 3 ? '#34d399' : (tower.level === 2 ? '#facc15' : '#ffffff'),
                    life: 0.16,
                    maxLife: 0.16
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

        // Normal projectile
        this.projectiles.push({
            type: tower.projectileType,
            towerType: tower.type,
            x: tower.x,
            y: tower.y,
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
                life: 0.15,
                maxLife: 0.15,
                color: '#c084fc'
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
            // Atmospheric ambient lighting overlay
            this.ctx.fillStyle = this.currentLevel.biome === 'jungle' 
                ? 'rgba(10, 25, 15, 0.42)' 
                : 'rgba(15, 23, 42, 0.38)';
            this.ctx.fillRect(0, 0, this.width, this.height);
        } else {
            this.ctx.fillStyle = this.biome ? this.biome.bgColor : '#111827';
            this.ctx.fillRect(0, 0, this.width, this.height);
        }

        // 2. Biome Path
        this.renderPath();

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

        // 10. Weather Effects (Rain / Snow)
        this.renderWeather();

        // 11. Range Overlay for Selected Slot or Tower
        this.renderSelectionOverlay();

        this.ctx.restore();
    }

    renderPath() {
        if (!this.currentLevel || !this.currentLevel.path) return;
        const path = this.currentLevel.path;
        const pathColor = this.biome ? this.biome.pathColor : '#846543';
        const borderColor = this.biome ? this.biome.pathBorder : '#533e29';

        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';

        // Outer border
        this.ctx.strokeStyle = borderColor;
        this.ctx.lineWidth = 48;
        this.ctx.beginPath();
        this.ctx.moveTo(path[0].x, path[0].y);
        for (let i = 1; i < path.length; i++) {
            this.ctx.lineTo(path[i].x, path[i].y);
        }
        this.ctx.stroke();

        // Inner trail
        this.ctx.strokeStyle = pathColor;
        this.ctx.lineWidth = 40;
        this.ctx.beginPath();
        this.ctx.moveTo(path[0].x, path[0].y);
        for (let i = 1; i < path.length; i++) {
            this.ctx.lineTo(path[i].x, path[i].y);
        }
        this.ctx.stroke();

        // Air path dashed indicator (subtle)
        if (this.currentLevel.airPath) {
            this.ctx.save();
            this.ctx.setLineDash([8, 12]);
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
            this.ctx.lineWidth = 2;
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

        this.currentLevel.buildSlots.forEach(slot => {
            if (occupiedIds.includes(slot.id)) return; // Tower covers slot

            this.ctx.save();
            const isHovered = this.selectedSlot && this.selectedSlot.id === slot.id;

            // Base platform stone (Enlarged for mobile readability)
            this.ctx.fillStyle = isHovered ? 'rgba(59, 130, 246, 0.85)' : 'rgba(30, 41, 59, 0.85)';
            this.ctx.strokeStyle = isHovered ? '#60a5fa' : 'rgba(255, 255, 255, 0.35)';
            this.ctx.lineWidth = 2.5;
            this.ctx.beginPath();
            this.ctx.arc(slot.x, slot.y, 28, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.stroke();

            // Inner dashed guide ring
            this.ctx.strokeStyle = isHovered ? '#93c5fd' : 'rgba(255, 255, 255, 0.2)';
            this.ctx.lineWidth = 1.2;
            this.ctx.setLineDash([4, 4]);
            this.ctx.beginPath();
            this.ctx.arc(slot.x, slot.y, 20, 0, Math.PI * 2);
            this.ctx.stroke();
            this.ctx.setLineDash([]);

            // Plus icon indicating buildability
            this.ctx.strokeStyle = isHovered ? '#ffffff' : 'rgba(255, 255, 255, 0.75)';
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.moveTo(slot.x - 9, slot.y);
            this.ctx.lineTo(slot.x + 9, slot.y);
            this.ctx.moveTo(slot.x, slot.y - 9);
            this.ctx.lineTo(slot.x, slot.y + 9);
            this.ctx.stroke();

            this.ctx.restore();
        });
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

            if (tower.type === 'archer' && this.dartSpireSprite && this.dartSpireSprite.complete && this.dartSpireSprite.naturalWidth > 0) {
                // =========================================================================
                // AUTHENTIC HIGH-RES TOP-DOWN DART SPIRE SPRITE (from dart_spire_topdown.jpg)
                // =========================================================================
                let sx = 54, sy = 50, sw = 300, sh = 300, r = 34;
                if (tower.level === 2) {
                    sx = 83; sy = 549; sw = 390; sh = 390; r = 37;
                } else if (tower.level >= 3) {
                    sx = 526; sy = 516; sw = 480; sh = 480; r = 41;
                }

                this.ctx.translate(tower.x, tower.y);
                this.ctx.rotate(tower.angle);

                // Rotate by 45 deg so top-right crossbow (-45 deg in sprite) aligns with tower.angle
                this.ctx.rotate(Math.PI / 4);

                // Circular mask cutting away background - SOLID STATIONARY BASE (DOES NOT JUMP)
                this.ctx.save();
                this.ctx.beginPath();
                this.ctx.arc(0, 0, r, 0, Math.PI * 2);
                this.ctx.clip();
                this.ctx.drawImage(this.dartSpireSprite, sx, sy, sw, sh, -r, -r, r * 2, r * 2);
                this.ctx.restore();

                // Crisp stationary boundary bezel
                this.ctx.strokeStyle = tower.level >= 3 ? '#34d399' : (tower.level === 2 ? '#10b981' : '#15803d');
                this.ctx.lineWidth = 2.5;
                this.ctx.beginPath();
                this.ctx.arc(0, 0, r, 0, Math.PI * 2);
                this.ctx.stroke();

                // Return to aiming axis for weapon attack animation
                this.ctx.rotate(-Math.PI / 4);

                // =========================================================================
                // MECHANICAL WEAPON ATTACK ANIMATION (ONLY THE WEAPON MOVES, BASE IS FIXED)
                // =========================================================================
                const weaponSlide = -Math.sin(recoil * Math.PI) * (tower.level === 3 ? 5 : (tower.level === 2 ? 4 : 3));

                // Recoil track & vibrating bowstring
                if (recoil > 0.05) {
                    this.ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
                    this.ctx.fillRect(weaponSlide - 8, -3, 16, 6);

                    // Bowstring snap vibration
                    const vib = Math.sin(recoil * 35) * 1.5;
                    this.ctx.strokeStyle = '#ffffff';
                    this.ctx.lineWidth = 1.2;
                    this.ctx.beginPath();
                    this.ctx.moveTo(weaponSlide - 2, -12);
                    this.ctx.lineTo(weaponSlide + 4 + vib, 0);
                    this.ctx.lineTo(weaponSlide - 2, 12);
                    this.ctx.stroke();
                }

                // Muzzle Flash, Shockwave & Dart Launch
                if (flash > 0) {
                    const isAlt = (tower.level === 2 && tower.barrelAlt % 2 !== 0);
                    const flashY = tower.level === 2 ? (isAlt ? 5 : -5) : 0;
                    const flashX = r + 2;

                    // Expanding kinetic shockwave ring (directional air compression)
                    const shockwaveDist = (1 - recoil) * 18;
                    const shockwaveAlpha = flash * 0.8;
                    this.ctx.save();
                    this.ctx.strokeStyle = tower.level >= 3 ? `rgba(52, 211, 153, ${shockwaveAlpha})` : (tower.level === 2 ? `rgba(250, 204, 21, ${shockwaveAlpha})` : `rgba(255, 255, 255, ${shockwaveAlpha})`);
                    this.ctx.lineWidth = 2;
                    this.ctx.beginPath();
                    this.ctx.ellipse(flashX + shockwaveDist, flashY, 4 + shockwaveDist * 0.35, 3 + shockwaveDist * 0.5, 0, -Math.PI * 0.45, Math.PI * 0.45);
                    this.ctx.stroke();
                    this.ctx.restore();

                    // Sharp directional muzzle flash starburst
                    this.ctx.fillStyle = tower.level >= 3 ? `rgba(110, 231, 183, ${flash})` : (tower.level === 2 ? `rgba(254, 240, 138, ${flash})` : `rgba(255, 255, 255, ${flash})`);
                    this.ctx.beginPath();
                    this.ctx.ellipse(flashX + 4, flashY, 9 * flash, 4 * flash, 0, 0, Math.PI * 2);
                    this.ctx.fill();

                    // Bright hot white core
                    this.ctx.fillStyle = '#ffffff';
                    this.ctx.beginPath();
                    this.ctx.arc(flashX + 3, flashY, 2.5 * flash, 0, Math.PI * 2);
                    this.ctx.fill();

                    // Flying dart streak launched forward
                    if (recoil > 0.25) {
                        this.ctx.fillStyle = tower.level >= 3 ? '#34d399' : (tower.level === 2 ? '#a3e635' : '#38bdf8');
                        this.ctx.fillRect(flashX + 6 + (1 - recoil) * 14, flashY - 1.5, 12, 3);
                    }

                    // Tier 3: Dual wing tip plasma energy arcs
                    if (tower.level >= 3 && flash > 0.2) {
                        this.ctx.fillStyle = `rgba(52, 211, 153, ${flash * 0.85})`;
                        this.ctx.beginPath();
                        this.ctx.arc(r * 0.5, -20, 3 * flash, 0, Math.PI * 2);
                        this.ctx.arc(r * 0.5, 20, 3 * flash, 0, Math.PI * 2);
                        this.ctx.fill();
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
                    this.ctx.fillStyle = '#1e293b';
                    this.ctx.fillRect(kick - 2, -9, 28, 18);
                    this.ctx.fillStyle = '#f97316';
                    this.ctx.fillRect(kick + 20, -8, 8, 16);
                } else if (tower.type === 'frost') {
                    this.ctx.fillStyle = '#e0f2fe';
                    this.ctx.beginPath();
                    this.ctx.moveTo(26, 0);
                    this.ctx.lineTo(0, -12);
                    this.ctx.lineTo(0, 12);
                    this.ctx.closePath();
                    this.ctx.fill();
                } else if (tower.type === 'tesla') {
                    this.ctx.fillStyle = '#c084fc';
                    this.ctx.beginPath();
                    this.ctx.arc(10, 0, 10, 0, Math.PI * 2);
                    this.ctx.fill();
                } else if (tower.type === 'flame') {
                    this.ctx.fillStyle = '#ef4444';
                    this.ctx.fillRect(0, -7, 26, 14);
                    this.ctx.fillStyle = '#fbbf24';
                    this.ctx.beginPath();
                    this.ctx.arc(26, 0, 7, 0, Math.PI * 2);
                    this.ctx.fill();
                }
            }

            this.ctx.restore();

            // Level pips (stars/dots above tower - positioned cleanly above tower)
            this.ctx.fillStyle = '#fbbf24';
            for (let l = 0; l < tower.level; l++) {
                this.ctx.beginPath();
                const offset = (l - (tower.level - 1) / 2) * 9;
                const pipY = tower.y - (tower.level >= 3 ? 36 : 32);
                this.ctx.arc(tower.x + offset, pipY, 3, 0, Math.PI * 2);
                this.ctx.fill();
            }
        });
    }

    renderCreeps() {
        this.creeps.forEach(creep => {
            this.ctx.save();

            // Status Aura: Frozen
            if (creep.frozenTime > 0) {
                this.ctx.fillStyle = 'rgba(147, 197, 253, 0.45)';
                this.ctx.beginPath();
                this.ctx.arc(creep.x, creep.y, creep.size + 6, 0, Math.PI * 2);
                this.ctx.fill();
            } else if (creep.slowTime > 0) {
                // Chilled / Slow Aura
                this.ctx.strokeStyle = '#38bdf8';
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                this.ctx.arc(creep.x, creep.y, creep.size + 4, 0, Math.PI * 2);
                this.ctx.stroke();
            }

            // Status: Burning
            if (creep.burnTime > 0) {
                this.ctx.fillStyle = 'rgba(239, 68, 68, 0.35)';
                this.ctx.beginPath();
                this.ctx.arc(creep.x, creep.y, creep.size + 5, 0, Math.PI * 2);
                this.ctx.fill();
            }

            // Shield Aura
            if (creep.shield > 0) {
                this.ctx.strokeStyle = '#60a5fa';
                this.ctx.lineWidth = 3;
                this.ctx.setLineDash([4, 4]);
                this.ctx.beginPath();
                this.ctx.arc(creep.x, creep.y, creep.size + 7, 0, Math.PI * 2);
                this.ctx.stroke();
                this.ctx.setLineDash([]);
            }

            // Shadow
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            this.ctx.beginPath();
            this.ctx.ellipse(creep.x, creep.y + (creep.isAir ? 18 : 6), creep.size, creep.size * 0.45, 0, 0, Math.PI * 2);
            this.ctx.fill();

            // Creep Body
            this.ctx.fillStyle = creep.color;
            this.ctx.beginPath();
            this.ctx.arc(creep.x, creep.y, creep.size, 0, Math.PI * 2);
            this.ctx.fill();

            // Inner styling / eye
            this.ctx.fillStyle = '#000000';
            this.ctx.beginPath();
            this.ctx.arc(creep.x + creep.size * 0.3, creep.y - creep.size * 0.2, 2.5, 0, Math.PI * 2);
            this.ctx.fill();

            if (creep.isAir) {
                // Wings
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
                this.ctx.beginPath();
                this.ctx.ellipse(creep.x - creep.size * 0.8, creep.y, 8, 4, -0.4, 0, Math.PI * 2);
                this.ctx.ellipse(creep.x + creep.size * 0.8, creep.y, 8, 4, 0.4, 0, Math.PI * 2);
                this.ctx.fill();
            }

            // Health Bar
            const barW = creep.size * 2.2;
            const barH = 5;
            const barX = creep.x - barW / 2;
            const barY = creep.y - creep.size - 10;

            this.ctx.fillStyle = '#1e293b';
            this.ctx.fillRect(barX - 1, barY - 1, barW + 2, barH + 2);

            const hpPercent = Math.max(0, creep.hp / creep.maxHp);
            this.ctx.fillStyle = creep.isBoss ? '#f59e0b' : (hpPercent > 0.5 ? '#22c55e' : (hpPercent > 0.25 ? '#eab308' : '#ef4444'));
            this.ctx.fillRect(barX, barY, barW * hpPercent, barH);

            this.ctx.restore();
        });
    }

    renderProjectiles() {
        this.projectiles.forEach(p => {
            this.ctx.save();

            if (p.type === 'beam') {
                // Flame Beam Ray
                this.ctx.strokeStyle = 'rgba(239, 68, 68, 0.85)';
                this.ctx.lineWidth = 6;
                this.ctx.beginPath();
                this.ctx.moveTo(p.tower.x, p.tower.y);
                this.ctx.lineTo(p.target.x, p.target.y);
                this.ctx.stroke();

                this.ctx.strokeStyle = '#fef08a';
                this.ctx.lineWidth = 2.5;
                this.ctx.beginPath();
                this.ctx.moveTo(p.tower.x, p.tower.y);
                this.ctx.lineTo(p.target.x, p.target.y);
                this.ctx.stroke();
            } else if (p.type === 'arrow') {
                if (p.damage >= 100) {
                    // TIER 3: Runic Armor-Piercing Ballista Bolt
                    this.ctx.fillStyle = '#34d399';
                    this.ctx.shadowColor = '#10b981';
                    this.ctx.shadowBlur = 8;
                    this.ctx.beginPath();
                    this.ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
                    this.ctx.fill();

                    this.ctx.fillStyle = '#ffffff';
                    this.ctx.beginPath();
                    this.ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
                    this.ctx.fill();
                } else if (p.damage >= 40) {
                    // TIER 2: High-Velocity Venom Dart
                    this.ctx.fillStyle = '#a3e635';
                    this.ctx.shadowColor = '#84cc16';
                    this.ctx.shadowBlur = 5;
                    this.ctx.beginPath();
                    this.ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
                    this.ctx.fill();
                } else {
                    // TIER 1: Standard Dart
                    this.ctx.fillStyle = p.color;
                    this.ctx.beginPath();
                    this.ctx.arc(p.x, p.y, 3.5, 0, Math.PI * 2);
                    this.ctx.fill();
                }
            } else if (p.type === 'bomb') {
                // Cannonball
                this.ctx.fillStyle = '#1e293b';
                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.fillStyle = '#ea580c';
                this.ctx.beginPath();
                this.ctx.arc(p.x - 1, p.y - 1, 2.5, 0, Math.PI * 2);
                this.ctx.fill();
            } else if (p.type === 'frost_orb') {
                // Ice crystal
                this.ctx.fillStyle = '#67e8f9';
                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
                this.ctx.fill();
            }

            this.ctx.restore();
        });
    }

    renderParticles() {
        this.particles.forEach(p => {
            this.ctx.save();

            if (p.type === 'lightning_arc') {
                const alpha = p.life / p.maxLife;
                this.ctx.strokeStyle = `rgba(192, 132, 252, ${alpha})`;
                this.ctx.lineWidth = 3;
                this.ctx.beginPath();
                this.ctx.moveTo(p.fromX, p.fromY);
                // Jagged mid-point
                const midX = (p.fromX + p.toX) / 2 + (Math.random() - 0.5) * 20;
                const midY = (p.fromY + p.toY) / 2 + (Math.random() - 0.5) * 20;
                this.ctx.lineTo(midX, midY);
                this.ctx.lineTo(p.toX, p.toY);
                this.ctx.stroke();
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
