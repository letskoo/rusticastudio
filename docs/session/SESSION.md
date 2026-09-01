@'
# Session

## Purpose

SESSION은
한 번의 사용자 촬영 이용 단위를 관리한다.

사용자가 촬영을 시작하면
하나의 Session이 시작된다.

Session은

촬영 시작부터
촬영 종료까지

하나의 독립된 촬영 단위이다.

---

## Responsibility

SESSION이 담당하는 것은
다음과 같다.

- Session 시작
- Session 고유 저장 폴더 생성
- 현재 Session 저장 경로 관리
- Session 활성 상태 관리
- 촬영 결과의 Session 저장
- Session 종료
- Session 종료 후 상태 정리

SESSION은
다음을 담당하지 않는다.

- Nikon 카메라 제어
- digiCamControl 촬영 명령
- 자동 촬영 간격
- 물리 셔터 처리
- 파일 감지 방법
- 촬영 완료 UI
- 썸네일 UI

---

## Base Save Path

사용자는
RusticaStudio 설정에서

촬영 결과를 저장할
기본 저장 위치를 지정할 수 있다.

예:

C:\Users\User\Downloads

또는

OneDrive 동기화 폴더

등을 사용할 수 있다.

SESSION은
설정된 기본 저장 위치 아래에

각 Session의
독립 폴더를 생성한다.

---

## Session Folder

새로운 Session이 시작되면

촬영 시작 시간을 기준으로
새로운 Session Folder를 생성한다.

기본 형식:

YYYY-MM-DD-amHH-mm

또는

YYYY-MM-DD-pmHH-mm

예:

2026-08-12-pm03-25

최종 경로 예:

C:\Users\User\Downloads\2026-08-12-pm03-25

Session Folder의 이름은
Session 시작 시 한 번 결정한다.

Session 진행 중에는
폴더 이름을 변경하지 않는다.

---

## Unique Session Folder

동일한 이름의 Session Folder가
이미 존재하는 경우에도

기존 Session 데이터를
덮어쓰지 않는다.

새로운 Session은
반드시 고유한 저장 위치를 가져야 한다.

고유 이름 생성의
구체적인 구현 방법은
Session Service 내부에서 처리한다.

---

## Active Session

SESSION은
현재 활성 Session을
하나만 가진다.

기본 상태:

IDLE

↓

ACTIVE

↓

ENDING

↓

IDLE

ACTIVE 상태에서는

현재 Session Folder가
반드시 존재해야 한다.

---

## Start

사용자가 촬영을 시작하면

SESSION은 먼저
새 Session Folder를 생성한다.

Session Folder 생성에 성공한 이후에만

현재 Session을
ACTIVE 상태로 전환한다.

Session Folder 생성에 실패했다면

정상 Session이 시작된 것으로
처리하지 않는다.

---

## Current Session Path

ACTIVE 상태에서는

현재 Session Folder 경로를
하나의 Session Service가 소유한다.

다른 기능은

현재 Session 저장 위치가 필요할 경우
Session Service를 통해 전달받는다.

각 Feature가
Session 경로를 별도로 저장하거나

자체적으로 Session Folder를
계산하지 않는다.

---

## Capture Source And Session Storage

카메라 촬영 결과가
처음 PC에 생성되는 위치와

RusticaStudio의
최종 Session 저장 위치는

서로 다른 개념이다.

Capture Source:

digiCamControl 또는
카메라 제어 환경에서

실제 Nikon 촬영 결과가
PC에 생성되는 위치

Session Storage:

RusticaStudio가

현재 사용자의 촬영 결과를
최종 보관하는 위치

이 두 경로를
하나의 개념으로 취급하지 않는다.

---

## Capture Flow

기본 저장 흐름은 다음과 같다.

Nikon Camera

↓

digiCamControl

↓

Capture Source

↓

FILE_WATCH

↓

파일 준비 완료

↓

현재 Session Folder에 저장

↓

CAPTURE_COMPLETED

이 흐름을 사용한다.

---

## Store Result

새로운 실제 Nikon 촬영 결과가
정상적으로 준비되면

활성 Session Folder에
해당 촬영 결과를 저장한다.

최종 Session 파일은

실제 Nikon 촬영 결과를
기반으로 한다.

라이브뷰 Canvas 이미지나
가상 캡처 이미지를

DSLR 원본 대신
Session 결과로 저장하지 않는다.

---

## Storage Completion

Capture Source에서
파일이 감지되었다는 사실만으로

Session 저장 완료로 판단하지 않는다.

현재 Session Folder에
촬영 결과를 정상적으로 저장한 이후에만

RusticaStudio의 최종 촬영 결과로
사용할 수 있다.

CAPTURE_COMPLETED에는
최종적으로 사용할 수 있는
Session 이미지 경로를 전달한다.

---

## File Name

촬영 결과 파일 이름은

기존 파일을
절대 덮어쓰지 않아야 한다.

동일한 파일 이름이
이미 Session Folder에 존재하는 경우

고유한 파일 이름을 생성한다.

파일 이름 충돌 때문에
새로운 촬영 결과를
버리지 않는다.

---

## Multiple Captures

하나의 Session에서는
여러 장의 사진을 저장할 수 있다.

예:

Session 시작

↓

사진 1 저장

↓

사진 2 저장

↓

사진 3 저장

↓

사진 4 저장

↓

Session 종료

첫 번째 사진이 저장된 이후에도

동일 Session에
계속 새로운 촬영 결과를
저장할 수 있어야 한다.

---

## Capture Mode Independence

SESSION은
촬영 방식에 종속되지 않는다.

다음 촬영 방식 모두
동일한 Session 저장 구조를 사용한다.

- AUTO_TIMER
- PHYSICAL_SHUTTER

차후:

- HYBRID

촬영 방식이 변경되어도
Session Folder 정책을
다시 구현하지 않는다.

---

## OneDrive Boundary

RusticaStudio가
OneDrive API를 직접 사용하지 않아도

사용자가
OneDrive 동기화 대상 폴더를

Base Save Path로 지정할 수 있다.

이 경우 RusticaStudio의 책임은

해당 로컬 폴더에
촬영 결과를 정상 저장하는 것까지이다.

클라우드 업로드 및 동기화는
OneDrive의 책임이다.

SESSION은
클라우드 동기화 상태를
촬영 완료 조건으로 사용하지 않는다.

---

## End

사용자가 촬영을 종료하거나

Session 시간이 종료되면

SESSION 종료 절차를 시작한다.

새로운 촬영이 시작되지 않도록 한 뒤

현재 Session 상태를 정리한다.

Session 종료 이후에는

현재 Session Folder를
활성 Session 경로로 사용하지 않는다.

---

## Late Capture Result

Session 종료 절차가 시작되는 순간

이미 실제 촬영이 진행 중이거나

PC로 파일이 전송 중일 수 있다.

이미 시작된 촬영 결과를
무조건 버리지 않는다.

Session 종료 전에 시작된
유효한 촬영 결과가 존재하는 경우

해당 결과의 저장을 완료할 수 있도록
종료 절차에서 고려한다.

구체적인 대기 및 종료 구현은
Session Service에서 관리한다.

---

## New Session

새로운 사용자가
다시 촬영을 시작하면

새로운 Session Folder를 생성한다.

이전 Session의

- 저장 경로
- 촬영 상태
- 파일 처리 상태

가 새로운 Session에
영향을 주어서는 안 된다.

---

## Failure

다음과 같은 경우

정상 Session 저장 완료로
처리하지 않는다.

- Session Folder 생성 실패
- 원본 파일 접근 실패
- Session 파일 저장 실패
- 저장 대상 경로 사용 불가

저장 실패를
촬영 저장 성공으로 변환하지 않는다.

---

## Path Ownership

Base Save Path는
설정 기능이 소유한다.

현재 Session Folder는
SESSION이 소유한다.

Capture Source는
카메라 및 파일 감지 계층에서 관리한다.

각 경로의 책임을
서로 혼합하지 않는다.

---

## No Business Logic Duplication

SESSION은

AUTO_TIMER의 카운트다운,

PHYSICAL_SHUTTER의 동작,

digiCamControl 명령,

FILE_WATCH의 감지 방법,

촬영 완료 UI

를 구현하지 않는다.

SESSION은

현재 촬영 이용 단위와
최종 촬영 결과 저장만 담당한다.

---

## Source of Truth

이 문서는
Session 및 최종 촬영 저장 정책의
유일한 Source of Truth이다.

Session 상세 정책을

AUTO_TIMER,

PHYSICAL_SHUTTER,

CAPTURE_COMPLETED,

DIGICAM_CONTROL,

FILE_WATCH

문서에 중복 작성하지 않는다.
'@ | Set-Content `
"C:\projects\rusticastudio\docs\session\SESSION.md" `
-Encoding UTF8