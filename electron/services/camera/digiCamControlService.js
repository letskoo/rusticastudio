const http = require(
    "http"
);


const DIGICAM_WEBSERVER_HOST =
    "127.0.0.1";

const DIGICAM_WEBSERVER_PORT =
    5513;

let logger =
    () => { };


function initDigiCamControlService({
    log
} = {}) {

    logger =
        typeof log === "function"
            ? log
            : () => { };
}


function capturePhoto() {

    return new Promise(
        resolve => {

            logger(
                "DSLR WebServer 촬영 요청"
            );

            const request =
                http.get(
                    {
                        hostname:
                            DIGICAM_WEBSERVER_HOST,

                        port:
                            DIGICAM_WEBSERVER_PORT,

                        path:
                            "/?CMD=LiveView_Capture",

                        timeout:
                            5000
                    },
                    response => {

                        response.resume();

                        if (
                            response.statusCode !==
                            200
                        ) {

                            logger(
                                `DSLR WebServer 촬영 실패: HTTP ${response.statusCode}`
                            );

                            resolve({
                                success: false,
                                reason:
                                    "WEBSERVER_CAPTURE_FAILED"
                            });

                            return;
                        }

                        logger(
                            "DSLR WebServer 촬영 요청 완료"
                        );

                        resolve({
                            success: true
                        });
                    }
                );


            request.on(
                "timeout",
                () => {

                    request.destroy();

                    logger(
                        "DSLR WebServer 촬영 요청 시간 초과"
                    );

                    resolve({
                        success: false,
                        reason:
                            "WEBSERVER_TIMEOUT"
                    });
                }
            );


            request.on(
                "error",
                error => {

                    logger(
                        `DSLR WebServer 촬영 요청 오류: ${error}`
                    );

                    resolve({
                        success: false,
                        reason:
                            "WEBSERVER_ERROR",
                        error:
                            String(error)
                    });
                }
            );
        }
    );
}


module.exports = {

    initDigiCamControlService,

    capturePhoto
};