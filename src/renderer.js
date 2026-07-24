import {
    startPage,
    adPage,
    cameraPage,
    startBtn,
    camera,
    sessionTimerText,
    lastPhotoPreview,
    reconnectMessage,
    adminHiddenBtn,
    adminModal,
    closeAdminBtn,
    saveAdminBtn,
    sessionMinInput,
    captureSecInput,
    deleteMinInput,
    autoLaunchInput,
    cameraSelect,
    selectPathBtn,
    currentSavePath,
    endSessionBtn,
    endConfirmModal,
    confirmEndBtn,
    cancelEndBtn
} from "./modules/ui/dom.js";

import {
    initCameraManager,
    loadCameraList,
    startCamera,
    stopReconnectLoop,
    handleCameraDisconnect,
    getCurrentStream,
    getIsReconnecting,
    getIsCapturingBlocked
} from "./modules/camera/cameraManager.js";

import {
    initCaptureManager,
    triggerCapture
} from "./modules/capture/captureManager.js";

import {
    initTimerManager,
    startSessionTimer,
    stopSessionTimer
} from "./modules/timer/timerManager.js";

import {
    initSettingsManager,
    loadSettings,
    saveSettings,
    selectSavePath,
    getAppSettings
} from "./modules/settings/settingsManager.js";

let startButtonLockUntil = 0;

initCaptureManager({

    camera,

    lastPhotoPreview,

    cameraSelect,

    getIsCapturingBlocked

});

initTimerManager({

    sessionTimerText,

    getAppSettings,

    triggerCapture,

    resetToStart

});

initSettingsManager({

    sessionMinInput,

    captureSecInput,

    deleteMinInput,

    autoLaunchInput,

    cameraSelect,

    currentSavePath,

    adminModal

});

initCameraManager({

    camera,

    cameraSelect,

    reconnectMessage,

    getAppSettings

});

window.addEventListener(
    "DOMContentLoaded",
    async () => {

        try {

            /*
                먼저 권한 확보
            */
            const tempStream =
                await navigator
                    .mediaDevices
                    .getUserMedia({
                        video: true,
                        audio: false
                    });

            tempStream
                .getTracks()
                .forEach(track =>
                    track.stop()
                );

        } catch (error) {

            console.log(
                "카메라 권한 오류",
                error
            );
        }

        await loadSettings();

        let cameraReady = false;

        for (
            let i = 0;
            i < 30;
            i++
        ) {

            await loadCameraList();

            const hasSavedCamera =
                Array.from(
                    cameraSelect.options
                ).some(
                    option =>
                        option.value ===
                        getAppSettings().selectedCameraId
                );

            if (hasSavedCamera) {

                cameraSelect.value =
                    getAppSettings().selectedCameraId;

                cameraReady = true;

                break;
            }

            await new Promise(resolve =>
                setTimeout(resolve, 500)
            );
        }

        if (!cameraReady) {

            console.log(
                "저장된 카메라 못찾음"
            );
        }

        await startCamera();
    }
);

startBtn.addEventListener(
    "click",
    async () => {

        /*
            시작 버튼 잠금
        */
        if (
            Date.now() <
            startButtonLockUntil
        ) {

            startBtn.classList.add(
                "disabled"
            );

            return;
        }

        startBtn.classList.remove(
            "disabled"
        );

        startPage.classList.remove(
            "active"
        );

        adPage.classList.add(
            "active"
        );

        setTimeout(async () => {

            adPage.classList.remove(
                "active"
            );

            cameraPage.classList.add(
                "active"
            );

            await window.electronAPI.createSessionFolder();

            await startCamera();

            startSessionTimer();

        }, 3000);
    }
);

function resetToStart() {

    stopSessionTimer();

    stopReconnectLoop();

    const currentStream =
        getCurrentStream();

    if (currentStream) {

        currentStream
            .getTracks()
            .forEach(track =>
                track.stop()
            );
    }

    camera.srcObject = null;

    cameraPage.classList.remove(
        "active"
    );

    startPage.classList.add(
        "active"
    );
}

document.addEventListener(
    "keydown",
    (e) => {

        if (
            e.code === "Space" ||
            e.code === "Enter" ||
            e.code === "NumpadEnter"
        ) {

            triggerCapture();
        }
    }
);

window.electronAPI
    .onGlobalCapture(() => {

        triggerCapture();
    });

let adminPressTimer = null;

function startAdminPress() {

    clearTimeout(
        adminPressTimer
    );

    adminPressTimer =
        setTimeout(() => {

            adminModal.classList.add(
                "active"
            );

            loadCameraList();

        }, 5000);
}

function cancelAdminPress() {

    clearTimeout(
        adminPressTimer
    );
}

adminHiddenBtn.addEventListener(
    "mousedown",
    startAdminPress
);

adminHiddenBtn.addEventListener(
    "touchstart",
    startAdminPress
);

adminHiddenBtn.addEventListener(
    "mouseup",
    cancelAdminPress
);

adminHiddenBtn.addEventListener(
    "mouseleave",
    cancelAdminPress
);

adminHiddenBtn.addEventListener(
    "touchend",
    cancelAdminPress
);

saveAdminBtn.addEventListener(
    "click",
    saveSettings
);

closeAdminBtn.addEventListener(
    "click",
    () => {

        adminModal.classList.remove(
            "active"
        );
    }
);

selectPathBtn.addEventListener(
    "click",
    selectSavePath
);

if (navigator.mediaDevices) {

    navigator.mediaDevices
        .addEventListener(
            "devicechange",
            async () => {

                try {

                    await loadCameraList();

                    const devices =
                        await navigator
                            .mediaDevices
                            .enumerateDevices();

                    const hasCamera =
                        devices.some(
                            device =>
                                device.kind ===
                                "videoinput"
                        );

                    if (!hasCamera) {

                        handleCameraDisconnect();

                        return;
                    }

                    if (
                        getIsReconnecting()
                    ) {

                        await startCamera();
                    }

                } catch (error) {

                    console.log(
                        "devicechange 오류"
                    );
                }
            }
        );
}

endSessionBtn.addEventListener(
    "click",
    () => {

        endConfirmModal.classList.add(
            "show"
        );
    }
);

cancelEndBtn.addEventListener(
    "click",
    () => {

        endConfirmModal.classList.remove(
            "show"
        );
    }
);

confirmEndBtn.addEventListener(
    "click",
    () => {

        endConfirmModal.classList.remove(
            "show"
        );

        /*
            3분 잠금
        */
        startButtonLockUntil =
            Date.now() +
            (3 * 60 * 1000);

        startBtn.classList.add(
            "disabled"
        );

        setTimeout(() => {

            startBtn.classList.remove(
                "disabled"
            );

        }, 3 * 60 * 1000);

        resetToStart();
    }
);