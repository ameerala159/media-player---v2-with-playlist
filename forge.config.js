module.exports = {
  packagerConfig: {
    asar: true,
    icon: 'src/renderer/assets/icon.ico',
  },
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        icon: 'src/renderer/assets/icon.ico',
        setupIcon: 'src/renderer/assets/icon.ico',
      },
    },
  ],
}; 