const { app, BrowserWindow, Menu, dialog, screen, session, systemPreferences } = require('electron');
const { fork } = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs');
const net = require('node:net');
const http = require('node:http');

// Keep existing local work accessible after the product rename.
const storageRoot = app.getPath('appData');
const newProfile = path.join(storageRoot, 'Shepherd Pro');
const previousProfile = ['Gather', 'gather-desktop'].map(name => path.join(storageRoot, name))
  .find(directory => fs.existsSync(path.join(directory, 'data')));
app.setName('Shepherd Pro');
app.setPath('userData', !fs.existsSync(path.join(newProfile, 'data')) && previousProfile ? previousProfile : newProfile);

let backend;
let operator;
let origin;
let stopping = false;
const outputWindows = new Map();

function isLocal(url) {
  try { return new URL(url).origin === origin; } catch { return false; }
}

function outputRoute(url) {
  if (!isLocal(url)) return null;
  const parsed = new URL(url);
  if (parsed.pathname === '/stage') return '/stage';
  if (parsed.pathname !== '/output') return null;
  const channel = parsed.searchParams.get('channel') || 'main';
  if (!/^[a-zA-Z0-9_-]{1,40}$/.test(channel)) return null;
  return `/output?channel=${encodeURIComponent(channel)}`;
}

function secureWindow(window) {
  window.webContents.on('will-navigate', (event, url) => {
    if (!isLocal(url)) event.preventDefault();
  });
  window.webContents.setWindowOpenHandler(({ url }) => {
    const route = outputRoute(url);
    if (route) openOutput(route);
    return { action: 'deny' };
  });
  window.webContents.on('will-attach-webview', event => event.preventDefault());
}

function openOutput(route, displayId) {
  let window = outputWindows.get(route);
  const display = screen.getAllDisplays().find(item => item.id === displayId);
  if (window && !window.isDestroyed()) {
    if (display) {
      window.setFullScreen(false);
      window.setBounds(display.bounds);
      window.setFullScreen(true);
    }
    window.show();
    window.focus();
    return;
  }
  window = new BrowserWindow({
    title: route === '/stage' ? 'Shepherd Pro · Stage' : 'Shepherd Pro · Output',
    width: 1280, height: 720, backgroundColor: '#080b14',
    ...(display ? display.bounds : {}),
    webPreferences: { sandbox: true, contextIsolation: true, nodeIntegration: false },
  });
  outputWindows.set(route, window);
  secureWindow(window);
  window.setMenuBarVisibility(false);
  window.on('closed', () => outputWindows.delete(route));
  window.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'Escape' && window.isFullScreen()) {
      event.preventDefault();
      window.setFullScreen(false);
    }
  });
  window.loadURL(`${origin}${route}`);
  if (display) window.once('ready-to-show', () => window.setFullScreen(true));
}

function installMenu() {
  const destinations = [
    ['Main', '/output?channel=main'],
    ['Output 2', '/output?channel=channel-2'],
    ['Output 3', '/output?channel=channel-3'],
    ['Output 4', '/output?channel=channel-4'],
    ['Stage', '/stage'],
  ];
  const outputs = destinations.map(([label, route]) => ({
    label,
    submenu: [
      { label: 'Open in window', click: () => openOutput(route) },
      { type: 'separator' },
      ...screen.getAllDisplays().map((display, index) => ({
        label: `${display.label || `Display ${index + 1}`} · ${display.size.width} × ${display.size.height}`,
        click: () => openOutput(route, display.id),
      })),
    ],
  }));
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    ...(process.platform === 'darwin' ? [{ role: 'appMenu' }] : []),
    { label: 'File', submenu: [{ role: process.platform === 'darwin' ? 'close' : 'quit' }] },
    { role: 'editMenu' },
    { label: 'View', submenu: [{ role: 'reload' }, { role: 'togglefullscreen' }, { role: 'resetZoom' }, { role: 'zoomIn' }, { role: 'zoomOut' }] },
    { label: 'Outputs', submenu: outputs },
    { role: 'windowMenu' },
  ]));
}

async function availablePort() {
  return new Promise((resolve, reject) => {
    const probe = net.createServer();
    probe.once('error', reject);
    probe.listen(0, '127.0.0.1', () => {
      const port = probe.address().port;
      probe.close(error => error ? reject(error) : resolve(port));
    });
  });
}

async function waitForServer(url, processHandle) {
  const deadline = Date.now() + 30000;
  while (Date.now() < deadline) {
    if (processHandle.exitCode !== null || processHandle.signalCode !== null) {
      throw new Error('The local application server stopped before it became ready.');
    }
    const ready = await new Promise(resolve => {
      const request = http.get(url, response => {
        response.resume();
        resolve(response.statusCode >= 200 && response.statusCode < 400);
      });
      request.setTimeout(1000, () => request.destroy());
      request.on('error', () => resolve(false));
    });
    if (ready) return;
    await new Promise(resolve => setTimeout(resolve, 150));
  }
  throw new Error('The local application server did not start within 30 seconds.');
}

async function start() {
  const root = app.isPackaged ? process.resourcesPath : path.resolve(__dirname, '..');
  if (!fs.existsSync(path.join(root, 'dist', 'index.html'))) {
    throw new Error('The web application has not been built. Run npm run build before starting the desktop app.');
  }
  const port = await availablePort();
  origin = `http://127.0.0.1:${port}`;
  const dataDir = path.join(app.getPath('userData'), 'data');
  fs.mkdirSync(dataDir, { recursive: true });
  backend = fork(path.join(root, 'server', 'index.js'), [], {
    cwd: root,
    env: { ...process.env, ELECTRON_RUN_AS_NODE: '1', NODE_ENV: 'production', HOST: '127.0.0.1', PORT: String(port), DATA_DIR: dataDir },
    stdio: ['ignore', 'pipe', 'pipe', 'ipc'],
  });
  // Drain server output without writing request contents or configuration to disk.
  backend.stdout.resume();
  backend.stderr.resume();
  backend.on('error', error => {
    if (!stopping) {
      dialog.showErrorBox('Shepherd Pro could not start its server', error.message);
      app.quit();
    }
  });
  backend.on('exit', () => {
    if (!stopping && operator) {
      dialog.showErrorBox('Shepherd Pro server stopped', 'Close and reopen Shepherd Pro to restart its local server.');
      app.quit();
    }
  });
  await waitForServer(`${origin}/api/health`, backend);
  session.defaultSession.setPermissionCheckHandler((contents, permission, requestingOrigin, details) =>
    permission === 'media' && isLocal(requestingOrigin) && isLocal(contents.getURL()) && details.mediaType !== 'video');
  session.defaultSession.setPermissionRequestHandler(async (contents, permission, callback, details) => {
    if (permission !== 'media' || !isLocal(contents.getURL()) || details.mediaTypes?.includes('video')) {
      callback(false);
      return;
    }
    try {
      callback(process.platform !== 'darwin' || await systemPreferences.askForMediaAccess('microphone'));
    } catch { callback(false); }
  });
  operator = new BrowserWindow({
    title: 'Shepherd Pro', width: 1480, height: 940, minWidth: 960, minHeight: 650,
    backgroundColor: '#080b14',
    webPreferences: { sandbox: true, contextIsolation: true, nodeIntegration: false },
  });
  secureWindow(operator);
  operator.on('closed', () => { operator = null; app.quit(); });
  await operator.loadURL(origin);
  installMenu();
  screen.on('display-added', installMenu);
  screen.on('display-removed', installMenu);
  screen.on('display-metrics-changed', installMenu);
}

function stopBackend() {
  stopping = true;
  if (!backend || backend.exitCode !== null || backend.signalCode !== null) return;
  backend.kill('SIGTERM');
  const force = setTimeout(() => {
    if (backend && backend.exitCode === null && backend.signalCode === null) backend.kill('SIGKILL');
  }, 2500);
  force.unref();
}

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (!operator) return;
    if (operator.isMinimized()) operator.restore();
    operator.show();
    operator.focus();
  });
  app.on('before-quit', stopBackend);
  app.on('window-all-closed', () => app.quit());
  app.whenReady().then(start).catch(error => {
    dialog.showErrorBox('Shepherd Pro could not start', error.message);
    app.quit();
  });
}
