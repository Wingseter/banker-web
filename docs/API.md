# API

전부 SSR Pug 라우트 + 폼 POST. JSON API 아님.
모든 변경 메서드(POST/PUT/DELETE)는 **CSRF 토큰 필수** (`_csrf` form
field). 비인증 요청은 `Please signin first.` 플래시와 함께 `/signin`으로
302.

표기:
- ✓ Auth = `needAuth` 미들웨어로 보호됨
- CSRF는 변경 메서드 전부 적용 — 따로 표시하지 않음

## 인증

| Method | Path     | Auth | 요청 본문 | 응답 |
|--------|----------|------|-----------|------|
| GET    | /signin  |  —   | —         | 200 signin.pug |
| POST   | /signin  |  —   | email, password | 302 → `/` (성공) / `/signin` (실패) |
| POST   | /signout |  ✓   | —         | 302 → `/` |

## 사용자

| Method | Path | Auth | 본문 | 응답 |
|---|---|---|---|---|
| GET    | /users | ✓ | — | users/index.pug |
| GET    | /users/new | — | — | users/new.pug |
| POST   | /users | — | email, name, address, birth, phone, password, password_confirmation, job? | 302 → `/` |
| GET    | /users/:id | ✓ | — | users/show.pug |
| GET    | /users/:id/edit | ✓ | — | users/edit.pug |
| PUT    | /users/:id | ✓ | name, address, birth, phone, job, current_password, password?, password_confirmation? | 302 → `/users` |
| DELETE | /users/:id | ✓ | — | 302 → `/users` |

비밀번호 변경 시 `current_password`는 bcrypt 비교, 새 비밀번호도 bcrypt(12)로 해싱.

## 계좌 (accounts)

| Method | Path | Auth | 본문 | 응답 |
|---|---|---|---|---|
| GET    | /accounts | ✓ | — | accounts/index.pug (전체 + 합계) |
| GET    | /accounts/new | ✓ | — | accounts/new.pug |
| POST   | /accounts | ✓ | type | 302 → `/accounts` |
| GET    | /accounts/:id | ✓ | — | accounts/show.pug (계좌 + 거래내역) |
| GET    | /accounts/:id/edit | ✓ | — | accounts/edit.pug |
| PUT    | /accounts/:id | ✓ | type | 302 → `/accounts` |
| DELETE | /accounts/:id | ✓ | — | 302 → `/accounts` |
| GET    | /accounts/:id/input | ✓ | — | accounts/input.pug |
| POST   | /accounts/:id/input | ✓ | money, content? | 302 (잔액 + history 기록을 단일 트랜잭션) |
| GET    | /accounts/:id/output | ✓ | — | accounts/output.pug |
| POST   | /accounts/:id/output | ✓ | money, content? | 302 (잔액 부족 시 플래시 + redirect back) |
| GET    | /accounts/:id/sendmoney | ✓ | — | accounts/sendmoney.pug |
| POST   | /accounts/:id/sendmoney | ✓ | to, money, content? | 302 (양쪽 계좌 잠금 후 출금+입금+양쪽 history를 단일 트랜잭션) |

### 머니 무브 라우트의 검증 규칙

- `money`: 존재 + `>0`. 0이거나 음수면 flash + 302 redirect back.
- `to` (이체): 정수 ≥1. 받는 계좌가 없으면 flash + 302.
- 출금 / 이체: `SELECT money ... FOR UPDATE`로 잔액을 트랜잭션 내에서
  다시 확인 → 동시 출금에 대한 더블 스펜드 방지.
- 이체: from / to를 id 오름차순으로 잠가 데드락 방지.

### 롤백 테스트용 센티넬 (dev only)

`POST /accounts/:id/sendmoney?fail=1` — `NODE_ENV !== 'production'`일 때만
첫 UPDATE 후 의도적으로 throw해 트랜잭션 롤백을 검증할 수 있다.
프로덕션에선 무시된다 (`src/routes/accounts.ts`).

## 카드 (cards)

| Method | Path | Auth | 본문 | 응답 |
|---|---|---|---|---|
| GET    | /cards | ✓ | — | cards/index.pug |
| GET    | /cards/new | ✓ | — | cards/new.pug (계좌 없으면 flash + redirect) |
| POST   | /cards | ✓ | max, type, account, name? | 302 → `/cards` |
| GET    | /cards/:id | ✓ | — | cards/show.pug |
| GET    | /cards/:id/edit | ✓ | — | cards/edit.pug |
| PUT    | /cards/:id | ✓ | name, max, type, account | 302 → `/cards` |
| DELETE | /cards/:id | ✓ | — | 302 → `/cards` (연결 계좌의 카드 수가 0이 되면 card 플래그 토글) |
| GET    | /cards/:id/use | ✓ | — | cards/use.pug |
| POST   | /cards/:id/use | ✓ | money, content | 302 (연결 계좌 잠금 → 출금 + history + `lastuse` 갱신을 단일 트랜잭션) |

## 운영

| Method | Path | Auth | 본문 | 응답 |
|---|---|---|---|---|
| GET    | /healthz | — | — | 200 `{"status":"ok"}` / 503 `{"status":"degraded",...}` |

`/healthz`는 세션/CSRF 미들웨어 **앞쪽**에 마운트된다. Docker
HEALTHCHECK가 쿠키 없이 호출하기 때문. 응답은 `SELECT 1`로 DB까지
한 번 찍어본 결과.

## 에러 응답

- 인증 필요한데 미인증: 302 → `/signin` + danger flash
- CSRF 토큰 누락/불일치: **403** + error.pug (`'Invalid or missing CSRF token.'`)
- 404: error.pug, status 404
- 5xx: error.pug. `NODE_ENV=development`일 때만 스택 노출
