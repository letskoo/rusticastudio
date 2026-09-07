const {
    execFile
} = require(
    "child_process"
);

const http = require(
    "http"
);


const DIGICAM_CONTROL_PATH =
    "C:\\Program Files (x86)\\digiCamControl\\CameraControl.exe";

const DIGICAM_REMOTE_CMD_PATH =
    "C:\\Program Files (x86)\\digiCamControl\\CameraControlRemoteCmd.exe";


let logger =
    () => { };

let onLiveViewReady =
    () => { };


function initDigiCamControlProcessService({
    log,
    liveViewReady
} = {}) {

    logger =
        typeof log === "function"
            ? log
            : () => { };

    onLiveViewReady =
        typeof liveViewReady === "function"
            ? liveViewReady
            : () => { };
}


function hideDigiCamControlWindow() {

    const script = `
Add-Type @"
using System;
using System.Runtime.InteropServices;

public class RusticaWin32 {
    [DllImport("user32.dll")]
    public static extern bool ShowWindow(
        IntPtr hWnd,
        int nCmdShow
    );
}
"@

$process = Get-Process CameraControl -ErrorAction SilentlyContinue

if ($process -and $process.MainWindowHandle -ne 0) {

    [RusticaWin32]::ShowWindow(
        $process.MainWindowHandle,
        0
    )
}
`;

    execFile(
        "powershell.exe",
        [
            "-NoProfile",
            "-NonInteractive",
            "-Command",
            script
        ],
        {
            windowsHide: true
        },
        error => {

            if (error) {

                logger(
                    `digiCamControl 창 숨김 실패: ${error}`
                );

                return;
            }

            logger(
                "digiCamControl 창 숨김 완료"
            );
        }
    );
}


function minimizeDigiCamControlWindows() {

    logger(
        "digiCamControl 전체 창 최소화 요청"
    );

    execFile(
        DIGICAM_REMOTE_CMD_PATH,
        [
            "/c",
            "do",
            "All_Minimize"
        ],
        {
            windowsHide: true,
            timeout: 5000
        },
        error => {

            if (error) {

                logger(
                    `digiCamControl 전체 창 최소화 실패: ${error}`
                );

                return;
            }

            logger(
                "digiCamControl 전체 창 최소화 완료"
            );
        }
    );
}


function waitForDigiCamControlWebServer(
    retryCount = 0
) {

    logger(
        `digiCamControl WebServer 준비 확인 (${retryCount + 1})`
    );

    const request =
        http.get(
            {
                hostname:
                    "127.0.0.1",

                port:
                    5513,

                path:
                    "/",

                timeout:
                    2000
            },
            response => {

                response.resume();

                if (
                    response.statusCode === 200
                ) {

                    logger(
                        "digiCamControl WebServer 준비 완료"
                    );

                    logger(
                        "digiCamControl 카메라 초기화 대기"
                    );

                    setTimeout(
                        () => {

                            waitForDigiCamControlCamera();
                        },
                        8000
                    );

                    return;
                }

                retryDigiCamControlWebServer(
                    retryCount
                );
            }
        );

    request.on(
        "timeout",
        () => {

            request.destroy();
        }
    );

    request.on(
        "error",
        () => {

            retryDigiCamControlWebServer(
                retryCount
            );
        }
    );
}


function retryDigiCamControlWebServer(
    retryCount
) {

    if (
        retryCount >= 29
    ) {

        logger(
            "digiCamControl WebServer 준비 최종 실패"
        );

        return;
    }

    setTimeout(
        () => {

            waitForDigiCamControlWebServer(
                retryCount + 1
            );
        },
        1000
    );
}


function waitForDigiCamControlCamera(
    retryCount = 0
) {

    logger(
        `digiCamControl 카메라 준비 확인 (${retryCount + 1})`
    );

    execFile(
        DIGICAM_REMOTE_CMD_PATH,
        [
            "/c",
            "list",
            "cameras"
        ],
        {
            windowsHide: true,
            timeout: 5000
        },
        (
            error,
            stdout
        ) => {

            const response =
                String(stdout || "").trim();

            logger(
                `digiCamControl 카메라 응답: ${response}`
            );

            const cameraReady =
                !error &&
                response.includes(
                    "response:[\""
                );

            if (cameraReady) {

                logger(
                    "digiCamControl 카메라 준비 완료"
                );

                startDigiCamControlLiveView();

                return;
            }

            if (
                retryCount >= 29
            ) {

                logger(
                    "digiCamControl 카메라 준비 최종 실패"
                );

                return;
            }

            setTimeout(
                () => {

                    waitForDigiCamControlCamera(
                        retryCount + 1
                    );
                },
                1000
            );
        }
    );
}


function checkDigiCamControlLiveView() {

    return new Promise(
        resolve => {

            const request =
                http.get(
                    {
                        hostname:
                            "127.0.0.1",

                        port:
                            5513,

                        path:
                            `/liveview.jpg?t=${Date.now()}`,

                        timeout:
                            3000
                    },
                    response => {

                        let totalBytes =
                            0;

                        response.on(
                            "data",
                            chunk => {

                                totalBytes +=
                                    chunk.length;
                            }
                        );

                        response.on(
                            "end",
                            () => {

                                const contentType =
                                    String(
                                        response.headers[
                                        "content-type"
                                        ] || ""
                                    );

                                const ready =
                                    response.statusCode === 200 &&
                                    contentType.startsWith(
                                        "image/"
                                    ) &&
                                    totalBytes > 0;

                                resolve(
                                    ready
                                );
                            }
                        );
                    }
                );

            request.on(
                "timeout",
                () => {

                    request.destroy();

                    resolve(
                        false
                    );
                }
            );

            request.on(
                "error",
                () => {

                    resolve(
                        false
                    );
                }
            );
        }
    );
}


function restartDigiCamControlLiveView() {

    logger(
        "digiCamControl Live View 재시작 요청"
    );

    execFile(
        DIGICAM_REMOTE_CMD_PATH,
        [
            "/c",
            "do",
            "LiveViewWnd_Hide"
        ],
        {
            windowsHide: true,
            timeout: 5000
        },
        error => {

            if (error) {

                logger(
                    `digiCamControl Live View 숨김 실패: ${error}`
                );

                return;
            }

            setTimeout(
                () => {

                    startDigiCamControlLiveView(
                        0,
                        true
                    );
                },
                2000
            );
        }
    );
}

function startDigiCamControlLiveView(
    retryCount = 0,
    restarted = false
) {

    logger(
        `digiCamControl Live View 시작 요청 (${retryCount + 1})`
    );

    execFile(
        DIGICAM_REMOTE_CMD_PATH,
        [
            "/c",
            "do",
            "LiveViewWnd_Show"
        ],
        {
            windowsHide: true
        },
        (
            error,
            stdout,
            stderr
        ) => {

            const response =
                stdout.trim();

            logger(
                `digiCamControl Live View 응답: ${response}`
            );

            const commandFailed =
                error ||
                response.includes(
                    "response:error"
                );

            if (commandFailed) {

                logger(
                    `digiCamControl Live View 시작 실패 (${retryCount + 1})`
                );

                if (
                    retryCount < 5
                ) {

                    setTimeout(
                        () => {

                            startDigiCamControlLiveView(
                                retryCount + 1,
                                restarted
                            );
                        },
                        3000
                    );

                    return;
                }

                logger(
                    "digiCamControl Live View 시작 최종 실패"
                );

                return;
            }

            logger(
                "digiCamControl Live View 시작 명령 완료"
            );

            setTimeout(
                async () => {

                    const liveViewReady =
                        await checkDigiCamControlLiveView();

                    if (liveViewReady) {

                        logger(
                            "digiCamControl Live View 실제 영상 확인 완료"
                        );

                        onLiveViewReady();

                        return;
                    }

                    logger(
                        "digiCamControl Live View 실제 영상 확인 실패"
                    );

                    restartDigiCamControlLiveView();
                },
                2000
            );
        }
    );
}

function startDigiCamControl() {

    try {

        logger(
            "digiCamControl 실행 요청"
        );

        execFile(
            "powershell.exe",
            [
                "-NoProfile",
                "-NonInteractive",
                "-Command",
                `Start-Process -FilePath '${DIGICAM_CONTROL_PATH}'`
            ],
            {
                windowsHide: true
            },
            error => {

                if (error) {

                    logger(
                        `digiCamControl Shell 실행 실패: ${error}`
                    );

                    return;
                }

                logger(
                    "digiCamControl Shell 실행 완료"
                );
            }
        );

        setTimeout(
            waitForDigiCamControlWebServer,
            1000
        );

        logger(
            "digiCamControl 실행 요청 완료"
        );

        return {
            success: true
        };

    } catch (error) {

        logger(
            `digiCamControl 실행 실패: ${error}`
        );

        return {
            success: false,
            reason:
                "DIGICAM_START_FAILED",
            error:
                String(error)
        };
    }
}


function stopDigiCamControl() {

    logger(
        "digiCamControl 종료 요청"
    );

    execFile(
        "powershell.exe",
        [
            "-NoProfile",
            "-NonInteractive",
            "-Command",
            `Get-Process CameraControl -ErrorAction SilentlyContinue | Stop-Process`
        ],
        {
            windowsHide: true
        },
        error => {

            if (error) {

                logger(
                    `digiCamControl 종료 실패: ${error}`
                );

                return;
            }

            logger(
                "digiCamControl 종료 완료"
            );
        }
    );
}


module.exports = {

    initDigiCamControlProcessService,

    startDigiCamControl,

    stopDigiCamControl
};