let deps;


export function initAlbumView(
    dependencies
) {

    deps = dependencies;
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

                    deps.onToggleFavorite(
                        imagePath
                    );

                    updateFavoriteButton(
                        favoriteButton,
                        imagePath
                    );

                    updateSelectedCount();
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