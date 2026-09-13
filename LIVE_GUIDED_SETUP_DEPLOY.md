# AXE PRODUCT · 실전 초기설정 가이드 배포 요구사항

WEB 3.20.0부터 회사 설정의 Guided Setup은 Preview가 아니라 현재 회사에 실제 설정을 단계별 반영합니다.

## Vercel 서버 환경변수
기존 Supabase / Discord OAuth 서버 환경변수와 함께 다음 값이 필요합니다.

- `DISCORD_BOT_TOKEN` = PRODUCT BOT의 Bot Token

`DISCORD_BOT_TOKEN`은 서버 전용입니다. `VITE_` 접두사를 붙이지 않습니다.

## Discord BOT 권한
자동 채널 생성에는 `Manage Channels`, 질문게시판 상태 변경에는 `Manage Threads` 권한이 필요합니다. Discord 서버 연결 OAuth는 이 기능에 필요한 최소 권한만 요청하며 `Administrator` 권한은 요청하지 않습니다.

기존 서버의 BOT에 권한이 없다면 BOT 역할 권한을 수정하거나 Discord 연결을 다시 승인해야 합니다. AXE는 Guided Setup에서 채널을 생성할 수 있지만 자동 삭제는 하지 않습니다.

## 역할 기반 멤버 일괄 등록
멤버 단계는 선택한 Discord 역할을 가진 서버 멤버만 불러옵니다. 서버 인원이 많아도 게스트 역할 등을 제외하고 회사 역할만 필터링할 수 있습니다.

Developer Portal에서 PRODUCT BOT의 **Server Members Intent**가 필요합니다.

실제 일괄 등록 시 브라우저가 보낸 Discord ID를 그대로 신뢰하지 않습니다. 서버가 회사의 연결된 Guild를 다시 찾고, 선택한 Discord 역할의 멤버인지 다시 스캔한 뒤 검증된 ID만 `company_memberships` 등록 대상으로 사용합니다. OWNER/ADMIN 권한도 서버에서 재확인합니다.

## 동작 흐름
1. 새 회사 생성
2. Guided Setup 자동 시작
3. Discord 서버 연결
4. 관리자 / 일반 멤버 Discord 역할 지정
5. 사용할 AXE 기능 선택
6. 채널 설정
   - 질문게시판: Discord 포럼 채널을 기본 생성하거나 기존 포럼을 연결
   - 빠른 설정: 카테고리·채널명을 원하는 이름으로 수정 → 실제 Discord 채널 생성 → 기능 자동 연결
   - 직접 연결: 기존 Discord 채널/포럼 선택 → 기능 연결
7. Discord 역할로 멤버 필터 → 멤버 선택 → AXE MEMBER/ADMIN 일괄 등록
8. 완료 후 운영 콘솔 진입

## 채널 생성 안전장치
- Guild ID는 브라우저가 지정하지 않고 서버에서 회사 연결정보로 결정합니다.
- OWNER/ADMIN을 서버에서 다시 확인합니다.
- 같은 이름의 카테고리/채널이 이미 있으면 가능한 경우 재사용합니다.
- 한 번의 Guided Setup 요청에 중복 채널명이 있으면 생성 전에 거부합니다.
- AXE가 Discord 채널을 자동 삭제하지 않습니다.
- 생성된 Discord channel id를 AXE 모듈 설정에 저장합니다.
- 질문게시판 포럼 ID는 `company_settings.settings.question_board.forum_channel_id`에 저장합니다.
- 질문게시판에는 `답변대기 / 확인중 / 답변완료` 상태 태그를 준비합니다.

## DB/RLS STAGING 확인 필수
멤버 일괄 등록은 사용자 access token으로 `axe_product.company_memberships`에 기록하므로 실제 PRODUCT STAGING의 RLS/제약조건을 그대로 적용받습니다. 정적 코드 검사는 통과해도 실제 RLS가 INSERT를 거부할 수 있습니다.

배포 후 OWNER 계정으로 최소 1명을 일괄 등록하고 다음을 확인합니다.
- 같은 회사에만 row가 생성되는가
- 다른 회사 ID로는 등록할 수 없는가
- 기존 등록 멤버가 중복 생성되지 않는가
- 일반 MEMBER 계정으로 API 호출 시 403/DB 거부되는가

## 세션 복구
WEB은 `persistSession + autoRefreshToken`에 더해 다음을 수행합니다.

- 앱 부팅 시 만료가 가까운 세션 선제 갱신
- 백그라운드 탭에서 돌아오는 순간 강제 세션 재확인
- 브라우저 focus / network online 복귀 시 세션 복구
- 화면을 계속 사용 중일 때 10분 간격 세션 health check
- transient `SIGNED_OUT` 이벤트 발생 시 저장된 refresh session 복구를 먼저 시도

그래도 일정 시간 후 로그아웃된다면 WEB 코드가 아니라 Hosted Supabase의 Auth Session 정책이 원인일 수 있습니다. Auth → Sessions에서 Time-box / Inactivity timeout / Single session 값을 실제 프로젝트에서 확인해야 합니다.

## Discord 로그인 이메일 권한
WEB은 Custom OAuth provider를 사용할 준비가 되어 있지만 Hosted Supabase 설정이 완료되지 않으면 기존 `discord` provider로 fallback합니다. 따라서 ZIP 배포만으로 `이메일 주소 보기`가 사라지는 것은 아닙니다. `MINIMAL_DISCORD_AUTH_SETUP.md` 절차를 STAGING에서 검증한 뒤 provider 환경변수를 전환합니다.
