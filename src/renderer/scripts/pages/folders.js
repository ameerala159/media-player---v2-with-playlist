export class FoldersPage {
    constructor(player) {
        this.container = document.getElementById('foldersContainer');
        this.player = player;
        this.musicListContainer = null;
        this.currentFolderPath = null;
        this.allTracks = [];
        this.currentSubfolder = null;
    }

    init() {
        this.loadSubfolders();
        window.addEventListener('favoriteStatusChanged', () => {
            if (this.currentSubfolder) {
                this.updateMusicList(this.allTracks);
            }
        });
    }

    async loadSubfolders() {
        this.currentSubfolder = null; // Reset state when loading main folder view
        const savedFolderPath = localStorage.getItem('musicFolderPath');
        if (savedFolderPath) {
            this.currentFolderPath = savedFolderPath;
            try {
                const subfolders = await window.api.getSubfolders(savedFolderPath);
                this.renderSubfolders(subfolders);
            } catch (error) {
                console.error('Error loading subfolders:', error);
                this.container.innerHTML = '<p>Error loading folders.</p>';
            }
        } else {
            this.container.innerHTML = '<p>No music folder selected. Please select one from the Home page.</p>';
        }
    }

    renderSubfolders(subfolders) {
        if (subfolders.length === 0) {
            this.container.innerHTML = '<p>No subfolders found in the selected music folder.</p>';
            return;
        }

        this.container.innerHTML = ''; // Clear existing content
        const subfolderList = document.createElement('div');
        subfolderList.className = 'subfolder-list';

        subfolders.forEach(folder => {
            const folderItem = document.createElement('div');
            folderItem.className = 'subfolder-item';
            folderItem.innerHTML = `
                <div class="subfolder-item-main">
                    <i class="fas fa-folder"></i>
                    <span>${folder.name}</span>
                </div>
                <div class="subfolder-track-count">${folder.trackCount} tracks</div>
            `;
            folderItem.addEventListener('click', () => this.showMusicInFolder(folder));
            subfolderList.appendChild(folderItem);
        });

        this.container.appendChild(subfolderList);
    }

    async showMusicInFolder(folder) {
        this.currentSubfolder = folder;
        this.container.innerHTML = ''; // Clear subfolder list

        const backButton = document.createElement('button');
        backButton.className = 'back-button';
        backButton.innerHTML = '<i class="fas fa-arrow-left"></i> Back to folders';
        backButton.addEventListener('click', () => {
            this.currentSubfolder = null; // Clear state before going back
            this.loadSubfolders();
        });
        this.container.appendChild(backButton);

        const folderHeader = document.createElement('h3');
        folderHeader.textContent = folder.name;
        this.container.appendChild(folderHeader);

        this.musicListContainer = document.createElement('div');
        this.musicListContainer.className = 'music-list';
        this.container.appendChild(this.musicListContainer);

        try {
            const result = await window.api.getMusicFiles({ path: folder.path });
            this.allTracks = result.tracks;
            this.updateMusicList(this.allTracks);
        } catch (error) {
            console.error(`Error loading music from ${folder.path}:`, error);
            this.musicListContainer.innerHTML = '<p>Error loading music.</p>';
        }
    }

    updateMusicList(tracks) {
        this.musicListContainer.innerHTML = '';
        if (tracks.length === 0) {
            this.musicListContainer.innerHTML = '<p>No music files found in this folder.</p>';
            return;
        }

        tracks.forEach((track, index) => {
            const musicItem = this.createMusicItem(track, index);
            this.musicListContainer.appendChild(musicItem);
        });
    }

    createMusicItem(track, index) {
        const item = document.createElement('div');
        item.className = 'music-item';
        item.dataset.index = index;

        const title = track.name || 'Unknown Title';
        const artist = track.artist || 'Unknown Artist';
        const duration = track.duration ? this.formatDuration(track.duration) : '0:00';

        // Use a placeholder for album art as we don't have the geometric shapes here
        // or we could pass the trackShapes from the player if available
        const coverUrl = 'default-album-art.jpg';

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
            window.dispatchEvent(new Event('updateFavoritesList'));
            window.dispatchEvent(new Event('favoriteStatusChanged'));
        });

        // Add click handler for playing track
        item.addEventListener('click', (e) => {
            if (e.target.closest('.add-to-playlist-btn') || e.target.closest('.playlist-dropdown')) {
                return;
            }
            document.querySelectorAll('.music-item').forEach(el => el.classList.remove('active'));
            item.classList.add('active');
            
            // Dispatch event to play track
            window.dispatchEvent(new CustomEvent('playTrack', {
                detail: { 
                    index: index,
                    tracks: this.allTracks,
                    isPlaylist: false // To ensure it respects shuffle settings like the home page
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
                    
                    const spaceBelow = window.innerHeight - rect.bottom;
                    const dropdownHeight = dropdown.offsetHeight;
                    
                    if (spaceBelow < dropdownHeight && rect.top > dropdownHeight) {
                        dropdown.style.top = `${rect.top - dropdownHeight - 5}px`;
                    } else {
                        dropdown.style.top = `${rect.bottom + 5}px`;
                    }
                    
                    dropdown.style.left = `${rect.right - dropdown.offsetWidth}px`;
                    
                    if (parseFloat(dropdown.style.left) < 0) {
                        dropdown.style.left = '0px';
                    }
                });

                // Populate playlists
                const playlists = JSON.parse(localStorage.getItem('playlists') || '[]');
                const existingPlaylists = dropdown.querySelectorAll('.playlist-option:not(.create-playlist-option)');
                existingPlaylists.forEach(option => option.remove());

                playlists.forEach(playlist => {
                    const option = document.createElement('div');
                    option.className = 'playlist-option';
                    option.innerHTML = `<i class="fas fa-music"></i> ${playlist.name}`;
                    option.addEventListener('click', () => {
                        window.playlistsPage.addTrackToPlaylist(track, playlists.indexOf(playlist));
                        dropdown.classList.remove('show');
                        item.classList.remove('dropdown-open');
                    });
                    dropdown.insertBefore(option, dropdown.querySelector('.create-playlist-option'));
                });
            }
        });

        // Create new playlist option
        const createOption = dropdown.querySelector('.create-playlist-option');
        createOption.addEventListener('click', () => {
            window.playlistsPage.showCreatePlaylistModal(track);
            dropdown.classList.remove('show');
            item.classList.remove('dropdown-open');
        });

        return item;
    }

    formatDuration(seconds) {
        if (isNaN(seconds)) {
            return '0:00';
        }
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
        return `${minutes}:${secs}`;
    }
} 