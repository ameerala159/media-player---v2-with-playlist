// Home page functionality
export class HomePage {
    constructor() {
        this.musicList = document.getElementById('musicList');
        this.selectFolderBtn = document.getElementById('selectFolderBtn');
        this.folderSelectContainer = document.getElementById('folderSelectContainer');
        this.loadingIndicator = document.getElementById('loadingIndicator');
        this.searchInput = document.getElementById('searchInput');
        this.sortSelect = document.getElementById('sortSelect');
        this.currentPlaylist = [];
        this.trackShapes = new Map(); // Store shapes for each track
        this.allTracks = []; // Store all tracks for filtering and sorting
    }

    // Initialize home page
    init() {
        this.setupEventListeners();
        this.loadSavedFolder();
    }

    // Setup event listeners
    setupEventListeners() {
        this.selectFolderBtn.addEventListener('click', () => this.handleFolderSelection());
        
        // Add search input listener
        this.searchInput.addEventListener('input', () => this.filterAndSortTracks());
        
        // Add sort select listener
        this.sortSelect.addEventListener('change', () => this.filterAndSortTracks());
    }

    // Load saved folder if available
    async loadSavedFolder() {
        const savedFolderPath = localStorage.getItem('musicFolderPath');
        if (savedFolderPath) {
            await this.loadMusicFromFolder(savedFolderPath);
        }
    }

    // Handle folder selection
    async handleFolderSelection() {
        this.showLoading();
        const folderPath = await window.api.selectFolder();
        if (folderPath) {
            localStorage.setItem('musicFolderPath', folderPath);
            await this.loadMusicFromFolder(folderPath);
        }
        this.hideLoading();
    }

    // Load music from folder
    async loadMusicFromFolder(folderPath) {
        const tracks = await window.api.getMusicFiles(folderPath);
        this.allTracks = tracks; // Store all tracks
        this.filterAndSortTracks(); // Initial display with default sorting
    }

    // Filter and sort tracks based on search input and sort selection
    filterAndSortTracks() {
        const searchTerm = this.searchInput.value.toLowerCase();
        const sortBy = this.sortSelect.value;
        
        // Filter tracks based on search term
        let filteredTracks = this.allTracks.filter(track => {
            const title = (track.name || '').toLowerCase();
            const artist = (track.artist || '').toLowerCase();
            return title.includes(searchTerm) || artist.includes(searchTerm);
        });
        
        // Sort tracks based on selected option
        filteredTracks.sort((a, b) => {
            switch (sortBy) {
                case 'title':
                    return (a.name || '').localeCompare(b.name || '');
                case 'rating':
                    const ratings = JSON.parse(localStorage.getItem('trackRatings') || '{}');
                    const ratingA = ratings[a.path] || 0;
                    const ratingB = ratings[b.path] || 0;
                    return ratingB - ratingA; // Sort by highest rating first
                case 'date':
                    return (b.modifiedTime || 0) - (a.modifiedTime || 0); // Sort by most recent first
                default:
                    return 0;
            }
        });
        
        this.updateMusicList(filteredTracks);
    }

    // Show loading state
    showLoading() {
        this.loadingIndicator.style.display = 'flex';
        this.musicList.classList.add('loading');
        this.selectFolderBtn.disabled = true;
    }

    // Hide loading state
    hideLoading() {
        this.loadingIndicator.style.display = 'none';
        this.musicList.classList.remove('loading');
        this.selectFolderBtn.disabled = false;
    }

    // Create music item element
    createMusicItem(track, index) {
        const item = document.createElement('div');
        item.className = 'music-item';
        item.dataset.index = index;

        const title = track.name || 'Unknown Title';
        const artist = track.artist || 'Unknown Artist';
        const duration = track.duration ? this.formatDuration(track.duration) : '0:00';
        
        // Get or generate shape for this track
        let coverUrl = this.trackShapes.get(track.path);
        if (!coverUrl) {
            coverUrl = this.generateGeometricShape();
            this.trackShapes.set(track.path, coverUrl);
        }

        item.innerHTML = `
            <img src="${coverUrl}" alt="Album Cover">
            <div class="music-info">
                <div class="music-title">${title}</div>
                <div class="music-artist">${artist}</div>
            </div>
            <button class="add-to-playlist-btn">
                <i class="fas fa-plus"></i>
            </button>
        `;

        // Create dropdown element
        const dropdown = document.createElement('div');
        dropdown.className = 'playlist-dropdown';
        dropdown.innerHTML = `
            <div class="playlist-option create-playlist-option">
                <i class="fas fa-plus"></i>
                Create New Playlist
            </div>
        `;
        document.body.appendChild(dropdown); // Append to body

        // Add rating indicator if track has a rating
        const trackRatings = JSON.parse(localStorage.getItem('trackRatings') || '{}');
        if (trackRatings[track.path]) {
            const ratingIndicator = document.createElement('div');
            ratingIndicator.className = 'rating-indicator';
            ratingIndicator.innerHTML = '★'.repeat(trackRatings[track.path]);
            item.querySelector('.music-info').appendChild(ratingIndicator);
        }

        // Add click handler for playing track
        item.addEventListener('click', (e) => {
            // Don't trigger play if clicking the add to playlist button or dropdown
            if (e.target.closest('.add-to-playlist-btn') || e.target.closest('.playlist-dropdown')) {
                return;
            }
            
            // Remove active class from all items
            document.querySelectorAll('.music-item').forEach(el => {
                el.classList.remove('active');
            });
            // Add active class to clicked item
            item.classList.add('active');
            
            // Dispatch event to play track with the shape
            window.dispatchEvent(new CustomEvent('playTrack', {
                detail: { 
                    index,
                    shape: coverUrl
                }
            }));
        });

        // Add playlist button functionality
        item.querySelector('.add-to-playlist-btn').addEventListener('click', (e) => {
            e.stopPropagation();

            // Hide all other open dropdowns and remove their associated music-item's dropdown-open class
            document.querySelectorAll('.playlist-dropdown.show').forEach(openDropdown => {
                if (openDropdown !== dropdown) {
                    openDropdown.classList.remove('show');
                    // Find the music-item associated with this dropdown (assuming direct parent if it was inside, now it's more complex)
                    // For now, let's just make sure all music-items lose the class when any dropdown closes
                    document.querySelectorAll('.music-item.dropdown-open').forEach(mi => mi.classList.remove('dropdown-open'));
                }
            });

            // Toggle current dropdown visibility
            dropdown.classList.toggle('show');
            item.classList.toggle('dropdown-open', dropdown.classList.contains('show'));

            if (dropdown.classList.contains('show')) {
                // Defer positioning to ensure offsetWidth is calculated correctly after display:block
                requestAnimationFrame(() => {
                    const rect = item.querySelector('.add-to-playlist-btn').getBoundingClientRect();
                    dropdown.style.position = 'fixed'; // Use fixed position to escape overflow
                    dropdown.style.top = `${rect.bottom + 5}px`; // 5px below the button
                    // Position dropdown to align its right edge with the button's right edge
                    dropdown.style.left = `${rect.right - dropdown.offsetWidth}px`; 
                    
                    // Adjust if it goes off screen on the left
                    if (parseFloat(dropdown.style.left) < 0) {
                        dropdown.style.left = '0px';
                    }
                });

                // Populate playlists (re-populate to ensure fresh list)
                const playlists = JSON.parse(localStorage.getItem('playlists') || '[]');
                const existingPlaylists = dropdown.querySelectorAll('.playlist-option:not(.create-playlist-option)');
                existingPlaylists.forEach(option => option.remove());

                playlists.forEach(playlist => {
                    const option = document.createElement('div');
                    option.className = 'playlist-option';
                    option.innerHTML = `
                        <i class="fas fa-music"></i>
                        ${playlist.name}
                    `;
                    option.addEventListener('click', () => {
                        if (!playlist.tracks) playlist.tracks = [];
                        if (!playlist.tracks.some(t => t.path === track.path)) {
                            playlist.tracks.push(track);
                            localStorage.setItem('playlists', JSON.stringify(playlists));
                            
                            // Dispatch event for track addition
                            window.dispatchEvent(new CustomEvent('trackAddedToPlaylist', {
                                detail: { 
                                    playlistIndex: playlists.indexOf(playlist),
                                    track: track
                                }
                            }));
                            
                            dropdown.classList.remove('show');
                            item.classList.remove('dropdown-open');
                        } else {
                            // Show notification for duplicate track
                            this.showNotification(`${track.name} is already in ${playlist.name}`);
                            dropdown.classList.remove('show');
                            item.classList.remove('dropdown-open');
                        }
                    });
                    dropdown.insertBefore(option, dropdown.querySelector('.create-playlist-option'));
                });
            }
        });

        // Create new playlist option
        const createOption = dropdown.querySelector('.create-playlist-option');
        createOption.addEventListener('click', () => {
            const modal = document.createElement('div');
            modal.className = 'create-playlist-modal';
            modal.innerHTML = `
                <div class="create-playlist-content">
                    <h3>Create New Playlist</h3>
                    <form class="create-playlist-form">
                        <input type="text" placeholder="Playlist Name" required>
                        <div class="create-playlist-actions">
                            <button type="button" class="cancel-btn">Cancel</button>
                            <button type="submit" class="create-btn">Create</button>
                        </div>
                    </form>
                </div>
            `;

            document.body.appendChild(modal);
            requestAnimationFrame(() => modal.classList.add('show'));

            const form = modal.querySelector('form');
            const cancelBtn = modal.querySelector('.cancel-btn');
            const input = form.querySelector('input');

            form.addEventListener('submit', (e) => {
                e.preventDefault();
                const name = input.value.trim();
                if (name) {
                    const playlists = JSON.parse(localStorage.getItem('playlists') || '[]');
                    const newPlaylist = {
                        name,
                        tracks: [track]
                    };
                    playlists.push(newPlaylist);
                    localStorage.setItem('playlists', JSON.stringify(playlists));

                    // Dispatch event for playlist update
                    window.dispatchEvent(new CustomEvent('playlistUpdated'));

                    // Add the new playlist to the dropdown immediately
                    const option = document.createElement('div');
                    option.className = 'playlist-option';
                    option.innerHTML = `
                        <i class="fas fa-music"></i>
                        ${name}
                    `;
                    option.addEventListener('click', () => {
                        if (!newPlaylist.tracks.some(t => t.path === track.path)) {
                            newPlaylist.tracks.push(track);
                            localStorage.setItem('playlists', JSON.stringify(playlists));
                            
                            // Dispatch event for track addition
                            window.dispatchEvent(new CustomEvent('trackAddedToPlaylist', {
                                detail: { 
                                    playlistIndex: playlists.indexOf(newPlaylist),
                                    track: track
                                }
                            }));
                            
                            dropdown.classList.remove('show');
                            item.classList.remove('dropdown-open');
                        } else {
                            // Show notification for duplicate track
                            this.showNotification(`${track.name} is already in ${newPlaylist.name}`);
                            dropdown.classList.remove('show');
                            item.classList.remove('dropdown-open');
                        }
                    });
                    dropdown.insertBefore(option, dropdown.querySelector('.create-playlist-option'));

                    // Close modals and dropdowns
                    modal.remove();
                    dropdown.classList.remove('show');
                    item.classList.remove('dropdown-open');

                    // Show success notification
                    this.showNotification(`Created new playlist: ${name}`);
                }
            });

            cancelBtn.addEventListener('click', () => {
                modal.remove();
            });

            // Close modal when clicking outside
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.remove();
                }
            });

            // Focus the input field
            input.focus();
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            // Check if the click target is neither the button nor inside the dropdown
            if (!item.querySelector('.add-to-playlist-btn').contains(e.target) && !dropdown.contains(e.target)) {
                dropdown.classList.remove('show');
                item.classList.remove('dropdown-open');
            }
        });

        return item;
    }

    // Update music list
    updateMusicList(tracks) {
        this.musicList.innerHTML = '';
        this.currentPlaylist = tracks;

        if (tracks.length > 0) {
            this.folderSelectContainer.style.display = 'none';
        } else {
            this.folderSelectContainer.style.display = 'flex';
        }

        tracks.forEach((track, index) => {
            const item = this.createMusicItem(track, index);
            this.musicList.appendChild(item);
        });

        // Dispatch event for track list update
        window.dispatchEvent(new CustomEvent('trackListUpdated', { 
            detail: { tracks: this.currentPlaylist }
        }));
    }

    // Format duration
    formatDuration(seconds) {
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

    // Show notification
    showNotification(message) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-info-circle"></i>
                <span>${message}</span>
            </div>
        `;

        // Add to document
        document.body.appendChild(notification);

        // Show notification
        requestAnimationFrame(() => {
            notification.classList.add('show');
        });

        // Remove after 3 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }
} 