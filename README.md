# AXE PRODUCT STAGE 4I WEB

버전 0.9.0

- 기존 공금 신청/증빙/검수 UI 유지
- 승인 완료 납부에 `승인 취소` 버튼 추가
- 승인 취소는 삭제가 아니라 DB의 cancelled 상태와 원장 취소 이력을 사용
- 취소 후 해당 주차는 다시 미납/재신청 가능
- raw fund table 직접 접근 없이 RPC만 사용

적용: WEB 폴더 안의 내용 전체를 AXE-PRODUCT GitHub 루트에 덮어쓴 뒤 PUSH.
