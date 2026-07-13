const { app, BrowserWindow } = require("electron");
const path = require("node:path");

const isDevelopment = Boolean(process.env.ELECTRON_START_URL);

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
    window.loadFile(path.join(__dirname, "..", "dist", "index.html"));
  }
}

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
