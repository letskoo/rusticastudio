const fs = require("fs");

const path = require("path");

function isAlbumImage(
    fileName
) {

    const extension =
        path
            .extname(fileName)
            .toLowerCase();

    const isSupportedImage =
        extension === ".jpg" ||
        extension === ".jpeg" ||
        extension === ".png";

    return isSupportedImage;
}


function getSessionImages(
    sessionPath
) {

    if (
        !sessionPath ||
        typeof sessionPath !== "string"
    ) {

        return [];
    }


    if (
        !fs.existsSync(
            sessionPath
        )
    ) {

        return [];
    }


    const stats =
        fs.statSync(
            sessionPath
        );


    if (
        !stats.isDirectory()
    ) {

        return [];
    }


    const items =
        fs.readdirSync(
            sessionPath,
            {
                withFileTypes: true
            }
        );


    return items
        .filter(
            item => {

                if (
                    !item.isFile()
                ) {

                    return false;
                }


                return isAlbumImage(
                    item.name
                );
            }
        )
        .map(
            item =>
                path.join(
                    sessionPath,
                    item.name
                )
        )
        .sort();
}


module.exports = {
    getSessionImages
};