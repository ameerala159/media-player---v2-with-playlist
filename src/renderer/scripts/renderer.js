// This file will contain your renderer process code
console.log('Renderer process started');

// Import modules
import { HomePage } from './pages/home.js';
import { FavoritesPage } from './pages/favorites.js';
import { TrackDetails } from './pages/trackDetails.js';
import { Player } from './player.js';
import { PlaylistsPage } from './pages/playlists.js';
import { FoldersPage } from './pages/folders.js';

let skipDuration = 5; // Initialize skip duration to 5 seconds here, at the module level

document.addEventListener('DOMContentLoaded', () => {
    // Initialize player first
    const player = new Player();
    window.player = player; // Make player available globally
    player.init();

    // Initialize other modules
    const homePage = new HomePage();
    window.homePage = homePage;
    const favoritesPage = new FavoritesPage();
    const trackDetails = new TrackDetails();
    const playlistsPage = new PlaylistsPage();
    const foldersPage = new FoldersPage(player);

    // Make playlistsPage available globally for the add to playlist functionality
    window.playlistsPage = playlistsPage;

    // Initialize all modules
    homePage.init();
    favoritesPage.init();
    trackDetails.init();
    playlistsPage.init();
    foldersPage.init();

    // Page navigation
    const navItems = document.querySelectorAll('.nav-item');
    const pages = document.querySelectorAll('.page');

    function showPage(pageId) {
        pages.forEach(page => {
            page.classList.remove('active');
        });
        const pageToShow = document.getElementById(`${pageId}-page`);
        if (pageToShow) {
            pageToShow.classList.add('active');
        }

        // Only reload the root of the folders page
        if (pageId === 'folders' && !foldersPage.currentSubfolder) {
            foldersPage.loadSubfolders();
        }

        // Always refresh favorites when navigating to the page
        if (pageId === 'favorites') {
            favoritesPage.updateFavoritesList();
        }
    }

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
            const pageId = item.getAttribute('data-page');
            showPage(pageId);
        });
    });

    // Handle thumbnail toolbar button clicks
    window.api.receive('thumbnail-toolbar-click', (action) => {
        console.log('Thumbnail toolbar action:', action);
        switch (action) {
            case 'prev':
                const prevBtn = document.getElementById('prevBtn');
                if (prevBtn) {
                    prevBtn.click();
                }
                break;
            case 'play-pause':
                const playPauseBtn = document.getElementById('playPauseBtn');
                if (playPauseBtn) {
                    playPauseBtn.click();
                }
                break;
            case 'next':
                const nextBtn = document.getElementById('nextBtn');
                if (nextBtn) {
                    nextBtn.click();
                }
                break;
        }
    });

    // Update thumbnail toolbar when play state changes
    function updateThumbnailToolbar() {
        const isPlaying = !player.audioPlayer.paused;
        window.api.send('update-thumbnail-toolbar', {
            button: isPlaying ? 'play' : 'pause',
            icon: isPlaying ? 'pause' : 'play'
        });
    }

    // Add event listeners for play state changes
    player.audioPlayer.addEventListener('play', updateThumbnailToolbar);
    player.audioPlayer.addEventListener('pause', updateThumbnailToolbar);
    player.audioPlayer.addEventListener('ended', updateThumbnailToolbar);

    // Add keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Don't trigger shortcuts if user is typing in an input field
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            return;
        }

        // Space or Ctrl + P for play/pause
        if (e.code === 'Space' || (e.ctrlKey && e.key.toLowerCase() === 'p')) {
            e.preventDefault(); // Prevent page scroll on space
            player.togglePlay();
        }
        
        // Ctrl + D for dark mode
        if (e.ctrlKey && e.key.toLowerCase() === 'd') {
            e.preventDefault();
            document.body.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
            const darkModeToggle = document.getElementById('darkModeToggle');
            if (darkModeToggle) {
                darkModeToggle.checked = true;
            }
        }
        
        // Ctrl + L for light mode
        if (e.ctrlKey && e.key.toLowerCase() === 'l') {
            e.preventDefault();
            document.body.removeAttribute('data-theme');
            localStorage.setItem('theme', 'light');
            const darkModeToggle = document.getElementById('darkModeToggle');
            if (darkModeToggle) {
                darkModeToggle.checked = false;
            }
        }
        
        // Left Arrow for skip backward
        if (e.code === 'ArrowLeft') {
            e.preventDefault();
            player.skipBackward();
        }
        
        // Right Arrow for skip forward
        if (e.code === 'ArrowRight') {
            e.preventDefault();
            player.skipForward();
        }

        // Ctrl + F for shuffle
        if (e.ctrlKey && e.key.toLowerCase() === 'f') {
            e.preventDefault();
            const shuffleToggle = document.getElementById('shuffleToggle');
            if (shuffleToggle) {
                shuffleToggle.checked = !shuffleToggle.checked;
                shuffleToggle.dispatchEvent(new Event('change'));
            }
        }

        // Ctrl + R for repeat once
        if (e.ctrlKey && e.key.toLowerCase() === 'r') {
            e.preventDefault();
            const repeatModeSelect = document.getElementById('repeatModeSelect');
            if (repeatModeSelect) {
                repeatModeSelect.value = 'one';
                repeatModeSelect.dispatchEvent(new Event('change'));
            }
        }

        // Ctrl + M for mini mode
        if (e.ctrlKey && e.key.toLowerCase() === 'm') {
            e.preventDefault();
            const miniPlayerToggle = document.getElementById('miniPlayerToggle');
            if (miniPlayerToggle) {
                miniPlayerToggle.checked = !miniPlayerToggle.checked;
                miniPlayerToggle.dispatchEvent(new Event('change'));
            }
        }

        // F key for maximize/restore
        if (e.key.toLowerCase() === 'f' && !e.ctrlKey && !e.altKey && !e.shiftKey) {
            e.preventDefault();
            const maximizeBtn = document.getElementById('maximizeBtn');
            if (maximizeBtn) {
                maximizeBtn.click();
            }
        }

        // Ctrl + Right Arrow for next track
        if (e.ctrlKey && e.key === 'ArrowRight') {
            e.preventDefault();
            const nextBtn = document.getElementById('nextBtn');
            if (nextBtn) {
                nextBtn.click();
            }
        }

        // Ctrl + Left Arrow for previous track
        if (e.ctrlKey && e.key === 'ArrowLeft') {
            e.preventDefault();
            const prevBtn = document.getElementById('prevBtn');
            if (prevBtn) {
                prevBtn.click();
            }
        }

        // Ctrl + ] to increase playback speed
        if (e.ctrlKey && e.key === ']') {
            e.preventDefault();
            const speedSlider = document.getElementById('playbackSpeedSlider');
            if (speedSlider) {
                const currentSpeed = parseFloat(speedSlider.value);
                const newSpeed = Math.min(4, currentSpeed + 0.1);
                speedSlider.value = newSpeed;
                speedSlider.dispatchEvent(new Event('input'));
            }
        }

        // Ctrl + [ to decrease playback speed
        if (e.ctrlKey && e.key === '[') {
            e.preventDefault();
            const speedSlider = document.getElementById('playbackSpeedSlider');
            if (speedSlider) {
                const currentSpeed = parseFloat(speedSlider.value);
                const newSpeed = Math.max(0.5, currentSpeed - 0.1);
                speedSlider.value = newSpeed;
                speedSlider.dispatchEvent(new Event('input'));
            }
        }

        // Ctrl + E to toggle equalizer preset
        if (e.ctrlKey && e.key.toLowerCase() === 'e') {
            e.preventDefault();
            const presetSelect = document.getElementById('eqPresetSelect');
            if (presetSelect) {
                const options = Array.from(presetSelect.options).filter(opt => opt.value !== 'custom');
                const currentIdx = options.findIndex(opt => opt.value === presetSelect.value);
                const nextIdx = (currentIdx + 1) % options.length;
                presetSelect.value = options[nextIdx].value;
                presetSelect.dispatchEvent(new Event('change'));
            }
        }

        // Ctrl+S for lyrics
        if (e.ctrlKey && e.key.toLowerCase() === 's') {
            e.preventDefault();
            if (window.player && typeof window.player.handleLyricsClick === 'function') {
                window.player.handleLyricsClick();
            }
        }
    });

    // Listen for track details show event
    window.addEventListener('showTrackDetails', (event) => {
        trackDetails.showTrackDetails(event.detail.track);
    });

    // Window control buttons
    const minimizeBtn = document.getElementById('minimizeBtn');
    const maximizeBtn = document.getElementById('maximizeBtn');
    const closeBtn = document.getElementById('closeBtn');

    // Window control event listeners
    minimizeBtn.addEventListener('click', () => {
        window.api.send('toMain', { action: 'minimize' });
    });

    maximizeBtn.addEventListener('click', () => {
        window.api.send('toMain', { action: 'maximize' });
    });

    const closeModal = document.getElementById('closeModal');
    const closeModalMinimizeBtn = document.getElementById('closeModalMinimizeBtn');
    const closeModalCloseBtn = document.getElementById('closeModalCloseBtn');
    const closeModalCancelBtn = document.getElementById('closeModalCancelBtn');
    const rememberCloseChoice = document.getElementById('rememberCloseChoice');

    function showCloseModal() {
        closeModal.style.display = 'flex';
    }
    function hideCloseModal() {
        closeModal.style.display = 'none';
        rememberCloseChoice.checked = false;
    }

    closeBtn.addEventListener('click', (e) => {
        // Only show modal if setting is 'ask'
        if (window.settingsManager?.settings?.closeBehavior === 'ask') {
            showCloseModal();
        } else if (window.settingsManager?.settings?.closeBehavior === 'minimize') {
            window.api.send('toMain', { action: 'close' });
        } else if (window.settingsManager?.settings?.closeBehavior === 'close') {
            window.api.send('toMain', { action: 'close' });
        }
    });

    function updateCloseBehaviorDropdownUI(value) {
        const closeBehaviorDropdown = document.getElementById('closeBehaviorDropdown');
        const closeBehaviorSelected = document.getElementById('closeBehaviorSelected');
        const closeBehaviorOptions = document.getElementById('closeBehaviorOptions');
        if (closeBehaviorDropdown && closeBehaviorSelected && closeBehaviorOptions) {
            const selectedOption = closeBehaviorOptions.querySelector(`[data-value="${value}"]`);
            if (selectedOption) {
                closeBehaviorSelected.textContent = selectedOption.textContent;
                closeBehaviorOptions.querySelectorAll('.custom-dropdown-option').forEach(opt => opt.classList.remove('active'));
                selectedOption.classList.add('active');
            }
        }
    }

    closeModalMinimizeBtn.addEventListener('click', () => {
        if (rememberCloseChoice.checked) {
            window.settingsManager.settings.closeBehavior = 'minimize';
            window.settingsManager.saveSettings();
            window.api.send('set-close-behavior', 'minimize');
            updateCloseBehaviorDropdownUI('minimize');
        }
        hideCloseModal();
        window.api.send('toMain', { action: 'minimize' });
    });

    closeModalCloseBtn.addEventListener('click', () => {
        if (rememberCloseChoice.checked) {
            window.settingsManager.settings.closeBehavior = 'close';
            window.settingsManager.saveSettings();
            window.api.send('set-close-behavior', 'close');
            updateCloseBehaviorDropdownUI('close');
        }
        hideCloseModal();
        window.api.send('toMain', { action: 'force-close' });
    });

    closeModalCancelBtn.addEventListener('click', () => {
        hideCloseModal();
    });

    // Hide modal on backdrop click
    closeModal.querySelector('.custom-modal-backdrop').addEventListener('click', hideCloseModal);

    // Get the menu item and its dropdown
    const fileMenuItem = document.querySelector('.menu-item');
    const fileDropdown = document.querySelector('.menu-dropdown');
    const menuButton = document.querySelector('.menu-button');
    const clearListOption = document.getElementById('clearListOption');
    const changeFolderOption = document.getElementById('changeFolderOption');

    // Toggle dropdown visibility on click
    menuButton.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        console.log('File menu clicked'); // Add this for debugging
        fileDropdown.classList.toggle('show');
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (event) => {
        if (!fileMenuItem.contains(event.target)) {
            fileDropdown.classList.remove('show');
        }
    });

    // Prevent dropdown from closing when clicking inside it
    fileDropdown.addEventListener('click', (event) => {
        event.stopPropagation();
    });

    // Handle clear list option
    clearListOption.addEventListener('click', () => {
        // Clear the music list
        const musicList = document.getElementById('musicList');
        musicList.innerHTML = '';
        
        // Clear the player state using the Player class
        player.clearPlaylist();
        
        // Show the select folder button
        const folderSelectContainer = document.getElementById('folderSelectContainer');
        if (folderSelectContainer) {
            folderSelectContainer.style.display = 'flex';
        }
        
        // Clear the saved folder path
        localStorage.removeItem('musicFolderPath');
        
        // Close the dropdown
        fileDropdown.classList.remove('show');
    });

    // Handle change folder option
    changeFolderOption.addEventListener('click', () => {
        // Use the HomePage's folder selection handler
        homePage.handleFolderSelection();
        // Close the dropdown
        fileDropdown.classList.remove('show');
    });

    let isPlaying = false;
    let currentTrackIndex = -1;
    let audioPlayer = new Audio();
    let updateProgressInterval;
    let currentPlaylist = [];

    // Function to update the now playing info
    function updateNowPlaying(track) {
        trackNameEl.textContent = track.name;
        artistNameEl.textContent = track.artist;
        albumArtEl.src = generateGeometricShape(); // Generate a new shape for the now playing view
    }

    // Function to play a track
    function playTrack(index) {
        if (currentPlaylist[index]) {
            const track = currentPlaylist[index];
            currentTrackIndex = index;
            
            // Update audio source and play
            audioPlayer.src = track.path;
            audioPlayer.play();
            isPlaying = true;
            
            // Update UI
            updateNowPlaying(track);
            const icon = playBtn.querySelector('i');
            icon.classList.remove('fa-play');
            icon.classList.add('fa-pause');
            
            // Update active state in the list
            document.querySelectorAll('.music-item').forEach(el => {
                el.classList.remove('active');
            });
            document.querySelector(`.music-item[data-index="${index}"]`).classList.add('active');
            
            // Start progress update interval
            startProgressUpdate();
        }
    }

    // Function to start progress update interval
    function startProgressUpdate() {
        if (updateProgressInterval) {
            clearInterval(updateProgressInterval);
        }
        updateProgressInterval = setInterval(() => {
            if (audioPlayer.duration) {
                const progressPercent = (audioPlayer.currentTime / audioPlayer.duration) * 100;
                progress.style.width = `${progressPercent}%`;
                currentTimeEl.textContent = formatTime(audioPlayer.currentTime);
                totalTimeEl.textContent = formatTime(audioPlayer.duration);
            }
        }, 1000);
    }

    // Play/Pause toggle
    playBtn.addEventListener('click', () => {
        if (currentTrackIndex === -1) {
            // If no track is selected, play the first one
            if (currentPlaylist.length > 0) {
                playTrack(0);
            }
            return;
        }

        isPlaying = !isPlaying;
        const icon = playBtn.querySelector('i');
        if (isPlaying) {
            audioPlayer.play();
            icon.classList.remove('fa-play');
            icon.classList.add('fa-pause');
            startProgressUpdate();
        } else {
            audioPlayer.pause();
            icon.classList.remove('fa-pause');
            icon.classList.add('fa-play');
            clearInterval(updateProgressInterval);
        }
    });

    // Previous track
    prevBtn.addEventListener('click', (e) => {
        if (currentPlaylist.length === 0) return;
        
        // Only change track if it's a short click (not a long press)
        if (!prevTrackDropdown.classList.contains('show')) {
            let newIndex = currentTrackIndex - 1;
            if (newIndex < 0) {
                newIndex = currentPlaylist.length - 1;
            }
            playTrack(newIndex);
        }
    });

    // Next track
    nextBtn.addEventListener('click', (e) => {
        if (currentPlaylist.length === 0) return;
        
        // Only change track if it's a short click (not a long press)
        if (!nextTrackDropdown.classList.contains('show')) {
            let newIndex = currentTrackIndex + 1;
            if (newIndex >= currentPlaylist.length) {
                newIndex = 0;
            }
            playTrack(newIndex);
        }
    });

    // Add track selection dropdowns for next/prev buttons
    const prevTrackDropdown = document.createElement('div');
    prevTrackDropdown.className = 'track-selection-dropdown';
    prevBtn.parentNode.appendChild(prevTrackDropdown);

    const nextTrackDropdown = document.createElement('div');
    nextTrackDropdown.className = 'track-selection-dropdown';
    nextBtn.parentNode.appendChild(nextTrackDropdown);

    // Function to update track selection dropdowns
    function updateTrackSelectionDropdowns() {
        // Clear existing options
        prevTrackDropdown.innerHTML = '';
        nextTrackDropdown.innerHTML = '';

        // Add track options
        currentPlaylist.forEach((track, index) => {
            const option = document.createElement('div');
            option.className = 'track-selection-option';
            if (index === currentTrackIndex) {
                option.classList.add('active');
            }
            option.textContent = `${track.name} - ${track.artist}`;
            
            // Create a copy for each dropdown
            const prevOption = option.cloneNode(true);
            const nextOption = option.cloneNode(true);
            
            // Add click handlers
            prevOption.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent event bubbling
                playTrack(index);
                prevTrackDropdown.classList.remove('show');
            });
            
            nextOption.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent event bubbling
                playTrack(index);
                nextTrackDropdown.classList.remove('show');
            });

            // Add to dropdowns
            prevTrackDropdown.appendChild(prevOption);
            nextTrackDropdown.appendChild(nextOption);
        });
    }

    // Constants
    const LONG_PRESS_DURATION = 500; // 500ms for long press

    // Function to close all dropdowns
    function closeAllDropdowns() {
        const dropdowns = document.querySelectorAll('.skip-duration-dropdown, .track-selection-dropdown, .sleep-timer-dropdown');
        dropdowns.forEach(dropdown => {
            dropdown.classList.remove('show');
        });
    }

    // Modify the setupTrackButtonLongPress function
    function setupTrackButtonLongPress(button, dropdown) {
        let longPressTimer;

        button.addEventListener('mousedown', () => {
            if (currentPlaylist.length === 0) return;
            
            longPressTimer = setTimeout(() => {
                closeAllDropdowns(); // Close all dropdowns first
                updateTrackSelectionDropdowns();
                dropdown.classList.add('show');
            }, LONG_PRESS_DURATION);
        });

        button.addEventListener('mouseup', () => {
            clearTimeout(longPressTimer);
        });

        button.addEventListener('mouseleave', () => {
            clearTimeout(longPressTimer);
        });

        // Add click handler to close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!button.contains(e.target) && !dropdown.contains(e.target)) {
                dropdown.classList.remove('show');
            }
        });
    }

    setupTrackButtonLongPress(prevBtn, prevTrackDropdown);
    setupTrackButtonLongPress(nextBtn, nextTrackDropdown);

    // Modify the document click event listener
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.control-btn')) {
            closeAllDropdowns();
        }
    });

    let longPressTimer;

    // Function to format duration for display
    function formatSkipDuration(seconds) {
        if (seconds >= 60) {
            return `${seconds / 60}m`;
        }
        return `${seconds}s`;
    }

    // Function to update skip duration
    function updateSkipDuration(duration) {
        skipDuration = duration;
        skipBackwardBtn.querySelector('.skip-label').textContent = formatSkipDuration(duration);
        skipForwardBtn.querySelector('.skip-label').textContent = formatSkipDuration(duration);
        player.setSkipDuration(duration); // Update the player's skip duration
    }

    // Function to handle skip duration selection
    function handleSkipDurationSelection(dropdown, duration) {
        updateSkipDuration(duration);
        dropdown.classList.remove('show');
        
        // Update active state
        dropdown.querySelectorAll('.skip-duration-option').forEach(option => {
            option.classList.toggle('active', parseInt(option.dataset.duration) === duration);
        });
    }

    // Setup skip duration options
    [skipBackwardDropdown, skipForwardDropdown].forEach(dropdown => {
        dropdown.querySelectorAll('.skip-duration-option').forEach(option => {
            option.addEventListener('click', (e) => {
                const duration = parseInt(e.target.dataset.duration);
                handleSkipDurationSelection(dropdown, duration);
            });
        });
    });

    // Initialize skip duration display and player
    updateSkipDuration(skipDuration);

    // Modify the setupSkipButtonLongPress function
    function setupSkipButtonLongPress(button, dropdown, playerInstance) {
        let longPressTimer;
        let isLongPress = false;
        let skipActionTriggered = false;

        button.addEventListener('mousedown', () => {
            isLongPress = false;
            skipActionTriggered = false;
            longPressTimer = setTimeout(() => {
                isLongPress = true;
                closeAllDropdowns(); // Close all dropdowns first
                dropdown.classList.add('show');
            }, LONG_PRESS_DURATION);
        });

        button.addEventListener('mouseup', () => {
            clearTimeout(longPressTimer);
            // Only trigger skip if it wasn't a long press and we haven't already triggered it
            if (!isLongPress && !skipActionTriggered) {
                skipActionTriggered = true;
                if (button === skipBackwardBtn) {
                    playerInstance.skipBackward();
                } else if (button === skipForwardBtn) {
                    playerInstance.skipForward();
                }
            }
        });

        button.addEventListener('mouseleave', () => {
            clearTimeout(longPressTimer);
            isLongPress = false;
        });

        // Prevent click event from triggering skip on long press
        button.addEventListener('click', (e) => {
            if (isLongPress) {
                e.preventDefault();
                e.stopPropagation();
                isLongPress = false;
                skipActionTriggered = true;
            }
        });
    }

    setupSkipButtonLongPress(skipBackwardBtn, skipBackwardDropdown, player);
    setupSkipButtonLongPress(skipForwardBtn, skipForwardDropdown, player);

    // Remove the old click handlers since they're now handled in setupSkipButtonLongPress
    skipBackwardBtn.removeEventListener('click', () => {});
    skipForwardBtn.removeEventListener('click', () => {});

    // Progress bar click
    progressBar.addEventListener('click', (e) => {
        if (currentTrackIndex === -1) return;
        
        const rect = progressBar.getBoundingClientRect();
        const pos = (e.clientX - rect.left) / rect.width;
        const newTime = pos * audioPlayer.duration;
        
        audioPlayer.currentTime = newTime;
        progress.style.width = `${pos * 100}%`;
        currentTimeEl.textContent = formatTime(newTime);
    });

    // Handle audio player events
    audioPlayer.addEventListener('ended', () => {
        // Play next track when current track ends
        if (currentPlaylist.length > 0) {
            let newIndex = currentTrackIndex + 1;
            if (newIndex >= currentPlaylist.length) {
                newIndex = 0;
            }
            playTrack(newIndex);
        }
    });

    audioPlayer.addEventListener('error', (e) => {
        console.error('Error playing audio:', e);
        // Try to play next track on error
        if (currentPlaylist.length > 0) {
            let newIndex = currentTrackIndex + 1;
            if (newIndex >= currentPlaylist.length) {
                newIndex = 0;
            }
            playTrack(newIndex);
        }
    });

    // Format time in seconds to MM:SS
    function formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    // Function to show/hide the select folder button
    function toggleSelectFolderButton(show) {
        folderSelectContainer.style.display = show ? 'flex' : 'none';
    }

    // Function to format duration in seconds to MM:SS
    function formatDuration(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    // Function to generate a random color
    function getRandomColor() {
        const hue = Math.floor(Math.random() * 360);
        return `hsl(${hue}, 70%, 60%)`;
    }

    // Function to generate a geometric shape SVG
    function generateGeometricShape() {
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

    // Function to create a music item element
    function createMusicItem(track, index) {
        const item = document.createElement('div');
        item.className = 'music-item';
        item.dataset.index = index;

        // Try to get metadata from the track
        const title = track.name || 'Unknown Title';
        const artist = track.artist || 'Unknown Artist';
        const duration = track.duration ? formatDuration(track.duration) : '0:00';
        const coverUrl = generateGeometricShape(); // Generate a random geometric shape instead of using album cover

        item.innerHTML = `
            <img src="${coverUrl}" alt="Album Cover">
            <div class="music-info">
                <div class="music-title">${title}</div>
                <div class="music-artist">${artist}</div>
            </div>
            <div class="music-duration">${duration}</div>
            <button class="add-to-playlist-btn" title="Add to Playlist">
                <i class="fas fa-plus"></i>
            </button>
            <div class="playlist-dropdown">
                <div class="create-playlist-option">
                    <div class="playlist-option">
                        <i class="fas fa-plus"></i>
                        Create New Playlist
                    </div>
                </div>
            </div>
        `;

        // Add click handler for the track
        item.addEventListener('click', (e) => {
            // Don't trigger if clicking the add to playlist button
            if (e.target.closest('.add-to-playlist-btn')) {
                return;
            }
            // Remove active class from all items
            document.querySelectorAll('.music-item').forEach(el => {
                el.classList.remove('active');
            });
            // Add active class to clicked item
            item.classList.add('active');
            // Play the selected track
            playTrack(index);
        });

        // Add click handler for the add to playlist button
        const addToPlaylistBtn = item.querySelector('.add-to-playlist-btn');
        const playlistDropdown = item.querySelector('.playlist-dropdown');

        addToPlaylistBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            // Close all other dropdowns
            document.querySelectorAll('.playlist-dropdown').forEach(dropdown => {
                if (dropdown !== playlistDropdown) {
                    dropdown.classList.remove('show');
                }
            });
            playlistDropdown.classList.toggle('show');

            // Update playlist options
            const playlists = JSON.parse(localStorage.getItem('playlists') || '[]');
            const optionsContainer = playlistDropdown.querySelector('.create-playlist-option');
            
            // Clear existing options except the create new option
            const createNewOption = optionsContainer.querySelector('.playlist-option');
            optionsContainer.innerHTML = '';
            optionsContainer.appendChild(createNewOption);

            // Add existing playlists
            playlists.forEach((playlist, playlistIndex) => {
                const option = document.createElement('div');
                option.className = 'playlist-option';
                option.innerHTML = `
                    <i class="fas fa-list"></i>
                    ${playlist.name}
                `;
                option.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const playlistsPage = window.playlistsPage;
                    if (playlistsPage) {
                        playlistsPage.addTrackToPlaylist(track, playlistIndex);
                    }
                    playlistDropdown.classList.remove('show');
                });
                optionsContainer.appendChild(option);
            });
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!item.contains(e.target)) {
                playlistDropdown.classList.remove('show');
            }
        });

        return item;
    }

    const loadingIndicator = document.getElementById('loadingIndicator');

    // Function to show loading state
    function showLoading() {
        loadingIndicator.style.display = 'flex';
        musicList.classList.add('loading');
        selectFolderBtn.disabled = true;
    }

    // Function to hide loading state
    function hideLoading() {
        loadingIndicator.style.display = 'none';
        musicList.classList.remove('loading');
        selectFolderBtn.disabled = false;
    }

    // Listen for add-music-file events from the main process
    window.api.receive('add-music-file', (filePath) => {
        addMusicFile(filePath);
    });

    // Function to add a single music file to the list
    async function addMusicFile(filePath) {
        showLoading();
        try {
            const result = await window.api.getMusicFiles({
                path: [filePath],
                batchSize: 1,
                startIndex: 0
            });
            
            if (result.tracks.length > 0) {
                currentPlaylist.push(result.tracks[0]);
                const item = createMusicItem(result.tracks[0], currentPlaylist.length - 1);
                musicList.appendChild(item);
                // Optionally, scroll to the newly added item
                item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        } catch (error) {
            console.error('Error adding music file:', error);
        } finally {
            hideLoading();
        }
    }

    const trackDetailsModal = document.getElementById('trackDetailsModal');
    const closeTrackDetails = document.getElementById('closeTrackDetails');
    const trackDetailsTitle = document.getElementById('trackDetailsTitle');
    const trackDetailsArtist = document.getElementById('trackDetailsArtist');
    const trackDetailsCover = document.getElementById('trackDetailsCover');
    const trackDetailsDuration = document.getElementById('trackDetailsDuration');
    const nowPlaying = document.querySelector('.now-playing');
    const ratingSquares = document.querySelectorAll('.rating-square');
    const favoriteTrackBtn = document.getElementById('favoriteTrackBtn');
    const trackDetailsDescription = document.querySelector('.track-details-description p');

    // Track rating functionality
    let currentRating = 0;

    ratingSquares.forEach(square => {
        square.addEventListener('click', () => {
            const rating = parseInt(square.dataset.rating);
            currentRating = rating;
            
            // Update visual state of squares
            ratingSquares.forEach(s => {
                if (parseInt(s.dataset.rating) <= rating) {
                    s.classList.add('active');
                } else {
                    s.classList.remove('active');
                }
                s.style.backgroundColor = '';
            });

            // Save rating to localStorage
            const currentTrack = currentPlaylist[currentTrackIndex];
            if (currentTrack) {
                const trackRatings = JSON.parse(localStorage.getItem('trackRatings') || '{}');
                trackRatings[currentTrack.path] = rating;
                localStorage.setItem('trackRatings', JSON.stringify(trackRatings));

                // Update rating indicator in the music list
                const musicItem = document.querySelector(`.music-item[data-index="${currentTrackIndex}"]`);
                if (musicItem) {
                    let ratingIndicator = musicItem.querySelector('.rating-indicator');
                    if (!ratingIndicator) {
                        ratingIndicator = document.createElement('div');
                        ratingIndicator.className = 'rating-indicator';
                        musicItem.querySelector('.music-info').appendChild(ratingIndicator);
                    }
                    ratingIndicator.innerHTML = '★'.repeat(rating);
                }
            }
        });

        square.addEventListener('mouseover', () => {
            const rating = parseInt(square.dataset.rating);
            ratingSquares.forEach(s => {
                if (parseInt(s.dataset.rating) <= rating) {
                    s.style.backgroundColor = '#e3f5e9';
                } else {
                    s.style.backgroundColor = '';
                }
            });
        });

        square.addEventListener('mouseout', () => {
            ratingSquares.forEach(s => {
                if (!s.classList.contains('active')) {
                    s.style.backgroundColor = '';
                }
            });
        });
    });

    // Function to show track details
    function showTrackDetails() {
        const currentTrack = currentPlaylist[currentTrackIndex];
        if (currentTrack) {
            trackDetailsTitle.textContent = currentTrack.name;
            trackDetailsArtist.textContent = currentTrack.artist;
            trackDetailsDuration.textContent = formatTime(currentTrack.duration);
            
            // Show more details in the description
            trackDetailsDescription.innerHTML = `
                <strong>File Name:</strong> ${currentTrack.name}<br>
                <strong>Artist:</strong> ${currentTrack.artist}<br>
                <strong>Duration:</strong> ${formatTime(currentTrack.duration)}<br>
                <strong>Path:</strong> <span style='word-break:break-all;'>${currentTrack.path}</span>
            `;
            
            // Load saved rating
            const trackRatings = JSON.parse(localStorage.getItem('trackRatings') || '{}');
            currentRating = trackRatings[currentTrack.path] || 0;
            
            // Update rating squares
            ratingSquares.forEach(square => {
                if (parseInt(square.dataset.rating) <= currentRating) {
                    square.classList.add('active');
                } else {
                    square.classList.remove('active');
                }
                square.style.backgroundColor = '';
            });

            // Load favorite status
            const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
            const isFavorite = favorites.includes(currentTrack.path);
            favoriteTrackBtn.classList.toggle('active', isFavorite);
            favoriteTrackBtn.innerHTML = `<i class="fas fa-heart"></i> ${isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}`;

            // Show modal
            trackDetailsModal.style.display = 'flex';
            // Force a reflow
            trackDetailsModal.offsetHeight;
            trackDetailsModal.classList.add('show');
        }
    }

    // Show track details when clicking on now playing
    nowPlaying.addEventListener('click', () => {
        if (currentTrackIndex !== -1) {
            showTrackDetails();
        }
    });

    // Close track details modal
    closeTrackDetails.addEventListener('click', () => {
        trackDetailsModal.classList.remove('show');
        setTimeout(() => {
            trackDetailsModal.style.display = 'none';
        }, 300);
    });

    // Close modal when clicking outside
    trackDetailsModal.addEventListener('click', (e) => {
        if (e.target === trackDetailsModal) {
            trackDetailsModal.classList.remove('show');
            setTimeout(() => {
                trackDetailsModal.style.display = 'none';
            }, 300);
        }
    });

    // Close modal with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && trackDetailsModal.classList.contains('show')) {
            trackDetailsModal.classList.remove('show');
            setTimeout(() => {
                trackDetailsModal.style.display = 'none';
            }, 300);
        }
    });

    // Update track details when track changes
    function updateTrackDetails(track) {
        if (trackDetailsModal.classList.contains('show')) {
            showTrackDetails();
        }
    }

    // Modify the playTrack function to update track details
    const originalPlayTrack = playTrack;
    playTrack = function(index) {
        originalPlayTrack(index);
        if (trackDetailsModal.classList.contains('show')) {
            updateTrackDetails(currentPlaylist[index]);
        }
    };

    // Favorite button functionality
    favoriteTrackBtn.addEventListener('click', () => {
        const currentTrack = currentPlaylist[currentTrackIndex];
        if (currentTrack) {
            const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
            const isFavorite = favorites.includes(currentTrack.path);
            
            if (isFavorite) {
                // Remove from favorites
                const index = favorites.indexOf(currentTrack.path);
                favorites.splice(index, 1);
                favoriteTrackBtn.classList.remove('active');
                favoriteTrackBtn.innerHTML = '<i class="fas fa-heart"></i> Add to Favorites';
            } else {
                // Add to favorites
                favorites.push(currentTrack.path);
                favoriteTrackBtn.classList.add('active');
                favoriteTrackBtn.innerHTML = '<i class="fas fa-heart"></i> Remove from Favorites';
            }
            
            localStorage.setItem('favorites', JSON.stringify(favorites));
            
            // Update favorites list if we're on the favorites page
            if (document.getElementById('favorites-page').classList.contains('active')) {
                updateFavoritesList();
            }
        }
    });

    // Function to update favorites list
    function updateFavoritesList() {
        const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
        favoritesList.innerHTML = '';

        if (favorites.length === 0) {
            favoritesList.innerHTML = '<div class="empty-state">No favorite songs yet</div>';
            return;
        }

        // Filter current playlist to only show favorite tracks
        const favoriteTracks = currentPlaylist.filter(track => favorites.includes(track.path));
        
        favoriteTracks.forEach((track, index) => {
            const item = createMusicItem(track, currentPlaylist.indexOf(track));
            // Add favorite indicator
            const favoriteIndicator = document.createElement('div');
            favoriteIndicator.className = 'favorite-indicator';
            favoriteIndicator.innerHTML = '<i class="fas fa-heart"></i>';
            item.querySelector('.music-info').appendChild(favoriteIndicator);
            favoritesList.appendChild(item);
        });
    }

    // Dark Mode Toggle Functionality
    const darkModeToggle = document.getElementById('darkModeToggle');
    
    // Check for saved theme preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.setAttribute('data-theme', 'dark');
        darkModeToggle.checked = true;
    }

    // Toggle dark mode
    darkModeToggle.addEventListener('change', () => {
        if (darkModeToggle.checked) {
            document.body.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.body.removeAttribute('data-theme');
            localStorage.setItem('theme', 'light');
        }
    });

    if (window.Player === undefined && typeof Player !== 'undefined') {
        window.Player = new Player();
        window.Player.init();
    }

    window.api.receive('tray-play-pause', () => {
        if (window.player && typeof window.player.togglePlay === 'function') {
            window.player.togglePlay();
        }
    });
    window.api.receive('tray-next', () => {
        if (window.player && typeof window.player.playNext === 'function') {
            window.player.playNext();
        }
    });
    window.api.receive('tray-prev', () => {
        if (window.player && typeof window.player.playPrevious === 'function') {
            window.player.playPrevious();
        }
    });

    window.api.receive('set-close-behavior', (value) => {
        if (window.settingsManager) {
            window.settingsManager.settings.closeBehavior = value;
            window.settingsManager.saveSettings();
        }
    });
});
