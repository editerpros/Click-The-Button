const { app, BrowserWindow, dialog, ipcMain } = require("electron");
const { autoUpdater } = require("electron-updater");

let win;

function createWindow(){
  win = new BrowserWindow({
    width: 900,
    height: 600,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  win.loadFile("index.html");

  win.once("ready-to-show", () => {
    autoUpdater.checkForUpdates();
  });
}

app.whenReady().then(createWindow);

/* =====================
   AUTO UPDATE EVENTS
===================== */

// Update available
autoUpdater.on("update-available", () => {
  win.webContents.send("update-status", {
    status: "available",
    message: "Update found. Downloading…"
  });
});

// Download progress
autoUpdater.on("download-progress", progress => {
  win.webContents.send("update-progress", {
    percent: Math.round(progress.percent),
    transferred: progress.transferred,
    total: progress.total
  });
});

// Update downloaded
autoUpdater.on("update-downloaded", () => {
  dialog.showMessageBox(win, {
    type: "question",
    buttons: ["Restart Now", "Later"],
    defaultId: 0,
    message: "Update downloaded. Restart to apply?"
  }).then(result => {
    if(result.response === 0){
      autoUpdater.quitAndInstall();
    }
  });
});

// Errors
autoUpdater.on("error", err => {
  win.webContents.send("update-status", {
    status: "error",
    message: "Update error: " + err.message
  });
});
