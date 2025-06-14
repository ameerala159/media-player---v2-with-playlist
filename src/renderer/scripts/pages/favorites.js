// Favorites page functionality
export class FavoritesPage {
    constructor() {
        this.favoritesList = document.getElementById('favoritesList');
        this.currentPlaylist = [];
        this.trackShapes = new Map(); // Store shapes for each track
    }

    // Initialize favorites page
    init() {
        this.setupEventListeners();
    }

    // Setup event listeners
    setupEventListeners() {
        // Listen for track list updates from home page
        window.addEventListener('trackListUpdated', (event) => {
            this.currentPlaylist = event.detail.tracks;
            this.updateFavoritesList();
        });

        // Listen for favorite status changes
        window.addEventListener('favoriteStatusChanged', () => {
            this.updateFavoritesList();
        });
    }

    // Update favorites list
    updateFavoritesList() {
        const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
        this.favoritesList.innerHTML = '';

        if (favorites.length === 0) {
            this.favoritesList.innerHTML = '<div class="empty-state">No favorite songs yet</div>';
            return;
        }

        // Filter current playlist to only show favorite tracks
        const favoriteTracks = this.currentPlaylist.filter(track => favorites.includes(track.path));
        
        favoriteTracks.forEach((track, index) => {
            const item = this.createFavoriteItem(track, this.currentPlaylist.indexOf(track));
            this.favoritesList.appendChild(item);
        });
    }

    // Create favorite item element
    createFavoriteItem(track, index) {
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
            <div class="music-duration">${duration}</div>
        `;

        // Add favorite indicator
        const favoriteIndicator = document.createElement('div');
        favoriteIndicator.className = 'favorite-indicator';
        favoriteIndicator.innerHTML = '<i class="fas fa-heart"></i>';
        item.querySelector('.music-info').appendChild(favoriteIndicator);

        // Add rating indicator if track has a rating
        const trackRatings = JSON.parse(localStorage.getItem('trackRatings') || '{}');
        if (trackRatings[track.path]) {
            const ratingIndicator = document.createElement('div');
            ratingIndicator.className = 'rating-indicator';
            ratingIndicator.innerHTML = '★'.repeat(trackRatings[track.path]);
            item.querySelector('.music-info').appendChild(ratingIndicator);
        }

        // Add click handler for playing track
        item.addEventListener('click', () => {
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

        return item;
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
} 