@'
# Live View

## Purpose

LIVE_VIEW는
사용자가 촬영 전에
Nikon 카메라의 현재 화면을
실시간으로 확인하기 위한 기능이다.

LIVE_VIEW는
촬영 결과를 생성하지 않는다.

LIVE_VIEW는
사진 저장 기능이 아니다.

---

## Responsibility

LIVE_VIEW가 담당하는 것은
다음과 같다.

- 라이브뷰 시작
- 라이브뷰 화면 표시
- 라이브뷰 중지
- 라이브뷰 연결 상태 관리
- 라이브뷰 재연결 처리
- 화면 비율 및 표시 방식 관리

LIVE_VIEW는
다음을 담당하지 않는다.

- 실제 사진 촬영
- 촬영 요청
- 촬영 완료 판단
- Nikon 원본 저장
- Session 사진 저장
- 촬영 결과 썸네일 생성
- 자동 타이머 정책
- 물리 셔터 정책

---

## Display Only

LIVE_VIEW는
오직 화면 표시를 위한 기능이다.

라이브뷰 프레임은
실제 Nikon 촬영 결과가 아니다.

따라서 라이브뷰 프레임을
촬영 원본으로 취급하지 않는다.

---

## Capture Boundary

LIVE_VIEW와
실제 촬영은
완전히 분리한다.

라이브뷰:

사용자가
현재 카메라 화면을 확인

실제 촬영:

Nikon 카메라가
실제 사진 파일 생성

이 두 기능을
하나의 촬영 기능으로 합치지 않는다.

---

## No Screen Capture

LIVE_VIEW 화면을
Canvas 또는 Screen Capture 방식으로 저장하여

DSLR 촬영 결과처럼
사용하지 않는다.

다음 용도로 사용하지 않는다.

- Nikon 원본 대체
- Session 최종 사진
- DSLR 촬영 완료 판단
- 실제 촬영 썸네일 원본

---

## Thumbnail Boundary

촬영 완료 후 표시되는 썸네일은
LIVE_VIEW 화면을 사용하지 않는다.

썸네일은
실제 Nikon 촬영 결과 파일을 사용한다.

LIVE_VIEW는
썸네일 생성 책임을 가지지 않는다.

---

## Camera Engine

현재 LIVE_VIEW는
digiCamControl 또는
카메라 제어 환경을 통해
제공될 수 있다.

구체적인 라이브뷰 구현 방식은
교체 가능해야 한다.

차후

- digiCamControl Live View
- Nikon SDK
- 다른 Camera Engine

으로 변경되더라도

Page,

Capture Feature,

Thumbnail Feature

전체를 다시 작성하지 않는 것을 목표로 한다.

---

## Renderer Boundary

LIVE_VIEW의 사용자 화면 표현은
Renderer에서 담당한다.

하지만

카메라 제어 엔진과의
실제 연결 처리는

Service 계층에서 담당한다.

Renderer가
외부 프로그램 실행이나
카메라 제어 API를
직접 호출하지 않는다.

---

## Start

촬영 화면이 활성화되면

필요한 경우
LIVE_VIEW를 시작한다.

LIVE_VIEW가 정상적으로 준비되면
사용자에게 현재 카메라 화면을 표시한다.

LIVE_VIEW 시작 실패가
실제 Nikon 카메라 촬영 완료로
처리되어서는 안 된다.

---

## Stop

촬영 Session이 종료되거나

촬영 화면을 벗어나면

LIVE_VIEW를 중지할 수 있다.

LIVE_VIEW 종료는
Session 저장 결과를 변경하지 않는다.

---

## Reconnect

라이브뷰 연결이 끊긴 경우

LIVE_VIEW는
재연결을 시도할 수 있다.

재연결 중에는
현재 상태를 사용자에게 표시할 수 있다.

LIVE_VIEW 재연결 정책이
촬영 결과 파일 처리와
섞이지 않도록 한다.

---

## Connection State

LIVE_VIEW는
다음과 같은 상태를 가질 수 있다.

STOPPED

STARTING

READY

RECONNECTING

ERROR

상태 흐름 예:

STOPPED

↓

STARTING

↓

READY

연결 문제 발생:

READY

↓

RECONNECTING

↓

READY

또는

ERROR

---

## Capture Independence

LIVE_VIEW가

READY 상태라고 해서
실제 촬영이 성공한다는 의미는 아니다.

반대로

실제 Nikon 촬영 파일이
정상적으로 PC에 저장되었다면

LIVE_VIEW 화면 상태와 관계없이
실제 촬영 결과로 처리할 수 있다.

라이브뷰 상태와
촬영 완료 상태를
동일한 상태로 관리하지 않는다.

---

## Mirror

사용자 편의를 위해
LIVE_VIEW 화면을
좌우 반전하여 표시할 수 있다.

좌우 반전은
화면 표현에만 적용한다.

실제 Nikon 촬영 원본 파일을
좌우 반전하여 저장하지 않는다.

---

## Aspect Ratio

LIVE_VIEW는
카메라 영상 비율과
화면 비율을 고려하여

사용자에게 자연스럽게
표시할 수 있다.

화면 크롭이나 확대는
표현을 위한 UI 동작이다.

실제 Nikon 원본의
해상도나 비율을 변경하지 않는다.

---

## Failure

LIVE_VIEW 시작 실패,

스트림 중단,

카메라 연결 끊김,

표시 오류 등이 발생하더라도

가짜 촬영 완료 이벤트를
생성하지 않는다.

LIVE_VIEW 오류는
LIVE_VIEW 오류로만 처리한다.

---

## No Business Logic

LIVE_VIEW는

몇 초마다 촬영할지,

물리 셔터를 사용할지,

현재 Session이 언제 끝나는지,

실제 촬영 결과가 언제 완료되었는지

결정하지 않는다.

LIVE_VIEW의 책임은

촬영 전
실시간 카메라 화면을
사용자에게 제공하는 것이다.

---

## Replaceability

LIVE_VIEW 구현은
외부 카메라 제어 방식과
분리되어야 한다.

차후 카메라 제어 엔진을
교체하더라도

LIVE_VIEW Feature의
외부 인터페이스를
가능하면 유지한다.

---

## Source of Truth

이 문서는
LIVE_VIEW 정책의
유일한 Source of Truth이다.

라이브뷰 상세 정책을

AUTO_TIMER,

PHYSICAL_SHUTTER,

CAPTURE_COMPLETED,

DIGICAM_CONTROL,

FILE_WATCH,

SESSION

문서에 중복 작성하지 않는다.
'@ | Set-Content `
"C:\projects\rusticastudio\docs\camera\LIVE_VIEW.md" `
-Encoding UTF8