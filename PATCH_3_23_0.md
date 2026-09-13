# AXE PRODUCT WEB 3.23.0 · QUESTION BOARD R1

## 변경
- 기존 `사용 가이드` / Guide Center UI 제거
- 사이드바 지원 메뉴를 `질문게시판`으로 전환
- Discord 포럼형 질문게시판 생성/기존 포럼 연결 지원
- 상태: `답변대기` / `확인중` / `답변완료`
- 새 질문은 상태 태그가 없어도 WEB에서는 `답변대기`로 집계
- 관리자 WEB 화면에서 상태 변경 가능
- `답변완료` 처리 시 질문 작성자에게 Discord DM 알림 시도
- 대시보드 `지금 확인할 것`에 미답변 질문 집계
- Guided Setup 빠른 설정에 질문게시판 포럼 기본 포함
- Guided Setup 직접 연결에 포럼 선택 지원
- 기존 계좌조회 채널 Guided Setup 유지
- Discord 최소 권한에 `Manage Threads` 추가 (Administrator는 요청하지 않음)

## 저장 방식
- `company_settings.settings.question_board.forum_channel_id`
- DB migration 없음

## 정리
- 제거: 사용하지 않는 과거 Guide Center 검사 코드
- 제거: 과거 PWA service worker / manifest / PWA icons
- 제거: 더 이상 참조되지 않는 과거 ambient/side brand 이미지
- 제거: 과거 patch / validation / root-cause / cleanup 산출물
- 유지: 현재 runtime asset, DB migration, STAGING 배포/Discord/Platform Owner 문서

## 참고
Discord에서 새 포럼 글이 생성되는 순간 자동으로 `답변대기` 태그를 붙이는 Gateway 이벤트 자동화는 이번 WEB 패치 범위에 포함하지 않습니다. 상태 태그가 없는 새 글도 WEB에서는 `답변대기`로 정상 집계됩니다. 관리자 상태 변경/완료 DM은 WEB에서 동작합니다.
