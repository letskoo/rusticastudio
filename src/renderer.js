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

const endSessionBtn =
    document.getElementById(
        "end-session-btn"
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

let startButtonLockUntil = 0;

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

        await loadCameraList();
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

            return;
        }

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
                        },

                        width: {
                            ideal: 1920
                        },

                        height: {
                            ideal: 1080
                        },

                        aspectRatio: {
                            ideal: 16 / 9
                        }
                    }
                    : {
                        width: {
                            ideal: 1920
                        },

                        height: {
                            ideal: 1080
                        },

                        aspectRatio: {
                            ideal: 16 / 9
                        }
                    },

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

    const screenRatio =
        window.innerWidth /
        window.innerHeight;

    const videoRatio =
        camera.videoWidth /
        camera.videoHeight;

    camera.style.position =
        "absolute";

    camera.style.top =
        "50%";

    camera.style.left =
        "50%";

    /*
        화면보다 카메라가 더 넓은 경우
        =
        높이 꽉 채우기
    */
    if (videoRatio > screenRatio) {

        camera.style.width =
            "auto";

        camera.style.height =
            "100vh";
    }

    /*
        화면보다 카메라가 더 세로인 경우
        =
        폭 꽉 채우기
    */
    else {

        camera.style.width =
            "100vw";

        camera.style.height =
            "auto";
    }

    camera.style.objectFit =
        "contain";

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

        await capturePhoto();

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

        /*
    썸네일 전용
*/
        const previewCanvas =
            document.createElement(
                "canvas"
            );

        previewCanvas.width =
            camera.videoWidth;

        previewCanvas.height =
            camera.videoHeight;

        const previewCtx =
            previewCanvas.getContext(
                "2d"
            );

        previewCtx.translate(
            previewCanvas.width,
            0
        );

        previewCtx.scale(-1, 1);

        previewCtx.drawImage(
            camera,
            0,
            0,
            previewCanvas.width,
            previewCanvas.height
        );

        const previewData =
            previewCanvas.toDataURL(
                "image/jpeg",
                0.7
            );

        /*
            썸네일 표시
        */
        lastPhotoPreview.srcObject =
            null;

        lastPhotoPreview.classList.remove(
            "show"
        );

        void lastPhotoPreview.offsetWidth;

        lastPhotoPreview.src =
            previewData;

        lastPhotoPreview.classList.add(
            "show"
        );

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
            DSLR / 미러리스 여부 판단
        */
        const videoTrack =
            currentStream
                ?.getVideoTracks?.()[0];

        const trackLabel =
            videoTrack
                ?.label
                ?.toLowerCase?.() || "";

        const selectedText =
            cameraSelect.options[
                cameraSelect.selectedIndex
            ]?.textContent?.toLowerCase?.() || "";

        const cameraName =
            `${trackLabel} ${selectedText}`;

        const isDSLR =
            cameraName.includes("nikon") ||
            cameraName.includes("canon") ||
            cameraName.includes("sony") ||
            cameraName.includes("fujifilm") ||
            cameraName.includes("lumix") ||
            cameraName.includes("eos") ||
            cameraName.includes("alpha") ||
            cameraName.includes("z5") ||
            cameraName.includes("d750");

        /*
            DSLR / 미러리스
            =
            원본 저장
        */
        if (isDSLR) {

            window.electronAPI
                .captureDSLR()
                .catch(error => {

                    console.log(
                        "DSLR 저장 오류",
                        error
                    );
                });
        }

        /*
            웹캠 / 내장캠
            =
            최대 해상도 저장
        */
        else {

            const originalCanvas =
                document.createElement(
                    "canvas"
                );

            originalCanvas.width =
                camera.videoWidth;

            originalCanvas.height =
                camera.videoHeight;

            const originalCtx =
                originalCanvas.getContext(
                    "2d"
                );

            originalCtx.translate(
                originalCanvas.width,
                0
            );

            originalCtx.scale(-1, 1);

            originalCtx.drawImage(
                camera,
                0,
                0,
                originalCanvas.width,
                originalCanvas.height
            );

            const originalData =
                originalCanvas.toDataURL(
                    "image/jpeg",
                    1
                );

            const buffer =
                dataURLToUint8Array(
                    originalData
                );

            const fileName =
                `webcam_${Date.now()}.jpg`;

            await window.electronAPI
                .savePhoto({
                    fileName,
                    buffer
                });
        }

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

endSessionBtn.addEventListener(
    "click",
    () => {

        /*
            5분 잠금
        */
        startButtonLockUntil =
            Date.now() +
            (5 * 60 * 1000);

        resetToStart();
    }
);