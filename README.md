# AXE PRODUCT STAGING · 3.23.3

현재 질문게시판은 AXE PRODUCT 자체 기능입니다. 질문/답변은 `axe_product`에 저장하며 Discord 포럼을 사용하지 않습니다. 질문 작성자와 PLATFORM OWNER는 질문을 삭제할 수 있고, 질문·답변에는 파일 선택/드래그/Ctrl+V 방식으로 사진을 최대 5장 첨부할 수 있습니다. 첨부사진은 새 탭 대신 사이트 내부 이미지 뷰어에서 열립니다.

DB 적용: `SUPABASE_MIGRATION_3_23_2_NATIVE_SUPPORT_ATTACHMENTS_DELETE.sql`

# AXE PRODUCT WEB · STAGING

현재 STAGING WEB 전체 소스입니다. Production/LIVE와 분리해서 사용합니다.

## 배포 순서

1. 질문게시판 DB가 아직 설치되지 않았다면 `SUPABASE_MIGRATION_3_23_2_NATIVE_SUPPORT_ATTACHMENTS_DELETE.sql`을 먼저 적용합니다. 이미 3.23.2를 적용했다면 추가 SQL은 없습니다.
2. 이 프로젝트 전체를 GitHub의 AXE PRODUCT WEB STAGING 프로젝트에 덮어씁니다.
3. commit / push 합니다.
4. Vercel STAGING 배포가 `Ready`인지 확인합니다.
5. STAGING에서 로그인 → 질문 등록 → PLATFORM OWNER 답변 → 답변완료/알림 흐름을 확인합니다.

> WEB 파일은 SSH의 `apply-axe-product.sh`로 배포하지 않습니다.

## 현재 지원 구조

- 운영 대시보드
- 공금 · 멤버 · 자산 · 계좌 관리
- Discord Guided Setup
- 공금 / 총알 / 무법지대 / 개조서 / 요리 / 계좌조회 채널 연결
- AXE PRODUCT 자체 질문게시판
  - 답변대기 / 확인중 / 답변완료
  - 사이트 내부 질문·답변 저장
  - PLATFORM OWNER 전역 미답변 큐
  - 작성자에게 새 답변 배지 표시
  - Discord 계정이 연결된 작성자는 답변완료 시 DM 알림 시도
- Platform Owner 전용 서비스 관리

## 질문게시판

질문게시판은 Discord 포럼을 사용하지 않습니다. 질문과 답변의 원본 데이터는 `axe_product.support_questions`, `axe_product.support_question_messages`에 저장됩니다.

기존 긴 `사용 가이드`는 제거했습니다. 각 Discord 기능 패널이 기본 사용법을 안내하고, 해결되지 않는 내용만 사이트의 `질문게시판`에 남깁니다.

회사 멤버는 같은 회사의 기존 질문과 답변을 열람할 수 있어 기존 답변이 자연스럽게 FAQ 역할을 합니다. 추가 질문은 최초 질문 작성자만 해당 스레드에 남길 수 있고, 다른 멤버는 새 질문을 등록합니다.

PLATFORM OWNER가 답변을 등록하면 자동으로 `답변완료`가 되고 작성자에게 사이트 `NEW` 표시가 생깁니다. 작성자의 Discord User ID가 연결되어 있으면 DM도 시도하지만, DM 실패나 Discord 미연동 때문에 질문게시판 자체가 실패하지는 않습니다.

질문게시판 때문에 Discord 서버나 포럼 채널을 별도로 연결할 필요가 없습니다. Guided Setup에도 질문게시판 채널은 생성하지 않습니다.

## 개발 검증

```bash
npm run check
npm run build
```

## 보존 파일

- `SUPABASE_MIGRATION_*.sql`: 현재 프로젝트 DB 설치/복구 및 이번 기능 migration
- `PATCH_3_23_3.md`: 이번 변경사항
- `VALIDATION_3_23_3.txt`: 정적 검증 결과
- `DEPLOY_STAGING_ONLY.txt`: STAGING 배포 경계
- `LIVE_GUIDED_SETUP_DEPLOY.md`: Guided Setup 배포 참고
- `MINIMAL_DISCORD_AUTH_SETUP.md`: Discord OAuth 환경 설정
- `PLATFORM_OWNER_SETUP.md`: Platform Owner 설정
