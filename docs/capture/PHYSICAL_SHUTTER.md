@'
# Physical Shutter Capture

## Purpose

PHYSICAL_SHUTTER는
사용자가 Nikon 카메라의
물리 셔터 버튼을 눌러 촬영하는 기능이다.

RusticaStudio는
물리 셔터의 촬영 시점을 결정하지 않는다.

사용자가 원하는 순간에
직접 촬영한다.

---

## Responsibility

PHYSICAL_SHUTTER가 담당하는 것은 다음과 같다.

- 물리 셔터 촬영 모드 활성 상태 관리
- 실제 촬영 완료 신호 대기
- 촬영 완료 결과 전달
- 다음 물리 셔터 촬영 대기

PHYSICAL_SHUTTER는 다음을 담당하지 않는다.

- 자동 카운트다운
- 자동 촬영 요청
- Nikon 카메라 직접 제어
- digiCamControl 촬영 명령 실행
- 사진 파일 감지 방법
- 사진 파일 저장 방법
- 썸네일 생성
- 촬영 완료 플래시

---

## Start

PHYSICAL_SHUTTER 모드가 시작되면
RusticaStudio는 촬영 대기 상태가 된다.

상태:

WAITING_SHUTTER

이 상태에서는
자동 촬영 타이머를 실행하지 않는다.

RusticaStudio가
자동 촬영 요청을 발생시키지도 않는다.

---

## Physical Capture

사용자가 Nikon 카메라의
물리 셔터 버튼을 누른다.

실제 카메라 촬영은
Nikon 카메라와
카메라 제어 환경에서 수행된다.

PHYSICAL_SHUTTER는
셔터 버튼 입력 자체를
촬영 완료로 판단하지 않는다.

---

## Capture Boundary

물리 셔터 버튼을 누른 시점과
실제 촬영 완료 시점은
서로 다른 사건이다.

셔터 입력

↓

실제 Nikon 촬영

↓

PC 사진 도착

↓

촬영 완료 확인

이 흐름을 사용한다.

PHYSICAL_SHUTTER는
실제 촬영 완료 신호를 받은 뒤에만
한 번의 촬영이 완료되었다고 판단한다.

---

## Capture Completed

실제 촬영 완료가 확인되면
PHYSICAL_SHUTTER는
해당 촬영이 끝난 것으로 판단한다.

촬영 완료의 판단 기준과
완료 후 UI 처리는
PHYSICAL_SHUTTER의 책임이 아니다.

PHYSICAL_SHUTTER는
촬영 완료 신호를 전달받는다.

---

## Continuous Capture

한 번의 촬영이 완료되면
다시 WAITING_SHUTTER 상태로 돌아간다.

사용자는
원하는 시점에 다시 촬영할 수 있다.

흐름:

WAITING_SHUTTER

↓

사용자 물리 셔터

↓

실제 촬영

↓

촬영 완료

↓

WAITING_SHUTTER

이 과정을
세션이 종료될 때까지 반복할 수 있다.

---

## No Timer

PHYSICAL_SHUTTER 모드에서는
자동 촬영 카운트다운을 실행하지 않는다.

따라서 다음 동작이 존재하지 않는다.

- 촬영 간격 카운트다운
- 0초 자동 촬영
- 자동 촬영 요청
- 자동 타이머 리셋

타이머 촬영 정책은
AUTO_TIMER의 책임이다.

---

## No Automatic Capture Request

PHYSICAL_SHUTTER 모드에서는
RusticaStudio가
digiCamControl에 자동 촬영 명령을 보내지 않는다.

실제 촬영 시작은
사용자의 물리 셔터 조작에 의해 발생한다.

---

## Completion UI Boundary

PHYSICAL_SHUTTER는
촬영 완료 UI를 직접 실행하지 않는다.

다음 기능은
실제 촬영 완료 이후
별도의 촬영 완료 기능에서 처리한다.

- 플래시 애니메이션
- 촬영 완료 애니메이션
- 실제 사진 썸네일

---

## Failure

물리 셔터를 눌렀더라도
실제 촬영 완료가 확인되지 않았다면

RusticaStudio는
촬영 성공으로 처리하지 않는다.

PHYSICAL_SHUTTER는
존재하지 않는 촬영 결과를
임의로 생성하지 않는다.

---

## Stop

세션이 종료되거나
PHYSICAL_SHUTTER 모드가 종료되면

PHYSICAL_SHUTTER는
촬영 완료 대기를 종료한다.

이후 감지되는 촬영을
현재 활성 촬영으로 처리하지 않는다.

---

## State

PHYSICAL_SHUTTER가 소유하는 상태는
다음과 같다.

IDLE

WAITING_SHUTTER

STOPPED

기본 상태 흐름:

IDLE

↓

WAITING_SHUTTER

↓

촬영 완료

↓

WAITING_SHUTTER

모드 종료 시:

WAITING_SHUTTER

↓

STOPPED

---

## Auto Timer Boundary

PHYSICAL_SHUTTER는
AUTO_TIMER의 상태를 관리하지 않는다.

V2에서는

AUTO_TIMER

와

PHYSICAL_SHUTTER

중 하나의 촬영 방식만 활성화한다.

PHYSICAL_SHUTTER가 활성화되어 있는 동안
AUTO_TIMER는 자동 촬영을 발생시키지 않는다.

---

## Future Boundary

차후 HYBRID 촬영 방식에서는

자동 타이머 진행 중
물리 셔터 촬영을 허용할 수 있다.

하지만 해당 정책은
PHYSICAL_SHUTTER에 추가하지 않는다.

HYBRID의 동작은
독립된 HYBRID_CAPTURE 기능에서 정의한다.

따라서 V3를 구현할 때
PHYSICAL_SHUTTER의 기본 정책을
변경하지 않는 것을 원칙으로 한다.

---

## Source of Truth

이 문서는
PHYSICAL_SHUTTER 촬영 정책의
유일한 Source of Truth이다.

PHYSICAL_SHUTTER의 상세 정책을
다른 문서에 중복 작성하지 않는다.
'@ | Set-Content `
"C:\projects\rusticastudio\docs\capture\PHYSICAL_SHUTTER.md" `
-Encoding UTF8