# Album

## Purpose

ALBUM은
촬영 Session 종료 후

사용자가 자신이 촬영한
실제 이미지를 확인하고

좋아하는 이미지를
별표로 선택할 수 있도록 한다.

ALBUM은
사진을 촬영하지 않는다.

ALBUM은
원본 Session 저장 정책을 변경하지 않는다.

---

## Responsibility

ALBUM이 담당하는 것은
다음과 같다.

- 촬영 종료 후 Gallery 표시
- 현재 Session 이미지 표시
- 원본 이미지 보기
- 별표 선택
- 별표 해제
- 선택 상태 관리
- 선택 완료
- 자동 선택시간 관리
- 완료 시 선택 결과 전달
- 완료 후 다음 화면으로 이동 요청

ALBUM은
다음을 담당하지 않는다.

- Nikon 카메라 제어
- digiCamControl 촬영 명령
- AUTO_TIMER
- PHYSICAL_SHUTTER
- 촬영 파일 감지
- Session Folder 생성
- Session 원본 저장
- Session 원본 자동 삭제
- 선택 이미지 파일 복사
- OneDrive 동기화

---

## Setting

ALBUM 사용 여부는
설정값으로 결정한다.

설정값:

albumEnabled

값:

true

false

기본값:

false

---

## Disabled

albumEnabled가 false이면

ALBUM을 실행하지 않는다.

기존 Session 종료 흐름을
그대로 사용한다.

기본 흐름:

촬영

↓

Session 종료

↓

ALBUM 건너뜀

↓

기존 종료 처리

↓

첫 화면

---

## Enabled

albumEnabled가 true이면

촬영 Session 종료 후
즉시 첫 화면으로 이동하지 않는다.

ALBUM을 실행한다.

기본 흐름:

촬영

↓

Session 종료

↓

ALBUM

↓

현재 Session Gallery

↓

별표 선택

↓

선택 완료

↓

선택 결과 처리

↓

첫 화면

---

## Image Source

ALBUM은
현재 종료된 Session에 저장된

실제 Nikon 촬영 이미지만
사용한다.

LIVE_VIEW 이미지를
ALBUM 이미지로 사용하지 않는다.

이전 Session의 이미지를
현재 ALBUM에 표시하지 않는다.

---

## Gallery

현재 Session에서 촬영된 이미지를
Gallery 형식으로 표시한다.

각 이미지는
Thumbnail로 표시할 수 있다.

사용자는
각 이미지의 별표 상태를
확인할 수 있다.

---

## Original View

Gallery의 이미지를 선택하면

해당 이미지의

원본 보기 화면을 표시한다.

원본 보기에서는

실제 Session 원본 이미지를 사용한다.

이미지는 화면 비율을 유지하며

표시 영역 안에 맞춰 보여준다.

원본 보기에서도

별표를 선택하거나 해제할 수 있다.

Gallery와 원본 보기는

동일한 선택 상태를 사용한다.

원본 보기에서 별표를 변경하면

Gallery의 해당 이미지 별표에도

즉시 반영한다.

Gallery에서 별표를 변경한 뒤

원본 보기를 열면

현재 선택 상태를 그대로 표시한다.

원본 보기를 닫아도

별표 선택 상태는 유지한다.

원본 보기의 닫기 버튼과

별표 버튼은 우상단에 배치한다.

원본 보기의 별표 변경은

실제 이미지 파일을

복사하거나 삭제하지 않는다.

---

## Favorite

각 이미지는
별표 선택 상태를 가진다.

기본 상태:

NOT_SELECTED

별표 상태:

SELECTED

사용자가 별표를 누르면:

NOT_SELECTED

↓

SELECTED

별표를 다시 누르면:

SELECTED

↓

NOT_SELECTED

별표는
좋아하는 이미지의 선택 상태만 의미한다.

가격,

상품,

결제,

촬영 방식

등의 다른 의미를 가지지 않는다.

---

## Selection State

현재 Session의

이미지 선택 상태는

ALBUM Feature가 관리한다.

Gallery와 Original View가

각각 별도의 선택 상태를

소유하지 않는다.

동일 이미지에 대한 별표 상태는

Gallery와 Original View에서

항상 동일해야 한다.

별표 선택과 해제는

하나의 공통 선택 로직을 사용한다.

선택 상태가 변경되면

해당 이미지의 Gallery 별표와

열려 있는 Original View 별표를

동일한 상태로 갱신한다.

선택 개수도

현재 선택 상태를 기준으로

즉시 갱신한다.

원본 보기의 열기와 닫기는

선택 상태를 변경하지 않는다.

---

## No File Operation During Selection

사용자가
별표를 선택하거나 해제하는 동안

실제 이미지 파일을
복사하거나 삭제하지 않는다.

별표 변경은
선택 상태만 변경한다.

실제 선택 이미지 파일 처리는

ALBUM 완료 이후
SESSION_COPY에 위임한다.

---

## Manual Complete

사용자가
선택을 마치고

확인 버튼을 누르면

ALBUM 완료 절차를 실행한다.

확인 버튼은
별도의 종료 로직을 구현하지 않는다.

공통 ALBUM 완료 절차를 호출한다.

---

## Selection Timeout

ALBUM에는
사용자 선택 제한시간이 존재한다.

설정값:

albumTimeoutMinutes

이 값은
관리자가 설정할 수 있다.

ALBUM이 시작되면
선택 제한시간을 시작한다.

---

## Timeout Complete

선택 제한시간이 만료되면

ALBUM을
단순 종료하지 않는다.

확인 버튼을 눌렀을 때와
동일한 ALBUM 완료 절차를 실행한다.

따라서

확인 버튼

그리고

선택시간 만료

두 경로는
동일한 완료 기능을 사용한다.

---

## Complete

ALBUM 완료는
하나의 공통 절차로 처리한다.

완료 발생 원인은
다음 두 가지가 될 수 있다.

- 사용자 확인
- 선택시간 만료

완료 시점의
현재 별표 선택 상태를
최종 선택 결과로 사용한다.

기본 흐름:

ALBUM 완료

↓

현재 별표 상태 확정

↓

선택 이미지 목록 생성

↓

SESSION_COPY에 전달

↓

선택 이미지 처리 완료

↓

ALBUM 상태 정리

↓

첫 화면 이동

---

## Zero Selection

별표를
한 장도 선택하지 않아도 된다.

선택 이미지가 0장인 상태에서도

확인 버튼 또는
선택시간 만료에 의해

정상적으로 ALBUM을
완료할 수 있다.

0장 선택을
오류로 처리하지 않는다.

---

## Timeout With Selection

사용자가
일부 사진에 별표를 선택한 뒤

확인 버튼을 누르지 않고
선택시간이 만료된 경우

시간 만료 시점의
현재 별표 상태를 사용한다.

예:

사진 1 SELECTED

사진 2 NOT_SELECTED

사진 3 SELECTED

↓

선택시간 만료

↓

사진 1, 사진 3을
최종 선택 결과로 사용

↓

일반 확인 버튼과 동일한
완료 절차 실행

---

## Original Session Protection

ALBUM은

현재 Session의
원본 이미지 파일을

이동하지 않는다.

삭제하지 않는다.

이름을 변경하지 않는다.

Session Folder 이름도
변경하지 않는다.

원본 Session의
기존 저장 및 자동 삭제 정책은

ALBUM 때문에 변경하지 않는다.

---

## Session Boundary

ALBUM은
하나의 Session에만 속한다.

새로운 Session이 시작되면

이전 Session의

- Gallery 상태
- 별표 상태
- 선택시간
- 원본 보기 상태

를 사용하지 않는다.

---

## Capture Boundary

ALBUM은
촬영 종료 이후의 기능이다.

ALBUM 실행 중에는

AUTO_TIMER

PHYSICAL_SHUTTER

촬영 기능을
실행하지 않는 것을 원칙으로 한다.

---

## Thumbnail Boundary

촬영 중 사용하는
THUMBNAIL과

촬영 종료 후 사용하는
ALBUM Gallery는

서로 다른 기능이다.

THUMBNAIL은
촬영 직후의 짧은 Preview이다.

ALBUM은
Session 종료 후
사진을 선택하는 기능이다.

두 기능을
하나의 구현으로 합치지 않는다.

---

## Session Copy Boundary

ALBUM은

선택된 이미지 파일을
직접 복사하지 않는다.

ALBUM은

현재 Session 정보와
최종 선택 이미지 목록을

SESSION_COPY에 전달한다.

실제 Copy Folder 생성과
파일 복사는

SESSION_COPY의 책임이다.

---

## Failure Safety

ALBUM 처리 중
오류가 발생했다고 해서

원본 Session 이미지를
삭제하지 않는다.

불확실한 상태에서는

원본 Session 보존을
우선한다.

---

## Independence

ALBUM은

digiCamControl을 알지 않는다.

FILE_WATCH 구현을 알지 않는다.

AUTO_TIMER를 알지 않는다.

PHYSICAL_SHUTTER를 알지 않는다.

OneDrive를 직접 제어하지 않는다.

ALBUM은

현재 Session의 이미지와
사용자의 선택 상태만 관리한다.

---

## Verified Behavior

2026-09-07 실제 촬영 테스트에서

다음 동작을 확인했다.

- Gallery 이미지 클릭 시 원본 보기
- 원본 보기에서 별표 선택 및 해제
- Gallery와 원본 보기의 별표 양방향 동기화
- 원본 보기 닫기 후 선택 상태 유지
- 선택 개수 갱신
- 선택 완료 후 선택 이미지 COPY 및 다운로드

원본 보기와 별표 동기화를 위해

촬영,

Session 원본 저장,

파일 감지,

기존 COPY 로직을

변경하지 않았다.

---

## Future Expansion

차후 다음 기능을

ALBUM 내부에서 확장할 수 있다.

- Gallery Layout 변경
- 사진 넘기기
- 전체 선택
- 전체 선택 해제
- 별표 UI 변경

이러한 변경 때문에

촬영,

Session 원본 저장,

파일 감지

기능을 수정하지 않는 것을 원칙으로 한다.

---

## Source of Truth

이 문서는
ALBUM 정책의
유일한 Source of Truth이다.

ALBUM 상세 정책을

SESSION,

SETTINGS,

THUMBNAIL,

CAPTURE_COMPLETED,

SYSTEM

문서에 중복 작성하지 않는다.