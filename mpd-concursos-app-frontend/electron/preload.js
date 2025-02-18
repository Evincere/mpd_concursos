const { contextBridge, ipcRenderer } = require('electron');

// Exponer APIs seguras al renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // Aquí puedes agregar métodos seguros para la comunicación entre procesos
  // Por ejemplo:
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  // Agrega más métodos según necesites
});

// Sanitización de datos
contextBridge.exposeInMainWorld('secureAPI', {
  validateInput: (input) => {
    // Implementa validaciones de seguridad según necesites
    return typeof input === 'string' ? input.replace(/[^\w\s]/gi, '') : '';
  }
});
