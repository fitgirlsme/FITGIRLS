# FITGIRLS & INAFIT 웹사이트 복구 및 동기화 PRD

> **프로젝트:** fitgirls.me 웹사이트 소스코드 → 배포 버전 동기화
> **기간:** 2026년 3월
> **배포 URL:** https://fitgirls.me
> **스택:** React 18 + Vite + Firebase (Firestore/Storage/Hosting) + i18next
> **호스팅:** Firebase Hosting (`fitgirls-me-web`)
> **저장소:** https://github.com/fitgirlsme/FITGIRLS.git

---

## 1. 프로젝트 개요

로컬 소스코드(`src/`)가 배포 버전과 크게 불일치하는 상태에서, 배포 사이트(fitgirls.me)를 기준으로 모든 컴포넌트·라우트·스타일·다국어를 동기화하여, 빌드 시 배포 버전과 동일한 사이트가 생성되도록 복구하는 작업.

---

## 2. 완료된 작업 목록

### 2.1 App.jsx 라우트 재구성

| 항목 | 변경 전 | 변경 후 |
|------|--------|--------|
| 라우트 수 | 2개 (`/`, `/reviews`) | 13개+ |
| Home 섹션 수 | 2~3개 | 12개 (Hero → Intro → Gallery → Service → Zone → Partner → FAQ → Notice → Location → Reservation → Reviews → Social → ModelRecruit) |
| `/mgmt` 라우트 | 존재 | **삭제** |

### 2.2 컴포넌트 복구 및 재작성

#### Hero (`src/components/Hero.jsx`)
- DB 기반 슬라이드 로드 방식 (배포 버전과 동일)
- YouTube 영상 슬라이드 지원

#### Intro (`src/components/sections/Intro.jsx`)
- 스튜디오 소개 영상/이미지 섹션

#### Gallery (`src/components/sections/Gallery.jsx`)
- Firebase Storage 연동 이미지 갤러리
- 카테고리 필터 (FITORIALIST, ARTIST, FASHION, PORTRAIT)
- 서브 카테고리 (Women, Men, Couple, Outdoor)
- 해시태그 검색

#### Service (`src/components/sections/Service.jsx`)
- 서비스 가격표 및 패키지 정보
- 다국어 지원

#### Zone (`src/components/sections/Zone.jsx`)
- 스튜디오 존 소개 (촬영 공간 안내)

#### Partner (Hair & Makeup) (`src/components/sections/Partner.jsx`)
- 헤어/메이크업 파트너 정보
- 가격 텍스트 중복 제거 (Women/Men/VAT 문구 정리)

#### FAQ (`src/components/sections/FAQ.jsx`) ✅ 전면 재작성
- 배포 사이트와 동일한 16개 FAQ (6+5+5)
- 3개 탭: 예약 전 / 촬영 전 / 촬영 후
- 카테고리 키 변경: `before_reservation` → `before_booking` 등
- 링크 버튼 지원 (네이버, 드롭박스, 이메일, 지도, 일반 링크)
- Q 마크 스타일: 빨간 원형 배지
- 답변 개행 처리 (`\n\n` 파싱)
- 스마트스토어 URL 수정: `smartstore.naver.com/imfitgirl`

#### Notice / EventBoard (`src/components/sections/Notice.jsx`)
- Firebase 연동 이벤트/공지사항
- 다국어 제목/내용 지원

#### Location (`src/components/sections/Location.jsx`) ✅ 전면 재작성
- 기존: Google Maps iframe 포함
- 변경: 지도 제거, 2카드 레이아웃
  - **카드 1:** 스튜디오 주소 + 복사 버튼 + 네이버 길찾기 버튼
  - **카드 2:** 주차 안내 (주차장명, 주소, 거리, 요금, 운영시간 경고)

#### ReservationForm (`src/components/sections/ReservationForm.jsx`)
- 예약 폼

#### Reviews (`src/pages/Reviews.jsx`) ✅ 수정
- 리뷰 슬라이더 + AI Summary 카드
- **네이버 리뷰 작성** 버튼: 네이버 지도 리뷰 페이지 링크
- **구글 리뷰 작성** 버튼: 구글 검색 리뷰 페이지 링크
- 버튼 문구 다국어 적용 (ko/en/ja/zh)

#### SocialWall (`src/components/sections/SocialWall.jsx`) ✅ 수정
- Instagram: Elfsight 위젯
- Pinterest: `embedUser` 방식으로 변경
  - Pinterest 계정: `fitgirlsme` (언더스코어 없음)
  - URL: `kr.pinterest.com/fitgirlsme/`
  - SDK 자동 파싱 + `PinUtils.build()` 재초기화

#### ModelRecruit (`src/components/sections/ModelRecruit.jsx`) ✅ 전면 재작성
- 기존: 정적 카드 + linktr.ee 외부 링크
- 변경: 실제 지원 폼 (이름, 인스타 ID, 지역, 연락처)
  - **Firebase Firestore**에 저장 (Admin 패널 연동)
  - **IndexedDB**에도 로컬 캐시 저장
  - 인스타 ID 클릭 시 Instagram 프로필 새 창 열림
  - Admin 로그인 시 지원 목록 표시 + 삭제 기능
- i18n 키: `model_recruit` → `modelApply`

#### Header (`src/components/Header.jsx`) ✅ 수정
- `Fitorialist.MgMt` 메뉴 항목 제거

#### SupportCS (`src/components/SupportCS.jsx`)
- 카카오톡 상담 플로팅 버튼

### 2.3 삭제된 항목

| 항목 | 사유 |
|------|------|
| `/mgmt` 라우트 | 불필요 페이지 제거 |
| `ModelMgmt` 컴포넌트 import | `/mgmt` 제거에 따른 정리 |
| Header `Fitorialist.MgMt` 메뉴 | 라우트 삭제에 따른 정리 |
| 다크모드 CSS | 배경색 불일치 문제 해결 |

### 2.4 스타일 변경

#### theme.css
- `@media (prefers-color-scheme: dark)` 블록 **완전 제거**
- 항상 라이트 테마 유지 (흰색 배경 일관성)

#### FAQ.css
- Q 마크: 빨간 원형 배지 (`.faq-q-mark`)
- 링크 버튼 타입별 스타일 (`.naver`, `.dropbox`, `.email`, `.map`, `.link`)
- 답변 단락 간격 (`margin-bottom: 6px`)

#### Location.css ✅ 전면 재작성
- 2카드 레이아웃
- 네이버 길찾기 버튼 (초록 아웃라인)
- 주차 경고 박스 (빨간 좌측 테두리)
- 주소 복사 버튼

#### ModelRecruit.css ✅ 전면 재작성
- `model-apply-*` 클래스 체계
- 2열 그리드 폼
- pill 형태 제출 버튼
- 성공/에러 상태 메시지 스타일
- 인스타 링크 스타일 (핑크 `#E1306C`)

### 2.5 다국어 (i18n) 동기화

**대상 파일:** `ko.json`, `en.json`, `ja.json`, `zh.json`

| 섹션 | 변경 내용 |
|------|----------|
| FAQ | 16개 Q&A 전체 교체, `tabs` 배열 추가, `links` 배열 추가, 답변 개행(`\n\n`) |
| Location | 전체 키 재구성 (studio_name, address, parking 정보 등) |
| Partner | 가격 값에서 중복 텍스트 제거 |
| ModelApply | `model_recruit` → `modelApply`로 키 변경, 폼 라벨/플레이스홀더 추가 |
| Reviews | `writeNaver`, `writeGoogle` 키 추가 |
| Social | subtitle 키 유지 |

### 2.6 배포 인프라

| 항목 | 변경 전 | 변경 후 |
|------|--------|--------|
| 배포 대상 | GitHub Pages (`gh-pages` 브랜치) | **Firebase Hosting** (`fitgirls-me-web`) |
| 배포 명령어 | `npm run deploy` (gh-pages) | `npm run build && firebase deploy --only hosting` |
| 설정 파일 | 없음 | `firebase.json`, `.firebaserc` 추가 |
| CNAME | 없었음 | `public/CNAME` 추가 (GitHub Pages 백업용) |
| 커스텀 도메인 | GitHub Pages에 미연결 | Firebase Hosting에 `fitgirls.me` + `www.fitgirls.me` 연결됨 |

---

## 3. 기술 스택 요약

| 구분 | 기술 |
|------|------|
| Frontend | React 18, Vite 5 |
| 라우팅 | react-router-dom v6 (HashRouter) |
| 다국어 | i18next, react-i18next (ko, en, ja, zh) |
| DB | Firebase Firestore |
| Storage | Firebase Storage |
| Hosting | Firebase Hosting |
| 로컬 캐시 | IndexedDB (FitgirlsLiveDB) |
| 이미지 압축 | browser-image-compression |
| Instagram | Elfsight 위젯 |
| Pinterest | Pinterest SDK (`pinit.js`) |

---

## 4. 주요 파일 구조

```
src/
├── App.jsx                          # 메인 라우터 + Home 레이아웃
├── main.jsx                         # 엔트리포인트
├── index.css                        # 전역 스타일
├── styles/
│   └── theme.css                    # CSS 변수 (라이트 테마 only)
├── components/
│   ├── Header.jsx / Header.css      # 네비게이션
│   ├── Hero.jsx / Hero.css          # 히어로 슬라이더
│   ├── FadeInSection.jsx            # 스크롤 애니메이션
│   ├── SupportCS.jsx / SupportCS.css # 카카오톡 상담 버튼
│   └── sections/
│       ├── Intro.jsx / Intro.css
│       ├── Gallery.jsx / Gallery.css
│       ├── Service.jsx / Service.css
│       ├── Zone.jsx / Zone.css
│       ├── Partner.jsx / Partner.css
│       ├── FAQ.jsx / FAQ.css
│       ├── Notice.jsx / Notice.css
│       ├── Location.jsx / Location.css
│       ├── ReservationForm.jsx / Reservation.css
│       ├── SocialWall.jsx / SocialWall.css
│       └── ModelRecruit.jsx / ModelRecruit.css
├── pages/
│   ├── Admin.jsx / Admin.css        # 관리자 대시보드
│   ├── Reviews.jsx / Reviews.css    # 리뷰 페이지
│   └── BrandReport.jsx              # 브랜드 리포트
├── i18n/
│   └── locales/
│       ├── ko.json                  # 한국어
│       ├── en.json                  # 영어
│       ├── ja.json                  # 일본어
│       └── zh.json                  # 중국어
├── utils/
│   ├── db.js                        # IndexedDB CRUD
│   ├── firebase.js                  # Firebase 초기화
│   ├── syncService.js               # Firestore ↔ IndexedDB 동기화
│   ├── dataService.js               # 데이터 서비스
│   ├── galleryService.js            # 갤러리 서비스
│   └── reviewService.js             # 리뷰 서비스
└── data/
    └── reviews_backup.json          # 리뷰 백업 데이터

public/
├── CNAME                            # 커스텀 도메인
├── favicon.jpg
├── images/                          # 히어로 배경 이미지 등
└── naver738df04f6abc0ec13822f7555d8ea6f9.html  # 네이버 사이트 인증

firebase.json                        # Firebase Hosting 설정
.firebaserc                          # Firebase 프로젝트 연결
```

---

## 5. 배포 절차

```bash
# 1. 빌드
npm run build

# 2. Firebase 배포
firebase deploy --only hosting

# 결과 확인
# https://fitgirls.me
# https://fitgirls-me-web.web.app
```

---

## 6. 관리자 기능

**접속:** `https://fitgirls.me/#/admin`

| 탭 | 기능 |
|----|------|
| Gallery | 갤러리 이미지 업로드 (카테고리/해시태그/SEO 자동 생성) |
| Models | 모델 등록/수정/삭제 (프로필, 포트폴리오, 측정치) |
| Concepts | 컨셉(룩북) 의상 등록/수정/삭제 |
| Events | 이벤트/공지사항 등록 (다국어 자동 번역) |
| Hero | 히어로 슬라이드 관리 (이미지/유튜브, 드래그 순서 변경) |
| Applications | 모델 지원자 목록 조회/삭제 (인스타 링크 포함) |

---

## 7. 알려진 이슈

| 이슈 | 상태 | 비고 |
|------|------|------|
| Pinterest 임베드 로컬 렌더링 불안정 | 부분 해결 | SDK 방식 특성상 SPA 환경에서 간헐적 미표시, 배포 환경에서는 정상 |
| Vite 빌드 chunk 크기 경고 | 인지됨 | `index.js` ~806KB, code-split 최적화 미적용 |
| Chrome 캐시로 인한 스타일 미반영 | 해결 | 하드 리프레시 또는 시크릿 모드로 확인 |
| `package.json` deploy 스크립트 | 참고 | `gh-pages` 명령이 남아 있으나, 실제 배포는 Firebase 사용 |
