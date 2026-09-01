@'
# RusticaStudio System

## Purpose

RusticaStudio는 Nikon 카메라를 이용한
무인 촬영 시스템이다.

RusticaStudio는 사용자 흐름과 촬영 정책을 관리한다.

실제 Nikon 카메라 제어는
카메라 제어 엔진에 위임한다.

현재 카메라 제어 엔진은
digiCamControl이다.

---

## Architecture

RusticaStudio는 다음 계층으로 구성한다.

Page

↓

Feature

↓

Block


촬영 및 시스템 기능은 다음 방향으로 동작한다.

Feature

↓

Service

↓

External


External에는 다음과 같은 외부 시스템이 포함된다.

- digiCamControl
- Nikon Camera
- File System
- Electron

---

## Page

Page는 하나의 화면을 구성한다.

Page는 필요한 Feature를 배치한다.

Page는 촬영 정책을 직접 구현하지 않는다.

Page는 digiCamControl을 직접 호출하지 않는다.

Page는 파일 시스템을 직접 제어하지 않는다.

---

## Feature

Feature는 하나의 사용자 기능을 담당한다.

예:

- 자동 타이머 촬영
- 물리 셔터 촬영
- 촬영 완료
- 라이브뷰
- 세션
- 썸네일
- 설정

Feature는 필요한 Block과 Service를 사용한다.

Feature끼리는 서로의 내부 구현을 알지 않는다.

한 Feature의 변경이
다른 Feature의 수정을 요구하지 않는 것을 원칙으로 한다.

---

## Block

Block은 UI를 구성하는
가장 작은 재사용 단위이다.

Block은 Business Logic을 포함하지 않는다.

Block은 촬영 정책을 알지 못한다.

Block은 digiCamControl을 알지 못한다.

Block은 State를 직접 관리하지 않는다.

Block은 재사용 가능해야 한다.

---

## Service

Service는 외부 시스템과의 연결을 담당한다.

예:

- digiCamControl 실행
- 파일 감지
- 세션 폴더 관리
- 설정 저장
- Electron IPC

Service는 UI를 알지 못한다.

Service는 Page를 알지 못한다.

Service는 촬영 화면의 표현 방식을 결정하지 않는다.

---

## External

External은 RusticaStudio 외부에서
실제 기능을 수행하는 시스템이다.

현재 주요 External은 다음과 같다.

digiCamControl

↓

Nikon Camera


그리고

File System

Electron

이 존재한다.

RusticaStudio는 Nikon 카메라를
직접 제어하지 않는다.

카메라 제어 방식이 변경되더라도
Feature와 UI를 최대한 수정하지 않는 구조를 유지한다.

---

## Capture Boundary

RusticaStudio에서

촬영 요청과
촬영 완료는
서로 다른 사건이다.

촬영 요청은
실제 촬영 완료를 의미하지 않는다.

실제 촬영 완료 여부는
촬영 완료 기능이 판단한다.

촬영 완료의 세부 기준은
이 문서에서 정의하지 않는다.

---

## Dependency Rule

의존 방향은 아래 방향만 허용한다.

Page

↓

Feature

↓

Service

↓

External


UI 구성에서는

Page

↓

Feature

↓

Block


역방향 의존은 금지한다.

Service가 Feature를 직접 제어하지 않는다.

Block이 Feature를 직접 제어하지 않는다.

External 구현이 Page 또는 Block에 영향을 주지 않는다.

---

## File Principle

문서와 코드는 동일한 원칙을 사용한다.

하나의 파일은
하나의 책임만 가진다.

하나의 정책은
하나의 문서에서만 정의한다.

같은 정책을
여러 문서에 중복 작성하지 않는다.

정책 변경 때문에
관련 없는 여러 문서를 동시에 수정해야 하는 구조를 만들지 않는다.

코드도 동일하다.

한 기능의 변경이
관련 없는 여러 코드 파일의 수정을 요구하지 않도록 한다.

---

## Source of Truth

각 정책의 상세 내용은
해당 정책 문서 하나만
Source of Truth로 사용한다.

SYSTEM.md는
개별 기능의 상세 정책을 정의하지 않는다.

SYSTEM.md는 오직

- 시스템 계층
- 각 계층의 책임
- 의존 방향
- 공통 파일 원칙

만 정의한다.

---

## Version 2 Direction

Version 2에서는
서로 독립된 촬영 방식을 지원할 수 있는 구조를 만든다.

각 촬영 방식의 동작 규칙은
각자의 독립 문서에서 정의한다.

SYSTEM.md에서는
개별 촬영 방식의 상세 동작을 정의하지 않는다.

---

## Future Direction

새로운 촬영 방식이 추가되더라도
기존 촬영 기능의 내부 로직을
대규모로 수정하지 않는 것을 목표로 한다.

새로운 기능은 가능하면
새로운 독립 Feature로 추가한다.

기존 기능은 재사용하거나 조합한다.

기존 기능에 조건문을 계속 추가하여
거대한 Manager를 만드는 방식을 사용하지 않는다.
'@ | Set-Content `
"C:\projects\rusticastudio\docs\system\SYSTEM.md" `
-Encoding UTF8