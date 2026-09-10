# AXE PRODUCT WEB STAGING 3.14.4 · Runtime Layout Fix

현재 PRODUCT STAGING 3.14.3 + DB bridge 1.7.37 위에 적용하는 WEB-only hotfix입니다.

수정:
- 로그인 후 회사 생성 화면이 순간 노출되는 startup flash 제거
- 회사 선택 native dropdown을 안정적인 custom picker로 교체
- 공금 설정 500px compact board 잘림 수정
- 자산 현황 710px / 반납 내역 640px compact workspace 복구
- 회사 설정 하위 카테고리 + 저장 버튼 정렬 복구
- 기능 설정 2채널(총알) lane 및 ON/OFF X축 정렬 복구

추가 SQL 없음.
BOT 배포 아님. `apply-axe-product.sh` 사용 금지.
GitHub PRODUCT STAGING 웹 프로젝트 루트에 전체 덮어쓰기 후 push합니다.
