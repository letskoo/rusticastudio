function bringWindowToForeground(
    window,
    {
        log
    } = {}
) {

    const logger =
        typeof log === "function"
            ? log
            : () => { };

    if (
        !window ||
        window.isDestroyed()
    ) {

        logger(
            "RusticaStudio 전면 복귀 실패: 윈도우 없음"
        );

        return false;
    }

    window.setAlwaysOnTop(
        true,
        "screen-saver"
    );

    window.show();

    window.focus();

    logger(
        "RusticaStudio 전면 복귀 요청 완료"
    );

    return true;
}


module.exports = {
    bringWindowToForeground
};