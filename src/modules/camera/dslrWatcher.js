const fs = require("fs");
const path = require("path");
const chokidar = require("chokidar");

const SUPPORTED_IMAGE_EXTENSIONS = [
    ".jpg",
    ".jpeg",
    ".png",
    ".cr2",
    ".cr3",
    ".nef",
    ".arw",
    ".dng"
];

let watcher = null;

let processedFiles =
    new Set();

let watcherFolder = null;

let getSessionFolder = null;

let writeLog = () => { };

let notifyCaptureCompleted =
    null;

function isSupportedImage(filePath) {

    const extension =
        path.extname(filePath)
            .toLowerCase();

    return SUPPORTED_IMAGE_EXTENSIONS.includes(
        extension
    );
}

function createUniqueTargetPath(
    sessionFolder,
    sourceFilePath
) {

    const extension =
        path.extname(sourceFilePath);

    const baseName =
        path.basename(
            sourceFilePath,
            extension
        );

    let targetPath =
        path.join(
            sessionFolder,
            `${baseName}${extension}`
        );

    if (!fs.existsSync(targetPath)) {

        return targetPath;
    }

    let index = 1;

    while (fs.existsSync(targetPath)) {

        targetPath =
            path.join(
                sessionFolder,
                `${baseName}_${index}${extension}`
            );

        index += 1;
    }

    return targetPath;
}

async function waitForFileReady(
    filePath
) {

    const timeoutMs = 20000;

    const checkIntervalMs = 200;

    const stableChecksRequired = 3;

    const startTime =
        Date.now();

    let lastSize = -1;

    let stableChecks = 0;

    while (
        Date.now() - startTime <
        timeoutMs
    ) {

        try {

            if (!fs.existsSync(filePath)) {

                await new Promise(resolve =>
                    setTimeout(
                        resolve,
                        checkIntervalMs
                    )
                );

                continue;
            }

            const stats =
                fs.statSync(filePath);

            if (
                stats.size > 0 &&
                stats.size === lastSize
            ) {

                stableChecks += 1;

            } else {

                stableChecks = 0;

                lastSize =
                    stats.size;
            }

            if (
                stableChecks >=
                stableChecksRequired
            ) {

                const fileDescriptor =
                    fs.openSync(
                        filePath,
                        "r"
                    );

                fs.closeSync(
                    fileDescriptor
                );

                return true;
            }

        } catch (error) {

            stableChecks = 0;
        }

        await new Promise(resolve =>
            setTimeout(
                resolve,
                checkIntervalMs
            )
        );
    }

    return false;
}

async function processDSLRFile(
    sourceFilePath
) {

    try {

        if (
            !isSupportedImage(
                sourceFilePath
            )
        ) {

            return;
        }

        if (
            processedFiles.has(
                sourceFilePath
            )
        ) {

            return;
        }

        /*
            중복 이벤트 방지를 위해
            먼저 처리 목록에 추가한다.
        */
        processedFiles.add(
            sourceFilePath
        );

        const sessionFolder =
            typeof getSessionFolder ===
                "function"
                ? getSessionFolder()
                : null;

        /*
            촬영 세션이 시작되지 않은 상태라면
            파일을 복사하지 않는다.
        */
        if (!sessionFolder) {

            writeLog(
                `DSLR 파일 감지 - 활성 세션 없음: ${sourceFilePath}`
            );

            return;
        }

        const fileReady =
            await waitForFileReady(
                sourceFilePath
            );

        if (!fileReady) {

            processedFiles.delete(
                sourceFilePath
            );

            writeLog(
                `DSLR 파일 저장 대기 시간 초과: ${sourceFilePath}`
            );

            return;
        }

        if (
            !fs.existsSync(
                sessionFolder
            )
        ) {

            fs.mkdirSync(
                sessionFolder,
                {
                    recursive: true
                }
            );
        }

        const targetPath =
            createUniqueTargetPath(
                sessionFolder,
                sourceFilePath
            );

        fs.copyFileSync(
            sourceFilePath,
            targetPath
        );

        notifyCaptureCompleted?.(
            targetPath
        );

        writeLog(
            `DSLR 원본 자동 저장 완료: ${targetPath}`
        );

    } catch (error) {

        processedFiles.delete(
            sourceFilePath
        );

        writeLog(
            `DSLR 파일 처리 실패: ${error}`
        );
    }
}

function startDSLRWatcher({

    watchFolder,

    sessionFolderGetter,

    logger,

    onCaptureCompleted

}) {

    if (watcher) {

        writeLog(
            "DSLR Watcher가 이미 실행 중"
        );

        return;
    }

    watcherFolder =
        watchFolder;

    getSessionFolder =
        sessionFolderGetter;

    writeLog =
        typeof logger === "function"
            ? logger
            : () => { };

    notifyCaptureCompleted =
        onCaptureCompleted;

    try {

        if (
            !fs.existsSync(
                watcherFolder
            )
        ) {

            fs.mkdirSync(
                watcherFolder,
                {
                    recursive: true
                }
            );
        }

        watcher =
            chokidar.watch(
                watcherFolder,
                {
                    persistent: true,

                    /*
                        앱 실행 전에 있던 기존 파일은
                        새 촬영 파일로 처리하지 않는다.
                    */
                    ignoreInitial: true,

                    depth: 0,

                    awaitWriteFinish: {
                        stabilityThreshold: 1000,
                        pollInterval: 200
                    }
                }
            );

        watcher.on(
            "add",
            async filePath => {

                await processDSLRFile(
                    filePath
                );
            }
        );

        watcher.on(
            "change",
            async filePath => {

                await processDSLRFile(
                    filePath
                );
            }
        );

        watcher.on(
            "error",
            error => {

                writeLog(
                    `DSLR Watcher 오류: ${error}`
                );
            }
        );

        watcher.on(
            "ready",
            () => {

                writeLog(
                    `DSLR Watcher 시작 완료: ${watcherFolder}`
                );
            }
        );

    } catch (error) {

        watcher = null;

        writeLog(
            `DSLR Watcher 시작 실패: ${error}`
        );
    }
}

async function stopDSLRWatcher() {

    if (!watcher) {

        return;
    }

    try {

        await watcher.close();

        writeLog(
            "DSLR Watcher 종료 완료"
        );

    } catch (error) {

        writeLog(
            `DSLR Watcher 종료 실패: ${error}`
        );

    } finally {

        watcher = null;

        watcherFolder = null;

        getSessionFolder = null;

        processedFiles.clear();
    }
}

function resetProcessedDSLRFiles() {

    processedFiles.clear();

    writeLog(
        "DSLR 처리 파일 목록 초기화"
    );
}

module.exports = {
    startDSLRWatcher,
    stopDSLRWatcher,
    resetProcessedDSLRFiles
};