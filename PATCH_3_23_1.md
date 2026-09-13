# AXE PRODUCT WEB 3.23.1 · NATIVE QUESTION BOARD

## 핵심 변경

- `사용 가이드` 대신 `질문게시판` 유지
- Discord 포럼 기반 질문게시판 제거
- 질문/답변을 AXE PRODUCT 자체 DB에 저장
- 질문 상태: `답변대기 / 확인중 / 답변완료`
- PLATFORM OWNER가 답변하면 자동 `답변완료`
- 작성자에게 사이트 `NEW` 알림 표시
- 작성자의 Discord 계정이 연결되어 있으면 답변완료 DM 알림 시도
- Discord 미연동/DM 차단 상태에서도 사이트 질문게시판은 정상 동작

## 사용자 UX

- 회사 멤버는 질문게시판에서 질문을 직접 작성
- 같은 회사의 기존 질문/답변을 함께 열람하여 FAQ처럼 재사용
- 추가 질문은 최초 작성자만 같은 스레드에 작성 가능
- 다른 멤버는 별도 질문 작성
- 대시보드에 확인하지 않은 새 답변 표시

## PLATFORM OWNER UX

- 서비스 관리에 전체 회사 질문 큐 표시
- 답변대기/확인중 건수 표시
- 질문 열기 → 상태 변경 → 답변 등록
- 답변 등록 시 완료 처리 + 선택적 Discord DM
- PLATFORM OWNER 대시보드의 `지금 확인할 것`에도 미처리 고객 질문 표시

## Discord / Guided Setup

- 질문게시판 포럼 생성/연결 제거
- `questionForum` 설정 제거
- `Manage Threads` 권한 제거
- Guided Setup 채널 생성 API는 텍스트 운영 채널만 처리
- 기존 최소 권한 baseline `93200` 복구

## DB

신규 migration:
- `SUPABASE_MIGRATION_3_23_1_NATIVE_SUPPORT_BOARD.sql`

신규 테이블:
- `axe_product.support_questions`
- `axe_product.support_question_messages`

직접 테이블 접근은 차단하고 authenticated 사용자는 권한 검증 RPC를 통해서만 접근합니다.

## 알림

신규 API:
- `POST /api/support/notify`

PLATFORM OWNER 권한을 서버에서 다시 검증한 뒤 저장된 작성자 Discord User ID로 DM을 시도합니다. DM 실패는 HTTP 성공 응답의 `sent:false`로 처리하여 질문 답변 흐름을 깨지 않습니다.
