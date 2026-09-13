# AXE PRODUCT STAGING · 3.24.0

3.24.0은 기존 3.23.7의 질문게시판/데이터 증가 대응 UI를 유지하면서 `핀볼 모집`을 정식 멀티테넌트 모듈로 추가한 버전입니다.

## 기존 UI 기준 유지
- 질문 5건/페이지 + `전체 질문 / 내 질문`
- 공금/멤버/자산/계좌/요리 등 장기 데이터 목록은 제한된 목록 + 페이지 이동/고정 영역 구조 유지
- 질문 등록 후 상세창 재오픈 없이 작성창 종료
- 답변은 PLATFORM OWNER만 등록

## 3.24.0 · 핀볼 모집
- 개조서 전용이 아닌 일반 아이템 모집 지원
- 등록 개조서는 정확한 이름 일치 시 정보 자동 연결
- 회사별 `#핀볼-모집` 채널 생성/연결
- 상시 `모집 만들기` 패널 + 버튼형 참여/마감/취소
- DB 기반 상태 저장 및 BOT 재시작 복구
- 1인 동시 2개 / 회사 동시 8개 / 10분 6회 생성 제한 / 참가자 최대 40명
- 24시간 자동 만료 / 마감 결과 15분 자동 정리
- 더블클릭, 동시 생성, 버튼 연타, 중복 패널, 모듈 OFF/채널 변경 등 운영 예외 방어

## 배포
1. `SUPABASE_MIGRATION_3_24_0_PINBALL_SYSTEM.sql`을 Supabase STAGING에 적용합니다.
2. 프로젝트 전체를 GitHub AXE PRODUCT WEB STAGING에 덮어쓰고 commit / push 합니다.
3. Vercel STAGING `Ready`를 확인합니다.
4. 별도 PRODUCT STAGING BOT R23 ZIP을 SSH 서버 홈에 업로드한 뒤 `apply-axe-product.sh`로 배포합니다.

> WEB ZIP은 `apply-axe-product.sh`로 배포하지 않습니다. LIVE BOT/WEB은 대상이 아닙니다.

## DB 전제
질문게시판을 사용하는 기존 STAGING 환경은 3.23.2 및 3.23.6 migration이 적용된 상태를 유지합니다. 핀볼에는 3.24.0 migration만 추가 적용합니다.

## 검증
```bash
npm run check
npm run build
```

현재 전달 ZIP은 `node_modules`와 빌드 산출물을 포함하지 않습니다. 최종 Vite build는 Vercel STAGING `Ready`로 확인합니다.

## 보존 파일
- `SUPABASE_MIGRATION_*.sql`: DB 설치/업그레이드 migration
- `PATCH_3_24_0.md`: 이번 변경사항
- `VALIDATION_3_24_0.txt`: 정적/회귀 검증 결과
- `DEPLOY_STAGING_ONLY.txt`: STAGING 배포 경계
- `LIVE_GUIDED_SETUP_DEPLOY.md`: Guided Setup 참고
- `MINIMAL_DISCORD_AUTH_SETUP.md`: Discord OAuth 환경 설정
- `PLATFORM_OWNER_SETUP.md`: Platform Owner 설정
