import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import './SupportCS.css';

const SupportCS = () => {
    const { t, i18n: { language } } = useTranslation();
    const [showWeChatQR, setShowWeChatQR] = useState(false);

    const getLink = () => {
        switch (language) {
            case 'en': return 'https://wa.me/message/KHRISURJCH5GC1';
            case 'ja': return 'https://line.me/R/ti/p/@575kojji';
            case 'zh': return "#wechat";
            case 'ko':
            default: return 'http://pf.kakao.com/_cpxbxnC';
        }
    };

    const getIcon = () => {
        if (language === 'ko') return <img src="/images/kakao-channel.png" alt="카카오채널" className="cs-icon-img" />;
        if (language === 'ja') return <img src="/images/line-icon.jpg" alt="LINE" className="cs-icon-img" />;
        if (language === 'en') return (
            <svg viewBox="0 0 448 512" width="24" height="24" fill="#25D366" className="cs-icon-svg">
                <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.7 19.3 70.1 29.5 108.1 29.5 122.4 0 222-99.6 222-222 0-59.3-23.1-115.1-65.1-157.1zM223.9 446.7c-33.1 0-65.7-8.9-94.1-25.7l-6.7-4-69.8 18.3 18.7-68.1-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.5-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 54.1 81.2 54.1 130.5 0 101.7-82.8 184.5-184.5 184.5zm102.2-140.3c-5.6-2.8-33.1-16.3-38.3-18.2-5.2-1.9-9-2.8-12.7 2.8-3.8 5.6-14.6 18.2-17.9 22-3.3 3.8-6.6 4.3-12.2 1.5-5.6-2.8-23.8-8.8-45.3-28-16.7-14.9-28-33.3-31.3-38.9-3.3-5.6-.4-8.6 2.5-11.4 2.5-2.5 5.6-6.6 8.5-9.8 2.8-3.3 3.8-5.6 5.6-9.4 1.9-3.8.9-7.1-.5-9.9-1.4-2.8-12.7-30.6-17.4-41.9-4.6-11.2-9.2-9.7-12.7-9.9-3.3-.2-7.1-.2-10.8-.2-3.8 0-9.9 1.4-15 7.1-5.2 5.6-19.7 19.2-19.7 47 0 27.8 20.2 54.6 23.1 58.4 2.8 3.8 39.8 60.8 96.3 85.1 13.4 5.8 23.9 9.2 32.1 11.9 13.5 4.3 25.8 3.7 35.6 2.2 10.9-1.6 33.1-13.5 37.7-26.6 4.7-13.1 4.7-24.3 3.3-26.6-1.4-2.2-5.2-3.6-10.8-6.4z"/>
            </svg>
        );
        if (language === 'zh') return (
            <svg viewBox="0 0 576 512" width="24" height="24" fill="#09B83E" className="cs-icon-svg">
                <path d="M385.2 167.6c6.4 0 12.6 .3 18.8 1.1C387.4 90.3 303.3 32 201.6 32c-111.2 0-201.6 70.1-201.6 156.5 0 48.2 28.7 91.2 73.7 121.3l-18.8 56.2 67.9-34c15 3.5 30.6 5.4 46.6 5.4 6.4 0 12.6-.3 18.8-1.1-7.7-22.1-12-45.9-12-70.7 0-55.9 44.8-101.2 100-101.2zm-123.6-67.9c10.7 0 19.3 8.6 19.3 19.2 0 10.7-8.6 19.2-19.3 19.2-10.7 0-19.3-8.6-19.3-19.2 0-10.6 8.6-19.2 19.3-19.2zm-128.8 0c10.7 0 19.3 8.6 19.3 19.2 0 10.7-8.6 19.2-19.3 19.2-10.7 0-19.4-8.6-19.4-19.2 0-10.6 8.7-19.2 19.4-19.2zm439.5 102.4c-92.7 0-167.9 61.3-167.9 137s75.2 137 167.9 137c13.3 0 26.2-1.3 38.6-3.8l50.2 25.1-13.9-46.1c33-24.1 53-57.8 53-95.2 0-75.7-75.2-137-167.9-137zM451.9 288c-7.1 0-12.9-5.8-12.9-12.8 0-7.1 5.8-12.9 12.9-12.9 7.1 0 12.9 5.8 12.9 12.9 0 7-5.8 12.8-12.9 12.8zm-82.3 0c-7.1 0-12.9-5.8-12.9-12.8 0-7.1 5.8-12.9 12.9-12.9 7.1 0 12.9 5.8 12.9 12.9 0 7.1-5.8 12.8-12.9 12.8z"/>
            </svg>
        );
        return <span className="cs-icon">CS</span>;
    };

    const handleCSClick = (e) => {
        if (language === 'zh') {
            e.preventDefault();
            setShowWeChatQR(true);
        }
    };

    return (
        <>
            <div className="cs-container">
                <a
                    href={getLink()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`cs-button cs-button--${language}`}
                    onClick={handleCSClick}
                >
                    {getIcon()}
                    <span className="cs-label">{t('cs.link_text')}</span>
                </a>
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
        </>
    );
};

export default SupportCS;

