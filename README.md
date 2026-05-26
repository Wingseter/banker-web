# banker-web

명지은행 데모 — 계좌·카드·이체·거래 내역까지 다루는 풀스택 웹 애플리케이션.
TypeScript + Express + MySQL 8 + Pug SSR. Docker compose 한 번에 띄운다.

> 마지막 업데이트: 2026-05-25 · 학생 핀테크 데모 · 실제 금융 서비스 아님

## 화면

| | |
|---|---|
| ![landing](docs/screenshots/01-landing.png) | ![signin](docs/screenshots/02-signin.png) |
| 메인 — 명지은행 점보트론 + 마케팅 히어로 | 로그인 |
| ![accounts](docs/screenshots/03-accounts.png) | ![deposit](docs/screenshots/04-deposit.png) |
| 내 계좌 — 총자산 + 계좌 카드 | 입금 폼 — 거대 mono 금액 입력 |
| ![account-show](docs/screenshots/05-account-show.png) | ![cards](docs/screenshots/06-cards.png) |
| 계좌 상세 — 잔액·액션바·거래 내역 | 내 카드 — 플라스틱 카드 그리드 |
| ![card-show](docs/screenshots/07-card-show.png) | |
| 카드 상세 — 큰 플라스틱 카드 + 정보 | |

## 한 줄 실행

```bash
cp .env.example .env
docker compose up
```

`http://localhost:8080` 으로 접속, 시드 유저
`demo@banker.local` / `password123`로 로그인.

## 스택

- 백엔드: Node 20 + Express 4 + TypeScript (strict)
- 인증: Passport LocalStrategy + bcrypt
- 데이터: MySQL 8 (`mysql2/promise` 풀)
- 뷰: Pug SSR + 자체 디자인 시스템 (`.lp-*` 랜딩, `.app-*` 인너 페이지, `.bank-card` 플라스틱 카드)
- 보안: helmet, csurf, CSRF 토큰을 모든 폼에 자동 주입
- 테스트: Jest + Supertest, GitHub Actions CI
- 배포: docker compose (app + mysql + nginx 리버스 프록시)

## npm scripts

```bash
npm run dev         # tsx watch (호스트 실행)
npm run build       # tsc -> dist
npm start           # dist 실행
npm run typecheck   # tsc --noEmit
npm test            # jest + supertest
```

`docker compose up`은 `docker-compose.override.yml`이 자동 적용돼서
`tsx watch` 핫리로드 + `src/`, `views/`, `public/` 바인드 마운트로 돈다.

## 더 보기

- 라우트 표 → [`docs/API.md`](docs/API.md)
- 디자인 시스템 → [`docs/DESIGN_SPEC.md`](docs/DESIGN_SPEC.md)
- 환경 변수 · 보안 · 트러블슈팅 · 호스트 실행 · 테스트 DB → [`docs/OPERATIONS.md`](docs/OPERATIONS.md)

## 업데이트 내역

### 2026-05-25
- 인너 앱 페이지 전면 리디자인. `.app-*` 네임스페이스 디자인 시스템
  추가 (페이지 chrome, 카드 패널, 폼, 버튼, stat list, pill, money
  표시, 테이블, 빈 상태, flash, pagination). 토큰화된 글로벌 topnav
  (한글 라벨, brand-blue hover, dark 모드 로고 invert).
- 플라스틱 카드 비주얼. `.bank-card[data-card-type=love|bronze|gold|
  black|cs]` — 1.586:1 비율, 마스킹 번호, HOLDER/EXP 메타, 타입별
  그라데이션. `/cards` 그리드와 `/cards/:id` 상세에 적용.
- 거래 내역 표시. 입금은 초록 `+`, 출금/카드사용은 빨강 `−` 색 코드
  + 부호 정규화 (DB가 음수 저장하는 케이스에서 이중 부호 안 나오게
  `Math.abs()`).
- 페이지 sweep follow-up 픽스 3종: `db/init.sql` 상단에
  `SET NAMES utf8mb4` 추가해 시드 데이터 mojibake 해결,
  `views/users/edit.pug` birth 인풋을 `type=date` + `YYYY-MM-DD`
  슬라이스, `views/cards/index.pug` "Total N account(s)" → "card(s)"
  카피 오타.
- 명지은행 점보트론 복원. 메인 페이지 최상단 캠퍼스 이미지 +
  반응형 종횡비 (12/5 → 16/9 → 1/1), 우하단 "학생 핀테크 데모 ·
  Demo" 배지.
- Toss-blue 랜딩 리디자인. 브랜드 토큰 (light + dark
  `--app-brand: #0064ff / #4d8eff`), Pretendard Variable + JetBrains
  Mono, 마케팅 풀 섹션 (hero + KPI + sparkline + stats + trust +
  product showcases + 6-card feature grid + FAQ + app banner +
  demo strip), 토큰화된 푸터.

### 그 이전
- Phase-6: README + `docs/API.md` 정리.
- Phase-5: Jest + Supertest 스위트 + GitHub Actions CI.
- Phase-4 이전: Docker 화, TypeScript 마이그레이션, Bootstrap 5
  마이그레이션, flash partial, csurf + helmet + bcrypt 도입.
