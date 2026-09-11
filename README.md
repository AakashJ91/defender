# Frontier Defense: Jungle & Frost 🏰🌿❄️

An action-packed Tower Defense game created for **Android** and web browsers, featuring **10 progressive levels** across two atmospheric biomes: **The Deep Jungle** (Levels 1–5) and **The Glacial Tundra** (Levels 6–10).

---

## 🎮 Game Features

### 🌴 Biomes & Atmosphere
- **The Deep Jungle (Levels 1 – 5)**:
  - Rainforest trails, river crossings, overgrown ancient ruins, and canopy bridges.
  - Atmospheric ambient rain particles and soundscapes.
  - Enemies: Goblins, Venom Crawlers, Canopy Drakes (flying), Armored Gorillas, Tribal Shamans (healers), and the **Level 5 Boss: Ancient Jungle Titan**.
- **The Glacial Tundra (Levels 6 – 10)**:
  - Slippery frost trails, ice chasms, frozen pines, and glowing ancient runes.
  - Swirling blizzard particle effects and ice shatter dynamics.
  - Enemies: Frost Wolves (speed rushers), Ice Revenants (slow-immune), Blizzard Wyverns (airborne), Glacial Yetis (massive tanks), Frost Witches (shield casters), and the **Level 10 Boss: Glacial Behemoth**.

### 🏹 5 Upgradable Tower Archetypes
Each tower features 3 upgrade tiers with stat scaling:
1. **Dart Spire** (100G): High attack speed, single target, can strike flying units. Upgrades into *Swift Blowpipe* and *Jungle Ballista*.
2. **Bombard Cannon** (150G): Heavy area-of-effect explosive shell dealing splash damage to ground swarms. Upgrades into *Mortar Battery* and *Magma Siege Gun*.
3. **Cryo Obelisk** (125G): Freezing cold projectile creating an icy blast that slows and chills enemies. Upgrades into *Glacial Pylon* and *Blizzard Sanctum*.
4. **Tesla Coil** (175G): Electric arc generator firing chain lightning jumping between up to 6 targets. Upgrades into *Arc Capacitor* and *Storm Conductor*.
5. **Solar Spire** (160G): Continuous concentrated thermal ray melting heavily armored enemies with persistent fireburn. Upgrades into *Inferno Core* and *Sun God Ray*.

### ⚡ Active Spells (Cooldown Abilities)
- **Meteor Strike (☄️, 80G)**: Call down an explosive meteor on any target location on the map.
- **Glacial Frost (❄️, 65G)**: Instantly flash-freezes all active enemies across the entire map for 4 seconds.
- **Battle Horn (📯, 50G)**: Grants all towers on the field +60% attack speed for 7 seconds.

### 📱 Mobile & Android Features
- **Hero Landing Screen**: Beautiful title screen on startup with **Continue Mission** (jumps to highest unlocked level), **Start New Game** (starts from Level 1), **Level Selector** (shows 10-level campaign grid with stars), and **Settings**.
- **Return to Title (🏠 Title button)**: Seamlessly return to the main landing menu from in-game HUD at any time.
- **Touch-Friendly Controls**: Large responsive touch targets, radial build drawer, interactive tower inspector with upgrade/sell and target priority selectors (First, Last, Strongest, Weakest, Closest).
- **Sticky Immersive Fullscreen**: Full edge-to-edge landscape gaming on Android.
- **Haptic Vibration**: Native Android vibration feedback on tower placement, spell impacts, and base breaches via `@JavascriptInterface`.
- **Procedural Canvas & Web Audio**: Crisp 60fps rendering with zero external sprite sheet or audio loading delays.
- **Progress Persistence**: Saves 3-star ratings, high scores, and level unlocks in local storage.
- **Game Speed Toggles**: 1x, 2x, 4x speed and Pause/Resume.

---

## 🚀 How to Play

### Option 1: Direct Android APK Install (Ready Now!)
The pre-compiled debug APK is located at:
📁 **`apk/FrontierDefense.apk`**

To install on your phone:
1. Connect your Android phone to your PC via USB with **USB Debugging** enabled.
2. Double-click **`install_to_phone.bat`** (or run `adb install -r apk\FrontierDefense.apk`).
3. The game will install and launch automatically!

*Alternatively, you can transfer `apk/FrontierDefense.apk` directly to your phone via Google Drive, WhatsApp, or USB cable and tap to install.*

### Option 2: Instant Browser Playtest
You can play and test all 10 levels right in your web browser:
1. Double-click **`play_browser.bat`** (starts a local server on port 8080).
2. Open **`http://localhost:8080`** in Chrome, Edge, Safari, or your mobile browser.
3. Or simply double-click `web/index.html` to open it directly!

### Option 3: Android Studio Project
Open the `android/` folder in **Android Studio**:
- SDK: API 36 / 37
- Gradle: 9.5
- Build target: `./gradlew assembleDebug`
