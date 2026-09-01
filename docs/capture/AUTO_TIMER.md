@'
# Auto Timer Capture

## Purpose

AUTO_TIMER는
RusticaStudio가 정해진 촬영 간격에 따라
자동으로 촬영을 요청하는 기능이다.

AUTO_TIMER는
촬영 시점을 결정한다.

AUTO_TIMER는
실제 카메라 제어를 직접 수행하지 않는다.

AUTO_TIMER는
실제 사진 파일을 직접 처리하지 않는다.

---

## Responsibility

AUTO_TIMER가 담당하는 것은 다음과 같다.

- 촬영 간격 관리
- 카운트다운 진행
- 0초 도달 판단
- 촬영 요청
- 촬영 완료 대기
- 촬영 완료 후 다음 카운트다운 시작

AUTO_TIMER는 다음을 담당하지 않는다.

- Nikon 카메라 직접 제어
- digiCamControl 직접 실행
- 사진 파일 감지
- 사진 파일 저장
- 썸네일 생성
- 촬영 완료 플래시
- 물리 셔터 처리

---

## Start

AUTO_TIMER 모드가 시작되면
설정된 촬영 간격을 읽는다.

촬영 간격을 기준으로
카운트다운을 시작한다.

예:

촬영 간격이 10초라면

10

↓

9

↓

8

↓

...

↓

1

↓

0

---

## Zero

카운트다운이 0에 도달하면
촬영 요청을 발생시킨다.

0초는

촬영 완료 시점이 아니다.

0초는

촬영 요청 시점이다.

따라서 0초에 다음 동작을 실행하지 않는다.

- 촬영 완료 플래시
- 실제 사진 썸네일 표시
- 촬영 완료 처리
- 다음 촬영 카운트다운 즉시 시작

---

## Capture Request

0초에 AUTO_TIMER는
촬영 요청을 한 번만 발생시킨다.

촬영 요청 이후에는
촬영 완료 상태를 기다린다.

AUTO_TIMER가 직접
digiCamControl을 실행하지 않는다.

실제 카메라 촬영 요청은
촬영 Service에 위임한다.

---

## Waiting State

촬영 요청이 발생하면
AUTO_TIMER는 대기 상태가 된다.

상태:

WAITING_CAPTURE

WAITING_CAPTURE 상태에서는
새로운 자동 촬영 요청을 발생시키지 않는다.

카운트다운도 다시 시작하지 않는다.

실제 촬영이 완료될 때까지 기다린다.

---

## Capture Completed

실제 촬영 완료가 확인되면
AUTO_TIMER는 해당 촬영이 끝난 것으로 판단한다.

촬영 완료의 판단 기준과
완료 후 UI 처리는
AUTO_TIMER의 책임이 아니다.

AUTO_TIMER는
촬영 완료 신호만 전달받는다.

---

## Restart

촬영 완료 신호를 받은 뒤
다음 촬영 카운트다운을 시작한다.

예:

10

↓

...

↓

0

↓

촬영 요청

↓

WAITING_CAPTURE

↓

실제 촬영 완료

↓

10

↓

9

↓

...

이 구조를 사용한다.

---

## No Overlap

하나의 자동 촬영이
완료되지 않은 상태에서

다음 자동 촬영을
시작하지 않는다.

따라서 동시에 두 개 이상의
AUTO_TIMER 촬영 요청이
존재해서는 안 된다.

---

## Failure

촬영 요청이 실패하거나
정해진 시간 안에 촬영 완료가 확인되지 않는 경우

AUTO_TIMER가 임의로
촬영 성공으로 처리하지 않는다.

실패 처리의 세부 정책은
해당 실패 처리 기능에서 정의한다.

AUTO_TIMER는
실패 결과를 전달받아
대기 상태를 종료할 수 있어야 한다.

---

## Stop

세션이 종료되거나
AUTO_TIMER 모드가 종료되면

진행 중인 카운트다운을 중지한다.

새로운 촬영 요청을 발생시키지 않는다.

이미 요청된 실제 카메라 촬영을
AUTO_TIMER가 임의로 취소하지 않는다.

---

## State

AUTO_TIMER가 소유하는 상태는
다음과 같다.

IDLE

COUNTDOWN

WAITING_CAPTURE

STOPPED

상태 흐름:

IDLE

↓

COUNTDOWN

↓

WAITING_CAPTURE

↓

COUNTDOWN

필요한 경우:

WAITING_CAPTURE

↓

IDLE

또는

모든 활성 상태

↓

STOPPED

---

## Physical Shutter Boundary

AUTO_TIMER는
물리 셔터 촬영을 처리하지 않는다.

V2 AUTO_TIMER 모드에서
물리 셔터 촬영 정책은
AUTO_TIMER에 포함하지 않는다.

물리 셔터의 동작은
PHYSICAL_SHUTTER의 책임이다.

---

## UI Boundary

AUTO_TIMER는
촬영 완료 UI를 직접 실행하지 않는다.

특히 다음 UI는
0초에 실행하지 않는다.

- 플래시 애니메이션
- 촬영 완료 애니메이션
- 실제 사진 썸네일

이 UI는
실제 촬영 완료 이후에만
별도의 촬영 완료 기능에서 처리한다.

---

## Source of Truth

이 문서는
AUTO_TIMER 촬영 정책의
유일한 Source of Truth이다.

AUTO_TIMER의 상세 정책을
다른 문서에 중복 작성하지 않는다.
'@ | Set-Content `
"C:\projects\rusticastudio\docs\capture\AUTO_TIMER.md" `
-Encoding UTF8