@'
# File Watch

## Purpose

FILE_WATCH는
digiCamControl을 통해 PC에 생성되는
실제 Nikon 촬영 이미지 파일을 감지한다.

FILE_WATCH는

새로운 촬영 결과가 생성되었는지 확인하고

파일이 실제로 사용할 수 있는 상태가 된 이후

유효한 촬영 결과를
CAPTURE_COMPLETED에 전달한다.

---

## Responsibility

FILE_WATCH가 담당하는 것은
다음과 같다.

- 촬영 결과 폴더 감시
- 새로운 이미지 파일 감지
- 지원 이미지 형식 확인
- 파일 쓰기 완료 확인
- 중복 이벤트 제거
- 유효한 이미지 경로 전달

FILE_WATCH는
다음을 담당하지 않는다.

- 카메라 촬영 명령
- 자동 타이머
- 물리 셔터
- 촬영 모드 선택
- 플래시 애니메이션
- 썸네일 UI
- 다음 촬영 시작
- 세션 종료

---

## Watch Target

FILE_WATCH는
RusticaStudio가 지정한
촬영 결과 위치를 감시한다.

감시 위치는
하드코딩하지 않는다.

실제 감시 경로는
설정 또는 카메라 제어 Service로부터 전달받는다.

FILE_WATCH가
사용자의 다운로드 폴더 전체를
촬영 정책으로 간주하지 않는다.

---

## Continuous Watch

FILE_WATCH는
한 장을 감지한 뒤 종료되지 않는다.

활성 세션 동안
계속 새로운 촬영 결과를 감지할 수 있어야 한다.

예:

사진 1 생성

↓

완료 전달

↓

계속 감시

↓

사진 2 생성

↓

완료 전달

↓

계속 감시

↓

사진 3 생성

↓

완료 전달

이 흐름을 반복한다.

첫 번째 사진을 처리했다는 이유로
이후 사진을 무시하지 않는다.

---

## Existing Files

FILE_WATCH가 시작되기 전에
이미 존재하던 파일은

새로운 촬영 결과로
자동 처리하지 않는다.

Watcher 시작 이후 생성된
새로운 촬영 결과만 감지한다.

기존 사진 때문에
가짜 촬영 완료 이벤트가
발생해서는 안 된다.

---

## Supported Files

FILE_WATCH는
지원되는 이미지 파일만 처리한다.

초기 지원 대상은 다음과 같다.

- JPG
- JPEG
- PNG
- NEF

차후 필요하면
추가 형식을 지원할 수 있다.

지원 형식 변경은
FILE_WATCH에서만 관리한다.

---

## New File Detection

새로운 파일 시스템 이벤트가
발생했다고 해서

즉시 촬영 완료로 판단하지 않는다.

파일 생성 이벤트는

파일 쓰기가 시작되었다는 의미일 수도 있다.

따라서 새로운 이미지가 감지되면

FILE_WATCH는
파일이 사용 가능한 상태가 될 때까지
확인한다.

---

## File Ready

촬영 결과는
파일 쓰기가 완료된 이후에만
사용 가능한 파일로 판단한다.

FILE_WATCH는 최소한

- 파일이 실제로 존재하고
- 파일 크기가 0보다 크고
- 파일 크기가 일정 시간 안정되고
- 파일을 정상적으로 접근할 수 있는 상태

인지 확인한다.

이 조건이 충족되기 전에는

CAPTURE_COMPLETED에
파일을 전달하지 않는다.

---

## Stable File

Nikon 촬영 파일은
크기가 클 수 있다.

특히 고해상도 JPG 또는 NEF는
PC로 전송되는 동안

파일 크기가 계속 변경될 수 있다.

따라서

파일이 존재한다는 사실만으로
전송 완료를 판단하지 않는다.

일정 횟수 이상
파일 크기가 변하지 않는 상태를 확인한 뒤

안정된 파일로 판단한다.

세부 시간값은
구현에서 조정 가능하게 만든다.

---

## Duplicate Event

운영체제 또는 Watcher는

하나의 실제 파일에 대해
여러 파일 시스템 이벤트를
발생시킬 수 있다.

FILE_WATCH는

하나의 실제 촬영 결과를
한 번만 전달해야 한다.

동일한 파일에 대해

CAPTURE_COMPLETED를
두 번 이상 발생시키지 않는다.

---

## Duplicate Identity

중복 판단은
단순히

"이전에 촬영했던 파일 이름인가"

만으로 전체 세션을 판단하지 않는다.

FILE_WATCH는
현재 실제 파일 이벤트를 기준으로
중복 처리를 방지한다.

새로운 촬영 결과가
정상적으로 생성되었다면

이전 사진을 처리했다는 이유로
새 사진을 차단해서는 안 된다.

---

## File Name Reuse

카메라 또는 외부 프로그램이
파일 이름을 다시 사용할 가능성을 고려한다.

따라서 장시간 유지되는
전역 processedFiles 목록 하나에만 의존하여

같은 경로라는 이유로
새로운 촬영 결과를 영구적으로 차단하지 않는다.

중복 방지는

현재 파일 이벤트의
중복 실행을 막기 위한 용도로 사용한다.

새로운 파일 생성과
이전 처리 기록을
구분할 수 있어야 한다.

---

## Session Boundary

FILE_WATCH는
활성 세션과 연결될 수 있다.

활성 세션이 없는 경우

새로운 사진을
현재 세션 촬영 결과로
임의 처리하지 않는다.

세션이 새로 시작되면

이전 세션의 중복 처리 상태가
새 세션의 촬영을 막아서는 안 된다.

---

## Source File

FILE_WATCH가 감지하는 파일은
실제 Nikon 촬영 결과이다.

라이브뷰 Canvas 이미지나

RusticaStudio가 화면에서 생성한
가상 촬영 이미지는

DSLR 촬영 결과로 처리하지 않는다.

---

## Session Storage Boundary

FILE_WATCH는
촬영 결과가 생성된 사실과
파일 준비 상태를 판단한다.

최종 세션 저장 위치 정책은
SESSION의 책임이다.

필요한 경우

감지된 원본을
세션 저장 기능에 전달할 수 있다.

FILE_WATCH 자체가
세션 폴더 이름 정책을 결정하지 않는다.

---

## Completion Output

유효한 새 이미지가
완전히 준비되면

FILE_WATCH는
촬영 결과를 한 번 전달한다.

기본 출력:

- imagePath

필요한 경우 차후

- detectedAt
- fileName
- extension
- fileSize

등을 추가할 수 있다.

---

## Capture Completed Connection

FILE_WATCH의 정상 출력은
CAPTURE_COMPLETED의 입력이 된다.

흐름:

Nikon Camera

↓

digiCamControl

↓

실제 이미지 파일 생성

↓

FILE_WATCH

↓

파일 준비 확인

↓

CAPTURE_COMPLETED

FILE_WATCH는
완료 이후 UI 동작을 직접 실행하지 않는다.

---

## Auto Timer Independence

FILE_WATCH는
AUTO_TIMER의 카운트다운을 알지 않는다.

0초인지

몇 초 남았는지

다음 촬영이 언제인지

판단하지 않는다.

FILE_WATCH는
실제 새로운 이미지 파일만 감지한다.

---

## Physical Shutter Independence

FILE_WATCH는
사용자가 물리 셔터를 눌렀는지
직접 알 필요가 없다.

새로운 실제 Nikon 촬영 파일이
PC에 생성되면

동일한 FILE_WATCH 흐름을 사용한다.

---

## Timeout Boundary

파일 생성 이벤트가 발생했지만

정해진 시간 동안
파일이 안정된 상태가 되지 않는다면

정상 완료 결과로 전달하지 않는다.

FILE_WATCH는
불완전한 파일을

CAPTURE_COMPLETED에
전달하지 않는다.

---

## Error

파일 접근 오류,

파일 사라짐,

전송 중단,

읽기 실패 등이 발생하면

가짜 촬영 완료 이벤트를
생성하지 않는다.

오류는 기록할 수 있지만

오류를 성공으로 변환하지 않는다.

---

## Lifecycle

FILE_WATCH의 기본 생명주기는
다음과 같다.

STOPPED

↓

STARTING

↓

WATCHING

↓

STOPPING

↓

STOPPED

활성 세션 동안
WATCHING 상태를 유지한다.

개별 촬영마다
Watcher를 새로 생성하지 않는 것을 원칙으로 한다.

---

## Restart

Watcher를 다시 시작해야 하는 경우

기존 Watcher를 정상 종료한 뒤
새 Watcher를 시작한다.

동일 경로에
여러 Watcher가 중복 실행되어

하나의 촬영 결과가
여러 번 전달되는 상황을 방지한다.

---

## No Business Logic

FILE_WATCH는

어떤 촬영 모드를 사용할지,

몇 초마다 촬영할지,

플래시를 언제 보여줄지,

썸네일을 몇 초 보여줄지,

다음 촬영을 언제 시작할지

결정하지 않는다.

FILE_WATCH의 책임은

실제 새로운 촬영 파일을
안정적으로 감지하는 것뿐이다.

---

## Source of Truth

이 문서는
촬영 파일 감지 정책의
유일한 Source of Truth이다.

파일 감지의 상세 정책을

AUTO_TIMER,

PHYSICAL_SHUTTER,

CAPTURE_COMPLETED,

DIGICAM_CONTROL

문서에 중복 작성하지 않는다.
'@ | Set-Content `
"C:\projects\rusticastudio\docs\camera\FILE_WATCH.md" `
-Encoding UTF8