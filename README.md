# AXE PRODUCT STAGING · 3.23.6

질문게시판은 AXE PRODUCT 자체 기능이며 Discord 포럼을 사용하지 않습니다. 3.23.6은 질문 목록의 범위/페이지 구조와 전체 데이터 증가 대응을 다시 점검한 버전입니다.

## 이번 버전 핵심

- 질문 목록: 한 화면 최대 6건 + 페이지 이동
- `전체 질문 / 내 질문` 필터
- 질문 등록 후 상세창 재오픈 제거 → 작성창이 닫히고 `내 질문` 목록으로 복귀
- 답변은 PLATFORM OWNER만 등록
- 질문 작성자는 자기 글에 추가 질문만 가능
- 공금 검수와 PLATFORM OWNER 회사 목록도 페이지 단위로 제한
- 월별 공금 납부표는 고정 높이 내부 스크롤로 전환

## DB 적용

기존 3.23.2 질문게시판 DB가 적용되어 있다는 전제에서 아래 SQL을 추가 적용합니다.

`SUPABASE_MIGRATION_3_23_6_SUPPORT_MINE_SCOPE.sql`

아직 질문게시판 DB를 한 번도 적용하지 않은 환경은 먼저 `SUPABASE_MIGRATION_3_23_2_NATIVE_SUPPORT_ATTACHMENTS_DELETE.sql`을 적용한 뒤 3.23.6 SQL을 적용합니다.

## WEB 배포

1. 필요한 SQL을 Supabase STAGING에 적용합니다.
2. 이 프로젝트 전체를 GitHub AXE PRODUCT WEB STAGING에 덮어씁니다.
3. commit / push 합니다.
4. Vercel STAGING이 `Ready`인지 확인합니다.
5. 질문게시판 `내 질문`, 페이지 이동, 질문 등록 후 자동 닫힘을 확인합니다.

> WEB 파일은 SSH의 `apply-axe-product.sh`로 배포하지 않습니다.

## 데이터 증가 대응 기준

- 공금 내역 8건/페이지
- 공금 납부 검수 6건/페이지
- 월별 공금 납부표 고정 높이 스크롤
- 멤버 8명/페이지
- 자산 8개/페이지
- 반납 8건/페이지
- 계좌 8명/페이지
- 요리 메뉴 9개/페이지
- 질문 6건/페이지
- PLATFORM OWNER 회사 목록 8개/페이지
- 대시보드 최근 활동 최대 6건
- 플랫폼 질문 응답 큐 최대 8건

## 검증

```bash
npm run check
npm run build
```

현재 소스 ZIP에는 `node_modules`를 포함하지 않습니다. 최종 Vite build는 Vercel STAGING `Ready`로 확인합니다.

## 보존 파일

- `SUPABASE_MIGRATION_*.sql`: DB 설치/업그레이드 migration
- `PATCH_3_23_6.md`: 이번 변경사항
- `VALIDATION_3_23_6.txt`: 정적 검증 결과
- `DEPLOY_STAGING_ONLY.txt`: STAGING 배포 경계
- `LIVE_GUIDED_SETUP_DEPLOY.md`: Guided Setup 참고
- `MINIMAL_DISCORD_AUTH_SETUP.md`: Discord OAuth 환경 설정
- `PLATFORM_OWNER_SETUP.md`: Platform Owner 설정
