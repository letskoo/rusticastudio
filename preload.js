const {
  contextBridge,
  ipcRenderer
} = require("electron");

contextBridge.exposeInMainWorld(
  "electronAPI",
  {

    createSessionFolder: () =>
      ipcRenderer.invoke(
        "create-session-folder"
      ),

    savePhoto: (data) =>
      ipcRenderer.invoke(
        "save-photo",
        data
      ),

    getSettings: () =>
      ipcRenderer.invoke(
        "get-settings"
      ),

    saveSettings: (settings) =>
      ipcRenderer.invoke(
        "save-settings",
        settings
      ),

    selectSavePath: () =>
      ipcRenderer.invoke(
        "select-save-path"
      ),

    onGlobalCapture: (callback) =>
      ipcRenderer.on(
        "global-trigger-capture",
        callback
      )
      ,

captureDSLR: () =>
    ipcRenderer.invoke(
        "capture-dslr"
    )
  }
);