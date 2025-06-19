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
        this.addToPlaylistBtn = document.getElementById('addToPlaylistBtn');
        this.removeRatingBtn = document.getElementById('removeRatingBtn');
        this.currentTrack = null;
        this.currentRating = 0;
        this.deleteBtn = document.getElementById('deleteTrackBtn');
        this.renameBtn = document.getElementById('renameTrackBtn');
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

        // Remove rating button
        this.removeRatingBtn.addEventListener('click', () => this.removeRating());

        // Add to playlist button
        this.addToPlaylistBtn.addEventListener('click', () => this.showAddToPlaylistModal());

        // Delete button
        if (this.deleteBtn) {
            this.deleteBtn.addEventListener('click', async () => {
                if (!this.currentTrack) return;
                const confirmed = confirm('Are you sure you want to delete this file? It will be moved to the Recycle Bin.');
                if (!confirmed) return;
                const result = await window.api.deleteFile(this.currentTrack.path);
                if (result.success) {
                    alert('File moved to Recycle Bin successfully.');
                    this.closeModal();
                    window.dispatchEvent(new CustomEvent('trackDeleted', { detail: { path: this.currentTrack.path } }));
                } else {
                    alert('Failed to delete file: ' + result.error);
                }
            });
        }

        // Rename button
        if (this.renameBtn) {
            this.renameBtn.addEventListener('click', () => {
                if (!this.currentTrack) return;
                this.showRenameModal();
            });
        }
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
            <strong>Path:</strong> <span class='track-path-link' style='word-break:break-all; color: var(--primary); cursor: pointer; text-decoration: underline;' title='Show in File Explorer'>${track.path}</span>
        `;
        
        // Add click event for the path
        const pathLink = this.description.querySelector('.track-path-link');
        if (pathLink) {
            pathLink.addEventListener('click', () => {
                if (window.api && window.api.showItemInFolder) {
                    window.api.showItemInFolder(track.path);
                }
            });
        }
        
        // Load saved rating
        const trackRatings = JSON.parse(localStorage.getItem('trackRatings') || '{}');
        this.currentRating = trackRatings[track.path] || 0;
        
        // Update rating squares and remove rating button
        this.updateRatingSquares();
        this.updateRemoveRatingButton();

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

    // Remove rating
    removeRating() {
        if (this.currentTrack) {
            this.currentRating = 0;
            this.updateRatingSquares();
            
            // Remove rating from localStorage
            const trackRatings = JSON.parse(localStorage.getItem('trackRatings') || '{}');
            delete trackRatings[this.currentTrack.path];
            localStorage.setItem('trackRatings', JSON.stringify(trackRatings));
            
            // Update remove rating button
            this.updateRemoveRatingButton();
            
            // Dispatch event for rating update
            window.dispatchEvent(new CustomEvent('trackRatingUpdated', {
                detail: { track: this.currentTrack, rating: 0 }
            }));

            // Dispatch event to update the music list
            window.dispatchEvent(new CustomEvent('updateMusicList'));
        }
    }

    // Update remove rating button visibility
    updateRemoveRatingButton() {
        this.removeRatingBtn.style.display = this.currentRating > 0 ? 'flex' : 'none';
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
            
            // Update remove rating button
            this.updateRemoveRatingButton();

            // Dispatch event for rating update
            window.dispatchEvent(new CustomEvent('trackRatingUpdated', {
                detail: { track: this.currentTrack, rating }
            }));

            // Dispatch event to update the music list
            window.dispatchEvent(new CustomEvent('updateMusicList'));
        }
    }

    // Update rating squares visual state
    updateRatingSquares() {
        this.ratingSquares.forEach(square => {
            const rating = parseInt(square.dataset.rating);
            if (rating <= this.currentRating) {
                square.classList.add('active');
            } else {
                square.classList.remove('active');
            }
            square.style.backgroundColor = '';
        });
    }

    // Handle rating hover
    handleRatingHover(square) {
        const rating = parseInt(square.dataset.rating);
        this.ratingSquares.forEach(s => {
            const r = parseInt(s.dataset.rating);
            if (r <= rating) {
                s.style.backgroundColor = 'var(--primary-hover)';
            } else {
                s.style.backgroundColor = '';
            }
        });
    }

    // Handle rating hover out
    handleRatingOut() {
        this.ratingSquares.forEach(square => {
            square.style.backgroundColor = '';
        });
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

    // Show rename modal
    showRenameModal() {
        const currentName = this.currentTrack.path.split(/[/\\]/).pop();
        const modal = document.createElement('div');
        modal.className = 'rename-modal';
        modal.innerHTML = `
            <div class="rename-content">
                <h3>Rename Track</h3>
                <form class="rename-form">
                    <input type="text" value="${currentName}" required>
                    <div class="rename-actions">
                        <button type="button" class="cancel-btn">Cancel</button>
                        <button type="submit" class="rename-btn">
                            <i class="fas fa-edit"></i>
                            Rename
                        </button>
                    </div>
                </form>
            </div>
        `;

        document.body.appendChild(modal);
        requestAnimationFrame(() => modal.classList.add('show'));

        const form = modal.querySelector('form');
        const input = modal.querySelector('input');
        const cancelBtn = modal.querySelector('.cancel-btn');

        // Select the filename without extension
        const lastDotIndex = currentName.lastIndexOf('.');
        if (lastDotIndex > 0) {
            input.setSelectionRange(0, lastDotIndex);
        }
        input.focus();

        // Close modal function
        const closeModal = () => {
            modal.classList.remove('show');
            setTimeout(() => modal.remove(), 300);
        };

        // Handle form submission
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const newName = input.value.trim();
            if (!newName || newName === currentName) {
                closeModal();
                return;
            }

            const currentPath = this.currentTrack.path;
            const newPath = currentPath.replace(/[/\\][^/\\]+$/, '/' + newName);
            
            const result = await window.api.renameFile(currentPath, newPath);
            if (result.success) {
                this.closeModal();
                window.dispatchEvent(new CustomEvent('trackRenamed', { 
                    detail: { oldPath: currentPath, newPath } 
                }));
                closeModal();
            } else {
                alert('Failed to rename file: ' + result.error);
            }
        });

        // Handle cancel button
        cancelBtn.addEventListener('click', closeModal);

        // Close on outside click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });

        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                closeModal();
            }
        });
    }
} 