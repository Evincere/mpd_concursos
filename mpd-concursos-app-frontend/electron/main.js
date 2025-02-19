const { app, BrowserWindow, session, protocol } = require('electron');
const path = require('path');
const fs = require('fs');

let win;

function getAssetPath() {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'app/dist/browser');
  }
  return path.join(__dirname, '../dist/browser');
}

function createWindow() {
  win = new BrowserWindow({
    width: 1000,
    height: 650,
    title: "MPD Concursos",
    icon: path.join(__dirname, '../build/icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
      sandbox: false,
      preload: path.join(__dirname, 'preload.js')
    },
  });

  // Configurar Content Security Policy
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self'; " +
          "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
          "img-src 'self' data: https:; " +
          "connect-src 'self' http://localhost:8080 ws://localhost:8080; " +
          "font-src 'self' https://fonts.gstatic.com;"
        ]
      }
    });
  });

  // Determinar la ruta del index.html
  const assetPath = getAssetPath();
  const indexPath = path.join(assetPath, 'index.html');

  console.log('Asset Path:', assetPath);
  console.log('Index Path:', indexPath);
  console.log('Is Packaged:', app.isPackaged);
  console.log('Resource Path:', process.resourcesPath);
  console.log('Current directory:', process.cwd());
  console.log('App Path:', app.getAppPath());

  if (!fs.existsSync(indexPath)) {
    console.error('Index file NOT found at:', indexPath);
    app.quit();
    return;
  }

  console.log('Found index.html at:', indexPath);

  // Cargar el index.html
  win.loadFile(indexPath)
    .then(() => {
      console.log('Successfully loaded index.html');
      // Solo abrir DevTools en desarrollo
      if (!app.isPackaged) {
        win.webContents.openDevTools();
      }
    })
    .catch((error) => {
      console.error('Error loading index.html:', error);
      app.quit();
    });

  win.setMenu(null);

  win.on("closed", () => {
    win = null;
  });
}

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    if (win) {
      if (win.isMinimized()) win.restore();
      win.focus();
    }
  });

  app.whenReady().then(() => {
    // Registrar protocolo personalizado para servir archivos estáticos
    protocol.registerFileProtocol('app', (request, callback) => {
      const filePath = path.join(getAssetPath(), request.url.slice('app://'.length));
      callback(filePath);
    });

    // Permitir la carga de recursos locales
    session.defaultSession.webRequest.onBeforeRequest((details, callback) => {
      callback({ cancel: false });
    });

    createWindow();
  });

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
      app.quit();
    }
  });

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
}

// Configuraciones de seguridad adicionales
app.on('web-contents-created', (event, contents) => {
  contents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);
    // Permitir navegación local y al backend
    if (!parsedUrl.href.startsWith('file:') && parsedUrl.origin !== 'http://localhost:8080') {
      event.preventDefault();
    }
  });

  contents.setWindowOpenHandler(({ url }) => {
    return { action: 'deny' };
  });
});
