# AXE PRODUCT WEB STAGING 3.26.4

## 회사 삭제
- 서비스 관리 > 회사 관리 > 관리 > 회사 삭제
- PLATFORM OWNER만 사용 가능
- 회사 이름을 정확히 다시 입력해야 영구 삭제 가능
- DB `companies` 삭제 + 회사 종속 데이터 `ON DELETE CASCADE`
- 삭제 이력은 `platform_company_deletion_log`에 최소 기록
- Discord 서버에 이미 생성된 채널/메시지는 자동 삭제하지 않음을 UI에 명시

## 서비스 관리 확장성
- 서비스 관리 화면을 `회사 관리 / 고객 질문 / 건의·제보` 탭으로 분리
- 회사 목록은 한 화면 최대 6개 + 페이지 이동
- 회사 수가 증가해도 목록이 페이지 전체 높이를 계속 늘리지 않음
- 검색/상태 필터 유지

## 배포
1. `SUPABASE_MIGRATION_3_26_4_COMPANY_DELETE.sql`을 PRODUCT STAGING DB에 적용
2. WEB STAGING 전체 덮어쓰기
3. commit / push
4. Vercel Ready 확인

BOT 변경 없음. LIVE 변경 없음.
