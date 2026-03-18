// Waits for Vite dev server to be ready, then launches Electron
const http = require('http');
const { spawn } = require('child_process');

const VITE_PORT = 5173;
const MAX_RETRIES = 60;

async function waitForVite() {
  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      await new Promise((resolve, reject) => {
        const req = http.get(`http://localhost:${VITE_PORT}`, (res) => resolve(res));
        req.on('error', reject);
        req.setTimeout(1000, () => { req.destroy(); reject(new Error('timeout')); });
      });
      console.log('[Electron] Vite is ready, launching...');
      return true;
    } catch {
      if (i % 5 === 0) console.log('[Electron] Waiting for Vite...');
      await new Promise(r => setTimeout(r, 1000));
    }
  }
  console.error('[Electron] Vite did not start in time');
  return false;
}

async function main() {
  const ready = await waitForVite();
  if (!ready) process.exit(1);

  const electron = spawn('npx', ['electron', '.'], {
    cwd: require('path').join(__dirname, '..'),
    stdio: 'inherit',
    shell: true,
  });

  electron.on('close', (code) => {
    process.exit(code);
  });
}

main();
