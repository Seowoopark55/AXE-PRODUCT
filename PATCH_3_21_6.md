# AXE PRODUCT WEB 3.21.6 — MODBOOK CHANNEL

- 개조서 기능에 전용 Discord 채널 설정 추가
- Guided Setup 빠른 설정에서 `#개조서` 생성/자동 연결
- Guided Setup 직접 연결에서 기존 개조서 채널 선택 지원
- 회사 설정 > 기능 설정에서도 개조서 채널 변경 가능
- DB migration 없음: 기존 `company_modules.settings` JSON의 `channel_id` 사용
- PRODUCT BOT의 전용 채널 채팅 UX와 연동
