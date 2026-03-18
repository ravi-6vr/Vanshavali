const { app, BrowserWindow, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

let mainWindow;
let serverProcess;

// Use production mode if dist/ folder exists (i.e., vite build was run)
const distExists = fs.existsSync(path.join(__dirname, '..', 'dist', 'index.html'));
const isDev = !distExists;
const SERVER_PORT = 3001;
const VITE_PORT = 5173;

function startServer() {
  const serverPath = path.join(__dirname, '..', 'server.js');
  serverProcess = spawn('node', [serverPath], {
    cwd: path.join(__dirname, '..'),
    stdio: 'pipe',
  });

  serverProcess.stdout.on('data', (data) => {
    console.log(`[Server] ${data.toString().trim()}`);
  });

  serverProcess.stderr.on('data', (data) => {
    console.error(`[Server Error] ${data.toString().trim()}`);
  });
}

async function waitForServer(url, maxRetries = 30) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const http = require('http');
      await new Promise((resolve, reject) => {
        const req = http.get(url, (res) => {
          resolve(res);
        });
        req.on('error', reject);
        req.setTimeout(1000, () => { req.destroy(); reject(new Error('timeout')); });
      });
      return true;
    } catch {
      await new Promise(r => setTimeout(r, 500));
    }
  }
  return false;
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: 'వంశావళి — Vanshavali | కుటుంబ వృక్షం',
    icon: path.join(__dirname, '..', 'public', 'icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    autoHideMenuBar: true,
    backgroundColor: '#fafaf9', // stone-50
  });

  // Open external links in the default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  if (isDev) {
    // In dev, load from Vite dev server
    await waitForServer(`http://localhost:${VITE_PORT}`);
    mainWindow.loadURL(`http://localhost:${VITE_PORT}`);
  } else {
    // In production, load built files through the Express server
    await waitForServer(`http://localhost:${SERVER_PORT}`);
    mainWindow.loadURL(`http://localhost:${SERVER_PORT}`);
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  startServer();
  await waitForServer(`http://localhost:${SERVER_PORT}`);
  await createWindow();
});

app.on('window-all-closed', () => {
  if (serverProcess) {
    serverProcess.kill();
  }
  app.quit();
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

app.on('before-quit', () => {
  if (serverProcess) {
    serverProcess.kill();
  }
});
