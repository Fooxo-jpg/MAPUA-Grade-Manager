const { app, BrowserWindow, dialog } = require('electron');
const path = require('node:path');
const { autoUpdater } = require('electron-updater');

const isDev = !app.isPackaged;

autoUpdater.autoDownload = true; // fetch it in the background...
autoUpdater.autoInstallOnAppQuit = false; // ...but never install without asking

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 720,
    minHeight: 560,
    backgroundColor: '#F5F3EA',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (isDev) {
    // In development, load the Vite dev server (npm run electron:dev)
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    // In production, load the built static files
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }
}

// ---- Auto-update (checks GitHub Releases via the "publish" config in
// package.json). The update downloads quietly in the background; the user
// is only interrupted once it's ready, to confirm before restarting. ----
function setupAutoUpdater() {
  if (isDev) return; // electron-updater needs a packaged app to have anything to compare against

  autoUpdater.on('update-downloaded', async (info) => {
    const { response } = await dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Update ready',
      message: `Gradebook ${info.version} has been downloaded.`,
      detail: 'Restart now to install it, or keep working and it will install next time you quit.',
      buttons: ['Restart Now', 'Later'],
      defaultId: 0,
      cancelId: 1,
    });
    if (response === 0) {
      autoUpdater.quitAndInstall();
    }
  });

  autoUpdater.on('error', (err) => {
    console.error('[auto-updater]', err == null ? 'unknown error' : (err.stack || err).toString());
  });

  autoUpdater.checkForUpdates();
  // Also check periodically in case the app is left open for a long time.
  setInterval(() => autoUpdater.checkForUpdates(), 4 * 60 * 60 * 1000); // every 4 hours
}

app.whenReady().then(() => {
  createWindow();
  setupAutoUpdater();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
