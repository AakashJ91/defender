// Game configuration, towers, enemies, spells, and balancing
const GAME_CONFIG = {
    canvasWidth: 1280,
    canvasHeight: 720,
    startingLives: 20,
    startingGold: 450,
    speedMultipliers: [1, 2, 4],

    // Biome Settings
    biomes: {
        jungle: {
            name: "Deep Jungle",
            bgColor: "#1a2e1d",
            pathColor: "#846543",
            pathBorder: "#533e29",
            accentColor: "#2ecc71",
            foliageColor: "#22543d",
            weather: "rain", // rain or mist
            rainColor: "rgba(180, 220, 240, 0.4)",
            particleCount: 70
        },
        snow: {
            name: "Glacial Tundra",
            bgColor: "#1e293b",
            pathColor: "#93c5fd",
            pathBorder: "#60a5fa",
            accentColor: "#38bdf8",
            foliageColor: "#1e3a5f",
            weather: "snow", // snowflakes
            rainColor: "rgba(255, 255, 255, 0.85)",
            particleCount: 90
        }
    },

    // Towers Configuration
    towers: {
        archer: {
            name: "Dart Spire",
            category: "archer",
            cost: 100,
            range: 160,
            damage: 24,
            fireRate: 1.2, // attacks per second
            projectileType: "arrow",
            projectileSpeed: 520,
            canTargetAir: true,
            color: "#10b981",
            bulletColor: "#34d399",
            description: "Rapid single-target physical darts. Can shoot flying creeps.",
            upgrades: [
                {
                    level: 2,
                    name: "Swift Blowpipe",
                    cost: 120,
                    damage: 48,
                    fireRate: 1.6,
                    range: 180,
                    desc: "+Damage & +Attack Speed"
                },
                {
                    level: 3,
                    name: "Jungle Ballista",
                    cost: 200,
                    damage: 110,
                    fireRate: 1.9,
                    range: 210,
                    desc: "Armor-piercing heavy ballista bolts"
                }
            ]
        },

        cannon: {
            name: "Bombard Cannon",
            category: "cannon",
            cost: 150,
            range: 150,
            damage: 65,
            fireRate: 0.55,
            splashRadius: 75,
            projectileType: "bomb",
            projectileSpeed: 300,
            canTargetAir: false,
            color: "#f97316",
            bulletColor: "#ea580c",
            description: "Heavy explosive cannon. High splash damage against ground hordes.",
            upgrades: [
                {
                    level: 2,
                    name: "Mortar Battery",
                    cost: 180,
                    damage: 130,
                    splashRadius: 90,
                    fireRate: 0.65,
                    range: 175,
                    desc: "+Blast Radius & Heavy Impact"
                },
                {
                    level: 3,
                    name: "Magma Siege Gun",
                    cost: 280,
                    damage: 260,
                    splashRadius: 110,
                    fireRate: 0.75,
                    range: 200,
                    desc: "Devastating cluster explosion with burning residue"
                }
            ]
        },

        frost: {
            name: "Cryo Obelisk",
            category: "frost",
            cost: 125,
            range: 140,
            damage: 15,
            fireRate: 0.9,
            slowFactor: 0.5, // creeps move at 50% speed
            slowDuration: 2.5, // seconds
            splashRadius: 55,
            projectileType: "frost_orb",
            projectileSpeed: 360,
            canTargetAir: true,
            color: "#06b6d4",
            bulletColor: "#67e8f9",
            description: "Emits freezing shards that slow enemies significantly.",
            upgrades: [
                {
                    level: 2,
                    name: "Glacial Pylon",
                    cost: 160,
                    damage: 32,
                    slowFactor: 0.4,
                    slowDuration: 3.2,
                    splashRadius: 75,
                    range: 165,
                    desc: "Stronger chill aura & larger freeze blast"
                },
                {
                    level: 3,
                    name: "Blizzard Sanctum",
                    cost: 260,
                    damage: 75,
                    slowFactor: 0.25,
                    slowDuration: 4.0,
                    splashRadius: 95,
                    range: 190,
                    desc: "Permafrost blast freezing enemies nearly solid"
                }
            ]
        },

        tesla: {
            name: "Tesla Tower",
            category: "tesla",
            cost: 175,
            range: 165,
            damage: 42,
            fireRate: 0.85,
            chainCount: 3,
            chainRange: 110,
            projectileType: "lightning",
            canTargetAir: true,
            color: "#a855f7",
            bulletColor: "#c084fc",
            description: "Fires chain lightning leaping between multiple enemies.",
            upgrades: [
                {
                    level: 2,
                    name: "Arc Capacitor",
                    cost: 210,
                    damage: 85,
                    fireRate: 1.0,
                    chainCount: 4,
                    range: 185,
                    desc: "Chains to 4 targets with amplified voltage"
                },
                {
                    level: 3,
                    name: "Storm Conductor",
                    cost: 320,
                    damage: 180,
                    fireRate: 1.2,
                    chainCount: 6,
                    range: 210,
                    desc: "Chains to 6 targets with fatal high-voltage spikes"
                }
            ]
        },

        flame: {
            name: "Solar Spire",
            category: "flame",
            cost: 160,
            range: 130,
            damage: 60, // damage per second
            fireRate: 5.0, // beam / continuous tick
            burnDuration: 3.0,
            burnDps: 15,
            projectileType: "beam",
            canTargetAir: false,
            color: "#ef4444",
            bulletColor: "#f87171",
            description: "Melts armored creeps with concentrated thermal beams.",
            upgrades: [
                {
                    level: 2,
                    name: "Inferno Core",
                    cost: 190,
                    damage: 120,
                    burnDps: 30,
                    range: 150,
                    desc: "+Melt rate and persistent fireburn"
                },
                {
                    level: 3,
                    name: "Sun God Ray",
                    cost: 300,
                    damage: 260,
                    burnDps: 65,
                    range: 175,
                    desc: "Extreme thermal beam vaporizing armor instantly"
                }
            ]
        },

        wave: {
            name: "Wake Spire",
            category: "wave",
            cost: 140,
            range: 155,
            damage: 28,
            fireRate: 0.8,
            knockback: 20,
            splashRadius: 65,
            projectileType: "tidal_wave",
            projectileSpeed: 380,
            canTargetAir: false,
            color: "#0ea5e9",
            bulletColor: "#38bdf8",
            description: "Launches hydraulic wave surges that wash over creeps and push them backward.",
            upgrades: [
                {
                    level: 2,
                    name: "Tidal Maelstrom",
                    cost: 180,
                    damage: 60,
                    fireRate: 0.95,
                    knockback: 30,
                    splashRadius: 85,
                    range: 175,
                    desc: "Dual hydro-vortex launching pressurized tidal waves"
                },
                {
                    level: 3,
                    name: "Leviathan's Wake",
                    cost: 280,
                    damage: 135,
                    fireRate: 1.1,
                    knockback: 45,
                    splashRadius: 105,
                    range: 200,
                    desc: "Catastrophic tsunami waves sweeping creeps back with immense force"
                }
            ]
        }
    },

    // Enemies Configuration
    enemies: {
        // Jungle creeps
        scout: {
            name: "Jungle Scout",
            hp: 90,
            speed: 105,
            armor: 0,
            reward: 14,
            damageToBase: 1,
            size: 14,
            color: "#84cc16",
            biome: "jungle",
            type: "ground"
        },
        crawler: {
            name: "Venom Crawler",
            hp: 60,
            speed: 145,
            armor: 0,
            reward: 10,
            damageToBase: 1,
            size: 11,
            color: "#a3e635",
            biome: "jungle",
            type: "ground"
        },
        bat: {
            name: "Canopy Drake",
            hp: 110,
            speed: 110,
            armor: 0,
            reward: 18,
            damageToBase: 1,
            size: 15,
            color: "#059669",
            biome: "jungle",
            type: "air" // Flies straight over terrain towards goal
        },
        gorilla: {
            name: "Armored Gorilla",
            hp: 450,
            speed: 60,
            armor: 0.35, // 35% physical damage reduction
            reward: 38,
            damageToBase: 2,
            size: 20,
            color: "#475569",
            biome: "jungle",
            type: "ground"
        },
        shaman: {
            name: "Jungle Shaman",
            hp: 220,
            speed: 75,
            armor: 0.1,
            reward: 30,
            damageToBase: 1,
            size: 16,
            color: "#eab308",
            biome: "jungle",
            type: "ground",
            healRadius: 90,
            healAmount: 25,
            healCooldown: 2.0
        },
        jungle_boss: {
            name: "Ancient Jungle Titan",
            hp: 2800,
            speed: 42,
            armor: 0.45,
            reward: 150,
            damageToBase: 5,
            size: 28,
            color: "#15803d",
            biome: "jungle",
            type: "boss",
            isBoss: true
        },

        // Snow creeps
        frost_wolf: {
            name: "Frost Wolf",
            hp: 130,
            speed: 135,
            armor: 0.1,
            reward: 18,
            damageToBase: 1,
            size: 14,
            color: "#93c5fd",
            biome: "snow",
            type: "ground"
        },
        ice_revenant: {
            name: "Ice Revenant",
            hp: 260,
            speed: 80,
            armor: 0.25,
            reward: 28,
            damageToBase: 1,
            size: 16,
            color: "#38bdf8",
            biome: "snow",
            type: "ground",
            slowImmune: true // Immune to frost slow
        },
        wyvern: {
            name: "Blizzard Wyvern",
            hp: 210,
            speed: 115,
            armor: 0.15,
            reward: 32,
            damageToBase: 2,
            size: 18,
            color: "#60a5fa",
            biome: "snow",
            type: "air"
        },
        yeti: {
            name: "Glacial Yeti",
            hp: 850,
            speed: 52,
            armor: 0.4,
            reward: 55,
            damageToBase: 3,
            size: 22,
            color: "#e0f2fe",
            biome: "snow",
            type: "ground"
        },
        frost_witch: {
            name: "Frost Witch",
            hp: 360,
            speed: 70,
            armor: 0.2,
            reward: 45,
            damageToBase: 2,
            size: 17,
            color: "#818cf8",
            biome: "snow",
            type: "ground",
            shieldRadius: 100,
            shieldAmount: 120,
            shieldCooldown: 3.5
        },
        frost_boss: {
            name: "Glacial Behemoth",
            hp: 4600,
            speed: 38,
            armor: 0.5,
            reward: 250,
            damageToBase: 10,
            size: 32,
            color: "#bae6fd",
            biome: "snow",
            type: "boss",
            isBoss: true
        }
    },

    // Player Active Spells
    spells: {
        meteor: {
            name: "Meteor Strike",
            desc: "Bombards target area with an explosive meteor.",
            cost: 80,
            cooldown: 25, // seconds
            damage: 350,
            radius: 110,
            icon: "☄️"
        },
        freeze: {
            name: "Glacial Frost",
            desc: "Flash-freezes all active enemies on the map for 4s.",
            cost: 65,
            cooldown: 35,
            duration: 4.0,
            icon: "❄️"
        },
        rush: {
            name: "Battle Horn",
            desc: "Grants all towers +60% attack speed for 7 seconds.",
            cost: 50,
            cooldown: 30,
            duration: 7.0,
            icon: "📯"
        }
    }
};

window.GAME_CONFIG = GAME_CONFIG;
