let deps;

let appSettings = {
    sessionMinutes: 20,
    captureSeconds: 10,
    deleteMinutes: 60,
    albumEnabled: false,
    albumTimeoutMinutes: 5,
    restartDelayMinutes: 3,

    captureMode: "webcam",

    selectedCameraId: "",
    autoLaunch: false,
    savePath: "",
    storeName: "Rustica"
};

export function initSettingsManager(
    dependencies
) {

    deps = dependencies;

    deps.storeNameInput.addEventListener(
        "input",
        () => {

            const input =
                deps.storeNameInput;

            const filtered =
                input.value.replace(
                    /[^A-Za-z0-9가-힣]/g,
                    ""
                );

            if (input.value !== filtered) {
                input.value = filtered;
            }
        }
    );
}

export async function loadSettings() {

    appSettings =
        await window.electronAPI
            .getSettings();

    appSettings.captureMode =
        appSettings.captureMode ||
        "webcam";

    deps.captureModeSelect.value =
        appSettings.captureMode;

    deps.sessionMinInput.value =
        appSettings.sessionMinutes;

    deps.captureSecInput.value =
        appSettings.captureSeconds;

    deps.deleteMinInput.value =
        appSettings.deleteMinutes;

    deps.albumEnabledInput.checked =
        appSettings.albumEnabled === true;

    deps.albumTimeoutMinInput.value =
        appSettings.albumTimeoutMinutes || 5;

    deps.restartDelayMinInput.value =
        appSettings.restartDelayMinutes || 3;

    deps.autoLaunchInput.checked =
        appSettings.autoLaunch || false;

    deps.currentSavePath.innerText =
        appSettings.savePath ||
        "기본 Downloads";

    deps.storeNameInput.value =
        appSettings.storeName ||
        "Rustica";

    return appSettings;
}

export async function saveSettings() {

    const storeName =
        deps.storeNameInput.value === ""
            ? "Rustica"
            : deps.storeNameInput.value;

    if (!/^[A-Za-z0-9가-힣]+$/.test(storeName)) {
        alert("매장명은 영문, 한글, 숫자만 입력 가능합니다.");
        deps.storeNameInput.focus();
        return;
    }

    const settings = {

        captureMode:
            deps.captureModeSelect.value ||
            "webcam",

        sessionMinutes:
            Number(
                deps.sessionMinInput.value
            ) || 20,

        captureSeconds:
            Number(
                deps.captureSecInput.value
            ) || 10,

        deleteMinutes:
            Number(
                deps.deleteMinInput.value
            ) || 60,

        albumEnabled:
            deps.albumEnabledInput.checked,

        albumTimeoutMinutes:
            Number(
                deps.albumTimeoutMinInput.value
            ) || 5,

        restartDelayMinutes:
            Number(
                deps.restartDelayMinInput.value
            ) || 3,

        selectedCameraId:
            deps.cameraSelect.value || "",

        autoLaunch:
            deps.autoLaunchInput.checked,

        savePath:
            appSettings.savePath || "",

        storeName:
            storeName
    };

    appSettings =
        await window.electronAPI
            .saveSettings(settings);

    deps.adminModal.classList.remove(
        "active"
    );

    await loadSettings();

    return appSettings;
}

export async function selectSavePath() {

    const selectedPath =
        await window.electronAPI
            .selectSavePath();

    if (!selectedPath) {
        return;
    }

    appSettings.savePath =
        selectedPath;

    deps.currentSavePath.innerText =
        selectedPath;
}

export function getAppSettings() {

    return appSettings;
}