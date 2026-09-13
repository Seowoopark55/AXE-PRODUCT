# AXE PRODUCT WEB · STAGING

현재 STAGING WEB 전체 소스입니다. Production/LIVE와 분리해서 사용합니다.

## 배포

1. 이 프로젝트 전체를 GitHub의 AXE PRODUCT WEB STAGING 프로젝트에 덮어씁니다.
2. commit / push 합니다.
3. Vercel STAGING 배포가 Ready인지 확인합니다.
4. STAGING에서 로그인 · Discord 연결 · 질문게시판 · 운영 화면을 검증합니다.

> WEB 파일은 SSH의 `apply-axe-product.sh`로 배포하지 않습니다.

## 현재 지원 구조

- 운영 대시보드
- 공금 · 멤버 · 자산 · 계좌 관리
- Discord Guided Setup
- 공금 / 총알 / 무법지대 / 개조서 / 요리 / 계좌조회 채널 연결
- 질문게시판 Discord 포럼 연결
  - 답변대기
  - 확인중
  - 답변완료
  - 답변완료 처리 시 작성자 DM 알림 시도
- Platform Owner 전용 서비스 관리

## 질문게시판

기존 긴 `사용 가이드`는 제거했습니다. 기본 사용법은 각 Discord 기능 패널에서 안내하고, 추가 질문은 Discord `질문게시판` 포럼에서 처리합니다.

Guided Setup의 채널 단계에서 질문게시판 포럼을 자동 생성하거나 기존 포럼을 직접 연결할 수 있습니다. 포럼 채널 ID는 `company_settings.settings.question_board.forum_channel_id`에 저장합니다. 별도 DB migration은 필요하지 않습니다.

질문 상태 변경에는 Discord `Manage Threads` 권한이 필요합니다. 기존에 연결된 서버는 권한이 부족하면 회사 설정의 `권한 다시 승인`을 한 번 진행합니다.

## 개발 검증

```bash
npm run check
npm run build
```

## 보존 파일

- `SUPABASE_MIGRATION_*.sql`: 현재 프로젝트의 DB 설치/복구 참고용 migration
- `DEPLOY_STAGING_ONLY.txt`: STAGING 배포 경계
- `LIVE_GUIDED_SETUP_DEPLOY.md`: Guided Setup 배포 참고
- `MINIMAL_DISCORD_AUTH_SETUP.md`: Discord OAuth 환경 설정
- `PLATFORM_OWNER_SETUP.md`: Platform Owner 설정
