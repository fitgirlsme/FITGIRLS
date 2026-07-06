import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import { MdClose, MdFlightTakeoff } from 'react-icons/md';
import './GlobalFloatingBanner.css';

const GlobalFloatingBanner = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [isVisible, setIsVisible] = useState(false);
  const currentLang = i18n.language || 'ko';

  useEffect(() => {
    // 한국어 모드이거나, 이미 다국어 예약 페이지에 접속한 상태라면 배너를 숨깁니다.
    const isExcluded = currentLang === 'ko' || location.pathname === '/global-booking' || location.pathname.startsWith('/admin');
    const isDismissed = sessionStorage.getItem('global_banner_dismissed') === 'true';

    if (isExcluded || isDismissed) {
      setIsVisible(false);
      return;
    }

    // 1초 뒤 자연스럽게 슬라이드인 노출
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 1500);

    return () => clearTimeout(timer);
  }, [currentLang, location.pathname]);

  const handleClose = (e) => {
    e.stopPropagation();
    setIsVisible(false);
    sessionStorage.setItem('global_banner_dismissed', 'true');
  };

  const handleNavigate = () => {
    navigate('/global-booking');
  };

  if (!isVisible) return null;

  // 언어별 매핑 문구
  const bannerText = currentLang === 'ja'
    ? '✈️ 海外のお客様専用！LINE相談＆PayPalデポジット予約はこちら ➔'
    : '✈️ Foreign Guests Click Here! Easy LINE Inquiry & PayPal Guide ➔';

  return (
    <div className="global-floating-banner" onClick={handleNavigate}>
      <div className="banner-content">
        <MdFlightTakeoff className="banner-plane-icon" />
        <span className="banner-text-span">{bannerText}</span>
      </div>
      <button className="banner-close-btn" onClick={handleClose} aria-label="Close banner">
        <MdClose size={16} />
      </button>
    </div>
  );
};

export default GlobalFloatingBanner;
