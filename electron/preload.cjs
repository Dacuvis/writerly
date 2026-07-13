const { contextBridge } = require("electron");

// Keep the renderer isolated from Node.js. Add narrowly scoped desktop APIs here.
contextBridge.exposeInMainWorld("writerly", {});
