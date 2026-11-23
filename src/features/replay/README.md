# 지난 뉴스 Replay 데스크톱 (P1-01·03)

- 디자인: Figma `qnwfwZtYuzz6YwibShM2JE`, `427:135` 및 기간·금리·저장 완료·상태 시안.
- `/dev/replay/preview/results`: 명시적인 개발 목. 두 대상, 1·5·20거래일, 원시 변화량과 금리 %p, 그래프, 통합 회고, 이탈 보호, 저장 실패/응답 유실 재시도, 새로고침 후 읽기 전용 확인. 브라우저 탭의 sessionStorage만 사용하며 서버 저장이 아니다. 목과 미리보기는 배포 빌드에서 제외한다.
## 학습과 결과 API

- 지난 뉴스 상세에서 예측을 시작하면 대상 1~3개 선택과 기간별 예측 작성으로 이어진다. 임시 저장 또는 제출 시 Replay 세션을 생성하고, 같은 뉴스의 초안을 다시 열면 서버에 저장된 선택과 예측을 불러온다.
- 제출 후 최초 피드백 상세의 최신 상태를 확인한다. 준비 완료 후 실제 결과 보기 버튼을 눌렀을 때만 `POST /learning-sessions/{id}/outcomes/reveal`을 호출한다. `/replay/:replayId/results`에서 `replayId`는 Replay 학습 세션 ID다. 세션 상세에 유효한 공개 시각이 있을 때만 결과와 시계열을 조회한다.
- 결과·시계열 조회는 기존 관측 API를 사용한다. 관측이 종료되면 통합 회고를 `reflectionType: final`로 저장한다. 같은 답변 재시도에는 같은 요청 ID를 쓰고 서버 응답을 확인한 뒤 읽기 전용으로 전환한다. 저장한 회고와 최종 AI 피드백은 다시 열 수 있다.
- 계약은 [BE Replay 연동 명세](https://github.com/HUFS-LikeLion-Team3/BE/blob/develop/docs/p1-replay-reveal-integration.md)를 따른다.

## UI 보완

- P1-03 최종 시안에 맞춰 세 기간의 변화·당시 예측을 비교하는 선택 카드, 기준·관측 수치와 날짜를 나란히 배치했다. 시장 추이는 전체 폭, 당시 판단과 통합 회고는 432:720 비율로 표시한다.
- 선택 대상·기간을 바꿔도 하나의 회고와 질문별 답변이 유지된다. 저장 후에도 선택한 기간의 예측 원문을 함께 확인한다.
- 금리는 변화율 대신 %p, 지수는 변화율과 원시 변화량을 표시한다. 관측 불가·자료 누락·조회 실패·저장 실패 등 기존 상태 경계는 유지한다.
- 차트는 확인된 실제 시계열 값으로 그린다.


## 지난 뉴스 목록·상세 API 연결

- 목록 `/replay`: `GET /api/v1/news?contentType=replay&page&size=6`. 응답은 `content[]`·`id` 형태이고 항목에 `briefing`이 포함된다. `contentType=replay`는 `replayStatus`가 `eligible`·`featured`인 뉴스만 반환한다. URL에는 `category`·`period`·`target`만 남기고 더 보기는 다음 페이지를 이어 붙인다.
- 분야 `category`: 탭 key를 뉴스 category로 바꿔 보낸다(`rate_policy→rate`, `fx_export→exchange_rate`, 나머지는 같은 이름). 뉴스 category는 6개로 고정되지 않으며(`economy` 등) 매핑 밖의 값은 "전체"에서만 보이고 원래 값으로 표시된다. 시장 대상의 `marketCategory`와는 다른 필드다.
- 기간(연도): `from=YYYY-01-01&to=YYYY-12-31`. 형식 `YYYY-MM-DD`, Asia/Seoul 기준, 양 끝 포함. Replay 뉴스는 `referenceAt` 기준으로 걸러진다(Live는 `publishedAt`).
- 시장 대상: 옵션은 `GET /api/v1/market-targets`(`{ targets: [...] }`)의 `id`·`displayName`만 사용하고, 선택한 `id`를 `marketTargetId`로 보낸다. 조회 중·실패·빈 목록이면 시장 대상 필터만 숨기고 목록은 그대로 조회한다. URL의 `target`이 옵션에 없으면 무시하며, `target`이 있을 때는 옵션 조회가 끝난 뒤 목록을 조회한다.
- 카드·상세의 기준 월은 `referenceAt`이다. 목록 응답에 유효한 기준 시점이 없으면 ‘기준 월 정보 없음’을 표시한다.
- 상세 `/replay/:newsId`: `GET /api/v1/news/{newsId}`의 `title`·`category`·`briefing`·`referenceAt`을 표시한다. `contentType=replay`이며 `replayStatus`가 `eligible` 또는 `featured`인 경우에만 상세를 표시한다.
- 결과 공개 전 보호: 스키마에 정의한 필드만 남긴다. `sources`(원문 URL)·`target-candidates`(시장 값)·`facts`·세션 API를 호출하지 않으며 목록·상세 조회만으로 세션을 만들지 않는다. 기존 `/news/:newsId`로 이동하지 않는다(Live 세션이 생기면 Replay를 할 수 없다).
- `VITE_REPLAY_API_ENABLED`(기본 false): 배포는 false면 "준비 중"만, true면 Replay API에 연결한다. 개발은 false면 시안용 자료, true면 실제 API에 연결한다.
- 상태: 로딩 스켈레톤, 빈 목록(필터 유무 구분), 401 로그인 복귀, 400·계약 오류는 "검색이 아직 준비되지 않음", 404는 시장 대상 필터 해제(목록) 또는 목록 이동(상세), 추가 페이지 실패 시 표시된 목록 유지.

## 운영에서 켜기 전 확인

- `briefing`은 DB 값을 그대로 반환하며 발표 이후 정보를 자동으로 제거하지 않는다(BE 확인). FE도 내용을 걸러내지 않는다.
- 운영에서 `VITE_REPLAY_API_ENABLED=true`로 켜기 전에, Replay 뉴스(`eligible`·`featured`)의 브리핑에 발표 이후 수치·결과·사후 보도가 없는지 콘텐츠 검수가 필요하다.

## 지난 뉴스와 연결된 개발 미리보기

- `/replay`: 위 목록 화면에 `news-fixtures.ts`(기존 18건의 가상 학습 자료를 뉴스 응답 모양으로 변환)를 연결한다. 분야·연도(`referenceAt` 기준)·시장 대상 필터와 페이지 처리를 서버와 같은 규칙으로 흉내 낸다. `referenceAt`과 `publishedAt`은 하루 차이로 두었다.
- `/replay/:newsId`: 위 상세 화면. 목 데이터의 id는 기존 시나리오 id와 같아서 대상 선택부터 데모로 이어진다.
- `/replay/:newsId/targets` → `/predict`: 후보 1~3개, 대상별 세 기간 방향 및 전체 이유 1개 이상 검증, 임시 저장·제출 검토·확정·이탈 보호. 확정 후 수정 화면은 피드백으로 돌려보낸다.
- `/replay/:newsId/feedback`: 선택한 대상과 판단 원문, 시안용 해설·근거 펼치기, 대기·오류·결과 공개 재시도. 자동 AI 생성이나 실제 평가 결과가 아니다.
- 실제 결과 보기를 누르면 `/dev/replay/preview/results?from=…&session=…`로 이동한다. 해당 세션의 제출·피드백 확인·결과 공개 상태를 검사하며, URL만으로 공개 전 세션을 열 수 없다. 선택한 대상·기간별 예측과 뉴스 제목을 그대로 전달한다.
- 세션과 회고는 시나리오/세션 ID별 `sessionStorage`에 분리한다. 새로고침에도 유지되며 다른 뉴스의 회고로 덮어쓰지 않는다. 탭을 닫으면 없어지는 개발 목 저장이다.
- 날짜·수치·AI 문구는 가상 예시다. 예시 거래일은 주말을 제외한 가상 달력이며 실제 휴장일이나 시장 데이터 수집을 구현한 것이 아니다.
- 목록·예측·피드백의 개발 상태는 상단 선택기로 확인한다. 저장·제출·결과 공개 실패는 첫 시도만 실패하고 재시도하면 성공한다.
- 배포 빌드에서는 이 개발 흐름·예시 데이터·도구가 제거된다. Replay 경로는 `VITE_REPLAY_API_ENABLED`가 false면 준비 중 안내만, true면 실제 API에 연결한다. 지난 뉴스 진입 링크는 개발 환경과 Replay API가 활성화된 배포에서 제공한다.

## PR 통합

`#26 → #28 → #30` 순서로 dev에 병합한다. #28은 #26의 검증을 보존한 공용 차트를 포함하고, 결과 목은 `results-fixtures.ts`, 목록 목은 `fixtures.ts`로 분리한다. #30은 앞선 두 PR을 포함해 UI 흐름을 검증했으며 dev·main에 직접 반영하지 않았다.
