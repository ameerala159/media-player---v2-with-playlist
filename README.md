# Modern Music Player

A sleek and feature-rich desktop music player built with Electron, offering a modern user interface and powerful playback controls.

## Features

### Core Features
- 🎵 Local music file playback
- 📁 Custom music folder selection
- 🎨 Modern, clean user interface
- 🎧 Full playback controls (play/pause, next/previous, seek)
- ⏪⏩ Skip forward/backward with customizable durations
- 📱 Responsive design for different screen sizes
- 📋 Playlist management system
- ⭐ Track rating system
- ❤️ Favorites functionality
- 🔍 Search and sort capabilities

### Advanced Controls
- **Smart Skip Controls**
  - Long-press skip buttons to show duration options
  - Customizable skip durations (2s, 5s, 10s, 15s, 30s, 1m, 5m)
  - Quick access to frequently used skip durations

- **Track Navigation**
  - Long-press next/previous buttons to show track selection
  - Visual track list with current track highlighting
  - Quick jump to any track in the playlist

- **Playback Information**
  - Real-time progress bar
  - Current time and total duration display
  - Now playing information with track name and artist
  - Dynamic album art generation

### Playlist Features
- Create and manage multiple playlists
- Add tracks to playlists with a single click
- Play entire playlists with one button
- Duplicate track prevention in playlists
- Visual playlist management interface
- Quick access to playlist controls

### User Interface
- Custom window controls (minimize, maximize, close)
- File menu for folder selection
- Responsive layout that adapts to window size
- Modern dropdown menus with smooth animations
- Loading indicators for better user experience
- Track rating system with visual indicators
- Favorites page for quick access to favorite tracks
- Search and sort functionality for music library

## Technical Requirements

### System Requirements
- Windows 10 or later
- macOS 10.13 or later
- Linux (Ubuntu 18.04 or later)
- 4GB RAM minimum
- 100MB free disk space

### Development Requirements
- Node.js 16.x or later
- npm 7.x or later
- Electron 36.x or later

### Dependencies
- electron (^36.4.0)
- electron-builder (^24.9.1)
- music-metadata (^11.2.3)

## Installation

1. Clone the repository:
```bash
git clone [repository-url]
cd modern-music-player
```

2. Install dependencies:
```bash
npm install
```

3. Start the application:
```bash
npm start
```

## Development

### Project Structure
```
modern-music-player/
├── src/
│   ├── main/           # Main process files
│   ├── renderer/       # Renderer process files
│   │   ├── scripts/    # JavaScript files
│   │   ├── styles/     # CSS files
│   │   ├── assets/     # Icons and other assets
│   │   └── index.html  # Main window HTML
│   └── preload/        # Preload scripts
├── dist/              # Build output directory
├── package.json
└── README.md
```

### Available Scripts
- `npm start` - Start the application in development mode
- `npm run dev` - Start the application with debug mode enabled
- `npm run build` - Build the application for all platforms
- `npm run build:win` - Build the application specifically for Windows

## Usage

1. **Selecting Music Folder**
   - Click "File" in the menu bar
   - Select "Change Music Folder"
   - Choose your music directory

2. **Playing Music**
   - Click on any track in the list to play
   - Use the play/pause button to control playback
   - Use next/previous buttons to change tracks

3. **Skip Controls**
   - Click skip buttons for default duration (5s)
   - Long-press skip buttons to show duration options
   - Select custom duration from the dropdown

4. **Track Selection**
   - Long-press next/previous buttons to show track list
   - Click on any track to play it immediately

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Font Awesome for the beautiful icons
- Electron team for the amazing framework
- All contributors who have helped shape this project