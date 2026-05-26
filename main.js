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

const chokidar = require("chokidar");

const { exec } = require("child_process");

const {
    autoUpdater
} = require("electron-updater");

let mainWindow;

let currentSessionFolder = null;

let dslrWatcher = null;

let processedDSLRFiles =
    new Set();

let appSettings = {
    sessionMinutes: 20,
    captureSeconds: 10,
    deleteMinutes: 60,
    selectedCameraId: "",
    autoLaunch: false,

    savePath: path.join(
        os.homedir(),
        "Downloads"
    )
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
        os.homedir(),
        "Pictures",
        "digiCamControl",
        "Session1"
    );

const SESSION_FOLDER_REGEX =
    /^\d{4}-\d{2}-\d{2}-(am|pm)\d{2}-\d{2}$/;

function loadSettings() {

    try {

        if (fs.existsSync(settingsPath)) {

            const saved =
                JSON.parse(
                    fs.readFileSync(
                        settingsPath,
                        "utf-8"
                    )
                );

            appSettings = {
                ...appSettings,
                ...saved
            };

            app.setLoginItemSettings({
                openAtLogin:
                    appSettings.autoLaunch
            });

            writeLog(
                "설정 불러오기 성공"
            );
        }

    } catch (error) {

        writeLog(
            `설정 불러오기 실패: ${error}`
        );

        console.error(
            "설정 불러오기 실패:",
            error
        );
    }
}

function saveSettingsFile() {

    fs.writeFileSync(
        settingsPath,
        JSON.stringify(
            appSettings,
            null,
            2
        )
    );

    writeLog(
        "설정 저장 완료"
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

            if (
                !SESSION_FOLDER_REGEX.test(
                    item.name
                )
            ) {
                return;
            }

            const folderPath =
                path.join(
                    getSavePath(),
                    item.name
                );

            const stats =
                fs.statSync(folderPath);

            const age =
                now - stats.birthtimeMs;

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

function waitForFile(filePath) {

    return new Promise((resolve) => {

        const startTime =
            Date.now();

        const timeout = 15000;

        const interval =
            setInterval(() => {

                try {

                    if (!fs.existsSync(filePath)) {
                        return;
                    }

                    /*
                        파일 열기 가능하면
                        저장 완료로 판단
                    */
                    const fd =
                        fs.openSync(
                            filePath,
                            "r+"
                        );

                    fs.closeSync(fd);

                    clearInterval(interval);

                    resolve(true);

                } catch (error) {

                    /*
                        아직 저장 중
                    */
                }

                if (
                    Date.now() - startTime >
                    timeout
                ) {

                    clearInterval(interval);

                    resolve(false);
                }

            }, 200);
    });
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

        processedDSLRFiles.clear();

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

        return true;
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

        return new Promise((resolve) => {

            try {

                writeLog(
                    "DSLR 촬영 시작"
                );

                const captureStartTime =
                    Date.now();

                const digiCamPath =
                    `"C:\\Program Files (x86)\\digiCamControl\\CameraControlCmd.exe"`;

                exec(
                    `${digiCamPath} /capture`,
                    async (
                        error,
                        stdout,
                        stderr
                    ) => {

                        if (error) {

                            writeLog(
                                `DSLR 촬영 실패: ${error}`
                            );

                            resolve(false);

                            return;
                        }

                        writeLog(
                            `DSLR capture stdout: ${stdout}`
                        );

                        if (stderr) {

                            writeLog(
                                `DSLR capture stderr: ${stderr}`
                            );
                        }

                        const startTime =
                            Date.now();

                        const maxWait = 15000;

                        const checkInterval =
                            setInterval(async () => {

                                try {

                                    if (
                                        !fs.existsSync(
                                            DSLR_WATCH_FOLDER
                                        )
                                    ) {
                                        return;
                                    }

                                    const files =
                                        fs.readdirSync(
                                            DSLR_WATCH_FOLDER
                                        );

                                    const imageFiles =
                                        files.filter(file => {

                                            const ext =
                                                path.extname(file)
                                                    .toLowerCase();

                                            return [
                                                ".jpg",
                                                ".jpeg",
                                                ".png",
                                                ".cr2",
                                                ".cr3",
                                                ".nef",
                                                ".arw",
                                                ".dng"
                                            ].includes(ext);
                                        });

                                    const sortedFiles =
                                        imageFiles
                                            .map(file => {

                                                const filePath =
                                                    path.join(
                                                        DSLR_WATCH_FOLDER,
                                                        file
                                                    );

                                                const stats =
                                                    fs.statSync(
                                                        filePath
                                                    );

                                                return {
                                                    file,
                                                    filePath,
                                                    mtimeMs:
                                                        stats.mtimeMs
                                                };
                                            })
                                            .sort((a, b) =>
                                                b.mtimeMs -
                                                a.mtimeMs
                                            );

                                    const latestFile =
                                        sortedFiles.find(item => {

                                            if (
                                                processedDSLRFiles.has(
                                                    item.file
                                                )
                                            ) {
                                                return false;
                                            }

                                            return (
                                                item.mtimeMs >=
                                                captureStartTime - 1000
                                            );
                                        });

                                    if (latestFile) {

                                        await waitForFile(
                                            latestFile.filePath
                                        );

                                        const targetPath =
                                            path.join(
                                                currentSessionFolder,
                                                latestFile.file
                                            );

                                        try {

                                            fs.copyFileSync(
                                                latestFile.filePath,
                                                targetPath
                                            );

                                            writeLog(
                                                `복사 성공: ${targetPath}`
                                            );

                                        } catch (copyError) {

                                            clearInterval(
                                                checkInterval
                                            );

                                            writeLog(
                                                `DSLR 파일 복사 실패: ${copyError}`
                                            );

                                            resolve(false);

                                            return;
                                        }

                                        processedDSLRFiles.add(
                                            latestFile.file
                                        );

                                        clearInterval(
                                            checkInterval
                                        );

                                        writeLog(
                                            `DSLR 원본 저장 완료: ${targetPath}`
                                        );

                                        resolve(true);

                                        return;
                                    }

                                    if (
                                        Date.now() - startTime >
                                        maxWait
                                    ) {

                                        clearInterval(
                                            checkInterval
                                        );

                                        writeLog(
                                            "DSLR 다운로드 timeout"
                                        );

                                        resolve(false);
                                    }

                                } catch (watchError) {

                                    clearInterval(
                                        checkInterval
                                    );

                                    writeLog(
                                        `DSLR watcher 오류: ${watchError}`
                                    );

                                    resolve(false);
                                }

                            }, 200);

                    }
                );

            } catch (error) {

                writeLog(
                    `DSLR IPC 실패: ${error}`
                );

                resolve(false);
            }

        });
    }
);

app.whenReady().then(() => {

    writeLog(
        "앱 시작"
    );

    loadSettings();

    ensureFolders();

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
    () => {

        writeLog(
            "앱 종료"
        );

        app.quit();
    }
);
