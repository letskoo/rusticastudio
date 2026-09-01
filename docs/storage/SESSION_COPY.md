# Session Copy

## Purpose

SESSION_COPY는

ALBUM에서 최종 선택된
실제 촬영 이미지를

원본 Session과 구분되는
별도의 선택본 Folder에 복사한다.

SESSION_COPY는

원본 Session을 변경하지 않는다.

---

## Responsibility

SESSION_COPY가 담당하는 것은
다음과 같다.

- 현재 Session 경로 수신
- 최종 선택 이미지 목록 수신
- 선택본 Folder 이름 생성
- 선택본 Folder 생성
- 선택 이미지 파일 복사
- 복사 완료 결과 반환

SESSION_COPY는
다음을 담당하지 않는다.

- Nikon 카메라 제어
- digiCamControl 촬영
- 파일 감지
- 원본 Session Folder 생성
- 원본 Session 저장
- 원본 Session 자동 삭제
- Gallery 표시
- 별표 선택
- ALBUM 선택시간
- OneDrive 동기화

---

## Source Session

SESSION_COPY의 Source는

현재 촬영 회차의
원본 Session Folder이다.

원본 Session Folder는
SESSION이 생성하고 소유한다.

SESSION_COPY가

원본 Session 경로나
Session 이름을

자체적으로 다시 계산하지 않는다.

---

## Original Storage Structure

원본 Session Folder는

설정된 Base Save Path 바로 아래에
생성된다.

기본 예:

C:\Users\User\Downloads
└─ 2026-05-27-pm02-35

기존 원본 저장 구조는
SESSION_COPY 때문에 변경하지 않는다.

---

## Copy Folder Name

선택본 Folder 이름은

원본 Session Folder 이름 뒤에

-copy

를 붙여 생성한다.

예:

원본:

2026-05-27-pm02-35

선택본:

2026-05-27-pm02-35-copy

---

## No New Time

SESSION_COPY는

선택본 Folder를 만들기 위해
새로운 현재 시간을 계산하지 않는다.

선택본 Folder 이름은

반드시 원본 Session Folder 이름에서
파생되어야 한다.

잘못된 예:

2026-05-27-pm02-36

올바른 예:

2026-05-27-pm02-35-copy

---

## Same Parent Path

선택본 Folder는

원본 Session Folder와
동일한 Base Save Path 아래에 생성한다.

예:

C:\Users\User\Downloads
├─ 2026-05-27-pm02-35
└─ 2026-05-27-pm02-35-copy

사용자가 Base Save Path를 변경하면

원본과 선택본 모두
해당 Base Save Path 아래에 생성된다.

별도의 Copy 저장 경로 설정은
사용하지 않는다.

---

## Relationship

원본과 선택본의 관계는

Folder 이름으로
쉽게 식별할 수 있어야 한다.

예:

2026-05-27-pm02-35

↓

2026-05-27-pm02-35-copy

관리자는

같은 촬영 회차의
원본과 선택본을

Folder 이름만 보고
즉시 연결할 수 있어야 한다.

---

## Input

SESSION_COPY는
ALBUM의 공통 완료 절차로부터

다음을 입력받는다.

- sourceSessionPath
- selectedImagePaths

sourceSessionPath는
현재 종료된 원본 Session Folder이다.

selectedImagePaths는
완료 시점에 별표가 선택된
이미지 목록이다.

---

## Selected Images

SESSION_COPY는

최종 별표 선택된 이미지만
복사한다.

별표가 없는 이미지는
선택본 Folder에 복사하지 않는다.

---

## Copy Timing

사용자가

별표를 선택하거나 해제할 때마다
파일 복사를 실행하지 않는다.

실제 복사는

ALBUM의 공통 완료 절차가
실행된 이후에만 수행한다.

완료 원인은 다음과 같다.

- 사용자 확인
- 선택시간 만료

두 경우 모두
동일한 SESSION_COPY 기능을 사용한다.

---

## Copy Operation

선택 이미지는

원본 Session Folder에서

원본 Session Folder와
같은 Base Save Path에 존재하는

-copy Folder로 복사한다.

원본 파일을

이동하지 않는다.

삭제하지 않는다.

변경하지 않는다.

---

## File Name

선택 이미지의 파일 이름은

원본 파일 이름을
그대로 유지한다.

예:

원본:

capture_123456.jpg

선택본:

capture_123456.jpg

관리자가

원본과 선택본을
파일 이름으로도 쉽게 비교할 수 있어야 한다.

---

## Zero Selection

최종 선택 이미지가
0장일 수 있다.

0장은
정상적인 완료 결과이다.

선택 이미지가 0장이면

-copy Folder를 생성하지 않는다.

복사 작업 없이
정상 완료를 반환한다.

---

## Existing Copy Folder

동일한 Session의

-copy Folder가
이미 존재할 수 있다.

이 경우

기존 Copy Folder 전체를
삭제하지 않는다.

기존 선택본 데이터를
무조건 덮어쓰지 않는다.

중복 완료 호출 때문에
기존 선택 결과가 손상되어서는 안 된다.

구체적인 안전 처리는
SESSION_COPY Service가 담당한다.

---

## Duplicate File

-copy Folder 안에

동일한 파일 이름이
이미 존재할 수 있다.

이미 정상적으로 복사된
동일한 선택 이미지라면

불필요한 중복 파일을
계속 생성하지 않는 것을 원칙으로 한다.

위험한 덮어쓰기도 피한다.

---

## Original Session Protection

SESSION_COPY 때문에

원본 Session의

- Folder 이름
- Folder 위치
- 이미지 파일 이름
- 이미지 파일 내용
- 자동 삭제 정책

을 변경하지 않는다.

---

## Delete Boundary

원본 Session Folder는

기존 자동 삭제 정책의
적용을 그대로 받는다.

예:

2026-05-27-pm02-35

원본 Session은
관리자가 설정한 deleteMinutes 이후
기존 로직에 따라 삭제될 수 있다.

선택본:

2026-05-27-pm02-35-copy

는 원본 Session과
별도의 보관 결과이다.

SESSION_COPY는
원본 Session의 삭제 시간을
변경하지 않는다.

---

## Auto Cleanup Boundary

현재 원본 Session 자동 삭제는

Session Folder 이름 형식에 맞는
원본 Folder만 대상으로 한다.

-copy Folder는
원본 Session Folder와
다른 이름 형식을 가지므로

원본 Session 자동 삭제와
구분되는 저장 결과로 취급한다.

SESSION_COPY가

기존 원본 자동 삭제 정책을
직접 수정하지 않는다.

---

## OneDrive Boundary

SESSION_COPY는

OneDrive API를
직접 호출하지 않는다.

Base Save Path가
OneDrive 동기화 대상인 경우

-copy Folder도
동기화 대상이 될 수 있다.

SESSION_COPY의 책임은

선택 이미지를
로컬 -copy Folder에

정상적으로 복사하는 것까지이다.

클라우드 업로드 상태는
SESSION_COPY 완료 조건이 아니다.

---

## Completion

선택 이미지의 복사가
모두 정상적으로 완료되면

SESSION_COPY는
완료 결과를 반환한다.

ALBUM은

SESSION_COPY 완료 이후
공통 종료 절차를 계속한다.

---

## Failure

다음과 같은 경우

정상적인 복사 완료로
처리하지 않는다.

- 원본 Session 접근 실패
- 선택 원본 이미지 접근 실패
- -copy Folder 생성 실패
- 이미지 복사 실패
- 저장 위치 사용 불가

---

## Failure Safety

SESSION_COPY 오류 때문에

원본 Session 이미지가
삭제되어서는 안 된다.

원본 파일을
손상시키지 않는다.

불확실한 상태에서는
원본 Session 보존을 우선한다.

---

## Independence

SESSION_COPY는

ALBUM UI를 알지 않는다.

별표 버튼을 알지 않는다.

선택시간 Timer를 알지 않는다.

digiCamControl을 알지 않는다.

FILE_WATCH를 알지 않는다.

SESSION_COPY는

원본 Session 경로와
최종 선택 이미지 목록을 받아

선택본을 만드는 것만 담당한다.

---

## Source of Truth

이 문서는

선택 이미지 Copy 정책의
유일한 Source of Truth이다.

SESSION_COPY 상세 정책을

ALBUM,

SESSION,

SETTINGS,

SYSTEM

문서에 중복 작성하지 않는다.