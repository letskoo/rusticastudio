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

let appSettings = {
    sessionMinutes: 20,
    captureSeconds: 10,
    deleteMinutes: 60,
    selectedCameraId: "",
    autoLaunch:false,

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

function ensureLogFolder(){

    if(!fs.existsSync(LOG_FOLDER)){

        fs.mkdirSync(
            LOG_FOLDER,
            { recursive:true }
        );
    }
}

function writeLog(message){

    try{

        ensureLogFolder();

        const now = new Date();

        const date =
            `${now.getFullYear()}-${
                String(
                    now.getMonth() + 1
                ).padStart(2, "0")
            }-${
                String(
                    now.getDate()
                ).padStart(2, "0")
            }`;

        const time =
            `${String(
                now.getHours()
            ).padStart(2, "0")}:${
                String(
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

    }catch(error){

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

const DSLR_WATCH_FOLDER = path.join(
    os.homedir(),
    "Pictures",
    "DSLR_IMPORT"
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

    fullscreen:true,

    kiosk:true,

    autoHideMenuBar:true,

    backgroundColor:"#ffffff",

    frame:false,

    webPreferences: {

        preload: path.join(
            __dirname,
            "preload.js"
        ),

        nodeIntegration:true,

        contextIsolation:true
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
                    recursive:true,
                    force:true
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

function scheduleFolderDelete(folderPath) {

    setTimeout(() => {

        removeFolderRecursive(folderPath);

    }, getDeleteMs());
}

function scheduleFileDelete(filePath) {

    setTimeout(() => {

        removeFile(filePath);

    }, getDeleteMs());
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
                    withFileTypes:true
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
                    withFileTypes:true
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

    }, 5 * 60 * 1000);
}

function startDSLRWatcher() {

    ensureFolders();

    dslrWatcher = chokidar.watch(
        DSLR_WATCH_FOLDER,
        {
            ignoreInitial:true
        }
    );

    writeLog(
        "DSLR Watcher 시작"
    );

    dslrWatcher.on(
        "add",
        async (filePath) => {

            try {

                if (!currentSessionFolder) {

                    writeLog(
                        "세션 폴더 없음"
                    );

                    return;
                }

                const ext =
                    path.extname(filePath)
                        .toLowerCase();

                const allowedExt = [
                    ".jpg",
                    ".jpeg",
                    ".png",
                    ".cr2",
                    ".cr3",
                    ".nef",
                    ".arw",
                    ".dng"
                ];

                if (!allowedExt.includes(ext)) {
                    return;
                }

                const fileName =
                    path.basename(filePath);

                const targetPath =
                    path.join(
                        currentSessionFolder,
                        fileName
                    );

                await waitForFile(filePath);

                fs.copyFileSync(
                    filePath,
                    targetPath
                );

                writeLog(
                    `DSLR 원본 저장 완료: ${targetPath}`
                );

                scheduleFileDelete(
                    filePath
                );

            } catch (error) {

                writeLog(
                    `DSLR 감지 실패: ${error}`
                );
            }
        }
    );
}

function waitForFile(filePath) {

    return new Promise((resolve) => {

        let previousSize = -1;

        const interval =
            setInterval(() => {

                if (!fs.existsSync(filePath)) {
                    return;
                }

                const stats =
                    fs.statSync(filePath);

                if (stats.size === previousSize) {

                    clearInterval(interval);

                    resolve();
                }

                previousSize = stats.size;

            }, 500);
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
                    properties:[
                        "openDirectory"
                    ]
                }
            );

        if(
            result.canceled ||
            result.filePaths.length === 0
        ){
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

        if (!fs.existsSync(currentSessionFolder)) {

            fs.mkdirSync(
                currentSessionFolder,
                {
                    recursive:true
                }
            );
        }

        scheduleFolderDelete(
            currentSessionFolder
        );

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

        try {

            const digiCamPath =
                `"C:\\Program Files (x86)\\digiCamControl\\CameraControlCmd.exe"`;

            exec(
                `${digiCamPath} /capture`,
                (error) => {

                    if (error) {

                        writeLog(
                            `DSLR 촬영 실패: ${error}`
                        );

                        return;
                    }

                    writeLog(
                        "DSLR 촬영 완료"
                    );
                }
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

    ensureFolders();

    createWindow();

    startDSLRWatcher();

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

                if(
                    input.key === "Escape"
                ){

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