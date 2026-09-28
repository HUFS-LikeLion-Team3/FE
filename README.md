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

개발 서버는 기본적으로 `http://localhost:5173`에서 실행됩니다.

### 환경 변수

| 이름 | 설명 | 예시 |
| --- | --- | --- |
| `VITE_API_BASE_URL` | 백엔드 API 기본 주소 | `http://localhost:8080` |

`.env.example`을 복사해 로컬 `.env` 파일에서 값을 설정합니다. `.env` 파일은 커밋하지 않습니다.

## 명령어

| 명령어 | 설명 |
| --- | --- |
| `pnpm dev` | 개발 서버 실행 |
| `pnpm build` | 타입 검사 후 프로덕션 빌드 |
| `pnpm lint` | 코드 검사 |
| `pnpm preview` | 빌드 결과 로컬 미리보기 |

## 현재 라우트

초기 화면 뼈대가 아래 경로에 준비되어 있습니다.

| 경로 | 화면 |
| --- | --- |
| `/` | 홈 |
| `/login` | 로그인 |
| `/explore` | 뉴스 탐색 |
| `/news/:newsId` | 뉴스 상세 |

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
├── index.css     # 전역 스타일
└── lib/
    └── cn.ts     # className 병합 유틸리티
```
