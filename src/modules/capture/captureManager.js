import {
    playCaptureFlash
} from "../../ui/feedback/captureFlash.js";

let deps;

let isCaptureProcessing = false;

let thumbnailTimeout = null;

let captureTimeout = null;

let isCaptureListenerRegistered = false;


export function initCaptureManager(
    dependencies
) {

    deps = dependencies;

    /*
        DSLR 원본이 PC 세션 폴더에
        저장 완료된 시점에 실행된다.
    */
    if (
        !isCaptureListenerRegistered &&
        window.electronAPI
            .onCaptureCompleted
    ) {

        isCaptureListenerRegistered =
            true;

        window.electronAPI
            .onCaptureCompleted(
                imagePath => {

                    handleDSLRCompleted(
                        imagePath
                    );
                }
            );
    }
}


export async function triggerCapture() {

    console.log(
        "triggerCapture 호출됨"
    );

    if (
        deps.getIsCapturingBlocked()
    ) {
        return;
    }

    if (isCaptureProcessing) {
        return;
    }

    const captureMode =
        deps.getAppSettings()
            .captureMode ||
        "webcam";

    const isDigiCam =
        captureMode ===
        "digicam";

    /*
        DSLR은 실제 원본 저장 완료 이벤트가
        올 때까지 촬영 처리 상태를 유지한다.
    */
    if (isDigiCam) {

        isCaptureProcessing = true;

        setTimeout(() => {
            playCaptureFlash();
        }, 500);

        clearTimeout(
            captureTimeout
        );

        /*
            digiCamControl 오류 등으로
            완료 이벤트가 오지 않을 경우를 대비한다.
        */
        captureTimeout =
            setTimeout(() => {

                captureTimeout =
                    null;

                isCaptureProcessing =
                    false;

                console.log(
                    "DSLR 촬영 완료 대기 시간 초과"
                );

            }, 30000);

        try {

            const success =
                await window.electronAPI
                    .captureDSLR();

            if (!success) {

                clearTimeout(
                    captureTimeout
                );

                captureTimeout =
                    null;

                isCaptureProcessing =
                    false;

                console.log(
                    "DSLR 촬영 명령 실패"
                );

                return;
            }

        } catch (error) {

            clearTimeout(
                captureTimeout
            );

            captureTimeout =
                null;

            isCaptureProcessing =
                false;

            console.log(
                "DSLR 촬영 오류",
                error
            );
        }

        return;
    }

    /*
        웹캠은 브라우저 화면 자체가 원본이므로
        즉시 플래시·썸네일·저장을 처리한다.
    */
    isCaptureProcessing = true;

    try {

        playCaptureFlash();

        showLiveViewThumbnail();

        await captureWebcamPhoto();

    } catch (error) {

        console.log(
            "웹캠 촬영 오류",
            error
        );

    } finally {

        isCaptureProcessing =
            false;
    }
}


function handleDSLRCompleted(
    imagePath
) {

    clearTimeout(
        captureTimeout
    );

    captureTimeout = null;

    /*
        JPG·JPEG·PNG라면 실제 촬영 원본을
        썸네일로 표시한다.

        NEF 등 RAW는 브라우저 img 태그에서
        직접 표시할 수 없으므로 건너뛴다.
    */
    const lowerPath =
        String(
            imagePath || ""
        ).toLowerCase();

    const canShowPreview =
        lowerPath.endsWith(".jpg") ||
        lowerPath.endsWith(".jpeg") ||
        lowerPath.endsWith(".png");

    if (canShowPreview) {

        showOriginalThumbnail(
            imagePath
        );
    }

    isCaptureProcessing =
        false;

    /*
        카메라 본체 셔터나 리모컨 촬영 시
        타이머 촬영 간격도 다시 시작하기 위한 연결점.
        다음 단계에서 renderer가 이 함수를 전달한다.
    */
    if (
        typeof deps.onCaptureCompleted ===
        "function"
    ) {

        deps.onCaptureCompleted(
            imagePath
        );
    }
}

function showOriginalThumbnail(
    imagePath
) {

    const normalizedPath =
        String(imagePath)
            .replace(
                /\\/g,
                "/"
            );

    const imageUrl =
        encodeURI(
            `file:///${normalizedPath}`
        ) +
        `?time=${Date.now()}`;

    showThumbnail(
        imageUrl
    );
}


function showLiveViewThumbnail() {

    if (
        !deps.camera.videoWidth ||
        !deps.camera.videoHeight
    ) {
        return;
    }

    const previewCanvas =
        document.createElement(
            "canvas"
        );

    previewCanvas.width =
        deps.camera.videoWidth;

    previewCanvas.height =
        deps.camera.videoHeight;

    const previewCtx =
        previewCanvas.getContext(
            "2d"
        );

    previewCtx.translate(
        previewCanvas.width,
        0
    );

    previewCtx.scale(
        -1,
        1
    );

    previewCtx.drawImage(
        deps.camera,
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

    showThumbnail(
        previewData
    );
}


function showThumbnail(
    imageSource
) {

    deps.lastPhotoPreview.srcObject =
        null;

    deps.lastPhotoPreview
        .classList
        .remove(
            "show"
        );

    void deps.lastPhotoPreview
        .offsetWidth;

    deps.lastPhotoPreview.src =
        imageSource;

    deps.lastPhotoPreview
        .classList
        .add(
            "show"
        );

    clearTimeout(
        thumbnailTimeout
    );

    thumbnailTimeout =
        setTimeout(() => {

            deps.lastPhotoPreview
                .classList
                .remove(
                    "show"
                );

        }, 3000);
}


function dataURLToUint8Array(
    dataURL
) {

    const base64 =
        dataURL.split(",")[1];

    const binary =
        atob(base64);

    const bytes =
        new Uint8Array(
            binary.length
        );

    for (
        let i = 0;
        i < binary.length;
        i++
    ) {

        bytes[i] =
            binary.charCodeAt(i);
    }

    return bytes;
}


async function captureWebcamPhoto() {

    if (
        !deps.camera.videoWidth ||
        !deps.camera.videoHeight
    ) {

        return false;
    }

    const originalCanvas =
        document.createElement(
            "canvas"
        );

    originalCanvas.width =
        deps.camera.videoWidth;

    originalCanvas.height =
        deps.camera.videoHeight;

    const originalCtx =
        originalCanvas.getContext(
            "2d"
        );

    originalCtx.translate(
        originalCanvas.width,
        0
    );

    originalCtx.scale(
        -1,
        1
    );

    originalCtx.drawImage(
        deps.camera,
        0,
        0,
        originalCanvas.width,
        originalCanvas.height
    );

    const originalData =
        originalCanvas.toDataURL(
            "image/png"
        );

    const buffer =
        dataURLToUint8Array(
            originalData
        );

    const fileName =
        `webcam_${Date.now()}.png`;

    return window.electronAPI
        .savePhoto({
            fileName,
            buffer
        });
}

export function getIsCaptureProcessing() {

    return isCaptureProcessing;
}