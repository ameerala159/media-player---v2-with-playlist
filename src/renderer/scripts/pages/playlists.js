export class PlaylistsPage {
    constructor() {
        this.playlistsContainer = document.getElementById('playlistsContainer');
        this.createPlaylistBtn = document.getElementById('createPlaylistBtn');
        this.playlists = JSON.parse(localStorage.getItem('playlists') || '[]');
    }

    init() {
        this.setupEventListeners();
        this.renderPlaylists();
    }

    setupEventListeners() {
        this.createPlaylistBtn.addEventListener('click', () => this.showCreatePlaylistModal());
        
        // Listen for playlist updates
        window.addEventListener('playlistUpdated', () => {
            console.log('Playlist update event received');
            this.playlists = JSON.parse(localStorage.getItem('playlists') || '[]');
            this.renderPlaylists();
        });

        // Listen for track additions to playlists
        window.addEventListener('trackAddedToPlaylist', (event) => {
            console.log('Track added to playlist event received');
            const { playlistIndex, track } = event.detail;
            if (this.playlists[playlistIndex]) {
                this.playlists[playlistIndex].tracks.push(track);
                this.savePlaylists();
                this.renderPlaylists();
            }
        });
    }

    renderPlaylists() {
        console.log('Rendering playlists:', this.playlists);
        this.playlistsContainer.innerHTML = '';
        
        if (this.playlists.length === 0) {
            this.playlistsContainer.innerHTML = '<div class="empty-state">No playlists yet</div>';
            return;
        }

        this.playlists.forEach((playlist, index) => {
            const card = this.createPlaylistCard(playlist, index);
            this.playlistsContainer.appendChild(card);
        });
    }

    createPlaylistCard(playlist, index) {
        const card = document.createElement('div');
        card.className = 'playlist-card';
        card.innerHTML = `
            <div class="playlist-card-content">
                <h3>${playlist.name}</h3>
                <div class="track-count">${playlist.tracks.length} tracks</div>
            </div>
            <button class="delete-playlist-btn" title="Delete Playlist">
                <i class="fas fa-trash"></i>
            </button>
        `;

        // Add click handler for the main card area
        card.querySelector('.playlist-card-content').addEventListener('click', () => this.showPlaylistContents(index));
        
        // Add click handler for delete button
        const deleteBtn = card.querySelector('.delete-playlist-btn');
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent triggering the card click
            this.showDeleteConfirmationModal(playlist.name, index);
        });

        return card;
    }

    showPlaylistContents(playlistIndex) {
        const playlist = this.playlists[playlistIndex];
        
        const modal = document.createElement('div');
        modal.className = 'playlist-contents-modal';
        modal.innerHTML = `
            <div class="playlist-contents-content">
                <div class="playlist-contents-header">
                    <h2>${playlist.name}</h2>
                    <div class="playlist-contents-actions">
                        <button class="shuffle-btn">
                            <i class="fas fa-random"></i>
                            Shuffle
                        </button>
                        <button class="play-all-btn">
                            <i class="fas fa-play"></i>
                            Play All
                        </button>
                        <button class="export-m3u-btn">
                            <i class="fas fa-file-export"></i>
                            Export M3U
                        </button>
                        <button class="copy-to-folder-btn">
                            <i class="fas fa-folder-plus"></i>
                            Copy to Folder
                        </button>
                        <button class="remove-all-btn">
                            <i class="fas fa-trash"></i>
                            Remove All
                        </button>
                    </div>
                </div>
                <div class="playlist-tracks-list">
                    ${playlist.tracks.length === 0 ? 
                        '<div class="empty-state">No tracks in this playlist</div>' :
                        playlist.tracks.map((track, index) => `
                            <div class="playlist-track-item" data-index="${index}">
                                <div class="track-info">
                                    <span class="track-name">${track.name || 'Unknown Track'}</span>
                                    <span class="track-artist">${track.artist || 'Unknown Artist'}</span>
                                </div>
                                <div class="track-actions">
                                    <button class="play-track-btn" title="Play">
                                        <i class="fas fa-play"></i>
                                    </button>
                                    <button class="remove-track-btn" title="Remove">
                                        <i class="fas fa-times"></i>
                                    </button>
                                </div>
                            </div>
                        `).join('')
                    }
                </div>
                <div class="playlist-contents-footer">
                    <button class="close-btn">Close</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        requestAnimationFrame(() => modal.classList.add('show'));

        // Add ESC key handler
        const handleEscKey = (e) => {
            if (e.key === 'Escape') {
                this.closePlaylistContentsModal(modal);
                document.removeEventListener('keydown', handleEscKey);
            }
        };
        document.addEventListener('keydown', handleEscKey);

        // Add click handler for outside modal click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closePlaylistContentsModal(modal);
                document.removeEventListener('keydown', handleEscKey);
            }
        });

        // Add event listeners
        const closeBtn = modal.querySelector('.close-btn');
        closeBtn.addEventListener('click', () => {
            this.closePlaylistContentsModal(modal);
            document.removeEventListener('keydown', handleEscKey);
        });

        const playAllBtn = modal.querySelector('.play-all-btn');
        if (playAllBtn) {
            playAllBtn.addEventListener('click', () => this.playAllTracks(playlist.tracks));
        }

        const shuffleBtn = modal.querySelector('.shuffle-btn');
        if (shuffleBtn) {
            shuffleBtn.addEventListener('click', () => this.shuffleAndPlayTracks(playlist.tracks));
        }

        const exportM3UBtn = modal.querySelector('.export-m3u-btn');
        if (exportM3UBtn) {
            exportM3UBtn.addEventListener('click', () => this.exportAsM3U(playlist));
        }

        const copyToFolderBtn = modal.querySelector('.copy-to-folder-btn');
        if (copyToFolderBtn) {
            copyToFolderBtn.addEventListener('click', () => this.copyPlaylistToFolder(playlist));
        }

        const removeAllBtn = modal.querySelector('.remove-all-btn');
        if (removeAllBtn) {
            removeAllBtn.addEventListener('click', () => {
                if (confirm('Are you sure you want to remove all tracks from this playlist?')) {
                    this.removeAllTracks(playlistIndex);
                    this.closePlaylistContentsModal(modal);
                    document.removeEventListener('keydown', handleEscKey);
                }
            });
        }

        // Add event listeners for individual tracks
        const trackItems = modal.querySelectorAll('.playlist-track-item');
        trackItems.forEach(item => {
            const index = parseInt(item.dataset.index);
            const playBtn = item.querySelector('.play-track-btn');
            const removeBtn = item.querySelector('.remove-track-btn');

            playBtn.addEventListener('click', () => this.playTrack(playlist.tracks[index]));
            removeBtn.addEventListener('click', () => {
                this.removeTrack(playlistIndex, index);
                item.remove();
                if (playlist.tracks.length === 0) {
                    modal.querySelector('.playlist-tracks-list').innerHTML = 
                        '<div class="empty-state">No tracks in this playlist</div>';
                }
            });
        });
    }

    closePlaylistContentsModal(modal) {
        modal.classList.remove('show');
        setTimeout(() => modal.remove(), 300);
    }

    playAllTracks(tracks) {
        if (tracks.length > 0) {
            window.dispatchEvent(new CustomEvent('playTrack', {
                detail: { 
                    index: 0,
                    tracks: tracks,
                    isPlaylist: true
                }
            }));
        }
    }

    shuffleAndPlayTracks(tracks) {
        if (tracks.length > 0) {
            // Create a copy of the tracks array to avoid modifying the original
            const shuffledTracks = [...tracks];
            // Fisher-Yates shuffle algorithm
            for (let i = shuffledTracks.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffledTracks[i], shuffledTracks[j]] = [shuffledTracks[j], shuffledTracks[i]];
            }
            window.dispatchEvent(new CustomEvent('playTrack', {
                detail: { 
                    index: 0,
                    tracks: shuffledTracks,
                    isPlaylist: true
                }
            }));
        }
    }

    playTrack(track) {
        const currentPlaylist = this.playlists.find(p => p.tracks.some(t => t.path === track.path));
        if (currentPlaylist) {
            window.dispatchEvent(new CustomEvent('playTrack', {
                detail: { 
                    index: currentPlaylist.tracks.findIndex(t => t.path === track.path),
                    tracks: currentPlaylist.tracks,
                    isPlaylist: true
                }
            }));
        }
    }

    removeTrack(playlistIndex, trackIndex) {
        const playlist = this.playlists[playlistIndex];
        playlist.tracks.splice(trackIndex, 1);
        this.savePlaylists();
        
        // Update track count in playlist card
        const trackCount = document.querySelectorAll('.playlist-card')[playlistIndex]
            .querySelector('.track-count');
        trackCount.textContent = `${playlist.tracks.length} tracks`;
        
        // Dispatch event for playlist update
        window.dispatchEvent(new CustomEvent('playlistUpdated', {
            detail: { playlistIndex }
        }));
    }

    removeAllTracks(playlistIndex) {
        const playlist = this.playlists[playlistIndex];
        playlist.tracks = [];
        this.savePlaylists();
        
        // Update track count in playlist card
        const trackCount = document.querySelectorAll('.playlist-card')[playlistIndex]
            .querySelector('.track-count');
        trackCount.textContent = '0 tracks';
        
        // Dispatch event for playlist update
        window.dispatchEvent(new CustomEvent('playlistUpdated', {
            detail: { playlistIndex }
        }));
    }

    showCreatePlaylistModal(track = null) {
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
        const createBtn = modal.querySelector('.create-btn');
        const input = modal.querySelector('input');

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = input.value.trim();
            if (name) {
                this.createPlaylist(name);
                if (track) {
                    this.addTrackToPlaylist(track, this.playlists.length - 1);
                }
                this.closeModal(modal);
            }
        });

        cancelBtn.addEventListener('click', () => this.closeModal(modal));
    }

    closeModal(modal) {
        modal.classList.remove('show');
        setTimeout(() => modal.remove(), 300);
    }

    createPlaylist(name) {
        const newPlaylist = {
            name: name,
            tracks: []
        };
        this.playlists.push(newPlaylist);
        this.savePlaylists();
        this.renderPlaylists();
    }

    addTrackToPlaylist(track, playlistIndex) {
        if (playlistIndex >= 0 && playlistIndex < this.playlists.length) {
            const playlist = this.playlists[playlistIndex];
            if (playlist) {
                // Avoid duplicates
                if (playlist.tracks.some(t => t.path === track.path)) {
                    this.showNotification(`"${track.name}" is already in "${playlist.name}"`);
                    return;
                }
                playlist.tracks.push(track);
                this.savePlaylists();
                this.renderPlaylists();
                this.showNotification(`Added "${track.name}" to "${playlist.name}"`);
            }
        }
    }

    savePlaylists() {
        localStorage.setItem('playlists', JSON.stringify(this.playlists));
        window.dispatchEvent(new Event('playlistUpdated'));
    }

    deletePlaylist(index) {
        this.playlists.splice(index, 1);
        this.savePlaylists();
        this.renderPlaylists();
        
        // Dispatch event for playlist update
        window.dispatchEvent(new CustomEvent('playlistUpdated'));
    }

    showDeleteConfirmationModal(playlistName, playlistIndex) {
        const modal = document.createElement('div');
        modal.className = 'delete-confirmation-modal';
        modal.innerHTML = `
            <div class="delete-confirmation-content">
                <h3>Delete Playlist</h3>
                <p>Are you sure you want to delete the playlist "${playlistName}"?</p>
                <div class="delete-confirmation-actions">
                    <button class="cancel-btn">Cancel</button>
                    <button class="delete-btn">Delete</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        requestAnimationFrame(() => modal.classList.add('show'));

        const handleEscKey = (e) => {
            if (e.key === 'Escape') {
                this.closeDeleteConfirmationModal(modal);
                document.removeEventListener('keydown', handleEscKey);
            }
        };
        document.addEventListener('keydown', handleEscKey);

        modal.addEventListener('click', e => {
            if (e.target === modal) {
                this.closeDeleteConfirmationModal(modal);
                document.removeEventListener('keydown', handleEscKey);
            }
        });

        const deleteBtn = modal.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', () => {
            this.deletePlaylist(playlistIndex);
            this.closeDeleteConfirmationModal(modal);
            document.removeEventListener('keydown', handleEscKey);
        });

        const cancelBtn = modal.querySelector('.cancel-btn');
        cancelBtn.addEventListener('click', () => {
            this.closeDeleteConfirmationModal(modal);
            document.removeEventListener('keydown', handleEscKey);
        });
    }

    closeDeleteConfirmationModal(modal) {
        modal.classList.remove('show');
        setTimeout(() => modal.remove(), 300);
    }

    exportAsM3U(playlist) {
        // Create M3U content
        let m3uContent = '#EXTM3U\n';
        
        // Add each track
        playlist.tracks.forEach(track => {
            // Add extended info
            m3uContent += `#EXTINF:-1,${track.artist || 'Unknown Artist'} - ${track.name || 'Unknown Track'}\n`;
            // Add file path
            m3uContent += `${track.path}\n`;
        });

        // Create blob and download
        const blob = new Blob([m3uContent], { type: 'audio/x-mpegurl' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${playlist.name}.m3u`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }

    async copyPlaylistToFolder(playlist) {
        if (playlist.tracks.length === 0) {
            alert('This playlist is empty. Add some tracks first.');
            return;
        }

        try {
            // Get file paths from tracks
            const filePaths = playlist.tracks.map(track => track.path);
            
            // Show folder selection dialog
            const destinationFolder = await window.api.selectFolder();
            
            if (!destinationFolder) {
                return; // User cancelled
            }

            // Show loading indicator
            const loadingModal = this.showLoadingModal(`Copying ${playlist.tracks.length} files...`);
            
            // Copy files to the selected folder
            const result = await window.api.copyFilesToFolder(filePaths, destinationFolder);
            
            // Hide loading modal
            this.hideLoadingModal(loadingModal);
            
            if (result.success) {
                const successfulCopies = result.results.filter(r => r.success && !r.skipped).length;
                const skippedFiles = result.results.filter(r => r.skipped).length;
                const failedCopies = result.results.filter(r => !r.success).length;
                
                let message = `Operation completed for "${destinationFolder}":\n\n`;
                
                if (successfulCopies > 0) {
                    message += `✅ ${successfulCopies} new files copied\n`;
                }
                
                if (skippedFiles > 0) {
                    message += `⏭️ ${skippedFiles} files skipped (already exist)\n`;
                }
                
                if (failedCopies > 0) {
                    message += `❌ ${failedCopies} files failed to copy\n`;
                }
                
                if (successfulCopies === 0 && skippedFiles > 0) {
                    message += `\nAll files already exist in the destination folder.`;
                }
                
                alert(message);
            } else {
                alert(`Error copying files: ${result.error}`);
            }
        } catch (error) {
            console.error('Error copying playlist to folder:', error);
            alert(`Error copying files: ${error.message}`);
        }
    }

    showLoadingModal(message) {
        const modal = document.createElement('div');
        modal.className = 'loading-modal';
        modal.innerHTML = `
            <div class="loading-content">
                <div class="loading-spinner"></div>
                <p>${message}</p>
            </div>
        `;

        document.body.appendChild(modal);
        requestAnimationFrame(() => modal.classList.add('show'));
        return modal;
    }

    hideLoadingModal(modal) {
        if (modal) {
            modal.classList.remove('show');
            setTimeout(() => modal.remove(), 300);
        }
    }

    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        document.body.appendChild(notification);
        setTimeout(() => {
            notification.classList.add('show');
            setTimeout(() => {
                notification.classList.remove('show');
                setTimeout(() => notification.remove(), 300);
            }, 3000);
        }, 10);
    }

    showPlaylistDropdown(track, buttonElement) {
        // Close any other open dropdowns
        document.querySelectorAll('.playlist-dropdown.show').forEach(openDropdown => {
            openDropdown.remove();
        });

        const dropdown = document.createElement('div');
        dropdown.className = 'playlist-dropdown';

        // Populate with playlists
        this.playlists.forEach((playlist, index) => {
            const option = document.createElement('div');
            option.className = 'playlist-option';
            option.innerHTML = `<i class="fas fa-music"></i> ${playlist.name}`;
            option.addEventListener('click', (e) => {
                e.stopPropagation();
                this.addTrackToPlaylist(track, index);
                dropdown.remove();
            });
            dropdown.appendChild(option);
        });

        // Add "Create New Playlist" option
        const createOption = document.createElement('div');
        createOption.className = 'playlist-option create-playlist-option';
        createOption.innerHTML = `<i class="fas fa-plus"></i> Create New Playlist`;
        createOption.addEventListener('click', (e) => {
            e.stopPropagation();
            this.showCreatePlaylistModal(track);
            dropdown.remove();
        });
        dropdown.appendChild(createOption);

        document.body.appendChild(dropdown);
        
        // Position and show the dropdown
        requestAnimationFrame(() => {
            const rect = buttonElement.getBoundingClientRect();
            dropdown.style.position = 'fixed';
            
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
            dropdown.classList.add('show');
        });

        // Click outside to close
        const clickOutsideHandler = (e) => {
            if (!dropdown.contains(e.target) && dropdown.classList.contains('show')) {
                dropdown.remove();
                document.removeEventListener('click', clickOutsideHandler, true);
            }
        };
        document.addEventListener('click', clickOutsideHandler, true);
    }
} 