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

    getSessionImages: (
      sessionPath
    ) =>
      ipcRenderer.invoke(
        "get-session-images",
        sessionPath
      ),

    copySelectedImages: (
      data
    ) =>
      ipcRenderer.invoke(
        "copy-selected-images",
        data
      ),

    completeSession: (
      sessionPath
    ) =>
      ipcRenderer.invoke(
        "complete-session",
        sessionPath
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
      ),

    onCaptureCompleted: (
      callback
    ) =>
      ipcRenderer.on(
        "capture-completed",
        (
          event,
          imagePath
        ) => {

          callback(
            imagePath
          );
        }
      )
  }
);