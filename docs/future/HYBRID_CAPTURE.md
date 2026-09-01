@'
# Hybrid Capture

## Purpose

HYBRID_CAPTURE는
차후 RusticaStudio에서 사용할
혼합 촬영 방식의 정책을 정의한다.

HYBRID_CAPTURE에서는

자동 타이머 촬영과
사용자의 물리 셔터 촬영을

하나의 Session 안에서
함께 사용할 수 있다.

HYBRID_CAPTURE는
V2에서는 활성화하지 않는다.

---

## Version Boundary

현재 V2에서는
다음 두 촬영 모드만 사용한다.

AUTO_TIMER

PHYSICAL_SHUTTER

사용자는
둘 중 하나를 선택한다.

HYBRID_CAPTURE는
V2 안정화 이후
추가하는 미래 기능이다.

---

## Core Principle

HYBRID_CAPTURE의 핵심 규칙은 다음과 같다.

자동 타이머가 진행 중이더라도

사용자가 Nikon 카메라의
물리 셔터를 직접 눌러
촬영할 수 있다.

물리 셔터 촬영 결과가
정상적으로 완료되면

자동 촬영 타이머를
처음부터 다시 시작한다.

---

## Example

자동 촬영 간격이
10초라고 가정한다.

흐름:

10

↓

9

↓

8

↓

7

↓

사용자가 물리 셔터 촬영

↓

실제 Nikon 사진 생성

↓

정상 저장 완료

↓

자동 타이머 Reset

↓

10

↓

9

↓

8

↓

계속 진행

---

## Reset Timing

물리 셔터가 눌렸다고 추정되는 순간

자동 타이머를
즉시 Reset하지 않는다.

실제 Nikon 촬영 결과가

FILE_WATCH

↓

SESSION

↓

CAPTURE_COMPLETED

과정을 정상적으로 통과한 이후

자동 타이머를 Reset한다.

---

## Why Completion Based Reset

물리 셔터 입력 자체를
RusticaStudio가 직접 감지하지 못할 수 있다.

또한 셔터가 눌렸다고 해도

실제 사진이
PC에 정상적으로 전달되지 않을 수 있다.

따라서 HYBRID_CAPTURE에서는

실제 촬영 결과 완료를
타이머 Reset 기준으로 사용한다.

---

## Auto Capture

자동 타이머가
정상적으로 0에 도달하면

AUTO_TIMER와 동일한 방식으로
촬영 요청을 발생시킨다.

흐름:

AUTO_TIMER

↓

DIGICAM_CONTROL

↓

digiCamControl

↓

Nikon Camera

↓

실제 사진

↓

FILE_WATCH

↓

SESSION

↓

CAPTURE_COMPLETED

---

## Physical Capture

자동 타이머가 진행 중이어도

사용자는 Nikon 카메라의
물리 셔터를 사용할 수 있다.

흐름:

사용자

↓

Nikon 물리 셔터

↓

실제 사진

↓

digiCamControl Capture Source

↓

FILE_WATCH

↓

SESSION

↓

CAPTURE_COMPLETED

---

## Common Completion Pipeline

AUTO_TIMER 촬영과

PHYSICAL_SHUTTER 촬영은

촬영 시작 방식만 다르다.

실제 사진이 생성된 이후에는
동일한 완료 Pipeline을 사용한다.

실제 Nikon Image

↓

FILE_WATCH

↓

SESSION

↓

CAPTURE_COMPLETED

↓

CAPTURE_FLASH

THUMBNAIL

---

## Timer Reset

HYBRID_CAPTURE에서

정상적인 촬영 결과가
CAPTURE_COMPLETED까지 도달하면

자동 타이머는
전체 촬영 간격으로 Reset된다.

예:

captureIntervalSeconds = 10

촬영 완료

↓

Timer = 10

다시 Countdown 시작

---

## Auto Capture Reset

자동 타이머에 의해
촬영된 경우에도

정상 촬영 완료 이후
다음 자동 촬영을 위한
새로운 Countdown을 시작한다.

즉 자동 촬영 주기는

촬영 명령 시점이 아니라

이전 실제 촬영 완료 시점을 기준으로
다시 시작할 수 있다.

---

## No Overlapping Capture

이전 촬영 결과가
아직 완료되지 않은 상태에서

새로운 자동 촬영 요청을
중복 발생시키지 않는다.

촬영 처리 중에는

다음 자동 촬영 요청을
잠시 대기시킬 수 있다.

이를 통해

촬영 명령 누적,

카메라 명령 Queue 누적,

촬영 지연 증가

문제를 방지한다.

---

## Capture State

HYBRID_CAPTURE는
차후 다음과 같은 상태를
사용할 수 있다.

WAITING

COUNTING

CAPTURING

COMPLETING

상태 예:

COUNTING

↓

자동 촬영 요청

↓

CAPTURING

↓

실제 사진 도착

↓

COMPLETING

↓

CAPTURE_COMPLETED

↓

COUNTING

---

## Physical Capture During Countdown

COUNTING 상태에서는

물리 셔터 촬영 결과를
허용한다.

실제 물리 셔터 사진이
FILE_WATCH에 감지되면

정상 촬영 결과 Pipeline을
그대로 사용한다.

완료 후
Countdown을 Reset한다.

---

## Physical Capture During Capture

자동 촬영 명령이 이미 실행되어

CAPTURING 또는
COMPLETING 상태인 경우

추가 물리 셔터 촬영이 발생할 가능성을
고려해야 한다.

이 상황의 상세 충돌 정책은

HYBRID_CAPTURE 구현 단계에서
실제 digiCamControl과 Nikon 동작을
검증한 뒤 확정한다.

V2에서는
이 동시 촬영 정책을 구현하지 않는다.

---

## Completion Identity

HYBRID_CAPTURE에서는

AUTO_TIMER로 촬영했는지

PHYSICAL_SHUTTER로 촬영했는지

가능한 경우 구분할 수 있다.

하지만 실제 파일 저장과

CAPTURE_COMPLETED의 기본 동작은
촬영 출처에 의존하지 않는다.

필요한 경우 차후
Capture Result에 다음 정보를 추가할 수 있다.

captureSource

예:

AUTO_TIMER

PHYSICAL_SHUTTER

---

## Flash

자동 촬영과
물리 셔터 촬영 모두

정상 CAPTURE_COMPLETED 이후

동일한 CAPTURE_FLASH를 사용한다.

HYBRID_CAPTURE가
Flash UI를 직접 구현하지 않는다.

---

## Thumbnail

자동 촬영과
물리 셔터 촬영 모두

정상 CAPTURE_COMPLETED 이후

동일한 THUMBNAIL을 사용한다.

실제 Nikon 촬영 결과를
Thumbnail Source로 사용한다.

HYBRID_CAPTURE가
Thumbnail UI를 직접 구현하지 않는다.

---

## Session

AUTO_TIMER 촬영과

PHYSICAL_SHUTTER 촬영은

같은 활성 Session 안에서
저장될 수 있다.

촬영 방식 때문에
별도의 Session Folder를 만들지 않는다.

---

## Settings

차후 HYBRID_CAPTURE가
정식 기능이 되면

SETTINGS의 captureMode에

HYBRID

값을 추가할 수 있다.

예:

AUTO_TIMER

PHYSICAL_SHUTTER

HYBRID

V2에서는
HYBRID 값을 활성화하지 않는다.

---

## Architecture Requirement

V2 구현 단계부터

AUTO_TIMER가

THUMBNAIL,

CAPTURE_FLASH,

FILE_WATCH,

SESSION

구현을 직접 소유하지 않도록 한다.

PHYSICAL_SHUTTER 역시

이 기능들을 직접 소유하지 않는다.

공통 완료 Pipeline을 사용해야

차후 HYBRID_CAPTURE를 추가할 때
기존 기능을 다시 작성하지 않을 수 있다.

---

## No V2 Implementation

이 문서는
미래 구조를 위한 설계 문서이다.

V2 개발 중

HYBRID_CAPTURE를
부분적으로 구현하지 않는다.

V2에서는 먼저

AUTO_TIMER

PHYSICAL_SHUTTER

각 모드를 독립적으로
완전히 안정화한다.

---

## Activation Condition

HYBRID_CAPTURE 구현은

다음 기능이 모두 안정화된 이후
진행한다.

- AUTO_TIMER
- PHYSICAL_SHUTTER
- DIGICAM_CONTROL
- FILE_WATCH
- SESSION
- CAPTURE_COMPLETED
- CAPTURE_FLASH
- THUMBNAIL

기본 촬영 Pipeline이
안정되지 않은 상태에서

HYBRID_CAPTURE를 먼저 추가하지 않는다.

---

## Source of Truth

이 문서는
미래 HYBRID_CAPTURE 정책의
유일한 Source of Truth이다.

HYBRID 상세 정책을

AUTO_TIMER,

PHYSICAL_SHUTTER,

CAPTURE_COMPLETED,

SETTINGS

문서에 중복 작성하지 않는다.
'@ | Set-Content `
"C:\projects\rusticastudio\docs\future\HYBRID_CAPTURE.md" `
-Encoding UTF8