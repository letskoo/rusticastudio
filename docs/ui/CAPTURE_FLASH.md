@'
# Capture Flash

## Purpose

CAPTURE_FLASH는
실제 Nikon 촬영이 정상적으로 완료되었음을
사용자에게 시각적으로 알려주는
UI Feedback 기능이다.

CAPTURE_FLASH는
사진을 촬영하지 않는다.

CAPTURE_FLASH는
촬영 완료를 판단하지 않는다.

---

## Responsibility

CAPTURE_FLASH가 담당하는 것은
다음과 같다.

- 촬영 완료 Flash 표시
- Flash 애니메이션 시작
- Flash 애니메이션 종료
- 연속 촬영 시 Flash 재실행

CAPTURE_FLASH는
다음을 담당하지 않는다.

- Nikon 카메라 제어
- digiCamControl 촬영 명령
- AUTO_TIMER
- PHYSICAL_SHUTTER
- 파일 감지
- 파일 저장
- 촬영 완료 판단
- Thumbnail 표시

---

## Input

CAPTURE_FLASH는
CAPTURE_COMPLETED로부터

실제 촬영 완료 신호를
전달받는다.

촬영 완료 신호가 없는 상태에서는
Flash를 실행하지 않는다.

---

## Trigger Timing

CAPTURE_FLASH는
실제 Nikon 촬영 결과가

FILE_WATCH

↓

SESSION

↓

CAPTURE_COMPLETED

과정을 정상적으로 통과한 이후에만
실행한다.

---

## No Request Flash

촬영 요청 시점에는
CAPTURE_FLASH를 실행하지 않는다.

다음 시점에는
Flash를 실행하지 않는다.

- AUTO_TIMER 0초
- 촬영 요청 발생
- digiCamControl 명령 실행 시작
- digiCamControl 명령 반환
- 물리 셔터 입력 추정 시점

이 시점들은
실제 촬영 완료를 의미하지 않는다.

---

## Completion Flash

기본 흐름:

실제 Nikon 촬영

↓

실제 이미지 PC 도착

↓

FILE_WATCH

↓

SESSION 저장 성공

↓

CAPTURE_COMPLETED

↓

CAPTURE_FLASH

이 순서를 사용한다.

---

## Thumbnail Boundary

CAPTURE_FLASH와
THUMBNAIL은

동일한 CAPTURE_COMPLETED 결과에서
실행될 수 있다.

하지만 서로 독립된 UI 책임이다.

CAPTURE_FLASH가
THUMBNAIL을 직접 실행하지 않는다.

THUMBNAIL이
CAPTURE_FLASH를 직접 실행하지 않는다.

---

## Animation

Flash는
짧은 촬영 완료 Feedback으로 표시한다.

초기 V2에서는
기존 촬영 화면의
Flash 애니메이션을 재사용할 수 있다.

애니메이션의 구체적인 CSS 표현은
UI 구현에서 관리한다.

CAPTURE_FLASH 정책은
특정 CSS Class 이름에 의존하지 않는다.

---

## Consecutive Capture

연속 촬영에서는
각각의 실제 촬영 완료마다
Flash를 다시 실행할 수 있어야 한다.

예:

사진 1 완료

↓

Flash

↓

사진 2 완료

↓

Flash

↓

사진 3 완료

↓

Flash

이전 Flash 상태 때문에
다음 촬영의 Flash가
실행되지 않아서는 안 된다.

---

## Restart Animation

새로운 촬영 완료가 들어오면

이전 Flash 애니메이션 상태와 관계없이
새로운 Flash를 정상적으로
시작할 수 있어야 한다.

필요한 경우

기존 애니메이션 상태를 제거한 뒤

새로운 애니메이션을
다시 시작할 수 있다.

구체적인 DOM 처리 방법은
CAPTURE_FLASH 구현 내부에서 결정한다.

---

## Failure

촬영 요청이 실패했거나

실제 Nikon 촬영 결과가 없거나

Session 저장이 실패했다면

CAPTURE_FLASH를 실행하지 않는다.

실패를
촬영 완료처럼 표현하지 않는다.

---

## State

CAPTURE_FLASH가 가지는
기본 상태는 다음과 같다.

IDLE

FLASHING

기본 흐름:

IDLE

↓

CAPTURE_COMPLETED

↓

FLASHING

↓

애니메이션 종료

↓

IDLE

연속 완료가 들어오면
새로운 Flash를 실행할 수 있어야 한다.

---

## Capture Mode Independence

CAPTURE_FLASH는
촬영 방식에 종속되지 않는다.

현재:

- AUTO_TIMER
- PHYSICAL_SHUTTER

차후:

- HYBRID

어떤 방식으로 촬영했더라도

실제 촬영 완료 결과가
정상적으로 전달되면

동일한 Flash Feedback을 사용한다.

---

## UI Boundary

CAPTURE_FLASH는
시각적 Feedback만 담당한다.

다음 Business State를
소유하지 않는다.

- 현재 촬영 모드
- AUTO_TIMER 상태
- PHYSICAL_SHUTTER 상태
- Session 상태
- Camera 상태
- FILE_WATCH 상태

---

## Independence

CAPTURE_FLASH는

AUTO_TIMER를 알지 않는다.

PHYSICAL_SHUTTER를 알지 않는다.

digiCamControl을 알지 않는다.

FILE_WATCH 구현을 알지 않는다.

SESSION 저장 구현을 알지 않는다.

CAPTURE_FLASH는

정상적인 촬영 완료 신호를 입력받아
Flash를 표시하는 것만 담당한다.

---

## Future Expansion

차후 촬영 완료 Feedback이 변경되더라도

촬영,

파일 감지,

Session 저장,

촬영 완료 정책을

수정하지 않는 것을 원칙으로 한다.

예:

- Flash 색상 변경
- Flash 지속시간 변경
- 화면 전체 Flash
- 테두리 Flash
- 다른 완료 애니메이션

이러한 변경은
CAPTURE_FLASH 책임 내부에서 처리한다.

---

## Source of Truth

이 문서는
CAPTURE_FLASH 정책의
유일한 Source of Truth이다.

Flash 상세 정책을

AUTO_TIMER,

PHYSICAL_SHUTTER,

CAPTURE_COMPLETED,

THUMBNAIL,

FILE_WATCH,

SESSION

문서에 중복 작성하지 않는다.
'@ | Set-Content `
"C:\projects\rusticastudio\docs\ui\CAPTURE_FLASH.md" `
-Encoding UTF8