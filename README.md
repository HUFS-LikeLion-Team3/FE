# FinSight FE

경제 뉴스를 읽고 시장 영향을 직접 예측한 뒤, 실제 시장 결과와 AI 피드백으로 사고 과정을 돌아보는 FinSight의 프론트엔드입니다.

## 기술 스택

| 구분 | 사용 기술 |
| --- | --- |
| 기본 | React 19, TypeScript, Vite |
| 스타일 | Tailwind CSS v4, Lucide React |
| 라우팅 | React Router |
| 서버 상태 | TanStack Query |
| 폼 검증 | React Hook Form, Zod |
| 차트 | Recharts |
| 유틸리티 | clsx, tailwind-merge |
| 코드 품질 | Oxlint |
| 패키지 매니저 | pnpm |

## 시작하기

Node.js 20 이상과 pnpm이 필요합니다.

```bash
pnpm install
cp .env.example .env
pnpm dev
```

개발 서버는 기본적으로 `http://localhost:5173`에서 실행됩니다. 포트가 사용 중이면 Vite 출력의 실제 주소를 확인합니다. 카카오 콜백 등록도 실제 origin에 맞춰야 합니다.

### 환경 변수

| 이름 | 설명 | 예시 |
| --- | --- | --- |
| `VITE_API_BASE_URL` | 브라우저가 호출할 공개 API origin. 개발 시 비우면 Vite 프록시 사용 | 빈 값 |
| `API_PROXY_TARGET` | 개발 서버의 `/api/v1` 프록시 대상. 브라우저에 노출되지 않음 | `http://localhost:8082` |
| `VITE_MOCK_LEARNING_API` | 명시적인 개발용 목 모드. 기본 false, 배포 빌드 제외 | `false` |
| `VITE_KAKAO_CLIENT_ID` | 카카오 로그인에 사용하는 공개 앱 키 | `.env.example` 참고 |

.env.example을 복사해 로컬 `.env`에서 설정합니다. `.env`와 토큰·시크릿은 커밋하지 않습니다. `VITE_*` 값은 브라우저에 노출되므로 비밀값을 넣지 않습니다. 배포 시 `VITE_API_BASE_URL`을 실제 공개 API origin으로 설정합니다.

카카오 인가 redirect URI는 `${window.location.origin}/auth/kakao/callback`입니다. 실제 주소를 Kakao Developers에 등록하고, BE 토큰 교환의 redirect URI도 일치시킵니다.

## 명령어

| 명령어 | 설명 |
| --- | --- |
| `pnpm dev` | 개발 서버 실행 |
| `pnpm build` | 타입 검사 후 프로덕션 빌드 |
| `pnpm lint` | 코드 검사 |
| `pnpm preview` | 빌드 결과 로컬 미리보기 |

## 현재 라우트

데스크톱 P0 라우트입니다. 화면 구현과 실제 인증된 전체 연동 검증 완료는 구분합니다. 모바일 전용 구현은 후속 범위입니다.

| 경로 | 화면 |
| --- | --- |
| `/` | 홈 |
| `/login`, `/auth/kakao/callback` | 로그인·카카오 콜백 |
| `/onboarding`, `/settings/interests` | 최초 관심 설정·설정 변경 |
| `/explore` | 뉴스 탐색 |
| `/news/:newsId` | 뉴스 상세 |
| `/news/:newsId/predict`, `/learning/:sessionId/edit` | 대상 선택·예측 작성 |
| `/learning` | 학습 기록 |
| `/learning/:sessionId/feedback` | 최초 AI 피드백 |
| `/learning/:sessionId/results` | 관측 결과·중간 메모 |
| `/learning/:sessionId/reflection` | 최종 회고 |
| `/learning/:sessionId/final-feedback` | 최종 AI 피드백 |
| `/learning/:sessionId` | 완료 타임라인 |
| `/terms`, `/privacy` | 약관·개인정보 처리방침 |

개발 전용 미리보기는 `/dev/ui`, `/dev/pages`, `/dev/flow`, `/dev/home`, `/dev/learning`, `/dev/onboarding`입니다. `/dev/flow`는 현재 탭에 개발 목 모드를 켜며 화면의 ‘실제 API 모드로 돌아가기’로 종료합니다. 실패한 실제 API를 목 성공으로 바꾸지 않습니다.

## 구현 문서

- [학습 흐름](./src/features/learning/README.md): 저장·상태 전이·캐시·목 경계.
- [뉴스 탐색](./src/features/explore/README.md): 필터·페이지 조회·계약 및 미검증 사항.
- [공용 UI](./src/components/ui/README.md): 컴포넌트 사용·토큰·접근성.
- [폰트](./public/fonts/README.md): 출처·라이선스.

## 협업 규칙

- `main`은 배포 브랜치입니다. 기능 작업을 직접 올리지 않습니다.
- `dev`는 통합 브랜치입니다. 모든 작업 브랜치는 `dev`에서 생성하고 `dev`로 PR을 엽니다.
- 작업 브랜치는 `feat/`, `fix/`, `chore/` 접두사를 사용합니다.
- PR 제목은 `feat: 로그인 화면 구현`처럼 영문 작업 유형 뒤에 한글 설명을 작성합니다.
- PR은 Squash merge로 병합합니다.
- PR 전 `pnpm build`, `pnpm lint`를 확인합니다.

세부 브랜치·이슈·PR 규칙은 [CONTRIBUTING.md](./CONTRIBUTING.md)를 확인하세요.

## 이슈 라벨

작업 성격은 `feat`, `fix`, `refactor`, `test`, `design`, `docs`, `chore`로 표시하고, 우선순위는 `P0`, `P1`을 사용합니다.

## 디렉터리 구성

```text
src/
├── App.tsx       # 라우트 정의
├── main.tsx      # 앱 진입점 및 전역 Provider
├── components/  # 공용 UI
├── features/    # auth, home, interest, explore, history, learning
├── styles/      # 토큰·폰트
└── lib/         # API 클라이언트·유틸리티
```
