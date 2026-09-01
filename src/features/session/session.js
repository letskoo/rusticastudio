let deps;

let isEnding = false;

let currentSessionPath = null;

let restartLockedUntil = 0;

let restartUnlockTimer = null;


export function initSession(
    dependencies
) {

    deps = dependencies;
}


export async function startSession() {

    if (!canStartSession()) {
        return false;
    }

    isEnding = false;

    currentSessionPath =
        await deps.createSessionFolder();

    await deps.startCamera();

    deps.startSessionTimer();

    return true;
}


export async function requestSessionEnd() {

    if (isEnding) {
        return;
    }

    isEnding = true;

    deps.stopSessionTimer();

    /*
        DSLR 촬영 명령이 진행 중이라면
        실제 파일 저장 완료까지 기다린다.

        세션 종료와 마지막 DSLR 촬영이
        동시에 발생했을 때 마지막 사진이
        앨범에서 누락되는 것을 방지한다.
    */
    while (
        typeof deps.getIsCaptureProcessing ===
        "function" &&
        deps.getIsCaptureProcessing()
    ) {

        await new Promise(
            resolve =>
                setTimeout(
                    resolve,
                    200
                )
        );
    }

    const settings =
        deps.getAppSettings();

    if (
        settings.albumEnabled === true
    ) {

        deps.openAlbum(
            currentSessionPath
        );

        return;
    }

    completeSession();
}


export async function completeSession() {

    if (
        currentSessionPath &&
        typeof deps.notifySessionCompleted ===
        "function"
    ) {

        await deps.notifySessionCompleted(
            currentSessionPath
        );
    }

    currentSessionPath =
        null;

    startRestartDelay();

    deps.resetToStart();

    isEnding = false;
}


function startRestartDelay() {

    clearTimeout(
        restartUnlockTimer
    );

    const settings =
        deps.getAppSettings();

    const restartDelayMinutes =
        Number(
            settings.restartDelayMinutes
        ) || 3;

    restartLockedUntil =
        Date.now() +
        (
            restartDelayMinutes *
            60 *
            1000
        );

    deps.setStartButtonLocked(
        true
    );

    restartUnlockTimer =
        setTimeout(() => {

            restartLockedUntil = 0;

            deps.setStartButtonLocked(
                false
            );

            restartUnlockTimer = null;

        },
            restartDelayMinutes *
            60 *
            1000
        );
}


export function canStartSession() {

    return (
        Date.now() >=
        restartLockedUntil
    );
}


export function getIsSessionEnding() {

    return isEnding;
}

export function getCurrentSessionPath() {

    return currentSessionPath;
}