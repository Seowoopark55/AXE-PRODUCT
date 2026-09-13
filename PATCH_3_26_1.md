# AXE PRODUCT WEB 3.26.1 · MEMBER REGISTRATION GATE

첫 로그인에서 회사가 확인되지 않는 사용자를 `새 회사 대표`와 `기존 회사 팀원`으로 명확히 분기합니다.

- 기존 회사 팀원에게 회사 검색/합류 코드 제공하지 않음
- 대표 또는 관리자가 먼저 Discord 멤버를 등록해야 함
- 팀원 화면에 현재 Discord 이름/ID와 `등록 정보 복사` 제공
- `등록 확인하기`는 membership auto-claim 후 회사가 확인될 때만 대시보드 진입
- 등록 전에는 서비스 진입 차단
- 신규 대표는 `새 회사 등록 시작` → 회사 이름 → 자동 SLUG → Guided Setup
- 멤버 관리 화면의 합류 코드 액션 제거, `멤버 등록 → 팀원 로그인 → 자동 연결` 원칙 표시
- 미완료 Guided Setup 자동 재개는 OWNER만 유지

DB 변경은 3.26.0의 `web_claim_discord_memberships()`를 그대로 사용합니다. 3.26.0 SQL을 이미 적용했다면 추가 SQL은 없습니다.
