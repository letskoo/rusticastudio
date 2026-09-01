const DEFAULT_SETTINGS = {
    sessionMinutes: 20,
    captureSeconds: 10,
    deleteMinutes: 60,
    albumEnabled: false,
    albumTimeoutMinutes: 5,
    restartDelayMinutes: 3,
    selectedCameraId: "",
    autoLaunch: false,
    savePath: ""
};

let appSettings = {
    ...DEFAULT_SETTINGS
};

export async function loadSettings() {
    const savedSettings =
        await window.electronAPI.getSettings();

    appSettings = {
        ...DEFAULT_SETTINGS,
        ...(savedSettings || {})
    };

    return getSettings();
}

export async function saveSettings(settings) {
    const nextSettings = {
        ...appSettings,
        ...settings
    };

    const savedSettings =
        await window.electronAPI.saveSettings(
            nextSettings
        );

    appSettings = {
        ...DEFAULT_SETTINGS,
        ...(savedSettings || nextSettings)
    };

    return getSettings();
}

export async function selectSavePath() {
    const selectedPath =
        await window.electronAPI.selectSavePath();

    if (!selectedPath) {
        return null;
    }

    appSettings = {
        ...appSettings,
        savePath: selectedPath
    };

    return selectedPath;
}

export function getSettings() {
    return {
        ...appSettings
    };
}

export function getSetting(key) {
    return appSettings[key];
}

export function resetSettingsState() {
    appSettings = {
        ...DEFAULT_SETTINGS
    };
}