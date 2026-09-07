# AXE PRODUCT STAGE 4D.1

상품화 AXE PRODUCT의 공금 증빙 입력 UX 보강본이다.

## 변경 범위
- 기존 파일 선택 방식 유지
- 공금 증빙 영역에서 캡처 이미지 Ctrl+V 붙여넣기 지원
- 선택/붙여넣기 이미지 미리보기
- 선택된 증빙 제거 버튼
- JPG/PNG/WEBP 및 10MB 제한 유지
- 기존 비공개 `axe-fund-evidence` Storage / RPC / 검수 흐름 그대로 사용

## 변경하지 않는 것
- Supabase DB migration 없음
- Storage bucket/policy 변경 없음
- Discord staging bot 변경 없음
- 실운영 AXE BOT / NEW AXE NET / AXE HUB 변경 없음
- Secret 값 포함 없음

## 적용
이 ZIP의 내용 전체를 로컬 AXE-PRODUCT 루트에 덮어쓴 뒤 기존 방식대로 GitHub PUSH한다.
Vercel이 Ready가 되면 공금 > 납부 증빙 영역을 클릭하고 캡처 이미지를 Ctrl+V로 붙여넣어 미리보기와 신청을 확인한다.

버전: 0.8.3


## 0.8.3 - STAGE 4D.1 preview fix
- Clipboard paste no longer triggers a full app re-render that erased the selected evidence preview.
- Evidence preview thumbnail enlarged for clearer visual confirmation.
- File picker and clipboard flows remain unchanged otherwise.
