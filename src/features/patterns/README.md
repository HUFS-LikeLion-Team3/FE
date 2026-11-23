# 학습 패턴 · P1-02 데스크톱

`/learning?tab=patterns`에서 판단 이유·놓친 변수·학습 제안과 분야·기간별 예측 집계를 조회한다. 계약은 [BE 개인 패턴 API](https://github.com/HUFS-LikeLion-Team3/BE/blob/develop/docs/p1-personal-patterns-api.md)를 따른다. `category`는 뉴스 분야다.

API에서 돌려주는 예측·회고 건수와 뉴스별 변수 언급 수를 구분한다. 분석에 필요한 뉴스 수 충족 여부는 `suggestions.insufficientData`로 판단한다. 전체 연결 뉴스 ID와 시장 범주×기간의 관측 사례를 제공하는 API는 현재 없어서 실제 화면은 받은 원문 예시와 예측 집계만 표시한다.

`/learning?tab=patterns&preview=1`은 개발 환경 전용이다. 가상 기록으로 피그마의 관측 사례와 상태별 화면을 확인할 수 있다.
