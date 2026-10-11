# 담당 화면 UI와 API 연동

범위는 P0-03 뉴스 상세, P0-04 예측 입력·제출/이탈 모달, P0-05 최초 AI 피드백, P0-08-2 최종 AI 피드백이다. 대상 선택·다른 담당 페이지·모바일 전용 UI는 구현하지 않는다. 계약 기준은 `FinSight_API_확정명세서_2026-10-11.md`다.

## API 모드

- `/news/:newsId`, `/news/:newsId/predict`, `/learning/:sessionId/edit`, `/learning/:sessionId/feedback`, `/learning/:sessionId/final-feedback`는 API 어댑터를 사용한다. 실제 뉴스·세션 UUID로 접근한다.
- 개발에서는 `.env`의 `VITE_API_BASE_URL`을 비우고 `API_PROXY_TARGET=http://localhost:8082`로 현재 로컬 BE에 연결한다. Vite가 같은 origin의 `/api/v1` 요청을 BE로 전달하므로 개발 브라우저의 CORS 문제를 피한다. 프록시 대상 미지정 시 8080이다. `API_PROXY_TARGET`은 브라우저에 노출하지 않는다. 운영에서는 `VITE_API_BASE_URL`에 실제 API origin을 지정하고 서버에서 프런트 origin의 CORS를 허용해야 한다. 클라이언트가 `/api/v1`을 붙인다.
- 로그인 담당은 OAuth 성공 후 `src/lib/api-client.ts`의 `setAccessToken(accessToken)`을 호출한다. 토큰은 현재 탭의 `sessionStorage`에만 보관하며 VITE 변수·URL·문서에 넣지 않는다. 인증 사용자 변경·로그아웃 시 QueryClient 캐시를 비우고 `setAccessToken(null)`을 호출해야 한다. 401은 토큰을 지우고 로그인 이동을 안내한다. 로그인 화면 자체는 담당 범위 밖이다.
- 개발 모드의 `VITE_MOCK_LEARNING_API=true`(미지정 시 기본)는 명세상 진행 중인 시장 대상/후보·세션·대상 선택/조회·예측 저장/조회/제출·회고 조회를 `api/unfinished-mock.ts`로 연결한다. 해당 모듈은 확정 DTO를 반환하며 저장은 메모리에만 남는다. 새로고침 시 초기화된다.
- 완료된 뉴스 상세·facts·sources와 실제 세션의 피드백·결과 조회는 실제 HTTP 요청이다. 목 세션은 서버에 존재하지 않으므로 해당 세션의 피드백·결과만 같은 목 어댑터에서 반환한다. 실제 API 오류를 목 성공으로 바꾸지 않는다.
- `VITE_MOCK_LEARNING_API=false`로 서버를 재시작하면 모든 API가 HTTP 어댑터를 사용한다. 제품 빌드에는 목 모듈이 포함되지 않는다.
- `/dev/pages`는 네트워크 없이 UI만 검토하는 기존 미리보기다. 예제 상태·1/3개 대상·환율·저장/제출 실패·모달을 확인할 수 있다. 제품 경로와 분리되어 있다.

## 저장과 제출

- 작성 진입에서는 세션을 만들지 않는다. 기존 세션은 `GET /learning-sessions?newsId=...`로 조회한다. 첫 저장/제출에서 생성하며, 이후 재시도에는 받은 세션 ID를 재사용한다.
- 제출 전 참고 시장값은 시장 대상 상세의 referenceMarket에서 값·단위·기준 시각·직전 종가 대비 변화·출처를 표시한다. 미확정/관측 불가이면 숫자를 추정하지 않으며 제출 후 결과 비교 기준값과 구분한다.
- 기존 선택 대상은 `isSelected`와 `sortOrder`로 복원한다. `marketTargetId`와 `sessionTargetId`를 구분하며 방향 표시에는 서버의 `directionLabels`를 사용한다. null 이유는 입력에서 빈 문자열로 표시한다.
- 실제 대상 선택 담당은 신규 작성 경로에 `?targets=시장대상UUID,...`로 선택을 넘길 수 있다. 자동 대상 선택은 DEV 목 모드에서만 2개를 제공한다. 실제 대상 선택 화면 이동은 담당 라우트 확정 후 연결한다.
- 저장은 세션 생성 → 대상 목록 저장 → 각 대상의 1·5·20 방향/이유 저장 순서다. 미선택 방향·빈 이유는 null로 보내며 유효 이유의 원문을 보존한다.
- 제출 전 모든 현재 입력을 저장한다. 일부 저장 실패 시 제출하지 않고 화면 입력·검토 모달을 유지한다. 모든 방향과 전체 이유 최소 1개를 FE·서버에서 검증한다. 임시 저장은 미완성도 허용한다.
- 제출 응답이 유실되면 세션 상태를 다시 조회한다. 이미 확정되었으면 추가 저장/제출 없이 피드백으로 이동한다.
- 처리 중 입력/중복 액션을 막고, 성공한 전체 저장에만 마지막 저장 상태를 갱신한다. 내부 이동·뒤로가기는 useBlocker, 새로고침·탭 닫기는 브라우저 기본 경고를 사용한다.

## 조회와 피드백

- HTTP 오류·네트워크 실패·15초 타임아웃을 구분하고, 화면 이탈 시 조회를 취소한다. HTTP 성공이어도 확정 DTO 형태가 다르면 오류를 표시한다.
- AI `pending`, `generating`, `ready`, `failed`와 세션 `drafting`, `baseline_pending`, `observing`, `reflection_pending`, `completed`를 분리한다. pending/generating 또는 아직 피드백이 없는 경우 2초마다 조회하며 숨긴 탭에서는 중단한다. 확정 예측과 뉴스는 갱신 중 재사용한다.
- 단계별 `isLatest` 피드백을 읽으며 세션 전체 `flowSummary`·실제 생성 시각·대상별 items와 referenceIds에 연결된 당시 인용을 표시한다. 미확정 인용 ID는 임의 보충하지 않는다.
- 관찰 예정/중은 서버의 세션 상태·baseline/observations 상태로 표시한다. FE는 날짜로 T0·관측 종료를 계산하지 않는다. completed는 AI 실패에도 유지한다.
- 최종 화면은 저장된 질문별 회고·중간 메모·관측값·단위·기준 시각·관측 불가 사유를 표시한다. 미확정/관측 불가 값을 추정하지 않는다.

## 남은 계약과 담당 연결

- 뉴스 API에 없는 배경 맥락·용어 설명은 숨긴다. 뉴스 원문 URL이 별도 제공되지 않으므로 `isPrimary` 자료는 '대표 출처 보기'로 표시한다.
- AI 재생성 요청 API와 failureCode 값 목록은 아직 명세에 없다. 실제 연동 화면은 '상태 다시 확인'으로 조회만 하며 임의 재생성 경로를 만들지 않는다. 기존 UI 미리보기만 재생성을 시뮬레이션한다.
- 결과 시계열/이벤트 경로는 목록·오류 예시가 상충하므로 이번 담당 화면은 경로가 명확한 세션 전체 `/outcomes`만 사용한다.
- 2026-10-11 로컬 BE 8082의 뉴스 GET이 토큰 없이 401을 반환하며, FE 5173 프록시도 같은 인증 응답을 전달하는 것을 확인했다. BE의 직접 브라우저 접근용 preflight는 CORS 허용 헤더 없이 401을 반환한다. FE에는 아직 로그인·콜백 구현이 없으므로 인증된 실제 뉴스·DB 조회는 미검증이다. 명세 응답을 브라우저에서 제공한 이전 검증은 실제 BE 데이터 조회 성공을 의미하지 않는다.

검증 명령은 `pnpm lint`, `pnpm build`, `git diff --check`다. 테스트 실행기는 추가하지 않는다.
