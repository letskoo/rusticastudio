const fs = require("fs");

let settingsPath = null;
let defaultSettings = {};
let logger = () => { };

function cloneSettings(settings) {
    return {
        ...settings
    };
}

function initSettingsStorageService({
    filePath,
    defaults,
    log
}) {
    settingsPath = filePath;

    defaultSettings = {
        ...(defaults || {})
    };

    logger =
        typeof log === "function"
            ? log
            : () => { };
}

function loadSettings() {
    if (!settingsPath) {
        throw new Error(
            "Settings Storage Service가 초기화되지 않았습니다."
        );
    }

    try {
        if (!fs.existsSync(settingsPath)) {
            return cloneSettings(
                defaultSettings
            );
        }

        const saved =
            JSON.parse(
                fs.readFileSync(
                    settingsPath,
                    "utf-8"
                )
            );

        const settings = {
            ...defaultSettings,
            ...(saved || {})
        };

        logger(
            "설정 불러오기 성공"
        );

        return settings;

    } catch (error) {
        logger(
            `설정 불러오기 실패: ${error}`
        );

        console.error(
            "설정 불러오기 실패:",
            error
        );

        return cloneSettings(
            defaultSettings
        );
    }
}

function saveSettings(settings) {
    if (!settingsPath) {
        throw new Error(
            "Settings Storage Service가 초기화되지 않았습니다."
        );
    }

    const nextSettings = {
        ...defaultSettings,
        ...(settings || {})
    };

    fs.writeFileSync(
        settingsPath,
        JSON.stringify(
            nextSettings,
            null,
            2
        )
    );

    logger(
        "설정 저장 완료"
    );

    return cloneSettings(
        nextSettings
    );
}

module.exports = {
    initSettingsStorageService,
    loadSettings,
    saveSettings
};
