let deps;

let previewImagePath = null;


export function initAlbumView(
    dependencies
) {
    deps = dependencies;

    const modal = document.getElementById(
        "album-preview-modal"
    );

    const closeButton = document.getElementById(
        "album-preview-close"
    );

    const previewFavoriteButton =
        document.getElementById(
            "album-preview-favorite"
        );

    previewFavoriteButton.addEventListener(
        "click",
        event => {
            event.stopPropagation();

            if (!previewImagePath) {
                return;
            }

            toggleAlbumFavorite(
                previewImagePath
            );
        }
    );

    closeButton.addEventListener(
        "click",
        closeAlbumPreview
    );

    modal.addEventListener(
        "click",
        event => {
            if (event.target === modal) {
                closeAlbumPreview();
            }
        }
    );
}


export function showAlbumPage() {

    deps.cameraPage.classList.remove(
        "active"
    );

    deps.albumPage.classList.add(
        "active"
    );
}


export function hideAlbumPage() {

    closeAlbumPreview();

    deps.albumPage.classList.remove(
        "active"
    );

}


export function renderAlbumImages(
    imagePaths
) {

    deps.albumGrid.innerHTML = "";

    imagePaths.forEach(
        imagePath => {

            const item =
                document.createElement(
                    "div"
                );

            item.className =
                "album-image-item";


            const image =
                document.createElement(
                    "img"
                );

            image.className =
                "album-image";

            image.src =
                toFileUrl(
                    imagePath
                );

            image.addEventListener(
                "click",
                () => {
                    openAlbumPreview(
                        imagePath
                    );
                }
            );

            const favoriteButton =
                document.createElement(
                    "button"
                );

            favoriteButton.className =
                "album-favorite-btn";

            favoriteButton.type =
                "button";

            favoriteButton.innerText =
                "★";


            favoriteButton.addEventListener(
                "click",
                event => {
                    event.stopPropagation();

                    toggleAlbumFavorite(
                        imagePath
                    );
                }
            );


            item.appendChild(
                image
            );

            item.appendChild(
                favoriteButton
            );

            deps.albumGrid.appendChild(
                item
            );

            updateFavoriteButton(
                favoriteButton,
                imagePath
            );
        }
    );

    updateSelectedCount();
}


function openAlbumPreview(
    imagePath
) {
    const modal = document.getElementById(
        "album-preview-modal"
    );

    const image = document.getElementById(
        "album-preview-image"
    );

    const favoriteButton =
        document.getElementById(
            "album-preview-favorite"
        );

    previewImagePath = imagePath;

    image.src = toFileUrl(
        imagePath
    );

    updateFavoriteButton(
        favoriteButton,
        imagePath
    );

    modal.classList.add(
        "active"
    );
}

function closeAlbumPreview() {
    const modal = document.getElementById(
        "album-preview-modal"
    );

    const image = document.getElementById(
        "album-preview-image"
    );

    modal.classList.remove(
        "active"
    );

    image.removeAttribute(
        "src"
    );

    previewImagePath = null;
}


function toggleAlbumFavorite(
    imagePath
) {
    deps.onToggleFavorite(
        imagePath
    );

    deps.albumGrid
        .querySelectorAll(
            ".album-image-item"
        )
        .forEach(
            item => {
                const image =
                    item.querySelector(
                        ".album-image"
                    );

                const button =
                    item.querySelector(
                        ".album-favorite-btn"
                    );

                if (
                    image &&
                    button &&
                    image.src === toFileUrl(
                        imagePath
                    )
                ) {
                    updateFavoriteButton(
                        button,
                        imagePath
                    );
                }
            }
        );

    if (
        previewImagePath === imagePath
    ) {
        const previewFavoriteButton =
            document.getElementById(
                "album-preview-favorite"
            );

        updateFavoriteButton(
            previewFavoriteButton,
            imagePath
        );
    }

    updateSelectedCount();
}


function updateFavoriteButton(
    button,
    imagePath
) {

    const selected =
        deps.isFavorite(
            imagePath
        );

    button.classList.toggle(
        "selected",
        selected
    );

    button.setAttribute(
        "aria-pressed",
        String(selected)
    );
}


export function updateSelectedCount() {

    const count =
        deps.getSelectedImagePaths()
            .length;

    deps.albumSelectedCount.innerHTML =
        `
            <span class="album-selected-label">
                선택한 사진
            </span>

            <strong class="album-selected-number">
                ${count}장
            </strong>
        `;
}


export function updateAlbumTimer(
    remainingSeconds
) {

    const safeSeconds =
        Math.max(
            0,
            remainingSeconds
        );

    const minutes =
        String(
            Math.floor(
                safeSeconds / 60
            )
        ).padStart(
            2,
            "0"
        );

    const seconds =
        String(
            safeSeconds % 60
        ).padStart(
            2,
            "0"
        );

    deps.albumTimer.innerText =
        `${minutes}:${seconds}`;
}


export function clearAlbumView() {

    closeAlbumPreview();

    deps.albumGrid.innerHTML =
        "";

    deps.albumSelectedCount.innerHTML =
        `
            <span class="album-selected-label">
                선택한 사진
            </span>

            <strong class="album-selected-number">
                0장
            </strong>
        `;

    deps.albumTimer.innerText =
        "00:00";
}


function toFileUrl(
    filePath
) {

    const normalizedPath =
        filePath.replace(
            /\\/g,
            "/"
        );

    return encodeURI(
        `file:///${normalizedPath}`
    );
}