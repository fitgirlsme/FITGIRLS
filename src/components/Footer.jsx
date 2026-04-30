import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SiKakaotalk, SiLine, SiWhatsapp, SiWechat, SiInstagram, SiYoutube } from 'react-icons/si';
import { MESSENGER_LINKS } from '../constants/links';

const Footer = ({ isHidden }) => {
    const { t } = useTranslation();
    const isAdmin = localStorage.getItem('isAdmin') === 'true';
    const [showWeChatQR, setShowWeChatQR] = useState(false);

    const handleLogout = () => {
        if (window.confirm("관리자 로그아웃 하시겠습니까?")) {
            localStorage.removeItem('isAdmin');
            window.location.reload();
        }
    };

    const handleWeChatClick = (e) => {
        e.preventDefault();
        setShowWeChatQR(true);
    };

    return (
        <footer className={`site-footer ${isHidden ? 'footer-hidden' : ''}`}>
            <div className="site-footer-inner">
                <div className="footer-social-links">
                    <a href={MESSENGER_LINKS.ko} target="_blank" rel="noopener noreferrer" className="footer-social-icon kakao" title="KakaoTalk">
                        <SiKakaotalk />
                    </a>
                    <a href={MESSENGER_LINKS.en} target="_blank" rel="noopener noreferrer" className="footer-social-icon whatsapp" title="WhatsApp">
                        <SiWhatsapp />
                    </a>
                    <a href={MESSENGER_LINKS.ja} target="_blank" rel="noopener noreferrer" className="footer-social-icon line" title="LINE">
                        <SiLine />
                    </a>
                    <a href="#wechat" onClick={handleWeChatClick} className="footer-social-icon wechat" title="WeChat">
                        <SiWechat />
                    </a>
                    <div className="footer-social-divider" />
                    <a href="http://instagram.com/fitgirls.me" target="_blank" rel="noopener noreferrer" className="footer-social-icon instagram" title="Instagram">
                        <SiInstagram />
                    </a>
                    <a href="https://www.youtube.com/@핏걸즈" target="_blank" rel="noopener noreferrer" className="footer-social-icon youtube" title="YouTube">
                        <SiYoutube />
                    </a>
                </div>

                <div className="footer-info-row">
                    <span className="site-footer-logo">FITGIRLS &amp; INAFIT</span>
                    <span className="site-footer-divider">|</span>
                    <span className="site-footer-copy">&copy; 2026 All Rights Reserved</span>
                    
                    {isAdmin && (
                        <>
                            <span className="site-footer-divider" style={{ opacity: 0.3 }}>|</span>
                            <button 
                                onClick={handleLogout}
                                className="footer-logout-btn"
                                title="관리자 로그아웃"
                            >
                                LOGOUT
                            </button>
                        </>
                    )}
                </div>
            </div>

            {showWeChatQR && (
                <div className="cs-modal-overlay" onClick={() => setShowWeChatQR(false)}>
                    <div className="cs-modal-content" onClick={(e) => e.stopPropagation()}>
                        <button className="cs-modal-close" onClick={() => setShowWeChatQR(false)}>&times;</button>
                        <img src="/images/wechat-qr.jpg" alt="WeChat QR Code" className="cs-qr-image" />
                        <p className="cs-qr-text">{t('cs.wechat_qr_desc')}</p>
                    </div>
                </div>
            )}
        </footer>
    );
};

export default Footer;
