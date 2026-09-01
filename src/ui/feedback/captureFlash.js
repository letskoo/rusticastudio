let flashElement = null;

let flashTimer = null;


export function playCaptureFlash() {

    ensureFlashElement();

    clearTimeout(
        flashTimer
    );

    /*
        즉시 화면을 흰색으로 덮는다.
    */
    flashElement.classList.remove(
        "show"
    );

    void flashElement.offsetWidth;

    flashElement.classList.add(
        "show"
    );

    /*
        다음 프레임부터
        서서히 사라지게 한다.
    */
    requestAnimationFrame(() => {

        requestAnimationFrame(() => {

            flashElement.classList.remove(
                "show"
            );

        });
    });

    flashTimer =
        setTimeout(() => {

            flashElement.classList.remove(
                "show"
            );

            flashTimer = null;

        }, 220);
}


function ensureFlashElement() {

    if (flashElement) {
        return;
    }

    flashElement =
        document.createElement(
            "div"
        );

    flashElement.id =
        "capture-flash";

    document.body.appendChild(
        flashElement
    );
}