const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const musicMetadata = require('music-metadata');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
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

// Handle getting music files
ipcMain.handle('get-music-files', async (event, paths) => {
    try {
        let musicFilesPaths = [];

        if (Array.isArray(paths)) {
            // If paths is an array, it's individual files
            musicFilesPaths = paths;
        } else if (typeof paths === 'string') {
            // If paths is a string, it's a folder path
            musicFilesPaths = await scanDirectoryRecursively(paths);
        }

        const tracks = await Promise.all(musicFilesPaths.map(async (filePath) => {
            try {
                const metadata = await musicMetadata.parseFile(filePath);
                return {
                    name: metadata.common.title || path.parse(filePath).name,
                    artist: metadata.common.artist || 'Unknown Artist',
                    duration: metadata.format.duration,
                    path: filePath
                };
            } catch (error) {
                console.error(`Error reading metadata for ${filePath}:`, error);
                return {
                    name: path.parse(filePath).name,
                    artist: 'Unknown Artist',
                    duration: 0,
                    path: filePath
                };
            }
        }));

        return tracks;
    } catch (error) {
        console.error('Error reading music files:', error);
        return [];
    }
});

// Function to recursively scan directory for music files
async function scanDirectoryRecursively(dirPath) {
    const musicFiles = [];
    const validExtensions = ['.mp3', '.wav', '.ogg', '.m4a'];

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
      mainWindow.setSize(370, 120);
      mainWindow.setResizable(false);
    } else {
      mainWindow.setSize(1200, 800);
      mainWindow.setResizable(true);
    }
  }
});
