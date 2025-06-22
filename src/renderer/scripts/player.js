// Player functionality
export class Player {
    constructor() {
        this.playBtn = document.getElementById('playBtn');
        this.prevBtn = document.getElementById('prevBtn');
        this.nextBtn = document.getElementById('nextBtn');
        this.skipBackwardBtn = document.getElementById('skipBackwardBtn');
        this.skipForwardBtn = document.getElementById('skipForwardBtn');
        this.progressBar = document.querySelector('.progress-bar');
        this.progress = document.querySelector('.progress');
        this.currentTimeEl = document.querySelector('.current-time');
        this.totalTimeEl = document.querySelector('.total-time');
        this.trackNameEl = document.querySelector('.track-name');
        this.artistNameEl = document.querySelector('.artist-name');
        this.albumArtEl = document.querySelector('.album-art');
        this.nowPlaying = document.querySelector('.now-playing');
        this.volumeBtn = document.getElementById('volumeBtn');
        this.volumeSlider = document.getElementById('volumeSlider');
        this.volumeDropdown = document.getElementById('volumeDropdown');

        // Mini player elements
        this.miniPlayBtn = document.getElementById('miniPlayBtn');
        this.miniPrevBtn = document.getElementById('miniPrevBtn');
        this.miniNextBtn = document.getElementById('miniNextBtn');
        this.miniAlbumArt = document.querySelector('.mini-album-art');
        this.miniTrackName = document.querySelector('.mini-track-name');
        this.miniProgressBar = document.querySelector('.mini-progress-bar');
        this.miniProgress = document.querySelector('.mini-progress');
        this.miniCurrentTime = document.querySelector('.mini-current-time');
        this.miniTotalTime = document.querySelector('.mini-total-time');

        this.isPlaying = false;
        this.currentTrackIndex = -1;
        this.audioPlayer = new Audio();
        this.updateProgressInterval = null;
        this.currentPlaylist = [];
        this.skipDuration = 5;
        this.lastSkipTime = 0;
        this.isMuted = false;
        this.lastVolume = 100;
        this.shuffleQueue = [];
        this.isShuffled = false;
        this.showRemainingTime = false;
        this.trackShapes = new Map();

        // Sleep Timer elements
        this.sleepTimerBtn = document.getElementById('sleepTimerBtn');
        this.sleepTimerDropdown = document.getElementById('sleepTimerDropdown');
        this.sleepTimer = null;
        this.sleepTimerEnd = null;
        this.sleepTimerInterval = null;
        this.sleepTimerNotificationEl = null;

        // --- Equalizer (Web Audio API) ---
        this.audioContext = null;
        this.eqFilters = [];
        this.eqFrequencies = [60, 170, 350, 1000, 3500, 10000];
        this.eqSliderIds = ['eq60', 'eq170', 'eq350', 'eq1000', 'eq3500', 'eq10000'];
        this.eqValueIds = ['eq60Value', 'eq170Value', 'eq350Value', 'eq1000Value', 'eq3500Value', 'eq10000Value'];

        // --- Equalizer Presets ---
        this.eqPresets = {
            flat:      [0, 0, 0, 0, 0, 0],
            rock:      [4, 3, 2, 0, 2, 4],
            pop:       [2, 4, 2, 0, 2, 3],
            jazz:      [3, 2, 0, 2, 3, 2],
            classical: [0, 2, 3, 4, 2, 0],
            bass:      [6, 4, 2, 0, -2, -4],
            treble:    [-2, 0, 2, 3, 5, 7],
            custom:    null // Will be set by user
        };

        // Add click handler for total time display
        this.totalTimeEl.addEventListener('click', () => {
            this.showRemainingTime = !this.showRemainingTime;
            this.updateProgress();
        });
    }

    // Initialize player
    init() {
        this.setupEventListeners();
        this.audioPlayer.volume = 1;
        
        // Initialize shuffle state from settings
        this.isShuffled = window.settingsManager.settings.shuffle;
        if (this.isShuffled) {
            this.initializeShuffleQueue();
        }

        // Set initial state for mini controls
        this.updateMiniControlsState();
        
        // Initialize mini player state
        if (this.miniPlayBtn) {
            const miniIcon = this.miniPlayBtn.querySelector('i');
            if (miniIcon) {
                miniIcon.classList.remove('fa-pause');
                miniIcon.classList.add('fa-play');
            }
        }

        // --- Equalizer setup ---
        this.setupEqualizer();
    }

    // Setup event listeners
    setupEventListeners() {
        // Play/Pause
        this.playBtn.addEventListener('click', () => this.togglePlay());

        // Previous track
        this.prevBtn.addEventListener('click', () => this.playPrevious());

        // Next track
        this.nextBtn.addEventListener('click', () => this.playNext());

        // Skip backward
        this.skipBackwardBtn.addEventListener('click', () => this.skipBackward());

        // Skip forward
        this.skipForwardBtn.addEventListener('click', () => this.skipForward());

        // Progress bar
        this.progressBar.addEventListener('click', (e) => this.handleProgressClick(e));

        // Audio player events
        this.audioPlayer.addEventListener('ended', () => this.handleTrackEnd());
        this.audioPlayer.addEventListener('error', (e) => this.handlePlaybackError(e));

        // Now playing click
        this.nowPlaying.addEventListener('click', () => {
            if (this.currentTrackIndex !== -1) {
                window.dispatchEvent(new CustomEvent('showTrackDetails', {
                    detail: { track: this.currentPlaylist[this.currentTrackIndex] }
                }));
            }
        });

        // Listen for thumbnail toolbar clicks
        window.api.receive('thumbnail-toolbar-click', (action) => {
            console.log('Thumbnail toolbar action:', action);
            switch (action) {
                case 'play-pause':
                    this.togglePlay();
                    break;
                case 'prev':
                    this.playPrevious();
                    break;
                case 'next':
                    this.playNext();
                    break;
            }
        });

        // Listen for track list updates
        window.addEventListener('trackListUpdated', (event) => {
            this.currentPlaylist = event.detail.tracks;
            this.updateMiniControlsState();
        });

        // Listen for play track events
        window.addEventListener('playTrack', (event) => {
            if (event.detail.isPlaylist) {
                // If it's a playlist, update the current playlist and play the track
                this.currentPlaylist = event.detail.tracks;
                this.currentPlaylist.isPlaylist = true;  // Mark as playlist
                this.playTrack(event.detail.index, event.detail.shape);
                // Disable shuffle for playlist playback
                this.isShuffled = false;
            } else {
                // If it's a single track from home screen, respect shuffle setting
                this.currentPlaylist = event.detail.tracks;
                this.currentPlaylist.isPlaylist = false;  // Mark as not playlist
                this.isShuffled = window.settingsManager.settings.shuffle;
                if (this.isShuffled) {
                    this.initializeShuffleQueue();
                }
                this.playTrack(event.detail.index, event.detail.shape);
            }
        });

        // Volume control
        this.volumeSlider.addEventListener('input', () => this.handleVolumeChange());
        this.volumeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleVolumeDropdown();
        });

        // Close volume dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!this.volumeBtn.contains(e.target) && !this.volumeDropdown.contains(e.target)) {
                this.volumeDropdown.classList.remove('show');
            }
        });

        // Listen for shuffle state changes
        window.addEventListener('shuffleStateChanged', (event) => {
            this.isShuffled = event.detail.shuffle;
            if (this.isShuffled) {
                this.initializeShuffleQueue();
            }
        });

        // Mini player controls
        if (this.miniPlayBtn) {
            this.miniPlayBtn.addEventListener('click', () => this.togglePlay());
        }
        if (this.miniPrevBtn) {
            this.miniPrevBtn.addEventListener('click', () => {
                console.log('Mini Prev Clicked');
                this.playPrevious();
            });
        }
        if (this.miniNextBtn) {
            this.miniNextBtn.addEventListener('click', () => {
                console.log('Mini Next Clicked');
                this.playNext();
            });
        }
        if (this.miniProgressBar) {
            this.miniProgressBar.addEventListener('click', (e) => this.handleMiniProgressClick(e));
        }

        // Sleep Timer control
        if (this.sleepTimerBtn && this.sleepTimerDropdown) {
            this.sleepTimerBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleSleepTimerDropdown();
            });
            this.sleepTimerDropdown.addEventListener('click', (e) => {
                const option = e.target.closest('.sleep-timer-option');
                if (option) {
                    const minutes = parseInt(option.getAttribute('data-minutes'));
                    this.setSleepTimer(minutes);
                    this.sleepTimerDropdown.classList.remove('show');
                }
            });
            // Close sleep timer dropdown when clicking outside
            document.addEventListener('click', (e) => {
                if (!this.sleepTimerBtn.contains(e.target) && !this.sleepTimerDropdown.contains(e.target)) {
                    this.sleepTimerDropdown.classList.remove('show');
                }
            });
        }
    }

    // Play a track
    playTrack(index, shape) {
        if (index < 0 || index >= this.currentPlaylist.length) return;

        this.currentTrackIndex = index;
        const track = this.currentPlaylist[index];
        
        // Update audio source
        this.audioPlayer.src = track.path;
        
        // Apply saved playback speed
        if (window.settingsManager) {
            this.audioPlayer.playbackRate = window.settingsManager.settings.playbackSpeed;
        }
        
        // Update UI
        this.trackNameEl.textContent = track.name;
        this.artistNameEl.textContent = track.artist || 'Unknown Artist';
        if (this.miniTrackName) {
            this.miniTrackName.textContent = track.name;
        }
        
        // Update album art
        if (track.albumArt) {
            this.albumArtEl.src = track.albumArt;
            if (this.miniAlbumArt) {
                this.miniAlbumArt.src = track.albumArt;
            }
        } else {
            // Get or generate shape for this track
            let coverUrl = this.trackShapes.get(track.path);
            if (!coverUrl) {
                coverUrl = this.generateGeometricShape();
                this.trackShapes.set(track.path, coverUrl);
            }
            this.albumArtEl.src = coverUrl;
            if (this.miniAlbumArt) {
                this.miniAlbumArt.src = coverUrl;
            }
        }

        // Play the track
        this.audioPlayer.play();
        this.isPlaying = true;
        
        // Update play button icons
        const icon = this.playBtn.querySelector('i');
        const miniIcon = this.miniPlayBtn?.querySelector('i');
        if (icon) {
            icon.classList.remove('fa-play');
            icon.classList.add('fa-pause');
        }
        if (miniIcon) {
            miniIcon.classList.remove('fa-play');
            miniIcon.classList.add('fa-pause');
        }

        // Start progress update
        this.startProgressUpdate();
        
        // Update mini controls state
        this.updateMiniControlsState();
        
        // Show notification if enabled
        if (window.settingsManager.settings.trackNotifications) {
            this.showTrackNotification(track);
        }
    }

    // Toggle play/pause
    togglePlay() {
        if (this.currentTrackIndex === -1) return;

        if (this.isPlaying) {
            this.audioPlayer.pause();
            this.isPlaying = false;
            const icon = this.playBtn.querySelector('i');
            if (icon) {
                icon.classList.remove('fa-pause');
                icon.classList.add('fa-play');
            }
            if (this.miniPlayBtn) {
                const miniIcon = this.miniPlayBtn.querySelector('i');
                if (miniIcon) {
                    miniIcon.classList.remove('fa-pause');
                    miniIcon.classList.add('fa-play');
                }
            }
        } else {
            this.audioPlayer.play();
            this.isPlaying = true;
            const icon = this.playBtn.querySelector('i');
            if (icon) {
                icon.classList.remove('fa-play');
                icon.classList.add('fa-pause');
            }
            if (this.miniPlayBtn) {
                const miniIcon = this.miniPlayBtn.querySelector('i');
                if (miniIcon) {
                    miniIcon.classList.remove('fa-play');
                    miniIcon.classList.add('fa-pause');
                }
            }
        }

        // Send playback state to main process for thumbnail toolbar
        window.api.send('playback-state-changed', { isPlaying: this.isPlaying });
    }

    // Play previous track
    playPrevious() {
        if (this.currentPlaylist.length === 0) return;
        
        const newIndex = this.getPreviousTrackIndex();
        if (newIndex !== -1) {
            this.playTrack(newIndex);
        }
    }

    // Play next track
    playNext() {
        if (this.currentPlaylist.length === 0) return;
        
        const newIndex = this.getNextTrackIndex();
        if (newIndex !== -1) {
            this.playTrack(newIndex);
        }
    }

    // Skip backward with debounce
    skipBackward() {
        if (this.currentTrackIndex === -1) return;
        
        const now = Date.now();
        if (now - this.lastSkipTime < 100) return; // Prevent multiple skips within 100ms
        this.lastSkipTime = now;
        
        const newTime = Math.max(0, this.audioPlayer.currentTime - this.skipDuration);
        this.audioPlayer.currentTime = newTime;
        this.updateProgress();
    }

    // Skip forward with debounce
    skipForward() {
        if (this.currentTrackIndex === -1) return;
        
        const now = Date.now();
        if (now - this.lastSkipTime < 100) return; // Prevent multiple skips within 100ms
        this.lastSkipTime = now;
        
        const newTime = Math.min(this.audioPlayer.duration, this.audioPlayer.currentTime + this.skipDuration);
        this.audioPlayer.currentTime = newTime;
        this.updateProgress();
    }

    // Set skip duration
    setSkipDuration(duration) {
        this.skipDuration = duration;
    }

    // Handle progress bar click
    handleProgressClick(e) {
        if (this.currentTrackIndex === -1) return;
        
        const rect = this.progressBar.getBoundingClientRect();
        const pos = (e.clientX - rect.left) / rect.width;
        const newTime = pos * this.audioPlayer.duration;
        
        this.audioPlayer.currentTime = newTime;
        this.updateProgress();
    }

    // Handle track end
    handleTrackEnd() {
        if (this.currentPlaylist.length === 0) return;

        const repeatMode = window.settingsManager.settings.repeatMode;
        
        switch (repeatMode) {
            case 'one':
                // Repeat the current track
                this.audioPlayer.currentTime = 0;
                this.audioPlayer.play();
                break;
            case 'all':
                // Play next track, loop back to start if at end
                const newIndex = this.getNextTrackIndex();
                if (newIndex !== -1) {
                    this.playTrack(newIndex);
                }
                break;
            case 'none':
            default:
                // Play next track, stop if at end
                if (this.currentTrackIndex < this.currentPlaylist.length - 1 || this.isShuffled) {
                    const nextIndex = this.getNextTrackIndex();
                    if (nextIndex !== -1) {
                        this.playTrack(nextIndex);
                    }
                } else {
                    // Stop playback at the end
                    this.audioPlayer.pause();
                    this.audioPlayer.currentTime = 0;
                    this.isPlaying = false;
                    const icon = this.playBtn.querySelector('i');
                    icon.classList.remove('fa-pause');
                    icon.classList.add('fa-play');
                    clearInterval(this.updateProgressInterval);
                    this.progress.style.width = '0%';
                    this.currentTimeEl.textContent = '0:00';
                    this.totalTimeEl.textContent = '0:00';
                    
                    // Remove active state from the current track
                    document.querySelectorAll('.music-item').forEach(el => {
                        el.classList.remove('active');
                    });
                }
                break;
        }
    }

    // Handle playback error
    handlePlaybackError(e) {
        console.error('Error playing audio:', e);
        this.playNext();
    }

    // Start progress update interval
    startProgressUpdate() {
        if (this.updateProgressInterval) {
            clearInterval(this.updateProgressInterval);
        }
        this.updateProgressInterval = setInterval(() => this.updateProgress(), 1000);
    }

    // Update progress
    updateProgress() {
        if (this.audioPlayer.duration) {
            const progressPercent = (this.audioPlayer.currentTime / this.audioPlayer.duration) * 100;
            this.progress.style.width = `${progressPercent}%`;
            this.currentTimeEl.textContent = this.formatTime(this.audioPlayer.currentTime);
            if (this.showRemainingTime) {
                const remainingTime = this.audioPlayer.duration - this.audioPlayer.currentTime;
                this.totalTimeEl.textContent = `-${this.formatTime(remainingTime)}`;
            } else {
                this.totalTimeEl.textContent = this.formatTime(this.audioPlayer.duration);
            }
            // Mini player sync
            if (this.miniProgress) {
                this.miniProgress.style.width = `${progressPercent}%`;
            }
            if (this.miniCurrentTime) {
                this.miniCurrentTime.textContent = this.formatTime(this.audioPlayer.currentTime);
            }
            if (this.miniTotalTime) {
                this.miniTotalTime.textContent = this.formatTime(this.audioPlayer.duration);
            }
        }
    }

    // Update now playing info
    updateNowPlaying(track, shape) {
        // Update main player
        this.trackNameEl.textContent = track.name;
        this.artistNameEl.textContent = track.artist || 'Unknown artist';
        
        if (track.albumArt) {
            this.albumArtEl.src = track.albumArt;
        } else {
            // Get or generate shape for this track
            let coverUrl = this.trackShapes.get(track.path);
            if (!coverUrl) {
                coverUrl = this.generateGeometricShape();
                this.trackShapes.set(track.path, coverUrl);
            }
            this.albumArtEl.src = coverUrl;
        }

        // Update mini player
        if (this.miniTrackName) {
            this.miniTrackName.textContent = track.name;
        }
        if (this.miniAlbumArt) {
            if (track.albumArt) {
                this.miniAlbumArt.src = track.albumArt;
            } else {
                // Get or generate shape for this track
                let coverUrl = this.trackShapes.get(track.path);
                if (!coverUrl) {
                    coverUrl = this.generateGeometricShape();
                    this.trackShapes.set(track.path, coverUrl);
                }
                this.miniAlbumArt.src = coverUrl;
            }
        }
    }

    // Format time
    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    // Generate geometric shape for album art
    generateGeometricShape() {
        const colors = ['#1db954', '#1ed760', '#1aa34a'];
        const color = colors[Math.floor(Math.random() * colors.length)];
        const shapes = [
            `<rect width="100" height="100" fill="${color}"/>`,
            `<circle cx="50" cy="50" r="40" fill="${color}"/>`,
            `<polygon points="50,10 90,90 10,90" fill="${color}"/>`,
            `<rect x="20" y="20" width="60" height="60" fill="${color}"/>`,
            `<circle cx="50" cy="50" r="30" fill="${color}"/>`
        ];
        const shape = shapes[Math.floor(Math.random() * shapes.length)];
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">${shape}</svg>`;
        return `data:image/svg+xml;base64,${btoa(svg)}`;
    }

    // Clear playlist and reset player
    clearPlaylist() {
        // Stop playback
        this.audioPlayer.pause();
        this.audioPlayer.src = '';
        this.audioPlayer.currentTime = 0;
        
        // Clear progress update interval
        if (this.updateProgressInterval) {
            clearInterval(this.updateProgressInterval);
            this.updateProgressInterval = null;
        }
        
        // Reset player state
        this.isPlaying = false;
        this.currentTrackIndex = -1;
        this.currentPlaylist = [];
        
        // Reset UI
        const icon = this.playBtn.querySelector('i');
        icon.classList.remove('fa-pause');
        icon.classList.add('fa-play');
        
        this.progress.style.width = '0%';
        this.trackNameEl.textContent = 'No track selected';
        this.artistNameEl.textContent = '';
        this.albumArtEl.src = '';
        this.currentTimeEl.textContent = '0:00';
        this.totalTimeEl.textContent = '0:00';

        this.updateMiniControlsState();
    }

    // Toggle volume dropdown
    toggleVolumeDropdown() {
        this.volumeDropdown.classList.toggle('show');
    }

    // Handle volume change
    handleVolumeChange() {
        const volume = parseInt(this.volumeSlider.value);
        this.audioPlayer.volume = volume / 100;
        this.updateVolumeIcon(volume);
        this.isMuted = false;
        this.lastVolume = volume;
    }

    // Toggle mute
    toggleMute() {
        if (this.isMuted) {
            // Unmute
            this.audioPlayer.volume = this.lastVolume / 100;
            this.volumeSlider.value = this.lastVolume;
            this.isMuted = false;
        } else {
            // Mute
            this.lastVolume = parseInt(this.volumeSlider.value);
            this.audioPlayer.volume = 0;
            this.volumeSlider.value = 0;
            this.isMuted = true;
        }
        this.updateVolumeIcon(parseInt(this.volumeSlider.value));
    }

    // Update volume icon based on volume level
    updateVolumeIcon(volume) {
        const icon = this.volumeBtn.querySelector('i');
        icon.className = ''; // Clear existing classes
        
        if (volume === 0) {
            icon.className = 'fas fa-volume-mute';
        } else if (volume < 50) {
            icon.className = 'fas fa-volume-down';
        } else {
            icon.className = 'fas fa-volume-up';
        }
    }

    // Initialize shuffle queue
    initializeShuffleQueue() {
        if (this.currentPlaylist.length === 0) return;
        
        // Create a copy of the playlist excluding the current track
        this.shuffleQueue = [...this.currentPlaylist];
        if (this.currentTrackIndex !== -1) {
            this.shuffleQueue.splice(this.currentTrackIndex, 1);
        }
        
        // Shuffle the queue
        for (let i = this.shuffleQueue.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.shuffleQueue[i], this.shuffleQueue[j]] = [this.shuffleQueue[j], this.shuffleQueue[i]];
        }
    }

    // Get next track index based on shuffle state
    getNextTrackIndex() {
        if (this.currentPlaylist.length === 0) return -1;
        
        // Only apply shuffle if we're not playing from a playlist
        if (this.isShuffled && !this.currentPlaylist.isPlaylist) {
            if (this.shuffleQueue.length === 0) {
                this.initializeShuffleQueue();
            }
            const nextTrack = this.shuffleQueue.shift();
            return this.currentPlaylist.indexOf(nextTrack);
        } else {
            let newIndex = this.currentTrackIndex + 1;
            if (newIndex >= this.currentPlaylist.length) {
                newIndex = 0;
            }
            return newIndex;
        }
    }

    // Get previous track index based on shuffle state
    getPreviousTrackIndex() {
        if (this.currentPlaylist.length === 0) return -1;
        
        // Only apply shuffle if we're not playing from a playlist
        if (this.isShuffled && !this.currentPlaylist.isPlaylist) {
            // In shuffle mode, we'll just go back to the previous track in the playlist
            let newIndex = this.currentTrackIndex - 1;
            if (newIndex < 0) {
                newIndex = this.currentPlaylist.length - 1;
            }
            return newIndex;
        } else {
            let newIndex = this.currentTrackIndex - 1;
            if (newIndex < 0) {
                newIndex = this.currentPlaylist.length - 1;
            }
            return newIndex;
        }
    }

    handleMiniProgressClick(e) {
        if (this.currentTrackIndex === -1 || !this.audioPlayer.duration) return;
        const rect = this.miniProgressBar.getBoundingClientRect();
        const pos = (e.clientX - rect.left) / rect.width;
        const newTime = pos * this.audioPlayer.duration;
        this.audioPlayer.currentTime = newTime;
        this.updateProgress();
    }

    updateMiniControlsState() {
        const hasTrack = this.currentPlaylist.length > 0 && this.currentTrackIndex !== -1;
        const multipleTracks = this.currentPlaylist.length > 1;
        
        // Update mini player buttons state
        if (this.miniPrevBtn) {
            this.miniPrevBtn.disabled = !hasTrack || !multipleTracks;
            this.miniPrevBtn.style.opacity = (!hasTrack || !multipleTracks) ? '0.4' : '1';
        }
        if (this.miniNextBtn) {
            this.miniNextBtn.disabled = !hasTrack || !multipleTracks;
            this.miniNextBtn.style.opacity = (!hasTrack || !multipleTracks) ? '0.4' : '1';
        }
        if (this.miniPlayBtn) {
            this.miniPlayBtn.disabled = !hasTrack;
            this.miniPlayBtn.style.opacity = !hasTrack ? '0.4' : '1';
        }
    }

    toggleSleepTimerDropdown() {
        this.sleepTimerDropdown.classList.toggle('show');
    }

    setSleepTimer(minutes) {
        if (this.sleepTimer) {
            clearTimeout(this.sleepTimer);
            this.sleepTimer = null;
            this.sleepTimerEnd = null;
        }
        if (this.sleepTimerInterval) {
            clearInterval(this.sleepTimerInterval);
            this.sleepTimerInterval = null;
        }
        // Remove any existing notification
        if (this.sleepTimerNotificationEl) {
            this.sleepTimerNotificationEl.remove();
            this.sleepTimerNotificationEl = null;
        }
        if (minutes > 0) {
            const ms = minutes * 60 * 1000;
            this.sleepTimerEnd = Date.now() + ms;
            this.sleepTimer = setTimeout(() => {
                this.audioPlayer.pause();
                this.isPlaying = false;
                const icon = this.playBtn.querySelector('i');
                if (icon) {
                    icon.classList.remove('fa-pause');
                    icon.classList.add('fa-play');
                }
                if (this.miniPlayBtn) {
                    const miniIcon = this.miniPlayBtn.querySelector('i');
                    if (miniIcon) {
                        miniIcon.classList.remove('fa-pause');
                        miniIcon.classList.add('fa-play');
                    }
                }
                this.showSleepTimerNotification('Sleep timer expired. Playback stopped.');
                if (this.sleepTimerInterval) {
                    clearInterval(this.sleepTimerInterval);
                    this.sleepTimerInterval = null;
                }
            }, ms);
            // Show and update notification
            this.showSleepTimerNotification();
            this.sleepTimerInterval = setInterval(() => {
                this.showSleepTimerNotification();
            }, 1000);
        }
    }

    showSleepTimerNotification(message) {
        // Remove any existing notification
        if (this.sleepTimerNotificationEl) {
            this.sleepTimerNotificationEl.remove();
            this.sleepTimerNotificationEl = null;
        }
        // If timer is running, show remaining time
        if (!message && this.sleepTimerEnd) {
            const remaining = Math.max(0, this.sleepTimerEnd - Date.now());
            const mins = Math.floor(remaining / 60000);
            const secs = Math.floor((remaining % 60000) / 1000);
            let text = '';
            if (mins > 0) {
                text = `Sleep timer: ${mins}m ${secs.toString().padStart(2, '0')}s remaining`;
            } else {
                text = `Sleep timer: ${secs}s remaining`;
            }
            this.sleepTimerNotificationEl = document.createElement('div');
            this.sleepTimerNotificationEl.className = 'notification sleep-timer-popup show';
            this.sleepTimerNotificationEl.innerHTML = `<i class='fas fa-moon'></i> <span>${text}</span>`;
            document.body.appendChild(this.sleepTimerNotificationEl);
        } else if (message) {
            // Show expiration message
            this.sleepTimerNotificationEl = document.createElement('div');
            this.sleepTimerNotificationEl.className = 'notification sleep-timer-popup show';
            this.sleepTimerNotificationEl.innerHTML = `<i class='fas fa-moon'></i> <span>${message}</span>`;
            document.body.appendChild(this.sleepTimerNotificationEl);
            setTimeout(() => {
                if (this.sleepTimerNotificationEl) {
                    this.sleepTimerNotificationEl.classList.remove('show');
                    setTimeout(() => {
                        if (this.sleepTimerNotificationEl) {
                            this.sleepTimerNotificationEl.remove();
                            this.sleepTimerNotificationEl = null;
                        }
                    }, 300);
                }
            }, 3000);
        }
    }

    setupEqualizer() {
        // Create AudioContext and filters if not already created
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            // Create filters for each band
            this.eqFilters = this.eqFrequencies.map((freq, i) => {
                const filter = this.audioContext.createBiquadFilter();
                filter.type = 'peaking';
                filter.frequency.value = freq;
                filter.Q.value = 1.0;
                filter.gain.value = 0;
                return filter;
            });
            // Connect filters in series
            for (let i = 0; i < this.eqFilters.length - 1; i++) {
                this.eqFilters[i].connect(this.eqFilters[i + 1]);
            }
            // Connect audio element to filters
            this.sourceNode = this.audioContext.createMediaElementSource(this.audioPlayer);
            this.sourceNode.connect(this.eqFilters[0]);
            this.eqFilters[this.eqFilters.length - 1].connect(this.audioContext.destination);
        }

        // Load saved preset from settings
        const savedPreset = window.settingsManager.settings.eqPreset;
        const presetSelect = document.getElementById('eqPresetSelect');
        if (presetSelect && savedPreset) {
            presetSelect.value = savedPreset;
            this.applyEqPreset(savedPreset);
        }
        
        // Preset dropdown logic
        if (presetSelect) {
            presetSelect.addEventListener('change', () => {
                const preset = presetSelect.value;
                if (preset !== 'custom' && this.eqPresets[preset]) {
                    this.applyEqPreset(preset);
                }
                // Save the preset to settings
                window.settingsManager.settings.eqPreset = preset;
                window.settingsManager.saveSettings();
            });
        }
        // Wire up sliders and reset buttons
        this.eqSliderIds.forEach((id, i) => {
            const slider = document.getElementById(id);
            const valueLabel = document.getElementById(this.eqValueIds[i]);
            const resetBtn = document.querySelector(`.eq-reset-btn[data-eq-id='${id}']`);
            if (slider && valueLabel) {
                slider.addEventListener('input', () => {
                    const gain = parseInt(slider.value, 10);
                    this.eqFilters[i].gain.value = gain;
                    valueLabel.textContent = `${gain} dB`;
                    // If user moves a slider, set preset to custom
                    const presetSelect = document.getElementById('eqPresetSelect');
                    if (presetSelect) {
                        presetSelect.value = 'custom';
                        window.settingsManager.settings.eqPreset = 'custom';
                    }
                    // Save custom band values
                    const bandValues = this.eqSliderIds.map(id => parseInt(document.getElementById(id).value, 10));
                    window.settingsManager.settings.eqBands = bandValues;
                    window.settingsManager.saveSettings();
                });
                // Double-click on slider resets to 0
                slider.addEventListener('dblclick', () => {
                    slider.value = 0;
                    this.eqFilters[i].gain.value = 0;
                    valueLabel.textContent = `0 dB`;
                    // If user resets, set preset to custom
                    const presetSelect = document.getElementById('eqPresetSelect');
                    if (presetSelect) {
                        presetSelect.value = 'custom';
                        window.settingsManager.settings.eqPreset = 'custom';
                    }
                    // Save custom band values
                    const bandValues = this.eqSliderIds.map(id => parseInt(document.getElementById(id).value, 10));
                    window.settingsManager.settings.eqBands = bandValues;
                    window.settingsManager.saveSettings();
                });
                // Set initial value
                valueLabel.textContent = `${slider.value} dB`;
            }
            if (resetBtn && slider && valueLabel) {
                resetBtn.addEventListener('click', () => {
                    slider.value = 0;
                    this.eqFilters[i].gain.value = 0;
                    valueLabel.textContent = `0 dB`;
                    // If user resets, set preset to custom
                    const presetSelect = document.getElementById('eqPresetSelect');
                    if (presetSelect) {
                        presetSelect.value = 'custom';
                        window.settingsManager.settings.eqPreset = 'custom';
                    }
                    // Save custom band values
                    const bandValues = this.eqSliderIds.map(id => parseInt(document.getElementById(id).value, 10));
                    window.settingsManager.settings.eqBands = bandValues;
                    window.settingsManager.saveSettings();
                });
            }
        });
    }

    applyEqPreset(preset) {
        if (!this.eqPresets[preset]) return;
        
        const values = (preset === 'custom')
            ? window.settingsManager.settings.eqBands
            : this.eqPresets[preset];

        this.eqSliderIds.forEach((id, i) => {
            const slider = document.getElementById(id);
            const valueLabel = document.getElementById(this.eqValueIds[i]);
            if (slider && valueLabel) {
                const gain = values[i];
                slider.value = gain;
                if (this.eqFilters[i]) {
                    this.eqFilters[i].gain.value = gain;
                }
                valueLabel.textContent = `${gain} dB`;
            }
        });
    }
} 