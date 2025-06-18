# Media Player - v2 with Playlist

A modern, feature-rich desktop music player built with Electron. Enjoy seamless music browsing, powerful playlist and favorites management, extensive customization, and a beautiful, responsive UI.

---

## 🚀 Features

### 🎵 Music Browsing
- **Select Music Folder:** Choose your music directory for instant library access.
- **Search & Sort:** Find tracks by name and sort by title, rating, or date modified.
- **Track Cards:** View tracks in a card-based layout with album art, details, and quick actions.

### ▶️ Playback Controls
- **Play/Pause, Next/Previous:** Full playback control with both UI buttons and keyboard shortcuts.
- **Skip Forward/Backward:** Adjustable skip duration, progress bar seeking.
- **Playback Speed:** Change speed from 0.5x to 4x, with visual feedback.
- **Shuffle & Repeat:** Toggle shuffle, repeat one/all/none, and auto-shuffle options.
- **Sleep Timer:** Set a timer to stop playback after a chosen period.
- **Volume Control:** Slider and mute/unmute with dropdown and icon feedback.

### 🖼️ Mini Player Mode
- **Compact UI:** Essential controls in a floating, draggable, and resizable mini player.
- **Quick Toggle:** Instantly switch between full and mini player modes.
- **Always on Top:** When mini player mode is enabled, the player window stays on top of other apps for easy access.

### ⭐ Favorites
- **Mark/Unmark Favorites:** Easily favorite tracks and view them in a dedicated page.
- **Favorite Indicators:** Visual cues for favorite tracks throughout the app.

### 🎶 Playlists
- **Create/Delete Playlists:** Organize your music with custom playlists.
- **Add/Remove Tracks:** Manage playlist contents with ease.
- **Shuffle/Play All:** Instantly play or shuffle entire playlists.
- **Remove All Tracks:** Clear playlists with a single action.
- **Modal Management:** Intuitive modal dialogs for playlist actions.

### ℹ️ Track Details
- **Detailed Modal:** View and edit track info, including:
  - **Rating:** 0-5 stars, with the ability to remove ratings.
  - **Add to Favorites/Playlist:** Quick actions from the details modal.

### 🔔 Notifications
- **Visual Feedback:** Animated notifications for actions like removing favorites, changing speed, etc.

### ⚙️ Settings
- **Dark/Light Mode:** Toggle between themes for comfortable viewing.
- **Font Size & Family:** Choose from many Google Fonts and adjust text size.
- **Theme Color:** Select from presets or use a color picker for full customization.
- **Mini Player Toggle:** Enable/disable mini player mode.
- **Persistent Settings:** All preferences are saved via localStorage.

### 👤 About Page
- **Developer Info:** Learn about the app creator.
- **Support:** Quick links to PayPal and Patreon for supporting development.

---

## ⌨️ Keyboard Shortcuts

| Shortcut                | Action                        |
|-------------------------|-------------------------------|
| Space / Ctrl+P          | Play/Pause                    |
| Ctrl+D                  | Dark mode                     |
| Ctrl+L                  | Light mode                    |
| Ctrl+F                  | Toggle shuffle                |
| Ctrl+R                  | Repeat once                   |
| Ctrl+M                  | Toggle mini player            |
| F                       | Maximize/restore/fullscreen   |
| Arrow Left/Right        | Skip backward/forward         |
| Ctrl+Arrow Left/Right   | Previous/next track           |
| Ctrl+]                  | Increase playback speed       |
| Ctrl+[                  | Decrease playback speed       |
| Esc                     | Close modal/dropdown          |

> **Tip:** An in-app shortcuts modal is available for quick reference.

---

## 🎨 Design Features

- **Modern, Responsive UI:** Sidebar navigation, adaptive content area, and player controls for both desktop and mobile.
- **Customizable Appearance:** Theme color, dark/light mode, font size, and font family.
- **Material/Flat Design:** CSS variables, shadows, rounded corners, and smooth transitions.
- **Custom Dropdowns:** For settings, sorting, and playlist management.
- **Animated Elements:** Loading spinners, notifications, and modal transitions.
- **Accessibility:** Keyboard navigation, focus states, and clear visual feedback.
- **Mini Player:** Floating, draggable, and resizable with a distinct style.
- **Track/Playlist Cards:** Card-based layout with hover effects, icons, and action buttons.
- **Dark Mode:** Comprehensive dark theme with adjusted colors for all UI elements.
- **Support for Multiple Fonts:** Many Google Fonts selectable in settings.

---

## 🛠️ Getting Started

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Run the App**
   ```bash
   npm start
   ```

3. **Build for Production**
   ```bash
   npm run make
   ```

---

## 📁 Project Structure

```
src/
  main/         # Electron main process
  preload/      # Preload scripts
  renderer/     # UI, scripts, styles, and assets
    assets/     # Icons, images, thumbnails
    scripts/    # All renderer JS (player, pages, settings, etc.)
    styles/     # CSS
    index.html  # Main UI
```

---

## 🙏 Support

If you enjoy using this app, consider supporting development via [PayPal](#) or [Patreon](#).

---

## 👨‍💻 Author

Developed by Ameer.

---

**Enjoy your music with style and power!**

---

Let me know if you want to add installation screenshots, troubleshooting, or contribution guidelines! 