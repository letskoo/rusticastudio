const fs = require(
    "fs"
);

const path = require(
    "path"
);


function copySelectedImages({
    sourceSessionPath,
    selectedImagePaths
}) {

    if (
        !sourceSessionPath ||
        typeof sourceSessionPath !==
            "string"
    ) {

        return {
            success: false,
            copiedCount: 0,
            copyFolderPath: null,
            error:
                "SOURCE_SESSION_PATH_REQUIRED"
        };
    }


    if (
        !fs.existsSync(
            sourceSessionPath
        )
    ) {

        return {
            success: false,
            copiedCount: 0,
            copyFolderPath: null,
            error:
                "SOURCE_SESSION_NOT_FOUND"
        };
    }


    const sourceStats =
        fs.statSync(
            sourceSessionPath
        );


    if (
        !sourceStats.isDirectory()
    ) {

        return {
            success: false,
            copiedCount: 0,
            copyFolderPath: null,
            error:
                "SOURCE_SESSION_NOT_DIRECTORY"
        };
    }


    const selectedImages =
        Array.isArray(
            selectedImagePaths
        )
            ? selectedImagePaths
            : [];


    /*
        0장 선택은 정상 완료다.

        정책상 -copy Folder도
        생성하지 않는다.
    */
    if (
        selectedImages.length === 0
    ) {

        return {
            success: true,
            copiedCount: 0,
            copyFolderPath: null
        };
    }


    const sourceFolderName =
        path.basename(
            sourceSessionPath
        );


    const parentPath =
        path.dirname(
            sourceSessionPath
        );


    const copyFolderPath =
        path.join(
            parentPath,
            `${sourceFolderName}-copy`
        );


    /*
        먼저 모든 선택 파일이
        현재 Session 안의 정상 파일인지
        확인한다.

        검증 실패 상태에서
        Copy Folder부터 만들지 않는다.
    */
    const validImages = [];


    for (
        const imagePath
        of selectedImages
    ) {

        if (
            !imagePath ||
            typeof imagePath !==
                "string"
        ) {

            return {
                success: false,
                copiedCount: 0,
                copyFolderPath: null,
                error:
                    "INVALID_IMAGE_PATH"
            };
        }


        const relativePath =
            path.relative(
                sourceSessionPath,
                imagePath
            );


        const isOutsideSession =
            relativePath.startsWith(
                ".."
            ) ||
            path.isAbsolute(
                relativePath
            );


        if (
            isOutsideSession
        ) {

            return {
                success: false,
                copiedCount: 0,
                copyFolderPath: null,
                error:
                    "IMAGE_OUTSIDE_SESSION"
            };
        }


        if (
            !fs.existsSync(
                imagePath
            )
        ) {

            return {
                success: false,
                copiedCount: 0,
                copyFolderPath: null,
                error:
                    "SOURCE_IMAGE_NOT_FOUND"
            };
        }


        const imageStats =
            fs.statSync(
                imagePath
            );


        if (
            !imageStats.isFile()
        ) {

            return {
                success: false,
                copiedCount: 0,
                copyFolderPath: null,
                error:
                    "SOURCE_IMAGE_NOT_FILE"
            };
        }


        validImages.push(
            imagePath
        );
    }


    fs.mkdirSync(
        copyFolderPath,
        {
            recursive: true
        }
    );


    let copiedCount = 0;


    for (
        const imagePath
        of validImages
    ) {

        const fileName =
            path.basename(
                imagePath
            );


        const targetPath =
            path.join(
                copyFolderPath,
                fileName
            );


        /*
            중복 완료 호출 등에 의해
            동일 파일이 이미 존재하면

            기존 파일을 덮어쓰지 않고
            정상 복사된 것으로 취급한다.
        */
        if (
            fs.existsSync(
                targetPath
            )
        ) {

            continue;
        }


        fs.copyFileSync(
            imagePath,
            targetPath,
            fs.constants.COPYFILE_EXCL
        );


        copiedCount++;
    }


    return {
        success: true,
        copiedCount,
        copyFolderPath
    };
}


module.exports = {
    copySelectedImages
};