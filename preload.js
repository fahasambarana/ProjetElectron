const { contextBridge, ipcRenderer } = require('electron');

// Expose une API sécurisée vers le renderer
contextBridge.exposeInMainWorld('electronAPI', {
  sendMessage: (channel, data) => {
    // Autorise uniquement les canaux spécifiques
    const validChannels = ['toMain'];
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    }
  },
  onReceive: (channel, func) => {
    const validChannels = ['fromMain'];
    if (validChannels.includes(channel)) {
      // Lien d'événement sur un canal spécifique
      ipcRenderer.on(channel, (event, ...args) => func(...args));
    }
  }
});
