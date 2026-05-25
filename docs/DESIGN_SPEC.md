# banker-web — Design Specification

> Claude Design이 UI 재설계를 진행하기 위한 입력 문서.
> 현재 시스템의 상태, 제약, 개선 목표, 페이지별 요소를 정리한다.

---

## 1. 목적 & 산출물

### 우리가 가진 것
학교 과제로 만든 은행 데모(`banker-web`)를 리팩토링한 결과. 백엔드/보안/배포는 끝난 상태고, **UI만 미완성**이다. Bootstrap 5로 막 옮긴 직후라 페이지 간 톤이 일관되지 않고, 푸터에는 데모 시절의 가짜 회사 정보(이탈리아 주소, Skype id)가 남아있다.

### Claude Design에 기대하는 것
1. **디자인 시스템** — 컬러/타이포/스페이싱/라운드/그림자 토큰을 라이트+다크 한 쌍으로 정의.
2. **모든 페이지(섹션 7 참고)의 새 마크업** — 기존 Pug 파일을 Bootstrap 5 클래스 + 필요 시 추가 CSS로 재작성.
3. **공통 컴포넌트(섹션 8)의 정돈된 버전** — navbar, footer, flash, 폼, 테이블, 빈 상태, 에러 페이지.
4. **반응형 모바일 레이아웃** — 최소 360px까지 깨지지 않게.
5. 산출물은 **Pug + CSS 파일 변경 PR**로 받는다. JS 라이브러리 신규 도입은 지양(아래 §3 제약).

---

## 2. 사용자 & 시나리오

학교 과제 기반이라 **실제 은행이 아니다**. 그러나 디자인은 실제 핀테크처럼 진지하게 가는 게 목표(섹션 4 톤 참고). 주요 사용자:

- **학생 사용자**: 회원가입 → 통장 개설 → 입출금/이체 → 카드 발급 → 카드 결제 → 거래 내역 조회.
- **데모 청중**: 코드 리뷰어/포트폴리오 보는 사람. 첫 인상에서 "잘 정리된 사이드 프로젝트"로 보여야 함.

### 핵심 시나리오 (이 흐름이 매끄러워야 함)
1. **랜딩 → 회원가입 → 로그인**: 새 사용자가 30초 안에 가입할 수 있어야.
2. **계좌 개설 → 입금 → 잔액 확인**: 두 페이지 안에 끝나야.
3. **이체**: 받는 계좌 번호 + 금액 + 메모. 송금 후 잔액과 거래 내역에 즉시 반영.
4. **카드 발급 → 결제**: 한도/연결 계좌 선택 → 결제 시 잔액 즉시 차감.

---

## 3. 기술 스택 & 제약

| 영역 | 현재 | 변경 가능? |
|---|---|---|
| 템플릿 엔진 | Pug 3 (서버사이드 렌더링) | **No** — 유지 |
| CSS 프레임워크 | Bootstrap 5.3 (CDN) | 유지 권장. utility 보조 CSS는 자유 |
| 아이콘 | Bootstrap Icons 1.11 (CDN) | 유지 권장 |
| JS | Bootstrap bundle만 (no jQuery, no popper 별도) | 유지. Alpine.js 등 신규 라이브러리는 사전 협의 |
| 폰트 | Nanum Gothic / Raleway / Roboto (googleapis.com) | 자유롭게 변경 |
| 폼 처리 | 전통적 HTML form POST → `_method=PUT/DELETE` 패턴 | 유지 |
| CSRF | `+csrf` mixin이 hidden `_csrf` 토큰 주입, 모든 form에 필수 | **유지 필수** |
| DELETE 액션 | `+deleteForm(url, label)` mixin (form POST + `_method=DELETE` + csrf) | 유지 필수 |
| 다크모드 | 미구현. 도입 예정 | **도입 — `prefers-color-scheme` 자동 감지** |
| 빌드 | 정적 CSS는 `public/stylesheets/style.css`에서 직접 작성 | preprocess(Sass) 도입 가능 |

### 코드 레이아웃
```
views/
  layout.pug                전 페이지 공통 셸 (head, navbar, flash, footer mount)
  signin.pug                로그인
  index.pug                 홈
  error.pug                 404/5xx
  includes/
    topnav.pug              상단 네비
    _flash.pug              플래시 메시지 partial
    footer.pug              하단 푸터
    _paginate.pug           (현재 비활성. 추후 페이지네이션용)
  users/    new edit show index
  accounts/ new edit show index input output sendmoney
            _account.pug    리스트 카드
            _form.pug       type select fragment
            _history.pug    거래 내역 row
  cards/    new edit show index use
            _card.pug       리스트 카드
            _form.pug       max/type/account fragment
public/
  stylesheets/style.css     커스텀 CSS (현재 일부 레거시 잔재 있음)
  images/                   로고, 히어로, 푸터 아이콘
```

`layout.pug`에 정의된 mixin 두 개는 모든 페이지에서 사용 가능하므로 그대로 활용:

```pug
mixin csrf
  input(type='hidden', name='_csrf', value=csrfToken)

mixin deleteForm(url, label)
  form(action=url, method='POST', style='display:inline-block')
    input(type='hidden', name='_method', value='DELETE')
    +csrf
    button.btn.btn-outline-danger.need-confirm-btn(type='submit')&attributes(attributes)= label || 'Delete'
```

---

## 4. 디자인 방향 (Tone)

**Modern fintech — restrained, trustworthy.**

- 토스, 카카오뱅크, 모던 챌린저 뱅크들의 정돈된 카드 UI. 화려하지 않고 자신감 있는 톤.
- 1색 강조 + 중성 그레이 베이스. 빨강은 위험 액션(삭제/오류)에만.
- 라운드는 미디엄(0.5–0.75rem). 진하지 않은 그림자(soft shadow).
- 폰트는 한글 본문 가독성 우선. 한글: Pretendard / Inter / system-ui 추천. 헤딩은 약간 굵게(600–700).
- 일러스트레이션/이모지 사용은 자제. 아이콘은 Bootstrap Icons의 outline 계열 위주.
- 라이트 + 다크 한 쌍 필수. `prefers-color-scheme: dark` 자동 적용. 사용자 수동 토글은 v2 이후.

### 무드 키워드
- 진지하지만 따뜻함이 있는 → "정돈된 학생 핀테크"
- "신뢰" > "재미"
- 데이터 표시(금액/거래내역)는 **모노스페이스 + tabular-nums**로 자릿수 정렬.

---

## 5. 디자인 토큰 (Claude Design이 정의/제안)

아래는 placeholder. Claude Design이 실제 값을 채워주면 된다. CSS 변수로 정의 권장 (Bootstrap 5의 `--bs-*` 변수 override 또는 별도 `--app-*` 변수).

### 컬러 (라이트/다크 한 쌍)
- `--app-bg`, `--app-bg-elevated` (배경, 카드 배경)
- `--app-text`, `--app-text-muted`
- `--app-border`, `--app-border-strong`
- `--app-primary` (브랜드 강조; CTA, 활성 nav)
- `--app-primary-hover`
- `--app-success` (입금/긍정 금액)
- `--app-danger` (출금/음수/삭제)
- `--app-warning`
- `--app-info`
- 금액 표시 전용: `--app-money-positive`, `--app-money-negative`

### 타이포그래피
- `--font-sans`: 본문
- `--font-mono`: 금액·계좌번호·코드
- 스케일: `display`, `h1` ~ `h6`, `body`, `small`, `caption` 정도 6–7 단계
- 본문 line-height 1.5 권장

### 스페이싱
- Bootstrap 5의 `--bs-spacer` 기반 그대로 쓰거나, 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 단위
- 컨테이너 최대 폭: lg(992px) 또는 xl(1140px) — 현재 CSS의 `min-width: 1170px` 제약은 **제거**해야 함(반응형 깨짐 원인).

### 라운드 / 그림자 / 전환
- `--radius-sm`, `--radius-md`, `--radius-lg`
- `--shadow-sm`, `--shadow-md`
- `--transition-base` (0.15s ease 정도)

---

## 6. 정보 구조 (Sitemap)

```
/                             랜딩 (비로그인 진입점)
├── /signin                   로그인
├── /users/new                회원가입
├── /signout (POST)           로그아웃 액션

(로그인 후)
├── /accounts                 내 계좌 목록 + 총액
│   ├── /accounts/new
│   ├── /accounts/:id         상세 + 거래 내역
│   ├── /accounts/:id/edit
│   ├── /accounts/:id/input   입금
│   ├── /accounts/:id/output  출금
│   └── /accounts/:id/sendmoney 이체
├── /cards                    내 카드 목록
│   ├── /cards/new
│   ├── /cards/:id            상세
│   ├── /cards/:id/edit
│   └── /cards/:id/use        결제
└── /users
    ├── /users/:id
    └── /users/:id/edit       내 프로필 편집

/healthz                      JSON 헬스체크 (UI 없음, 무시)
error.pug                     404 / 5xx 폴백
```

### 네비게이션
- 상단 메인 nav: Card · Account · Users + 우측 (로그인 시) My Profile / Signout, (비로그인 시) Signin / Signup
- 모바일에선 햄버거 → 드로어 또는 collapse
- 푸터는 단순화 — 현재 가짜 회사 정보는 모두 제거(§9 참고)

---

## 7. 페이지별 명세

> 각 페이지마다: **목적 / 표시 데이터 / 액션 / 폼 필드 / 빈 상태·에러 상태**.

### 7.1 `/` 랜딩 (`views/index.pug`)
**목적**: 비로그인 방문자에게 서비스를 짧게 소개하고 회원가입/로그인 CTA. 로그인 사용자가 봤을 땐 `/accounts`로 보낼지 그대로 보여줄지 — **Claude Design 판단**(권장: 로그인 시 자동으로 `/accounts`로 리다이렉트는 백엔드 변경 필요, UI 결정은 헤더 CTA를 "내 계좌로 가기"로 바꾸는 정도).
- 히어로: 큰 헤드라인 + 한 줄 카피 + 1–2개 CTA(Sign up / Sign in)
- 가치 제안 3–4개 (계좌 관리 · 이체 · 카드 결제 · 거래 내역)
- 푸터(공통)

### 7.2 `/signin` 로그인 (`views/signin.pug`)
**목적**: 이메일/비밀번호로 로그인.
- 폼 필드: `email`, `password`
- hidden: `_csrf` (mixin 자동)
- 액션 버튼: Sign in (primary)
- 보조 링크: Sign up, Reset password (`/reset-password`는 백엔드 미구현 — 링크만 두기)
- 에러: `flash.danger`로 "Invalid email or password" 등이 위쪽 alert로 표시됨

### 7.3 `/users/new` 회원가입 (`views/users/new.pug`)
**목적**: 신규 계정 생성.
- 폼 필드(전부 required, 단 `job`은 선택):
  - `email` (email, unique)
  - `name` (text)
  - `address` (text)
  - `birth` (date placeholder — 현재 그냥 text)
  - `phone` (text, 010-XXXX-XXXX)
  - `job` (text, optional)
  - `password` (≥6자)
  - `password_confirmation` (match)
- 보안 메모: 비밀번호는 서버에서 bcrypt(12) 해시.
- 에러는 `flash.danger`로 위쪽 alert.

### 7.4 `/users` 사용자 목록 (`views/users/index.pug`)
**목적**: 다른 사용자 보기 (학생 과제 잔재). 본인은 목록에서 제외됨.
- 표 또는 카드 리스트 — name / email / address / actions
- 행별 액션: Edit (link), Delete (`+deleteForm` mixin)
- 빈 상태: "다른 사용자가 아직 없습니다."

### 7.5 `/users/:id` 사용자 상세 (`views/users/show.pug`)
- 정의 리스트로 사용자 정보 표시 (name, email, id, address, phone, job)
- 액션(본인 외 사용자에 한해): Edit / Delete

### 7.6 `/users/:id/edit` 프로필 수정 (`views/users/edit.pug`)
- 가입 폼과 동일 필드 + `current_password`(현재 비밀번호 확인용)
- 새 비밀번호는 비워두면 변경 없음
- 액션: Update, Back

### 7.7 `/accounts` 계좌 목록 (`views/accounts/index.pug`)
**목적**: 내 계좌 한눈에.
- 헤더: "Bank Account" + 총 계좌 수(`Total N account(s)`)
- 큰 숫자: **총액** (모든 계좌 합. 모노스페이스, tabular-nums, 통화 포맷팅)
- 빈 상태: "No accounts available yet" alert + "Make Bank Account" CTA
- 계좌 카드 리스트(`_account.pug`):
  - 계좌번호(id, 클릭 → 상세)
  - 잔액 (큰 글자, 모노)
  - 계좌 생성일
- 하단 CTA: "Make Bank Account"

### 7.8 `/accounts/new` 계좌 개설 (`views/accounts/new.pug` + `_form.pug`)
- 셀렉트: `type` — "청약 저축 통장 / 일반 통장 / 적금 통장 / 청년 미래 통장"
- 액션: Make new Bank Account

### 7.9 `/accounts/:id` 계좌 상세 (`views/accounts/show.pug`)
**목적**: 계좌 한 개의 모든 것.
- 상단: 계좌번호, 종류, **잔액(크게)**, 카드 신청 여부, 개설일
- 액션 버튼 그룹: 입금 / 출금 / 계좌이체 (확인 모달 권장)
- 보조 액션: Edit / Delete
- 사용자 정보 섹션: 이름, 주민번호(가짜), 전화, 이메일
- 거래 내역 테이블(`_history.pug` row):
  - 컬럼: 입출금날짜 / 거래번호 / 예금구분 / 예금내용 / 거래금액 / 예금잔고
  - 거래금액은 +/- 색상 차이 (`--app-money-positive`/`--app-money-negative`)
  - 빈 상태: "거래 내역이 없습니다."

### 7.10 `/accounts/:id/edit`
- 셀렉트: `type` 변경
- 액션: Update information

### 7.11 `/accounts/:id/input` 입금 (`accounts/input.pug`)
- 폼: `money` (number ≥1), `content` (text, 선택, 기본 "입금")
- 액션: 입금
- 성공: `/accounts`로 redirect + success flash
- 실패(음수/0): danger flash + redirect back

### 7.12 `/accounts/:id/output` 출금
- 폼: `money`, `content` (선택, 기본 "출금")
- 잔액 부족 시 서버가 거부 → danger flash

### 7.13 `/accounts/:id/sendmoney` 이체
- 폼: `to` (받는 계좌 ID, int), `money`, `content` (선택, 기본 "계좌이체")
- 잘못된 받는 계좌 / 잔액 부족 시 거부

### 7.14 `/cards` 카드 목록 (`cards/index.pug`)
- 헤더 + 총 카드 수
- 카드 그리드(`_card.pug`): cardname, id, type, 발급일
- 빈 상태: "No card exist yet" + CTA "Make Card"
- CTA: Make Card

### 7.15 `/cards/new` 카드 발급 (`cards/new.pug` + `_form.pug`)
- 폼:
  - `name` (선택)
  - `max` (한도, 숫자 ≥1)
  - `type` (셀렉트: 명지 사랑 / 브론즈 / 골드 / 블랙 / 프리미엄 cs)
  - `account` (셀렉트: 연결할 내 계좌 id 목록)
- 계좌가 하나도 없으면 가입 흐름 → "Please make an account first" flash 후 back

### 7.16 `/cards/:id` 카드 상세
- 카드 정보: cardname, type, 한도, 마지막 사용일, 발급일, 연결 계좌 id
- 액션: 카드 사용 / Edit / Delete
- 사용자 정보 섹션

### 7.17 `/cards/:id/edit`
- 폼: name, max, type, account(셀렉트)
- 액션: Update information

### 7.18 `/cards/:id/use` 카드 결제 (`cards/use.pug`)
- 폼: `content` (가맹점/내역, required), `money` (≥1, required)
- 액션: 결제
- 잔액 부족 시 danger flash

### 7.19 `error.pug` 404 / 5xx
- 상태 코드 / 메시지 / (개발 모드만) 스택
- "홈으로" 버튼

---

## 8. 공통 컴포넌트

### 8.1 Navbar (`includes/topnav.pug`)
- 좌측: 로고 + 워드마크 "명지은행"
- 우측 메뉴(데스크탑): Card / Account / Users + (signed-in) My Profile · Signout / (signed-out) Signin · Signup
- Signout은 form POST + csrf (현재 mixin 사용 중)
- 모바일: 햄버거 토글 (현재 Bootstrap 5 collapse, `data-bs-toggle="collapse"` 사용 — 유지)
- 활성 메뉴 강조 (현재 라우트 기반)

### 8.2 Footer (`includes/footer.pug`)
- **현재 상태**: 가짜 회사(이탈리아 주소, Skype) + 의미없는 Plans/Affiliates/Terms 링크. **전면 교체 필요**.
- **새 목표**: 미니멀 푸터.
  - 좌측: 로고 + 한 줄 카피 ("학생 핀테크 데모" 같은)
  - 우측 또는 중앙: GitHub 링크 (placeholder), 명세서 링크
  - "Built with TypeScript + Express + Pug + MySQL" 한 줄 텍스트
  - 저작권 한 줄

### 8.3 Flash messages (`includes/_flash.pug`)
- `flashMessages` 객체에서 `success`, `danger`, `info`, `warning` 타입별 dismissible alert
- 페이지 최상단(컨테이너 안)에 표시
- 다크모드에서도 충분한 대비

### 8.4 Form mixin / Field 컴포넌트
- 현재는 raw Bootstrap form-control 패턴. 디자인 시 **`+field(name, label, opts)` 같은 mixin** 도입을 권장. 이렇게 하면 label/helper/error 자리잡기가 일관됨.
- 비밀번호 필드는 `autocomplete="current-password"` / `new-password` 구분.
- 금액 입력: `inputmode="decimal"`, `pattern`, prefix `₩` 또는 suffix `원`.

### 8.5 Button 시스템
- Primary (CTA), Secondary (보조), Outline (이전/취소), Danger (삭제/위험)
- Loading 상태(spinner) — 폼 submit 직후 (선택)
- Icon + label 패턴

### 8.6 Table / List
- 거래 내역, 사용자 목록에 사용
- zebra/hover 가능, 우측 정렬은 금액 컬럼
- 모바일에선 카드 형태로 떨어지는 fallback 권장

### 8.7 Empty state
- 빈 계좌·빈 카드·빈 거래내역에 일관된 시각적 패턴 (작은 아이콘 + 한 줄 카피 + CTA)

### 8.8 Confirm modal (현재 미구현)
- 삭제/이체 같은 위험한 액션에 Bootstrap modal 도입을 권장 (`+deleteForm`은 그대로, 단 클릭 → 모달 → 확인 시 submit).

---

## 9. 현재 디자인 이슈 (구체적)

수정/제거 대상:

1. **`public/stylesheets/style.css`의 `min-width: 1170px`** — `.container`, `.footer .container`에 박혀있어 반응형 완전 깨짐. 제거 필요.
2. **footer.pug**의 가짜 데이터 — 이탈리아 주소, Skype id, "Plans & pricing" 등 placeholder 전부 삭제 후 새 구성.
3. **`body { margin-top: 100px }`** — 고정 navbar 보정용으로 박혀 있는데, Bootstrap의 `navbar-fixed-top` + padding으로 깔끔히 대체 권장.
4. **`form-group` 클래스 잔재** — BS5에선 deprecated. `mb-3` 등 spacing utility로 치환.
5. **레거시 컴포넌트별 임시 스타일** — `.jumbotron`, `.lists .title`, `.show .answer` 같이 옛 과제용으로 추정되는 룰들이 style.css에 살아있음. 새 디자인에서는 페이지 전용 클래스 또는 utility로 교체.
6. **`index.pug` 메인 카피** — "명지 은행의 서비스 목적" 등 과제 보고서 톤. 디자인 톤에 맞춘 카피 다듬기.
7. **로그아웃 버튼이 navbar에서 `button.btn-link`로 form 안에 위치** — 시각적으로 다른 nav-link와 미세하게 어긋남. 통일 필요.
8. **금액 표시 포맷팅 없음** — `5000.00` 그대로. 천 단위 콤마 + 단위(`원` 또는 `₩`) 권장. 서버 데이터는 `DECIMAL(20,2)` 문자열.
9. **거래 내역 컬럼 `예금잔고` 같은 한자식 표현** — 일반 사용자 톤으로 다듬기 (예: "잔액").
10. **다크모드 미지원** — 새 토큰 + `[data-bs-theme="dark"]` 또는 `@media (prefers-color-scheme: dark)` 둘 다 시도해보고 더 깔끔한 쪽으로.

---

## 10. 비기능 요구

### 반응형
- 모바일 first. 360px / 768px / 1024px / 1280px 브레이크포인트에서 깨지지 않아야.
- 데스크탑 컨테이너 최대 폭은 1140px(Bootstrap `container` xl) 권장.

### 접근성
- WCAG AA 대비. 다크모드에서도.
- 모든 form input에 `<label>` 또는 `aria-label`.
- 폼 에러는 `aria-invalid` + 에러 메시지 연결.
- 키보드만으로 모든 액션 도달 가능.
- 포커스 링은 BS5 기본 또는 더 진하게.

### 성능
- CDN 의존이라 first paint 의존성이 있음. critical CSS 인라이닝까진 안 가더라도, 추가 폰트 로드는 `display: swap`.
- Hero 이미지는 lazyload + 적절한 width/height(레이아웃 시프트 방지).

### 다국어
- 현재 한국어 + 영어 메뉴 라벨 혼재. **결정**: 1차 버전은 한국어 UI 중심으로 정리(메뉴 라벨도 한국어로). 영어는 i18n 도입 후 v2.

### 브라우저 지원
- 최신 Chrome/Firefox/Safari/Edge. IE11 무시.

---

## 11. 변경 가능 / 변경 불가

### 변경 가능
- Pug 마크업 구조 (단, 액션 URL과 form field name은 백엔드와 매칭)
- CSS 전부
- 사용 색상 / 폰트
- 페이지 내 컴포넌트 구성 / 레이아웃
- 푸터 내용 (위 §9-2)
- 메인 페이지 카피
- 거래 내역 컬럼명/표기

### 변경 불가
- 라우트 URL (백엔드 라우터와 매칭. 추가 라우트가 필요하면 따로 요청)
- form `action`/`method`/`name` 속성 (백엔드가 읽는 값)
- `_csrf` hidden input 필수 — 모든 변경 메서드 form에 `+csrf` mixin 호출
- DELETE 동작은 `+deleteForm(url, label)` mixin 사용 (`<a href="...?_method=DELETE">` 사용 금지)
- methodOverride는 POST에서만 동작 — `_method=PUT/DELETE`는 form POST 안에서만 가능
- 폼 검증 메시지는 서버 측 `flash`로 들어와 `_flash.pug`가 표시 (클라이언트 검증을 추가하더라도 서버 검증과 일관되어야)

---

## 12. 산출물 기대 (Claude Design에게)

1. **`public/stylesheets/style.css` 재작성** — 디자인 토큰(CSS 변수) + 라이트/다크 + 페이지별 유틸. 또는 새로운 파일로 나눠도 OK.
2. **각 페이지 Pug 마크업 업데이트** — 백엔드가 요구하는 form 구조와 변수 바인딩은 유지하면서.
3. **새 `includes/footer.pug`**.
4. **선택**: 폼 필드 mixin (`+field(...)`)을 `layout.pug` 또는 `includes/_mixins.pug`에 추가.
5. **다크모드 검증** — 모든 핵심 화면(랜딩, 로그인, 회원가입, 계좌 목록, 계좌 상세, 거래 내역, 카드 사용, 에러)을 두 테마에서 캡처해 비교.
6. **변경 PR 본문**에 디자인 결정 근거 한 문단 — 왜 이 색/폰트/구조를 선택했는지.

### 검증 방법
- `docker compose up`으로 풀스택 띄우고 `http://localhost:8080` 접속.
- 시드 사용자 `demo@banker.local / password123`으로 로그인.
- 핵심 시나리오(§2) 전부 끝까지 동작 확인.
- 기존 jest 11/11 그대로 통과 — 디자인 변경이 form name/action을 깨지 않았다는 회귀 가드.

---

## 13. 참고 자료

- 라우트 표: [`docs/API.md`](./API.md)
- 데이터 스키마: [`db/init.sql`](../db/init.sql)
- 현재 뷰: [`views/`](../views/)
- 현재 CSS: [`public/stylesheets/style.css`](../public/stylesheets/style.css)
- 이미지/로고: [`public/images/`](../public/images/)
