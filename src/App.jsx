import React from 'react';
import { Routes, Route, useLocation, useNavigate, useParams } from 'react-router-dom';
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
import { syncAll } from './utils/syncService';
import FloatingCoupon from './components/FloatingCoupon';
import './index.css';

const Home = ({ changeLanguage, currentLang }) => {
  const { section } = useParams();
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
    const lastEl = document.getElementById('ambassadors');
    if (!lastEl) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsLastSectionVisible(entry.isIntersecting),
      { threshold: 0.1 }
    );
    observer.observe(lastEl);
    return () => observer.disconnect();
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
            // Prevent pushing to history, just replace current URL to avoid breaking back button
            if (window.location.pathname !== newPath) {
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
        <Service />
        <section className="snap-section" id="zone"><Zone /></section>
        <section className="snap-section" id="hair-makeup"><HM /></section>
        <section className="snap-section" id="faq"><FAQ /></section>
        <section className="snap-section" id="event-board"><Notice /></section>
        <section className="snap-section" id="location"><Location /></section>
        <section className="snap-section" id="reservation"><ReservationForm /></section>
        <section className="snap-section" id="reviews"><Reviews /></section>
        <section className="snap-section" id="ambassadors"><AmbassadorList /></section>
      </main>
      <Footer isHidden={!isLastSectionVisible} />
      <SupportCS isHidden={isHideCS} />
    </div>
  );
};

function App() {
  const { i18n } = useTranslation();
  const location = useLocation();

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
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

  // Hide floating coupon on admin-related pages
  const isAdminPage = location.pathname.startsWith('/admin') || 
                      location.pathname.startsWith('/smodel') || 
                      location.pathname.startsWith('/retouch') ||
                      location.pathname.startsWith('/report') ||
                      location.pathname.startsWith('/directing');

  return (
    <div className="root-layout">
      <React.Suspense fallback={<div className="loading">Loading...</div>}>
        <Routes>
          <Route path="/" element={<Home changeLanguage={changeLanguage} currentLang={i18n.language} />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/report" element={<BrandReport />} />
          <Route path="/ambar" element={<Ambassador />} />
          <Route path="/ambassador" element={<Ambassador />} />
          <Route path="/magazine" element={<Magazine />} />
          <Route path="/fitorialist" element={<AmbassadorList />} />
          <Route path="/fitorialist/:modelName" element={<AmbassadorList />} />
          <Route path="/fitorialist/:modelName/:modelId" element={<AmbassadorList />} />
          <Route path="/partners" element={<Partners />} />
          <Route path="/directing" element={<DirectingPaper />} />
          <Route path="/smodel" element={<SModel />} />
          <Route path="/retouch" element={<Retouch changeLanguage={changeLanguage} currentLang={i18n.language} />} />
          <Route path="/:section" element={<Home changeLanguage={changeLanguage} currentLang={i18n.language} />} />
          <Route path="/:section/:modelName/:modelId" element={<Home changeLanguage={changeLanguage} currentLang={i18n.language} />} />
        </Routes>
        {!isAdminPage && <FloatingCoupon />}
      </React.Suspense>
    </div>
  );
}

export default App;
