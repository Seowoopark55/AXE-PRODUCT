# AXE PRODUCT 3.21.1 · PLATFORM OWNER setup

3.21.0의 마이그레이션이 `public` 스키마를 잘못 참조한 문제를 수정했습니다. 실제 PRODUCT WEB은 `axe_product` 스키마를 사용합니다.

## PRODUCT STAGING 적용 순서

1. `SUPABASE_MIGRATION_3_21_1_SCHEMA_HOTFIX_WITH_PLATFORM_OWNER.sql` 전체를 Supabase SQL Editor에서 실행합니다.
2. 이 파일에는 PLATFORM OWNER UID `72a5e0e4-047f-4b74-9d17-b3bcbbfe70d3`가 이미 들어 있습니다.
3. 마지막 결과의 `platform_owner_registered`가 `true`인지 확인합니다.
4. WEB을 다시 로그인/새로고침하면 본인에게만 `플랫폼 > 서비스 관리` 메뉴가 표시됩니다.

기존 3.21.0 SQL이 오류로 중단됐더라도 이 스크립트는 재실행 가능하도록 작성했습니다. 실제 DB 적용 여부는 마지막 검증 결과로 확인하세요.
