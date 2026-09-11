// Levels definition: 10 levels (1-5 Jungle, 6-10 Snow)
const LEVELS = [
    // -------------------------------------------------------------
    // LEVEL 1: Jungle Outskirts (Introductory level)
    // -------------------------------------------------------------
    {
        id: 1,
        name: "Emerald Trail",
        biome: "jungle",
        difficulty: "Normal",
        description: "The jungle perimeter is breached by scout goblins. Set up Dart Spires along the path to defend the camp.",
        startingGold: 450,
        startingLives: 20,
        path: [
            { x: -30, y: 360 },
            { x: 260, y: 360 },
            { x: 260, y: 180 },
            { x: 620, y: 180 },
            { x: 620, y: 520 },
            { x: 980, y: 520 },
            { x: 980, y: 360 },
            { x: 1310, y: 360 }
        ],
        buildSlots: [
            { id: 101, x: 170, y: 270 },
            { id: 102, x: 170, y: 450 },
            { id: 103, x: 360, y: 270 },
            { id: 104, x: 520, y: 270 },
            { id: 105, x: 520, y: 430 },
            { id: 106, x: 720, y: 430 },
            { id: 107, x: 720, y: 270 },
            { id: 108, x: 880, y: 430 },
            { id: 109, x: 1080, y: 450 },
            { id: 110, x: 1080, y: 270 }
        ],
        decorations: [
            { type: "tree", x: 100, y: 150, size: 28 },
            { type: "tree", x: 140, y: 110, size: 34 },
            { type: "tree", x: 420, y: 90, size: 32 },
            { type: "tree", x: 800, y: 120, size: 38 },
            { type: "tree", x: 1150, y: 160, size: 30 },
            { type: "tree", x: 380, y: 620, size: 36 },
            { type: "tree", x: 820, y: 630, size: 35 },
            { type: "rock", x: 440, y: 380, size: 22 },
            { type: "ruin", x: 1140, y: 560, size: 26 },
            { type: "bush", x: 260, y: 480, size: 18 }
        ],
        waves: [
            { creeps: [{ type: "scout", count: 8, interval: 1.2 }], reward: 40 },
            { creeps: [{ type: "scout", count: 12, interval: 1.0 }], reward: 50 },
            { creeps: [{ type: "crawler", count: 16, interval: 0.7 }], reward: 60 },
            { creeps: [{ type: "scout", count: 10, interval: 0.9 }, { type: "crawler", count: 12, interval: 0.6 }], reward: 70 },
            { creeps: [{ type: "gorilla", count: 2, interval: 3.0 }, { type: "scout", count: 14, interval: 0.8 }], reward: 100 }
        ]
    },

    // -------------------------------------------------------------
    // LEVEL 2: Serpentine River
    // -------------------------------------------------------------
    {
        id: 2,
        name: "Serpentine River",
        biome: "jungle",
        difficulty: "Normal",
        description: "A winding muddy river with aggressive crawler swarms. Cannon Bombards deal great area damage on bends.",
        startingGold: 500,
        startingLives: 20,
        path: [
            { x: -30, y: 180 },
            { x: 340, y: 180 },
            { x: 340, y: 540 },
            { x: 680, y: 540 },
            { x: 680, y: 180 },
            { x: 1020, y: 180 },
            { x: 1020, y: 540 },
            { x: 1310, y: 540 }
        ],
        buildSlots: [
            { id: 201, x: 240, y: 280 },
            { id: 202, x: 240, y: 440 },
            { id: 203, x: 440, y: 280 },
            { id: 204, x: 440, y: 440 },
            { id: 205, x: 580, y: 280 },
            { id: 206, x: 580, y: 440 },
            { id: 207, x: 780, y: 280 },
            { id: 208, x: 780, y: 440 },
            { id: 209, x: 920, y: 280 },
            { id: 210, x: 920, y: 440 },
            { id: 211, x: 1120, y: 360 }
        ],
        decorations: [
            { type: "river", x: 0, y: 360, size: 40 },
            { type: "tree", x: 120, y: 360, size: 32 },
            { type: "tree", x: 510, y: 90, size: 36 },
            { type: "tree", x: 850, y: 90, size: 35 },
            { type: "rock", x: 510, y: 360, size: 25 },
            { type: "ruin", x: 1180, y: 200, size: 30 }
        ],
        waves: [
            { creeps: [{ type: "crawler", count: 14, interval: 0.8 }], reward: 45 },
            { creeps: [{ type: "scout", count: 12, interval: 0.8 }, { type: "crawler", count: 10, interval: 0.6 }], reward: 55 },
            { creeps: [{ type: "crawler", count: 20, interval: 0.5 }], reward: 65 },
            { creeps: [{ type: "gorilla", count: 3, interval: 3.5 }, { type: "scout", count: 15, interval: 0.7 }], reward: 80 },
            { creeps: [{ type: "gorilla", count: 5, interval: 2.8 }, { type: "crawler", count: 20, interval: 0.5 }], reward: 95 },
            { creeps: [{ type: "gorilla", count: 8, interval: 2.2 }, { type: "scout", count: 20, interval: 0.6 }], reward: 120 }
        ]
    },

    // -------------------------------------------------------------
    // LEVEL 3: Ancient Canopy (Introduces Flying Canopy Drakes)
    // -------------------------------------------------------------
    {
        id: 3,
        name: "Ancient Canopy",
        biome: "jungle",
        difficulty: "Hard",
        description: "Flying Canopy Drakes bypass ground obstacles! Build Dart Spires and Tesla Towers capable of anti-air targeting.",
        startingGold: 550,
        startingLives: 20,
        path: [
            { x: 180, y: -30 },
            { x: 180, y: 380 },
            { x: 520, y: 380 },
            { x: 520, y: 150 },
            { x: 880, y: 150 },
            { x: 880, y: 560 },
            { x: 1200, y: 560 },
            { x: 1200, y: 750 }
        ],
        airPath: [
            { x: 180, y: -30 },
            { x: 500, y: 260 },
            { x: 880, y: 360 },
            { x: 1200, y: 750 }
        ],
        buildSlots: [
            { id: 301, x: 280, y: 260 },
            { id: 302, x: 420, y: 260 },
            { id: 303, x: 420, y: 470 },
            { id: 304, x: 620, y: 260 },
            { id: 305, x: 780, y: 260 },
            { id: 306, x: 780, y: 440 },
            { id: 307, x: 980, y: 360 },
            { id: 308, x: 980, y: 480 },
            { id: 309, x: 1100, y: 440 }
        ],
        decorations: [
            { type: "tree", x: 80, y: 520, size: 40 },
            { type: "tree", x: 350, y: 90, size: 36 },
            { type: "tree", x: 700, y: 90, size: 38 },
            { type: "tree", x: 1050, y: 80, size: 36 },
            { type: "ruin", x: 670, y: 460, size: 30 },
            { type: "rock", x: 320, y: 580, size: 24 }
        ],
        waves: [
            { creeps: [{ type: "scout", count: 14, interval: 0.8 }], reward: 50 },
            { creeps: [{ type: "bat", count: 8, interval: 1.2 }], reward: 60 },
            { creeps: [{ type: "crawler", count: 18, interval: 0.6 }, { type: "bat", count: 6, interval: 1.0 }], reward: 75 },
            { creeps: [{ type: "gorilla", count: 4, interval: 2.5 }, { type: "bat", count: 10, interval: 0.9 }], reward: 90 },
            { creeps: [{ type: "shaman", count: 3, interval: 3.0 }, { type: "scout", count: 16, interval: 0.6 }], reward: 110 },
            { creeps: [{ type: "bat", count: 16, interval: 0.7 }, { type: "gorilla", count: 6, interval: 2.0 }], reward: 130 },
            { creeps: [{ type: "shaman", count: 5, interval: 2.5 }, { type: "gorilla", count: 8, interval: 1.8 }, { type: "bat", count: 12, interval: 0.8 }], reward: 160 }
        ]
    },

    // -------------------------------------------------------------
    // LEVEL 4: Shaman's Crossing (Healers + Armored Gorillas)
    // -------------------------------------------------------------
    {
        id: 4,
        name: "Shaman's Crossing",
        biome: "jungle",
        difficulty: "Hard",
        description: "Tribal Shamans heal nearby monsters constantly. Eliminate them quickly using focused Ballista and Arcane towers.",
        startingGold: 600,
        startingLives: 20,
        path: [
            { x: -30, y: 520 },
            { x: 300, y: 520 },
            { x: 300, y: 220 },
            { x: 600, y: 220 },
            { x: 600, y: 500 },
            { x: 920, y: 500 },
            { x: 920, y: 180 },
            { x: 1310, y: 180 }
        ],
        airPath: [
            { x: -30, y: 520 },
            { x: 450, y: 350 },
            { x: 800, y: 320 },
            { x: 1310, y: 180 }
        ],
        buildSlots: [
            { id: 401, x: 200, y: 380 },
            { id: 402, x: 400, y: 360 },
            { id: 403, x: 480, y: 130 },
            { id: 404, x: 500, y: 360 },
            { id: 405, x: 720, y: 340 },
            { id: 406, x: 800, y: 340 },
            { id: 407, x: 780, y: 580 },
            { id: 408, x: 1040, y: 300 },
            { id: 409, x: 1040, y: 460 },
            { id: 410, x: 1180, y: 280 }
        ],
        decorations: [
            { type: "tree", x: 120, y: 120, size: 36 },
            { type: "tree", x: 760, y: 90, size: 34 },
            { type: "ruin", x: 440, y: 590, size: 32 },
            { type: "rock", x: 1080, y: 80, size: 26 },
            { type: "bush", x: 920, y: 620, size: 22 }
        ],
        waves: [
            { creeps: [{ type: "scout", count: 18, interval: 0.7 }], reward: 60 },
            { creeps: [{ type: "crawler", count: 24, interval: 0.5 }, { type: "bat", count: 8, interval: 1.0 }], reward: 75 },
            { creeps: [{ type: "shaman", count: 4, interval: 2.2 }, { type: "gorilla", count: 5, interval: 2.5 }], reward: 90 },
            { creeps: [{ type: "gorilla", count: 8, interval: 1.8 }, { type: "bat", count: 14, interval: 0.8 }], reward: 110 },
            { creeps: [{ type: "shaman", count: 6, interval: 2.0 }, { type: "gorilla", count: 10, interval: 1.5 }], reward: 130 },
            { creeps: [{ type: "crawler", count: 30, interval: 0.4 }, { type: "bat", count: 18, interval: 0.6 }], reward: 150 },
            { creeps: [{ type: "shaman", count: 8, interval: 1.5 }, { type: "gorilla", count: 14, interval: 1.2 }], reward: 180 }
        ]
    },

    // -------------------------------------------------------------
    // LEVEL 5: Temple of the Jungle Titan (BOSS 1)
    // -------------------------------------------------------------
    {
        id: 5,
        name: "Temple of the Jungle Titan",
        biome: "jungle",
        difficulty: "Boss",
        description: "The Ancient Jungle Titan awakens from the forgotten temple! Prepare high single-target burst and freeze support.",
        startingGold: 700,
        startingLives: 20,
        path: [
            { x: -30, y: 220 },
            { x: 380, y: 220 },
            { x: 380, y: 460 },
            { x: 740, y: 460 },
            { x: 740, y: 220 },
            { x: 1100, y: 220 },
            { x: 1100, y: 500 },
            { x: 1310, y: 500 }
        ],
        airPath: [
            { x: -30, y: 220 },
            { x: 560, y: 340 },
            { x: 1310, y: 500 }
        ],
        buildSlots: [
            { id: 501, x: 260, y: 330 },
            { id: 502, x: 260, y: 120 },
            { id: 503, x: 480, y: 340 },
            { id: 504, x: 480, y: 560 },
            { id: 505, x: 620, y: 340 },
            { id: 506, x: 840, y: 340 },
            { id: 507, x: 840, y: 120 },
            { id: 508, x: 980, y: 340 },
            { id: 509, x: 980, y: 580 },
            { id: 510, x: 1200, y: 360 }
        ],
        decorations: [
            { type: "ruin", x: 560, y: 140, size: 50 },
            { type: "tree", x: 100, y: 480, size: 42 },
            { type: "tree", x: 120, y: 600, size: 36 },
            { type: "tree", x: 1220, y: 150, size: 38 },
            { type: "rock", x: 740, y: 600, size: 28 }
        ],
        waves: [
            { creeps: [{ type: "scout", count: 20, interval: 0.6 }], reward: 60 },
            { creeps: [{ type: "crawler", count: 26, interval: 0.5 }, { type: "bat", count: 12, interval: 0.8 }], reward: 80 },
            { creeps: [{ type: "shaman", count: 4, interval: 2.0 }, { type: "gorilla", count: 8, interval: 1.8 }], reward: 100 },
            { creeps: [{ type: "bat", count: 20, interval: 0.6 }, { type: "crawler", count: 30, interval: 0.4 }], reward: 120 },
            { creeps: [{ type: "gorilla", count: 12, interval: 1.5 }, { type: "shaman", count: 6, interval: 1.8 }], reward: 140 },
            { creeps: [{ type: "crawler", count: 40, interval: 0.3 }, { type: "bat", count: 16, interval: 0.6 }], reward: 160 },
            { creeps: [{ type: "gorilla", count: 16, interval: 1.2 }, { type: "shaman", count: 8, interval: 1.4 }], reward: 190 },
            // FINAL WAVE: EPIC JUNGLE TITAN BOSS
            {
                creeps: [
                    { type: "jungle_boss", count: 1, interval: 1.0 },
                    { type: "shaman", count: 4, interval: 2.0 },
                    { type: "gorilla", count: 6, interval: 2.0 }
                ],
                reward: 350
            }
        ]
    },

    // -------------------------------------------------------------
    // LEVEL 6: Frostbite Pass (Transition to Snow Theme!)
    // -------------------------------------------------------------
    {
        id: 6,
        name: "Frostbite Pass",
        biome: "snow",
        difficulty: "Hard",
        description: "Welcome to the frozen realm! Swift Frost Wolves rush through icy mountain ravines. Deploy Solar Spires to burn through ice.",
        startingGold: 650,
        startingLives: 20,
        path: [
            { x: -30, y: 180 },
            { x: 300, y: 180 },
            { x: 300, y: 520 },
            { x: 640, y: 520 },
            { x: 640, y: 240 },
            { x: 960, y: 240 },
            { x: 960, y: 540 },
            { x: 1310, y: 540 }
        ],
        buildSlots: [
            { id: 601, x: 180, y: 280 },
            { id: 602, x: 180, y: 440 },
            { id: 603, x: 420, y: 400 },
            { id: 604, x: 520, y: 400 },
            { id: 605, x: 520, y: 140 },
            { id: 606, x: 760, y: 340 },
            { id: 607, x: 840, y: 340 },
            { id: 608, x: 840, y: 140 },
            { id: 609, x: 1080, y: 380 },
            { id: 610, x: 1180, y: 420 }
        ],
        decorations: [
            { type: "iceberg", x: 140, y: 80, size: 36 },
            { type: "pine", x: 450, y: 110, size: 38 },
            { type: "pine", x: 740, y: 580, size: 34 },
            { type: "pine", x: 1100, y: 140, size: 36 },
            { type: "snowbank", x: 460, y: 590, size: 40 },
            { type: "rune", x: 960, y: 120, size: 24 }
        ],
        waves: [
            { creeps: [{ type: "frost_wolf", count: 16, interval: 0.7 }], reward: 60 },
            { creeps: [{ type: "ice_revenant", count: 10, interval: 1.1 }], reward: 70 },
            { creeps: [{ type: "frost_wolf", count: 18, interval: 0.6 }, { type: "ice_revenant", count: 8, interval: 1.0 }], reward: 85 },
            { creeps: [{ type: "yeti", count: 3, interval: 3.5 }, { type: "frost_wolf", count: 14, interval: 0.6 }], reward: 105 },
            { creeps: [{ type: "ice_revenant", count: 16, interval: 0.8 }, { type: "yeti", count: 4, interval: 2.5 }], reward: 125 },
            { creeps: [{ type: "frost_wolf", count: 25, interval: 0.4 }, { type: "yeti", count: 6, interval: 2.0 }], reward: 150 }
        ]
    },

    // -------------------------------------------------------------
    // LEVEL 7: Glacial Chasm (Introduces Flying Wyverns)
    // -------------------------------------------------------------
    {
        id: 7,
        name: "Glacial Chasm",
        biome: "snow",
        difficulty: "Hard",
        description: "Blizzard Wyverns fly over jagged ice chasms. Keep your anti-air towers centrally positioned.",
        startingGold: 700,
        startingLives: 20,
        path: [
            { x: 300, y: -30 },
            { x: 300, y: 320 },
            { x: 620, y: 320 },
            { x: 620, y: 160 },
            { x: 960, y: 160 },
            { x: 960, y: 520 },
            { x: 600, y: 520 },
            { x: 600, y: 750 }
        ],
        airPath: [
            { x: 300, y: -30 },
            { x: 600, y: 300 },
            { x: 600, y: 750 }
        ],
        buildSlots: [
            { id: 701, x: 180, y: 220 },
            { id: 702, x: 420, y: 220 },
            { id: 703, x: 480, y: 420 },
            { id: 704, x: 740, y: 240 },
            { id: 705, x: 840, y: 260 },
            { id: 706, x: 840, y: 420 },
            { id: 707, x: 740, y: 620 },
            { id: 708, x: 1080, y: 340 },
            { id: 709, x: 1080, y: 520 }
        ],
        decorations: [
            { type: "pine", x: 120, y: 460, size: 38 },
            { type: "pine", x: 780, y: 80, size: 36 },
            { type: "iceberg", x: 460, y: 580, size: 32 },
            { type: "rune", x: 1160, y: 200, size: 26 },
            { type: "snowbank", x: 960, y: 640, size: 38 }
        ],
        waves: [
            { creeps: [{ type: "frost_wolf", count: 18, interval: 0.6 }], reward: 65 },
            { creeps: [{ type: "wyvern", count: 10, interval: 1.1 }], reward: 80 },
            { creeps: [{ type: "ice_revenant", count: 14, interval: 0.9 }, { type: "wyvern", count: 8, interval: 1.0 }], reward: 100 },
            { creeps: [{ type: "yeti", count: 4, interval: 2.8 }, { type: "wyvern", count: 12, interval: 0.8 }], reward: 120 },
            { creeps: [{ type: "frost_witch", count: 4, interval: 2.5 }, { type: "ice_revenant", count: 16, interval: 0.7 }], reward: 140 },
            { creeps: [{ type: "wyvern", count: 20, interval: 0.6 }, { type: "frost_wolf", count: 24, interval: 0.4 }], reward: 170 },
            { creeps: [{ type: "yeti", count: 7, interval: 2.0 }, { type: "frost_witch", count: 6, interval: 2.0 }], reward: 200 }
        ]
    },

    // -------------------------------------------------------------
    // LEVEL 8: Blizzard Ridge (Frost Witches + Armored Yetis)
    // -------------------------------------------------------------
    {
        id: 8,
        name: "Blizzard Ridge",
        biome: "snow",
        difficulty: "Expert",
        description: "Frost Witches cast protective ice shields on Glacial Yetis. High damage Solar and Tesla towers are essential.",
        startingGold: 750,
        startingLives: 20,
        path: [
            { x: -30, y: 560 },
            { x: 340, y: 560 },
            { x: 340, y: 220 },
            { x: 680, y: 220 },
            { x: 680, y: 540 },
            { x: 1020, y: 540 },
            { x: 1020, y: 160 },
            { x: 1310, y: 160 }
        ],
        airPath: [
            { x: -30, y: 560 },
            { x: 500, y: 380 },
            { x: 850, y: 350 },
            { x: 1310, y: 160 }
        ],
        buildSlots: [
            { id: 801, x: 220, y: 440 },
            { id: 802, x: 220, y: 280 },
            { id: 803, x: 460, y: 360 },
            { id: 804, x: 560, y: 360 },
            { id: 805, x: 560, y: 120 },
            { id: 806, x: 800, y: 380 },
            { id: 807, x: 900, y: 380 },
            { id: 808, x: 900, y: 640 },
            { id: 809, x: 1140, y: 320 },
            { id: 810, x: 1140, y: 480 }
        ],
        decorations: [
            { type: "pine", x: 100, y: 120, size: 40 },
            { type: "pine", x: 740, y: 90, size: 36 },
            { type: "iceberg", x: 1160, y: 620, size: 44 },
            { type: "rune", x: 440, y: 580, size: 28 },
            { type: "snowbank", x: 680, y: 640, size: 35 }
        ],
        waves: [
            { creeps: [{ type: "frost_wolf", count: 20, interval: 0.6 }], reward: 70 },
            { creeps: [{ type: "ice_revenant", count: 18, interval: 0.8 }, { type: "wyvern", count: 10, interval: 0.9 }], reward: 90 },
            { creeps: [{ type: "frost_witch", count: 5, interval: 2.2 }, { type: "yeti", count: 5, interval: 2.2 }], reward: 110 },
            { creeps: [{ type: "wyvern", count: 18, interval: 0.7 }, { type: "frost_wolf", count: 22, interval: 0.5 }], reward: 130 },
            { creeps: [{ type: "frost_witch", count: 7, interval: 1.8 }, { type: "yeti", count: 8, interval: 1.8 }], reward: 160 },
            { creeps: [{ type: "ice_revenant", count: 26, interval: 0.6 }, { type: "frost_witch", count: 8, interval: 1.6 }], reward: 190 },
            { creeps: [{ type: "yeti", count: 12, interval: 1.5 }, { type: "wyvern", count: 22, interval: 0.6 }], reward: 230 }
        ]
    },

    // -------------------------------------------------------------
    // LEVEL 9: The Icefang Gorge (Split Forking Challenge)
    // -------------------------------------------------------------
    {
        id: 9,
        name: "The Icefang Gorge",
        biome: "snow",
        difficulty: "Expert",
        description: "Enemies attack through an extended looping gorge with intense cold. Chain Lightning and Solar beams will shine here.",
        startingGold: 800,
        startingLives: 20,
        path: [
            { x: -30, y: 260 },
            { x: 260, y: 260 },
            { x: 260, y: 560 },
            { x: 600, y: 560 },
            { x: 600, y: 160 },
            { x: 920, y: 160 },
            { x: 920, y: 520 },
            { x: 1160, y: 520 },
            { x: 1160, y: 260 },
            { x: 1310, y: 260 }
        ],
        airPath: [
            { x: -30, y: 260 },
            { x: 600, y: 360 },
            { x: 1310, y: 260 }
        ],
        buildSlots: [
            { id: 901, x: 140, y: 380 },
            { id: 902, x: 380, y: 380 },
            { id: 903, x: 480, y: 380 },
            { id: 904, x: 480, y: 160 },
            { id: 905, x: 720, y: 340 },
            { id: 906, x: 800, y: 340 },
            { id: 907, x: 800, y: 580 },
            { id: 908, x: 1040, y: 360 },
            { id: 909, x: 1040, y: 160 },
            { id: 910, x: 1220, y: 400 }
        ],
        decorations: [
            { type: "pine", x: 140, y: 120, size: 40 },
            { type: "iceberg", x: 600, y: 640, size: 42 },
            { type: "rune", x: 760, y: 120, size: 28 },
            { type: "pine", x: 1240, y: 120, size: 36 },
            { type: "snowbank", x: 360, y: 640, size: 36 }
        ],
        waves: [
            { creeps: [{ type: "frost_wolf", count: 24, interval: 0.5 }], reward: 80 },
            { creeps: [{ type: "ice_revenant", count: 20, interval: 0.7 }, { type: "wyvern", count: 12, interval: 0.8 }], reward: 100 },
            { creeps: [{ type: "frost_witch", count: 6, interval: 2.0 }, { type: "yeti", count: 7, interval: 2.0 }], reward: 120 },
            { creeps: [{ type: "wyvern", count: 22, interval: 0.6 }, { type: "frost_wolf", count: 28, interval: 0.4 }], reward: 150 },
            { creeps: [{ type: "yeti", count: 10, interval: 1.6 }, { type: "frost_witch", count: 8, interval: 1.6 }], reward: 180 },
            { creeps: [{ type: "ice_revenant", count: 32, interval: 0.5 }, { type: "wyvern", count: 20, interval: 0.6 }], reward: 210 },
            { creeps: [{ type: "yeti", count: 15, interval: 1.3 }, { type: "frost_witch", count: 10, interval: 1.4 }], reward: 260 }
        ]
    },

    // -------------------------------------------------------------
    // LEVEL 10: Throne of the Frost King (FINAL BOSS 2)
    // -------------------------------------------------------------
    {
        id: 10,
        name: "Throne of the Frost King",
        biome: "snow",
        difficulty: "Final Boss",
        description: "The Glacial Behemoth reigns over the frozen spire. Withstand devastating assault waves and defeat the ruler of the frost!",
        startingGold: 900,
        startingLives: 20,
        path: [
            { x: -30, y: 360 },
            { x: 260, y: 360 },
            { x: 260, y: 160 },
            { x: 580, y: 160 },
            { x: 580, y: 560 },
            { x: 920, y: 560 },
            { x: 920, y: 220 },
            { x: 1160, y: 220 },
            { x: 1160, y: 440 },
            { x: 1310, y: 440 }
        ],
        airPath: [
            { x: -30, y: 360 },
            { x: 580, y: 360 },
            { x: 1310, y: 440 }
        ],
        buildSlots: [
            { id: 1001, x: 150, y: 260 },
            { id: 1002, x: 150, y: 480 },
            { id: 1003, x: 380, y: 280 },
            { id: 1004, x: 460, y: 280 },
            { id: 1005, x: 460, y: 460 },
            { id: 1006, x: 740, y: 360 },
            { id: 1007, x: 800, y: 360 },
            { id: 1008, x: 800, y: 140 },
            { id: 1009, x: 1040, y: 360 },
            { id: 1010, x: 1040, y: 540 },
            { id: 1011, x: 1220, y: 320 }
        ],
        decorations: [
            { type: "rune", x: 580, y: 360, size: 36 },
            { type: "iceberg", x: 120, y: 100, size: 48 },
            { type: "iceberg", x: 1200, y: 100, size: 52 },
            { type: "pine", x: 700, y: 120, size: 38 },
            { type: "pine", x: 1060, y: 640, size: 40 },
            { type: "snowbank", x: 360, y: 640, size: 42 }
        ],
        waves: [
            { creeps: [{ type: "frost_wolf", count: 24, interval: 0.5 }], reward: 80 },
            { creeps: [{ type: "ice_revenant", count: 22, interval: 0.6 }, { type: "wyvern", count: 14, interval: 0.7 }], reward: 100 },
            { creeps: [{ type: "frost_witch", count: 6, interval: 1.8 }, { type: "yeti", count: 8, interval: 1.8 }], reward: 130 },
            { creeps: [{ type: "wyvern", count: 26, interval: 0.5 }, { type: "frost_wolf", count: 30, interval: 0.4 }], reward: 160 },
            { creeps: [{ type: "yeti", count: 14, interval: 1.4 }, { type: "frost_witch", count: 10, interval: 1.5 }], reward: 190 },
            { creeps: [{ type: "ice_revenant", count: 36, interval: 0.5 }, { type: "wyvern", count: 24, interval: 0.5 }], reward: 220 },
            { creeps: [{ type: "yeti", count: 18, interval: 1.2 }, { type: "frost_witch", count: 12, interval: 1.2 }], reward: 260 },
            // FINAL WAVE: GLACIAL BEHEMOTH FINAL BOSS
            {
                creeps: [
                    { type: "frost_boss", count: 1, interval: 1.0 },
                    { type: "frost_witch", count: 6, interval: 1.5 },
                    { type: "yeti", count: 8, interval: 1.8 },
                    { type: "wyvern", count: 16, interval: 0.8 }
                ],
                reward: 500
            }
        ]
    }
];

window.LEVELS = LEVELS;
