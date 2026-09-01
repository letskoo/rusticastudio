@'
# Settings

## Purpose

SETTINGS는
RusticaStudio의 사용자 설정을 관리한다.

설정값은
각 Feature가 자신의 동작을 결정할 때
사용할 수 있도록 제공한다.

SETTINGS는
각 Feature의 Business Logic을
직접 실행하지 않는다.

---

## Responsibility

SETTINGS가 담당하는 것은
다음과 같다.

- 설정값 저장
- 설정값 불러오기
- 설정값 기본값 관리
- 설정값 유효성 확인
- 촬영 모드 설정
- 자동 촬영 간격 설정
- Session 기본 저장 위치 설정
- Album 사용 여부 설정
- Album 선택 제한시간 설정
- 기타 사용자 설정 관리

SETTINGS는
다음을 담당하지 않는다.

- 자동 카운트다운 실행
- 실제 카메라 촬영
- 물리 셔터 처리
- 파일 감지
- Session 생성
- 촬영 완료 처리
- 썸네일 표시

---

## Capture Mode

V2에서는
다음 두 가지 촬영 모드를 지원한다.

AUTO_TIMER

PHYSICAL_SHUTTER

사용자는
둘 중 하나를 선택한다.

동시에 두 촬영 모드를
활성화하지 않는다.

---

## Capture Mode Value

촬영 모드 설정값은
하나의 값으로 관리한다.

예:

AUTO_TIMER

또는

PHYSICAL_SHUTTER

다음과 같이
각 모드를 별도의 Boolean으로
관리하지 않는다.

autoTimerEnabled = true

physicalShutterEnabled = false

이 방식은
서로 충돌하는 상태를
만들 수 있기 때문이다.

촬영 모드는
단일 값으로 관리한다.

---

## Capture Mode Ownership

현재 어떤 촬영 방식을 사용할지는
SETTINGS의 captureMode 값으로 결정한다.

하지만

AUTO_TIMER의 동작 방식은
AUTO_TIMER가 소유한다.

PHYSICAL_SHUTTER의 동작 방식은
PHYSICAL_SHUTTER가 소유한다.

SETTINGS는
촬영 모드를 선택할 뿐

각 촬영 방식의
내부 정책을 구현하지 않는다.

---

## Auto Timer Setting

AUTO_TIMER 모드에서 사용할
촬영 간격을 설정할 수 있다.

설정값 예:

captureIntervalSeconds

이 값은

AUTO_TIMER Feature가
카운트다운을 구성할 때 사용한다.

SETTINGS가
카운트다운을 직접 실행하지 않는다.

---

## Physical Shutter Setting

PHYSICAL_SHUTTER 모드는
자동 촬영 간격을 사용하지 않는다.

captureMode가

PHYSICAL_SHUTTER인 경우

자동 타이머 촬영을
실행하지 않는다.

captureIntervalSeconds 값이
저장되어 있더라도

PHYSICAL_SHUTTER의 촬영 시점을
결정하는 데 사용하지 않는다.

---

## Mode Isolation

V2에서는
촬영 모드 간 완전한 분리를 원칙으로 한다.

captureMode가

AUTO_TIMER이면

AUTO_TIMER만 활성화한다.

PHYSICAL_SHUTTER이면

PHYSICAL_SHUTTER만 활성화한다.

AUTO_TIMER 상태에서
물리 셔터 촬영을
자동 타이머 기능에 합치지 않는다.

PHYSICAL_SHUTTER 상태에서
자동 카운트다운을 실행하지 않는다.

---

## Mode Change

촬영 모드 변경은
활성 촬영 Session 도중
즉시 적용하지 않는 것을 원칙으로 한다.

현재 Session은
시작 당시 선택된 촬영 모드를 유지한다.

변경된 촬영 모드는
다음 Session부터 적용한다.

이를 통해

진행 중인 촬영 상태가
중간에 다른 촬영 정책으로
변경되는 것을 방지한다.

---

## Session Snapshot

Session이 시작될 때

해당 Session에서 필요한 설정값을
확정하여 사용할 수 있다.

Session 진행 중
관리자 설정값이 변경되더라도

현재 Session의 핵심 촬영 정책을
중간에 변경하지 않는 것을 원칙으로 한다.

---

## Base Save Path

사용자는
최종 촬영 결과를 저장할
기본 경로를 설정할 수 있다.

설정값 예:

baseSavePath

SESSION은
이 값을 사용하여

새로운 Session Folder를 생성한다.

SETTINGS는
Session Folder 자체를 생성하지 않는다.

---

## Capture Source Boundary

Capture Source는

digiCamControl 또는
카메라 제어 환경에서

실제 Nikon 촬영 파일이
처음 생성되는 위치이다.

Base Save Path는

RusticaStudio가
최종 촬영 결과를 보관하는 위치이다.

두 경로는
서로 다른 설정 개념이다.

필요한 경우
Capture Source 경로를
별도 설정값으로 관리할 수 있다.

---

## Camera Setting

카메라 및 라이브뷰에 필요한
장치 설정을 저장할 수 있다.

예:

selectedCameraId

카메라 장치 선택값과

촬영 모드 선택값을
하나의 설정으로 혼합하지 않는다.

---

## Session Duration

Session 이용 시간을
설정할 수 있다.

설정값 예:

sessionDurationMinutes

이 값은
SESSION 또는 해당 시간 관리 Feature가 사용한다.

SETTINGS가
Session Timer를 직접 실행하지 않는다.

---

## Delete Policy Boundary

촬영 결과 삭제 시간이
사용자 설정으로 필요한 경우

삭제 관련 설정값을
SETTINGS에서 저장할 수 있다.

하지만

실제 삭제 시점 계산과
파일 삭제 실행은

해당 삭제 Feature의 책임이다.

SETTINGS가
파일을 직접 삭제하지 않는다.

---

## Album Setting

촬영 종료 후
ALBUM을 사용할지 설정할 수 있다.

설정값:

albumEnabled

값:

true

false

albumEnabled가 true이면

촬영 종료 후
ALBUM Feature를 사용할 수 있다.

albumEnabled가 false이면

ALBUM을 사용하지 않고
기존 종료 흐름을 사용한다.

SETTINGS는

ALBUM 화면을 표시하거나
별표 선택을 직접 처리하지 않는다.

ALBUM의 상세 동작은
ALBUM이 소유한다.

---

## Album Timeout Setting

ALBUM을 사용하는 경우

사용자가 사진을 선택할 수 있는
제한시간을 설정할 수 있다.

설정값:

albumTimeoutMinutes

이 값은

ALBUM Feature가
선택 제한시간을 구성할 때 사용한다.

SETTINGS는

선택시간 Timer를
직접 실행하지 않는다.

선택시간 만료 이후의
완료 처리도 직접 실행하지 않는다.

---

## Restart Delay Setting

Session이 최종 완료된 후

새로운 사용자가
즉시 다시 촬영을 시작하지 못하도록

재시작 제한시간을
설정할 수 있다.

설정값:

restartDelayMinutes

이 값은 분 단위로 관리한다.

예:

3

Session이 최종 완료되어
첫 페이지로 돌아온 시점부터

restartDelayMinutes 동안

새로운 Session 시작을
허용하지 않는다.

이 정책은
Session이 종료된 원인과 관계없이
동일하게 적용한다.

예:

- 사용자가 촬영 종료를 직접 확인한 경우
- Session 시간이 자동으로 만료된 경우
- ALBUM에서 확인을 눌러 완료한 경우
- ALBUM 선택 제한시간이 자동으로 만료된 경우

모든 정상 Session 완료는

동일한 재시작 제한시간 정책을 사용한다.

albumEnabled 값과
재시작 제한시간은

서로 독립된 설정이다.

ALBUM이 활성화되어 있든
비활성화되어 있든

최종적으로 첫 페이지로 돌아온 경우

재시작 제한시간을
동일하게 적용한다.

SETTINGS는

시작 버튼을 잠그거나
Timer를 직접 실행하지 않는다.

SETTINGS는

restartDelayMinutes 값만
저장하고 제공한다.

실제 재시작 제한 상태와
새로운 Session 시작 허용 여부는

Session Feature가 관리한다.

---

## Auto Launch

RusticaStudio의
자동 실행 여부를
설정값으로 관리할 수 있다.

설정값 예:

autoLaunch

운영체제 자동 실행 적용은
해당 System Service가 담당한다.

SETTINGS가
운영체제를 직접 제어하지 않는다.

---

## Default Values

설정값이 존재하지 않는 경우

각 설정은
정의된 기본값을 사용할 수 있다.

기본값은
SETTINGS에서 한 번만 정의한다.

여러 Feature가
서로 다른 기본값을
각자 하드코딩하지 않는다.

---

## Validation

저장되는 설정값은
유효한 값인지 확인한다.

예:

captureMode는

AUTO_TIMER

또는

PHYSICAL_SHUTTER

중 하나여야 한다.

촬영 간격은
사용 가능한 숫자 범위여야 한다.

Session 시간은
사용 가능한 숫자 범위여야 한다.

albumEnabled는
Boolean 값이어야 한다.

albumTimeoutMinutes는
사용 가능한 숫자 범위여야 한다.

restartDelayMinutes는
사용 가능한 숫자 범위여야 한다.

저장 경로는
필요한 형식의 값이어야 한다.

---

## Persistence

설정값은
앱을 종료하고 다시 실행해도
유지될 수 있도록 저장한다.

저장 기술의 구체적인 구현은
Settings Service에서 담당한다.

Feature는
저장 기술을 직접 알지 않는다.

---

## Feature Access

Feature가 설정값이 필요하면

SETTINGS Service를 통해
필요한 값을 전달받는다.

Feature가

localStorage,

electron-store,

파일,

Registry

등의 실제 저장 기술에
직접 의존하지 않는다.

---

## Future Hybrid

차후 버전에서는
HYBRID 촬영 모드를
추가할 수 있다.

예:

HYBRID

하지만 V2에서는
HYBRID를 활성 촬영 모드로
사용하지 않는다.

HYBRID의 상세 정책은
HYBRID_CAPTURE에서만 정의한다.

HYBRID 추가를 위해

AUTO_TIMER 또는

PHYSICAL_SHUTTER의 기존 정책을
변경하지 않는 것을 원칙으로 한다.

---

## No Business Logic

SETTINGS는

촬영 요청을 보내지 않는다.

카운트다운을 실행하지 않는다.

카메라를 제어하지 않는다.

파일을 감지하지 않는다.

촬영 완료를 발생시키지 않는다.

SETTINGS의 책임은

설정값을
안전하고 일관되게 관리하는 것이다.

---

## Source of Truth

이 문서는
RusticaStudio 설정 정책의
유일한 Source of Truth이다.

설정의 상세 정책을

AUTO_TIMER,

PHYSICAL_SHUTTER,

SESSION,

ALBUM,

SESSION_COPY,

DIGICAM_CONTROL,

FILE_WATCH

문서에 중복 작성하지 않는다.
'@ | Set-Content `
"C:\projects\rusticastudio\docs\settings\SETTINGS.md" `
-Encoding UTF8