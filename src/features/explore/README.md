# 뉴스 탐색 — Desktop P0

`/explore`는 Figma `qnwfwZtYuzz6YwibShM2JE / 197:217` 기준으로 핵심 뉴스, 최근 뉴스, 시장·주제 필터를 표시한다. 이미지 없는 뉴스 행과 기존 Shell·PageTitle·FilterChip·Button·Notice를 재사용한다. 모바일·Replay·검색·URL 등록 기능은 포함하지 않는다.

- 상단 ‘추천 핵심 뉴스’: `GET /api/v1/news?market=all&contentType=live&sort=recommended&page=0&size=3`.
- 최근 뉴스: `sort=latest`, `page=0`부터 10건씩 추가 조회한다.
- 시장: `market=all|korea|us`. 주제: `category=rate|exchange_rate|semiconductor|energy|price|employment`, 전체는 category 생략.
- 필터를 URL에 유지하고 명시적 조건 변경은 첫 페이지부터 조회한다. 상세에서 뒤로 가면 조건을 복원한다. 이전 필터의 늦은 응답은 새 조건에 섞지 않는다.
- 출처는 sources API의 isPrimary 발행처, 시장 표시는 후보 API의 korea_equity/us_equity에서 확인한다. 공통 금리·환율을 임의로 국내/미국으로 분류하지 않는다. 이 두 부가 조회는 제목·브리핑의 렌더링을 막지 않고, 동일 기사 캐시를 재사용한다.
- 초기 스켈레톤, 초기 실패/재시도, 추가 조회 실패 시 기존 기록 유지, 부가 정보 실패/재시도, 조건별 빈 목록과 초기화, 401 로그인 복귀 경로를 처리한다. 잘못된 페이지 응답은 성공으로 처리하지 않는다.

기본값은 실제 HTTP이며 실패한 API를 목 성공으로 바꾸지 않는다. 기존 명시적 DEV 목 모드에서는 개발용 표시와 함께 1건짜리 예시 목록을 제공한다. 시장·주제·요청 페이지 크기를 목 응답에도 적용하며 배포 빌드에는 목 구현을 포함하지 않는다.

현재 목록 API에는 당일 큐레이션을 구분하는 필터·표시가 없어 상단은 홈과 같은 추천순 조회와 ‘추천 핵심 뉴스’ 문구를 사용한다. 당일 큐레이션 3~5건의 별도 선별을 검증한 구현으로 간주하지 않는다. [BE 시장 필터 PR #23](https://github.com/HUFS-LikeLion-Team3/BE/pull/23)은 2026-10-19 병합됐다. FE 파라미터와 일치하며 실행 서버 반영·인증된 실제 필터 조회는 별도 검증이 필요하다. GitHub 병합을 로컬 서버 반영으로 간주하지 않는다.

## 검증

실제 lint·build·diff 검사를 실행한다. 30건 HTTP 응답 대역을 사용해 시장/주제 조합, 페이지 초기화, 추가 조회 실패·동일 페이지 재시도, 응답 경합, 상세 이동/뒤로가기, 500 재시도, 401 returnTo, 출처 조회 실패 시 기사 유지와 재시도를 브라우저로 확인했다. 1440px에서 기본 화면을 Figma와 대조했다. 기존 공통 Shell의 헤더·푸터 여백은 이 작업에서 바꾸지 않았다. 실제 인증된 BE 조회 성공은 미검증이다.
