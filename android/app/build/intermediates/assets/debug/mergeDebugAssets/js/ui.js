// UI Management: Mobile Touch/Mouse Controls, HUD, Modals, Menus, Spells
class UIManager {
    constructor(engine) {
        this.engine = engine;
        this.selectedLevelWeather = 'default';
        this.initDOMElements();
        this.bindEvents();
        this.loadProgress();
        this.showLandingScreen();
    }

    initDOMElements() {
        // Landing Screen
        this.screenLanding = document.getElementById('screen-landing');
        this.btnLandingContinue = document.getElementById('btn-landing-continue');
        this.btnLandingStart = document.getElementById('btn-landing-start');
        this.btnLandingLevels = document.getElementById('btn-landing-levels');
        this.btnLandingSettings = document.getElementById('btn-landing-settings');
        this.landingContinueSub = document.getElementById('landing-continue-sub');
        this.landingStarsSub = document.getElementById('landing-stars-sub');

        // HUD stats
        this.hudTopBar = document.getElementById('hud-top-bar');
        this.btnHomeMenu = document.getElementById('btn-home-menu');
        this.elLives = document.getElementById('hud-lives');
        this.elGold = document.getElementById('hud-gold');
        this.elWave = document.getElementById('hud-wave');
        this.elLevelName = document.getElementById('hud-level-name');
        this.hudWeatherPill = document.getElementById('hud-weather-pill');
        this.hudWeatherIcon = document.getElementById('hud-weather-icon');
        this.hudWeatherName = document.getElementById('hud-weather-name');
        this.btnWeatherWidgetToggle = document.getElementById('btn-weather-widget-toggle');
        this.btnStartWave = document.getElementById('btn-start-wave');
        this.btnSpeed = document.getElementById('btn-speed');
        this.btnPause = document.getElementById('btn-pause');

        // Menus & Modals
        this.modalLevelSelect = document.getElementById('modal-level-select');
        this.modalVictory = document.getElementById('modal-victory');
        this.modalDefeat = document.getElementById('modal-defeat');
        this.modalSettings = document.getElementById('modal-settings');
        this.btnToggleWeather = document.getElementById('btn-toggle-weather');
        this.modalCodex = document.getElementById('modal-codex');
        this.btnLandingCodex = document.getElementById('btn-landing-codex');
        this.btnCloseCodex = document.getElementById('btn-close-codex');
        this.panelTowerInspect = document.getElementById('panel-tower-inspect');
        this.drawerBuild = document.getElementById('drawer-build');

        // On-Map Weather Widget & Alert Banner
        this.weatherStationWidget = document.getElementById('weather-station-widget');
        this.wwIcon = document.getElementById('ww-icon');
        this.wwName = document.getElementById('ww-name');
        this.wwBiome = document.getElementById('ww-biome');
        this.wwWind = document.getElementById('ww-wind');
        this.wwIntensity = document.getElementById('ww-intensity');
        this.wwEffects = document.getElementById('ww-effects');
        this.wwBody = document.getElementById('ww-body');
        this.btnWwCollapse = document.getElementById('btn-ww-collapse');
        this.btnWwClose = document.getElementById('btn-ww-close');
        this.btnWwLightning = document.getElementById('btn-ww-lightning');
        this.btnWwAutoCycle = document.getElementById('btn-ww-autocycle');

        this.weatherBanner = document.getElementById('weather-banner');
        this.weatherBannerIcon = document.getElementById('weather-banner-icon');
        this.weatherBannerTitle = document.getElementById('weather-banner-title');
        this.weatherBannerSub = document.getElementById('weather-banner-sub');
        this.weatherBannerTimeout = null;

        // In-Level Quick Weather Toolbar
        this.hudQuickWeatherBar = document.getElementById('hud-quick-weather-bar');
        this.btnQwbLightning = document.getElementById('btn-qwb-lightning');
        this.btnQwbExpand = document.getElementById('btn-qwb-expand');

        // Landing Weather Button
        this.btnLandingWeather = document.getElementById('btn-landing-weather');

        // Mission Launch & Weather Selector Modal
        this.modalMissionLaunch = document.getElementById('modal-mission-launch');
        this.mlBiomeTag = document.getElementById('ml-biome-tag');
        this.mlTitle = document.getElementById('ml-title');
        this.mlDesc = document.getElementById('ml-desc');
        this.mwsDesc = document.getElementById('mws-desc');
        this.btnMlBack = document.getElementById('btn-ml-back');
        this.btnMlDeploy = document.getElementById('btn-ml-deploy');
        // In-Level Weather Selection Button & Modal
        this.btnInlevelWeather = document.getElementById('btn-inlevel-weather-selector');
        this.btnInlevelWeatherIcon = document.getElementById('btn-inlevel-weather-icon');
        this.btnInlevelWeatherText = document.getElementById('btn-inlevel-weather-text');
        this.modalInlevelWeather = document.getElementById('modal-inlevel-weather');
        this.btnIwLightning = document.getElementById('btn-iw-lightning');
        this.btnIwAutoCycle = document.getElementById('btn-iw-autocycle');
        this.btnIwClose = document.getElementById('btn-iw-close');

        // Spells
        this.spellsDrawer = document.getElementById('spells-drawer');
        this.btnSpellMeteor = document.getElementById('spell-meteor');
        this.btnSpellFreeze = document.getElementById('spell-freeze');
        this.btnSpellRush = document.getElementById('spell-rush');
    }

    bindEvents() {
        const canvas = this.engine.canvas;

        // Landing Screen Button Events
        if (this.btnLandingContinue) {
            this.btnLandingContinue.addEventListener('click', () => {
                const nextLevel = this.getHighestUnlockedLevel();
                this.hideLandingScreen();
                this.startLevel(nextLevel);
            });
        }

        if (this.btnLandingStart) {
            this.btnLandingStart.addEventListener('click', () => {
                this.hideLandingScreen();
                this.startLevel(1);
            });
        }

        if (this.btnLandingLevels) {
            this.btnLandingLevels.addEventListener('click', () => {
                this.showLevelSelect();
            });
        }

        if (this.btnLandingWeather) {
            this.btnLandingWeather.addEventListener('click', () => {
                this.showLevelSelect();
            });
        }

        if (this.btnLandingSettings) {
            this.btnLandingSettings.addEventListener('click', () => {
                this.modalSettings.classList.remove('hidden');
            });
        }

        if (this.btnLandingCodex) {
            this.btnLandingCodex.addEventListener('click', () => {
                this.modalCodex.classList.remove('hidden');
            });
        }

        if (this.btnCloseCodex) {
            this.btnCloseCodex.addEventListener('click', () => {
                this.modalCodex.classList.add('hidden');
            });
        }

        if (this.btnHomeMenu) {
            this.btnHomeMenu.addEventListener('click', () => {
                this.showLandingScreen();
            });
        }

        // Pointer/touch handler on canvas
        canvas.addEventListener('pointerdown', (e) => this.handleCanvasPointer(e));

        // Start Wave Button
        this.btnStartWave.addEventListener('click', () => {
            this.engine.startNextWave();
        });

        // Speed toggle (1x -> 2x -> 4x)
        this.btnSpeed.addEventListener('click', () => {
            if (this.engine.speed === 1) this.engine.speed = 2;
            else if (this.engine.speed === 2) this.engine.speed = 4;
            else this.engine.speed = 1;
            this.btnSpeed.textContent = `${this.engine.speed}x`;
        });

        // Pause toggle
        this.btnPause.addEventListener('click', () => {
            this.engine.isPaused = !this.engine.isPaused;
            this.btnPause.textContent = this.engine.isPaused ? '▶️' : '⏸️';
        });

        // Level Select button on HUD
        document.getElementById('btn-levels-menu').addEventListener('click', () => {
            this.showLevelSelect();
        });

        // Settings button on HUD
        document.getElementById('btn-settings-menu').addEventListener('click', () => {
            this.modalSettings.classList.remove('hidden');
        });

        // Close settings
        document.getElementById('btn-close-settings').addEventListener('click', () => {
            this.modalSettings.classList.add('hidden');
        });

        // Sound toggle
        const btnMute = document.getElementById('btn-toggle-sound');
        btnMute.addEventListener('click', () => {
            const isMuted = window.soundEngine.toggleMute();
            btnMute.textContent = isMuted ? '🔇 Sound: OFF' : '🔊 Sound: ON';
        });

        // Weather toggle in settings modal
        if (this.btnToggleWeather) {
            const updateWeatherBtnText = () => {
                const currentMode = this.engine.weatherSystem ? this.engine.weatherSystem.mode : 'dynamic';
                const labels = {
                    dynamic: '🌦️ Weather: Dynamic (Full)',
                    mild: '🌦️ Weather: Mild (Light)',
                    off: '🌦️ Weather: Disabled (Off)'
                };
                this.btnToggleWeather.textContent = labels[currentMode] || labels.dynamic;
            };
            updateWeatherBtnText();

            this.btnToggleWeather.addEventListener('click', () => {
                if (!this.engine.weatherSystem) return;
                const modes = ['dynamic', 'mild', 'off'];
                const nextIdx = (modes.indexOf(this.engine.weatherSystem.mode) + 1) % modes.length;
                this.engine.weatherSystem.setMode(modes[nextIdx]);
                updateWeatherBtnText();
                this.updateHUD();
            });
        }

        // Weather toggle click in HUD
        if (this.hudWeatherPill) {
            this.hudWeatherPill.addEventListener('click', () => {
                if (this.weatherStationWidget) {
                    this.weatherStationWidget.classList.toggle('hidden');
                    this.updateWeatherWidget();
                }
            });
        }

        if (this.btnWeatherWidgetToggle) {
            this.btnWeatherWidgetToggle.addEventListener('click', () => {
                if (this.weatherStationWidget) {
                    this.weatherStationWidget.classList.toggle('hidden');
                    this.updateWeatherWidget();
                }
            });
        }

        if (this.btnWwClose) {
            this.btnWwClose.addEventListener('click', () => {
                if (this.weatherStationWidget) this.weatherStationWidget.classList.add('hidden');
            });
        }

        if (this.btnWwCollapse) {
            this.btnWwCollapse.addEventListener('click', () => {
                if (this.wwBody) {
                    this.wwBody.classList.toggle('collapsed');
                    this.btnWwCollapse.textContent = this.wwBody.classList.contains('collapsed') ? '+' : '−';
                }
            });
        }

        // Direct weather select buttons (in station widget)
        document.querySelectorAll('.btn-weather-select').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const wKey = e.currentTarget.dataset.weather;
                if (this.engine.weatherSystem) {
                    this.engine.weatherSystem.setWeather(wKey, 1.2);
                    this.updateHUD();
                    this.updateWeatherWidget();
                }
            });
        });

        // In-Level Quick Weather Toolbar Buttons (Always visible during gameplay)
        document.querySelectorAll('.qwb-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const wKey = e.currentTarget.dataset.weather;
                if (this.engine.weatherSystem) {
                    this.engine.weatherSystem.setWeather(wKey, 1.2);
                    this.updateHUD();
                    this.updateWeatherWidget();
                }
            });
        });

        if (this.btnQwbLightning) {
            this.btnQwbLightning.addEventListener('click', () => {
                if (this.engine.weatherSystem) {
                    this.engine.weatherSystem.triggerLightningStrike();
                }
            });
        }

        if (this.btnQwbExpand) {
            this.btnQwbExpand.addEventListener('click', () => {
                if (this.weatherStationWidget) {
                    this.weatherStationWidget.classList.toggle('hidden');
                    this.updateWeatherWidget();
                }
            });
        }

        // Mission Launch Modal Weather Chips
        const weatherDescMap = {
            'default': '🎲 Natural dynamic atmospheric shifts and wave-triggered changes.',
            'clear': '☀️ Golden sunbeams, crystal clear visibility, and gentle warm breeze.',
            'rain_light': '🌦️ Tropical rain shower with soothing droplet sounds and ground ripples.',
            'thunderstorm': '⛈️ Dark skies, heavy deluge, rolling thunder and dangerous lightning strikes!',
            'fog': '🌫️ Thick volumetric rolling mist that blankets trails and spire bases.',
            'windy': '🍃 Fast gale winds whipping through the realm with flying leaf vortexes.',
            'snow_light': '❄️ Crisp sub-zero air with gentle drifting snow crystals.',
            'blizzard': '🌨️ Howling sub-zero winds, near whiteout snow sheets, and severe frost.',
            'aurora': '🌌 Celestial northern lights with undulating turquoise and violet curtain hues.'
        };

        document.querySelectorAll('.mws-chip').forEach(chip => {
            chip.addEventListener('click', (e) => {
                const wKey = e.currentTarget.dataset.weather;
                this.pendingMissionWeather = wKey;
                document.querySelectorAll('.mws-chip').forEach(c => c.classList.remove('active'));
                e.currentTarget.classList.add('active');
                if (this.mwsDesc && weatherDescMap[wKey]) {
                    this.mwsDesc.textContent = weatherDescMap[wKey];
                }
            });
        });

        if (this.btnMlBack) {
            this.btnMlBack.addEventListener('click', () => {
                if (this.modalMissionLaunch) this.modalMissionLaunch.classList.add('hidden');
                if (this.modalLevelSelect) this.modalLevelSelect.classList.remove('hidden');
            });
        }

        if (this.btnMlDeploy) {
            this.btnMlDeploy.addEventListener('click', () => {
                if (this.modalMissionLaunch) this.modalMissionLaunch.classList.add('hidden');
                if (this.modalLevelSelect) this.modalLevelSelect.classList.add('hidden');
                if (this.pendingMissionLevel) {
                    this.selectedLevelWeather = this.pendingMissionWeather;
                    this.startLevel(this.pendingMissionLevel);
                }
            });
        }

        // In-Level Weather Selection Button (Top-left on screen during play)
        if (this.btnInlevelWeather) {
            this.btnInlevelWeather.addEventListener('click', () => {
                if (this.modalInlevelWeather) {
                    this.modalInlevelWeather.classList.remove('hidden');
                    this.updateInlevelWeatherModal();
                }
            });
        }

        // In-level weather modal card buttons
        document.querySelectorAll('.btn-iw-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const wKey = e.currentTarget.dataset.weather;
                if (this.engine.weatherSystem) {
                    this.engine.weatherSystem.setWeather(wKey, 1.2);
                    this.updateHUD();
                    this.updateWeatherWidget();
                    this.updateInlevelWeatherModal();
                }
            });
        });

        if (this.btnIwLightning) {
            this.btnIwLightning.addEventListener('click', () => {
                if (this.engine.weatherSystem) {
                    this.engine.weatherSystem.triggerLightningStrike();
                }
            });
        }

        if (this.btnIwAutoCycle) {
            this.btnIwAutoCycle.addEventListener('click', () => {
                if (this.engine.weatherSystem) {
                    this.engine.weatherSystem.autoCycle = !this.engine.weatherSystem.autoCycle;
                    this.updateInlevelWeatherModal();
                    this.updateWeatherWidget();
                }
            });
        }

        if (this.btnIwClose) {
            this.btnIwClose.addEventListener('click', () => {
                if (this.modalInlevelWeather) this.modalInlevelWeather.classList.add('hidden');
            });
        }

        // Trigger lightning button
        if (this.btnWwLightning) {
            this.btnWwLightning.addEventListener('click', () => {
                if (this.engine.weatherSystem) {
                    this.engine.weatherSystem.triggerLightningStrike();
                }
            });
        }

        // Toggle Auto-Cycle button
        if (this.btnWwAutoCycle) {
            this.btnWwAutoCycle.addEventListener('click', () => {
                if (this.engine.weatherSystem) {
                    this.engine.weatherSystem.autoCycle = !this.engine.weatherSystem.autoCycle;
                    this.updateWeatherWidget();
                }
            });
        }

        // Weather spell button (bottom-left in spells drawer)
        const btnSpellWeather = document.getElementById('btn-spell-weather');
        if (btnSpellWeather) {
            btnSpellWeather.addEventListener('click', () => {
                if (this.weatherStationWidget) {
                    this.weatherStationWidget.classList.toggle('hidden');
                    this.updateWeatherWidget();
                }
            });
        }

        // Level Select Weather Selector Pills
        document.querySelectorAll('.btn-lsw').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const w = e.currentTarget.dataset.weather;
                this.selectedLevelWeather = w;
                document.querySelectorAll('.btn-lsw').forEach(b => b.classList.remove('active'));
                e.currentTarget.classList.add('active');

                const selectedLabel = document.getElementById('lsw-selected-text');
                if (selectedLabel) {
                    selectedLabel.textContent = (w === 'default') ? 'Default (Natural Cycle)' : `Custom: ${e.currentTarget.textContent}`;
                }
            });
        });

        // Reset progress
        document.getElementById('btn-reset-data').addEventListener('click', () => {
            if (confirm('Reset all level progress and stars?')) {
                localStorage.removeItem('frontier_td_progress');
                this.loadProgress();
                this.renderLevelSelectGrid();
                this.updateLandingScreenInfo();
                alert('Progress reset.');
            }
        });

        // Spells clicks
        this.btnSpellMeteor.addEventListener('click', () => this.selectSpell('meteor'));
        this.btnSpellFreeze.addEventListener('click', () => this.selectSpell('freeze'));
        this.btnSpellRush.addEventListener('click', () => this.selectSpell('rush'));

        // Build Drawer tower buttons
        document.querySelectorAll('.btn-build-tower').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const type = e.currentTarget.dataset.type;
                if (this.engine.selectedSlot) {
                    this.engine.buildTower(this.engine.selectedSlot.id, type);
                    this.hideBuildDrawer();
                }
            });
        });

        // Tower inspector action buttons
        document.getElementById('btn-upgrade-tower').addEventListener('click', () => {
            if (this.engine.selectedTower) {
                this.engine.upgradeTower(this.engine.selectedTower);
            }
        });

        document.getElementById('btn-sell-tower').addEventListener('click', () => {
            if (this.engine.selectedTower) {
                this.engine.sellTower(this.engine.selectedTower);
            }
        });

        document.getElementById('select-priority').addEventListener('change', (e) => {
            if (this.engine.selectedTower) {
                this.engine.selectedTower.targetPriority = e.target.value;
            }
        });

        document.getElementById('btn-close-inspect').addEventListener('click', () => {
            this.hideTowerInfo();
        });

        // Victory Modal Buttons
        document.getElementById('btn-next-level').addEventListener('click', () => {
            this.modalVictory.classList.add('hidden');
            const nextId = this.engine.currentLevel.id + 1;
            if (nextId <= 10) {
                this.startLevel(nextId);
            } else {
                this.showLevelSelect();
            }
        });

        document.getElementById('btn-replay-level').addEventListener('click', () => {
            this.modalVictory.classList.add('hidden');
            this.startLevel(this.engine.currentLevel.id);
        });

        // Defeat Modal Buttons
        document.getElementById('btn-retry-level').addEventListener('click', () => {
            this.modalDefeat.classList.add('hidden');
            this.startLevel(this.engine.currentLevel.id);
        });

        document.getElementById('btn-defeat-levels').addEventListener('click', () => {
            this.modalDefeat.classList.add('hidden');
            this.showLevelSelect();
        });
    }

    getCanvasCoordinates(e) {
        const rect = this.engine.canvas.getBoundingClientRect();
        const scaleX = this.engine.width / rect.width;
        const scaleY = this.engine.height / rect.height;

        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY
        };
    }

    handleCanvasPointer(e) {
        // Resume audio context on user interaction
        if (window.soundEngine) window.soundEngine.resume();

        // If landing screen is open, ignore game canvas clicks
        if (this.screenLanding && !this.screenLanding.classList.contains('hidden')) {
            return;
        }

        const { x, y } = this.getCanvasCoordinates(e);

        // Check if casting active spell
        if (this.engine.activeSpell) {
            this.engine.castSpell(this.engine.activeSpell, x, y);
            this.engine.activeSpell = null;
            document.querySelectorAll('.spell-btn').forEach(b => b.classList.remove('active'));
            return;
        }

        // Check if tapping on-canvas tactical weather badge (top-left x: 12..230, y: 50..105)
        if (x >= 12 && x <= 230 && y >= 50 && y <= 105) {
            if (this.weatherStationWidget) {
                this.weatherStationWidget.classList.toggle('hidden');
                this.updateWeatherWidget();
            }
            return;
        }

        // Check if tapping an existing tower (Generous touch target)
        const clickedTower = this.engine.towers.find(t => Math.hypot(t.x - x, t.y - y) <= 46);
        if (clickedTower) {
            this.engine.selectedTower = clickedTower;
            this.engine.selectedSlot = null;
            this.hideBuildDrawer();
            this.showTowerInfo(clickedTower);
            return;
        }

        // Check if tapping a build slot (Generous touch target)
        const occupiedSlotIds = this.engine.towers.map(t => t.slotId);
        const clickedSlot = this.engine.currentLevel.buildSlots.find(s => {
            return !occupiedSlotIds.includes(s.id) && Math.hypot(s.x - x, s.y - y) <= 44;
        });

        if (clickedSlot) {
            this.engine.selectedSlot = clickedSlot;
            this.engine.selectedTower = null;
            this.hideTowerInfo();
            this.showBuildDrawer(clickedSlot);
            return;
        }

        // Tapped empty ground
        this.engine.selectedSlot = null;
        this.engine.selectedTower = null;
        this.hideBuildDrawer();
        this.hideTowerInfo();
    }

    selectSpell(spellKey) {
        if (this.engine.spellCooldowns[spellKey] > 0) return;
        const config = GAME_CONFIG.spells[spellKey];
        if (this.engine.gold < config.cost) return;

        if (spellKey === 'freeze' || spellKey === 'rush') {
            // Instant map-wide spells
            this.engine.castSpell(spellKey, 0, 0);
        } else {
            // Targeting spell (e.g. Meteor)
            if (this.engine.activeSpell === spellKey) {
                this.engine.activeSpell = null;
                document.getElementById(`spell-${spellKey}`).classList.remove('active');
            } else {
                this.engine.activeSpell = spellKey;
                document.querySelectorAll('.spell-btn').forEach(b => b.classList.remove('active'));
                document.getElementById(`spell-${spellKey}`).classList.add('active');
            }
        }
    }

    showBuildDrawer(slot) {
        this.drawerBuild.classList.remove('hidden');

        // Update affordability of tower buttons
        document.querySelectorAll('.btn-build-tower').forEach(btn => {
            const type = btn.dataset.type;
            const config = GAME_CONFIG.towers[type];
            if (this.engine.gold < config.cost) {
                btn.classList.add('disabled');
            } else {
                btn.classList.remove('disabled');
            }
        });
    }

    hideBuildDrawer() {
        this.drawerBuild.classList.add('hidden');
    }

    showTowerInfo(tower) {
        this.panelTowerInspect.classList.remove('hidden');

        document.getElementById('inspect-name').textContent = tower.name;
        document.getElementById('inspect-level').textContent = `Tier ${tower.level} ${'★'.repeat(tower.level)}`;
        document.getElementById('inspect-damage').textContent = Math.round(tower.damage);
        document.getElementById('inspect-firerate').textContent = tower.fireRate.toFixed(1) + '/s';
        document.getElementById('inspect-range').textContent = Math.round(tower.range);
        document.getElementById('select-priority').value = tower.targetPriority;

        const config = GAME_CONFIG.towers[tower.type];
        const nextUpgrade = config.upgrades.find(u => u.level === tower.level + 1);
        const btnUpgrade = document.getElementById('btn-upgrade-tower');

        if (nextUpgrade) {
            btnUpgrade.disabled = this.engine.gold < nextUpgrade.cost;
            btnUpgrade.innerHTML = `Upgrade to ${nextUpgrade.name}<br><span class="gold-badge">${nextUpgrade.cost}G</span>`;
            document.getElementById('inspect-upgrade-desc').textContent = nextUpgrade.desc;
        } else {
            btnUpgrade.disabled = true;
            btnUpgrade.textContent = 'MAX TIER REACHED';
            document.getElementById('inspect-upgrade-desc').textContent = 'Tower is at peak power!';
        }

        const refund = Math.floor(tower.totalInvested * 0.7);
        document.getElementById('btn-sell-tower').innerHTML = `Sell<br><span class="gold-badge">+${refund}G</span>`;
    }

    hideTowerInfo() {
        this.panelTowerInspect.classList.add('hidden');
    }

    showLevelSelect() {
        this.renderLevelSelectGrid();
        this.modalLevelSelect.classList.remove('hidden');
    }

    renderLevelSelectGrid() {
        const jungleContainer = document.getElementById('grid-jungle-levels');
        const snowContainer = document.getElementById('grid-snow-levels');
        jungleContainer.innerHTML = '';
        snowContainer.innerHTML = '';

        const progress = JSON.parse(localStorage.getItem('frontier_td_progress') || '{}');
        // Level 1 is always unlocked by default
        if (!progress[1]) progress[1] = { stars: 0, highscore: 0, unlocked: true };

        LEVELS.forEach(level => {
            const data = progress[level.id] || { stars: 0, highscore: 0, unlocked: false };
            const card = document.createElement('div');
            card.className = `level-card ${data.unlocked ? '' : 'locked'} ${level.difficulty === 'Boss' || level.difficulty === 'Final Boss' ? 'boss-card' : ''}`;

            let starsDisplay = '';
            for (let i = 1; i <= 3; i++) {
                starsDisplay += i <= data.stars ? '⭐' : '☆';
            }

            const levelWeathers = {
                1: '☀️ Sunlit Canopy',
                2: '🌦️ Tropical Rain',
                3: '☀️ Sunlit Canopy',
                4: '🌫️ River Mist',
                5: '⛈️ Tempest Boss',
                6: '❄️ Snowfall',
                7: '🌫️ Frost Mist',
                8: '❄️ Snowfall',
                9: '🌨️ Howling Blizzard',
                10: '🌌 Celestial Aurora Boss'
            };
            const defaultWeather = levelWeathers[level.id] || '🌦️ Dynamic';

            card.innerHTML = `
                <div class="level-num">Level ${level.id}</div>
                <div class="level-title">${level.name}</div>
                <div class="level-stars">${data.unlocked ? starsDisplay : '🔒 LOCKED'}</div>
                <div class="level-tag">${level.difficulty}</div>
                ${data.unlocked ? `
                <button class="btn-card-weather-select" data-level="${level.id}" title="Choose weather for Level ${level.id}">
                    <span class="bcw-text">${defaultWeather}</span>
                    <span class="bcw-arrow">▾</span>
                </button>
                ` : `<div class="level-weather-tag">🔒 Weather Locked</div>`}
            `;

            if (data.unlocked) {
                const weatherBtn = card.querySelector('.btn-card-weather-select');
                if (weatherBtn) {
                    weatherBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        this.showMissionLaunchModal(level);
                    });
                }

                card.addEventListener('click', () => {
                    this.showMissionLaunchModal(level);
                });
            }

            if (level.biome === 'jungle') {
                jungleContainer.appendChild(card);
            } else {
                snowContainer.appendChild(card);
            }
        });
    }

    showMissionLaunchModal(level) {
        this.pendingMissionLevel = level.id;
        this.pendingMissionWeather = this.selectedLevelWeather || 'default';

        if (this.modalLevelSelect) this.modalLevelSelect.classList.add('hidden');
        if (this.modalMissionLaunch) this.modalMissionLaunch.classList.remove('hidden');

        if (this.mlBiomeTag) {
            this.mlBiomeTag.textContent = level.biome === 'jungle' ? '🌿 JUNGLE REALM' : '❄️ FROZEN TUNDRA';
            this.mlBiomeTag.className = `mission-biome-badge ${level.biome}`;
        }
        if (this.mlTitle) {
            this.mlTitle.textContent = `LEVEL ${level.id}: ${level.name.toUpperCase()}`;
        }
        if (this.mlDesc) {
            const desc = level.description || `Tactical defense across ${level.waves ? level.waves.length : 5} enemy waves in ${level.biome === 'jungle' ? 'dense jungle terrain' : 'frigid arctic wastes'}.`;
            this.mlDesc.textContent = desc;
        }

        // Sync chips
        document.querySelectorAll('.mws-chip').forEach(c => {
            if (c.dataset.weather === this.pendingMissionWeather) {
                c.classList.add('active');
            } else {
                c.classList.remove('active');
            }
        });
    }

    startLevel(levelId) {
        this.hideLandingScreen();
        this.engine.loadLevel(levelId);
        if (this.selectedLevelWeather && this.selectedLevelWeather !== 'default' && this.engine.weatherSystem) {
            this.engine.weatherSystem.setWeather(this.selectedLevelWeather, 0.1);
        }
        if (this.weatherStationWidget) {
            this.updateWeatherWidget();
        }
        this.hideBuildDrawer();
        this.hideTowerInfo();
        this.updateHUD();
    }

    getHighestUnlockedLevel() {
        const progress = JSON.parse(localStorage.getItem('frontier_td_progress') || '{}');
        let highest = 1;
        for (let i = 1; i <= 10; i++) {
            if (progress[i] && progress[i].unlocked) {
                highest = i;
            }
        }
        return highest;
    }

    getTotalStarsEarned() {
        const progress = JSON.parse(localStorage.getItem('frontier_td_progress') || '{}');
        let total = 0;
        for (let i = 1; i <= 10; i++) {
            if (progress[i] && progress[i].stars) {
                total += progress[i].stars;
            }
        }
        return total;
    }

    updateLandingScreenInfo() {
        const highestLevelId = this.getHighestUnlockedLevel();
        const level = LEVELS.find(l => l.id === highestLevelId) || LEVELS[0];
        const totalStars = this.getTotalStarsEarned();

        if (this.landingContinueSub) {
            this.landingContinueSub.textContent = `Level ${level.id}: ${level.name}`;
        }
        if (this.landingStarsSub) {
            this.landingStarsSub.textContent = `10 Missions • ${totalStars}/30 ⭐`;
        }
    }

    showLandingScreen() {
        if (this.screenLanding) this.screenLanding.classList.remove('hidden');
        if (this.hudTopBar) this.hudTopBar.classList.add('hidden');
        if (this.hudQuickWeatherBar) this.hudQuickWeatherBar.classList.add('hidden');
        if (this.spellsDrawer) this.spellsDrawer.classList.add('hidden');
        if (this.weatherStationWidget) this.weatherStationWidget.classList.add('hidden');
        if (this.weatherBanner) this.weatherBanner.classList.add('hidden');
        if (this.btnInlevelWeather) this.btnInlevelWeather.classList.add('hidden');
        if (this.modalInlevelWeather) this.modalInlevelWeather.classList.add('hidden');
        this.hideBuildDrawer();
        this.hideTowerInfo();
        this.updateLandingScreenInfo();
    }

    hideLandingScreen() {
        if (this.screenLanding) this.screenLanding.classList.add('hidden');
        if (this.hudTopBar) this.hudTopBar.classList.remove('hidden');
        if (this.hudQuickWeatherBar) this.hudQuickWeatherBar.classList.remove('hidden');
        if (this.spellsDrawer) this.spellsDrawer.classList.remove('hidden');
        if (this.btnInlevelWeather) this.btnInlevelWeather.classList.remove('hidden');
        this.updateWeatherWidget();
    }

    showVictoryModal(stars, score) {
        this.updateLandingScreenInfo();
        this.modalVictory.classList.remove('hidden');
        let starStr = '';
        for (let i = 0; i < stars; i++) starStr += '⭐ ';
        document.getElementById('victory-stars').textContent = starStr;
        document.getElementById('victory-score').textContent = `Score: ${score}`;
        document.getElementById('victory-lives').textContent = `Hearts Left: ${this.engine.lives}/${this.engine.currentLevel.startingLives}`;
    }

    showDefeatModal() {
        this.modalDefeat.classList.remove('hidden');
    }

    closeModals() {
        this.modalLevelSelect.classList.add('hidden');
        this.modalVictory.classList.add('hidden');
        this.modalDefeat.classList.add('hidden');
        this.modalSettings.classList.add('hidden');
        if (this.modalCodex) this.modalCodex.classList.add('hidden');
        if (this.modalMissionLaunch) this.modalMissionLaunch.classList.add('hidden');
        if (this.modalInlevelWeather) this.modalInlevelWeather.classList.add('hidden');
        this.hideBuildDrawer();
        this.hideTowerInfo();
    }

    updateHUD() {
        if (!this.engine.currentLevel) return;

        this.elLives.textContent = this.engine.lives;
        this.elGold.textContent = this.engine.gold;
        this.elWave.textContent = `${this.engine.currentWaveIndex + 1}/${this.engine.currentLevel.waves.length}`;
        this.elLevelName.textContent = `L${this.engine.currentLevel.id}: ${this.engine.currentLevel.name}`;

        if (this.engine.isWaveActive) {
            this.btnStartWave.classList.add('disabled');
            this.btnStartWave.textContent = 'WAVE IN PROGRESS';
        } else {
            this.btnStartWave.classList.remove('disabled');
            this.btnStartWave.textContent = 'NEXT WAVE ⚔️';
        }

        // Update Spell cooldowns & affordability
        ['meteor', 'freeze', 'rush'].forEach(key => {
            const btn = document.getElementById(`spell-${key}`);
            const cd = this.engine.spellCooldowns[key];
            const cost = GAME_CONFIG.spells[key].cost;
            const cdOverlay = btn.querySelector('.spell-cooldown-text');

            if (cd > 0) {
                btn.classList.add('on-cooldown');
                cdOverlay.textContent = Math.ceil(cd) + 's';
            } else {
                btn.classList.remove('on-cooldown');
                cdOverlay.textContent = '';
                if (this.engine.gold < cost) {
                    btn.classList.add('cant-afford');
                } else {
                    btn.classList.remove('cant-afford');
                }
            }
        });

        // If a tower is inspected, refresh its upgrade affordability
        if (this.engine.selectedTower) {
            this.showTowerInfo(this.engine.selectedTower);
        }

        // Update Weather Pill & In-Level Weather Button
        if (this.engine.weatherSystem) {
            const wInfo = this.engine.weatherSystem.getCurrentWeatherInfo();
            if (this.hudWeatherPill) {
                if (this.hudWeatherIcon) this.hudWeatherIcon.textContent = wInfo.icon;
                if (this.hudWeatherName) this.hudWeatherName.textContent = wInfo.name;
                this.hudWeatherPill.title = `${wInfo.name}: ${wInfo.desc} (Wind: ${wInfo.windSpeed} mph - Click to shift)`;

                // Update weather state CSS classes for dynamic styling
                ['thunderstorm', 'blizzard', 'aurora', 'clear', 'fog', 'rain_light', 'snow_light', 'windy'].forEach(c => {
                    this.hudWeatherPill.classList.remove(c);
                });
                this.hudWeatherPill.classList.add(wInfo.id);
                if (wInfo.isTransitioning) {
                    this.hudWeatherPill.classList.add('transitioning');
                } else {
                    this.hudWeatherPill.classList.remove('transitioning');
                }
            }

            if (this.btnInlevelWeatherIcon) this.btnInlevelWeatherIcon.textContent = wInfo.icon;
            if (this.btnInlevelWeatherText) this.btnInlevelWeatherText.textContent = `Weather: ${wInfo.name}`;
        }

        this.updateWeatherWidget();
    }

    showWeatherBanner(wInfo) {
        if (!this.weatherBanner) return;
        if (this.weatherBannerTimeout) clearTimeout(this.weatherBannerTimeout);

        if (this.weatherBannerIcon) this.weatherBannerIcon.textContent = wInfo.icon;
        if (this.weatherBannerTitle) this.weatherBannerTitle.textContent = `WEATHER SHIFT: ${wInfo.name.toUpperCase()}`;
        if (this.weatherBannerSub) this.weatherBannerSub.textContent = wInfo.desc;

        this.weatherBanner.classList.remove('hidden', 'fade-out');
        this.weatherBannerTimeout = setTimeout(() => {
            this.weatherBanner.classList.add('fade-out');
            setTimeout(() => {
                this.weatherBanner.classList.add('hidden');
            }, 500);
        }, 3200);
    }

    onWeatherChanged(wInfo, showAlert = true) {
        this.updateHUD();
        this.updateWeatherWidget();
        if (showAlert && this.screenLanding && !this.screenLanding.classList.contains('hidden')) return;
        if (showAlert) {
            this.showWeatherBanner(wInfo);
        }
    }

    updateWeatherWidget() {
        if (!this.engine.weatherSystem) return;
        const info = this.engine.weatherSystem.getCurrentWeatherInfo();

        if (this.weatherStationWidget) {
            if (this.wwIcon) this.wwIcon.textContent = info.icon;
            if (this.wwName) this.wwName.textContent = info.name;
            if (this.wwBiome) this.wwBiome.textContent = `${info.biomeGroup.toUpperCase()} • ${info.intensity.toUpperCase()}`;
            if (this.wwWind) this.wwWind.textContent = `🌬️ ${info.windSpeed}`;
            if (this.wwIntensity) this.wwIntensity.textContent = info.intensity;
            if (this.wwEffects) this.wwEffects.textContent = info.effects;

            // Active button highlight in station widget
            document.querySelectorAll('.btn-weather-select').forEach(btn => {
                if (btn.dataset.weather === info.id) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            });

            // Auto-cycle state
            if (this.btnWwAutoCycle) {
                if (info.autoCycle) {
                    this.btnWwAutoCycle.classList.add('active');
                    this.btnWwAutoCycle.textContent = '🔄 Auto-Cycle: ON';
                } else {
                    this.btnWwAutoCycle.classList.remove('active');
                    this.btnWwAutoCycle.textContent = '🔒 Locked (Manual)';
                }
            }
        }

        // Active button highlight in Quick Weather Toolbar
        document.querySelectorAll('.qwb-btn').forEach(btn => {
            if (btn.dataset.weather === info.id) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        this.updateInlevelWeatherModal();
    }

    updateInlevelWeatherModal() {
        if (!this.engine.weatherSystem) return;
        const info = this.engine.weatherSystem.getCurrentWeatherInfo();
        document.querySelectorAll('.btn-iw-card').forEach(card => {
            if (card.dataset.weather === info.id) {
                card.classList.add('active');
            } else {
                card.classList.remove('active');
            }
        });
        if (this.btnIwAutoCycle) {
            if (info.autoCycle) {
                this.btnIwAutoCycle.classList.add('active');
                this.btnIwAutoCycle.textContent = '🔄 Auto Atmospheric Shifts: ON';
            } else {
                this.btnIwAutoCycle.classList.remove('active');
                this.btnIwAutoCycle.textContent = '🔒 Dynamic Shifts: LOCKED (Manual)';
            }
        }
    }

    loadProgress() {
        const progress = JSON.parse(localStorage.getItem('frontier_td_progress') || '{}');
        if (!progress[1]) {
            progress[1] = { stars: 0, highscore: 0, unlocked: true };
            localStorage.setItem('frontier_td_progress', JSON.stringify(progress));
        }
    }
}

window.UIManager = UIManager;
