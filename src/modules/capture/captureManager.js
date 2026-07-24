let deps;

let isCaptureProcessing = false;

let thumbnailTimeout = null;


export function initCaptureManager(
    dependencies
) {

    deps = dependencies;
}


export async function triggerCapture() {

    if (
        deps.getIsCapturingBlocked()
    ) {
        return;
    }

    if (isCaptureProcessing) {
        return;
    }

    isCaptureProcessing = true;

    /*
        플래시 즉시 실행
    */
    deps.camera.classList.remove(
        "flash"
    );

    void deps.camera.offsetWidth;

    deps.camera.classList.add(
        "flash"
    );

    setTimeout(() => {

        deps.camera.classList.remove(
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


function dataURLToUint8Array(
    dataURL
) {

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
            !deps.camera.videoWidth ||
            !deps.camera.videoHeight
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

        previewCtx.scale(-1, 1);

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

        /*
            썸네일 표시
        */
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
            previewData;

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

        /*
            DSLR / 미러리스 여부 판단
        */
        const currentCameraText =
            deps.cameraSelect.options[
                deps.cameraSelect.selectedIndex
            ]?.textContent
                ?.toLowerCase?.() || "";

        const isDSLR =
            currentCameraText.includes(
                "nikon"
            ) ||
            currentCameraText.includes(
                "canon"
            ) ||
            currentCameraText.includes(
                "sony"
            ) ||
            currentCameraText.includes(
                "fujifilm"
            ) ||
            currentCameraText.includes(
                "lumix"
            ) ||
            currentCameraText.includes(
                "eos"
            ) ||
            currentCameraText.includes(
                "alpha"
            ) ||
            currentCameraText.includes(
                "webcam utility"
            );

        /*
            DSLR / 미러리스
            =
            원본 저장
        */
        if (isDSLR) {

            try {

                window.electronAPI
                    .captureDSLR()
                    .catch(error => {

                        console.log(
                            "DSLR 저장 오류",
                            error
                        );
                    });

            } catch (error) {

                console.log(
                    "DSLR 저장 오류",
                    error
                );
            }
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

            originalCtx.scale(-1, 1);

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

            await window.electronAPI
                .savePhoto({
                    fileName,
                    buffer
                });
        }

        return true;

    } catch (error) {

        console.log(
            "촬영 오류",
            error
        );

        return false;
    }
}