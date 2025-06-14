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

        this.isPlaying = false;
        this.currentTrackIndex = -1;
        this.audioPlayer = new Audio();
        this.updateProgressInterval = null;
        this.currentPlaylist = [];
        this.skipDuration = 5;
        this.lastSkipTime = 0;
        this.isMuted = false;
        this.lastVolume = 100;
    }

    // Initialize player
    init() {
        this.setupEventListeners();
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

        // Listen for track list updates
        window.addEventListener('trackListUpdated', (event) => {
            this.currentPlaylist = event.detail.tracks;
        });

        // Listen for play track events
        window.addEventListener('playTrack', (event) => {
            if (event.detail.isPlaylist) {
                // If it's a playlist, update the current playlist and play the track
                this.currentPlaylist = event.detail.tracks;
                this.playTrack(event.detail.index, event.detail.shape);
            } else {
                // If it's a single track, just play it
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
    }

    // Play a track
    playTrack(index, shape) {
        if (this.currentPlaylist[index]) {
            const track = this.currentPlaylist[index];
            this.currentTrackIndex = index;
            
            // Update audio source and play
            this.audioPlayer.src = track.path;
            this.audioPlayer.play();
            this.isPlaying = true;
            
            // Update UI
            this.updateNowPlaying(track, shape);
            const icon = this.playBtn.querySelector('i');
            icon.classList.remove('fa-play');
            icon.classList.add('fa-pause');
            
            // Update active state in the list
            document.querySelectorAll('.music-item').forEach(el => {
                el.classList.remove('active');
            });
            document.querySelector(`.music-item[data-index="${index}"]`)?.classList.add('active');
            
            // Start progress update interval
            this.startProgressUpdate();
        }
    }

    // Toggle play/pause
    togglePlay() {
        if (this.currentTrackIndex === -1) {
            // If no track is selected, play the first one
            if (this.currentPlaylist.length > 0) {
                this.playTrack(0);
            }
            return;
        }

        this.isPlaying = !this.isPlaying;
        const icon = this.playBtn.querySelector('i');
        if (this.isPlaying) {
            this.audioPlayer.play();
            icon.classList.remove('fa-play');
            icon.classList.add('fa-pause');
            this.startProgressUpdate();
        } else {
            this.audioPlayer.pause();
            icon.classList.remove('fa-pause');
            icon.classList.add('fa-play');
            clearInterval(this.updateProgressInterval);
        }
    }

    // Play previous track
    playPrevious() {
        if (this.currentPlaylist.length === 0) return;
        
        let newIndex = this.currentTrackIndex - 1;
        if (newIndex < 0) {
            newIndex = this.currentPlaylist.length - 1;
        }
        this.playTrack(newIndex);
    }

    // Play next track
    playNext() {
        if (this.currentPlaylist.length === 0) return;
        
        let newIndex = this.currentTrackIndex + 1;
        if (newIndex >= this.currentPlaylist.length) {
            newIndex = 0;
        }
        this.playTrack(newIndex);
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
        if (this.currentPlaylist.length > 0) {
            this.playNext();
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
            this.totalTimeEl.textContent = this.formatTime(this.audioPlayer.duration);
        }
    }

    // Update now playing info
    updateNowPlaying(track, shape) {
        this.trackNameEl.textContent = track.name;
        this.artistNameEl.textContent = track.artist;
        this.albumArtEl.src = shape || this.generateGeometricShape();
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
} 