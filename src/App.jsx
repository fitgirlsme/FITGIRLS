import React from 'react';
import { Routes, Route, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Header from './components/Header';
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
import AmbassadorList from './components/AmbassadorList';
import { syncAll } from './utils/syncService';
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
        const container = document.querySelector('.snap-container');
        if (el && container) {
          container.scrollTo({ top: el.offsetTop, behavior: 'smooth' });
        }
      }, 100);
    } else if (location.pathname === '/') {
      const container = document.querySelector('.snap-container');
      if (container) {
        container.scrollTo({ top: 0, behavior: 'smooth' });
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

  const handleScroll = (e) => {
    const scrollTop = e.target.scrollTop;
    const vh = window.innerHeight;
    setIsScrolled(scrollTop > 50);
    setIsOnHero(scrollTop < vh * 0.5);
    setIsHideCS(scrollTop < vh * 1.5); // Hide on first two sections (hero & intro)
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
        <section className="snap-section" id="gallery"><Gallery /></section>
        <section className="snap-section" id="service"><Service /></section>
        <section className="snap-section" id="zone"><Zone /></section>
        <section className="snap-section" id="hair-makeup"><HM /></section>
        <section className="snap-section" id="faq"><FAQ /></section>
        <section className="snap-section" id="event-board"><Notice /></section>
        <section className="snap-section" id="location"><Location /></section>
        <section className="snap-section" id="reservation"><ReservationForm /></section>
        <section className="snap-section" id="reviews"><Reviews /></section>
        <section className="snap-section" id="ambassadors"><AmbassadorList /></section>
      </main>
      <footer className={`site-footer ${!isLastSectionVisible ? 'footer-hidden' : ''}`}>
        <div className="site-footer-inner">
          <span className="site-footer-logo">FITGIRLS &amp; INAFIT</span>
          <span className="site-footer-divider">|</span>
          <span className="site-footer-copy">&copy; 2026 All Rights Reserved</span>
        </div>
      </footer>
      {!isHideCS && <SupportCS />}
    </div>
  );
};

function App() {
  const { i18n } = useTranslation();

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  React.useEffect(() => {
    syncAll().catch(console.error);
  }, []);

  return (
    <div className="root-layout">
      <React.Suspense fallback={<div className="loading">Loading...</div>}>
        <Routes>
          <Route path="/" element={<Home changeLanguage={changeLanguage} currentLang={i18n.language} />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/report" element={<BrandReport />} />
          <Route path="/ambar" element={<Ambassador />} />
          <Route path="/ambassador" element={<Ambassador />} />
          <Route path="/fitorialist" element={<AmbassadorList />} />
          <Route path="/fitorialist/:modelName" element={<AmbassadorList />} />
          <Route path="/partners" element={<Partners />} />
          <Route path="/:section" element={<Home changeLanguage={changeLanguage} currentLang={i18n.language} />} />
        </Routes>
      </React.Suspense>
    </div>
  );
}

export default App;
