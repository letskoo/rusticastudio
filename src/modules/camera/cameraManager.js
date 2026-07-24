let deps;

let currentStream = null;

let reconnectInterval = null;

let isReconnecting = false;

let isCapturingBlocked = false;


export function initCameraManager(
    dependencies
) {

    deps = dependencies;
}


export async function loadCameraList() {

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

    deps.cameraSelect.innerHTML = "";

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

            deps.cameraSelect.appendChild(
                option
            );
        }
    );

    const appSettings =
        deps.getAppSettings();

    if (
        appSettings.selectedCameraId
    ) {

        deps.cameraSelect.value =
            appSettings.selectedCameraId;
    }
}


export async function startCamera() {

    try {

        deps.reconnectMessage.style.display =
            "none";

        isCapturingBlocked = false;

        if (currentStream) {

            currentStream
                .getTracks()
                .forEach(track =>
                    track.stop()
                );
        }

        const appSettings =
            deps.getAppSettings();

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

        const activeTrack =
            stream.getVideoTracks()[0];

        console.log(
            "실제 연결 카메라:",
            activeTrack?.label
        );

        deps.camera.srcObject =
            stream;

        deps.camera.onloadedmetadata =
            () => {

                deps.camera
                    .play()
                    .catch(error => {

                        console.log(
                            "카메라 재생 실패",
                            error
                        );
                    });

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

        /*
            DSLR virtual webcam은
            연결까지 시간이 오래 걸릴 수 있음
        */

        setTimeout(async () => {

            try {

                await startCamera();

            } catch (retryError) {

                console.log(
                    "카메라 재시도 실패"
                );
            }

        }, 2000);
    }
}


export function applyDynamicCameraCrop() {

    if (
        !deps.camera.videoWidth ||
        !deps.camera.videoHeight
    ) {
        return;
    }

    const screenRatio =
        window.innerWidth /
        window.innerHeight;

    const videoRatio =
        deps.camera.videoWidth /
        deps.camera.videoHeight;

    deps.camera.style.position =
        "absolute";

    deps.camera.style.top =
        "50%";

    deps.camera.style.left =
        "50%";

    /*
        화면보다 카메라가 더 넓은 경우
        =
        높이 꽉 채우기
    */
    if (videoRatio > screenRatio) {

        deps.camera.style.width =
            "auto";

        deps.camera.style.height =
            "100vh";
    }

    /*
        화면보다 카메라가 더 세로인 경우
        =
        폭 꽉 채우기
    */
    else {

        deps.camera.style.width =
            "100vw";

        deps.camera.style.height =
            "auto";
    }

    deps.camera.style.objectFit =
        "contain";

    deps.camera.style.transform =
        `
translate(-50%, -50%)
scaleX(-1)
`;
}


export function handleCameraDisconnect() {

    if (isReconnecting) {
        return;
    }

    isCapturingBlocked = true;

    deps.camera.srcObject = null;

    startReconnectLoop();
}


export function startReconnectLoop() {

    if (isReconnecting) {
        return;
    }

    isReconnecting = true;

    deps.reconnectMessage.style.display =
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


export function stopReconnectLoop() {

    deps.reconnectMessage.style.display =
        "none";

    isReconnecting = false;

    clearInterval(
        reconnectInterval
    );

    reconnectInterval = null;
}


export function getCurrentStream() {

    return currentStream;
}


export function getIsReconnecting() {

    return isReconnecting;
}


export function getIsCapturingBlocked() {

    return isCapturingBlocked;
}


export function setIsCapturingBlocked(
    blocked
) {

    isCapturingBlocked = blocked;
}