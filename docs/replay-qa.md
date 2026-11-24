# Replay QA

## 미리보기 설정

Vercel이 시스템 환경 변수를 빌드에 제공하면 Git 브랜치 `dev`의 Preview에서 Replay API를 기본으로 활성화합니다. 프로젝트에 `VITE_REPLAY_API_ENABLED` 값이 이미 지정되어 있으면 지정값을 사용합니다. 운영 및 다른 브랜치의 기존 기본값은 그대로 사용합니다. 로컬에서는 `VITE_REPLAY_API_ENABLED=true pnpm dev`로 실제 API 모드를 확인할 수 있습니다.

QA 화면에서 로그인하려면 Preview origin이 카카오 콜백 등록 및 BE CORS 허용 목록과 일치해야 합니다. Preview의 `VITE_API_BASE_URL`에는 QA API 주소를 설정합니다.

## CPI 발표 사례

2026년 6월 10일 08:30(미국 동부시간)에 발표된 5월 미국 소비자물가와 NASDAQ 100을 사용합니다. 브리핑에는 발표 시점에 공개된 [BLS 발표](https://www.bls.gov/news.release/archives/cpi_06102026.htm) 내용만 넣습니다.

아래 SQL은 Replay 정책 마이그레이션이 적용되고 `NASDAQ100` 대상이 활성화된 별도 QA MySQL DB에서 실행합니다. 대상이 없으면 뉴스와 대상 연결 모두 삽입하지 않습니다. 같은 DB에서 다시 실행해도 기존 행을 갱신하지 않습니다. 앱 기동 시 자동 실행되는 시드가 아닙니다.

```sql
SET time_zone = '+00:00';
START TRANSACTION;

SET @replay_news_id = X'3ef63384aa1d495f98c765aa94a01914';
SET @release_at = '2026-06-10 12:30:00';
SET @target_id = (
    SELECT id
    FROM market_targets
    WHERE code = 'NASDAQ100' AND is_active = TRUE
);

INSERT INTO news (
    id, title, category, briefing, content_type, replay_status, status,
    published_at, reference_at, curated_at, created_at, updated_at
)
SELECT @replay_news_id, '[QA] 2026년 5월 미국 소비자물가 발표', 'price',
       '미국 노동통계국은 5월 소비자물가지수가 계절조정 기준 전월 대비 0.5% 상승했다고 발표했다. 4월 상승률은 0.6%였다. 식품과 에너지를 제외한 5월 지수는 전월 대비 0.2% 상승했다.',
       'replay', 'eligible', 'published',
       @release_at, @release_at, UTC_TIMESTAMP(6), UTC_TIMESTAMP(6), UTC_TIMESTAMP(6)
WHERE @target_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM news WHERE id = @replay_news_id);

INSERT INTO news_target_candidates (news_id, market_target_id, rationale, sort_order)
SELECT @replay_news_id, @target_id,
       '물가 발표가 금리 기대와 성장주 가치 평가에 어떻게 연결될지 검토한다.', 1
WHERE @target_id IS NOT NULL
  AND EXISTS (SELECT 1 FROM news WHERE id = @replay_news_id AND content_type = 'replay')
  AND NOT EXISTS (
      SELECT 1 FROM news_target_candidates
      WHERE news_id = @replay_news_id AND (market_target_id = @target_id OR sort_order = 1)
  );

COMMIT;

SELECT n.title, n.content_type, n.replay_status, n.reference_at, mt.code
FROM news n
JOIN news_target_candidates ntc ON ntc.news_id = n.id
JOIN market_targets mt ON mt.id = ntc.market_target_id
WHERE n.id = @replay_news_id AND mt.id = @target_id;
```

마지막 조회 결과가 한 행이면 `/replay`에서 물가 탭과 전체 기간으로 사례를 찾거나 `/replay/3ef63384-aa1d-495f-98c7-65aa94a01914`로 들어갑니다.

1. NASDAQ 100을 선택해 세 기간의 예측과 이유를 제출합니다. 실제 제출 시각과 과거 기준시각(2026-06-10 12:30 UTC)이 분리되고 INITIAL 입력 cutoff가 과거 기준시각과 일치하는지 확인합니다.
2. INITIAL 피드백 준비 전과 결과 공개 전에는 종가·차트가 가려져 있어야 합니다. 준비 완료 후 결과 공개를 눌러 과거 관측값을 확인합니다.
3. 회고를 저장하고 최종 피드백 단계로 이동하는지 확인합니다.

NASDAQ 100 종가의 대조 기준은 [FRED NASDAQ100](https://fred.stlouisfed.org/data/NASDAQ100)입니다. 날짜는 거래소 현지 기준입니다. SQL은 시세나 AI 피드백을 삽입하지 않습니다. 실제 QA API의 시세 공급원과 피드백 승인 흐름을 사용합니다.

| 관측 | 거래일 | 종가 (pt) |
| --- | --- | ---: |
| T0 | 2026-06-10 | 28,508.03 |
| T1 | 2026-06-11 | 29,446.18 |
| T5 | 2026-06-17 | 29,670.95 |
| T20 | 2026-07-10 | 29,825.11 |
