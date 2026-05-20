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

let pendingCapture = false;

let thumbnailTimeout = null;

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

        camera.onloadedmetadata = () => {

            applyDynamicCameraCrop();
        };

        window.addEventListener(
            "resize",
            applyDynamicCameraCrop
        );

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

function applyDynamicCameraCrop() {

    if (
        !camera.videoWidth ||
        !camera.videoHeight
    ) {
        return;
    }

    /*
        세로 모니터 여부
    */
    const isPortraitScreen =
        window.innerHeight >
        window.innerWidth;

    /*
        가로 모니터
        =
        원본 비율 그대로
    */
    if (!isPortraitScreen) {

        camera.style.position =
            "absolute";

        camera.style.top =
            "50%";

        camera.style.left =
            "50%";

        camera.style.width =
            "100vw";

        camera.style.height =
            "auto";

        camera.style.minHeight =
            "100vh";

        camera.style.objectFit =
            "cover";

        camera.style.transform =
            `
translate(-50%, -50%)
scaleX(-1)
`;

        return;
    }

    /*
        세로 피벗 모니터
        =
        높이 고정
        좌우 crop
    */
    camera.style.position =
        "absolute";

    camera.style.top =
        "50%";

    camera.style.left =
        "50%";

    /*
        핵심
    */
    camera.style.height =
        "100vh";

    camera.style.width =
        "auto";

    /*
        세로 화면에서
        폭 부족 방지
    */
    camera.style.minWidth =
        "100vw";

    camera.style.objectFit =
        "cover";

    camera.style.transform =
        `
translate(-50%, -50%)
scaleX(-1)
`;
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
        setInterval(async () => {

            sessionTime--;

            captureTime--;

            if (captureTime === 3) {

                countdownAudio.currentTime = 0;

                countdownAudio.play();
            }

            if (captureTime <= 0) {

                captureTime =
                    appSettings.captureSeconds;

                triggerCapture();
            }

            updateSessionText();

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

    /*
        flash 즉시 실행
    */
    camera.classList.remove(
        "flash"
    );

    void camera.offsetWidth;

    camera.classList.add(
        "flash"
    );

    setTimeout(() => {

        camera.classList.remove(
            "flash"
        );

    }, 180);

    try {

        capturePhoto();

    } catch (error) {

        console.log(
            "triggerCapture 오류",
            error
        );

    } finally {

        isCaptureProcessing = false;
    }
}

function dataURLToUint8Array(dataURL) {

    const base64 =
        dataURL.split(",")[1];

    const binary =
        atob(base64);

    const length =
        binary.length;

    const bytes =
        new Uint8Array(length);

    for (
        let i = 0;
        i < length;
        i++
    ) {

        bytes[i] =
            binary.charCodeAt(i);
    }

    return bytes;
}

async function capturePhoto() {

    try {

        if (
            !camera.videoWidth ||
            !camera.videoHeight
        ) {

            return false;
        }

        const canvas =
            document.createElement(
                "canvas"
            );

        canvas.width =
            camera.videoWidth;

        canvas.height =
            camera.videoHeight;

        const ctx =
            canvas.getContext("2d");

        ctx.translate(
            canvas.width,
            0
        );

        ctx.scale(-1, 1);

        ctx.drawImage(
            camera,
            0,
            0,
            canvas.width,
            canvas.height
        );

        const imageData =
            canvas.toDataURL(
                "image/jpeg",
                1
            );

        const buffer =
            dataURLToUint8Array(
                imageData
            );

        const fileName =
            `webcam_${Date.now()}.jpg`;

        await window.electronAPI
            .savePhoto({
                fileName,
                buffer
            });

        /*
            썸네일 무조건 갱신
        */
        lastPhotoPreview.srcObject =
            null;

        lastPhotoPreview.classList.remove(
            "show"
        );

        void lastPhotoPreview.offsetWidth;

        lastPhotoPreview.src =
            imageData;

        lastPhotoPreview.classList.add(
            "show"
        );

        /*
            이전 timeout 제거
        */
        clearTimeout(
            thumbnailTimeout
        );

        thumbnailTimeout =
            setTimeout(() => {

                lastPhotoPreview.classList.remove(
                    "show"
                );

            }, 3000);

        /*
            DSLR 원본 촬영
        */
        window.electronAPI
            .captureDSLR();

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
