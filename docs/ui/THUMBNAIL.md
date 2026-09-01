@'
# Thumbnail

## Purpose

THUMBNAIL은
완료된 실제 촬영 이미지를
사용자에게 미리 보여주는 UI 기능이다.

THUMBNAIL은
사진을 촬영하지 않는다.

THUMBNAIL은
촬영 완료를 판단하지 않는다.

THUMBNAIL은
사진을 저장하지 않는다.

---

## Responsibility

THUMBNAIL이 담당하는 것은
다음과 같다.

- 완료된 이미지 표시
- 이전 썸네일 제거
- 새로운 썸네일 표시
- 표시 시간 관리
- 표시 종료
- 연속 촬영 시 최신 이미지 갱신

THUMBNAIL은
다음을 담당하지 않는다.

- Nikon 카메라 제어
- digiCamControl 촬영 명령
- AUTO_TIMER
- PHYSICAL_SHUTTER
- 파일 감지
- 파일 저장
- Session Folder 생성
- 촬영 완료 판단

---

## Input

THUMBNAIL은
CAPTURE_COMPLETED로부터

실제 촬영 완료된
이미지 경로를 전달받는다.

기본 입력:

imagePath

imagePath는
최종적으로 정상 저장된
실제 촬영 이미지여야 한다.

---

## Image Source

THUMBNAIL의 이미지 Source는

실제 Nikon 카메라가 촬영한
이미지 파일이다.

기본 흐름:

Nikon Camera

↓

digiCamControl

↓

Capture Source

↓

FILE_WATCH

↓

SESSION

↓

최종 Session Image

↓

CAPTURE_COMPLETED

↓

THUMBNAIL

---

## No Live View Capture

LIVE_VIEW 화면을
Canvas로 캡처하여

DSLR 촬영 썸네일로
사용하지 않는다.

다음과 같은 방식은
DSLR Thumbnail Source로 사용하지 않는다.

camera.videoWidth

camera.videoHeight

canvas.drawImage(camera)

canvas.toDataURL()

이 방식으로 만들어진 이미지는

실제 Nikon 촬영 결과가 아니다.

---

## Final Session Image

THUMBNAIL은
가능하면 Capture Source의 임시 파일보다

최종 Session Folder에
정상 저장된 이미지 경로를 사용한다.

이를 통해

사용자가 보는 썸네일과

실제로 보관되는 사진이

동일한 촬영 결과임을 보장한다.

---

## Show Timing

THUMBNAIL은
촬영 요청 시점에 표시하지 않는다.

AUTO_TIMER가
0초가 된 순간에도 표시하지 않는다.

digiCamControl에
촬영 명령을 보낸 직후에도 표시하지 않는다.

실제 촬영 결과가

FILE_WATCH

↓

SESSION

↓

CAPTURE_COMPLETED

과정을 정상적으로 통과한 이후에만
표시한다.

---

## Display

새로운 imagePath를 전달받으면

THUMBNAIL은
해당 이미지를 화면에 표시한다.

표시 시간은
UI 정책에 따라 관리한다.

초기 V2 기본 표시 시간:

3초

표시 시간이 끝나면
썸네일을 숨긴다.

---

## Consecutive Capture

연속 촬영 중
새로운 촬영 결과가 들어오면

이전 썸네일 상태 때문에
새로운 사진 표시가 막혀서는 안 된다.

예:

사진 1 완료

↓

사진 1 Thumbnail

↓

사진 2 완료

↓

사진 2 Thumbnail

↓

사진 3 완료

↓

사진 3 Thumbnail

각 촬영 결과마다
최신 실제 사진을 표시한다.

---

## Display Timer Reset

이전 썸네일의
표시 종료 Timer가 남아 있는 상태에서

새로운 촬영 결과가 들어오면

기존 종료 Timer를 취소하고

새로운 이미지 기준으로
표시 시간을 다시 시작한다.

따라서 이전 사진의 Timer가

새로운 사진 Thumbnail을
중간에 숨겨서는 안 된다.

---

## Refresh

같은 UI Element에서
새로운 이미지로 변경할 때

브라우저 또는 Electron의
이미지 Cache 때문에

이전 사진이 계속 표시되지 않도록 한다.

필요한 경우

새로운 이미지 로딩을 보장하는
갱신 처리를 사용할 수 있다.

구체적인 Cache 처리 방법은
Thumbnail 구현 내부에서 결정한다.

---

## Flash Boundary

THUMBNAIL과
촬영 완료 Flash는

같은 CAPTURE_COMPLETED 결과를
사용할 수 있다.

하지만

THUMBNAIL이
Flash 애니메이션을 직접 구현하지 않는다.

Flash는
별도의 Feedback 책임으로 분리한다.

---

## Failure

imagePath가 없거나

실제 이미지를 사용할 수 없거나

이미지 로딩에 실패하면

존재하지 않는 사진을
임의로 Thumbnail로 표시하지 않는다.

LIVE_VIEW 화면으로
자동 대체하지 않는다.

---

## State

THUMBNAIL이 가질 수 있는
기본 상태는 다음과 같다.

HIDDEN

SHOWING

기본 흐름:

HIDDEN

↓

실제 촬영 결과 수신

↓

SHOWING

↓

표시 시간 종료

↓

HIDDEN

새로운 촬영 결과가 들어오면:

SHOWING

↓

새 이미지 갱신

↓

SHOWING

---

## UI Boundary

THUMBNAIL은
이미지를 보여주는 UI 책임만 가진다.

촬영 시스템의 Business State를
소유하지 않는다.

다음 상태를 관리하지 않는다.

- 현재 촬영 모드
- AUTO_TIMER 상태
- PHYSICAL_SHUTTER 상태
- Session 활성 여부
- 카메라 연결 상태

---

## Independence

THUMBNAIL은

AUTO_TIMER를 알지 않는다.

PHYSICAL_SHUTTER를 알지 않는다.

digiCamControl을 알지 않는다.

FILE_WATCH의 구현을 알지 않는다.

THUMBNAIL은

정상 완료된 imagePath를 입력받아
화면에 표시하는 것만 담당한다.

---

## Future Expansion

차후 Thumbnail UI가 변경되어도

촬영,

파일 감지,

Session 저장,

촬영 완료 정책을

수정하지 않는 것을 원칙으로 한다.

예:

- 썸네일 위치 변경
- 크기 변경
- 애니메이션 변경
- 표시 시간 변경
- 촬영 목록 표시

이러한 변경은
Thumbnail 책임 내부에서 처리한다.

---

## Source of Truth

이 문서는
THUMBNAIL 정책의
유일한 Source of Truth이다.

Thumbnail 상세 정책을

AUTO_TIMER,

PHYSICAL_SHUTTER,

CAPTURE_COMPLETED,

LIVE_VIEW,

FILE_WATCH,

SESSION

문서에 중복 작성하지 않는다.
'@ | Set-Content `
"C:\projects\rusticastudio\docs\ui\THUMBNAIL.md" `
-Encoding UTF8