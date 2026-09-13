# AXE PRODUCT WEB STAGING 3.24.0 · PINBALL MODULE R1

## Added
- `핀볼 모집`을 AXE PRODUCT 정식 회사 모듈로 추가했습니다.
- Guided Setup / 회사 설정에서 `#핀볼-모집` 채널을 새로 만들거나 기존 채널을 연결할 수 있습니다.
- 등록 개조서와 일반 아이템을 같은 모집 흐름으로 처리합니다.
- 등록 개조서는 이름이 정확히 일치할 때만 정보를 자동 연결하며, DB에 없는 이름도 일반 아이템으로 모집할 수 있습니다.
- 전체 기능을 모두 켠 회사의 Guided Setup을 위해 Discord 자동 생성 채널 상한을 7 → 8로 조정했습니다.
- 새 모듈이 추가된 뒤 기존/신규 회사에 `company_modules` 행이 없더라도 WEB이 카탈로그를 기준으로 표시하고 owner/admin 저장 시 안전하게 upsert하도록 보강했습니다.

## Runtime / anti-spam
- 모집/참여 상태는 BOT 로컬 JSON이 아니라 `axe_product` DB에 저장합니다.
- 1인 동시 모집 최대 2개 / 회사 동시 모집 최대 8개.
- 1인 10분 내 모집 생성 최대 6회 + 생성 간 10초 쿨다운.
- 한 모집 최대 40명 / 1인당 1~20볼 / 아이템명 60자 / 메모 200자.
- 모집은 24시간 후 자동 만료됩니다.
- request key idempotency와 회사 단위 advisory lock으로 더블클릭/동시 생성 race를 방어합니다.
- 참가 토글은 세션 row lock + 1초 쿨다운 + `(session_id, discord_user_id)` PK로 중복/연타를 방어합니다.
- 기능 OFF 또는 채널 변경 시 기존 열린 모집은 자동 취소되어 나중에 다시 살아나거나 동시 모집 상한을 계속 점유하지 않습니다.
- 이미 종료된 모집을 재마감해 결과가 중복 생성되는 경로를 차단합니다.
- 아이템명 URL / Discord 멘션 입력을 차단합니다.

## Discord UX
- 채널 상시 안내 패널의 `모집 만들기` 버튼에서 모달을 엽니다.
- 모집 카드는 `참여 / 취소`, `모집 마감`, `모집 취소` 버튼을 사용합니다.
- 마감 시 기존 핀볼 사이트 입력 형식(`이름`, `이름*2`)으로 명단을 생성합니다.
- 동일 표시명은 `이름`, `이름2` 형태로 충돌을 방지합니다.
- 마감 결과 메시지는 15분 뒤 자동 정리합니다.
- BOT 재시작/일시 오류 시 DB 상태를 기준으로 모집 패널을 복원하며, 저장 실패 뒤 남은 동일 세션 패널을 재사용해 중복 패널 생성을 방지합니다.
- 참가자 표시는 카드가 과도하게 길어지지 않도록 일부만 보여주고 전체 인원은 숫자로 유지합니다.

## Deploy order
1. Supabase PRODUCT STAGING에 `SUPABASE_MIGRATION_3_24_0_PINBALL_SYSTEM.sql` 적용.
2. WEB STAGING 전체본을 GitHub → Vercel로 배포.
3. PRODUCT STAGING BOT R23 manifest ZIP을 `apply-axe-product.sh`로 배포.

LIVE는 이 패치의 대상이 아닙니다.
