# 공용 UI

Figma `02 · Design System / Components`의 Button(159:41), TextField(159:69), Choice(159:101), FilterChip(159:114)를 기준으로 구현한다. 문서: `FinSight_디자인시스템_설계.md`.

- `Button`: `variant="primary|secondary|text"`, `loading`, `loadingLabel`. 기본 type은 button이며 폼 제출은 `type="submit"`을 명시한다. 로딩 중에는 재클릭을 차단한다.
- `TextField` / `TextArea`: 필수 `label`, 선택 `helperText`, `error`. native input/textarea props와 ref를 전달한다. 오류 안내는 aria-invalid/aria-describedby로 연결한다. readOnly는 포커스·복사가 가능하고 disabled는 조작·폼 제출에서 제외된다.
- `Choice`: `type="radio|checkbox"`, `label`과 native input props를 받는다. 단일 선택은 같은 name과 fieldset/legend를 사용한다. 복수 선택은 checkbox를 사용한다.
- `FilterChip`: `selected`와 onClick을 받는 토글 버튼. 선택 상태를 aria-pressed와 체크 표시로 전달한다. 단일/복수 필터 정책은 소비 화면이 관리한다.

컴포넌트는 API·저장·도메인 정책을 포함하지 않는다. 화면이 상태와 이벤트를 전달한다. className으로 폭을 조정하며 입력 그룹은 containerClassName으로 조정한다. hover/focus/pressed는 브라우저 상태를 사용하고 전용 state prop으로 흉내 내지 않는다.

Tailwind v4 토큰은 src/styles/tokens.css, 자체 호스팅 폰트는 src/styles/fonts.css에서 관리한다. 제목은 text-hero/page/section/news-title, 뉴스 본문은 text-news-body, UI는 text-ui/control/meta, 숫자는 text-number를 사용한다. 한글 라벨에는 font-mono를 사용하지 않는다.

`pnpm dev` 후 `/dev/ui`에서 상태·키보드 동작·모바일 배치를 확인한다. 해당 라우트는 개발 환경에만 포함된다. 실제 기능 화면은 아직 scaffold 상태다.

입력 필드 경계에는 border-control(#8A8397)을 사용한다. 흰 입력 배경과 3.64:1, 주변 surface-subtle과 3.37:1 대비를 확보한다. 비활성 입력에는 기존 border-default를 사용한다.
