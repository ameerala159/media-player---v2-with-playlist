// Settings Management
class SettingsManager {
    constructor() {
        this.settings = {
            darkMode: false,
            fontSize: 'medium',
            fontFamily: "'Comfortaa', cursive",
            autoShuffle: false,
            repeatMode: 'none',
            trackNotifications: true,
            themeColor: '#1db954', // Default theme color
            shuffle: false // Add shuffle setting
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
    }

    loadSettings() {
        try {
            const savedSettings = localStorage.getItem('musicPlayerSettings');
            if (savedSettings) {
                const parsedSettings = JSON.parse(savedSettings);
                // Merge saved settings with defaults, ensuring all properties exist
                this.settings = {
                    darkMode: parsedSettings.darkMode ?? false,
                    fontSize: parsedSettings.fontSize ?? 'medium',
                    fontFamily: parsedSettings.fontFamily ?? "'Comfortaa', cursive",
                    autoShuffle: parsedSettings.autoShuffle ?? false,
                    repeatMode: parsedSettings.repeatMode ?? 'none',
                    trackNotifications: parsedSettings.trackNotifications ?? true,
                    themeColor: parsedSettings.themeColor ?? '#1db954',
                    shuffle: parsedSettings.shuffle ?? false
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

        // Font Size Select
        const fontSizeSelect = document.getElementById('fontSizeSelect');
        if (fontSizeSelect) {
            fontSizeSelect.value = this.settings.fontSize;
            fontSizeSelect.addEventListener('change', (e) => {
                this.settings.fontSize = e.target.value;
                this.applySettings();
                this.saveSettings();
            });
        }

        // Font Family Select
        const fontFamilySelect = document.getElementById('fontFamilySelect');
        if (fontFamilySelect) {
            fontFamilySelect.value = this.settings.fontFamily;
            fontFamilySelect.addEventListener('change', (e) => {
                this.settings.fontFamily = e.target.value;
                this.applySettings();
                this.saveSettings();
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

        // Repeat Mode Select
        const repeatModeSelect = document.getElementById('repeatModeSelect');
        if (repeatModeSelect) {
            repeatModeSelect.value = this.settings.repeatMode;
            repeatModeSelect.addEventListener('change', (e) => {
                this.settings.repeatMode = e.target.value;
                this.saveSettings();
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

        // Clear Cache Button
        const clearCacheBtn = document.getElementById('clearCacheBtn');
        if (clearCacheBtn) {
            clearCacheBtn.addEventListener('click', () => {
                this.clearCache();
            });
        }
    }

    applySettings() {
        // Apply Dark Mode
        document.body.classList.toggle('dark-mode', this.settings.darkMode);

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
}

// Initialize settings when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.settingsManager = new SettingsManager();
}); 