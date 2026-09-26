LAC HUB / 게임정보 관리자 기능 적용된 저장소 전체본 (hub(5).zip 기준)

이 파일은 GitHub에 업로드할 파일이 아닙니다. ZIP 자체가 100MB 이상이라 GitHub에 커밋하면 Push가 거부됩니다.
압축을 저장소 바깥에서 풀고, 압축 해제한 파일과 폴더만 저장소 최상위에 옮기세요.

[사전 작업]
- GitHub Desktop에서 현재 저장소를 선택하고 Repository > Show in Explorer를 누르세요.
- 저장소 폴더 전체를 다른 위치에 백업하세요. 이때 숨김 폴더 .git까지 백업하면 Git 연결 복구에 도움이 됩니다.
- 저장소 폴더 자체, 숨김 폴더 .git, .gitignore 파일은 삭제하지 마세요.
- 로컬 파일 중 원본 ZIP에 포함되지 않은 추가 수정 및 개인 설정(.env 등)이 있다면 별도 보관하세요.

[안전한 전체본 교체]
1. 이 ZIP을 GitHub 저장소 폴더 바깥(예: 다운로드 폴더)에 압축 해제합니다.
2. 압축 해제 결과의 최상위에는 package.json / vercel.json / api / build / hub / scripts / server가 있습니다.
   'hub' 폴더 자체에 다시 들어가는 구조가 아닙니다. '저장소/hub/src/ui/gameInfoAdmin.js'가 되어야 합니다.
3. 현재 GitHub 저장소 폴더 안에서 .git 폴더는 보존하고, 기존 프로젝트 파일을 교체합니다.
   더 안전한 방법은, 백업 후 기존 파일을 지우지 않고 압축 해제한 최상위 파일과 폴더를 전체 복사하여
   같은 이름의 파일을 덮어쓰는 것입니다. 불필요한 잔여 파일이 있다면 변경 목록 확인 후 정리하세요.
4. README_LAC_HUB_ADMIN_FULL_REPLACE.txt 및 이 ZIP 파일은 저장소에 넣지 않아도 됩니다.
5. ZIP 파일 자체나 이전 hub.zip을 저장소에 넣지 마세요.
6. GitHub Desktop 변경 목록에서 관리자 기능 추가 파일을 확인한 후 Commit/Push하세요.
   hub/src/ui/gameInfoAdmin.js , hub/src/styles/game-info-admin.css 가 있어야 합니다.
   hub/src/ui/render.js 에 game-center__admin-trigger 문자열이 있어야 합니다.
7. Vercel 새 배포가 성공해야 웹에 반영됩니다. 운영자 로그인 후 게임정보에서 '정보 관리'를 확인하세요.

[DB 적용 별개]
웹 화면 배포와 관계없이 신규 등록·수정·이미지 업로드에는
LAC_HUB_GAME_INFO_ADMIN_20260926.sql 을 Supabase SQL Editor에서 별도로 실행해야 합니다.
이 전체 ZIP을 GitHub에 배포해도 Supabase SQL은 자동 실행되지 않습니다.
기존 DB 백업, SQL 실행 결과, 플랫폼 관리자 권한도 확인하세요.

[기준과 수정 범위]
기준: 사용자가 제공한 hub(5).zip 그대로, 기존 파일 5개 교체 + 관리자 JS/CSS 2개 신규.
다른 기존 웹·BOT·BUILD 코드 및 이미지 자산은 변경하지 않았습니다.
기존 소스에 포함된 웹 복구본 안내 TXT 파일들은 기능에 영향이 없어 원본 그대로 보존했습니다.
개별 파일 크기는 GitHub 단일 파일 100MB 제한 이하입니다. 단 전체 ZIP은 100MB 이상입니다.
