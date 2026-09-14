# AXE PRODUCT STAGING · 3.26.3 · Onboarding Flow Hardening

## 점검 결과
- 첫 접속 분기, 멤버 선등록/자동 claim, OWNER Guided Setup 자동 재개 흐름은 현재 제품 방향과 일치합니다.
- 실제 Guided Setup에는 공금/총알/무법지대/개조서/핀볼/요리/자산·계좌가 등록돼 있었고, 테스트 센터 Preview만 오래된 5개 카드 목록을 사용하고 있었습니다.
- 회사 생성 화면의 `생성된 회사 정보를 받지 못했습니다.`는 계정당 회사 제한 문구가 아니라, RPC 반환값을 객체 `.id`로만 해석하던 WEB 처리 문제였습니다.

## 수정
1. 회사 생성 반환값을 UUID 문자열/객체/배열 모두 처리합니다.
2. 반환값이 모호하거나 호출 오류가 발생해도 회사 목록을 재조회해 새 회사 생성 여부를 먼저 확인합니다.
3. 중복 생성 위험을 줄이기 위해 재시도 전 확인 안내를 명확히 합니다.
4. 이미 회사가 있는 일반 admin/manager/member의 사이드바 `+ 새 회사`를 숨기고 액션도 차단합니다. OWNER/PLATFORM OWNER와 회사가 없는 신규 사용자는 생성 가능 상태를 유지합니다.
5. 멤버 관리에 `멤버 등록` 버튼을 추가해 팀원이 첫 접속 화면에서 복사한 Discord ID를 대표/관리자가 직접 등록할 수 있게 했습니다. 서버 API가 회사 관리자 권한과 현재 Discord 서버 소속을 다시 검증하며 OWNER 권한은 신규 등록에서 허용하지 않습니다.
6. Test Center Guided Setup Preview의 기능 카드를 `MODULE_ORDER / MODULE_UI` 단일 소스에서 렌더링하도록 변경했습니다. 개조서/핀볼 포함.
7. Test Center 검증에 실제/체험 모듈 레지스트리 동기화 검사를 추가했습니다.
8. README의 3.26.0 합류 코드 설명에 3.26.1에서 대체된 과거 방식임을 명시했습니다.

## 변경 범위
- WEB only
- SQL 변경 없음
- BOT 변경 없음
- LIVE 대상 아님

## 별도 하드닝 후보
현재 확보한 DB 스냅샷에는 `company_memberships`의 `(company_id, user_id)` UNIQUE는 확인되지만 `(company_id, discord_user_id)` UNIQUE는 확인되지 않았습니다. Guided Setup의 정상 멤버 등록 흐름은 기존 Discord ID를 선검사하지만, DB 레벨 중복 방지는 별도 데이터 점검 후 안전하게 추가하는 편이 좋습니다. 이번 WEB 패치에는 포함하지 않습니다.
