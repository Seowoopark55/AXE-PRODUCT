# AXE PRODUCT · First-run / Onboarding System Flow Audit 3.26.3 R2

## 최종 판정
WEB 흐름은 이번 통합 패치 기준으로 일관되게 정리됐습니다. 실제 DB의 `create_company` 반환형과 3.26.0 membership claim 적용 여부만 STAGING DB에서 읽기 전용으로 확인하면 됩니다.

## 흐름
1. Discord 로그인
2. `web_claim_discord_memberships()` 실행
3. active membership 기반 회사 목록 확인
4. 회사가 있으면 기존 회사 진입
5. 회사가 없으면 두 경로만 노출
   - 신규 대표: 회사명 입력 → 내부 SLUG 자동 생성 → 회사 생성
   - 기존 팀원: Discord 이름/ID 전달 → 회사측 선등록 → `등록 확인하기`
6. 신규 회사 생성 결과를 실제 company row로 재확인
7. 현재 로그인 사용자의 OWNER membership 재확인
8. OWNER Guided Setup 시작
9. Discord 연결 → 역할 → 기능 → 채널 → 멤버 → 완료
10. 중간 이탈 시 선행조건에 맞춰 OWNER만 재개
11. 완료 후 Dashboard

## 예외 점검 결과
- 회사 생성 버튼 연속 클릭: `withMutation()`으로 동시 제출 차단 + 같은 시도 SLUG 재사용
- RPC 성공 + 응답 해석 실패: scalar/object/array 반환 인식 + 실제 company row 재조회
- RPC 응답 유실: 같은 SLUG 재조회로 복구
- 회사 생성 후 OWNER membership 누락: Guided Setup 시작 전에 명시적으로 차단/안내
- Discord 연결 중 이탈: 저장 단계와 실제 연결/카탈로그 상태를 다시 비교해 복구
- 초기설정 중 새로고침: 공용 resume resolver로 선행조건 기준 재개
- 초기설정 완료 후 재접속: completed 상태는 자동 재개 대상 아님
- 등록된 일반 멤버: Guided Setup 자동 노출 없음
- 등록된 ADMIN: Guided Setup 버튼/실행 권한 없음; 일반 회사 설정만 사용
- 미등록 팀원: 회사 검색/합류코드 없이 등록 대기
- inactive/left/suspended: claim 및 일괄등록에서 자동 활성화하지 않음
- 여러 회사 소속: 기존 company picker 유지; OWNER는 추가 회사 생성 가능
- Test Center 모듈: 실제 `MODULE_ORDER` / `MODULE_UI` 공유

## 실제 DB에서 추가 확인할 것
- `axe_product.create_company`의 정확한 identity arguments / RETURNS / 함수 정의
- 3.26.0 `web_claim_discord_memberships()` 존재 및 EXECUTE 권한
- `company_memberships.user_id` nullable 여부
- 동일 회사 내 동일 Discord ID membership 중복 그룹 존재 여부
- 최근 생성 회사에 OWNER membership이 정상적으로 함께 생성되는지

## 의도적으로 이번에 DB migration을 넣지 않은 항목
`(company_id, discord_user_id)` UNIQUE 경계는 과거 퇴사/재입사 이력 정책과 실제 중복 데이터 상태 확인 없이 추가하면 정상 이력을 깨뜨릴 수 있으므로 이번 WEB 패치에 포함하지 않았습니다.
