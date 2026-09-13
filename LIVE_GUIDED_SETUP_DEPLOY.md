# AXE PRODUCT · 실전 초기설정 가이드 배포 요구사항

회사 설정의 Guided Setup은 현재 회사의 Discord 운영 기능을 실제 설정합니다.

## Vercel 서버 환경변수

기존 Supabase / Discord OAuth 서버 환경변수와 함께 다음 값이 필요합니다.

- `DISCORD_BOT_TOKEN` = PRODUCT BOT의 Bot Token

`DISCORD_BOT_TOKEN`은 서버 전용입니다. `VITE_` 접두사를 붙이지 않습니다.

## Discord BOT 권한

자동 채널 생성에는 `Manage Channels`가 필요합니다. AXE PRODUCT는 필요한 최소 권한만 요청하며 `Administrator` 권한은 요청하지 않습니다.

질문게시판은 3.23.1부터 사이트 자체 기능이므로 Discord 포럼/스레드 권한이 필요하지 않습니다.

## 역할 기반 멤버 일괄 등록

멤버 단계는 선택한 Discord 역할을 가진 서버 멤버만 불러옵니다. Developer Portal에서 PRODUCT BOT의 **Server Members Intent**가 필요합니다.

실제 일괄 등록 시 브라우저가 보낸 Discord ID를 그대로 신뢰하지 않습니다. 서버가 회사의 연결된 Guild와 선택 역할을 다시 확인한 뒤 검증된 멤버만 `company_memberships` 등록 대상으로 사용합니다.

## 동작 흐름

1. 새 회사 생성
2. Guided Setup 자동 시작
3. Discord 서버 연결
4. 관리자 / 일반 멤버 Discord 역할 지정
5. 사용할 AXE 기능 선택
6. 필요한 운영 채널 설정
   - 빠른 설정: AXE PRODUCT 카테고리와 텍스트 채널 생성 → 기능 자동 연결
   - 직접 연결: 기존 Discord 텍스트 채널 선택 → 기능 연결
7. Discord 역할로 멤버 필터 → 멤버 선택 → AXE MEMBER/ADMIN 일괄 등록
8. 완료 후 운영 콘솔 진입

질문게시판은 위 Discord 채널 설정과 독립적이며 사이트 안에서 바로 사용할 수 있습니다.

## 채널 생성 안전장치

- Guild ID는 브라우저가 지정하지 않고 서버에서 회사 연결정보로 결정합니다.
- OWNER/ADMIN을 서버에서 다시 확인합니다.
- 같은 이름의 카테고리/채널이 이미 있으면 가능한 경우 재사용합니다.
- 한 번의 요청에 중복 채널명이 있으면 생성 전에 거부합니다.
- AXE가 Discord 채널을 자동 삭제하지 않습니다.
- 생성된 Discord channel id만 해당 AXE 기능 설정에 저장합니다.
- Guided Setup은 질문게시판용 포럼을 생성하거나 연결하지 않습니다.

## DB/RLS STAGING 확인 필수

멤버 일괄 등록은 사용자 access token으로 `axe_product.company_memberships`에 기록하므로 실제 PRODUCT STAGING의 RLS/제약조건을 그대로 적용받습니다.

배포 후 OWNER 계정으로 최소 1명을 일괄 등록하고 다음을 확인합니다.
- 같은 회사에만 row가 생성되는가
- 다른 회사 ID로는 등록할 수 없는가
- 기존 등록 멤버가 중복 생성되지 않는가
- 일반 MEMBER 계정으로 관리자 API 호출 시 거부되는가

## 세션 복구

WEB은 `persistSession + autoRefreshToken`과 함께 앱 부팅/탭 복귀/네트워크 복귀 시 세션 상태를 재확인합니다. 일정 시간 후 반복 로그아웃이 발생하면 Hosted Supabase Auth의 Session 정책도 함께 확인합니다.

## Discord 로그인 이메일 권한

최소권한 로그인 전환은 `MINIMAL_DISCORD_AUTH_SETUP.md`를 따릅니다. 질문게시판의 사이트 저장 여부와 Discord OAuth 로그인 방식은 별개입니다.
