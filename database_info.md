# FITGIRLS 프로젝트 데이터베이스 및 환경 설정 정보

이 문서는 프로젝트의 로컬 개발 환경 및 배포 환경에서 사용되는 데이터베이스와 관련 설정 정보를 정리한 문서입니다.

## 1. 배포 환경 (Live Environment)
현재 서비스가 배포되어 운영 중인 환경의 데이터베이스 정보입니다.

### Firebase Firestore (Main Database)
*   **Project ID**: `fitgirls-me-web`
*   **Auth Domain**: `fitgirls-me-web.firebaseapp.com`
*   **Storage Bucket**: `fitgirls-me-web.firebasestorage.app`
*   **핵심 데이터 구조 (Collections)**:
    *   `events`: 공지사항 및 이벤트 데이터
    *   `reviews`: 사용자 리뷰 데이터
    *   `gallery`: 포트폴리오 및 갤러리 이미지 데이터
    *   `hero_slides`: 메인 히어로 슬라이드 이미지 데이터
    *   `lookbook`: 룩북 이미지 및 관련 데이터
    *   `faq`: 자주 묻는 질문 데이터
    *   `studios`: 협력 스튜디오 정보
    *   `programs`: 상품 및 프로그램 정보
    *   `home_sections`: 메인 페이지 섹션 구성 데이터

## 2. 로컬 개발 환경 (Local Development Environment)
로컬에서 `npm run dev`를 통해 실행되는 개발 환경의 데이터베이스 정보입니다.

### IndexedDB (Local Cache & Performance)
로컬 환경에서는 성능 최적화와 오프라인 지원을 위해 Firestore의 데이터를 브라우저의 IndexedDB에 복제(Sync)하여 사용합니다.

*   **DB 이름**: `FitgirlsLiveDB`
*   **버전**: 1
*   **주요 저장소 (Stores)**: Firestore의 컬렉션 구조와 1:1로 매칭되는 구조를 가지고 있습니다.
    *   `events`, `reviews`, `programs`, `studios`, `gallery`, `faq`, `hero_slides`, `home_sections`, `lookbook`

## 3. 환경 변수 (Environment Variables)
프로젝트 최상위의 `.env` 파일에 정의된 Firebase 접속 정보입니다.

*   `VITE_FIREBASE_API_KEY`: Firebase API 키
*   `VITE_FIREBASE_AUTH_DOMAIN`: 인증 도메인
*   `VITE_FIREBASE_PROJECT_ID`: 프로젝트 ID
*   `VITE_FIREBASE_STORAGE_BUCKET`: 스토리지 버킷 정보
*   `VITE_FIREBASE_MESSAGING_SENDER_ID`: 메시징 발송자 ID
*   `VITE_FIREBASE_APP_ID`: Firebase 앱 ID

## 4. 데이터 동기화 로직 (Sync Logic)
*   **위치**: `src/utils/syncService.js`
*   **작동 방식**: 앱이 실행될 때 `syncAll()` 함수가 호출되어 Firestore의 모든 데이터를 읽어와 로컬 IndexedDB를 최신 상태로 갱신합니다. 이를 통해 실제 로컬 렌더링은 IndexedDB의 데이터를 기반으로 빠르고 안정적으로 이루어집니다.
