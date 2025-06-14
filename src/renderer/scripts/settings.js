// Settings Management
class SettingsManager {
    constructor() {
        this.settings = {
            darkMode: false,
            fontSize: 'medium',
            fontFamily: "'Comfortaa', cursive",
            autoShuffle: false,
            repeatMode: 'none',
            trackNotifications: true
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
    }

    loadSettings() {
        const savedSettings = localStorage.getItem('musicPlayerSettings');
        if (savedSettings) {
            this.settings = { ...this.settings, ...JSON.parse(savedSettings) };
        }
    }

    saveSettings() {
        localStorage.setItem('musicPlayerSettings', JSON.stringify(this.settings));
    }

    initializeEventListeners() {
        // Dark Mode Toggle
        const darkModeToggle = document.getElementById('darkModeToggle');
        darkModeToggle.checked = this.settings.darkMode;
        darkModeToggle.addEventListener('change', (e) => {
            this.settings.darkMode = e.target.checked;
            this.applySettings();
            this.saveSettings();
        });

        // Font Size Select
        const fontSizeSelect = document.getElementById('fontSizeSelect');
        fontSizeSelect.value = this.settings.fontSize;
        fontSizeSelect.addEventListener('change', (e) => {
            this.settings.fontSize = e.target.value;
            this.applySettings();
            this.saveSettings();
        });

        // Font Family Select
        const fontFamilySelect = document.getElementById('fontFamilySelect');
        fontFamilySelect.value = this.settings.fontFamily;
        fontFamilySelect.addEventListener('change', (e) => {
            this.settings.fontFamily = e.target.value;
            this.applySettings();
            this.saveSettings();
        });

        // Auto Shuffle Toggle
        const autoShuffleToggle = document.getElementById('autoShuffleToggle');
        autoShuffleToggle.checked = this.settings.autoShuffle;
        autoShuffleToggle.addEventListener('change', (e) => {
            this.settings.autoShuffle = e.target.checked;
            this.saveSettings();
        });

        // Repeat Mode Select
        const repeatModeSelect = document.getElementById('repeatModeSelect');
        repeatModeSelect.value = this.settings.repeatMode;
        repeatModeSelect.addEventListener('change', (e) => {
            this.settings.repeatMode = e.target.value;
            this.saveSettings();
        });

        // Track Notifications Toggle
        const trackNotificationsToggle = document.getElementById('trackNotificationsToggle');
        trackNotificationsToggle.checked = this.settings.trackNotifications;
        trackNotificationsToggle.addEventListener('change', (e) => {
            this.settings.trackNotifications = e.target.checked;
            this.saveSettings();
        });

        // Clear Cache Button
        const clearCacheBtn = document.getElementById('clearCacheBtn');
        clearCacheBtn.addEventListener('click', () => {
            this.clearCache();
        });
    }

    applySettings() {
        // Apply Dark Mode
        document.body.classList.toggle('dark-mode', this.settings.darkMode);

        // Apply Font Size
        document.body.setAttribute('data-font-size', this.settings.fontSize);

        // Apply Font Family
        document.body.setAttribute('data-font-family', this.settings.fontFamily);
    }

    clearCache() {
        // Clear localStorage except settings
        const settings = localStorage.getItem('musicPlayerSettings');
        localStorage.clear();
        if (settings) {
            localStorage.setItem('musicPlayerSettings', settings);
        }
        
        // Show success message
        this.showNotification('Cache cleared successfully');
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