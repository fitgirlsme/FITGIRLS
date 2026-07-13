# FITGIRLS 프로젝트 — Gemini 인수인계 문서

## 0. 이 문서의 목적

이 문서는 FITGIRLS 웹사이트 프로젝트를 기존 AI 작업 환경에서 Gemini로 안전하게 인계하기 위한 기준 문서다.

Gemini는 이 문서만 믿고 즉시 코드를 수정하지 말고, 반드시 현재 로컬 저장소의 실제 상태와 기존 분석 문서를 먼저 확인해야 한다.

---

## 1. 프로젝트 기본 정보

- 브랜드: FITGIRLS / 핏걸즈
- 프로젝트: 여성 중심 바디프로필·패션 화보 스튜디오 웹사이트
- 주요 지역: 서울, 강남, 신사동, 가로수길
- 주요 해외 타깃: 일본, 영어권, 중국어권
- 현재 목표:
  1. 기존 Retouch / Checklist / Admin 기능 개발을 보존
  2. SEO 작업을 기존 기능과 안전하게 분리
  3. 검색엔진이 페이지별 내용을 정확히 이해할 수 있도록 기술 SEO 개선
  4. 향후 한국어·영어·일본어·중국어 페이지 확장

---

## 2. 반드시 지켜야 할 확정 사실

### 예약 기능

현재 FITGIRLS 사이트에는 다음 기능이 없다.

- 카카오 예약
- LINE 예약

따라서:

- 해당 버튼, 링크, CTA를 새로 만들지 않는다.
- 해당 기능을 테스트 항목에 넣지 않는다.
- 문서나 메타데이터에 관련 표현이 있다면 실제 사이트 정보와 대조한다.
- 현재 코드에 실제로 존재하는 문의 또는 예약 방식만 사용한다.
- 확인되지 않는 정보는 임의로 추측하지 않는다.

### 지원 언어

최종 지원 언어는 총 4개다.

- 한국어: `ko`
- 영어: `en`
- 일본어: `ja`
- 중국어 간체: `zh`

중국어는 간체와 번체를 분리하지 않는다.

권장 설정:

- 중국어 URL: `/zh/`
- HTML `lang`: `zh-Hans`
- `hreflang`: `zh-Hans`

사용 대상:

- `ko`
- `en`
- `ja`
- `zh-Hans`
- `x-default`

생성하지 말 것:

- `zh-TW`
- `zh-Hant`
- 중국어 번체 전용 페이지
- 중국어 국가별 중복 페이지

---

## 3. 마지막으로 보고된 저장소 상태

다음 내용은 이전 작업 환경에서 보고된 상태이며, Gemini는 실제 저장소를 다시 확인해야 한다.

- `npm run build` 성공
- 과거 `getGalleryItems` 관련 빌드 오류는 해결된 것으로 보고됨
- 변경사항은 아직 로컬 미커밋 상태로 보고됨
- 다음 두 작업이 하나의 저장소에 섞여 있는 것으로 보고됨

### A. Retouch / Checklist / Admin / Firestore 기능

주요 파일 예시:

- `src/pages/Retouch.jsx`
- `src/pages/Checklist.jsx`
- `src/components/admin/ChecklistAdminTab.jsx`
- Retouch / Checklist / Admin / Firestore 관련 파일

보고된 기능:

- 보정 강도 선택
- 이벤트 동의 설정
- Firestore `retouch_masters` 제출 여부 및 시간 기록
- 촬영 분위기와 바디라인 강조사항 입력
- 체크리스트 결과 기반 맞춤형 사진 추천 모달
- 상담·체크리스트 어드민 관리 기능

### B. SEO Phase 1 작업

주요 파일 예시:

- `public/robots.txt`
- `public/sitemap.xml`
- `src/seo_metadata.json`
- `src/App.jsx`
- SEO 관련 문서

보고된 기능:

- 경로별 title 및 meta description
- canonical
- robots meta
- hreflang
- sitemap
- 비공개 경로 검색 제외 검토

### C. 혼합 가능 파일

특히 `src/App.jsx`처럼 기존 기능과 SEO 변경이 함께 들어갈 수 있다.

파일 전체를 한 작업으로 단정하지 말고 diff hunk 단위로 분석해야 한다.

---

## 4. 이전에 작성된 것으로 보고된 문서

저장소에서 아래 파일이 실제로 존재하는지 확인한다.

- `docs/FITGIRLS_ANTIGRAVITY_SEO_MASTER_BRIEF.md`
- `docs/FITGIRLS_SEO_AUDIT.md`
- `docs/FITGIRLS_SEO_IMPLEMENTATION_PLAN.md`
- `docs/FITGIRLS_CHANGE_ISOLATION_REPORT.md`
- `docs/FITGIRLS_ISOLATION_EXECUTION_LOG.md` — 아직 없을 수도 있음
- `docs/FITGIRLS_PREDEPLOY_VALIDATION.md` — 아직 없을 수도 있음

파일이 존재하면 처음부터 끝까지 읽고, 현재 코드와 일치하는지 검증한다.

---

## 5. 현재 단계에서 절대 하지 말아야 할 작업

명시적 승인 전까지 금지:

- 코드 추가 수정
- 파일 삭제
- `git reset`
- `git checkout`으로 변경사항 덮어쓰기
- `git stash`
- 브랜치 생성
- 커밋
- push
- pull request 병합
- Firebase 배포
- `npm run deploy`
- 운영 사이트 배포
- 프레임워크 전면 마이그레이션
- 카카오 또는 LINE 기능 추가
- 중국어 번체 페이지 추가

---

## 6. Gemini가 가장 먼저 해야 할 작업

### 6.1 저장소 상태 재검증

다음 수준의 정보를 확인한다.

```bash
git branch --show-current
git rev-parse HEAD
git status --short
git diff --name-status
git diff --stat
```

필요하면 읽기 전용 범위에서 다음도 확인한다.

```bash
git diff -- <file>
git log --oneline -n 10
```

### 6.2 변경사항 분류 검증

모든 변경 파일을 다음으로 분류한다.

- A: Retouch / Checklist / Admin / Firestore
- B: SEO Phase 1
- C: 양쪽이 섞인 파일
- D: 문서만 변경된 파일
- E: 분류 불명확

각 파일에 대해 기록:

- 파일 경로
- 변경 목적
- 관련 기능
- 완성 여부
- 빌드 영향
- 배포 위험
- 독립 커밋 가능 여부
- 혼합 파일이면 hunk 단위 분리 가능 여부

### 6.3 기존 보고서 검증

`FITGIRLS_CHANGE_ISOLATION_REPORT.md`의 내용이 실제 `git diff`와 일치하는지 확인한다.

일치하지 않으면:

- 무엇이 다른지
- 저장소 상태가 언제 달라졌을 가능성이 있는지
- 추가 확인이 필요한 부분

을 명확히 보고한다.

---

## 7. 첫 번째 요청 결과물

아직 코드를 수정하지 말고 아래 문서를 작성 또는 업데이트한다.

`docs/FITGIRLS_GEMINI_HANDOFF_VALIDATION.md`

포함 내용:

1. 현재 브랜치
2. 현재 HEAD
3. 미커밋 변경 파일 목록
4. 기존 기능과 SEO 변경 분류
5. 혼합 파일 목록
6. 기존 분석 문서와 실제 코드의 일치 여부
7. 빌드 상태
8. 확인된 사실과 추정 구분
9. 분리 작업 전 위험요소
10. 다음 단계 제안
11. 롤백이 필요한 경우 가능한 방법
12. 아직 실행하지 않은 Git 및 배포 작업 목록

보고서를 제출한 후 승인을 기다린다.

---

## 8. 이후 승인될 수 있는 격리 전략

아직 실행하지 말고 제안만 한다.

### 안전 백업

예시:

- `backup/pre-isolation-fitgirls`

현재 미커밋 상태 전체를 보존하는 로컬 백업이 우선이다.

### 기능 브랜치

예시:

- `feature/retouch-checklist`
- `feature/seo-phase-1`

### 문서 커밋

분석 문서는 기능 코드와 별도 커밋으로 분리 가능 여부를 검토한다.

### 혼합 파일

`App.jsx`처럼 혼합된 파일은 파일 단위가 아니라 hunk 단위로 분리한다.

분리가 불확실하면 임의 처리하지 않고 중단 후 보고한다.

---

## 9. SEO 구현에서 주의할 점

### CSR과 초기 HTML

브라우저에서 JavaScript 실행 후 메타데이터가 보이는 것과, 최초 HTML에 검색용 정보가 포함되는 것은 다르다.

확인해야 할 것:

- 페이지 소스 또는 curl 최초 HTML
- JavaScript 렌더링 후 DOM
- title
- meta description
- canonical
- robots meta
- hreflang
- H1
- 핵심 본문

`App.jsx`에서만 동적으로 주입한다면 CSR 문제가 완전히 해결됐다고 단정하지 않는다.

### robots.txt와 noindex

- `robots.txt`의 `Disallow`는 보안 기능이 아니다.
- 민감 페이지는 인증·권한 제어 여부를 별도로 확인한다.
- 공개 페이지를 검색에서 제외하려면 `noindex` 방식의 적절성을 검토한다.
- 크롤링 차단과 `noindex`의 충돌 가능성을 분석한다.

### sitemap

다음 조건을 만족하는 URL만 포함한다.

- 실제 존재
- 200 응답
- 공개 페이지
- canonical URL
- 검색 노출 대상
- 고유한 본문 보유

placeholder, 비공개, noindex, 중복, soft 404 URL은 제외한다.

---

## 10. Gemini에게 보낼 첫 메시지

현재 프로젝트는 FITGIRLS 공식 웹사이트입니다.

먼저 이 파일을 처음부터 끝까지 읽으세요.

`FITGIRLS_GEMINI_HANDOFF.md`

그다음 저장소에 존재하는 아래 문서를 모두 확인하세요.

- `docs/FITGIRLS_ANTIGRAVITY_SEO_MASTER_BRIEF.md`
- `docs/FITGIRLS_SEO_AUDIT.md`
- `docs/FITGIRLS_SEO_IMPLEMENTATION_PLAN.md`
- `docs/FITGIRLS_CHANGE_ISOLATION_REPORT.md`

중요:

1. 아직 코드를 수정하지 마세요.
2. Git 상태를 바꾸지 마세요.
3. commit, push, deploy를 하지 마세요.
4. 기존 Retouch / Checklist / Admin / Firestore 작업을 삭제하거나 되돌리지 마세요.
5. 현재 저장소의 실제 상태와 기존 보고서가 일치하는지 먼저 검증하세요.
6. 카카오 예약과 LINE 예약은 현재 사이트에 없습니다.
7. 지원 언어는 `ko`, `en`, `ja`, `zh` 네 개입니다.
8. 중국어는 `/zh/`, `zh-Hans` 하나만 사용합니다.
9. 사실과 추정을 구분하세요.

먼저 아래 읽기 전용 검증을 수행하세요.

- 현재 브랜치
- 현재 HEAD
- `git status --short`
- `git diff --name-status`
- `git diff --stat`
- 변경 파일별 기능 분류
- 혼합 파일 분석
- 기존 보고서와 실제 코드 비교
- `npm run build`

결과를 다음 파일에 작성하세요.

`docs/FITGIRLS_GEMINI_HANDOFF_VALIDATION.md`

완료 후 코드 또는 Git 상태를 추가로 변경하지 말고, 요약과 다음 단계 제안만 제출한 뒤 승인을 기다리세요.

---

## 11. 전달할 파일 목록

최소 전달:

1. 이 문서
2. FITGIRLS 저장소 전체 또는 접근 가능한 로컬 프로젝트
3. 기존 `docs` 폴더
4. 현재 `git diff`가 유지된 작업 디렉터리

일반 Gemini 채팅에 전달하는 경우:

- 저장소를 ZIP으로 복사하기 전 `.env`, 서비스 계정 키, 인증 토큰, 고객 개인정보를 제거한다.
- `.git` 폴더를 포함할지는 목적에 따라 결정하되, 민감한 원격 URL이나 과거 비밀키가 없는지 확인한다.
- 가장 안전한 방식은 민감정보가 제거된 프로젝트 ZIP과 기존 Markdown 문서를 별도로 첨부하는 것이다.

Gemini CLI 또는 코드 에디터에서 전달하는 경우:

- 동일한 로컬 저장소 폴더를 열게 한다.
- 이 문서를 프로젝트 루트 또는 `docs`에 둔다.
- 첫 메시지에서 문서 경로를 정확히 지정한다.

---

## 12. 성공 조건

Gemini가 다음을 명확히 말할 수 있어야 한다.

- 현재 저장소에서 어떤 작업이 진행 중인가
- 어떤 파일이 Retouch/Checklist 기능인가
- 어떤 파일이 SEO 작업인가
- 어떤 파일이 혼합되어 있는가
- 기존 보고서와 코드가 일치하는가
- 현재 빌드는 성공하는가
- 어떤 작업도 아직 커밋·배포하지 않았는가
- 안전한 분리를 위해 다음에 무엇을 해야 하는가

그 전에는 코드 구현이나 배포 단계로 넘어가지 않는다.
