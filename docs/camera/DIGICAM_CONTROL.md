# digiCamControl

## Purpose

DIGICAM_CONTROL은
RusticaStudio와 digiCamControl 호환 카메라 사이의
카메라 연결 및 제어 경계이다.

RusticaStudio는
카메라 제조사나 모델별 제어 방식에
직접 의존하지 않는다.

digiCamControl이 지원하고
정상적으로 인식한 카메라를
DIGICAM_CONTROL Service를 통해 사용한다.

현재 개발 및 실제 검증 장비는
Nikon Z5이지만,
RusticaStudio의 카메라 구조를
Nikon 전용으로 제한하지 않는다.

카메라 제어가 필요한 경우
DIGICAM_CONTROL Service를 통해
digiCamControl에 요청한다.

---

## Responsibility

DIGICAM_CONTROL이 담당하는 것은
다음과 같다.

- digiCamControl 사용 가능 상태 확인
- digiCamControl과 호환 카메라의 연결 환경 사용
- RusticaStudio의 촬영 요청 전달
- 호환 카메라 촬영 실행 환경 제공
- 카메라 촬영 결과의 PC 전달 환경 제공

DIGICAM_CONTROL은
다음을 담당하지 않는다.

- 자동 타이머 정책
- 물리 셔터 정책
- 촬영 모드 선택
- 세션 시간 관리
- 촬영 완료 UI
- 플래시 애니메이션
- 썸네일 UI
- RusticaStudio 화면 전환

---

## Camera Boundary

RusticaStudio는
카메라 제조사나 모델별 제어 방식을
직접 구현하지 않는다.

기본 제어 흐름은 다음과 같다.

RusticaStudio

↓

DIGICAM_CONTROL Service

↓

digiCamControl

↓

digiCamControl Compatible Camera

RusticaStudio의 Feature가
카메라 제조사별 제어 구현에
직접 의존하지 않도록 한다.

---

## Auto Timer Capture

AUTO_TIMER에서
촬영 시점이 되면

AUTO_TIMER는
촬영 요청만 발생시킨다.

실제 촬영 요청 전달은
DIGICAM_CONTROL Service가 담당한다.

흐름:

AUTO_TIMER

↓

촬영 요청

↓

DIGICAM_CONTROL Service

↓

digiCamControl

↓

digiCamControl Compatible Camera

AUTO_TIMER가
digiCamControl 실행 파일이나
명령 형식을 직접 알지 않는다.

---

## Physical Shutter Capture

PHYSICAL_SHUTTER에서는
RusticaStudio가
자동 촬영 명령을 발생시키지 않는다.

사용자가 연결된 카메라의
물리 셔터를 직접 누른다.

digiCamControl은
호환 카메라와 연결된 상태에서
촬영 결과를 PC로 전달할 수 있는
카메라 제어 환경을 제공한다.

PHYSICAL_SHUTTER Feature는
digiCamControl에 촬영 명령을 보내지 않는다.

---

## Capture Request

DIGICAM_CONTROL Service가
촬영 명령을 성공적으로 전달했다고 해서

RusticaStudio는
촬영 완료로 판단하지 않는다.

촬영 요청 성공과
실제 촬영 완료는
서로 다른 결과이다.

촬영 요청 성공은

카메라 제어 엔진에
요청을 전달했다는 의미만 가진다.

---

## Capture Completion Boundary

DIGICAM_CONTROL은
RusticaStudio의
촬영 완료 정책을 소유하지 않는다.

실제 촬영 결과가
PC에서 사용 가능한 상태인지 판단하는 것은
다른 기능의 책임이다.

DIGICAM_CONTROL은
촬영 명령 완료를

CAPTURE_COMPLETED로
직접 변환하지 않는다.

---

## File Boundary

DIGICAM_CONTROL은
RusticaStudio 세션 파일 관리 정책을
소유하지 않는다.

촬영 결과 파일을

어떤 폴더에서 감지하는지,

어떤 이름으로 관리하는지,

언제 사용 가능한 파일로 판단하는지는

FILE_WATCH 및
파일 관련 Service의 책임이다.

---

## Live View Boundary

라이브뷰의 사용자 화면과
촬영 결과 이미지는
서로 다른 목적을 가진다.

라이브뷰는
사용자가 촬영 전 화면을 확인하기 위한 기능이다.

실제 촬영 결과는
연결된 카메라가 촬영한 이미지 파일이다.

라이브뷰 프레임을 캡처하여
카메라 촬영 원본으로 사용하지 않는다.

라이브뷰의 상세 정책은
LIVE_VIEW의 책임이다.

---

## Process Boundary

digiCamControl 실행,
명령 실행,
프로세스 상태 확인 등
운영체제 수준의 처리는
DIGICAM_CONTROL Service 내부에서 처리한다.

RusticaStudio 시작 시
digiCamControl Process Service가
digiCamControl 실행을 요청한다.

digiCamControl 실행 후에는
WebServer가 실제 요청을 받을 수 있는 상태가 될 때까지
준비 상태를 확인한다.

WebServer 준비가 확인되어도
즉시 Live View를 시작하지 않는다.

digiCamControl과 연결 카메라의
초기화가 안정적으로 완료될 수 있도록
8초의 초기화 대기 시간을 가진다.

초기화 대기 후
digiCamControl의 카메라 목록을 확인하여
digiCamControl이 지원하는 카메라가
실제 연결되고 정상적으로 인식된 상태인지 확인한다.

카메라 연결이 확인된 뒤에만
digiCamControl에
Live View 시작을 요청한다.

Live View 시작 명령에는
강제 종료 시간을 두지 않는다.

Live View 초기화 중
digiCamControl의 명령 통신이
불필요하게 중단되지 않도록 한다.

Live View 시작 명령이
성공적으로 전달되었다는 사실만으로
Live View READY로 판단하지 않는다.

RusticaStudio는
`/liveview.jpg`에서
실제 이미지 데이터가 전달되는 것을 확인한 뒤
Live View가 준비된 것으로 판단한다.

실제 이미지가 확인되지 않으면
Live View 재시작을 시도한 뒤
다시 실제 이미지 상태를 확인한다.

Live View READY가 확인되면
RusticaStudio 메인 창을
고객 화면의 최상위로 복귀시킨다.

RusticaStudio는
Windows 작업표시줄과
digiCamControl 화면이
고객 화면 위에 노출되지 않도록
전면 표시 레벨을 유지한다.

RusticaStudio 종료 시에는
DSLR 파일 감시를 종료한 뒤
digiCamControl 프로세스도 종료한다.

Renderer Feature가
직접 외부 프로그램을 실행하지 않는다.

필요한 통신은
Electron의 Main Process와
안전한 IPC 경계를 통해 수행한다.

---

## Failure

다음과 같은 상황은
DIGICAM_CONTROL 실패로 처리할 수 있다.

- digiCamControl을 찾을 수 없음
- digiCamControl 실행 실패
- 촬영 명령 전달 실패
- 카메라 제어 요청 실패

실패를
촬영 성공으로 변환하지 않는다.

DIGICAM_CONTROL 실패가 발생해도
가짜 CAPTURE_COMPLETED 이벤트를
생성하지 않는다.

---

## Replaceability

DIGICAM_CONTROL Service는
외부 카메라 제어 엔진을
격리하기 위한 경계이기도 하다.

차후 카메라 제어 엔진이

다른 프로그램,

공식 SDK,

또는 다른 방식으로 변경되더라도

AUTO_TIMER,

PHYSICAL_SHUTTER,

CAPTURE_COMPLETED,

UI

전체를 다시 작성하지 않는 것을 목표로 한다.

---

## No Business Logic

DIGICAM_CONTROL Service에는
촬영 서비스의 Business Policy를 넣지 않는다.

다음과 같은 정책을
DIGICAM_CONTROL에서 결정하지 않는다.

- 몇 초마다 촬영할 것인가
- 어떤 촬영 모드를 사용할 것인가
- 촬영 후 몇 초 동안 썸네일을 보여줄 것인가
- 세션을 언제 종료할 것인가
- 다음 촬영을 언제 시작할 것인가

DIGICAM_CONTROL은
카메라 제어와 외부 엔진 연결만 담당한다.

---

## Source of Truth

이 문서는
digiCamControl 연결 및
카메라 제어 경계의
유일한 Source of Truth이다.

digiCamControl의 상세 책임을

AUTO_TIMER,

PHYSICAL_SHUTTER,

CAPTURE_COMPLETED,

FILE_WATCH

문서에 중복 작성하지 않는다.