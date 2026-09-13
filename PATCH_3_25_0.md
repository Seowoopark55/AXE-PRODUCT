# AXE PRODUCT WEB STAGING 3.25.0 · PRIVATE SUGGESTION BOARD R1

## Changed
- 사이드바의 기존 `피드백 · 제보` 단순 제출 모달을 제거하고 `건의게시판`을 정식 페이지로 전환했습니다.
- 건의는 **작성자 본인 + AXE PRODUCT PLATFORM OWNER만 열람**하는 1:1 비공개 스레드입니다.
- 같은 회사의 OWNER / ADMIN / MANAGER / MEMBER도 다른 사용자가 작성한 건의는 볼 수 없습니다.
- 기존 `회신 Discord` 직접 입력칸을 제거했습니다. 답변 알림 대상은 로그인 멤버의 연결된 Discord ID를 자동 사용합니다.

## Board UX
- 유형: `개선 제안 / 오류 제보 / 기타`
- 상태: `답변대기 / 확인중 / 답변완료`
- 사용자 화면은 자신의 건의만 표시합니다.
- 목록은 AXE PRODUCT의 한눈에 보는 기준에 맞춰 **5건/페이지**로 제한합니다.
- 운영자 답변 후 작성자에게 `NEW`가 표시됩니다.
- 작성자는 자신의 건의에 추가 메시지를 남길 수 있고, 이때 상태는 다시 `답변대기`가 됩니다.
- 작성자 또는 PLATFORM OWNER는 스레드를 삭제할 수 있습니다.
- 건의 작성 후 작성창만 닫히며 방금 등록한 상세창을 자동으로 다시 띄우지 않습니다.

## Photos
- 질문게시판과 동일한 사진 UX를 사용합니다.
- 파일 선택 / 드래그앤드롭 / 캡처 후 Ctrl+V 붙여넣기 지원.
- JPG / PNG / WEBP, 장당 10MB, 글 또는 답변당 최대 5장.
- 첨부 이미지는 앱 내부 Lightbox로 열립니다.
- 전용 private Storage bucket `axe-suggestion-attachments`를 사용합니다.

## PLATFORM OWNER
- 서비스 관리에 기존 `질문 응답`과 별도로 `건의 · 제보` 비공개 큐를 추가했습니다.
- 전체 회사의 처리 중 건의를 한곳에서 확인할 수 있습니다.
- PLATFORM OWNER만 답변과 상태 변경을 수행합니다.
- 답변 등록 시 자동 `답변완료` 처리 후 사이트 NEW 표시 + Discord DM 알림을 시도합니다.
- DM 실패나 미연동은 답변 저장 자체를 실패시키지 않습니다.

## Privacy / abuse guards
- Customer RPC 목록은 `created_by_user_id = auth.uid()`인 자신의 글만 반환합니다.
- 상세/첨부/삭제/추가 메시지도 작성자 또는 PLATFORM OWNER 권한을 서버에서 다시 검증합니다.
- 직접 table access는 anon/authenticated에 열지 않고 SECURITY DEFINER RPC를 통해 접근합니다.
- 동일 내용 15초 내 중복 제출 방지.
- 작성자별 처리 중 건의 최대 10건.
- 작성자별 24시간 신규 건의 최대 30건.
- 스레드당 추가 메시지 최대 100개.
- 사진 업로드 경로도 company / suggestion / auth user 기준으로 검증합니다.

## Compatibility
- 기존 `product_feedback` / `submit_product_feedback` 레거시 경로는 데이터 호환을 위해 삭제하지 않았습니다.
- 고객 WEB에서는 더 이상 기존 피드백 모달을 노출하지 않습니다.
- Pinball 3.24.0 및 기존 질문게시판 기능은 그대로 유지합니다.

## Deploy
1. PRODUCT STAGING Supabase에 `SUPABASE_MIGRATION_3_25_0_PRIVATE_SUGGESTION_BOARD.sql` 적용.
2. WEB STAGING 전체본을 GitHub 프로젝트에 덮어쓰기.
3. commit / push 후 Vercel STAGING `Ready` 확인.

BOT 변경은 없습니다. `apply-axe-product.sh`를 사용하지 않습니다. LIVE는 대상이 아닙니다.
