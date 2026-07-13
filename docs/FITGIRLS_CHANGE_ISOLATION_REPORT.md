# FITGIRLS 로컬 변경사항 격리 및 분석 보고서 (Change Isolation Report)

본 보고서는 핏걸즈(FITGIRLS) 공식 웹사이트의 로컬 저장소에 미커밋 상태로 혼재되어 있는 기존 기능(Retouch, Checklist, Admin, Firestore)과 신규 SEO 최적화 작업의 상세 변경사항을 분석하고, 안전한 코드 격리 및 단계적 커밋/배포 전략을 제안하기 위해 작성되었습니다.

---

## 1. 현재 저장소 변경사항 명령어 수준 요약

### A. git status --short 결과
```bash
 M package-lock.json
 M package.json
 M public/robots.txt
 M public/rss.xml
 M public/sitemap.xml
 M src/App.jsx
 M src/components/Footer.css
 M src/components/Footer.jsx
 M src/components/GalleryMultiUploader.jsx
 M src/components/Header.jsx
 M src/components/admin/ChecklistAdminTab.jsx
 M src/components/admin/RetouchAdminTab.css
 M src/components/admin/RetouchAdminTab.jsx
 M src/components/sections/Gallery.jsx
 M src/components/sections/Zone.jsx
 M src/i18n/locales/en.json
 M src/i18n/locales/ja.json
 M src/i18n/locales/ko.json
 M src/i18n/locales/zh.json
 M src/pages/Admin.jsx
 M src/pages/Checklist.jsx
 M src/pages/ChecklistView.jsx
 M src/pages/Retouch.css
 M src/pages/Retouch.jsx
 M src/pages/Reviews.jsx
 M src/utils/aligoService.js
?? check_db.mjs
?? docs/
?? google-credentials.json
?? scripts/auto-tag-archive.mjs
?? scripts/check_failed_tags.mjs
?? scripts/check_tag_statistics.mjs
?? scripts/google-drive-sync.mjs
?? scripts/test-query.mjs
?? src/pages/RetouchChecklist.css
?? src/pages/RetouchChecklist.jsx
?? src/pages/Studios.css
?? src/pages/Studios.jsx
?? src/seo_metadata.json
?? src/utils/domain.js
```

### B. git diff --name-status 결과
```bash
M	package-lock.json
M	package.json
M	public/robots.txt
M	public/rss.xml
M	public/sitemap.xml
M	src/App.jsx
M	src/components/Footer.css
M	src/components/Footer.jsx
M	src/components/GalleryMultiUploader.jsx
M	src/components/Header.jsx
M	src/components/admin/ChecklistAdminTab.jsx
M	src/components/admin/RetouchAdminTab.css
M	src/components/admin/RetouchAdminTab.jsx
M	src/components/sections/Gallery.jsx
M	src/components/sections/Zone.jsx
M	src/i18n/locales/en.json
M	src/i18n/locales/ja.json
M	src/i18n/locales/ko.json
M	src/i18n/locales/zh.json
M	src/pages/Admin.jsx
M	src/pages/Checklist.jsx
M	src/pages/ChecklistView.jsx
M	src/pages/Retouch.css
M	src/pages/Retouch.jsx
M	src/pages/Reviews.jsx
M	src/utils/aligoService.js
```

### C. git diff --stat 요약
* **전체 변경량**: 26개 파일 수정, 6,819라인 추가, 1,273라인 삭제.
* **주요 변경 분포**:
  * `src/components/admin/ChecklistAdminTab.jsx`: +1058 / -12 (기존 기능)
  * `src/pages/Retouch.css`: +989 / -5 (기존 기능)
  * `src/pages/Retouch.jsx`: +607 / -62 (기존 기능)
  * `src/pages/Checklist.jsx`: +263 / -15 (기존 기능)
  * `src/components/sections/Gallery.jsx`: +286 / -22 (혼재)
  * `src/App.jsx`: +123 / -26 (혼재)
  * `src/i18n/locales/ko.json` 외 3개 다국어 파일: 각 약 +354 / -19 (혼재)

---

## 2. 변경 파일의 3대 그룹 분류

로컬 내 모든 변경 사항(Modified 및 Untracked 포함)을 성격에 따라 다음 3개 그룹으로 명확히 분류합니다.

### A. 기존 Retouch / Checklist / Admin / Firestore 기능 관련 파일
기존 비즈니스 로직(보정 강도 제출, 촬영 전 체크리스트 고도화, 어드민 관리 탭 최적화 등)의 확장 및 백엔드 유틸리티 스크립트 그룹입니다.

* `src/components/admin/ChecklistAdminTab.jsx`
* `src/components/admin/RetouchAdminTab.jsx`
* `src/components/admin/RetouchAdminTab.css`
* `src/pages/Checklist.jsx` (보존 대상)
* `src/pages/ChecklistView.jsx`
* `src/pages/Retouch.jsx` (보존 대상)
* `src/pages/Retouch.css`
* `src/pages/RetouchChecklist.jsx` [NEW]
* `src/pages/RetouchChecklist.css` [NEW]
* `src/components/GalleryMultiUploader.jsx`
* `src/pages/Admin.jsx`
* `src/utils/aligoService.js`
* `check_db.mjs` [NEW]
* `google-credentials.json` [NEW]
* `scripts/google-drive-sync.mjs` [NEW]
* `scripts/auto-tag-archive.mjs` [NEW]
* `scripts/check_failed_tags.mjs` [NEW]
* `scripts/check_tag_statistics.mjs` [NEW]
* `scripts/test-query.mjs` [NEW]
* `src/utils/domain.js` [NEW]

### B. 이번 SEO 작업 관련 파일
검색엔진 최적화 계획(사이트맵 수동/자동 개선, 로봇 제어, 동적 메타 관리 등)을 위해 신설 또는 전면 교체된 정적 파일 및 문서 그룹입니다.

* `public/robots.txt`
* `public/sitemap.xml`
* `public/rss.xml`
* `src/seo_metadata.json` [NEW]
* `src/pages/Studios.jsx` [NEW]
* `src/pages/Studios.css` [NEW]
* `docs/` 디렉토리 내의 SEO 설계 문서 전체

### C. 두 기능이 함께 수정되어 분리가 필요한 파일 (공존 파일)
동일 파일 내에 기존 보정/체크리스트/디렉터 어드민 고도화 관련 코드와 SEO 최적화/다국어 라우팅 관련 코드가 함께 포함되어 있어 수동 분리가 필요한 중요 파일군입니다.

* `src/App.jsx`
* `src/components/sections/Gallery.jsx`
* `src/components/sections/Zone.jsx`
* `src/i18n/locales/ko.json`
* `src/i18n/locales/en.json`
* `src/i18n/locales/ja.json`
* `src/i18n/locales/zh.json`
* `src/components/Header.jsx`
* `src/components/Footer.jsx`
* `src/components/Footer.css`
* `package.json` / `package-lock.json`

---

## 3. 파일별 세부 정보 분석 표

| 파일 경로 | 변경 목적 | 작업 구분 | 완성 여부 | 빌드 영향 | 배포 시 위험 | 별도 커밋 가능 여부 |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `src/pages/Retouch.jsx` | 보정 강도 선택 및 이벤트 동의 제출 기능 추가, 체크리스트 모달 연동 | Retouch/Checklist | 완료 | 없음 | 로직 에러 시 보정 요청 기능 오작동 가능 | **가능** (독립 커밋 가능) |
| `src/pages/Retouch.css` | 보정 페이지의 신규 레이아웃 및 컴포넌트 스타일링 | Retouch/Checklist | 완료 | 없음 | 없음 | **가능** (Retouch.jsx와 묶음) |
| `src/pages/Checklist.jsx` | 분위기 및 바디강조 필드 추가, 제출 성공 시 AI 추천 컨셉 모달 연동 | Retouch/Checklist | 완료 | 없음 | 없음 | **가능** (독립 커밋 가능) |
| `src/pages/ChecklistView.jsx` | 작성된 체크리스트 결과를 화면에 렌더링하는 전용 뷰어 | Retouch/Checklist | 완료 | 없음 | 없음 | **가능** |
| `src/components/admin/ChecklistAdminTab.jsx` | 어드민 페이지 내 상담 체크리스트 조회 및 상세 관리 탭 추가 | Admin | 완료 | 없음 | 어드민 기능 오작동 가능 | **가능** |
| `src/components/admin/RetouchAdminTab.jsx` | 어드민 페이지 내 고객 보정 요청 상태 및 제출 상세 정보 관리 탭 | Admin | 완료 | 없음 | 어드민 기능 오작동 가능 | **가능** |
| `src/components/admin/RetouchAdminTab.css` | 어드민 보정 관리 탭의 스타일링 | Admin | 완료 | 없음 | 없음 | **가능** (RetouchAdminTab.jsx와 묶음) |
| `src/pages/Admin.jsx` | lookbook 및 studios 탭 조회 시 클라이언트 정렬 적용 (Firestore 비용 및 인덱싱 요구조건 제거) | Admin | 완료 | 없음 | Firestore 쿼리 장애 위험성 낮음 | **가능** |
| `src/utils/aligoService.js` | 알림톡 템플릿 파라미터(`concept`, `id` 등) 추가 및 체크리스트 메시지 문구 수정 | Retouch/Checklist | 완료 | 없음 | 파라미터 미정합 시 알림톡 발송 에러 위험 | **가능** (Firestore 데이터와 일치해야 함) |
| `src/components/GalleryMultiUploader.jsx` | 갤러리 이미지 다중 업로드 시 업로드 상태바 및 진행율 표시 개선 | Admin | 완료 | 없음 | 파일 업로드 기능 장애 우려 | **가능** |
| `src/utils/domain.js` [NEW] | 핏걸즈 메인과 네버랜드 셀프스튜디오의 도메인 구분 헬퍼 유틸 | Retouch/Checklist | 완료 | 없음 | 도메인 판별 로직 오류 시 네버랜드 라우팅 깨짐 | **가능** |
| `src/pages/RetouchChecklist.jsx` [NEW] | 고객이 보정본을 요청할 때 작성하는 상세 양식 페이지 | Retouch/Checklist | 완료 | 없음 | 라우트 미연결 시 접근 불가 (단독 영향은 낮음) | **가능** (App.jsx 라우트 등록 필요) |
| `src/pages/RetouchChecklist.css` [NEW] | 고객 보정 요청 양식 스타일 | Retouch/Checklist | 완료 | 없음 | 없음 | **가능** |
| `public/robots.txt` | 크롤러 제어를 위한 robots.txt 재구성 | SEO | 완료 | 없음 | 검색 봇 수집 범위 오작동 위험 | **가능** |
| `public/sitemap.xml` | 검색 봇에 제공할 사이트맵 최신화 | SEO | 완료 | 없음 | 검색 색인 수집 영향 | **가능** |
| `public/rss.xml` | 네이버 등 검색엔진의 RSS 수집용 피드 구조 업데이트 | SEO | 완료 | 없음 | 피드 파싱 오류 발생 가능 | **가능** |
| `src/seo_metadata.json` [NEW] | 경로/언어별 타이틀, 디스크립션, 키워드를 관리하는 중앙 메타데이터 파일 | SEO | 완료 | 없음 | App.jsx 컴파일 시 누락되면 빌드 에러 | **가능** (App.jsx의 SEO 코드와 함께 커밋 권장) |
| `src/pages/Studios.jsx` [NEW] | 핏걸즈 브랜드 아이덴티티 및 프리미엄 촬영 배경, 대여 의상 소개 독립 페이지 | SEO / UI | 완료 | 없음 | 단독으로는 라우트 등록 전까지 노출되지 않음 | **가능** |
| `src/pages/Studios.css` [NEW] | Studios 페이지 전용 CSS | SEO / UI | 완료 | 없음 | 없음 | **가능** |
| `src/App.jsx` | 경로별 SEO 메타데이터 동적 주입 및 4개 국어 매핑 / Retouch, Checklist, Studios, Neverland 라우트 등록 | **혼재 (C그룹)** | 완료 | 높음 | 라우팅 및 전역 메타 갱신 오작동 시 사이트 전체 다운 | **수동 분리 후 분할 커밋 필요** |
| `src/components/sections/Gallery.jsx` | Firestore 조회 실패 시 Fallback 직접 쿼리 로직 / 검색어 토큰화(SYNONYM) 및 다국어 alt 태그 매핑 | **혼재 (C그룹)** | 완료 | 보통 | 갤러리 렌더링 깨짐 또는 Firebase 연동 오류 | **수동 분리 후 분할 커밋 필요** |
| `src/components/sections/Zone.jsx` | 어드민 해시태그 로드 조건화(성능 개선) / 브랜드 분리(`brand: neverland`) 및 네버랜드 URL 히스토리 연동 | **혼재 (C그룹)** | 완료 | 보통 | 촬영존 안내 탭 렌더링 에러 | **수동 분리 후 분할 커밋 필요** |
| `src/i18n/locales/*.json` (4개 파일) | 알림톡 및 기존 기능 추가 번역 / Studios 및 SEO 관련 대량 다국어 번역 데이터 | **혼재 (C그룹)** | 완료 | 없음 | 번역 파일 깨질 시 사이트 텍스트 미출력 | **수동 분리 후 분할 커밋 필요** |
| `src/components/Header.jsx` | 네비게이션 메뉴 구성 및 탭 정렬 순서 조정 | UI 개선 | 완료 | 없음 | 메뉴 네비게이션 렌더링 깨짐 | **가능** |
| `src/components/Footer.jsx` / `.css` | 푸터 영역 소셜 네트워크 아이콘(인스타, 유튜브, 네이버 스마트플레이스) 추가 | UI 개선 | 완료 | 없음 | 푸터 레이아웃 깨짐 | **가능** |
| `package.json` / `package-lock.json` | Google drive sync 및 AI 자동 태깅용 라이브러리 의존성 추가 | 개발 환경 | 완료 | 높음 | 빌드 시 라이브러리 누락으로 빌드 실패 가능 | **가능** |

---

## 4. 공존 파일(C그룹) 내 코드 라인 단위 구체적 분석

기존 비즈니스 로직과 SEO 코드가 공존하는 핵심 파일들을 라인/로직 단위로 해부하여 구분합니다.

### A. `src/App.jsx` 분석

#### 1) 기존 / 신규 비즈니스 기능 코드 (보정/체크리스트/네버랜드 도메인 제어)
* **임포트부 (Lines 39, 47, 49):**
  ```javascript
  import RetouchChecklist from './pages/RetouchChecklist';
  import Studios from './pages/Studios';
  import ChecklistView from './pages/ChecklistView';
  ```
  * *분석*: 신규 구현된 보정 요청(RetouchChecklist), 스튜디오 브랜딩(Studios), 상담지 상세 뷰어(ChecklistView) 페이지 컴포넌트를 불러오는 로직입니다.
* **네버랜드 도메인 헬퍼 임포트 (Line 51):**
  ```javascript
  import { isNeverlandDomain } from './utils/domain';
  ```
* **Home 컴포넌트 내 스크롤 히스토리 치환 로직 (Lines 187-205):**
  ```javascript
  const isNev = isNeverlandDomain();
  ...
  let resolvedPath = newPath;
  if (isNev && (newPath === '/zone' || newPath === '/archive')) {
    resolvedPath = `/neverland${newPath}`;
  }
  if (!currentPath.startsWith(resolvedPath)) {
    window.history.replaceState(null, '', resolvedPath);
  }
  ```
  * *분석*: 네버랜드 도메인으로 접속했을 때 스크롤에 따라 상단 주소 표시줄의 URL 경로를 `/zone`이 아닌 `/neverland/zone` 등으로 동적으로 변경해주기 위한 도메인별 분리 로직입니다.
* **라우트 정의부 (Lines 420-435):**
  ```javascript
  <Route path="/retouch/checklist" element={<RetouchChecklist />} />
  ...
  <Route path="/checklist" element={<Checklist />} />
  <Route path="/checklist/view" element={<ChecklistView />} />
  ...
  <Route path="/neverland/:section" element={<Home changeLanguage={changeLanguage} currentLang={i18n.language} />} />
  <Route path="/neverland/:section/:tab" element={<Home changeLanguage={changeLanguage} currentLang={i18n.language} />} />
  ```
  * *분석*: 새로 생성된 보정 및 상담지 경로를 지정해주고, 네버랜드 탭에 대응하는 라우팅 매핑을 활성화하는 코드입니다.

#### 2) 이번 SEO 작업 코드 (메타데이터 및 로봇/Alternate 태그 동적 제어)
* **메타데이터 임포트 (Line 52):**
  ```javascript
  import SEO_METADATA from './seo_metadata.json';
  ```
* **App 컴포넌트 내 SEO 제어 `useEffect` 로직 (Lines 268-380):**
  ```javascript
  const seoMeta = SEO_METADATA;
  const fallbackResources = { ko: { ... }, en: { ... }, ja: { ... }, zh: { ... } };
  
  const path = location.pathname;
  const matchedKey = Object.keys(seoMeta)
    .filter(key => path === key || path.startsWith(key + '/') || (key !== '/' && path.startsWith(key)))
    .sort((a, b) => b.length - a.length)[0] || null;

  const pageMeta = matchedKey && seoMeta[matchedKey]?.[lang]
    ? seoMeta[matchedKey][lang]
    : (fallbackResources[lang] || fallbackResources.ko);

  // 1. 타이틀 주입 (상담지 제외)
  if (!location.pathname.includes('/checklist')) {
    document.title = pageMeta.title;
  }
  // 2~3. description, keywords 메타 태그 갱신
  ...
  // 4. Canonical 태그 동적 갱신
  canonicalLink.href = `${baseDomain}${path === '/' ? '' : path}`;
  
  // 5. 비공개 경로 noindex 메타 태그 주입
  const privateRoutes = ['/admin', '/retouch', '/checklist', '/report', '/ambar'];
  const isPrivate = privateRoutes.some(r => path.startsWith(r));
  ...
  robotsMeta.setAttribute('content', 'noindex, nofollow');
  
  // 6. alternate 및 x-default 매핑 다국어 봇 태그 갱신 (공개 경로만)
  if (!isPrivate) {
    langs.forEach(l => { ... });
  }
  ```
  * *분석*: 사용자가 페이지를 이동할 때마다 헤더 메타 정보를 동적으로 새로 작성해 봇에게 최신 Canonical과 hreflang을 매핑해주고, 비공개 주소에는 `noindex` 태그를 부착해 인덱싱을 강제 거부시키는 순수 SEO 목적의 기능입니다.

---

### B. `src/components/sections/Gallery.jsx` 분석

#### 1) 기존 비즈니스 기능 코드 (Direct Firestore Fallback 및 자연어 검색엔진)
* **어드민 업로더 및 Firestore 기능 고도화 (Lines 249-286):**
  ```javascript
  // [Direct Firestore Fallback Plan]
  if (!firebaseItems || firebaseItems.length === 0) {
      try {
          const q = query(collection(fireDb, 'gallery'), orderBy('createdAt', 'desc'), limit(300));
          const snapshot = await getDocs(q);
          firebaseItems = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      } catch (directErr) { ... }
  }
  ```
  * *분석*: IndexedDB 동기화 장애나 헬퍼 서비스 에러 시 Firestore로부터 실시간으로 300개의 이미지를 직접 풀링해오는 안정성 확보 로직입니다.
* **AI 검색용 해시태그 및 벡터/번역 매핑 필드 추가 (Lines 314-319):**
  ```javascript
  aiTags: item.aiTags || [],
  imageEmbedding: item.imageEmbedding || null,
  ```
* **한국어->영어 AI 동의어 사전 매핑 및 자연어 토큰 분석 엔진 (Lines 413-510):**
  ```javascript
  const SYNONYM_MAP = { '핑크': ['pink', 'rose'], '비키니': ['bikini', 'swimwear'], ... };
  const tokenizeQuery = (query) => { ... };
  const searchFiltered = searchQuery.trim() ? (() => {
      // 매칭 점수 relevance 계산 및 정렬 로직
      ...
  })() : [];
  ```
  * *분석*: 갤러리 검색창에 "침대에 누운 핑크 수영복 사진"과 같이 일반적인 문장을 입력해도 동의어 및 AI 태그들을 연계 분석해 연관 사진을 최우선으로 정렬해 보여주는 고도의 자연어 검색 시스템입니다.

#### 2) 이번 SEO 작업 코드 (다국어 alt 태그 및 봇 수집 텍스트)
* **이미지 `alt` 다국어 번역 매핑 (Lines 798-809):**
  ```javascript
  alt={(() => {
       const langKey = i18n.language === 'ko' ? 'ko' : i18n.language;
       if (item.translations && item.translations[langKey] && item.translations[langKey].length > 0) {
           return item.translations[langKey].join(', ');
       }
       if (item.aiTags && item.aiTags.length > 0 && langKey === 'ko') {
           return item.aiTags.join(', ');
       }
       return item.seoTags || 'Gallery';
  })()}
  ```
  * *분석*: 갤러리에 렌더링되는 이미지의 `alt` 텍스트를 검색엔진 봇이 수집할 수 있도록 각 언어별로 번역된 키워드로 동적으로 치환해 주어, 구글/네이버의 **이미지 검색 탭 영역 노출 확률을 극대화**하는 정밀 SEO 코드입니다.

---

### C. `src/components/sections/Zone.jsx` 분석

#### 1) 기존 비즈니스 기능 코드 (어드민 최적화 및 네버랜드 구분)
* **어드민용 리소스 제어 및 브랜드 태그 (Lines 150-155, 304-315, 787-805):**
  ```javascript
  const fetchTags = async () => {
      if (!isAdmin) return; // 어드민이 아닐 때 불필요한 전체 갤러리 로딩 방지 (Firestore 요금 최적화)
      ...
  };
  ```
  * *분석*: 일반 사용자가 촬영존 메뉴를 볼 때 불필요하게 갤러리 DB 컬렉션을 스캔하지 않도록 제약을 걸어 과금 및 지연을 예방하는 튜닝입니다.
  ```javascript
  brand: isNeverlandDomain() ? 'neverland' : 'fitgirls'
  ```
  * *분석*: 룩북 업로드 및 수정 시 도메인을 분석해 핏걸즈 의상인지 네버랜드 의상인지 데이터베이스에 구분하여 입력되도록 처리하고 어드민에 브랜드 선택 드롭다운 창을 추가한 로직입니다.

#### 2) 이번 SEO 작업 코드 (URL 히스토리 연동)
* **탭 전환 시 네버랜드 경로 URL 매핑 (Lines 340-370):**
  ```javascript
  const base = isNeverlandDomain() ? '/neverland' : '';
  window.history.replaceState(null, '', `${base}/zone`);
  ```
  * *분석*: 촬영존 탭 전환 시 주소창을 물리적 경로와 결합하여 갱신해줌으로써, 검색엔진이 개별 배경 정보 경로를 정상 식별할 수 있도록 히스토리를 갱신해주는 작업입니다.

---

### D. `src/i18n/locales/*.json` (다국어 리소스) 분석

#### 1) 기존 비즈니스 기능 코드
* **알림톡 관련 텍스트 추가**: `ko.json` 및 각 국어 리소스 내 상담 체크리스트 완료 알림용 UI 레이아웃의 레이블 등.
* **보정 강도/이벤트 동의 다국어 텍스트**: `retouchLevels` 가이드라인, 최종 제출 경고창용 번역 키.

#### 2) 이번 SEO 작업 코드
* **Studios 독립 페이지의 전체 다국어 콘텐츠**: `studios` 번역 객체 하위에 들어간 수만 바이트에 달하는 핏걸즈 프리미엄 강남 스튜디오 소개글, 80+ 촬영 배경 안내 카드 설명, 6단계 케어 프로세스, 10대 대표 촬영 컨셉 카드용 다국어(`ko`, `en`, `ja`, `zh`) 하드코딩 텍스트 일체.

---

## 5. 정정된 프로젝트 사실관계 및 SEO 수정 지침

분석과 제안 시 다음 정정 사항들을 정확히 반영하여 시스템 안전성을 확보합니다.

### A. 예약 및 문의 기능
* ⚠️ **사실 정정**: 현재 핏걸즈 공식 웹사이트에는 **카카오 예약 기능 및 LINE 예약 기능이 부재**합니다.
* **조치**: LINE이나 카카오 예약 관련 신규 구현 또는 테스트 검증 대상에서 해당 내용들을 완전히 배제합니다.
* **실제 기능**: 현재 웹에 실존하는 1:1 상담용 **카카오톡 상담 채널 플로팅 버튼(SupportCS 컴포넌트)의 단순 문의 링크 기능**만 유지 및 모니터링합니다.

### B. 다국어 및 hreflang 최종 스펙
* **지원 언어 (4개)**: 한국어(`ko`), 영어(`en`), 일본어(`ja`), 중국어 간체(`zh`). (중국어 번체는 분리 지원하지 않음)
* **중국어 세부 세팅**:
  * URL 경로 접두사: `/zh/`
  * html lang 속성: `zh-Hans`
  * hreflang 설정: `zh-Hans`
* **최종 매핑용 hreflang 목록**:
  * `ko` (한국어)
  * `en` (영어)
  * `ja` (일본어)
  * `zh-Hans` (중국어 간체)
  * `x-default` (기본 언어 경로 - 한국어 또는 루트)
  * *주의*: `zh-TW`나 `zh-Hant`에 대한 별도 매핑, 독립 페이지, JSON 메타데이터는 추가 및 작성하지 않습니다.

### C. 비공개 경로 보안 제어 방식 정정
* ⚠️ **보안 인식 정정**: `robots.txt`에 비공개 경로를 Disallow 처리하는 것은 보안 수단이 아니며, 단지 검색엔진 검색 결과에서 제외하기 위한 용도입니다.
* **실제 비공개 경로 보안**:
  * `/admin`: Firebase Authentication을 이용한 관리자 세션 로그인 및 Firestore Security Rules 기반 접근 제어 상태를 엄격히 적용 중입니다.
  * `/checklist/view` 및 `/retouch`: 개인의 고유한 촬영 키값 또는 세션 토큰 매칭이 없을 시 접근을 원천 차단하는 접근 제어가 구현되어 있습니다.
* **공개 경로 검색 제외 처리**: 
  * 검색에서 명시적 제외가 필요한 경로의 경우, `robots.txt` 설정 외에 `App.jsx`에서 감지하여 `<meta name="robots" content="noindex, nofollow" />` 헤더를 돔에 동적으로 주입하는 현 구현 방식이 가장 적합합니다.

---

## 6. 안전한 코드 격리 및 단계적 분리 제안 (승인 대기)

로컬 저장소의 훼손 없이 기존 비즈니스 기능(Retouch, Checklist, Admin)과 SEO 최적화 코드를 안전하게 각각 격리하여 커밋하기 위한 3단계 프로세스를 제안합니다.

### [Phase 1] 기존 비즈니스 로직(A그룹) 선제 격리 커밋
* **대상 파일**:
  * `src/pages/Retouch.jsx` / `Retouch.css`
  * `src/pages/Checklist.jsx`
  * `src/pages/ChecklistView.jsx`
  * `src/components/admin/ChecklistAdminTab.jsx`
  * `src/components/admin/RetouchAdminTab.jsx` / `RetouchAdminTab.css`
  * `src/pages/RetouchChecklist.jsx` / `RetouchChecklist.css` [NEW]
  * `src/utils/aligoService.js`
  * `src/pages/Admin.jsx`
  * `src/utils/domain.js` [NEW]
  * `scripts/` 내 신규 스크립트 및 `check_db.mjs`
* **수행 방식**:
  * git checkout이나 reset을 쓰지 않고, 위 파일들을 먼저 단독으로 Staging 영역에 추가(`git add`)한 뒤 **"feat: implement customer retouch request intensity selection & checklist AI recommended concepts"** 등의 타이틀로 단독 커밋을 실행합니다.

### [Phase 2] 공존 파일(C그룹) 내 SEO 코드 분리 추출 및 2차 커밋
* **대상 파일**: `src/App.jsx`, `src/components/sections/Gallery.jsx`, `src/components/sections/Zone.jsx`
* **수행 방식**:
  * `git add -p` (interactive staging) 명령어를 통해 파일 내에서 **기존 비즈니스 수정분**(네버랜드 라우팅, 룩북 어드민 수정, 갤러리 Fallback 및 자연어 검색 알고리즘 등)만 먼저 쪼개어 Staging 영역에 추가하여 Phase 1 커밋에 포함시킵니다.
  * 파일 내부에 남은 **순수 SEO 최적화 및 메타데이터 주입 로직**은 B그룹 파일들과 묶어 **"feat: integrate centralized path-based SEO metadata, canonicals and hreflangs (zh-Hans)"**로 2차 커밋을 분리 실행합니다.

### [Phase 3] 신규 SEO 에셋 및 리소스(B그룹) 최종 커밋
* **대상 파일**: 
  * `public/robots.txt` / `sitemap.xml` / `rss.xml`
  * `src/seo_metadata.json`
  * `src/pages/Studios.jsx` / `Studios.css`
  * 다국어 리소스의 SEO 번역 데이터
* **수행 방식**:
  * 2차 커밋(Phase 2의 SEO 관련)이 끝난 뒤 남은 정적 파일과 메타데이터 JSON 및 다국어 번역 에셋들을 일괄 추가하여 배포 직전 최종 커밋으로 묶어 완료합니다.

---
**본 격리 제안서의 작성을 마치고, 사용자의 검토 및 승인을 기다립니다. 승인 전까지는 저장소 변경, 브랜치 작업, 리셋 등의 그 어떤 Git 조작 및 코드 수정을 진행하지 않습니다.**
