# AXE PRODUCT WEB 3.26.0 · FIRST-RUN ONBOARDING

## 목적
Discord 로그인 이후 신규 이용자가 회사 생성 위치와 초기설정 위치를 찾지 않아도 되도록 첫 접속 흐름을 하나로 연결합니다. 동시에 이미 회사에서 등록된 멤버와 등록 전 팀원의 진입 경로를 분리합니다.

## 신규 OWNER
`Discord 로그인 → 회사 이름 입력 → 회사 생성 → Guided Setup → 대시보드`

- SLUG 입력 제거 · 브라우저가 충돌 가능성이 사실상 없는 내부 식별값을 자동 생성
- 회사 생성 직후 Guided Setup 자동 시작
- Guided Setup 중단 시 OWNER만 다음 로그인에서 저장 단계 자동 재개

## 등록된 멤버
초기설정의 Discord 멤버 등록에서 `discord_user_id`만 선등록된 row를 첫 로그인 auth user에 자동 귀속합니다.

- 회사 생성 화면 미노출
- 초기설정 미노출
- 소속 회사 바로 진입
- 이미 다른 auth user에 연결된 membership은 가져오지 않음
- 같은 회사에 현재 user membership이 이미 있으면 placeholder 중복 claim 방지

## 아직 등록 안 된 팀원
첫 접속 화면에 `기존 회사에 합류`를 함께 제공합니다.

- 관리자에게 받은 회사 합류 코드 입력
- 합류 성공 후 바로 대시보드
- 멤버 관리에서 7일 / 최대 50명 합류 코드 생성
- 합류 코드는 기존 보안 처리된 company_invites 흐름을 재사용

## 범위
- WEB
- PRODUCT STAGING DB migration
- BOT 변경 없음
