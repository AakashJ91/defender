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
        this.btnStartWave = document.getElementById('btn-start-wave');
        this.btnSpeed = document.getElementById('btn-speed');
        this.btnPause = document.getElementById('btn-pause');
        this.btnFullscreen = document.getElementById('btn-fullscreen');
        this.btnLandingFullscreen = document.getElementById('btn-landing-fullscreen');
        this.btnToggleFullscreen = document.getElementById('btn-toggle-fullscreen');

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
        this.bdSlotIndicator = document.getElementById('bd-slot-indicator');
        this.bdGoldDisplay = document.getElementById('bd-gold-display');
        this.btnCloseBuild = document.getElementById('btn-close-build');

        // On-Map Weather Widget & Alert Banner
        this.weatherBanner = document.getElementById('weather-banner');
        this.weatherBannerIcon = document.getElementById('weather-banner-icon');
        this.weatherBannerTitle = document.getElementById('weather-banner-title');
        this.weatherBannerSub = document.getElementById('weather-banner-sub');
        this.weatherBannerTimeout = null;

        // In-Level Weather Selection Modal (Triggered by spells drawer weather button)
        this.modalInlevelWeather = document.getElementById('modal-inlevel-weather');
        this.btnIwLightning = document.getElementById('btn-iw-lightning');
        this.btnIwAutoCycle = document.getElementById('btn-iw-autocycle');
        this.btnIwClose = document.getElementById('btn-iw-close');

        // Spells
        this.spellsDrawer = document.getElementById('spells-drawer');
        this.btnSpellMeteor = document.getElementById('spell-meteor');
        this.btnSpellFreeze = document.getElementById('spell-freeze');
        this.btnSpellRush = document.getElementById('spell-rush');
        this.btnSpellWeather = document.getElementById('btn-spell-weather');
        this.spellWeatherIcon = document.getElementById('spell-weather-icon');

        // Level 1 Intro Cutscene
        this.cutsceneIntro = document.getElementById('cutscene-intro');
        this.btnIntroSkip = document.getElementById('btn-intro-skip');
        this.btnIntroNext = document.getElementById('btn-intro-next');
        this.btnIntroPrev = document.getElementById('btn-intro-prev');
        this.introAvatar = document.getElementById('intro-speaker-avatar');
        this.introRole = document.getElementById('intro-speaker-role');
        this.introSpeakerName = document.getElementById('intro-speaker-name');
        this.introDialogueText = document.getElementById('intro-dialogue-text');
        this.introStepDots = document.getElementById('intro-step-dots');

        // Level 10 Grand Finale Scene
        this.cutsceneFinish = document.getElementById('cutscene-finish');
        this.btnFinishSkip = document.getElementById('btn-finish-skip');
        this.btnFinishNext = document.getElementById('btn-finish-next');
        this.btnFinishPrev = document.getElementById('btn-finish-prev');
        this.finishAvatar = document.getElementById('finish-speaker-avatar');
        this.finishRole = document.getElementById('finish-speaker-role');
        this.finishSpeakerName = document.getElementById('finish-speaker-name');
        this.finishDialogueText = document.getElementById('finish-dialogue-text');
        this.finishStepDots = document.getElementById('finish-step-dots');
        this.finishDialogueDock = document.getElementById('finish-dialogue-dock');
        this.finishLaurelDock = document.getElementById('finish-laurel-dock');
        this.finishFireworksCanvas = document.getElementById('finish-fireworks-canvas');
        this.laurelTotalStars = document.getElementById('laurel-total-stars');
        this.laurelTotalScore = document.getElementById('laurel-total-score');
        this.laurelRank = document.getElementById('laurel-rank');
        this.btnFinishReplay = document.getElementById('btn-finish-replay');
        this.btnFinishLevels = document.getElementById('btn-finish-levels');
        this.btnFinishMenu = document.getElementById('btn-finish-menu');

        // Watch Buttons on Menus
        this.btnLandingIntro = document.getElementById('btn-landing-intro');
        this.btnLandingFinish = document.getElementById('btn-landing-finish');
        this.btnLevelsWatchIntro = document.getElementById('btn-levels-watch-intro');
        this.btnLevelsWatchFinish = document.getElementById('btn-levels-watch-finish');

        // Cutscene States
        this.introSlideIndex = 0;
        this.finishSlideIndex = 0;
        this.typewriterTimer = null;
        this.fireworksInterval = null;
        this.fireworksAnimationId = null;
        this.activeCutscene = null;

        // Cutscene Dialogue Scripts
        this.introScript = [
            {
                role: "REALM CHRONICLER",
                name: "Elder Archivist Oakhaven",
                avatar: "📜",
                text: "For centuries, the Frontier Spire network maintained unbroken harmony across the biomes — from the deep canopies of the Emerald Jungle to the frozen crown of the Glacial Spire..."
            },
            {
                role: "WARBAND SCOUT INVASION",
                name: "Warchief Grimjaw & Crawlers",
                avatar: "👺",
                text: "The ancient wards have shattered! Scout warbands, venom crawlers, and silverback brutes — advance down the Emerald Trail! Seize the heartstone before their defenses awaken!"
            },
            {
                role: "TACTICAL COMMAND",
                name: "High Commander Valerius",
                avatar: "🛡️",
                text: "Commander on deck! The tactical defense grid is online. Tap the dormant Spire Dais plots along the path to deploy Dart Spires and siege artillery. Hold the line — defend the frontier!"
            }
        ];

        this.finishScript = [
            {
                role: "FALLEN RULER OF THE FROST",
                name: "Glacial Behemoth",
                avatar: "❄️",
                text: "The biting frost... dissolves. After an eternity of blizzard... the warmth of dawn returns to the peak. The throne... and the realm... are yours once more..."
            },
            {
                role: "UNITED EMERALD & FROST REALM",
                name: "High Commander & Citizens",
                avatar: "👑",
                text: "Victory is complete! The Frost King's curse is broken, the sun shines over thawing peaks and blooming jungle trails, and all ten strategic passes are forever secure!"
            }
        ];
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

        // Fullscreen toggle
        if (this.btnFullscreen) {
            this.btnFullscreen.addEventListener('click', () => this.toggleFullscreen());
        }
        if (this.btnLandingFullscreen) {
            this.btnLandingFullscreen.addEventListener('click', () => this.toggleFullscreen());
        }
        if (this.btnToggleFullscreen) {
            this.btnToggleFullscreen.addEventListener('click', () => this.toggleFullscreen());
        }

        const onFsChange = () => this.updateFullscreenUI();
        ['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange', 'MSFullscreenChange'].forEach(evt => {
            document.addEventListener(evt, onFsChange);
        });
        this.updateFullscreenUI();

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

        // In-Level Weather Selection Modal (Opened solely via Spells Drawer weather button)
        if (this.btnSpellWeather) {
            this.btnSpellWeather.addEventListener('click', () => {
                if (this.modalInlevelWeather) {
                    this.modalInlevelWeather.classList.toggle('hidden');
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
                }
            });
        }

        if (this.btnIwClose) {
            this.btnIwClose.addEventListener('click', () => {
                if (this.modalInlevelWeather) this.modalInlevelWeather.classList.add('hidden');
            });
        }

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

        if (this.btnCloseBuild) {
            this.btnCloseBuild.addEventListener('click', (e) => {
                e.stopPropagation();
                this.hideBuildDrawer();
            });
        }

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
                this.showFinishScene(3, this.getCampaignTotalScore());
            }
        });

        document.getElementById('btn-replay-level').addEventListener('click', () => {
            this.modalVictory.classList.add('hidden');
            this.startLevel(this.engine.currentLevel.id, true);
        });

        // Defeat Modal Buttons
        document.getElementById('btn-retry-level').addEventListener('click', () => {
            this.modalDefeat.classList.add('hidden');
            this.startLevel(this.engine.currentLevel.id, true);
        });

        document.getElementById('btn-defeat-levels').addEventListener('click', () => {
            this.modalDefeat.classList.add('hidden');
            this.showLevelSelect();
        });

        // Cutscene Button Events
        if (this.btnIntroSkip) {
            this.btnIntroSkip.addEventListener('click', () => this.finishIntroCutscene());
        }
        if (this.btnIntroNext) {
            this.btnIntroNext.addEventListener('click', () => this.nextIntroSlide());
        }
        if (this.btnIntroPrev) {
            this.btnIntroPrev.addEventListener('click', () => this.prevIntroSlide());
        }
        if (this.introDialogueText) {
            this.introDialogueText.parentElement.addEventListener('click', () => this.skipTypewriter());
        }

        if (this.btnFinishSkip) {
            this.btnFinishSkip.addEventListener('click', () => {
                this.skipTypewriter();
                this.finishSlideIndex = this.finishScript.length;
                this.renderFinishSlide();
            });
        }
        if (this.btnFinishNext) {
            this.btnFinishNext.addEventListener('click', () => this.nextFinishSlide());
        }
        if (this.btnFinishPrev) {
            this.btnFinishPrev.addEventListener('click', () => this.prevFinishSlide());
        }
        if (this.finishDialogueText) {
            this.finishDialogueText.parentElement.addEventListener('click', () => this.skipTypewriter());
        }

        if (this.btnFinishReplay) {
            this.btnFinishReplay.addEventListener('click', () => {
                this.showFinishScene(this.finishLevelStars || 3, this.finishLevelScore || 0);
            });
        }
        if (this.btnFinishLevels) {
            this.btnFinishLevels.addEventListener('click', () => {
                this.hideFinishScene();
                this.showLevelSelect();
            });
        }
        if (this.btnFinishMenu) {
            this.btnFinishMenu.addEventListener('click', () => {
                this.hideFinishScene();
                this.showLandingScreen();
            });
        }

        // Title Screen and Level Select Cutscene Watch Buttons
        if (this.btnLandingIntro) {
            this.btnLandingIntro.addEventListener('click', () => {
                this.showIntroCutscene(() => this.startLevel(1, true));
            });
        }
        if (this.btnLandingFinish) {
            this.btnLandingFinish.addEventListener('click', () => {
                this.showFinishScene(3, this.getCampaignTotalScore());
            });
        }
        if (this.btnLevelsWatchIntro) {
            this.btnLevelsWatchIntro.addEventListener('click', () => {
                this.modalLevelSelect.classList.add('hidden');
                this.showIntroCutscene(() => this.startLevel(1, true));
            });
        }
        if (this.btnLevelsWatchFinish) {
            this.btnLevelsWatchFinish.addEventListener('click', () => {
                this.modalLevelSelect.classList.add('hidden');
                this.showFinishScene(3, this.getCampaignTotalScore());
            });
        }

        // Keyboard navigation for cutscenes
        window.addEventListener('keydown', (e) => {
            if (this.activeCutscene === 'intro') {
                if (e.code === 'Space' || e.code === 'Enter' || e.code === 'ArrowRight') {
                    e.preventDefault();
                    this.nextIntroSlide();
                } else if (e.code === 'ArrowLeft') {
                    e.preventDefault();
                    this.prevIntroSlide();
                } else if (e.code === 'Escape') {
                    e.preventDefault();
                    this.finishIntroCutscene();
                }
            } else if (this.activeCutscene === 'finish') {
                if (e.code === 'Space' || e.code === 'Enter' || e.code === 'ArrowRight') {
                    e.preventDefault();
                    this.nextFinishSlide();
                } else if (e.code === 'ArrowLeft') {
                    e.preventDefault();
                    this.prevFinishSlide();
                } else if (e.code === 'Escape') {
                    e.preventDefault();
                    this.hideFinishScene();
                    this.showLandingScreen();
                }
            }
        });
    }

    toggleFullscreen() {
        try {
            const doc = document;
            const isFullscreen = !!(doc.fullscreenElement || doc.webkitFullscreenElement || doc.mozFullScreenElement || doc.msFullscreenElement);

            if (!isFullscreen) {
                const el = document.documentElement;
                if (el.requestFullscreen) {
                    el.requestFullscreen().catch(() => {});
                } else if (el.webkitRequestFullscreen) {
                    el.webkitRequestFullscreen();
                } else if (el.mozRequestFullScreen) {
                    el.mozRequestFullScreen();
                } else if (el.msRequestFullscreen) {
                    el.msRequestFullscreen();
                }
            } else {
                if (doc.exitFullscreen) {
                    doc.exitFullscreen().catch(() => {});
                } else if (doc.webkitExitFullscreen) {
                    doc.webkitExitFullscreen();
                } else if (doc.mozCancelFullScreen) {
                    doc.mozCancelFullScreen();
                } else if (doc.msExitFullscreen) {
                    doc.msExitFullscreen();
                }
            }
        } catch (e) {
            console.warn('Fullscreen toggle failed:', e);
        }
    }

    updateFullscreenUI() {
        const doc = document;
        const isFullscreen = !!(doc.fullscreenElement || doc.webkitFullscreenElement || doc.mozFullScreenElement || doc.msFullscreenElement);

        if (this.btnFullscreen) {
            this.btnFullscreen.textContent = isFullscreen ? '🗗' : '⛶';
            this.btnFullscreen.title = isFullscreen ? 'Exit Fullscreen' : 'Toggle Fullscreen';
        }
        if (this.btnLandingFullscreen) {
            this.btnLandingFullscreen.textContent = isFullscreen ? '🗗' : '⛶';
            this.btnLandingFullscreen.title = isFullscreen ? 'Exit Fullscreen' : 'Toggle Fullscreen';
        }
        if (this.btnToggleFullscreen) {
            this.btnToggleFullscreen.textContent = isFullscreen ? '🗗 Fullscreen: ON' : '⛶ Fullscreen: OFF';
        }
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

        if (this.bdSlotIndicator && slot) {
            this.bdSlotIndicator.textContent = `Plot #${slot.id}`;
        }
        if (this.bdGoldDisplay) {
            this.bdGoldDisplay.textContent = this.engine.gold;
        }

        // Update affordability and tooltips of tower buttons
        document.querySelectorAll('.btn-build-tower').forEach(btn => {
            const type = btn.dataset.type;
            const config = GAME_CONFIG.towers[type];
            if (!config) return;

            if (this.engine.gold < config.cost) {
                btn.classList.add('disabled');
                btn.title = `Need ${config.cost - this.engine.gold} more Gold to deploy ${config.name}`;
            } else {
                btn.classList.remove('disabled');
                btn.title = `Deploy ${config.name} (${config.cost}G) - ${config.description}`;
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

        LEVELS.forEach(level => {
            const data = progress[level.id] || { stars: 0, highscore: 0, unlocked: true };
            // All stages are immediately available to test
            data.unlocked = true;

            const card = document.createElement('div');
            card.className = `level-card ${level.difficulty === 'Boss' || level.difficulty === 'Final Boss' ? 'boss-card' : ''}`;

            let starsDisplay = '';
            for (let i = 1; i <= 3; i++) {
                starsDisplay += i <= (data.stars || 0) ? '⭐' : '☆';
            }

            card.innerHTML = `
                <div class="level-num">Level ${level.id}</div>
                <div class="level-title">${level.name}</div>
                <div class="level-stars">${starsDisplay}</div>
                <div class="level-tag">${level.difficulty}</div>
            `;

            card.addEventListener('click', () => {
                this.modalLevelSelect.classList.add('hidden');
                this.startLevel(level.id);
            });

            if (level.biome === 'jungle') {
                jungleContainer.appendChild(card);
            } else {
                snowContainer.appendChild(card);
            }
        });
    }

    startLevel(levelId, forceSkipCutscene = false) {
        if (levelId === 1 && !forceSkipCutscene) {
            this.showIntroCutscene(() => {
                this.startLevel(1, true);
            });
            return;
        }
        this.hideLandingScreen();
        this.hideIntroCutscene();
        this.hideFinishScene();
        this.engine.loadLevel(levelId);
        this.hideBuildDrawer();
        this.hideTowerInfo();
        this.updateHUD();
    }

    getHighestUnlockedLevel() {
        const progress = JSON.parse(localStorage.getItem('frontier_td_progress') || '{}');
        // Resume campaign at the next uncompleted mission based on earned stars (capped at 10)
        let resumeLevel = 1;
        for (let i = 1; i <= 10; i++) {
            if (progress[i] && progress[i].stars > 0) {
                resumeLevel = Math.min(10, i + 1);
            }
        }
        return resumeLevel;
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

    getCampaignTotalScore() {
        try {
            const progress = JSON.parse(localStorage.getItem('frontier_td_progress') || '{}');
            let total = 0;
            for (let i = 1; i <= 10; i++) {
                if (progress[i] && progress[i].highscore) {
                    total += progress[i].highscore;
                }
            }
            return total > 0 ? total : 28500;
        } catch (e) {
            return 28500;
        }
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
        if (this.spellsDrawer) this.spellsDrawer.classList.add('hidden');
        if (this.weatherBanner) this.weatherBanner.classList.add('hidden');
        if (this.modalInlevelWeather) this.modalInlevelWeather.classList.add('hidden');
        this.hideIntroCutscene();
        this.hideFinishScene();
        this.hideBuildDrawer();
        this.hideTowerInfo();
        this.updateLandingScreenInfo();
    }

    hideLandingScreen() {
        if (this.screenLanding) this.screenLanding.classList.add('hidden');
        if (this.hudTopBar) this.hudTopBar.classList.remove('hidden');
        if (this.spellsDrawer) this.spellsDrawer.classList.remove('hidden');
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
        if (this.modalInlevelWeather) this.modalInlevelWeather.classList.add('hidden');
        this.hideIntroCutscene();
        this.hideFinishScene();
        this.hideBuildDrawer();
        this.hideTowerInfo();
    }

    // -------------------------------------------------------------
    // CUTSCENE & TYPEWRITER SYSTEMS
    // -------------------------------------------------------------
    typewriterText(element, fullText, onDone) {
        if (this.typewriterTimer) {
            clearInterval(this.typewriterTimer);
            this.typewriterTimer = null;
        }
        element.textContent = '';
        let index = 0;
        const total = fullText.length;
        this._currentFullText = fullText;
        this._currentTypewriterElement = element;
        this._onTypewriterDone = onDone;

        this.typewriterTimer = setInterval(() => {
            if (index < total) {
                element.textContent += fullText[index];
                if (index % 3 === 0 && window.soundEngine) {
                    window.soundEngine.playDialogueBlip();
                }
                index++;
            } else {
                clearInterval(this.typewriterTimer);
                this.typewriterTimer = null;
                if (onDone) onDone();
            }
        }, 16);
    }

    skipTypewriter() {
        if (this.typewriterTimer && this._currentTypewriterElement && this._currentFullText) {
            clearInterval(this.typewriterTimer);
            this.typewriterTimer = null;
            this._currentTypewriterElement.textContent = this._currentFullText;
            if (this._onTypewriterDone) {
                const cb = this._onTypewriterDone;
                this._onTypewriterDone = null;
                cb();
            }
            return true;
        }
        return false;
    }

    // Level 1 Intro Cutscene
    showIntroCutscene(onComplete) {
        this.closeModals();
        this.hideLandingScreen();
        this.activeCutscene = 'intro';
        this.introOnComplete = onComplete;
        this.introSlideIndex = 0;
        if (this.cutsceneIntro) this.cutsceneIntro.classList.remove('hidden');

        if (window.soundEngine) {
            window.soundEngine.playIntroTheme();
        }
        this.renderIntroSlide();
    }

    renderIntroSlide() {
        const slide = this.introScript[this.introSlideIndex];
        if (!slide) return;

        if (this.introRole) this.introRole.textContent = slide.role;
        if (this.introSpeakerName) this.introSpeakerName.textContent = slide.name;
        if (this.introAvatar) this.introAvatar.textContent = slide.avatar;

        if (this.introStepDots) {
            const dots = this.introStepDots.querySelectorAll('.step-dot');
            dots.forEach((dot, idx) => {
                dot.classList.toggle('active', idx === this.introSlideIndex);
            });
        }

        if (this.btnIntroPrev) {
            this.btnIntroPrev.style.visibility = this.introSlideIndex === 0 ? 'hidden' : 'visible';
        }

        if (this.btnIntroNext) {
            if (this.introSlideIndex === this.introScript.length - 1) {
                this.btnIntroNext.textContent = 'DEPLOY DEFENSES ⚔️';
            } else {
                this.btnIntroNext.textContent = 'Next ❯';
            }
        }

        if (this.introDialogueText) {
            this.typewriterText(this.introDialogueText, slide.text);
        }
    }

    nextIntroSlide() {
        if (this.skipTypewriter()) return;
        if (this.introSlideIndex < this.introScript.length - 1) {
            this.introSlideIndex++;
            this.renderIntroSlide();
        } else {
            this.finishIntroCutscene();
        }
    }

    prevIntroSlide() {
        if (this.skipTypewriter()) return;
        if (this.introSlideIndex > 0) {
            this.introSlideIndex--;
            this.renderIntroSlide();
        }
    }

    finishIntroCutscene() {
        this.hideIntroCutscene();
        if (window.soundEngine) {
            window.soundEngine.stopCutsceneAudio();
        }
        if (this.introOnComplete) {
            const cb = this.introOnComplete;
            this.introOnComplete = null;
            cb();
        } else {
            this.startLevel(1, true);
        }
    }

    hideIntroCutscene() {
        if (this.typewriterTimer) {
            clearInterval(this.typewriterTimer);
            this.typewriterTimer = null;
        }
        if (this.cutsceneIntro) this.cutsceneIntro.classList.add('hidden');
        if (this.activeCutscene === 'intro') this.activeCutscene = null;
    }

    // Level 10 Game Finish Scene
    showFinishScene(stars = 3, score = 0, onComplete) {
        this.closeModals();
        this.hideLandingScreen();
        this.activeCutscene = 'finish';
        this.finishOnComplete = onComplete;
        this.finishSlideIndex = 0;
        this.finishLevelStars = stars;
        this.finishLevelScore = score;

        if (this.cutsceneFinish) this.cutsceneFinish.classList.remove('hidden');
        if (this.finishDialogueDock) this.finishDialogueDock.classList.remove('hidden');
        if (this.finishLaurelDock) this.finishLaurelDock.classList.add('hidden');

        if (window.soundEngine) {
            window.soundEngine.playGrandFinaleTheme();
        }

        this.startFireworks();
        this.renderFinishSlide();
    }

    renderFinishSlide() {
        if (this.finishSlideIndex < this.finishScript.length) {
            if (this.finishDialogueDock) this.finishDialogueDock.classList.remove('hidden');
            if (this.finishLaurelDock) this.finishLaurelDock.classList.add('hidden');

            const slide = this.finishScript[this.finishSlideIndex];
            if (this.finishRole) this.finishRole.textContent = slide.role;
            if (this.finishSpeakerName) this.finishSpeakerName.textContent = slide.name;
            if (this.finishAvatar) this.finishAvatar.textContent = slide.avatar;

            if (this.finishStepDots) {
                const dots = this.finishStepDots.querySelectorAll('.step-dot');
                dots.forEach((dot, idx) => {
                    dot.classList.toggle('active', idx === this.finishSlideIndex);
                });
            }

            if (this.btnFinishPrev) {
                this.btnFinishPrev.style.visibility = this.finishSlideIndex === 0 ? 'hidden' : 'visible';
            }

            if (this.btnFinishNext) {
                this.btnFinishNext.textContent = this.finishSlideIndex === this.finishScript.length - 1 ? 'CAMPAIGN LAURELS 🏆' : 'Next ❯';
            }

            if (this.finishDialogueText) {
                this.typewriterText(this.finishDialogueText, slide.text);
            }
        } else {
            // Show Act 3: Grand Laurels Dashboard
            if (this.finishDialogueDock) this.finishDialogueDock.classList.add('hidden');
            if (this.finishLaurelDock) this.finishLaurelDock.classList.remove('hidden');
            this.populateLaurelStats();
        }
    }

    populateLaurelStats() {
        const totalStars = this.getTotalStarsEarned();
        const totalScore = this.getCampaignTotalScore();
        if (this.laurelTotalStars) this.laurelTotalStars.textContent = `${totalStars} / 30 ⭐`;
        if (this.laurelTotalScore) this.laurelTotalScore.textContent = totalScore.toLocaleString();
        if (this.laurelRank) {
            if (totalStars >= 28) this.laurelRank.textContent = "SUPREME SOVEREIGN ⭐⭐⭐";
            else if (totalStars >= 20) this.laurelRank.textContent = "GRAND STRATEGIST ⭐⭐";
            else this.laurelRank.textContent = "FRONTIER CONQUEROR ⭐";
        }
    }

    nextFinishSlide() {
        if (this.skipTypewriter()) return;
        if (this.finishSlideIndex < this.finishScript.length) {
            this.finishSlideIndex++;
            this.renderFinishSlide();
        }
    }

    prevFinishSlide() {
        if (this.skipTypewriter()) return;
        if (this.finishSlideIndex > 0) {
            this.finishSlideIndex--;
            this.renderFinishSlide();
        }
    }

    hideFinishScene() {
        if (this.typewriterTimer) {
            clearInterval(this.typewriterTimer);
            this.typewriterTimer = null;
        }
        this.stopFireworks();
        if (this.cutsceneFinish) this.cutsceneFinish.classList.add('hidden');
        if (this.activeCutscene === 'finish') this.activeCutscene = null;
        if (window.soundEngine) {
            window.soundEngine.stopCutsceneAudio();
        }
    }

    startFireworks() {
        this.stopFireworks();
        if (!this.finishFireworksCanvas) return;
        const canvas = this.finishFireworksCanvas;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resize();

        const particles = [];
        const colors = ['#facc15', '#38bdf8', '#4ade80', '#fb7171', '#c084fc', '#ffffff', '#f472b6'];

        const launchBurst = () => {
            const x = canvas.width * (0.15 + Math.random() * 0.7);
            const y = canvas.height * (0.15 + Math.random() * 0.45);
            const color = colors[Math.floor(Math.random() * colors.length)];
            const count = 40 + Math.floor(Math.random() * 25);

            if (window.soundEngine) {
                window.soundEngine.playFireworkSound();
            }

            for (let i = 0; i < count; i++) {
                const angle = (Math.PI * 2 / count) * i + (Math.random() - 0.5) * 0.4;
                const speed = 2 + Math.random() * 5.5;
                particles.push({
                    x: x,
                    y: y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    color: color,
                    alpha: 1.0,
                    size: 2.2 + Math.random() * 2.2,
                    decay: 0.012 + Math.random() * 0.014
                });
            }
        };

        launchBurst();
        this.fireworksInterval = setInterval(launchBurst, 1200);

        const render = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            for (let i = particles.length - 1; i >= 0; i--) {
                const p = particles[i];
                p.x += p.vx;
                p.y += p.vy;
                p.vy += 0.06;
                p.alpha -= p.decay;

                if (p.alpha <= 0) {
                    particles.splice(i, 1);
                    continue;
                }

                ctx.save();
                ctx.globalAlpha = p.alpha;
                ctx.fillStyle = p.color;
                ctx.shadowColor = p.color;
                ctx.shadowBlur = 8;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }

            this.fireworksAnimationId = requestAnimationFrame(render);
        };
        this.fireworksAnimationId = requestAnimationFrame(render);
    }

    stopFireworks() {
        if (this.fireworksInterval) {
            clearInterval(this.fireworksInterval);
            this.fireworksInterval = null;
        }
        if (this.fireworksAnimationId) {
            cancelAnimationFrame(this.fireworksAnimationId);
            this.fireworksAnimationId = null;
        }
        if (this.finishFireworksCanvas) {
            const ctx = this.finishFireworksCanvas.getContext('2d');
            if (ctx) ctx.clearRect(0, 0, this.finishFireworksCanvas.width, this.finishFireworksCanvas.height);
        }
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

        // Update Weather Pill & Spells Drawer Weather Icon
        if (this.engine.weatherSystem) {
            const wInfo = this.engine.weatherSystem.getCurrentWeatherInfo();
            if (this.hudWeatherPill) {
                if (this.hudWeatherIcon) this.hudWeatherIcon.textContent = wInfo.icon;
                if (this.hudWeatherName) this.hudWeatherName.textContent = wInfo.name;
                this.hudWeatherPill.title = `${wInfo.name}: ${wInfo.desc} (Wind: ${wInfo.windSpeed} mph)`;

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

            if (this.spellWeatherIcon) {
                this.spellWeatherIcon.textContent = wInfo.icon;
            }
        }

        // Keep Build Drawer gold and buttons synced in real time
        if (this.bdGoldDisplay) {
            this.bdGoldDisplay.textContent = this.engine.gold;
        }
        if (this.drawerBuild && !this.drawerBuild.classList.contains('hidden')) {
            document.querySelectorAll('.btn-build-tower').forEach(btn => {
                const type = btn.dataset.type;
                const config = GAME_CONFIG.towers[type];
                if (!config) return;
                if (this.engine.gold < config.cost) {
                    btn.classList.add('disabled');
                    btn.title = `Need ${config.cost - this.engine.gold} more Gold to deploy ${config.name}`;
                } else {
                    btn.classList.remove('disabled');
                    btn.title = `Deploy ${config.name} (${config.cost}G) - ${config.description}`;
                }
            });
        }
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
        this.updateInlevelWeatherModal();
        if (showAlert && this.screenLanding && !this.screenLanding.classList.contains('hidden')) return;
        if (showAlert) {
            this.showWeatherBanner(wInfo);
        }
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
        for (let i = 1; i <= 10; i++) {
            if (!progress[i]) {
                progress[i] = { stars: 0, highscore: 0, unlocked: true };
            } else {
                progress[i].unlocked = true;
            }
        }
        localStorage.setItem('frontier_td_progress', JSON.stringify(progress));
    }
}

window.UIManager = UIManager;
