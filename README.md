# banker-web

학생 은행 데모 — 계좌·카드·이체·거래 내역까지 다루는 작은 풀스택 앱.
원래 학교 과제로 만든 코드를 살려서, TypeScript로 옮기고 보안을 정리하고
Docker로 한 번에 띄울 수 있게 다듬은 버전이다.

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
- 뷰: Pug SSR + Bootstrap (CDN)
- 보안: helmet, csurf, CSRF 토큰을 모든 폼에 자동 주입
- 테스트: Jest + Supertest, GitHub Actions CI
- 배포: docker compose (app + mysql + nginx 리버스 프록시)

## 디렉토리

```
src/
  app.ts                 Express 부트스트랩, 미들웨어, 라우트 마운트
  bin/www.ts             HTTP 서버 시작
  lib/db.ts              mysql2 풀 + withTransaction 헬퍼
  lib/passport.ts        LocalStrategy + bcrypt.compare
  lib/http-error.ts      HttpError + 4xx 헬퍼들
  middlewares/           needAuth, errorHandler, validateForm
  models/                users / accounts / cards / history 저장소
  routes/                index / auth / users / accounts / cards / health
  types/domain.ts        도메인 인터페이스
views/                   Pug 템플릿
public/                  정적 자산
db/init.sql              스키마 + 시드 (compose가 첫 부팅 때 적용)
nginx/default.conf       리버스 프록시 설정
tests/                   jest 스위트
.github/workflows/ci.yml lint + test + docker build
```

## 환경 변수

| 변수 | 기본 | 설명 |
|---|---|---|
| `NODE_ENV` | development | `production`이면 세션 쿠키 secure, 또한 transfer `?fail=1` 센티넬 비활성 |
| `PORT` | 3000 | 앱 리스닝 포트 (컨테이너 내부) |
| `HTTP_PORT` | 8080 | 호스트에서 nginx로 매핑되는 포트 (compose 전용) |
| `SESSION_SECRET` | — | **필수**. 없으면 부팅 거부 |
| `DB_HOST` | localhost | compose에선 `db`로 덮어쓴다 |
| `DB_PORT` | 3306 | |
| `DB_USER` / `DB_PASSWORD` | banker / banker | |
| `DB_NAME` | bank | |
| `DB_CONNECTION_LIMIT` | 10 | |
| `DB_ROOT_PASSWORD` | rootpass | compose 전용. MySQL 컨테이너 root 비밀번호 |

`.env.example` 복사 후 채워 쓰면 된다.

## 개발

### docker compose dev

```bash
docker compose up
```

`docker-compose.override.yml`이 자동 적용돼서 `tsx watch`로 핫리로드 +
`src/`, `views/`, `public/`이 바인드 마운트된다.

### 호스트에서 직접 실행

MySQL을 따로 띄워두고:

```bash
npm install
npm run build       # tsc -> dist
npm start           # dist 실행
# 또는
npm run dev         # tsx watch
```

### 타입 체크 / 테스트

```bash
npm run typecheck
npm test
```

테스트는 단일 worker로 실행되며 같은 DB(`127.0.0.1:3307` 기본)에 대해
`TRUNCATE`-and-reseed 패턴으로 격리한다. 사전에 mysql 컨테이너가 떠
있어야 한다:

```bash
docker run -d --name banker-test-mysql -p 3307:3306 \
  -e MYSQL_ROOT_PASSWORD=rootpass -e MYSQL_DATABASE=bank \
  -v "$(pwd)/db/init.sql:/docker-entrypoint-initdb.d/init.sql:ro" \
  mysql:8.0
```

CI에서는 `services.mysql`이 같은 일을 한다.

## 라우트

전체 라우트 표는 [`docs/API.md`](docs/API.md) 참고.

## 보안 메모

- 비밀번호: bcrypt cost 12 해시. 평문 저장 없음.
- 세션: `httpOnly` + `sameSite=lax` 쿠키. 프로덕션에선 `secure` 자동 켜짐.
- CSRF: csurf, 모든 form에 `+csrf` mixin으로 hidden input 주입. DELETE는
  `+deleteForm` mixin이 method=POST + `_method=DELETE` 폼으로 발급.
- methodOverride는 POST만 처리 — GET 링크로 DELETE/PUT 우회 불가.
- 이체 / 입금 / 출금 / 카드 사용: 단일 DB 트랜잭션 (`SELECT ... FOR UPDATE`)
  으로 잔액 변경 + history 기록을 묶어 부분 실패에서도 일관성 유지.

## 트러블슈팅

**`SESSION_SECRET is required` 에러**
`.env.example`을 `.env`로 복사하고 SESSION_SECRET을 채워라. 길수록 좋다:
`node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`.

**컴포즈에서 mysql healthcheck가 영원히 starting**
`docker compose logs db` 확인. 첫 부팅 시 init.sql이 돌 동안 healthy로
안 가는 경우가 흔하다. 30초 정도면 끝난다. 데이터가 꼬였다면
`docker compose down -v`로 볼륨까지 날리고 재기동.

**호스트에서 `npm start` 시 `ECONNREFUSED 127.0.0.1:3306`**
`.env`의 `DB_HOST=localhost` 그대로인데 mysql이 안 떠 있는 상황. 위
"테스트" 섹션의 docker run으로 띄우거나 docker compose에서 `db`만
띄우고 `DB_HOST=127.0.0.1 DB_PORT=3306`으로 잡으면 된다.

**`?fail=1` 으로 강제 실패가 동작하지 않음**
`NODE_ENV=production`이면 무시된다(의도). 개발/테스트에서만 동작.
