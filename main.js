const {
    app,
    BrowserWindow,
    screen,
    ipcMain,
    dialog
} = require("electron");

const path = require("path");
const fs = require("fs");
const os = require("os");

const {
    startDSLRWatcher,
    stopDSLRWatcher,
    resetProcessedDSLRFiles
} = require(
    "./src/modules/camera/dslrWatcher"
);

const {
    autoUpdater
} = require("electron-updater");

const {
    initSettingsStorageService,
    loadSettings: loadSettingsFromStorage,
    saveSettings: saveSettingsToStorage
} = require(
    "./electron/services/settings/settingsStorageService"
);

const {
    getSessionImages
} = require(
    "./electron/services/album/albumStorageService"
);

const {
    copySelectedImages
} = require(
    "./electron/services/session/sessionStorageService"
);

const {
    initDigiCamControlService,
    capturePhoto
} = require(
    "./electron/services/camera/digiCamControlService"
);

const {
    initDigiCamControlProcessService,
    startDigiCamControl
} = require(
    "./electron/services/camera/digiCamControlProcessService"
);

let mainWindow;

let currentSessionFolder = null;

let appSettings = {
    sessionMinutes: 20,
    captureSeconds: 10,
    deleteMinutes: 60,

    captureMode: "webcam",

    selectedCameraId: "",
    autoLaunch: false,

    savePath: path.join(
        os.homedir(),
        "Downloads"
    ),

    albumEnabled: false,
    albumTimeoutMinutes: 5,
    restartDelayMinutes: 3
};

const settingsPath = path.join(
    app.getPath("userData"),
    "settings.json"
);

const LOG_FOLDER = path.join(
    app.getPath("userData"),
    "logs"
);

function ensureLogFolder() {

    if (!fs.existsSync(LOG_FOLDER)) {

        fs.mkdirSync(
            LOG_FOLDER,
            { recursive: true }
        );
    }
}

function writeLog(message) {

    try {

        ensureLogFolder();

        const now = new Date();

        const date =
            `${now.getFullYear()}-${String(
                now.getMonth() + 1
            ).padStart(2, "0")
            }-${String(
                now.getDate()
            ).padStart(2, "0")
            }`;

        const time =
            `${String(
                now.getHours()
            ).padStart(2, "0")}:${String(
                now.getMinutes()
            ).padStart(2, "0")
            }:${String(
                now.getSeconds()
            ).padStart(2, "0")
            }`;

        const logPath =
            path.join(
                LOG_FOLDER,
                `${date}.log`
            );

        fs.appendFileSync(
            logPath,
            `[${time}] ${message}\n`
        );

    } catch (error) {

        console.error(
            "로그 기록 실패:",
            error
        );
    }
}

initDigiCamControlService({
    log: writeLog
});

initDigiCamControlProcessService({

    log:
        writeLog,

    liveViewReady:
        () => {

            writeLog(
                "DSLR Live View 준비 완료"
            );

            if (
                !mainWindow ||
                mainWindow.isDestroyed()
            ) {
                return;
            }

            mainWindow.show();

            mainWindow.focus();

            writeLog(
                "RusticaStudio 전면 복귀 완료"
            );
        }
});

initSettingsStorageService({
    filePath: settingsPath,
    defaults: appSettings,
    log: writeLog
});

function getSavePath() {

    return (
        appSettings.savePath ||
        path.join(
            os.homedir(),
            "Downloads"
        )
    );
}

const DSLR_WATCH_FOLDER =
    path.join(
        app.getPath("downloads"),
        "RusticaStudio_DSLR_IMPORT"
    );

const SESSION_FOLDER_REGEX =
    /^\d{4}-\d{2}-\d{2}-(am|pm)\d{2}-\d{2}$/;

function loadSettings() {

    appSettings =
        loadSettingsFromStorage();

    app.setLoginItemSettings({
        openAtLogin:
            appSettings.autoLaunch
    });
}

function saveSettingsFile() {

    appSettings =
        saveSettingsToStorage(
            appSettings
        );
}

function createWindow() {

    const primaryDisplay =
        screen.getPrimaryDisplay();

    const { width, height } =
        primaryDisplay.workAreaSize;

    mainWindow = new BrowserWindow({

        width,
        height,

        fullscreen: true,

        kiosk: true,

        autoHideMenuBar: true,

        backgroundColor: "#ffffff",

        frame: false,

        webPreferences: {

            preload: path.join(
                __dirname,
                "preload.js"
            ),

            nodeIntegration: true,

            contextIsolation: true
        }
    });

    mainWindow.loadFile(
        "src/index.html"
    );

    // 앱 실행시 콘솔 (F12) 창이 자동으로 열리도록 설정
    mainWindow.webContents.openDevTools({
        mode: "detach"
    });

    mainWindow.setMenuBarVisibility(
        false
    );

    mainWindow.focus();

    writeLog(
        "메인 윈도우 생성 완료"
    );
}

function ensureFolders() {

    if (!fs.existsSync(DSLR_WATCH_FOLDER)) {

        fs.mkdirSync(
            DSLR_WATCH_FOLDER,
            { recursive: true }
        );

        writeLog(
            "DSLR_IMPORT 폴더 생성"
        );
    }
}

function getDeleteMs() {

    return appSettings.deleteMinutes * 60 * 1000;
}

function removeFolderRecursive(folderPath) {

    try {

        if (fs.existsSync(folderPath)) {

            fs.rmSync(
                folderPath,
                {
                    recursive: true,
                    force: true
                }
            );

            writeLog(
                `폴더 삭제 완료: ${folderPath}`
            );
        }

    } catch (error) {

        writeLog(
            `폴더 삭제 실패: ${error}`
        );

        console.error(
            "폴더 삭제 실패:",
            error
        );
    }
}

function removeFile(filePath) {

    try {

        if (fs.existsSync(filePath)) {

            fs.unlinkSync(filePath);

            writeLog(
                `파일 삭제 완료: ${filePath}`
            );
        }

    } catch (error) {

        writeLog(
            `파일 삭제 실패: ${error}`
        );

        console.error(
            "파일 삭제 실패:",
            error
        );
    }
}

function cleanupOldDownloadSessionFolders() {

    try {

        if (!fs.existsSync(getSavePath())) {
            return;
        }

        const now = Date.now();

        const items =
            fs.readdirSync(
                getSavePath(),
                {
                    withFileTypes: true
                }
            );

        items.forEach((item) => {

            if (!item.isDirectory()) {
                return;
            }

            const isSessionFolder =
                SESSION_FOLDER_REGEX.test(
                    item.name
                );

            if (!isSessionFolder) {
                return;
            }

            const folderPath =
                path.join(
                    getSavePath(),
                    item.name
                );

            /*
                현재 진행 중인 세션 폴더는
                자동 정리 대상에서 제외한다.
            
                촬영 종료 후 앨범에서 사진을
                선택하는 동안에도 같은 세션 폴더를
                사용하므로 삭제하면 안 된다.
            */
            if (
                currentSessionFolder &&
                path.resolve(folderPath) ===
                path.resolve(currentSessionFolder)
            ) {

                return;
            }

            const stats =
                fs.statSync(folderPath);

            const age =
                now - stats.mtimeMs;

            if (age >= getDeleteMs()) {

                removeFolderRecursive(
                    folderPath
                );
            }
        });

    } catch (error) {

        writeLog(
            `세션 폴더 정리 실패: ${error}`
        );
    }
}

function cleanupOldDSLRImportFiles() {

    try {

        if (!fs.existsSync(DSLR_WATCH_FOLDER)) {
            return;
        }

        const now = Date.now();

        const items =
            fs.readdirSync(
                DSLR_WATCH_FOLDER,
                {
                    withFileTypes: true
                }
            );

        items.forEach((item) => {

            const itemPath =
                path.join(
                    DSLR_WATCH_FOLDER,
                    item.name
                );

            const stats =
                fs.statSync(itemPath);

            const age =
                now - stats.birthtimeMs;

            if (age < getDeleteMs()) {
                return;
            }

            if (item.isDirectory()) {

                removeFolderRecursive(
                    itemPath
                );

            } else {

                removeFile(
                    itemPath
                );
            }
        });

    } catch (error) {

        writeLog(
            `DSLR_IMPORT 정리 실패: ${error}`
        );
    }
}

function startAutoCleanup() {

    cleanupOldDownloadSessionFolders();

    cleanupOldDSLRImportFiles();

    writeLog(
        "자동 정리 시스템 시작"
    );

    setInterval(() => {

        cleanupOldDownloadSessionFolders();

        cleanupOldDSLRImportFiles();

    }, 10 * 1000);
}

ipcMain.handle(
    "get-settings",
    async () => {

        return appSettings;
    }
);

ipcMain.handle(
    "save-settings",
    async (event, settings) => {

        appSettings = {
            ...appSettings,
            ...settings
        };

        saveSettingsFile();

        app.setLoginItemSettings({
            openAtLogin:
                appSettings.autoLaunch
        });

        cleanupOldDownloadSessionFolders();

        cleanupOldDSLRImportFiles();

        return appSettings;
    }
);

ipcMain.handle(
    "select-save-path",
    async () => {

        const result =
            await dialog.showOpenDialog(
                mainWindow,
                {
                    properties: [
                        "openDirectory"
                    ]
                }
            );

        if (
            result.canceled ||
            result.filePaths.length === 0
        ) {
            return null;
        }

        return result.filePaths[0];
    }
);

ipcMain.handle(
    "get-session-images",
    async (
        event,
        sessionPath
    ) => {

        try {

            const images =
                getSessionImages(
                    sessionPath
                );

            writeLog(
                `앨범 이미지 조회 완료: ${images.length}장`
            );

            return images;

        } catch (error) {

            writeLog(
                `앨범 이미지 조회 실패: ${error}`
            );

            console.error(
                "앨범 이미지 조회 실패:",
                error
            );

            return [];
        }
    }
);

ipcMain.handle(
    "copy-selected-images",
    async (
        event,
        {
            sourceSessionPath,
            selectedImagePaths
        }
    ) => {

        try {

            const result =
                copySelectedImages({
                    sourceSessionPath,
                    selectedImagePaths
                });


            if (
                result.success
            ) {

                writeLog(
                    `선택 이미지 복사 완료: ${result.copiedCount}장`
                );

            } else {

                writeLog(
                    `선택 이미지 복사 실패: ${result.error}`
                );
            }


            return result;

        } catch (error) {

            writeLog(
                `선택 이미지 복사 오류: ${error}`
            );

            console.error(
                "선택 이미지 복사 오류:",
                error
            );


            return {
                success: false,
                copiedCount: 0,
                copyFolderPath: null,
                error:
                    String(error)
            };
        }
    }
);

ipcMain.handle(
    "complete-session",
    async (
        event,
        sessionPath
    ) => {

        if (
            currentSessionFolder &&
            sessionPath &&
            path.resolve(
                currentSessionFolder
            ) ===
            path.resolve(
                sessionPath
            )
        ) {

            const completedSessionFolder =
                currentSessionFolder;

            if (
                fs.existsSync(
                    completedSessionFolder
                )
            ) {

                const completedAt =
                    new Date();

                fs.utimesSync(
                    completedSessionFolder,
                    completedAt,
                    completedAt
                );

                writeLog(
                    `세션 보존시간 시작: ${completedSessionFolder}`
                );
            }

            writeLog(
                `세션 보호 해제: ${completedSessionFolder}`
            );

            currentSessionFolder =
                null;
        }

        cleanupOldDownloadSessionFolders();

        return true;
    }
);

ipcMain.handle(
    "create-session-folder",
    async () => {

        const now = new Date();

        const year =
            now.getFullYear();

        const month =
            String(
                now.getMonth() + 1
            ).padStart(2, "0");

        const day =
            String(
                now.getDate()
            ).padStart(2, "0");

        let hour =
            now.getHours();

        const minute =
            String(
                now.getMinutes()
            ).padStart(2, "0");

        const ampm =
            hour >= 12 ? "pm" : "am";

        hour = hour % 12;

        if (hour === 0) {
            hour = 12;
        }

        const formattedHour =
            String(hour).padStart(2, "0");

        const folderName =
            `${year}-${month}-${day}-${ampm}${formattedHour}-${minute}`;

        currentSessionFolder =
            path.join(
                getSavePath(),
                folderName
            );

        resetProcessedDSLRFiles();

        if (!fs.existsSync(currentSessionFolder)) {

            fs.mkdirSync(
                currentSessionFolder,
                {
                    recursive: true
                }
            );
        }

        writeLog(
            `세션 폴더 생성: ${currentSessionFolder}`
        );

        return currentSessionFolder;
    }
);

ipcMain.handle(
    "save-photo",
    async (event, { fileName, buffer }) => {

        try {

            if (!currentSessionFolder) {

                writeLog(
                    "세션 폴더 없음"
                );

                return false;
            }

            const filePath =
                path.join(
                    currentSessionFolder,
                    fileName
                );

            fs.writeFileSync(
                filePath,
                Buffer.from(buffer)
            );

            writeLog(
                `라이브뷰 저장 완료: ${filePath}`
            );

            return true;

        } catch (error) {

            writeLog(
                `사진 저장 실패: ${error}`
            );

            return false;
        }
    }
);

ipcMain.handle(
    "capture-dslr",
    async () => {

        try {

            if (
                !currentSessionFolder
            ) {

                writeLog(
                    "DSLR 촬영 실패: 세션 폴더 없음"
                );

                return false;
            }


            const result =
                await capturePhoto();


            if (
                !result ||
                result.success !== true
            ) {

                writeLog(
                    `DSLR 촬영 실패: ${result?.reason ||
                    "UNKNOWN"
                    }`
                );

                if (
                    result?.stderr
                ) {

                    writeLog(
                        `DSLR stderr: ${result.stderr}`
                    );
                }

                return false;
            }


            writeLog(
                "DSLR WebServer 촬영 명령 전달 완료"
            );

            return true;

        } catch (error) {

            writeLog(
                `DSLR IPC 실패: ${error}`
            );

            return false;
        }
    }
);

app.whenReady().then(() => {

    writeLog(
        "앱 시작"
    );

    loadSettings();

    startDigiCamControl();

    ensureFolders();

    startDSLRWatcher({

        watchFolder:
            DSLR_WATCH_FOLDER,

        sessionFolderGetter:
            () =>
                currentSessionFolder,

        logger:
            writeLog,

        onCaptureCompleted:
            imagePath => {

                if (
                    mainWindow
                ) {

                    mainWindow
                        .webContents
                        .send(
                            "capture-completed",
                            imagePath
                        );
                }
            }

    });

    createWindow();

    startAutoCleanup();

    autoUpdater.checkForUpdatesAndNotify();
});

autoUpdater.on(
    "update-available",
    () => {

        writeLog(
            "새 업데이트 발견"
        );
    }
);

autoUpdater.on(
    "update-downloaded",
    () => {

        writeLog(
            "업데이트 다운로드 완료"
        );

        autoUpdater.quitAndInstall();
    }
);

autoUpdater.on(
    "error",
    (error) => {

        writeLog(
            `업데이트 오류: ${error}`
        );
    }
);

app.on(
    "browser-window-created",
    (event, window) => {

        window.webContents.on(
            "before-input-event",
            (event, input) => {

                if (
                    input.key === "Escape"
                ) {

                    event.preventDefault();
                }
            }
        );
    }
);

app.on(
    "window-all-closed",
    async () => {

        writeLog(
            "앱 종료"
        );

        await stopDSLRWatcher();

        app.quit();
    }
);
