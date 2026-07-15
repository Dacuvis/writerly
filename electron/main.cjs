const { app, BrowserWindow, Menu } = require("electron");
const { spawn } = require("node:child_process");
const http = require("node:http");
const path = require("node:path");

const isDevelopment = Boolean(process.env.ELECTRON_START_URL);
const BACKEND_PORT = 3001;
const BACKEND_HOST = "127.0.0.1";
const APP_URL = `http://${BACKEND_HOST}:${BACKEND_PORT}/`;

let backendProcess = null;

function getDistPath() {
  return app.isPackaged
    ? path.join(process.resourcesPath, "dist")
    : path.join(__dirname, "..", "dist");
}

function getBackendPaths() {
  const backendDir = app.isPackaged
    ? path.join(process.resourcesPath, "backend")
    : path.join(__dirname, "..", "backend");

  return {
    backendDir,
    executable: path.join(backendDir, "writerly-api.exe"),
    schema: path.join(backendDir, "schema.sql"),
  };
}

function waitForBackend(maxAttempts = 50) {
  return new Promise((resolve, reject) => {
    let attempts = 0;

    const check = () => {
      const request = http.get(
        `http://${BACKEND_HOST}:${BACKEND_PORT}/health`,
        (response) => {
          response.resume();
          if (response.statusCode === 200) resolve();
          else retry();
        },
      );
      request.on("error", retry);
      request.setTimeout(1000, () => {
        request.destroy();
        retry();
      });
    };

    const retry = () => {
      attempts += 1;
      if (attempts >= maxAttempts) {
        reject(new Error("Backend failed to start"));
        return;
      }
      setTimeout(check, 200);
    };

    check();
  });
}

async function startBackend() {
  const { backendDir, executable, schema } = getBackendPaths();

  backendProcess = spawn(executable, [], {
    cwd: backendDir,
    env: {
      ...process.env,
      WRITERLY_DATA_DIR: app.getPath("userData"),
      WRITERLY_SCHEMA_PATH: schema,
      WRITERLY_STATIC_DIR: getDistPath(),
    },
    stdio: "ignore",
    windowsHide: true,
  });

  backendProcess.on("error", (error) => {
    console.error("Failed to start backend:", error);
  });

  await waitForBackend();
}

function stopBackend() {
  if (!backendProcess || backendProcess.killed) return;
  backendProcess.kill();
  backendProcess = null;
}

function createWindow() {
  const window = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1080,
    minHeight: 720,
    backgroundColor: "#f8f7f4",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (isDevelopment) {
    window.loadURL(process.env.ELECTRON_START_URL);
    window.webContents.openDevTools({ mode: "detach" });
  } else {
    window.loadURL(APP_URL);
    window.webContents.on("did-fail-load", (_event, code, description) => {
      console.error("Failed to load app:", code, description);
    });
  }
}

app.whenReady().then(async () => {
  Menu.setApplicationMenu(null);

  if (!isDevelopment) {
    try {
      await startBackend();
    } catch (error) {
      console.error(error);
    }
  }

  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("before-quit", stopBackend);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
