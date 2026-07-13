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
import DirectingPaper from './pages/DirectingPaper';
import SModel from './pages/SModel';
import Retouch from './pages/Retouch';
import Shop from './pages/Shop';
import { syncAll } from './utils/syncService';
import FloatingCoupon from './components/FloatingCoupon';
import Studios from './pages/Studios';
import SEO_METADATA from './seo_metadata.json';
import './index.css';

const Home = ({ changeLanguage, currentLang }) => {
  const { section, tab } = useParams();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = React.useState(false);
  const [isOnHero, setIsOnHero] = React.useState(true);
  const [isHideCS, setIsHideCS] = React.useState(true); // Hide on first two pages
  const [isHeaderHidden, setIsHeaderHidden] = React.useState(true); // Hide header on first two pages
  const [isLastSectionVisible, setIsLastSectionVisible] = React.useState(false);

  // Handle section scrolling based on URL
  React.useEffect(() => {
    if (section) {
      // Use a small timeout to ensure DOM is ready
      setTimeout(() => {
        const el = document.getElementById(section);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    } else if (location.pathname === '/') {
      const el = document.getElementById('hero');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, [section, location.pathname]);

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
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const vh = window.innerHeight;
        setIsScrolled(scrollTop > 50);
        setIsOnHero(scrollTop < vh * 0.5);
        setIsHideCS(scrollTop < vh * 2.5); // 첫 3개 섹션 높이 대역에서 CS버튼 숨김
        setIsHeaderHidden(scrollTop < vh * 1.5); // 첫 2개 섹션 대역에서 헤더 숨김
      }
    };

    window.addEventListener('scroll', handleWindowScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleWindowScroll);
  }, []);

  // Update URL based on current section using IntersectionObserver
  React.useEffect(() => {
    const container = document.querySelector('.snap-container');
    const sections = document.querySelectorAll('.snap-section');
    
    if (!container || sections.length === 0) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          if (id) {
            const newPath = (id === 'hero' || id === 'hero-intro') ? '/' : `/${id}`;
            
            // 특수 처리: 현재 경로가 /service/self 처럼 상세 경로인 경우, 스크롤로 인해 단순히 /service로 덮어씌워지지 않게 함
            const currentPath = window.location.pathname;
            if (newPath === '/') {
              if (currentPath !== '/') window.history.replaceState(null, '', '/');
            } else if (!currentPath.startsWith(newPath)) {
              window.history.replaceState(null, '', newPath);
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
    const scrollTop = e.target.scrollTop;
    const vh = window.innerHeight;
    setIsScrolled(scrollTop > 50);
    setIsOnHero(scrollTop < vh * 0.5);
    setIsHideCS(scrollTop < vh * 2.5); // Hide on first three sections (hero, intro, artist)
    setIsHeaderHidden(scrollTop < vh * 1.5); // Hide header on first two sections
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
    let lang = i18n.language || 'ko';
    
    // HTML lang 속성 동적 연동
    document.documentElement.lang = lang === 'zh' ? 'zh-Hans' : lang;

    // 경로별 고유 SEO 메타데이터 (seo_metadata.json 기반)
    const seoMeta = SEO_METADATA;

    // 언어별 기본값(fallback): 경로 매핑이 없을 때 사용
    const fallbackResources = {
      ko: {
        title: '핏걸즈 & 이너핏 | 여자 바디프로필 전문 프리미엄 화보 스튜디오',
        desc: '강남 신사동 바디프로필 전문 스튜디오 핏걸즈 & 이너핏. 압도적인 무드의 여자 바디프로필 전문 촬영.',
        keywords: '바디프로필, 여자바디프로필, 핏걸즈, 이너핏, 바디프로필스튜디오, 피토리얼리스트, 여자바디프로필의상'
      },
      en: {
        title: 'FITGIRLS & INAFIT | Premium Female Body Profile Studio Seoul',
        desc: 'Premium Female Body Profile Studio FITGIRLS. Custom styling, poses, and editorial artwork matching your unique physique and vibe.',
        keywords: 'Female Body Profile, Body Profile, FITGIRLS, Inafit, Body Profile Studio, Editorial Portrait'
      },
      ja: {
        title: 'FITGIRLS & INAFIT | 女性ボディプロフィール写真・プレミアムエディトリアルスタジオ',
        desc: '女性ボディプロフィール撮影専門スタジオ FITGIRLS。あなたのスタイルと雰囲기에 맞춘 풀커스텀 개별 플랜。',
        keywords: '女性ボディプロフィール, ボディプロフィール, プレミアムスタジオ, FITGIRLS, インナーフィット'
      },
      zh: {
        title: 'FITGIRLS & INAFIT | 首尔高端女性健身写真专业棚拍',
        desc: '首尔江南新沙洞顶级健身写真专业摄影棚。个性化姿势、服装与妆容规划，打造杂志级写真效果。',
        keywords: '韩国健身写真, 首尔棚拍, FITGIRLS, 个人写真, 江南摄影棚'
      }
    };

    // 현재 경로에서 가장 잘 맞는 메타데이터 키를 검색 (가장 구체적인 prefix 우선)
    let path = location.pathname;
    const firstPart = pathParts[0];
    if (supportedLangs.includes(firstPart)) {
      path = '/' + pathParts.slice(1).join('/');
    }

    const matchedKey = Object.keys(seoMeta)
      .filter(key => path === key || path.startsWith(key + '/') || (key !== '/' && path.startsWith(key)))
      .sort((a, b) => b.length - a.length)[0] || null;

    const pageMeta = matchedKey && seoMeta[matchedKey]?.[lang]
      ? seoMeta[matchedKey][lang]
      : (fallbackResources[lang] || fallbackResources.ko);

    // 1. 타이틀 업데이트
    document.title = pageMeta.title;

    // 2. 메타 디스크립션 태그 생성/업데이트
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.name = 'description';
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', pageMeta.desc);

    // 3. 메타 키워드 태그 생성/업데이트
    let metaKeywords = document.querySelector('meta[name="keywords"]');
    if (!metaKeywords) {
      metaKeywords = document.createElement('meta');
      metaKeywords.name = 'keywords';
      document.head.appendChild(metaKeywords);
    }
    metaKeywords.setAttribute('content', pageMeta.keywords || '');

    // 4. Canonical 태그 동적 갱신 (실제 접두사가 들어간 고유 canonical 주소 부여)
    const baseDomain = 'https://fitgirls.me';
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.rel = 'canonical';
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.href = `${baseDomain}${location.pathname === '/' ? '' : location.pathname}` || baseDomain;

    // 5. 비공개 경로에 noindex 메타 태그 주입 (크롤러 색인 차단)
    const privateRoutes = ['/admin', '/retouch', '/checklist', '/report', '/ambar', '/directing'];
    const isPrivate = privateRoutes.some(r => path.startsWith(r));
    let robotsMeta = document.querySelector('meta[name="robots"]');
    if (isPrivate) {
      if (!robotsMeta) {
        robotsMeta = document.createElement('meta');
        robotsMeta.name = 'robots';
        document.head.appendChild(robotsMeta);
      }
      robotsMeta.setAttribute('content', 'noindex, nofollow');
    } else {
      if (robotsMeta) robotsMeta.remove();
    }

    // 6. alternate 다국어 링크 태그 업데이트 (양방향 교차 참조 구현)
    document.querySelectorAll('link[rel="alternate"]').forEach(el => el.remove());

    if (!isPrivate) {
      let sectionPath = '';
      if (supportedLangs.includes(firstPart)) {
        sectionPath = pathParts.slice(1).join('/');
      } else {
        sectionPath = pathParts.join('/');
      }

      const koLink = document.createElement('link');
      koLink.rel = 'alternate';
      koLink.hreflang = 'ko';
      koLink.href = `${baseDomain}${sectionPath ? `/${sectionPath}` : '/'}`;
      document.head.appendChild(koLink);

      ['en', 'ja', 'zh'].forEach(l => {
        const link = document.createElement('link');
        link.rel = 'alternate';
        link.hreflang = l === 'zh' ? 'zh-Hans' : l;
        link.href = `${baseDomain}/${l}${sectionPath ? `/${sectionPath}` : ''}`;
        document.head.appendChild(link);
      });

      const defaultLink = document.createElement('link');
      defaultLink.rel = 'alternate';
      defaultLink.hreflang = 'x-default';
      defaultLink.href = `${baseDomain}${sectionPath ? `/${sectionPath}` : '/'}`;
      document.head.appendChild(defaultLink);
    }

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
                      location.pathname.startsWith('/report') ||
                      location.pathname.startsWith('/directing');

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
          <Route path="/directing" element={<DirectingPaper />} />
          <Route path="/smodel" element={<SModel />} />
          <Route path="/retouch" element={<Retouch changeLanguage={changeLanguage} currentLang={i18n.language} />} />
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
