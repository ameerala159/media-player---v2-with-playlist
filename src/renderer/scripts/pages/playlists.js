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
            <h3>${playlist.name}</h3>
            <div class="track-count">${playlist.tracks.length} tracks</div>
        `;

        card.addEventListener('click', () => this.showPlaylistContents(index));
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

    showCreatePlaylistModal() {
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

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = form.querySelector('input').value.trim();
            if (name) {
                this.createPlaylist(name);
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
            name,
            tracks: []
        };
        this.playlists.push(newPlaylist);
        this.savePlaylists();
        this.renderPlaylists();
    }

    addTrackToPlaylist(track, playlistIndex) {
        if (playlistIndex >= 0 && playlistIndex < this.playlists.length) {
            const playlist = this.playlists[playlistIndex];
            if (!playlist.tracks.some(t => t.path === track.path)) {
                playlist.tracks.push(track);
                this.savePlaylists();
                this.renderPlaylists();
                
                // Dispatch event for track addition
                window.dispatchEvent(new CustomEvent('trackAddedToPlaylist', {
                    detail: { playlistIndex, track }
                }));
            }
        }
    }

    savePlaylists() {
        localStorage.setItem('playlists', JSON.stringify(this.playlists));
    }
} 