// Settings Management
class SettingsManager {
    constructor() {
        this.settings = {
            darkMode: true,
            fontSize: 'small',
            fontFamily: "'Comfortaa', cursive",
            autoShuffle: false,
            repeatMode: 'none',
            trackNotifications: true,
            themeColor: '#1db954', // Default theme color
            shuffle: false, // Add shuffle setting
            miniPlayerMode: false, // Add mini player mode setting
            playbackSpeed: 1.0, // Add playback speed setting
            eqPreset: 'flat', // Add equalizer preset setting
            eqBands: [0, 0, 0, 0, 0, 0], // Add equalizer custom bands
            lyricsFontSize: 14, // Add lyrics font size setting
            closeBehavior: 'ask' // Add close behavior setting
        };
        
        this.init();
    }

    init() {
        // Load saved settings
        this.loadSettings();
        
        // Initialize event listeners
        this.initializeEventListeners();
        
        // Apply initial settings
        this.applySettings();

        // Set initial color picker value
        const themeColorPicker = document.getElementById('themeColorPicker');
        if (themeColorPicker) {
            themeColorPicker.value = this.settings.themeColor;
        }

        // Set initial active color preset
        const colorPresets = document.querySelectorAll('.color-preset');
        colorPresets.forEach(preset => {
            if (preset.dataset.color === this.settings.themeColor) {
                preset.classList.add('active');
            }
        });

        // Set initial mini player mode
        const miniPlayerToggle = document.getElementById('miniPlayerToggle');
        if (miniPlayerToggle) {
            miniPlayerToggle.checked = this.settings.miniPlayerMode;
            this.toggleMiniPlayer(this.settings.miniPlayerMode);
        }

        // Listen for beforeunload event to ensure mini player mode is off on close
        window.addEventListener('beforeunload', () => {
            if (this.settings.miniPlayerMode) {
                this.settings.miniPlayerMode = false;
                this.saveSettings();
                // Optionally, also send IPC to main process to ensure window size is reset
                if (window.api && window.api.setMiniPlayerSize) {
                    window.api.setMiniPlayerSize(false);
                }
            }
        });
    }

    loadSettings() {
        try {
            const savedSettings = localStorage.getItem('musicPlayerSettings');
            if (savedSettings) {
                const parsedSettings = JSON.parse(savedSettings);
                // Merge saved settings with defaults, ensuring all properties exist
                this.settings = {
                    darkMode: parsedSettings.darkMode ?? true,
                    fontSize: parsedSettings.fontSize ?? 'small',
                    fontFamily: parsedSettings.fontFamily ?? "'Comfortaa', cursive",
                    autoShuffle: parsedSettings.autoShuffle ?? false,
                    repeatMode: parsedSettings.repeatMode ?? 'none',
                    trackNotifications: parsedSettings.trackNotifications ?? true,
                    themeColor: parsedSettings.themeColor ?? '#1db954',
                    shuffle: parsedSettings.shuffle ?? false,
                    miniPlayerMode: parsedSettings.miniPlayerMode ?? false,
                    playbackSpeed: parsedSettings.playbackSpeed ?? 1.0,
                    eqPreset: parsedSettings.eqPreset ?? 'flat',
                    eqBands: parsedSettings.eqBands ?? [0, 0, 0, 0, 0, 0],
                    lyricsFontSize: parsedSettings.lyricsFontSize ?? 14,
                    closeBehavior: parsedSettings.closeBehavior ?? 'ask'
                };
            }
        } catch (error) {
            console.error('Error loading settings:', error);
            // If there's an error, keep the default settings
        }
    }

    saveSettings() {
        try {
            localStorage.setItem('musicPlayerSettings', JSON.stringify(this.settings));
        } catch (error) {
            console.error('Error saving settings:', error);
        }
    }

    initializeEventListeners() {
        // Dark Mode Toggle
        const darkModeToggle = document.getElementById('darkModeToggle');
        if (darkModeToggle) {
            darkModeToggle.checked = this.settings.darkMode;
            darkModeToggle.addEventListener('change', (e) => {
                this.settings.darkMode = e.target.checked;
                this.applySettings();
                this.saveSettings();
            });
        }

        // Font Size Dropdown
        const fontSizeDropdown = document.getElementById('fontSizeDropdown');
        const fontSizeSelected = document.getElementById('fontSizeSelected');
        const fontSizeOptions = document.getElementById('fontSizeOptions');
        if (fontSizeDropdown && fontSizeSelected && fontSizeOptions) {
            // Set initial value
            const initialFontSize = this.settings.fontSize;
            fontSizeSelected.textContent = initialFontSize.charAt(0).toUpperCase() + initialFontSize.slice(1);
            fontSizeOptions.querySelector(`[data-value="${initialFontSize}"]`).classList.add('active');

            // Setup dropdown behavior
            fontSizeDropdown.addEventListener('click', (e) => {
                fontSizeDropdown.classList.toggle('open');
            });
            fontSizeDropdown.addEventListener('blur', (e) => {
                setTimeout(() => fontSizeDropdown.classList.remove('open'), 100);
            });

            // Handle option selection
            fontSizeOptions.querySelectorAll('.custom-dropdown-option').forEach(option => {
                option.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const value = option.getAttribute('data-value');
                    const label = option.textContent;
                    this.settings.fontSize = value;
                    fontSizeSelected.textContent = label;
                    fontSizeOptions.querySelectorAll('.custom-dropdown-option').forEach(opt => opt.classList.remove('active'));
                    option.classList.add('active');
                    fontSizeDropdown.classList.remove('open');
                    this.applySettings();
                    this.saveSettings();
                });
            });
        }

        // Font Family Dropdown
        const fontFamilyDropdown = document.getElementById('fontFamilyDropdown');
        const fontFamilySelected = document.getElementById('fontFamilySelected');
        const fontFamilyOptions = document.getElementById('fontFamilyOptions');
        if (fontFamilyDropdown && fontFamilySelected && fontFamilyOptions) {
            // Set initial value
            const initialFontFamily = this.settings.fontFamily;
            const initialOption = fontFamilyOptions.querySelector(`[data-value="${initialFontFamily}"]`);
            if (initialOption) {
                fontFamilySelected.textContent = initialOption.textContent;
                initialOption.classList.add('active');
            }

            // Setup dropdown behavior
            fontFamilyDropdown.addEventListener('click', (e) => {
                fontFamilyDropdown.classList.toggle('open');
            });
            fontFamilyDropdown.addEventListener('blur', (e) => {
                setTimeout(() => fontFamilyDropdown.classList.remove('open'), 100);
            });

            // Handle option selection
            fontFamilyOptions.querySelectorAll('.custom-dropdown-option').forEach(option => {
                option.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const value = option.getAttribute('data-value');
                    const label = option.textContent;
                    this.settings.fontFamily = value;
                    fontFamilySelected.textContent = label;
                    fontFamilyOptions.querySelectorAll('.custom-dropdown-option').forEach(opt => opt.classList.remove('active'));
                    option.classList.add('active');
                    fontFamilyDropdown.classList.remove('open');
                    this.applySettings();
                    this.saveSettings();
                });
            });
        }

        // Theme Color Picker
        const themeColorPicker = document.getElementById('themeColorPicker');
        if (themeColorPicker) {
            themeColorPicker.value = this.settings.themeColor;
            themeColorPicker.addEventListener('change', (e) => {
                this.settings.themeColor = e.target.value;
                this.applySettings();
                this.saveSettings();
                
                // Update active color preset
                const colorPresets = document.querySelectorAll('.color-preset');
                colorPresets.forEach(preset => {
                    preset.classList.remove('active');
                });
            });
        }

        // Color Presets
        const colorPresets = document.querySelectorAll('.color-preset');
        colorPresets.forEach(preset => {
            preset.addEventListener('click', (e) => {
                const color = e.target.dataset.color;
                this.settings.themeColor = color;
                if (themeColorPicker) {
                    themeColorPicker.value = color;
                }
                this.applySettings();
                this.saveSettings();
                
                // Update active state
                colorPresets.forEach(p => p.classList.remove('active'));
                e.target.classList.add('active');
            });
        });

        // Auto Shuffle Toggle
        const autoShuffleToggle = document.getElementById('autoShuffleToggle');
        if (autoShuffleToggle) {
            autoShuffleToggle.checked = this.settings.autoShuffle;
            autoShuffleToggle.addEventListener('change', (e) => {
                this.settings.autoShuffle = e.target.checked;
                this.saveSettings();
            });
        }

        // Repeat Mode Dropdown
        const repeatModeDropdown = document.getElementById('repeatModeDropdown');
        const repeatModeSelected = document.getElementById('repeatModeSelected');
        const repeatModeOptions = document.getElementById('repeatModeOptions');
        if (repeatModeDropdown && repeatModeSelected && repeatModeOptions) {
            // Set initial value
            const initialRepeatMode = this.settings.repeatMode || 'none';
            const initialOption = repeatModeOptions.querySelector(`[data-value="${initialRepeatMode}"]`);
            if (initialOption) {
                repeatModeSelected.textContent = initialOption.textContent;
                initialOption.classList.add('active');
            }

            // Setup dropdown behavior
            repeatModeDropdown.addEventListener('click', (e) => {
                repeatModeDropdown.classList.toggle('open');
            });
            repeatModeDropdown.addEventListener('blur', (e) => {
                setTimeout(() => repeatModeDropdown.classList.remove('open'), 100);
            });

            // Handle option selection
            repeatModeOptions.querySelectorAll('.custom-dropdown-option').forEach(option => {
                option.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const value = option.getAttribute('data-value');
                    const label = option.textContent;
                    this.settings.repeatMode = value;
                    repeatModeSelected.textContent = label;
                    repeatModeOptions.querySelectorAll('.custom-dropdown-option').forEach(opt => opt.classList.remove('active'));
                    option.classList.add('active');
                    repeatModeDropdown.classList.remove('open');
                    this.saveSettings();
                });
            });
        }

        // Track Notifications Toggle
        const trackNotificationsToggle = document.getElementById('trackNotificationsToggle');
        if (trackNotificationsToggle) {
            trackNotificationsToggle.checked = this.settings.trackNotifications;
            trackNotificationsToggle.addEventListener('change', (e) => {
                this.settings.trackNotifications = e.target.checked;
                this.saveSettings();
            });
        }

        // Shuffle Toggle
        const shuffleToggle = document.getElementById('shuffleToggle');
        if (shuffleToggle) {
            shuffleToggle.checked = this.settings.shuffle;
            shuffleToggle.addEventListener('change', (e) => {
                this.settings.shuffle = e.target.checked;
                this.saveSettings();
                // Dispatch event to notify player of shuffle state change
                window.dispatchEvent(new CustomEvent('shuffleStateChanged', {
                    detail: { shuffle: this.settings.shuffle }
                }));
            });
        }

        // Mini Player Mode Toggle
        const miniPlayerToggle = document.getElementById('miniPlayerToggle');
        if (miniPlayerToggle) {
            miniPlayerToggle.addEventListener('change', (e) => {
                this.settings.miniPlayerMode = e.target.checked;
                this.toggleMiniPlayer(this.settings.miniPlayerMode);
                this.saveSettings();
            });
        }

        // Expand Player Button
        const expandPlayerBtn = document.getElementById('expandPlayerBtn');
        if (expandPlayerBtn) {
            expandPlayerBtn.addEventListener('click', () => {
                this.settings.miniPlayerMode = false;
                this.toggleMiniPlayer(false);
                if (miniPlayerToggle) {
                    miniPlayerToggle.checked = false;
                }
                this.saveSettings();
            });
        }

        // Clear Cache Button
        const clearCacheBtn = document.getElementById('clearCacheBtn');
        if (clearCacheBtn) {
            clearCacheBtn.addEventListener('click', () => {
                this.clearCache();
            });
        }

        // Keyboard Shortcuts Modal
        const shortcutsModal = document.getElementById('keyboardShortcutsModal');
        const showShortcutsBtn = document.getElementById('showShortcutsBtn');
        const closeShortcutsBtn = document.querySelector('.close-shortcuts-btn');

        if (showShortcutsBtn && shortcutsModal && closeShortcutsBtn) {
            // Show modal
            showShortcutsBtn.addEventListener('click', () => {
                shortcutsModal.classList.add('show');
            });

            // Close modal
            closeShortcutsBtn.addEventListener('click', () => {
                shortcutsModal.classList.remove('show');
            });

            // Close modal when clicking outside
            shortcutsModal.addEventListener('click', (e) => {
                if (e.target === shortcutsModal) {
                    shortcutsModal.classList.remove('show');
                }
            });

            // Close modal with Escape key
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && shortcutsModal.classList.contains('show')) {
                    shortcutsModal.classList.remove('show');
                }
            });
        }

        // Playback Speed Slider
        const playbackSpeedSlider = document.getElementById('playbackSpeedSlider');
        const playbackSpeedValue = document.getElementById('playbackSpeedValue');
        if (playbackSpeedSlider && playbackSpeedValue) {
            playbackSpeedSlider.value = this.settings.playbackSpeed;
            playbackSpeedValue.textContent = `${this.settings.playbackSpeed}x`;
            
            playbackSpeedSlider.addEventListener('input', (e) => {
                const speed = parseFloat(e.target.value);
                this.settings.playbackSpeed = speed;
                playbackSpeedValue.textContent = `${speed}x`;
                this.saveSettings();
                
                // Update audio player speed if it exists
                if (window.player && window.player.audioPlayer) {
                    window.player.audioPlayer.playbackRate = speed;
                }

                // Show notification
                this.showSpeedNotification(speed);
            });
        }

        // Close Behavior Dropdown
        const closeBehaviorDropdown = document.getElementById('closeBehaviorDropdown');
        const closeBehaviorSelected = document.getElementById('closeBehaviorSelected');
        const closeBehaviorOptions = document.getElementById('closeBehaviorOptions');
        if (closeBehaviorDropdown && closeBehaviorSelected && closeBehaviorOptions) {
            // Set initial value
            const initialValue = this.settings.closeBehavior;
            const initialOption = closeBehaviorOptions.querySelector(`[data-value="${initialValue}"]`);
            if (initialOption) {
                closeBehaviorSelected.textContent = initialOption.textContent;
                initialOption.classList.add('active');
            }
            // Setup dropdown behavior
            closeBehaviorDropdown.addEventListener('click', (e) => {
                closeBehaviorDropdown.classList.toggle('open');
            });
            closeBehaviorDropdown.addEventListener('blur', (e) => {
                setTimeout(() => closeBehaviorDropdown.classList.remove('open'), 100);
            });
            // Handle option selection
            closeBehaviorOptions.querySelectorAll('.custom-dropdown-option').forEach(option => {
                option.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const value = option.getAttribute('data-value');
                    const label = option.textContent;
                    this.settings.closeBehavior = value;
                    closeBehaviorSelected.textContent = label;
                    closeBehaviorOptions.querySelectorAll('.custom-dropdown-option').forEach(opt => opt.classList.remove('active'));
                    option.classList.add('active');
                    closeBehaviorDropdown.classList.remove('open');
                    this.saveSettings();
                });
            });
        }
    }

    applySettings() {
        // Apply Dark Mode
        document.body.setAttribute('data-theme', this.settings.darkMode ? 'dark' : 'light');

        // Apply Font Size
        document.body.setAttribute('data-font-size', this.settings.fontSize);

        // Apply Font Family
        document.body.setAttribute('data-font-family', this.settings.fontFamily);

        // Apply Theme Color
        const root = document.documentElement;
        const color = this.settings.themeColor;
        
        // Calculate hover and light variants
        const hoverColor = this.adjustColor(color, -15); // Darker for hover
        const lightColor = this.adjustColor(color, 85, 0.12); // Lighter with opacity for backgrounds
        const successHoverColor = this.adjustColor(color, 80, 0.18); // Slightly darker for success hover
        
        // Update CSS variables
        root.style.setProperty('--primary-color', color);
        root.style.setProperty('--primary-hover', hoverColor);
        root.style.setProperty('--primary-light', lightColor);
        root.style.setProperty('--success-bg', lightColor);
        root.style.setProperty('--success-hover', successHoverColor);

        // Update active color preset
        const colorPresets = document.querySelectorAll('.color-preset');
        colorPresets.forEach(preset => {
            preset.classList.toggle('active', preset.dataset.color === color);
        });
    }

    adjustColor(color, amount, opacity = 1) {
        // Convert hex to RGB
        const r = parseInt(color.slice(1, 3), 16);
        const g = parseInt(color.slice(3, 5), 16);
        const b = parseInt(color.slice(5, 7), 16);

        // For green colors, adjust the green channel more prominently
        const isGreen = g > r && g > b;
        const greenAdjustment = isGreen ? amount * 1.2 : amount;

        // Adjust each component
        const newR = Math.max(0, Math.min(255, r + amount));
        const newG = Math.max(0, Math.min(255, g + greenAdjustment));
        const newB = Math.max(0, Math.min(255, b + amount));

        // Return as rgba
        return `rgba(${newR}, ${newG}, ${newB}, ${opacity})`;
    }

    clearCache() {
        try {
            // Clear localStorage except settings
            const settings = localStorage.getItem('musicPlayerSettings');
            localStorage.clear();
            if (settings) {
                localStorage.setItem('musicPlayerSettings', settings);
            }
            
            // Show success message
            this.showNotification('Cache cleared successfully');
        } catch (error) {
            console.error('Error clearing cache:', error);
            this.showNotification('Error clearing cache');
        }
    }

    showNotification(message) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        
        // Add to document
        document.body.appendChild(notification);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    toggleMiniPlayer(enabled) {
        const miniPlayer = document.getElementById('miniPlayer');
        if (miniPlayer) {
            if (enabled) {
                miniPlayer.classList.add('active');
                document.body.classList.add('mini-player-mode');
                // Send message to main process to handle window size
                if (window.api && window.api.setMiniPlayerSize) {
                    window.api.setMiniPlayerSize(true);
                }
                // Set always on top
                if (window.api && window.api.send) {
                    window.api.send('set-always-on-top', true);
                }
            } else {
                miniPlayer.classList.remove('active');
                document.body.classList.remove('mini-player-mode');
                // Send message to main process to restore window size
                if (window.api && window.api.setMiniPlayerSize) {
                    window.api.setMiniPlayerSize(false);
                }
                // Remove always on top
                if (window.api && window.api.send) {
                    window.api.send('set-always-on-top', false);
                }
            }
        }
    }

    // Show speed change notification
    showSpeedNotification(speed) {
        const notification = document.createElement('div');
        notification.className = 'speed-notification';
        notification.innerHTML = `
            <i class="fas fa-forward"></i>
            <span>Playback Speed: ${speed}x</span>
        `;
        document.body.appendChild(notification);

        // Trigger animation
        requestAnimationFrame(() => {
            notification.classList.add('show');
        });

        // Remove notification after 2 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300); // Wait for fade out animation
        }, 2000);
    }
}

// Initialize settings when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.settingsManager = new SettingsManager();
}); 