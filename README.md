# AXE PRODUCT STAGING — STAGE 2

독립 상품화 프런트엔드입니다.

## 절대 경계

- AXE 운영 BOT / NEW AXE NET 코드와 분리
- AXE HUB 프런트 코드와 분리
- 같은 AXE HUB Supabase **프로젝트만** 무료 STAGING 용도로 공유
- 앱 DB 쿼리는 `axe_product` schema만 사용
- `service_role` 키는 프런트에 절대 넣지 않음

## STAGE 1 상태

DB CORE / RLS / Tenant A-B isolation PASS를 전제로 합니다.

## STAGE 2 기능

- Discord OAuth 로그인
- 첫 회사 생성
- 여러 회사 생성 및 전환
- 회사별 멤버 목록
- OWNER / ADMIN / MANAGER / MEMBER 역할
- OWNER / ADMIN 역할 변경
- 마지막 OWNER 제거 DB 차단
- 회사별 선택 모듈 ON/OFF
- 회사 기본 설정
- Audit 최근 로그
- Discord 연결 상태 자리(실제 연결은 STAGE 3)

## Supabase Dashboard에서 한 번 해야 할 설정

### 1. Data API에 custom schema 노출

AXE HUB Supabase의 Data API / API settings에서
`axe_product`를 **Exposed schemas**에 추가합니다.

기존 `public`은 제거하지 않습니다.
단순히 `axe_product`를 추가합니다.

STAGE 1에서 RLS가 전 테이블에 적용되어 있으므로
클라이언트가 custom schema에 접근해도 회사 경계는 DB RLS가 결정합니다.

### 2. Auth Redirect URL 추가

기존 AXE HUB의 Site URL은 바꾸지 않습니다.

Auth URL Configuration의 허용 Redirect URL 목록에
상품화 STAGING 주소만 추가합니다.

로컬 테스트:
`http://localhost:5173/`

Vercel 배포 후:
실제 STAGING Vercel URL의 `/` 주소

## 로컬 실행

1. `.env.example`을 `.env.local`로 복사
2. 아래 두 PUBLIC 값만 입력

```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...
```

프로젝트 화면에서 publishable key 대신 legacy anon key만 보이면:

```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

둘 중 하나만 사용하면 됩니다.

**service_role / secret key를 넣으면 안 됩니다.**

3. 설치/검사/실행

```bash
npm install
npm run check
npm run dev
```

## 첫 실제 UI 테스트 순서

1. Discord 로그인
2. `테스트 회사 A` 생성
3. 모듈 1~2개 ON
4. 회사 설정 저장
5. Audit에서 변경 기록 확인
6. `+ 새 회사`로 `테스트 회사 B` 생성
7. 회사 전환
8. A에서 켠 모듈이 B에 따라오지 않는지 확인
9. 다시 A로 전환했을 때 A 설정이 유지되는지 확인

이 테스트는 실제 `axe_product` STAGING 데이터로 남습니다.
나중에 정리할 수 있으므로 테스트 회사명에 `TEST`를 넣는 것을 권장합니다.

## 아직 없는 기능

STAGE 3 예정:

- 회사 초대 코드 / 가입 승인
- Discord Guild 연결
- Discord Role ↔ SaaS Role 매핑
- 회사 관리자 지정 흐름
- 모듈별 실제 데이터 테이블
- Vercel STAGING 배포 자동 점검

## 소스 안전 검사

`npm run check`

이 검사는 최소한 다음을 막습니다.

- service role 키/표현의 프런트 포함
- `new_axe_net` 참조
- AXE HUB `profiles`, `builds` 직접 쿼리
- Supabase client가 `axe_product` schema에서 벗어남
