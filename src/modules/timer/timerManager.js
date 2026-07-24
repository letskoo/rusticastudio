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
        setInterval(() => {

            sessionTime--;

            captureTime--;

            if (captureTime === 3) {

                countdownAudio.currentTime = 0;

                countdownAudio
                    .play()
                    .catch(error => {

                        console.log(
                            "카운트다운 재생 오류",
                            error
                        );
                    });
            }

            if (captureTime <= 0) {

                captureTime =
                    appSettings.captureSeconds;

                deps.triggerCapture();
            }

            updateSessionText();

            if (sessionTime <= 0) {

                clearInterval(
                    sessionInterval
                );

                sessionInterval = null;

                setTimeout(() => {

                    deps.resetToStart();

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