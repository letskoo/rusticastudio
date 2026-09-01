let deps;

let currentSessionPath = null;

let sessionImages = [];

let selectedImagePaths =
    new Set();

let isAlbumOpen = false;

let albumTimeoutTimer = null;

let albumCountdownTimer = null;

let albumRemainingSeconds = 0;


export function initAlbum(
    dependencies
) {

    deps = dependencies;
}


export async function openAlbum(
    sessionPath
) {

    if (!sessionPath) {

        console.log(
            "ALBUM: Session 경로 없음"
        );

        return false;
    }

    clearAlbumTimeout();

    currentSessionPath =
        sessionPath;

    sessionImages = [];

    selectedImagePaths.clear();

    isAlbumOpen = true;

    try {

        const images =
            await deps.getSessionImages(
                currentSessionPath
            );

        sessionImages =
            Array.isArray(images)
                ? images
                : [];

        console.log(
            `ALBUM: 이미지 ${sessionImages.length}장 로드`
        );

        console.log(
            sessionImages
        );

        deps.onAlbumOpened(
            sessionImages
        );

        startAlbumTimeout();

        return true;

    } catch (error) {

        console.log(
            "ALBUM: 이미지 조회 실패",
            error
        );

        sessionImages = [];

        /*
            조회 실패도 ALBUM에
            무한정 머물지 않도록
            공통 완료 절차를 실행한다.
        */
        completeAlbum(
            "ERROR"
        );

        return false;
    }
}


function startAlbumTimeout() {

    clearAlbumTimeout();

    const settings =
        deps.getAppSettings();

    const timeoutMinutes =
        Number(
            settings.albumTimeoutMinutes
        ) || 5;

    albumRemainingSeconds =
        timeoutMinutes * 60;

    console.log(
        `ALBUM: 선택 제한시간 ${timeoutMinutes}분 시작`
    );

    deps.onAlbumTimerChange(
        albumRemainingSeconds
    );

    albumCountdownTimer =
        setInterval(() => {

            albumRemainingSeconds--;

            deps.onAlbumTimerChange(
                albumRemainingSeconds
            );

            if (
                albumRemainingSeconds <= 0
            ) {

                clearAlbumTimeout();

                console.log(
                    "ALBUM: 선택시간 만료"
                );

                completeAlbum(
                    "TIMEOUT"
                );
            }

        }, 1000);
}


function clearAlbumTimeout() {

    if (albumTimeoutTimer) {

        clearTimeout(
            albumTimeoutTimer
        );

        albumTimeoutTimer = null;
    }

    if (albumCountdownTimer) {

        clearInterval(
            albumCountdownTimer
        );

        albumCountdownTimer = null;
    }

    albumRemainingSeconds = 0;
}


export async function completeAlbum(
    reason = "MANUAL"
) {

    if (!isAlbumOpen) {
        return;
    }

    /*
        중복 완료 방지

        선택 완료 버튼과
        TIMEOUT이 동시에 실행되는 상황을 막는다.
    */
    isAlbumOpen = false;

    clearAlbumTimeout();

    const selectedImages =
        getSelectedImagePaths();

    const completedSessionPath =
        currentSessionPath;

    console.log(
        `ALBUM: 완료 (${reason})`
    );

    console.log(
        `ALBUM: 최종 선택 ${selectedImages.length}장`
    );


    let copyResult = {
        success: true,
        copiedCount: 0,
        copyFolderPath: null,
        error: null
    };


    /*
        선택한 사진이 있을 때만
        COPY 폴더를 생성하고 복사한다.
    */
    if (
        selectedImages.length > 0
    ) {

        try {

            copyResult =
                await deps.copySelectedImages({
                    sourceSessionPath:
                        completedSessionPath,

                    selectedImagePaths:
                        selectedImages
                });


            if (
                !copyResult ||
                copyResult.success !== true
            ) {

                console.log(
                    "ALBUM: 선택 사진 복사 실패",
                    copyResult
                );

            } else {

                console.log(
                    `ALBUM: 선택 사진 ${copyResult.copiedCount}장 복사 완료`
                );

                console.log(
                    "ALBUM: COPY 폴더",
                    copyResult.copyFolderPath
                );
            }

        } catch (error) {

            console.log(
                "ALBUM: 선택 사진 복사 오류",
                error
            );

            copyResult = {
                success: false,
                copiedCount: 0,
                copyFolderPath: null,
                error:
                    String(error)
            };
        }
    }


    resetAlbum();


    deps.onAlbumCompleted({
        reason,

        sessionPath:
            completedSessionPath,

        selectedImagePaths:
            selectedImages,

        copyResult
    });
}


export function toggleFavorite(
    imagePath
) {

    if (!imagePath) {
        return;
    }

    if (
        selectedImagePaths.has(
            imagePath
        )
    ) {

        selectedImagePaths.delete(
            imagePath
        );

        return;
    }

    selectedImagePaths.add(
        imagePath
    );
}


export function isFavorite(
    imagePath
) {

    return selectedImagePaths.has(
        imagePath
    );
}


export function getSessionImages() {

    return [
        ...sessionImages
    ];
}


export function getSelectedImagePaths() {

    return Array.from(
        selectedImagePaths
    );
}


export function getCurrentSessionPath() {

    return currentSessionPath;
}


export function getIsAlbumOpen() {

    return isAlbumOpen;
}


export function resetAlbum() {

    clearAlbumTimeout();

    currentSessionPath = null;

    sessionImages = [];

    selectedImagePaths.clear();

    isAlbumOpen = false;
}