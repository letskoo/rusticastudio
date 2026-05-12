const startPage =
    document.getElementById(
        "start-page"
    );

const adPage =
    document.getElementById(
        "ad-page"
    );

const cameraPage =
    document.getElementById(
        "camera-page"
    );

const startBtn =
    document.getElementById(
        "start-btn"
    );

const camera =
    document.getElementById(
        "camera"
    );

const sessionTimerText =
    document.getElementById(
        "session-timer"
    );

const lastPhotoPreview =
    document.getElementById(
        "last-photo-preview"
    );

const reconnectMessage =
    document.getElementById(
        "camera-reconnect-message"
    );

const adminHiddenBtn =
    document.getElementById(
        "admin-hidden-btn"
    );

const adminModal =
    document.getElementById(
        "admin-modal"
    );

const closeAdminBtn =
    document.getElementById(
        "close-admin-btn"
    );

const saveAdminBtn =
    document.getElementById(
        "save-admin-btn"
    );

const sessionMinInput =
    document.getElementById(
        "session-min-input"
    );

const captureSecInput =
    document.getElementById(
        "capture-sec-input"
    );

const deleteMinInput =
    document.getElementById(
        "delete-min-input"
    );

const autoLaunchInput =
    document.getElementById(
        "auto-launch-input"
    );

const cameraSelect =
    document.getElementById(
        "camera-select"
    );

const selectPathBtn =
    document.getElementById(
        "select-path-btn"
    );

const currentSavePath =
    document.getElementById(
        "current-save-path"
    );

let sessionTime = 1200;
let captureTime = 10;

let sessionInterval;

let currentStream = null;

let reconnectInterval = null;

let isReconnecting = false;

let isCapturingBlocked = false;

let isCaptureProcessing = false;

let appSettings = {
    sessionMinutes: 20,
    captureSeconds: 10,
    deleteMinutes: 60,
    selectedCameraId: "",
    autoLaunch: false,
    savePath: ""
};

const countdownAudio =
    new Audio(
        "../assets/sounds/countdown.MP3"
    );

countdownAudio.volume = 1;

window.addEventListener(
    "DOMContentLoaded",
    async () => {

        await loadSettings();

        await loadCameraList();
    }
);

startBtn.addEventListener(
    "click",
    async () => {

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

            await window.electronAPI
                .createSessionFolder();

            await startCamera();

            startSessionTimer();

        }, 3000);
    }
);

async function loadSettings() {

    appSettings =
        await window.electronAPI
            .getSettings();

    sessionMinInput.value =
        appSettings.sessionMinutes;

    captureSecInput.value =
        appSettings.captureSeconds;

    deleteMinInput.value =
        appSettings.deleteMinutes;

    autoLaunchInput.checked =
        appSettings.autoLaunch || false;

    currentSavePath.innerText =
        appSettings.savePath ||
        "기본 Downloads";
}

async function saveSettings() {

    const settings = {
        sessionMinutes:
            Number(
                sessionMinInput.value
            ) || 20,

        captureSeconds:
            Number(
                captureSecInput.value
            ) || 10,

        deleteMinutes:
            Number(
                deleteMinInput.value
            ) || 60,

        selectedCameraId:
            cameraSelect.value || "",

        autoLaunch:
            autoLaunchInput.checked,

        savePath:
            appSettings.savePath || ""
    };

    appSettings =
        await window.electronAPI
            .saveSettings(settings);

    adminModal.classList.remove(
        "active"
    );

    await loadSettings();

    await startCamera();
}

async function loadCameraList() {

    const devices =
        await navigator
            .mediaDevices
            .enumerateDevices();

    const videoDevices =
        devices.filter(
            device =>
                device.kind ===
                "videoinput"
        );

    cameraSelect.innerHTML = "";

    videoDevices.forEach(
        (device, index) => {

            const option =
                document.createElement(
                    "option"
                );

            option.value =
                device.deviceId;

            option.textContent =
                device.label ||
                `카메라 ${index + 1}`;

            cameraSelect.appendChild(
                option
            );
        }
    );

    if (
        appSettings.selectedCameraId
    ) {

        cameraSelect.value =
            appSettings.selectedCameraId;
    }
}

async function startCamera() {

    try {

        reconnectMessage.style.display =
            "none";

        isCapturingBlocked = false;

        if (currentStream) {

            currentStream
                .getTracks()
                .forEach(track =>
                    track.stop()
                );
        }

        const constraints = {
            video:
                appSettings.selectedCameraId
                    ? {
                        deviceId: {
                            exact:
                                appSettings.selectedCameraId
                        }
                    }
                    : true,
            audio: false
        };

        const stream =
            await navigator
                .mediaDevices
                .getUserMedia(
                    constraints
                );

        currentStream = stream;

        camera.srcObject = stream;

        const videoTrack =
            stream.getVideoTracks()[0];

        if (videoTrack) {

            videoTrack.addEventListener(
                "ended",
                () => {

                    handleCameraDisconnect();
                }
            );
        }

        stopReconnectLoop();

    } catch (error) {

        console.error(
            "카메라 시작 실패:",
            error
        );

        handleCameraDisconnect();
    }
}

function handleCameraDisconnect() {

    if (isReconnecting) {
        return;
    }

    isCapturingBlocked = true;

    camera.srcObject = null;

    startReconnectLoop();
}

function startReconnectLoop() {

    if (isReconnecting) {
        return;
    }

    isReconnecting = true;

    reconnectMessage.style.display =
        "flex";

    reconnectInterval =
        setInterval(async () => {

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

                    console.log(
                        "카메라 없음"
                    );

                    return;
                }

                await startCamera();

            } catch (error) {

                console.log(
                    "재연결 실패"
                );
            }

        }, 3000);
}

function stopReconnectLoop() {

    reconnectMessage.style.display =
        "none";

    isReconnecting = false;

    clearInterval(
        reconnectInterval
    );
}

function startSessionTimer() {

    sessionTime =
        appSettings.sessionMinutes * 60;

    captureTime =
        appSettings.captureSeconds;

    updateSessionText();

    clearInterval(
        sessionInterval
    );

    sessionInterval =
        setInterval(() => {

            if(isCaptureProcessing){
                return;
            }

            sessionTime--;

            captureTime--;

            if (captureTime === 3) {

                countdownAudio.currentTime = 0;

                countdownAudio.play();
            }

            if (captureTime <= 0) {

                captureTime =
                    appSettings.captureSeconds;

                updateSessionText();

                triggerCapture();

            } else {

                updateSessionText();
            }

            if (sessionTime <= 0) {

                clearInterval(
                    sessionInterval
                );

                setTimeout(() => {

                    resetToStart();

                }, 2500);
            }

        }, 1000);
}

function updateSessionText() {

    const min =
        String(
            Math.floor(
                sessionTime / 60
            )
        ).padStart(2, "0");

    const sec =
        String(
            sessionTime % 60
        ).padStart(2, "0");

    const capture =
        String(
            captureTime
        ).padStart(2, "0");

    sessionTimerText.innerText =
        `${min}:${sec} / ${capture}`;
}

async function triggerCapture() {

    if (isCapturingBlocked) {
        return;
    }

    if (isCaptureProcessing) {
        return;
    }

    isCaptureProcessing = true;

    try {

        let success = false;

        for (
            let attempt = 1;
            attempt <= 3;
            attempt++
        ) {

            console.log(
                `촬영 시도 ${attempt}`
            );

            success =
                await capturePhoto();

            if (success) {

                console.log(
                    "촬영 성공"
                );

                break;
            }

            console.log(
                "촬영 재시도"
            );

            await new Promise(resolve =>
                setTimeout(
                    resolve,
                    1000
                )
            );
        }

        if (!success) {

            console.log(
                "최종 촬영 실패"
            );
        }

    } finally {

        isCaptureProcessing = false;
    }
}

async function capturePhoto() {

    try {

        camera.classList.add(
            "flash"
        );

        setTimeout(() => {

            camera.classList.remove(
                "flash"
            );

        }, 200);

        const success =
            await window.electronAPI
                .captureDSLR();

        if (!success) {

            console.log(
                "DSLR 촬영 실패"
            );

            return false;
        }

        console.log(
            "DSLR 촬영 요청 완료"
        );

        return true;

    } catch (error) {

        console.log(
            "DSLR 촬영 오류",
            error
        );

        return false;
    }
}

function resetToStart() {

    clearInterval(
        sessionInterval
    );

    stopReconnectLoop();

    countdownAudio.pause();

    countdownAudio.currentTime = 0;

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
    async () => {

        const selectedPath =
            await window.electronAPI
                .selectSavePath();

        if (!selectedPath) {
            return;
        }

        appSettings.savePath =
            selectedPath;

        currentSavePath.innerText =
            selectedPath;
    }
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
                        isReconnecting
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