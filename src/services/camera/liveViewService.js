const LIVE_VIEW_URL =
    "http://127.0.0.1:5513/liveview.jpg";

let isRunning = false;

let currentImage = null;

function loadNextFrame() {

    if (
        !isRunning ||
        !currentImage
    ) {
        return;
    }

    const image = new Image();

    image.onload = () => {

        if (
            !isRunning ||
            !currentImage
        ) {
            return;
        }

        currentImage.src =
            image.src;

        requestAnimationFrame(
            loadNextFrame
        );
    };

    image.onerror = () => {

        if (!isRunning) {
            return;
        }

        setTimeout(
            loadNextFrame,
            200
        );
    };

    image.src =
        `${LIVE_VIEW_URL}?t=${Date.now()}`;
}

export function startDSLRLiveView(
    imageElement
) {

    if (!imageElement) {
        return;
    }

    stopDSLRLiveView();

    currentImage =
        imageElement;

    isRunning = true;

    loadNextFrame();
}

export function stopDSLRLiveView() {

    isRunning = false;

    currentImage = null;
}