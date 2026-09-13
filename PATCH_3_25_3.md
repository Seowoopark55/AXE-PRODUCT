# AXE PRODUCT WEB 3.25.3 · FULL CANVAS DASHBOARD

## 목적
대시보드 카드 정렬은 유지하면서 하단에 남던 큰 외부 공백을 줄이고, 정보가 적은 날에도 빈 화면처럼 보이지 않도록 합니다.

## 변경
- desktop dashboard matrix가 viewport의 남는 세로 공간을 자동으로 사용
- NOW/QUICK, ACTIVITY/OPERATIONS의 행 높이는 같은 기준을 유지하면서 화면 높이에 맞춰 확장
- 최근 활동이 0~2건일 때 남는 공간에 `운영 스냅샷` 표시
  - 불러온 공금 내역
  - 자산 반납 기록
  - 처리 대기
  - 사용 중 기능
- 새로운 메뉴나 장식성 카드 추가 없이 기존 운영 데이터만 재사용
- 모바일/좁은 화면에서는 자동 높이로 복귀하여 세로 스크롤 충돌 방지

## 범위
WEB only. SQL/BOT 변경 없음.
