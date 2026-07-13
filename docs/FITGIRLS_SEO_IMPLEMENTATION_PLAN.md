# FITGIRLS SEO Implementation Plan

본 계획서는 핏걸즈 공식 홈페이지의 다국어 검색 노출 경쟁력 확보, 중복 메타데이터 방지, 그리고 비공개 관리 경로 보호를 위한 구체적인 기술 구현 방안입니다.

---

## 1. 추천 URL 및 다국어 라우팅 구조

### A. 다국어 별 독립 URL 구조 설계
브라우저 로케일에 의존하던 기존 언어 변경 방식을 검색엔진이 독립적으로 수집할 수 있도록 **서브디렉토리 라우팅 구조**로 전환합니다.
* **한국어 (기본)**: `https://fitgirls.me/` (or `/ko/`)
* **영어**: `https://fitgirls.me/en/`
* **일본어**: `https://fitgirls.me/ja/`
* **중국어**: `https://fitgirls.me/zh/`

### B. React Router Dom (v6)을 이용한 라우팅 매핑
`App.jsx`에서 `:lang` 파라미터가 포함될 수 있는 유연한 중첩 라우트를 설정합니다.
```javascript
// App.jsx 라우트 정의 예시
<Routes>
  {/* 기본 한국어 라우트 */}
  <Route path="/" element={<Home />} />
  <Route path="/studios" element={<Studios />} />
  <Route path="/:section" element={<Home />} />
  
  {/* 다국어 전용 라우트 접두사 지원 */}
  <Route path="/:lang" element={<LanguageLoader />}>
    <Route index element={<Home />} />
    <Route path="studios" element={<Studios />} />
    <Route path=":section" element={<Home />} />
  </Route>
</Routes>
```
* **LanguageLoader 컴포넌트**: `:lang` 파라미터를 읽어 `i18n.changeLanguage(lang)`를 자동으로 호출하여 언어 환경을 동기화합니다.

---

## 2. hreflang 및 Canonical 태그 구현
각 다국어 페이지가 동일한 콘텐츠의 번역본임을 알리는 `hreflang` 태그를 `head`에 동적으로 삽입합니다.
```javascript
// App.jsx 내 alternate link 갱신 로직
const updateHreflangTags = (currentPath) => {
  const baseDomain = 'https://fitgirls.me';
  const langs = ['ko', 'en', 'ja', 'zh'];
  
  // 기존 alternate 링크 초기화
  document.querySelectorAll('link[rel="alternate"]').forEach(el => el.remove());
  
  // 국가별 hreflang 설정
  langs.forEach(lang => {
    const link = document.createElement('link');
    link.rel = 'alternate';
    link.hreflang = lang;
    link.href = `${baseDomain}/${lang}${currentPath}`;
    document.head.appendChild(link);
  });

  // 디폴트 매핑 (x-default)
  const defaultLink = document.createElement('link');
  defaultLink.rel = 'alternate';
  defaultLink.hreflang = 'x-default';
  defaultLink.href = `${baseDomain}${currentPath}`;
  document.head.appendChild(defaultLink);
};
```
* **Canonical 갱신**: URL 경로와 결합하여 고유 Canonical 주소(`<link rel="canonical" href="https://fitgirls.me/en/studios" />` 등)를 주입해 중복 콘텐츠 오인을 예방합니다.

---

## 3. 중앙 집중식 메타데이터 관리 (`seo_metadata.json`)
각 페이지 및 섹션(경로)별로 로컬라이징된 고유 타이틀과 디스크립션 딕셔너리를 관리합니다.

```json
{
  "/": {
    "ko": { "title": "핏걸즈 | 여자 바디프로필 전문 프리미엄 스튜디오", "desc": "압도적인 화보 무드의 핏걸즈 바디프로필..." },
    "en": { "title": "FITGIRLS | Premium Female Body Profile Studio", "desc": "Seoul's best body profile pictorial studio..." }
  },
  "/studios": {
    "ko": { "title": "핏걸즈 스튜디오 브랜드 스토리 & 콘셉트 안내", "desc": "신사동 핏걸즈의 80개 이상의 입체적 촬영 배경..." },
    "en": { "title": "FITGIRLS Studios | Brand Background & Concepts", "desc": "Discover 80+ dynamic background zones in Gangnam..." }
  }
}
```
* **SEOManager 구현**: `App.jsx`에서 `location.pathname`과 `lang`에 부합하는 메타데이터를 검색하여 `document.title` 및 `description` 메타 태그에 실시간 주입합니다.

---

## 4. 이미지 최적화 및 구조화 데이터

### A. 이미지 최적화 방안
* **Vite Image Optimizer**: 빌드 타임에 public 폴더 내 정적 에셋(로고, 배너 등)을 압축(WebP, AVIF) 처리합니다.
* **Firebase Storage 썸네일 규칙**: 갤러리 썸네일 그리드는 Firebase Functions의 익스텐션 또는 자체 리사이징 업로드를 활용해 `_thumb`가 붙은 작은 웹용 규격(400px 내외 WebP)을 호출하고, 클릭 시에만 원본 고화질을 가져오도록 렌더링 로직을 분리합니다.

### B. 동적 JSON-LD 구조화 데이터 적용
메인 도메인의 `LocalBusiness` 스키마 이외에, 활성화된 섹션에 따라 헤드에 즉시 JSON-LD 블록을 추가/제거합니다.
* **FAQ 섹션 활성화 시**: `FAQPage` 마크업 주입 (포털 검색 결과 상의 FAQ 리치 스니펫 획득 목적).
* **촬영 요금제(`/service`) 조회 시**: `PriceSpecification` 및 `Product` 스키마 주입.

---

## 5. sitemap.xml 및 robots.txt 갱신 계획

### A. robots.txt 개선
민감하거나 정보가 얕은 비공개 페이지를 배제합니다.
```
User-agent: *
Allow: /
Disallow: /admin/
Disallow: /retouch/
Disallow: /checklist/
Disallow: /report/

Sitemap: https://fitgirls.me/sitemap.xml
```

### B. 다국어 sitemap.xml 자동 생성기 (`scripts/generate-sitemap.mjs`)
빌드 타임에 실행되는 스크립트를 작성하여, 공개 경로와 다국어 서브디렉토리를 조합하고 `hreflang` 매핑이 완비된 `sitemap.xml`을 자동 생성해 `public` 경로에 씁니다.

---

## 6. 분석 및 예약 버튼 전환 추적 (GA4)
사용자가 메인 페이지의 예약 신청 폼 제출 버튼(`ReservationForm.jsx`)을 클릭하거나 카카오톡 문의 버튼을 누를 때 GA4 사용자 지정 이벤트를 직접 발생시킵니다.
```javascript
// 예약 완료 혹은 카톡 상담 클릭 시 작동
window.gtag('event', 'conversion', {
  'send_to': 'G-65N5ETKRN5',
  'event_category': 'Booking',
  'event_label': 'Kakao CS Click'
});
```

---

## 7. 단계별 개발 및 검증 프로세스

| 단계 | 작업 내용 | 완료 기준 |
|---|---|---|
| **Step 1** | `public/robots.txt` 및 `public/sitemap.xml` 구조 수정 | 관리자 및 보정 비공개 페이지의 크롤러 노출 차단 완료 |
| **Step 2** | 다국어 서브디렉토리 라우팅(`LanguageLoader`) 개발 | 주소창에 `/en/studios` 입력 시 정상적으로 영어 페이지가 열림 |
| **Step 3** | 경로별 동적 메타 데이터 & Canonical / hreflang 주입 | 서브페이지 진입 시 헤드의 alternate 4개 언어 링크 및 canonical 주소 자동 갱신 확인 |
| **Step 4** | 빌드 시점 정적 HTML 파일 Prerender(SSG) 환경 셋팅 | `dist/` 빌드 폴더 내에 `/en/studios/index.html` 등이 실제 텍스트를 포함한 채로 자동 생성됨 |
| **Step 5** | 구글 서치콘솔 및 네이버 서치어드바이저 제출 및 검증 | 오류 없이 다국어 사이트맵 인식 완료 및 색인 요청 처리 |

### 테스트 및 검증 도구
* **Google Rich Results Test**: 생성된 정적 HTML 파일 내 JSON-LD 구조화 데이터 문법 오류 검증.
* **Lighthouse (SEO & Performance Audit)**: 모바일/데스크톱 SEO 점수 100점 달성 여부 검사.
* **hreflang Tags Testing Tool**: 다국어 링크 및 x-default 매핑 유효성 재확인.
