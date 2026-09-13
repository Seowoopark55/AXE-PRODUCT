# AXE PRODUCT STAGING · 3.25.0

3.25.0은 3.24.0 핀볼 모듈과 기존 질문게시판을 유지하면서, 기존 `피드백 · 제보` 단순 폼을 **1:1 비공개 건의게시판**으로 교체한 WEB/DB 업데이트입니다.

## 지원 구조
- `질문게시판`: 같은 회사 멤버가 질문/답변을 함께 볼 수 있는 회사 FAQ형 지원 공간
- `건의게시판`: **작성자 본인과 PLATFORM OWNER만 볼 수 있는 1:1 비공개 공간**
- 두 게시판 모두 답변은 PLATFORM OWNER만 등록
- Discord는 답변 알림용이며 사이트 데이터의 원본은 `axe_product` DB

## 건의게시판
- 개선 제안 / 오류 제보 / 기타
- 답변대기 / 확인중 / 답변완료
- 사용자에게는 자기 글만 노출
- 5건/페이지
- 답변 도착 `NEW` 표시
- 작성자 추가 메시지 → 답변대기로 재전환
- 작성자/PLATFORM OWNER 삭제
- 작성 후 상세창 자동 재오픈 없음
- 수동 `회신 Discord` 입력 없음

## 첨부사진
- 파일 선택 / Drag & Drop / Ctrl+V 붙여넣기
- JPG · PNG · WEBP
- 장당 10MB / 메시지당 최대 5장
- 앱 내부 이미지 크게보기
- private bucket `axe-suggestion-attachments`

## PLATFORM OWNER
서비스 관리 화면에서:
- 고객 질문 Queue
- 비공개 건의 · 제보 Queue
를 각각 확인합니다.

답변 등록 시 사이트 NEW 표시를 남기고, 작성자의 현재 연결 Discord ID로 DM을 시도합니다. DM 실패는 답변 흐름에 영향을 주지 않습니다.

## 배포 순서
1. `SUPABASE_MIGRATION_3_25_0_PRIVATE_SUGGESTION_BOARD.sql`을 PRODUCT STAGING Supabase SQL Editor에서 실행합니다.
2. WEB ZIP을 압축 해제해 GitHub AXE PRODUCT WEB STAGING 프로젝트에 전체 덮어씁니다.
3. commit / push 합니다.
4. Vercel STAGING 상태가 `Ready`인지 확인합니다.

> 3.25.0에는 BOT 변경이 없습니다. `apply-axe-product.sh`를 사용하지 않습니다. LIVE BOT/WEB은 대상이 아닙니다.

## 기존 migration 전제
기존 STAGING DB에는 사용 중인 이전 migration(질문게시판 3.23.x, 핀볼 3.24.0 등)이 적용된 상태를 유지하고, 이번에는 3.25.0 migration만 추가 적용합니다.

## 검증
- 전체 `npm run check` PASS
- Native Question Board 31/31 PASS
- Scale-safe lists 16/16 PASS
- PINBALL MODULE 20/20 PASS
- PRIVATE SUGGESTION BOARD 23/23 PASS
- 모든 JS/MJS `node --check` PASS

전달 ZIP에는 `node_modules`가 포함되지 않습니다. 따라서 로컬 Vite build는 실행하지 않았으며 최종 build 검증은 Vercel STAGING `Ready`로 확인합니다.
