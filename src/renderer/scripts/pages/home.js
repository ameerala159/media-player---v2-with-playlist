// Home page functionality
export class HomePage {
    constructor() {
        this.musicList = document.getElementById('musicList');
        this.selectFolderBtn = document.getElementById('selectFolderBtn');
        this.folderSelectContainer = document.getElementById('folderSelectContainer');
        this.loadingIndicator = document.getElementById('loadingIndicator');
        this.searchInput = document.getElementById('searchInput');
        // this.sortSelect = document.getElementById('sortSelect'); // Remove native select
        this.currentPlaylist = [];
        this.trackShapes = window.player.trackShapes; // Use the same track shapes as the player
        this.allTracks = []; // Store all tracks for filtering and sorting
        this.currentFolderPath = null;
        this.isLoading = false;
        this.hasMore = false;
        this.batchSize = 100;
        this.currentBatch = 0;
        this.searchTimeout = null;
        this.searchIndex = new Map(); // For fast searching
        // Custom dropdown elements
        this.customSortDropdown = document.getElementById('customSortDropdown');
        this.customSortSelected = document.getElementById('customSortSelected');
        this.customSortOptions = document.getElementById('customSortOptions');
        this.customSortOptionEls = this.customSortOptions ? this.customSortOptions.querySelectorAll('.custom-dropdown-option') : [];
        this.selectedSortValue = null; // No default sort
        this.fullTrackList = []; // Store all tracks for searching
        // Set default sort dropdown label
        if (this.customSortSelected) {
            this.customSortSelected.innerHTML = '';
            const defaultIcon = document.createElement('i');
            defaultIcon.className = 'fas fa-sort';
            this.customSortSelected.appendChild(defaultIcon);
            this.customSortSelected.appendChild(document.createTextNode(' Sort'));
        }
        this.loadingPercentageEl = document.getElementById('loadingPercentage');
        // Listen for loading progress
        if (window.api && window.api.receiveMusicLoadingProgress) {
            window.api.receiveMusicLoadingProgress((percent) => {
                if (this.loadingPercentageEl) {
                    this.loadingPercentageEl.textContent = percent + '%';
                }
            });
        }
        this.songCountInfoEl = document.getElementById('songCountInfo');

        // Initialize scroll handler
        this.initializeScrollHandler();
    }

    // Initialize home page
    init() {
        this.setupEventListeners();
        this.loadSavedFolder();
    }

    // Setup event listeners
    setupEventListeners() {
        this.selectFolderBtn.addEventListener('click', () => this.handleFolderSelection());
        
        // Add debounced search input listener with immediate update on clear
        this.searchInput.addEventListener('input', () => {
            if (this.searchTimeout) {
                clearTimeout(this.searchTimeout);
            }
            
            // If search is cleared, update immediately
            if (this.searchInput.value === '') {
                // Reset to show all tracks
                this.filterAndSortTracks();
            } else {
                this.searchTimeout = setTimeout(() => this.filterAndSortTracks(), 300);
            }
        });
        
        // Add clear button functionality
        this.searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.searchInput.value = '';
                // Reset to show all tracks
                this.filterAndSortTracks();
            }
        });
        
        // Custom dropdown logic
        if (this.customSortDropdown) {
            this.customSortDropdown.addEventListener('click', (e) => {
                this.customSortDropdown.classList.toggle('open');
            });
            this.customSortDropdown.addEventListener('blur', (e) => {
                setTimeout(() => this.customSortDropdown.classList.remove('open'), 100);
            });
            this.customSortOptionEls.forEach(option => {
                option.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const value = option.getAttribute('data-value');
                    const label = option.querySelector('span').textContent;
                    const icon = option.querySelector('i').cloneNode(true);
                    this.selectedSortValue = value;
                    this.customSortSelected.innerHTML = '';
                    this.customSortSelected.appendChild(icon);
                    this.customSortSelected.appendChild(document.createTextNode(' ' + label));
                    this.customSortOptionEls.forEach(opt => opt.classList.remove('active'));
                    option.classList.add('active');
                    this.customSortDropdown.classList.remove('open');
                    this.filterAndSortTracks();
                });
            });
        }

        // Listen for track list updates
        window.addEventListener('trackListUpdated', (event) => {
            this.currentPlaylist = event.detail.tracks;
            this.updateSearchIndex();
            this.filterAndSortTracks();
        });

        // Listen for rating updates
        window.addEventListener('trackRatingUpdated', () => {
            this.filterAndSortTracks();
        });

        // Listen for music list update events
        window.addEventListener('updateMusicList', () => {
            this.filterAndSortTracks();
        });

        // Listen for favorite status changes (e.g., from favorites page)
        window.addEventListener('favoriteStatusChanged', () => {
            this.updateFavoriteIcons();
        });

        // Listen for track deleted event
        window.addEventListener('trackDeleted', (event) => {
            const deletedPath = event.detail.path;
            // Remove from allTracks
            this.allTracks = this.allTracks.filter(track => track.path !== deletedPath);
            this.updateSearchIndex();
            this.filterAndSortTracks();
        });

        // Listen for track renamed event
        window.addEventListener('trackRenamed', (event) => {
            const { oldPath, newPath } = event.detail;
            // Find the track and update its path and name
            const track = this.allTracks.find(track => track.path === oldPath);
            if (track) {
                track.path = newPath;
                // Update the name based on the new file name (without extension)
                const newName = newPath.split(/[/\\]/).pop().replace(/\.[^/.]+$/, '');
                track.name = newName;
            }
            this.updateSearchIndex();
            this.filterAndSortTracks();
        });

        // --- RANDOM PLAYLIST FEATURE ---
        const randomPlaylistBtn = document.getElementById('randomPlaylistBtn');
        const randomPlaylistModal = document.getElementById('randomPlaylistModal');
        const closeRandomPlaylistModal = document.getElementById('closeRandomPlaylistModal');
        const randomPlaylistList = document.getElementById('randomPlaylistList');
        const randomPlaylistSubtitle = document.getElementById('randomPlaylistSubtitle');
        const playRandomPlaylistBtn = document.getElementById('playRandomPlaylistBtn');
        const randomizeAgainBtn = document.getElementById('randomizeAgainBtn');
        let currentRandomPlaylist = [];

        function showRandomPlaylistModal() {
            randomPlaylistModal.style.display = 'flex';
            randomPlaylistModal.offsetHeight;
            randomPlaylistModal.classList.add('show');
        }
        function closeRandomPlaylist() {
            randomPlaylistModal.classList.remove('show');
            setTimeout(() => {
                randomPlaylistModal.style.display = 'none';
            }, 300);
        }
        function pickRandom100Songs() {
            if (!Array.isArray(window.homePage.fullTrackList) || window.homePage.fullTrackList.length === 0) return [];
            const shuffled = window.homePage.fullTrackList.slice().sort(() => Math.random() - 0.5);
            return shuffled.slice(0, 100);
        }
        function updateRandomPlaylistModal(tracks) {
            randomPlaylistList.innerHTML = '';
            tracks.forEach((track, idx) => {
                const li = document.createElement('li');
                li.textContent = `${idx + 1}. ${track.name} - ${track.artist}`;
                randomPlaylistList.appendChild(li);
            });
            randomPlaylistSubtitle.textContent = `100 random songs selected!`;
        }
        function showRandomizingProgress() {
            randomPlaylistList.innerHTML = '';
            randomPlaylistSubtitle.textContent = 'Selecting 100 random songs...';
        }
        if (randomPlaylistBtn) {
            randomPlaylistBtn.addEventListener('click', () => {
                showRandomPlaylistModal();
                showRandomizingProgress();
                setTimeout(() => {
                    currentRandomPlaylist = pickRandom100Songs();
                    updateRandomPlaylistModal(currentRandomPlaylist);
                }, 500); // Simulate progress
            });
        }
        if (closeRandomPlaylistModal) {
            closeRandomPlaylistModal.addEventListener('click', closeRandomPlaylist);
        }
        if (randomizeAgainBtn) {
            randomizeAgainBtn.addEventListener('click', () => {
                showRandomizingProgress();
                setTimeout(() => {
                    currentRandomPlaylist = pickRandom100Songs();
                    updateRandomPlaylistModal(currentRandomPlaylist);
                }, 500);
            });
        }
        if (playRandomPlaylistBtn) {
            playRandomPlaylistBtn.addEventListener('click', () => {
                if (currentRandomPlaylist.length > 0 && window.player) {
                    window.player.currentPlaylist = currentRandomPlaylist;
                    window.player.playTrack(0);
                    closeRandomPlaylist();
                }
            });
        }
        // Close modal on outside click
        if (randomPlaylistModal) {
            randomPlaylistModal.addEventListener('click', (e) => {
                if (e.target === randomPlaylistModal) closeRandomPlaylist();
            });
        }
        // Close modal on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && randomPlaylistModal.classList.contains('show')) {
                closeRandomPlaylist();
            }
        });
    }

    // Initialize scroll handler for virtual scrolling
    initializeScrollHandler() {
        this.musicList.addEventListener('scroll', () => {
            const { scrollTop, scrollHeight, clientHeight } = this.musicList;
            // Get the current filtered list length
            const searchTerm = this.searchInput.value.toLowerCase();
            let filteredTracks;
            if (searchTerm) {
                const matchingIndices = [];
                this.searchIndex.forEach((text, index) => {
                    if (text.includes(searchTerm)) {
                        matchingIndices.push(index);
                    }
                });
                filteredTracks = matchingIndices.map(index => this.fullTrackList[index]);
            } else {
                filteredTracks = [...this.fullTrackList];
            }
            // Only load more if there are more tracks to show
            const tracksToDisplayCount = this.batchSize * (this.currentBatch + 1);
            if (
                scrollHeight - scrollTop <= clientHeight * 1.5 &&
                !this.isLoading &&
                tracksToDisplayCount < filteredTracks.length
            ) {
                this.loadMoreTracks();
            }
        });
    }

    // Load more tracks when scrolling
    async loadMoreTracks() {
        if (this.isLoading || !this.fullTrackList.length) return;
        this.isLoading = true;
        this.showLoading();
        try {
            this.currentBatch++;
            this.filterAndSortTracks(); // This will show more tracks based on the new batch
            this.updateSongCountInfo();
        } catch (error) {
            console.error('Error loading more tracks:', error);
        } finally {
            this.isLoading = false;
            this.hideLoading();
        }
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
        this.currentFolderPath = folderPath;
        this.currentBatch = 0;
        this.allTracks = [];
        this.fullTrackList = [];
        this.musicList.innerHTML = '';
        this.isLoading = true;
        this.showLoading();
        try {
            // Fetch ALL tracks at once for searching
            const result = await window.api.getMusicFiles({
                path: folderPath,
                batchSize: Number.MAX_SAFE_INTEGER,
                startIndex: 0
            });
            this.fullTrackList = result.tracks;
            this.hasMore = false; // We'll handle batching in the UI only
            // Load the first batch for display
            this.allTracks = this.fullTrackList.slice(0, this.batchSize);
            this.updateSearchIndex();
            this.filterAndSortTracks();
            this.updateSongCountInfo(this.allTracks.length);
        } catch (error) {
            console.error('Error loading music files:', error);
        } finally {
            this.isLoading = false;
            this.hideLoading();
        }
    }

    // Update search index for fast searching
    updateSearchIndex() {
        this.searchIndex.clear();
        // Use fullTrackList for search index
        this.fullTrackList.forEach((track, index) => {
            const searchableText = `${track.name} ${track.artist}`.toLowerCase();
            this.searchIndex.set(index, searchableText);
        });
    }

    // Filter and sort tracks with optimized performance
    filterAndSortTracks() {
        const searchTerm = this.searchInput.value.toLowerCase();
        let filteredTracks;
        // Fast filtering using search index
        if (searchTerm) {
            const matchingIndices = [];
            this.searchIndex.forEach((text, index) => {
                if (text.includes(searchTerm)) {
                    matchingIndices.push(index);
                }
            });
            filteredTracks = matchingIndices.map(index => this.fullTrackList[index]);
        } else {
            // When search is cleared, use all tracks
            filteredTracks = [...this.fullTrackList];
        }
        // Only sort if a sort value is selected
        switch (this.selectedSortValue) {
            case 'title':
                filteredTracks.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 'artist':
                filteredTracks.sort((a, b) => a.artist.localeCompare(b.artist));
                break;
            case 'rating':
                const ratings = JSON.parse(localStorage.getItem('trackRatings') || '{}');
                filteredTracks.sort((a, b) => (ratings[b.path] || 0) - (ratings[a.path] || 0));
                break;
            case 'date':
                filteredTracks.sort((a, b) => {
                    const dateA = new Date(a.path.split('/').pop().split('\\').pop());
                    const dateB = new Date(b.path.split('/').pop().split('\\').pop());
                    return dateB - dateA;
                });
                break;
            default:
                // No sort, keep original order
                break;
        }
        // Only display the first batchSize tracks for performance
        const tracksToDisplay = filteredTracks.slice(0, this.batchSize * (this.currentBatch + 1));
        this.updateMusicList(tracksToDisplay);
        this.updateSongCountInfo(tracksToDisplay.length);
    }

    // Show loading state
    showLoading() {
        this.loadingIndicator.style.display = 'flex';
        this.musicList.classList.add('loading');
        this.selectFolderBtn.disabled = true;
        if (this.loadingPercentageEl) {
            this.loadingPercentageEl.textContent = '0%';
        }
    }

    // Hide loading state
    hideLoading() {
        this.loadingIndicator.style.display = 'none';
        this.musicList.classList.remove('loading');
        this.selectFolderBtn.disabled = false;
        if (this.loadingPercentageEl) {
            this.loadingPercentageEl.textContent = '';
        }
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
            <button class="favorite-btn" title="Favorite">
                <i class="fa-heart"></i>
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

        // Add favorite button logic
        const favoriteBtn = item.querySelector('.favorite-btn');
        const favoriteIcon = favoriteBtn.querySelector('i');
        let favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
        const isFavorite = favorites.includes(track.path);
        favoriteIcon.className = isFavorite ? 'fas fa-heart' : 'far fa-heart';
        favoriteBtn.classList.toggle('active', isFavorite);

        favoriteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            let favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
            const idx = favorites.indexOf(track.path);
            if (idx === -1) {
                favorites.push(track.path);
            } else {
                favorites.splice(idx, 1);
            }
            localStorage.setItem('favorites', JSON.stringify(favorites));
            favoriteIcon.className = favorites.includes(track.path) ? 'fas fa-heart' : 'far fa-heart';
            favoriteBtn.classList.toggle('active', favorites.includes(track.path));
            // Optionally, update favorites page
            window.dispatchEvent(new Event('updateFavoritesList'));
        });

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
                    tracks: this.currentPlaylist,
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
                    
                    // Check if there's enough space below the button
                    const spaceBelow = window.innerHeight - rect.bottom;
                    const dropdownHeight = dropdown.offsetHeight;
                    
                    if (spaceBelow < dropdownHeight && rect.top > dropdownHeight) {
                        // If not enough space below but enough space above, position above
                        dropdown.style.top = `${rect.top - dropdownHeight - 5}px`; // 5px above the button
                    } else {
                        // Otherwise position below
                        dropdown.style.top = `${rect.bottom + 5}px`; // 5px below the button
                    }
                    
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

    // Update music list with virtual scrolling
    updateMusicList(tracks) {
        // Clear existing items
        this.musicList.innerHTML = '';
        this.currentPlaylist = tracks;

        if (tracks.length > 0) {
            this.folderSelectContainer.style.display = 'none';
        } else {
            this.folderSelectContainer.style.display = 'flex';
        }

        // Create a document fragment for better performance
        const fragment = document.createDocumentFragment();
        
        tracks.forEach((track, index) => {
            const item = this.createMusicItem(track, index);
            fragment.appendChild(item);
        });

        this.musicList.appendChild(fragment);

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

    // Add a method to update favorite icons in the home page
    updateFavoriteIcons() {
        const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
        document.querySelectorAll('.music-item').forEach(item => {
            const index = item.dataset.index;
            if (index !== undefined) {
                const track = this.currentPlaylist[index];
                if (track) {
                    const favoriteBtn = item.querySelector('.favorite-btn');
                    const favoriteIcon = favoriteBtn && favoriteBtn.querySelector('i');
                    if (favoriteBtn && favoriteIcon) {
                        const isFavorite = favorites.includes(track.path);
                        favoriteIcon.className = isFavorite ? 'fas fa-heart' : 'far fa-heart';
                        favoriteBtn.classList.toggle('active', isFavorite);
                    }
                }
            }
        });
    }

    // Call this after loading, filtering, and scrolling
    updateSongCountInfo(loadedCount = null) {
        if (!this.songCountInfoEl) return;
        const total = this.fullTrackList.length;
        let loaded = loadedCount;
        if (loaded == null) {
            // Default to currently displayed tracks
            const musicItems = this.musicList.querySelectorAll('.music-item');
            loaded = musicItems.length;
        }
        this.songCountInfoEl.textContent = `Loaded ${loaded} of ${total} songs`;
        this.songCountInfoEl.style.opacity = '1';
        // Hide after 3 seconds
        if (this.songCountInfoTimeout) clearTimeout(this.songCountInfoTimeout);
        this.songCountInfoTimeout = setTimeout(() => {
            if (this.songCountInfoEl) this.songCountInfoEl.style.opacity = '0';
        }, 3000);
    }
} 