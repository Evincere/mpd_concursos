const { app, BrowserWindow } = require("electron");
const path = require("path");

let win;

function createWindow() {
  win = new BrowserWindow({
    width: 1000,
    height: 650,
    title: "MPD Concursos",
    icon: path.join(__dirname, '../public/icons/favicon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, "preload.js"),
    },
  });
  win.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': ["default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self' http://localhost:8080; font-src 'self' https://fonts.gstatic.com;"]
      }
    });
});

  

  win.loadURL(`file://${path.join(__dirname, '../dist/browser/index.html')}`); 

  // win.setMenu(null);

  // win.webContents.openDevTools();

  win.on("closed", () => {
    win = null;
  });
}

app.whenReady().then(createWindow);

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

// Desactivar restricciones CORS (Solo para desarrollo)
app.commandLine.appendSwitch('disable-features', 'OutOfBlinkCors');
