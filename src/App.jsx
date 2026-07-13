import React from 'react';
import { Routes, Route, useLocation, useNavigate, useParams, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

// GA4 페이지뷰 추적 함수
const trackPageView = (path) => {
  if (window.gtag) {
    window.gtag('config', 'G-65N5ETKRN5', { page_path: path });
  }
};

import { trackVisit } from './utils/analyticsTracker';

import Header from './components/Header';
import Footer from './components/Footer';
import Hero from './components/Hero';
import Intro from './components/sections/Intro';
import Gallery from './components/sections/Gallery';
import Service from './components/sections/Service';
import Zone from './components/sections/Zone';
import HM from './components/HM';
import FAQ from './components/sections/FAQ';
import Notice from './components/sections/Notice';
import Location from './components/sections/Location';
import ReservationForm from './components/sections/ReservationForm';
import ArtistSection from './components/sections/ArtistSection';
import ModelRecruit from './components/sections/ModelRecruit';

import SupportCS from './components/SupportCS';
import Reviews from './pages/Reviews';
import BrandReport from './pages/BrandReport';
import Admin from './pages/Admin';
import Ambassador from './pages/Ambassador';
import Partners from './pages/Partners';
import Magazine from './pages/Magazine';
import AmbassadorList from './components/AmbassadorList';
import SModel from './pages/SModel';
import Retouch from './pages/Retouch';
import Challenges from './pages/Challenges';
import ChallengeDetail from './pages/ChallengeDetail';
import { syncAll } from './utils/syncService';
import FloatingCoupon from './components/FloatingCoupon';
import ReservationPage from './pages/ReservationPage';
import ChallengePromoPage from './pages/ChallengePromoPage';
import Checklist from './pages/Checklist';
import ChecklistView from './pages/ChecklistView';
import GlobalBooking from './pages/GlobalBooking';
import GlobalFloatingBanner from './components/GlobalFloatingBanner';
import Studios from './pages/Studios';
import SEO_METADATA from './seo_metadata.json';
import './index.css';

const Home = ({ changeLanguage, currentLang }) => {
  const { section, tab } = useParams();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = React.useState(false);
  const [isOnHero, setIsOnHero] = React.useState(true);
  const [isHeaderHidden, setIsHeaderHidden] = React.useState(true);
  const [isHideCS, setIsHideCS] = React.useState(true); // Hide on first two pages
  const [isLastSectionVisible, setIsLastSectionVisible] = React.useState(false);

  // 새로고침이나 URL 직접 입력으로 초기 스크롤이 발생할 때 IntersectionObserver가 오작동하여
  // URL을 다른 섹션으로 바꿔치기하는 현상을 막기 위한 플래그
  const isProgrammaticScroll = React.useRef(false);
  const isFirstMount = React.useRef(true);

  // 헤더 및 CS 버튼 상태를 화면 해상도(모바일/데스크톱)에 맞춰 동적으로 감지하고 업데이트하는 함수
  const updateHeaderStates = React.useCallback(() => {
    const vh = window.innerHeight;
    
    // 모바일/데스크톱 및 스냅 적용 상태에 상관없이 실제 스크롤 높이를 무결하게 검출
    const snapContainer = document.querySelector('.snap-container');
    const containerScrollTop = snapContainer ? snapContainer.scrollTop : 0;
    const windowScrollTop = window.scrollY || document.documentElement.scrollTop;
    const scrollTop = Math.max(containerScrollTop, windowScrollTop);

    const isMobile = window.innerWidth <= 768;

    setIsScrolled(scrollTop > 50);
    setIsOnHero(scrollTop < vh * 0.5);
    
    // 모바일에서는 내비게이션(햄버거 메뉴)을 원활히 쓸 수 있도록 헤더를 항상 노출하고,
    // 데스크톱에서는 기존 기획대로 1, 2페이지(Hero & Intro) 영역에서 헤더를 숨깁니다.
    if (isMobile) {
      setIsHeaderHidden(false);
      setIsHideCS(false); // 모바일에서는 CS버튼 상시 노출
    } else {
      setIsHeaderHidden(scrollTop < vh * 1.3);
      setIsHideCS(scrollTop < vh * 0.8); // 데스크톱에서는 첫 번째 화면(Hero) 영역에서만 CS버튼 숨김
    }
  }, []);

  // Handle section scrolling based on URL
  React.useEffect(() => {
    if (section) {
      isProgrammaticScroll.current = true;
      const wasFirstMount = isFirstMount.current;
      const delay = wasFirstMount ? 550 : 100;
      isFirstMount.current = false;

      setTimeout(() => {
        const targetSection = section === 'lookbook' ? 'zone' : section;
        const el = document.getElementById(targetSection);
        if (el) {
          el.scrollIntoView({ behavior: wasFirstMount ? 'auto' : 'smooth', block: 'start' });
        }
        
        // 스크롤이 부드럽게 이동하는 도중에도 모바일/데스크톱 모두 헤더 상태를 주기적으로 강제 동기화
        let count = 0;
        const interval = setInterval(() => {
          updateHeaderStates();
          count++;
          if (count > 15) clearInterval(interval);
        }, 100);

        setTimeout(() => {
          isProgrammaticScroll.current = false;
          // 헤더 상태 강제 업데이트
          updateHeaderStates();
        }, 1500);
      }, delay);
    } else if (location.pathname === '/') {
      const wasFirstMount = isFirstMount.current;
      isFirstMount.current = false;
      isProgrammaticScroll.current = true;
      const el = document.getElementById('hero');
      if (el) {
        el.scrollIntoView({ behavior: wasFirstMount ? 'auto' : 'smooth', block: 'start' });
      }
      
      let count = 0;
      const interval = setInterval(() => {
        updateHeaderStates();
        count++;
        if (count > 12) clearInterval(interval);
      }, 100);

      setTimeout(() => {
        isProgrammaticScroll.current = false;
        updateHeaderStates();
      }, 1000);
    } else {
      isFirstMount.current = false;
    }
  }, [section, location.pathname, updateHeaderStates]);

  React.useEffect(() => {
    const lastEl = document.getElementById('fitorialist');
    if (!lastEl) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsLastSectionVisible(entry.isIntersecting),
      { threshold: 0.1 }
    );
    observer.observe(lastEl);
    return () => observer.disconnect();
  }, []);

  // 모바일 환경(스냅 스크롤 해제 대역)에서 window 스크롤 이벤트를 감지하여 헤더 scrolled 상태 및 CS버튼 반응형 동기화
  React.useEffect(() => {
    const handleWindowScroll = () => {
      if (window.innerWidth <= 768) {
        updateHeaderStates();
      }
    };

    window.addEventListener('scroll', handleWindowScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleWindowScroll);
  }, [updateHeaderStates]);

  // Update URL based on current section using IntersectionObserver
  React.useEffect(() => {
    const container = document.querySelector('.snap-container');
    const sections = document.querySelectorAll('.snap-section');
    
    if (!container || sections.length === 0) return;

    const observer = new IntersectionObserver((entries) => {
      // 강제 자동 스크롤 중에는 스크롤 경로의 섹션들이 오버랩되면서 URL이 오염되는 것을 방지
      if (isProgrammaticScroll.current) return;

      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          if (id) {
            const newPath = (id === 'hero' || id === 'hero-intro') ? '/' : `/${id}`;
            
            // 특수 처리: 현재 경로가 /service/self 처럼 상세 경로인 경우, 스크롤로 인해 단순히 /service로 덮어씌워지지 않게 함
            const currentPath = window.location.pathname;
            if (newPath === '/') {
              if (currentPath !== '/') window.history.replaceState(null, '', '/');
            } else {
              // zone 섹션으로 스크롤되었을 때, 현재 URL이 /lookbook 이면 주소 유지를 위해 업데이트하지 않음
              if (newPath === '/zone' && currentPath === '/lookbook') {
                return;
              }
              if (!currentPath.startsWith(newPath)) {
                window.history.replaceState(null, '', newPath);
              }
            }
          }
        }
      });
    }, {
      root: container,
      threshold: 0.5 // Trigger when at least 50% of the section is visible
    });

    sections.forEach(section => observer.observe(section));

    return () => observer.disconnect();
  }, []);

  const handleScroll = (e) => {
    updateHeaderStates();
  };

  return (
    <div className="app-container">
      <Header
        isScrolled={isScrolled}
        isOnHero={isOnHero}
        isHidden={isHeaderHidden}
        changeLanguage={changeLanguage}
        currentLang={currentLang}
      />
      <main className="snap-container" onScroll={handleScroll}>
        <section className="snap-section" id="hero"><Hero /></section>
        <section className="snap-section" id="hero-intro"><Intro /></section>
        <section className="snap-section" id="artist"><ArtistSection /></section>
        <section className="snap-section" id="archive"><Gallery /></section>
        <section className="snap-section" id="service"><Service initialTab={tab} /></section>
        <section className="snap-section" id="zone"><Zone /></section>
        <section className="snap-section" id="hair-makeup"><HM /></section>
        <section className="snap-section" id="faq"><FAQ /></section>
        <section className="snap-section" id="event-board"><Notice /></section>
        <section className="snap-section" id="location"><Location /></section>
        <section className="snap-section" id="reservation"><ReservationForm /></section>
        <section className="snap-section" id="reviews"><Reviews /></section>
        <section className="snap-section" id="fitorialist"><AmbassadorList /></section>
      </main>
      <Footer isHidden={!isLastSectionVisible} />
      <SupportCS isHidden={isHideCS} />
      <GlobalFloatingBanner />
    </div>
  );
};

function App() {
  const { i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  const supportedLangs = ['en', 'ja', 'zh'];
  const pathParts = location.pathname.split('/').filter(Boolean);

  // 1. /studio 및 /price 중복 경로 정리: 유입 시 /studios /service로 301급 리다이렉트
  React.useEffect(() => {
    if (location.pathname === '/studio') {
      navigate('/studios', { replace: true });
    }
    if (location.pathname === '/price') {
      navigate('/service', { replace: true });
    }
    
    supportedLangs.forEach(lang => {
      if (location.pathname === `/${lang}/studio`) {
        navigate(`/${lang}/studios`, { replace: true });
      }
      if (location.pathname === `/${lang}/price`) {
        navigate(`/${lang}/service`, { replace: true });
      }
    });
  }, [location.pathname]);

  // 2. 다국어 URL 구조 구현: URL 감지 및 i18next 언어 동기화
  React.useEffect(() => {
    let targetLang = 'ko';
    if (pathParts.length > 0 && supportedLangs.includes(pathParts[0])) {
      targetLang = pathParts[0];
    }
    
    if (i18n.language !== targetLang) {
      i18n.changeLanguage(targetLang);
    }
  }, [location.pathname]);


  // 글로벌 다국어 SEO 셋팅 (한글, 영어, 일본어 이미지/텍스트 검색 상단 노출 작전)
  React.useEffect(() => {
    const lang = i18n.language || 'ko';
    
    // HTML lang 속성 동적 연동
    document.documentElement.lang = lang;

    // 언어별 메타 타이틀 및 디스크립션 리소스 정의
    const seoResources = {
      ko: {
        title: '핏걸즈 | 바디프로필 여자바디프로필 전문 프리미엄 화보 스튜디오',
        desc: '핏걸즈(FITGIRLS) 2026 프로젝트. 압도적인 무드의 여자 바디프로필, 피토리얼리스트 화보 전문 촬영. 고객별 맞춤 포즈, 무드, 스타일링 무료 기획.',
        keywords: '바디프로필, 여자바디프로필, 핏걸즈, 이너핏, 바디프로필스튜디오, 피토리얼리스트, 여자바디프로필의상'
      },
      en: {
        title: 'FITGIRLS | Female Body Profile & Editorial Editorialist Photo Studio',
        desc: 'Premium Female Body Profile Studio FITGIRLS. Custom styling, poses, and editorial artwork matching your unique physique and vibe.',
        keywords: 'Female Body Profile, Body Profile, FITGIRLS, Inafit, Body Profile Studio, Editorial Portrait'
      },
      ja: {
        title: 'FITGIRLS | 女性ボディプロフィール写真・プレミアムエディトリアルスタジオ',
        desc: '女性ボディプロフィール撮影専門スタジオ FITGIRLS。あなたのスタイルと雰囲기에 맞춘 포즈, 의상, 메이크업의 풀커스텀 개별 플랜.',
        keywords: '女性ボディプロフィール, ボディプロフィール, プレミアムスタジオ, FITGIRLS, インナーフィット'
      }
    };

    const currentSeo = seoResources[lang] || seoResources.ko;

    // 1. 타이틀 업데이트 (상담지 인쇄/뷰어 페이지 외에서만 작동)
    if (!location.pathname.includes('/checklist')) {
      document.title = currentSeo.title;
    }

    // 2. 메타 디스크립션 태그 생성/업데이트
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.name = 'description';
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', currentSeo.desc);

    // 3. 메타 키워드 태그 생성/업데이트
    let metaKeywords = document.querySelector('meta[name="keywords"]');
    if (!metaKeywords) {
      metaKeywords = document.createElement('meta');
      metaKeywords.name = 'keywords';
      document.head.appendChild(metaKeywords);
    }
    metaKeywords.setAttribute('content', currentSeo.keywords);

    // 4. alternate 다국어 링크 태그 업데이트 (구글 다국어 봇 매핑)
    const baseDomain = 'https://fitgirls.me';
    const langs = ['ko', 'en', 'ja'];
    
    // 기존 alternate 태그 제거
    document.querySelectorAll('link[rel="alternate"]').forEach(el => el.remove());

    // 신규 alternate 태그 삽입
    langs.forEach(l => {
      const link = document.createElement('link');
      link.rel = 'alternate';
      link.hreflang = l;
      link.href = `${baseDomain}${location.pathname}`;
      document.head.appendChild(link);
    });

  }, [i18n.language, location.pathname]);

  const changeLanguage = (lng) => {
    const sectionPath = supportedLangs.includes(pathParts[0])
      ? pathParts.slice(1).join('/')
      : pathParts.join('/');
      
    let newPath = '';
    if (lng === 'ko') {
      newPath = sectionPath ? `/${sectionPath}` : '/';
    } else {
      newPath = sectionPath ? `/${lng}/${sectionPath}` : `/${lng}`;
    }
    
    i18n.changeLanguage(lng);
    navigate(newPath);
  };

  // GA4: 페이지 이동 시마다 자동 추적
  React.useEffect(() => {
    trackPageView(location.pathname);
    trackVisit(location.pathname); // Firestore 방문 카운트
  }, [location.pathname]);

  // Fetch initial data (galleries, partners, notices)
  React.useEffect(() => {
    syncAll().catch(console.error);
  }, []);

  const isAdminPage = location.pathname.startsWith('/admin') || 
                      location.pathname.startsWith('/smodel') || 
                      location.pathname.startsWith('/retouch') ||
                      location.pathname.startsWith('/report');

  const validSections = ['gallery', 'service', 'location', 'faq', 'studios', 'reviews', 'magazine', 'partners', 'challenges', 'global-booking', 'reservation', 'challenge-promo'];

  return (
    <div className="root-layout">
      <React.Suspense fallback={<div className="loading">Loading...</div>}>
        <Routes>
          {/* 1. 한국어 기본(접두사 없음) 라우트 */}
          <Route path="/" element={<Home changeLanguage={changeLanguage} currentLang={i18n.language} />} />
          {validSections.map(sec => (
            <Route key={sec} path={`/${sec}`} element={<Home changeLanguage={changeLanguage} currentLang={i18n.language} />} />
          ))}
          {validSections.map(sec => (
            <Route key={sec} path={`/${sec}/:tab`} element={<Home changeLanguage={changeLanguage} currentLang={i18n.language} />} />
          ))}
          {validSections.map(sec => (
            <Route key={sec} path={`/${sec}/:modelName/:modelId`} element={<Home changeLanguage={changeLanguage} currentLang={i18n.language} />} />
          ))}

          {/* 2. 영어 라우트 */}
          <Route path="/en" element={<Home changeLanguage={changeLanguage} currentLang={i18n.language} />} />
          {validSections.map(sec => (
            <Route key={sec} path={`/en/${sec}`} element={<Home changeLanguage={changeLanguage} currentLang={i18n.language} />} />
          ))}
          {validSections.map(sec => (
            <Route key={sec} path={`/en/${sec}/:tab`} element={<Home changeLanguage={changeLanguage} currentLang={i18n.language} />} />
          ))}
          {validSections.map(sec => (
            <Route key={sec} path={`/en/${sec}/:modelName/:modelId`} element={<Home changeLanguage={changeLanguage} currentLang={i18n.language} />} />
          ))}

          {/* 3. 일본어 라우트 */}
          <Route path="/ja" element={<Home changeLanguage={changeLanguage} currentLang={i18n.language} />} />
          {validSections.map(sec => (
            <Route key={sec} path={`/ja/${sec}`} element={<Home changeLanguage={changeLanguage} currentLang={i18n.language} />} />
          ))}
          {validSections.map(sec => (
            <Route key={sec} path={`/ja/${sec}/:tab`} element={<Home changeLanguage={changeLanguage} currentLang={i18n.language} />} />
          ))}
          {validSections.map(sec => (
            <Route key={sec} path={`/ja/${sec}/:modelName/:modelId`} element={<Home changeLanguage={changeLanguage} currentLang={i18n.language} />} />
          ))}

          {/* 4. 중국어 라우트 */}
          <Route path="/zh" element={<Home changeLanguage={changeLanguage} currentLang={i18n.language} />} />
          {validSections.map(sec => (
            <Route key={sec} path={`/zh/${sec}`} element={<Home changeLanguage={changeLanguage} currentLang={i18n.language} />} />
          ))}
          {validSections.map(sec => (
            <Route key={sec} path={`/zh/${sec}/:tab`} element={<Home changeLanguage={changeLanguage} currentLang={i18n.language} />} />
          ))}
          {validSections.map(sec => (
            <Route key={sec} path={`/zh/${sec}/:modelName/:modelId`} element={<Home changeLanguage={changeLanguage} currentLang={i18n.language} />} />
          ))}

          {/* 5. 어드민 및 비공개 기능 라우트 (기존 기능 완벽 보존) */}
          <Route path="/admin" element={<Admin />} />
          <Route path="/report" element={<BrandReport />} />
          <Route path="/ambar" element={<Ambassador />} />
          <Route path="/ambassador" element={<Ambassador />} />
          <Route path="/fitorialist" element={<AmbassadorList />} />
          <Route path="/fitorialist/:modelName" element={<AmbassadorList />} />
          <Route path="/fitorialist/:modelName/:modelId" element={<AmbassadorList />} />
          <Route path="/partners" element={<Partners />} />
          <Route path="/smodel" element={<SModel />} />
          <Route path="/retouch" element={<Retouch changeLanguage={changeLanguage} currentLang={i18n.language} />} />
          <Route path="/challenges" element={<Challenges />} />
          <Route path="/challenge/:id" element={<ChallengeDetail />} />
          <Route path="/reservation" element={<ReservationPage changeLanguage={changeLanguage} currentLang={i18n.language} />} />
          <Route path="/challenge-promo" element={<ChallengePromoPage />} />
          <Route path="/checklist" element={<Checklist />} />
          <Route path="/checklist/view" element={<ChecklistView />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/studios" element={<Studios changeLanguage={changeLanguage} currentLang={i18n.language} />} />
          <Route path="/global-booking" element={<GlobalBooking />} />

          {/* /studio 진입 시 /studios로 redirect */}
          <Route path="/studio" element={<Navigate to="/studios" replace />} />
          <Route path="/en/studio" element={<Navigate to="/en/studios" replace />} />
          <Route path="/ja/studio" element={<Navigate to="/ja/studios" replace />} />
          <Route path="/zh/studio" element={<Navigate to="/zh/studios" replace />} />

          {/* /price 진입 시 /service로 redirect */}
          <Route path="/price" element={<Navigate to="/service" replace />} />
          <Route path="/en/price" element={<Navigate to="/en/service" replace />} />
          <Route path="/ja/price" element={<Navigate to="/ja/service" replace />} />
          <Route path="/zh/price" element={<Navigate to="/zh/service" replace />} />

          {/* 404 Catch-All */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        {!isAdminPage && <FloatingCoupon />}
      </React.Suspense>
    </div>
  );
}

// 404 Not Found 컴포넌트 추가 (noindex 주입 및 soft 404 대응)
function NotFound() {
  const { t } = useTranslation();
  React.useEffect(() => {
    document.title = 'Page Not Found | FITGIRLS';
    let robotsMeta = document.querySelector('meta[name="robots"]');
    if (!robotsMeta) {
      robotsMeta = document.createElement('meta');
      robotsMeta.name = 'robots';
      document.head.appendChild(robotsMeta);
    }
    robotsMeta.setAttribute('content', 'noindex, nofollow');
  }, []);

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      height: '100vh', background: '#0a0a0a', color: '#fff', textAlign: 'center', fontFamily: 'Inter, sans-serif'
    }}>
      <h1 style={{ fontSize: '4rem', margin: '0 0 10px', color: '#ff3b30' }}>404</h1>
      <h2 style={{ fontSize: '1.5rem', margin: '0 0 20px', fontWeight: '400' }}>{t('error.not_found', 'Page Not Found')}</h2>
      <p style={{ color: 'rgba(255,255,255,0.6)', margin: '0 0 30px', maxWidth: '400px', lineHeight: '1.6' }}>
        존재하지 않거나 삭제된 페이지입니다. 주소를 다시 확인해 주세요.
      </p>
      <a href="/" style={{
        padding: '12px 24px', background: '#fff', color: '#000', borderRadius: '30px',
        textDecoration: 'none', fontWeight: '600', fontSize: '0.95rem', transition: 'all 0.3s ease'
      }}>
        홈으로 돌아가기
      </a>
    </div>
  );
}

export default App;
