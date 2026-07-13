# FITGIRLS SEO Audit

## 1. 현재 기술 스택
* **Core Framework**: React 18.2.0 (Single Page Application)
* **Build Tool**: Vite 5.1.4
* **Routing**: React Router Dom 6.22.0 (Client-side routing)
* **Database & Hosting**: Firebase Suite (Hosting, Firestore, Storage)
* **Localization**: `i18next` & `react-i18next` (ko, en, ja, zh 지원)
* **Rendering Model**: **100% Client-Side Rendering (CSR)**

---

## 2. 전체 공개 URL 목록
* **메인 랜딩 원페이지 (Snap Scroll 섹션)**:
  * `/` (Hero 메인)
  * `/hero-intro` (소개)
  * `/artist` (디렉터 아티스트 소개)
  * `/archive` (실시간 갤러리 섹션)
  * `/service` (촬영 서비스 및 요금 섹션)
  * `/zone` (배경 존 정보 섹션)
  * `/hair-makeup` (헤어 & 메이크업 제휴 섹션)
  * `/faq` (자주 묻는 질문 섹션)
  * `/event-board` (공지사항 및 이벤트 섹션)
  * `/location` (스튜디오 위치 및 안내 섹션)
  * `/reservation` (예약 폼 신청 섹션)
  * `/reviews` (리뷰 섹션)
  * `/fitorialist` (앰배서더 리스트 섹션)
* **독립형 서브페이지**:
  * `/studios` / `/studio` (핏걸즈 브랜드 아이덴티티 및 프리미엄 안내 페이지)
  * `/reviews` (전체 리뷰 상세 모아보기 페이지)
  * `/magazine` (패션 매거진 콘텐츠 피드 페이지)
  * `/partners` (제휴사 및 제휴 혜택 안내 페이지)
  * `/challenges` (핏걸즈 바디프로필 챌린지 리스트 페이지)
  * `/challenge/:id` (개별 챌린지 상세 페이지)
  * `/challenge-promo` (챌린지 프로모션 페이지)
  * `/smodel` (소속 모델 모집 신청 페이지)
  * `/global-booking` (외국인 고객 전용 글로벌 예약 신청 안내 페이지)
* **비공개 및 관리용 페이지 (검색엔진 차단 대상)**:
  * `/admin` (스튜디오 전체 관리자 대시보드)
  * `/report` (내부 분석 브랜딩 리포트 페이지)
  * `/retouch` (고객 보정대기 및 보정상태 확인 대시보드)
  * `/retouch/checklist` (고객 상세 보정 체크리스트 작성 양식)
  * `/checklist` (촬영 현장 상담 및 체크리스트 양식)
  * `/checklist/view` (작성 완료된 고객 상담지 뷰어)

---

## 3. 페이지별 Title, Meta Description, H1, Canonical 분석

### A. Title & Meta Description 상태
* **현황**: `src/App.jsx` 내 글로벌 `useEffect`에서 `i18n.language` 감지를 통해 언어별 메타 태그를 동적으로 교체하고 있음.
* **문제점 (중복 콘텐츠)**:
  * 언어 상태에 따라 메타 정보가 교체되지만, **URL 경로(`location.pathname`) 분기 처리가 없음**.
  * 이로 인해 `/`, `/studios`, `/reviews`, `/magazine`, `/partners` 등 **모든 서브페이지가 정확하게 동일한 타이틀과 디스크립션을 공유**하고 있음.
  * *예시 (Korean 접속 시)*:
    * **모든 페이지 Title**: `핏걸즈 | 바디프로필 여자바디프로필 전문 프리미엄 화보 스튜디오`
    * **모든 페이지 Description**: `핏걸즈(FITGIRLS) 2026 프로젝트. 압도적인 무드의 여자 바디프로필, 피토리얼리스트 화보 전문 촬영. 고객별 맞춤 포즈, 무드, 스타일링 무료 기획.`
  * **영향**: 검색엔진(Google, Naver)은 동일 메타데이터를 가진 다수 페이지를 '중복 콘텐츠' 또는 '서브페이지 구분이 불가능한 부실 페이지'로 간주하여 수집 및 노출 순위에서 패널티를 부여함.

### B. H1 태그 계층 구조
* **현황**: 각 컴포넌트별로 `<h1>` 태그가 독립적으로 산재해 있음.
  * `Hero.jsx`: `<h1 className="hero-title">`
  * `Studios.jsx`: `<h1 className="studios-hero-title">`
  * `Partners.jsx`: `<h1>{t('partners.title')}</h1>`
* **문제점**: Single Page App(SPA) 구조상 렌더링 시에는 한 번에 하나의 H1만 노출되는 경우가 많아 표준에 위배되지는 않으나, **초기 HTML 다운로드 시점(자바스크립트 미실행 시)에는 본문 영역에 `<h1>`이 하나도 존재하지 않아** 검색엔진 봇이 페이지의 최상위 주제를 식별하지 못함.

### C. Canonical 설정
* **현황**: `index.html`에 `<link rel="canonical" href="https://fitgirls.me" />`가 고정적으로 하드코딩되어 있음.
* **문제점**: 사용자가 `/studios` 또는 `/magazine` 등 개별 서브페이지로 진입하더라도 canonical 태그는 항상 루트 도메인(`https://fitgirls.me`)을 가리킴. 
* **영향**: 구글은 서브페이지들의 독립성을 무시하고 모든 페이지의 점수와 인덱스를 대표 주소(`https://fitgirls.me`) 하나로 병합하며, 서브페이지들은 검색 결과에 정상적으로 단독 노출되지 않음.

---

## 4. 검색엔진이 읽을 수 있는 실제 HTML 본문 (CSR vs SSR)
* **분석**: 현재 서비스는 완전한 CSR(Client-Side Rendering) 방식임.
* **실제 검색엔진 크롤러가 내려받는 원본 HTML**:
```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <!-- 메타 태그 목록 -->
  <title>핏걸즈 & 이너핏 | FITGIRLS & INAFIT</title>
</head>
<body>
  <nav class="seo-hidden-nav">
    <ul>
      <li><a href="https://fitgirls.me/gallery">GALLERY</a></li>
      <li><a href="https://fitgirls.me/lookbook">LOOKBOOK</a></li>
      ...
    </ul>
  </nav>
  <div id="root"></div>
  <script type="module" src="/src/main.jsx"></script>
</body>
</html>
```
* **사실**: 크롤러가 최초로 수집하는 HTML 바디에는 오직 빈 `<div id="root"></div>`와 숨겨진 내비게이션 메뉴(`seo-hidden-nav`)만 존재함.
* **영향**:
  * **Google**: 자바스크립트 렌더링 엔진(WRS)이 탑재되어 있어 2단계 렌더링을 통해 어느 정도 자바스크립트가 실행된 후의 최종 DOM을 파싱하므로 인덱싱이 부분적으로 가능함.
  * **Naver / Daum / SNS (Kakao, Slack, Facebook 등)**: 자바스크립트 실행 능력이 없거나 매우 제한적이므로 빈 화면만 수집하게 됨. Naver 서치어드바이저는 본문 텍스트 부족 경고를 띄우며 사이트 품질 점수를 낮게 책정함. 카카오톡이나 페이스북에 링크 공유 시 서브페이지별 이미지나 고유 설명이 표시되지 않음.

---

## 5. robots.txt 및 Sitemap 상태

### A. robots.txt 상태
* **현황**:
```
User-agent: *
Allow: /
Sitemap: https://fitgirls.me/sitemap.xml
```
* **문제점**:
  * 관리자 대시보드(`/admin`)나 고객 개인 데이터가 포함된 상담지 뷰어(`/checklist/view`, `/retouch/checklist`) 등 **민감한 비공개 경로에 대한 크롤링 거부(Disallow) 규칙이 전혀 없음**.
  * 이대로 방치할 경우 관리자 페이지나 고객 정보 링크가 포털 검색 결과에 무작위 노출될 위험이 있음.

### B. sitemap.xml 상태
* **현황**: `public/sitemap.xml`에 수동 작성된 하드코딩 형식으로 저장됨.
* **문제점**:
  * `/studios`, `/reviews`, `/magazine`, `/partners` 등 핵심 유입 페이지들이 누락되어 있음.
  * 각 언어 버전별 대체 주소 매핑(`hreflang`) 정보가 sitemap 스키마에 정의되어 있지 않음.

---

## 6. 이미지 용량, 파일명, ALT 속성 상태
* **용량**: 모바일 및 PC 렌더링 시 최적화되지 않은 원본 이미지 파일(수십 MB 수준의 원본 포트폴리오 컷)이 로드되는 구간이 존재하여 페이지 LCP 속도 저하의 주원인이 됨.
* **파일명**: 촬영 시 카메라가 생성한 원본 명칭(예: `0504_MAXQ_8728.jpg`) 또는 난수화된 문자열이 그대로 노출되어 이미지 검색 노출 경쟁력(Image SEO)이 없음.
* **ALT 속성**: 상당수 이미지 요소에 `alt` 태그가 누락되어 있거나, 공통 텍스트(`alt="Review Customer"`, `alt="Gallery Image"`)로 획일화되어 시각장애인 접근성 지침 및 검색 로봇의 이미지 맥락 분석에 도움을 주지 못함.

---

## 7. 다국어 지원 가능 구조의 한계점
* **현황**: 번역 자체는 `i18next`를 사용하여 브라우저 로케일 및 헤더의 국기 아이콘 클릭 시 실시간 텍스트 교체가 원활함.
* **SEO 관점의 치명적 결함**:
  * **다국어별 고유 URL 경로가 존재하지 않음** (예: 영어판 사이트로 들어가도 주소는 `https://fitgirls.me/studios` 그대로 유지됨).
  * 검색엔진 로봇은 자바스크립트로 클릭 이벤트를 발생시키거나 로케일 쿠키를 조작하지 않으므로, **무조건 디폴트인 한국어(ko) 버전의 페이지 하나만 크롤링**해 감.
  * 결과적으로 영어, 일본어, 중국어로 번역된 고품격 텍스트 에셋들이 구글 재팬, 구글 글로벌 등 해외 검색엔진에 아예 수집(Index)되지 않는 현상이 발생함.

---

## 8. 우선순위별 진단 리포트 (Priority Action Items)

### 🚨 [Critical] - 즉시 해결 필요 (검색엔진 차단 및 다국어 유입 방해)
1. **robots.txt 비공개 경로 차단**: `/admin`, `/retouch`, `/checklist` 등의 관리자/고객 보안 경로를 `Disallow` 처리.
2. **다국어 서브디렉토리/파라미터 라우팅 구현**: `/en/`, `/ja/`, `/zh/` 형태의 주소 구분 체계를 도입하여 각 언어 버전이 개별 페이지로 검색봇에 인덱싱될 수 있도록 수정.

### 🔴 [High] - 높은 개선 효과 (중복 패널티 해소 및 크롤링 활성화)
1. **경로별 동적 메타데이터 분기**: `App.jsx` 내부에서 `location.pathname`에 맞춰 고유한 타이틀, 디스크립션, Canonical 주소를 부여하여 중복 콘텐츠 패널티 해소.
2. **정적 빌드 시점의 Prerendering (SSG)**: Vite 환경에 `prerender` 플러그인 또는 빌드용 정적 생성 스크립트를 결합하여, 각 유입 경로별로 핵심 텍스트와 H1이 포함된 완전한 HTML 파일을 생성해 Naver 등 자바스크립트를 해석하지 못하는 검색봇 대응.

### 🟡 [Medium] - 세부 튜닝 (이미지 성능 및 사이트맵 최신화)
1. **sitemap.xml 자동화**: 빌드 타임에 공개 라우팅 주소와 다국어 결합 주소를 수집해 최신 sitemap.xml을 자동으로 생성하는 빌드 스크립트 작성.
2. **이미지 ALT 속성 및 최적화**: 갤러리 및 스튜디오 소개 이미지 로드 시 300~500KB 수준의 압축된 WebP 포맷을 선택 제공하고, `alt` 속성에 동적으로 AI 추출 태그 및 설명 텍스트 결합.

---

## 9. 수정 대상 파일 및 영향도 분석
* **`public/robots.txt`**: 크롤링 제어. 변경 위험 없음.
* **`src/App.jsx`**: 라우팅 구조 변경 및 글로벌 동적 SEO 효과 부여. 언어별/경로별 메타 주입 로직의 핵심이므로 변경 후 빌드 테스트가 완벽히 수행되어야 함.
* **`vite.config.js`**: 빌드 시 정적 Prerender 설정을 추가할 경우 빌드 구성 변경이 필요함.

### 롤백(Rollback) 방법
* Git 기반 협업 및 배포 환경이므로, 작업 도중 오류 발생 시 `git checkout -- <file>` 또는 `git revert`를 통해 배포 전 상태로 즉각 롤백이 가능함.
