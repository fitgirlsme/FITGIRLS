import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SiKakaotalk, SiLine, SiWhatsapp, SiWechat } from 'react-icons/si';
import './SupportCS.css';

const SupportCS = () => {
    const { t, i18n } = useTranslation();
    const [showWeChatQR, setShowWeChatQR] = useState(false);
    const language = i18n.language?.slice(0, 2) || 'ko';

    // Hide CS widget for administrators
    if (localStorage.getItem('isAdmin') === 'true') {
        return null;
    }

    const getLink = () => {
        switch (language) {
            case 'ko': return 'http://pf.kakao.com/_cpxbxnC';
            case 'ja': return 'https://line.me/ti/p/your_line_id'; // 확인 필요
            case 'en': return 'https://wa.me/821046961434';
            case 'zh': return '#wechat';
            default: return 'http://pf.kakao.com/_cpxbxnC';
        }
    };

    const getIcon = () => {
        switch (language) {
            case 'ko': return <img src="/images/kakao-ch-custom.png" alt="Kakao Channel" className="cs-icon custom-cs-image" />;
            case 'ja': return <SiLine className="cs-icon" />;
            case 'en': return <SiWhatsapp className="cs-icon" />;
            case 'zh': return <SiWechat className="cs-icon" />;
            default: return null;
        }
    };

    const handleCSClick = (e) => {
        if (language === 'zh') {
            e.preventDefault();
            setShowWeChatQR(true);
        }
    };

    return (
        <>
            <div className={`support-cs-container cs-theme-${language}`}>
                <a 
                    href={getLink()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`cs-button cs-button--${language}`}
                    onClick={handleCSClick}
                >
                    {getIcon()}
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
