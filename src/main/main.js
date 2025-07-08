const { app, BrowserWindow, ipcMain, dialog, nativeImage, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const musicMetadata = require('music-metadata');

// Add for caching
const os = require('os');

// Helper to get cache file path for a folder
function getCacheFilePath(folderPath) {
    // Use a hash of the folder path for uniqueness
    const crypto = require('crypto');
    const hash = crypto.createHash('md5').update(folderPath).digest('hex');
    const userData = app.getPath('userData');
    return path.join(userData, `musicCache_${hash}.json`);
}

// Helper to get folder's last modified time
async function getFolderMTime(folderPath) {
    const stat = await fs.promises.stat(folderPath);
    return stat.mtimeMs;
}

let isSquirrel = false;
try {
  isSquirrel = require('electron-squirrel-startup');
} catch (e) {
  isSquirrel = false;
}
if (isSquirrel) app.quit();

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 475,
    frame: false, // Remove the default window frame
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, '../preload/preload.js')
    }
  });

  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  mainWindow.setSize(1200, 800);
  mainWindow.setResizable(true);
  
  // Set window icon
  mainWindow.setIcon(path.join(__dirname, '../renderer/assets/icon.ico'));

  // Set up thumbnail toolbar buttons for Windows
  if (process.platform === 'win32') {
    try {
      const prevIcon = nativeImage.createFromPath(path.join(__dirname, '../renderer/assets/left.ico'));
      const playIcon = nativeImage.createFromPath(path.join(__dirname, '../renderer/assets/play.ico'));
      const nextIcon = nativeImage.createFromPath(path.join(__dirname, '../renderer/assets/right.ico'));
      const pauseIcon = nativeImage.createFromPath(path.join(__dirname, '../renderer/assets/pause.ico'));

      console.log('Icons loaded:', {
        prev: prevIcon.isEmpty() ? 'empty' : 'loaded',
        play: playIcon.isEmpty() ? 'empty' : 'loaded',
        next: nextIcon.isEmpty() ? 'empty' : 'loaded',
        pause: pauseIcon.isEmpty() ? 'empty' : 'loaded'
      });

      let isPlaying = false;

      // Create buttons array with minimal configuration
      const buttons = [
        {
          tooltip: 'Previous',
          icon: prevIcon,
          click: () => {
            console.log('Previous button clicked');
            mainWindow.webContents.send('thumbnail-toolbar-click', 'prev');
          }
        },
        {
          tooltip: 'Play/Pause',
          icon: playIcon,
          click: () => {
            console.log('Play/Pause button clicked');
            mainWindow.webContents.send('thumbnail-toolbar-click', 'play-pause');
            // Toggle icon after click
            isPlaying = !isPlaying;
            buttons[1].icon = isPlaying ? pauseIcon : playIcon;
            mainWindow.setThumbarButtons(buttons);
          }
        },
        {
          tooltip: 'Next',
          icon: nextIcon,
          click: () => {
            console.log('Next button clicked');
            mainWindow.webContents.send('thumbnail-toolbar-click', 'next');
          }
        }
      ];

      // Set thumbnail toolbar buttons
      const result = mainWindow.setThumbarButtons(buttons);
      console.log('setThumbarButtons result:', result);

      // If setting buttons failed, try with empty array first
      if (!result) {
        console.log('Trying to clear existing buttons first...');
        mainWindow.setThumbarButtons([]);
        setTimeout(() => {
          const retryResult = mainWindow.setThumbarButtons(buttons);
          console.log('Retry setThumbarButtons result:', retryResult);
        }, 100);
      }

      // Listen for playback state changes from renderer
      ipcMain.on('playback-state-changed', (event, state) => {
        isPlaying = state.isPlaying;
        buttons[1].icon = isPlaying ? pauseIcon : playIcon;
        mainWindow.setThumbarButtons(buttons);
      });
    } catch (error) {
      console.error('Error setting up thumbnail toolbar:', error);
    }
  }
}

// Handle window control actions
ipcMain.on('toMain', (event, data) => {
  switch (data.action) {
    case 'minimize':
      mainWindow.minimize();
      break;
    case 'maximize':
      if (mainWindow.isMaximized()) {
        mainWindow.unmaximize();
      } else {
        mainWindow.maximize();
      }
      break;
    case 'close':
      mainWindow.close();
      break;
    case 'restart':
      app.relaunch();
      app.exit(0);
      break;
  }
});

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Handle folder selection
ipcMain.handle('select-folder', async () => {
    const result = await dialog.showOpenDialog({
        properties: ['openDirectory']
    });

    if (!result.canceled) {
        return result.filePaths[0];
    }
    return null;
});

// Handle getting subfolders
ipcMain.handle('get-subfolders', async (event, folderPath) => {
    try {
        const dirents = await fs.promises.readdir(folderPath, { withFileTypes: true });
        const subfolderPromises = dirents
            .filter(dirent => dirent.isDirectory())
            .map(async (dirent) => {
                const subfolderPath = path.join(folderPath, dirent.name);
                const musicFiles = await scanDirectoryRecursively(subfolderPath);
                return {
                    name: dirent.name,
                    path: subfolderPath,
                    trackCount: musicFiles.length,
                };
            });
        
        const subfolders = await Promise.all(subfolderPromises);
        return subfolders;
    } catch (error) {
        console.error(`Error reading subfolders for ${folderPath}:`, error);
        return [];
    }
});

// Handle getting music files
ipcMain.handle('get-music-files', async (event, { path: folderPath, batchSize = 100, startIndex = 0 }) => {
    try {
        let musicFilesPaths = [];
        let cacheUsed = false;
        let cacheFilePath;
        let folderMTime;
        let cacheData;

        if (Array.isArray(folderPath)) {
            // If paths is an array, it's individual files
            musicFilesPaths = folderPath;
        } else if (typeof folderPath === 'string') {
            // If paths is a string, it's a folder path
            cacheFilePath = getCacheFilePath(folderPath);
            try {
                folderMTime = await getFolderMTime(folderPath);
                if (fs.existsSync(cacheFilePath)) {
                    const raw = await fs.promises.readFile(cacheFilePath, 'utf-8');
                    cacheData = JSON.parse(raw);
                    // Check if cache is up-to-date
                    if (cacheData.folderMTime === folderMTime) {
                        musicFilesPaths = cacheData.musicFilesPaths;
                        cacheUsed = true;
                    }
                }
            } catch (e) {
                // Ignore cache errors, fallback to scan
            }
            if (!cacheUsed) {
                musicFilesPaths = await scanDirectoryRecursively(folderPath);
                // Save to cache
                try {
                    await fs.promises.writeFile(
                        cacheFilePath,
                        JSON.stringify({
                            folderMTime,
                            musicFilesPaths
                        }),
                        'utf-8'
                    );
                } catch (e) {
                    // Ignore cache write errors
                }
            }
        }

        // Get total count for pagination
        const totalCount = musicFilesPaths.length;
        const batchFiles = musicFilesPaths.slice(startIndex, startIndex + batchSize);
        const tracks = [];
        for (let i = 0; i < batchFiles.length; i++) {
            const filePath = batchFiles[i];
            try {
                const metadata = await musicMetadata.parseFile(filePath);
                tracks.push({
                    name: metadata.common.title || path.parse(filePath).name,
                    artist: metadata.common.artist || 'Unknown Artist',
                    duration: metadata.format.duration,
                    path: filePath
                });
            } catch (error) {
                console.error(`Error reading metadata for ${filePath}:`, error);
                tracks.push({
                    name: path.parse(filePath).name,
                    artist: 'Unknown Artist',
                    duration: 0,
                    path: filePath
                });
            }
            // Send progress update
            const percent = Math.round(((i + 1) / batchFiles.length) * 100);
            event.sender.send('music-loading-progress', percent);
        }
        return {
            tracks,
            totalCount,
            hasMore: startIndex + batchSize < totalCount
        };
    } catch (error) {
        console.error('Error reading music files:', error);
        return { tracks: [], totalCount: 0, hasMore: false };
    }
});

// Function to recursively scan directory for music files
async function scanDirectoryRecursively(dirPath) {
    const musicFiles = [];
    const validExtensions = ['.mp3', '.wav', '.ogg', '.m4a', '.flac'];

    async function scan(dir) {
        const entries = await fs.promises.readdir(dir, { withFileTypes: true });
        
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            
            if (entry.isDirectory()) {
                // Recursively scan subdirectories
                await scan(fullPath);
            } else if (entry.isFile()) {
                // Check if the file is a music file
                const ext = path.extname(entry.name).toLowerCase();
                if (validExtensions.includes(ext)) {
                    musicFiles.push(fullPath);
                }
            }
        }
    }

    await scan(dirPath);
    return musicFiles;
}

ipcMain.on('set-mini-player-size', (event, isMini) => {
  if (mainWindow) {
    if (isMini) {
      // If window is maximized, unmaximize first
      if (mainWindow.isMaximized()) {
        mainWindow.unmaximize();
      }
      mainWindow.setSize(370, 120);
      mainWindow.setResizable(false);
      mainWindow.center(); // Center the window on screen
    } else {
      mainWindow.setSize(1200, 800);
      mainWindow.setResizable(true);
      mainWindow.center();
    }
  }
});

// Handle thumbnail toolbar button clicks
ipcMain.on('update-thumbnail-toolbar', (event, { button, icon }) => {
  if (mainWindow && process.platform === 'win32') {
    try {
      const prevIcon = nativeImage.createFromPath(path.join(__dirname, '../renderer/assets/left.ico'));
      const playIcon = nativeImage.createFromPath(path.join(__dirname, '../renderer/assets/play.ico'));
      const nextIcon = nativeImage.createFromPath(path.join(__dirname, '../renderer/assets/right.ico'));
      const pauseIcon = nativeImage.createFromPath(path.join(__dirname, '../renderer/assets/pause.ico'));

      const buttons = [
        {
          tooltip: 'Previous Track',
          icon: prevIcon,
          flags: ['enabled'],
          click: () => {
            console.log('Previous button clicked');
            mainWindow.webContents.send('thumbnail-toolbar-click', 'prev');
          }
        },
        {
          tooltip: button === 'play' ? 'Pause' : 'Play',
          icon: button === 'play' ? pauseIcon : playIcon,
          flags: ['enabled'],
          click: () => {
            console.log('Play/Pause button clicked');
            mainWindow.webContents.send('thumbnail-toolbar-click', 'play-pause');
          }
        },
        {
          tooltip: 'Next Track',
          icon: nextIcon,
          flags: ['enabled'],
          click: () => {
            console.log('Next button clicked');
            mainWindow.webContents.send('thumbnail-toolbar-click', 'next');
          }
        }
      ];

      const result = mainWindow.setThumbarButtons(buttons);
      console.log('Updated thumbnail toolbar result:', result);
    } catch (error) {
      console.error('Error updating thumbnail toolbar:', error);
    }
  }
});

ipcMain.on('set-always-on-top', (event, enabled) => {
  if (mainWindow) {
    mainWindow.setAlwaysOnTop(!!enabled, 'screen-saver');
  }
});

ipcMain.handle('delete-file', async (event, filePath) => {
  try {
    await shell.trashItem(filePath);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('rename-file', async (event, { oldPath, newPath }) => {
  try {
    await fs.promises.rename(oldPath, newPath);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('show-item-in-folder', async (event, filePath) => {
  try {
    shell.showItemInFolder(filePath);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Handle copying files to a new folder
ipcMain.handle('copy-files-to-folder', async (event, { filePaths, destinationFolder }) => {
  try {
    const fs = require('fs').promises;
    const path = require('path');
    
    // Create destination folder if it doesn't exist
    await fs.mkdir(destinationFolder, { recursive: true });
    
    const results = [];
    
    for (const filePath of filePaths) {
      try {
        const fileName = path.basename(filePath);
        const destinationPath = path.join(destinationFolder, fileName);
        
        // Check if file already exists in destination with exact same name
        const fileExists = await fs.access(destinationPath).then(() => true).catch(() => false);
        
        if (fileExists) {
          // File already exists, skip copying but mark as skipped
          results.push({ 
            originalPath: filePath, 
            destinationPath: destinationPath, 
            success: true,
            skipped: true,
            reason: 'File already exists'
          });
          continue;
        }
        
        // Check if file already exists with numbered suffix (e.g., "song (1).mp3")
        // This prevents creating multiple copies when copying the same playlist multiple times
        const nameWithoutExt = path.parse(fileName).name;
        const ext = path.parse(fileName).ext;
        let existingNumberedFile = false;
        let counter = 1;
        
        while (true) {
          const numberedPath = path.join(destinationFolder, `${nameWithoutExt} (${counter})${ext}`);
          const numberedExists = await fs.access(numberedPath).then(() => true).catch(() => false);
          
          if (numberedExists) {
            existingNumberedFile = true;
            break;
          }
          
          // If we've checked up to 10 numbered files and none exist, stop checking
          if (counter > 10) {
            break;
          }
          
          counter++;
        }
        
        if (existingNumberedFile) {
          // A numbered version already exists, skip copying
          results.push({ 
            originalPath: filePath, 
            destinationPath: destinationPath, 
            success: true,
            skipped: true,
            reason: 'File already exists with numbered suffix'
          });
          continue;
        }
        
        // Check if file already exists with numbered suffix (e.g., "song (1).mp3")
        let finalDestinationPath = destinationPath;
        let finalCounter = 1;
        
        while (await fs.access(finalDestinationPath).then(() => true).catch(() => false)) {
          const finalNameWithoutExt = path.parse(fileName).name;
          const finalExt = path.parse(fileName).ext;
          finalDestinationPath = path.join(destinationFolder, `${finalNameWithoutExt} (${finalCounter})${finalExt}`);
          finalCounter++;
        }
        
        // Copy the file
        await fs.copyFile(filePath, finalDestinationPath);
        results.push({ 
          originalPath: filePath, 
          destinationPath: finalDestinationPath, 
          success: true,
          skipped: false
        });
      } catch (error) {
        results.push({ 
          originalPath: filePath, 
          success: false, 
          error: error.message,
          skipped: false
        });
      }
    }
    
    return { success: true, results };
  } catch (error) {
    return { success: false, error: error.message };
  }
});
