let deps;

let sessionTime = 0;

let captureTime = 0;

let sessionInterval = null;

const countdownAudio =
    new Audio(
        "../assets/sounds/countdown.MP3"
    );

countdownAudio.volume = 1;

export function initTimerManager(
    dependencies
) {

    deps = dependencies;
}

export function startSessionTimer() {

    countdownAudio.pause();

    countdownAudio.currentTime = 0;

    const appSettings =
        deps.getAppSettings();

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

            if (
                captureTime ===
                Math.min(
                    3,
                    appSettings.captureSeconds
                )
            ) {

                countdownAudio.pause();

                countdownAudio.currentTime = 0;

                try {

                    await countdownAudio.play();

                } catch (error) {

                    console.log(
                        "카운트다운 재생 오류",
                        error
                    );
                }
            }

            if (captureTime <= 0) {

                /*
                    셔터 효과음이 재생되는
                    마지막 1초 동안
                    실제 촬영
                */

                deps.triggerCapture();

                captureTime =
                    appSettings.captureSeconds;
            }

            updateSessionText();

            if (sessionTime <= 0) {

                clearInterval(
                    sessionInterval
                );

                sessionInterval = null;

                setTimeout(() => {

                    deps.onSessionTimeExpired();

                }, 2500);
            }

        }, 1000);
}

export function updateSessionText() {

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

    deps.sessionTimerText.innerText =
        `${min}:${sec} / ${capture}`;
}

export function stopSessionTimer() {

    clearInterval(
        sessionInterval
    );

    sessionInterval = null;

    countdownAudio.pause();

    countdownAudio.currentTime = 0;
}