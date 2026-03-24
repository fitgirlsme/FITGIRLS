import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Header from '../components/Header';
import SupportCS from '../components/SupportCS';
import './BrandReport.css';

const BrandReport = () => {
  const { i18n } = useTranslation();
  const [isScrolled, setIsScrolled] = useState(false);

  const handleScroll = (e) => {
    setIsScrolled(e.target.scrollTop > 50);
  };

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div className="brand-report-container app-container" onScroll={handleScroll}>
      <Header 
        isScrolled={isScrolled} 
        isOnHero={false} 
        changeLanguage={changeLanguage} 
        currentLang={i18n.language} 
      />
      <div className="brand-report-page">
        <div className="brand-report-content">
          <h1 className="brand-report-title">BRAND REPORT</h1>
          <p className="brand-report-subtitle">FITGIRLS & INAFIT</p>
          <div className="brand-report-placeholder">
            <p>브랜드 리포트 페이지 준비 중입니다.</p>
            <p>Brand report page coming soon.</p>
          </div>
          <div style={{ marginTop: '60px', display: 'flex', justifyContent: 'center' }}>
              <a href="/" className="back-to-main-btn">
                  <svg className="back-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                      <polyline points="9 22 9 12 15 12 15 22" />
                  </svg>
                  <span>HOME</span>
              </a>
          </div>
        </div>
      </div>
      <SupportCS />
    </div>
  );
};

export default BrandReport;
