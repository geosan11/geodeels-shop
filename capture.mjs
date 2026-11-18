import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const outDir = process.argv[2] || '/workspace/geodeels/shop/shots';
const prefix = process.argv[3] || 'pass1_';
fs.mkdirSync(outDir, { recursive: true });

console.log(`Starting screenshot capture (outDir: ${outDir}, prefix: ${prefix})...`);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const SERVER_PORT = 5188;

// Start Vite dev server in geodeels-shop
const viteBin = '/workspace/geodeels-shop/node_modules/vite/bin/vite.js';
const vite = spawn('node', [viteBin, '--port', String(SERVER_PORT), '--host', '127.0.0.1'], {
  cwd: '/workspace/geodeels-shop',
  stdio: 'ignore'
});

// Wait for Vite dev server
let serverReady = false;
for (let i = 0; i < 40; i++) {
  try {
    const res = await fetch(`http://127.0.0.1:${SERVER_PORT}/?demo=1`);
    if (res.ok) {
      serverReady = true;
      break;
    }
  } catch (e) {}
  await sleep(250);
}

if (!serverReady) {
  console.error(`Failed to start Vite dev server on port ${SERVER_PORT}`);
  vite.kill();
  process.exit(1);
}
console.log(`Vite dev server ready on http://127.0.0.1:${SERVER_PORT}`);

// Launch Chrome
const port = 9550 + Math.floor(Math.random() * 40);
const chrome = spawn(
  '/usr/bin/google-chrome',
  [
    '--headless=new',
    '--no-sandbox',
    '--disable-gpu',
    `--remote-debugging-port=${port}`,
    '--user-data-dir=/tmp/geodeels-chrome-' + Date.now(),
    'about:blank'
  ],
  { stdio: 'ignore' }
);

let tabs;
for (let i = 0; i < 60; i++) {
  try {
    tabs = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
    if (tabs.find((t) => t.type === 'page')) break;
  } catch {}
  await sleep(250);
}

const pageTab = tabs?.find((t) => t.type === 'page');
if (!pageTab) {
  console.error('No page tab found in Chrome');
  chrome.kill();
  vite.kill();
  process.exit(1);
}

const ws = new WebSocket(pageTab.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener('open', r));

let msgId = 0;
const pending = new Map();
ws.addEventListener('message', (e) => {
  const m = JSON.parse(e.data);
  if (pending.has(m.id)) {
    pending.get(m.id)(m);
    pending.delete(m.id);
  }
});

const send = (method, params = {}) =>
  new Promise((r) => {
    const id = ++msgId;
    pending.set(id, r);
    ws.send(JSON.stringify({ id, method, params }));
  });

await send('Page.enable');
await send('Runtime.enable');

async function captureShot(filename, { width, height, mobile, full = false, url }) {
  console.log(`Setting up ${filename} (${width}x${height}, mobile=${mobile})...`);
  await send('Emulation.setDeviceMetricsOverride', {
    width,
    height,
    deviceScaleFactor: 2, // crisp retina capture
    mobile
  });

  await send('Page.navigate', { url });
  await sleep(2000);

  // Wait until content is loaded
  await send('Runtime.evaluate', {
    expression: `(() => {
      if (window.__appState && window.__renderApp) {
        if (!window.__appState.isDemo) {
          window.__appState.isDemo = true;
          window.__renderApp();
        }
      }
    })()`,
    awaitPromise: true
  });
  await sleep(1000);

  let shot;
  if (full) {
    shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
  } else {
    shot = await send('Page.captureScreenshot', { format: 'png' });
  }

  const filePath = path.join(outDir, filename);
  fs.writeFileSync(filePath, Buffer.from(shot.result.data, 'base64'));
  console.log(`Saved screenshot: ${filePath}`);

  if (mobile) {
    const scrollCheck = await send('Runtime.evaluate', {
      expression: `(() => {
        const sw = document.documentElement.scrollWidth;
        const iw = window.innerWidth;
        const bodySw = document.body.scrollWidth;
        return JSON.stringify({
          scrollWidth: sw,
          innerWidth: iw,
          bodyScrollWidth: bodySw,
          fitsWithinViewport: sw <= iw
        });
      })()`,
      returnByValue: true
    });
    const checkResult = JSON.parse(scrollCheck.result.result.value);
    console.log(`Mobile viewport check for ${filename}:`, checkResult);
    if (!checkResult.fitsWithinViewport) {
      console.warn(`WARNING: Horizontal overflow detected in ${filename}: scrollWidth=${checkResult.scrollWidth} > innerWidth=${checkResult.innerWidth}`);
    }
  }
}

try {
  // 1. Mobile 390px (viewport)
  await captureShot(`${prefix}mobile_390px.png`, {
    width: 390,
    height: 844,
    mobile: true,
    full: false,
    url: `http://127.0.0.1:${SERVER_PORT}/?demo=1`
  });

  // 2. Mobile 390px (full page)
  await captureShot(`${prefix}mobile_390px_full.png`, {
    width: 390,
    height: 844,
    mobile: true,
    full: true,
    url: `http://127.0.0.1:${SERVER_PORT}/?demo=1`
  });

  // 3. Desktop 1280px (viewport)
  await captureShot(`${prefix}desktop_1280px.png`, {
    width: 1280,
    height: 800,
    mobile: false,
    full: false,
    url: `http://127.0.0.1:${SERVER_PORT}/?demo=1`
  });

  // 4. Desktop 1280px (full page)
  await captureShot(`${prefix}desktop_1280px_full.png`, {
    width: 1280,
    height: 800,
    mobile: false,
    full: true,
    url: `http://127.0.0.1:${SERVER_PORT}/?demo=1`
  });

  console.log(`Screenshots with prefix ${prefix} taken successfully!`);
} catch (err) {
  console.error('Screenshot capture failed:', err);
} finally {
  chrome.kill();
  vite.kill();
  console.log('Teardown complete.');
  process.exit(0);
}
