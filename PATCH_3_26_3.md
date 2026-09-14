# AXE PRODUCT WEB 3.26.3 · ONBOARDING FLOW INTEGRATED R2

## 기준
- 배포 기준선: `AXE_PRODUCT_WEB_STAGING_3_26_2_PLATFORM_TEST_CENTER_R1`
- 기존 3.26.3 `INTEGRITY R1` / `HARDENING R1`은 서로 다른 보강점이 있었고 배포 완료 증거가 없어 후보본으로만 취급했습니다.
- 이 R2는 `INTEGRITY R1`의 회사 생성/재개 보호를 기준으로 `HARDENING R1`의 유효한 멤버 등록 기능을 선택 병합한 통합본입니다.

## 1. 회사 생성 결과 처리 및 중복 생성 방어
- `create_company` RPC 반환값을 `{id}` 한 형태로만 가정하지 않습니다.
- UUID scalar / object `id` / object `company_id` / array 반환을 모두 인식합니다.
- 같은 생성 시도의 내부 SLUG를 `sessionStorage`에 30분간 유지합니다.
- RPC 호출 전에 같은 SLUG의 회사가 이미 생겼는지 확인합니다.
- RPC 응답 유실/네트워크 오류 시에도 같은 SLUG를 다시 조회한 뒤 실제 생성 여부를 복구합니다.
- RPC 성공 후 실제 `companies` row를 재조회해 확인된 회사만 다음 단계로 넘깁니다.
- 빠른 연속 클릭은 기존 `withMutation()` 잠금과 동일 SLUG 복구를 함께 사용합니다.
- 기존 기술 문구 `생성된 회사 정보를 받지 못했습니다.`는 제거했습니다.
- 성공 안내: `회사 등록이 완료되었습니다. 이어서 초기설정을 시작합니다.`
- 결과 확인 불가: `회사 등록 상태를 확인하지 못했습니다. 새로고침 후 회사 목록을 확인해 주세요.`
- 회사 생성 뒤 현재 사용자가 실제 OWNER membership인지 다시 확인하고, 누락이면 Guided Setup으로 강행하지 않습니다.

## 2. 첫 접속 / 멤버 등록 흐름
- 등록된 Discord placeholder membership은 로그인 직후 claim한 뒤 회사 목록을 조회합니다.
- 미등록 팀원은 회사 검색/합류코드 없이 대표·관리자에게 등록을 요청하고 `등록 확인하기`로 재확인합니다.
- 회사 멤버 관리 화면에 `멤버 등록`을 추가했습니다.
- 대표/관리자가 팀원이 전달한 Discord ID를 입력하면 서버가 현재 연결된 Discord 서버의 실제 멤버인지 다시 확인하고 placeholder membership을 생성합니다.
- OWNER 역할은 직접 등록 화면에서 부여할 수 없습니다.
- 과거 `left/suspended` membership이 있으면 자동 재활성화하지 않고 멤버 관리에서 상태를 확인하도록 안내합니다.

## 3. 신규 회사 생성 노출 정책
- 회사가 없는 사용자는 기존처럼 `새 회사 등록 시작`을 사용할 수 있습니다.
- 이미 회사에 소속된 일반 멤버/관리자는 사이드바의 `+ 새 회사`가 보이지 않습니다.
- 액션을 직접 호출해도 기존 회사 OWNER 또는 PLATFORM OWNER가 아니면 차단합니다.
- 여러 회사 소속 자체는 기존 시스템 구조대로 지원하며, OWNER는 추가 회사 등록 및 회사 전환이 가능합니다.

## 4. 초기설정 OWNER 전용
- 미완료 초기설정 자동 재개는 OWNER만 수행합니다.
- 수동 `초기설정 가이드` 버튼도 OWNER에게만 표시합니다.
- Discord 연결, 역할 저장, 기능 저장, 채널 생성/연결, 멤버 일괄등록, 완료 처리 등 실제 Guided Setup mutation도 OWNER만 진행하도록 통일했습니다.
- ADMIN은 일반 회사 설정 화면에서 운영 설정을 관리할 수 있지만 신규 회사의 초기 Guided Setup을 대신 진행하지 않습니다.

## 5. 초기설정 재개 단계 무결성
- 새로고침/재접속/Discord OAuth 복귀/수동 초기설정 열기의 단계 계산을 `resolveSetupGuideResumeStep()` 하나로 통합했습니다.
- 저장된 STEP이 앞서 있어도 Discord 연결/카탈로그가 준비되지 않았으면 STEP 1로 복구합니다.
- 관리자/일반 멤버 Discord 역할 설정이 없으면 STEP 2로 복구합니다.
- 완료된 초기설정이 일반 재접속에서 자동으로 다시 열리지 않습니다.

## 6. Test Center와 실제 기능 목록 동기화
- Test Center 기능 선택은 실제 Guided Setup과 동일한 `MODULE_ORDER` + `MODULE_UI`를 사용합니다.
- 현재 `공금 / 총알 / 무법지대 / 개조서 / 핀볼 모집 / 요리 주문 / 자산·계좌 관리`가 동일하게 표시됩니다.
- 이후 공용 모듈 정의에 기능이 추가되면 Test Center도 같은 목록을 따라갑니다.
- Test Center는 계속 실제 회사/멤버/Discord/설정을 변경하지 않습니다.

## 검증
- `node --check` 대상 변경 JS: PASS
- 전체 `npm run check`: PASS
- `scripts/onboarding-flow-integrity-check.mjs`: 36/36 PASS

## DB / BOT
- 이 WEB 패치 자체에 추가 migration은 없습니다.
- `SUPABASE_MIGRATION_3_26_0_FIRST_RUN_MEMBERSHIP_CLAIM.sql` 적용 상태와 실제 `axe_product.create_company` RETURNS 형식은 별도 읽기 전용 진단 SQL로 확인합니다.
- BOT 변경 없음.
- LIVE 변경 없음.
