@'
# Capture Completed

## Purpose

CAPTURE_COMPLETED는
실제 카메라 촬영이 완료된 이후의
공통 완료 처리를 담당한다.

AUTO_TIMER와
PHYSICAL_SHUTTER는

서로 다른 방식으로 촬영을 시작하지만

촬영이 완료된 이후에는
동일한 완료 흐름을 사용한다.

---

## Responsibility

CAPTURE_COMPLETED가 담당하는 것은
다음과 같다.

- 실제 촬영 완료 결과 수신
- 촬영 결과 유효성 확인
- 완료된 이미지 경로 전달
- 촬영 완료 UI 실행 요청
- 실제 이미지 썸네일 표시 요청
- 활성 촬영 Feature에 완료 결과 전달

CAPTURE_COMPLETED는
다음을 담당하지 않는다.

- 자동 카운트다운
- 물리 셔터 입력
- Nikon 카메라 직접 제어
- digiCamControl 촬영 명령
- 파일 감지 방법
- 세션 폴더 생성
- 촬영 모드 선택

---

## Completion Definition

RusticaStudio에서
촬영 완료는

촬영 명령을 보낸 순간이 아니다.

타이머가 0초가 된 순간도 아니다.

카메라 셔터 버튼을 누른 순간도 아니다.

digiCamControl에
촬영 명령 전달이 끝난 순간도 아니다.

실제 Nikon 촬영 결과가
PC에서 사용 가능한 파일로 확인된 이후에만

촬영 완료로 판단한다.

---

## Completion Input

CAPTURE_COMPLETED는
파일 감지 기능으로부터

완료된 촬영 결과를 전달받는다.

최소한 다음 정보가 존재해야 한다.

- 실제 이미지 경로

필요한 경우 차후 다음 정보가
추가될 수 있다.

- 촬영 완료 시간
- 파일 이름
- 파일 형식
- 파일 크기
- 촬영 Source

하지만 추가 정보 때문에
기본 완료 흐름이 변경되어서는 안 된다.

---

## Valid Result

촬영 완료 처리는
실제로 사용할 수 있는 이미지가
존재할 때만 시작한다.

이미지 경로가 없거나

파일을 사용할 수 없는 상태라면

정상 촬영 완료로 처리하지 않는다.

파일이 사용 가능한 상태인지
판단하는 구체적인 방법은
FILE_WATCH의 책임이다.

---

## Common Flow

촬영 완료의 기본 흐름은 다음과 같다.

실제 이미지 사용 가능

↓

CAPTURE_COMPLETED

↓

촬영 완료 Feedback

↓

실제 이미지 Thumbnail

↓

활성 촬영 Feature에 완료 전달

이 흐름은
촬영 방식과 관계없이 동일하게 사용한다.

---

## Feedback Timing

촬영 완료 Feedback은
실제 촬영 완료 이후에만 실행한다.

촬영 요청 시점에는
촬영 완료 Feedback을 실행하지 않는다.

따라서 다음 시점에는
촬영 완료 플래시를 실행하지 않는다.

- AUTO_TIMER 0초
- 촬영 명령 전송 직후
- 물리 셔터 입력 추정 시점

실제 촬영 완료 결과를 받은 이후에만
촬영 완료 Feedback을 실행한다.

---

## Thumbnail

썸네일은
실제 Nikon 촬영 결과 이미지를 사용한다.

라이브뷰 화면을 캡처하여
DSLR 촬영 결과 썸네일처럼 표시하지 않는다.

썸네일에 사용되는 이미지는
완료된 실제 촬영 이미지와
동일한 촬영 결과여야 한다.

썸네일 UI의 구체적인 표현 방법은
Thumbnail Feature의 책임이다.

---

## Capture Source

CAPTURE_COMPLETED는
촬영 방식에 종속되지 않는다.

촬영 결과는 다음과 같은
여러 촬영 Source에서 올 수 있다.

현재:

- AUTO_TIMER
- PHYSICAL_SHUTTER

차후:

- HYBRID

새로운 촬영 방식이 추가되어도
공통 완료 처리를 다시 구현하지 않는다.

---

## Notify Active Feature

공통 완료 처리가 시작되면
현재 활성 촬영 Feature가
촬영 완료 사실을 전달받을 수 있어야 한다.

AUTO_TIMER라면

촬영 완료 이후
다음 카운트다운을 진행할 수 있다.

PHYSICAL_SHUTTER라면

촬영 완료 이후
다음 물리 셔터 촬영을 기다릴 수 있다.

CAPTURE_COMPLETED가
각 촬영 Feature의 다음 동작을
직접 결정하지 않는다.

각 Feature가
자신의 정책에 따라 결정한다.

---

## Duplicate Protection

동일한 실제 촬영 결과를
두 번 이상 완료 처리하지 않는다.

하나의 촬영 파일은
하나의 CAPTURE_COMPLETED 이벤트만
발생시켜야 한다.

중복 파일 이벤트를
어떻게 제거하는지는
파일 감지 기능의 책임이다.

CAPTURE_COMPLETED는
동일 촬영 결과에 대한
중복 완료 처리를 허용하지 않는다.

---

## Failure Boundary

촬영 요청이 존재했더라도

실제 촬영 결과가 확인되지 않았다면

CAPTURE_COMPLETED를 발생시키지 않는다.

촬영 실패를
가짜 완료 이벤트로 변환하지 않는다.

실패는 성공과
별도의 결과로 처리한다.

---

## UI Boundary

CAPTURE_COMPLETED는
완료 시점을 결정하고
필요한 UI Feature에 결과를 전달한다.

CAPTURE_COMPLETED 자체가
DOM 구조나 CSS 구현을 소유하지 않는다.

화면 표현은
각 UI Block 또는 Feature의 책임이다.

---

## Independence

CAPTURE_COMPLETED는

AUTO_TIMER의 내부 상태를 알지 않는다.

PHYSICAL_SHUTTER의 내부 상태를 알지 않는다.

digiCamControl의 내부 구현을 알지 않는다.

파일 감지 구현도 알지 않는다.

CAPTURE_COMPLETED는

유효한 실제 촬영 결과를 입력받아
공통 완료 처리를 수행하는 것만 책임진다.

---

## Source of Truth

이 문서는
촬영 완료 공통 정책의
유일한 Source of Truth이다.

촬영 완료의 상세 정책을
AUTO_TIMER,

PHYSICAL_SHUTTER,

DIGICAM_CONTROL,

FILE_WATCH

문서에 중복 작성하지 않는다.
'@ | Set-Content `
"C:\projects\rusticastudio\docs\capture\CAPTURE_COMPLETED.md" `
-Encoding UTF8