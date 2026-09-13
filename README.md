# AXE PRODUCT STAGING · 3.25.2

3.25.2는 3.25.1의 기능을 그대로 유지하면서 대시보드의 오와열과 화면 밸런스를 다시 정돈한 WEB 전용 업데이트입니다.

## 3.25.2 · Balanced Command Center

- 대시보드 폭을 현재 콘텐츠 레일에 맞게 확장해 좌우의 애매한 빈 공간을 줄였습니다.
- `지금 확인할 것 / 빠른 실행`과 `최근 활동 / 운영 연결 상태`가 하나의 고정 2열 그리드에 정확히 맞춰집니다.
- 같은 행의 카드 높이를 강제로 동일하게 맞춰 박스 하단선이 어긋나지 않습니다.
- `지금 확인할 것`은 최대 4개만 노출하고 추가 항목은 숫자로 요약해 대시보드가 길어지지 않습니다.
- ALL CLEAR 상태는 단순 빈 공간 대신 공금 검수 / 계좌 검수 / 지원 응답 / 미배정 자산을 한 줄로 보여줍니다.
- 빠른 실행의 중복 안내 문구를 제거하고 2×2 액션 영역 자체가 카드 높이를 균형 있게 채웁니다.
- 최근 활동은 최대 4건을 유지하고, 운영 연결 상태는 Discord + 사용 기능을 같은 높이 안에서 정돈합니다.
- 데스크톱 대시보드 내부에는 별도 세로 스크롤을 만들지 않습니다.

> 3.25.2는 WEB 전용입니다. 추가 SQL/BOT 배포는 없습니다. LIVE는 대상이 아닙니다.

---

# AXE PRODUCT STAGING · 3.25.1

3.25.1은 3.25.0 기능을 모두 유지하면서 대시보드를 한 화면 중심으로 다시 정돈한 WEB 전용 업데이트입니다.

## 3.25.1 · 대시보드 한눈에 정돈
- 빠른 실행을 공금 등록 / 멤버 관리 / 자산 추가 / 계좌 관리의 핵심 운영 액션으로 정리
- 회사 설정은 작은 헤더 바로가기로 이동
- 질문게시판 / 건의게시판은 좌측 지원 메뉴와 알림 영역으로 역할 분리
- `지금 확인할 것`을 2열 컴팩트 카드로 재배치
- 최근 활동 4건 제한
- 데스크톱 대시보드 전체 밀도를 줄여 세로 스크롤 발생을 억제
- **WEB 전용 패치이며 추가 SQL/BOT 변경 없음**

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
1. WEB ZIP을 압축 해제해 GitHub AXE PRODUCT WEB STAGING 프로젝트에 전체 덮어씁니다.
2. commit / push 합니다.
3. Vercel STAGING 상태가 `Ready`인지 확인합니다.

> 3.25.1은 WEB 전용입니다. 3.25.0 DB migration이 이미 적용된 현재 STAGING 기준으로 추가 SQL/BOT 작업은 없습니다. `apply-axe-product.sh`를 사용하지 않습니다. LIVE BOT/WEB은 대상이 아닙니다.

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
