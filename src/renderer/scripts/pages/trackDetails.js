// Track details functionality
export class TrackDetails {
    constructor() {
        this.modal = document.getElementById('trackDetailsModal');
        this.closeBtn = document.getElementById('closeTrackDetails');
        this.title = document.getElementById('trackDetailsTitle');
        this.artist = document.getElementById('trackDetailsArtist');
        this.duration = document.getElementById('trackDetailsDuration');
        this.description = document.querySelector('.track-details-description p');
        this.ratingSquares = document.querySelectorAll('.rating-square');
        this.favoriteBtn = document.getElementById('favoriteTrackBtn');
        this.addToPlaylistBtn = document.getElementById('addToPlaylistBtn');
        this.currentTrack = null;
        this.currentRating = 0;
    }

    // Initialize track details
    init() {
        this.setupEventListeners();
    }

    // Setup event listeners
    setupEventListeners() {
        // Close button
        this.closeBtn.addEventListener('click', () => this.closeModal());

        // Close on outside click
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.closeModal();
            }
        });

        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal.classList.contains('show')) {
                this.closeModal();
            }
        });

        // Rating squares
        this.ratingSquares.forEach(square => {
            square.addEventListener('click', () => this.handleRatingClick(square));
            square.addEventListener('mouseover', () => this.handleRatingHover(square));
            square.addEventListener('mouseout', () => this.handleRatingOut());
        });

        // Favorite button
        this.favoriteBtn.addEventListener('click', () => this.handleFavoriteClick());

        // Add to playlist button
        this.addToPlaylistBtn.addEventListener('click', () => this.showAddToPlaylistModal());
    }

    // Show track details
    showTrackDetails(track) {
        this.currentTrack = track;
        this.title.textContent = track.name;
        this.artist.textContent = track.artist;
        this.duration.textContent = this.formatTime(track.duration);
        
        // Show more details in the description
        this.description.innerHTML = `
            <strong>File Name:</strong> ${track.name}<br>
            <strong>Artist:</strong> ${track.artist}<br>
            <strong>Duration:</strong> ${this.formatTime(track.duration)}<br>
            <strong>Path:</strong> <span style='word-break:break-all;'>${track.path}</span>
        `;
        
        // Load saved rating
        const trackRatings = JSON.parse(localStorage.getItem('trackRatings') || '{}');
        this.currentRating = trackRatings[track.path] || 0;
        
        // Update rating squares
        this.updateRatingSquares();

        // Load favorite status
        const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
        const isFavorite = favorites.includes(track.path);
        this.favoriteBtn.classList.toggle('active', isFavorite);
        this.favoriteBtn.innerHTML = `<i class="fas fa-heart"></i> ${isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}`;

        // Show modal
        this.modal.style.display = 'flex';
        // Force a reflow
        this.modal.offsetHeight;
        this.modal.classList.add('show');
    }

    // Close modal
    closeModal() {
        this.modal.classList.remove('show');
        setTimeout(() => {
            this.modal.style.display = 'none';
        }, 300);
    }

    // Handle rating click
    handleRatingClick(square) {
        const rating = parseInt(square.dataset.rating);
        this.currentRating = rating;
        
        // Update visual state of squares
        this.updateRatingSquares();

        // Save rating to localStorage
        if (this.currentTrack) {
            const trackRatings = JSON.parse(localStorage.getItem('trackRatings') || '{}');
            trackRatings[this.currentTrack.path] = rating;
            localStorage.setItem('trackRatings', JSON.stringify(trackRatings));

            // Dispatch event for rating update
            window.dispatchEvent(new CustomEvent('trackRatingUpdated', {
                detail: { track: this.currentTrack, rating }
            }));
        }
    }

    // Handle rating hover
    handleRatingHover(square) {
        const rating = parseInt(square.dataset.rating);
        this.ratingSquares.forEach(s => {
            if (parseInt(s.dataset.rating) <= rating) {
                s.style.backgroundColor = '#e3f5e9';
            } else {
                s.style.backgroundColor = '';
            }
        });
    }

    // Handle rating mouse out
    handleRatingOut() {
        this.ratingSquares.forEach(s => {
            if (!s.classList.contains('active')) {
                s.style.backgroundColor = '';
            }
        });
    }

    // Update rating squares
    updateRatingSquares() {
        this.ratingSquares.forEach(square => {
            if (parseInt(square.dataset.rating) <= this.currentRating) {
                square.classList.add('active');
            } else {
                square.classList.remove('active');
            }
            square.style.backgroundColor = '';
        });
    }

    // Handle favorite click
    handleFavoriteClick() {
        if (this.currentTrack) {
            const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
            const isFavorite = favorites.includes(this.currentTrack.path);
            
            if (isFavorite) {
                // Remove from favorites
                const index = favorites.indexOf(this.currentTrack.path);
                favorites.splice(index, 1);
                this.favoriteBtn.classList.remove('active');
                this.favoriteBtn.innerHTML = '<i class="fas fa-heart"></i> Add to Favorites';
            } else {
                // Add to favorites
                favorites.push(this.currentTrack.path);
                this.favoriteBtn.classList.add('active');
                this.favoriteBtn.innerHTML = '<i class="fas fa-heart"></i> Remove from Favorites';
            }
            
            localStorage.setItem('favorites', JSON.stringify(favorites));
            
            // Dispatch event for favorite status change
            window.dispatchEvent(new CustomEvent('favoriteStatusChanged'));
        }
    }

    // Show add to playlist modal
    showAddToPlaylistModal() {
        const playlists = JSON.parse(localStorage.getItem('playlists') || '[]');
        
        if (playlists.length === 0) {
            alert('No playlists available. Please create a playlist first.');
            return;
        }

        const modal = document.createElement('div');
        modal.className = 'add-to-playlist-modal';
        modal.innerHTML = `
            <div class="add-to-playlist-content">
                <h3>Add to Playlist</h3>
                <div class="playlist-list">
                    ${playlists.map((playlist, index) => `
                        <div class="playlist-item" data-index="${index}">
                            <span class="playlist-name">${playlist.name}</span>
                            <span class="track-count">${playlist.tracks.length} tracks</span>
                        </div>
                    `).join('')}
                </div>
                <div class="add-to-playlist-actions">
                    <button class="cancel-btn">Cancel</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        requestAnimationFrame(() => modal.classList.add('show'));

        // Add click handlers for playlist items
        const playlistItems = modal.querySelectorAll('.playlist-item');
        playlistItems.forEach(item => {
            item.addEventListener('click', () => {
                const playlistIndex = parseInt(item.dataset.index);
                this.addTrackToPlaylist(playlistIndex);
                this.closeAddToPlaylistModal(modal);
            });
        });

        // Add click handler for cancel button
        const cancelBtn = modal.querySelector('.cancel-btn');
        cancelBtn.addEventListener('click', () => this.closeAddToPlaylistModal(modal));
    }

    // Close add to playlist modal
    closeAddToPlaylistModal(modal) {
        modal.classList.remove('show');
        setTimeout(() => modal.remove(), 300);
    }

    // Add track to playlist
    addTrackToPlaylist(playlistIndex) {
        if (this.currentTrack) {
            const playlists = JSON.parse(localStorage.getItem('playlists') || '[]');
            const playlist = playlists[playlistIndex];
            
            if (playlist && !playlist.tracks.some(t => t.path === this.currentTrack.path)) {
                playlist.tracks.push(this.currentTrack);
                localStorage.setItem('playlists', JSON.stringify(playlists));
                
                // Dispatch event for playlist update
                window.dispatchEvent(new CustomEvent('playlistUpdated', {
                    detail: { playlistIndex, track: this.currentTrack }
                }));
            }
        }
    }

    // Format time
    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
} 