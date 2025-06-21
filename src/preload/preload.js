const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
  'api', {
    send: (channel, data) => {
      // whitelist channels
      let validChannels = ['toMain', 'playback-state-changed', 'set-always-on-top'];
      if (validChannels.includes(channel)) {
        ipcRenderer.send(channel, data);
      }
    },
    receive: (channel, func) => {
      let validChannels = ['fromMain', 'add-music-file', 'thumbnail-toolbar-click'];
      if (validChannels.includes(channel)) {
        // Deliberately strip event as it includes `sender` 
        ipcRenderer.on(channel, (event, ...args) => func(...args));
      }
    },
    // Add new methods for folder selection and music files
    selectFolder: () => ipcRenderer.invoke('select-folder'),
    getMusicFiles: (folderPath) => ipcRenderer.invoke('get-music-files', folderPath),
    getSubfolders: (folderPath) => ipcRenderer.invoke('get-subfolders', folderPath),
    setMiniPlayerSize: (isMini) => ipcRenderer.send('set-mini-player-size', isMini),
    deleteFile: (filePath) => ipcRenderer.invoke('delete-file', filePath),
    renameFile: (oldPath, newPath) => ipcRenderer.invoke('rename-file', { oldPath, newPath }),
    showItemInFolder: (filePath) => ipcRenderer.invoke('show-item-in-folder', filePath),
    copyFilesToFolder: (filePaths, destinationFolder) => ipcRenderer.invoke('copy-files-to-folder', { filePaths, destinationFolder })
  }
);
