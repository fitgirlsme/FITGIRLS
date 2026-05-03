import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SiKakaotalk, SiLine, SiWhatsapp, SiWechat } from 'react-icons/si';
import { MESSENGER_LINKS } from '../constants/links';
import './SupportCS.css';

const SupportCS = () => {
    const { t, i18n } = useTranslation();
    const [showWeChatQR, setShowWeChatQR] = useState(false);
    const language = i18n.language?.slice(0, 2) || 'ko';
    const isAdmin = localStorage.getItem('isAdmin') === 'true' || localStorage.getItem('admin_logged_in') === 'true';

    const getLink = () => {
        if (language === 'zh') return '#wechat';
        return MESSENGER_LINKS[language] || MESSENGER_LINKS.ko;
    };

    const getIcon = () => {
        switch (language) {
            case 'ko': return <img src="/images/kakao-ch-custom.png" alt="Kakao Channel" className="custom-cs-image" />;
            case 'ja': return <SiLine size={32} />;
            case 'en': return <SiWhatsapp size={32} />;
            case 'zh': return <SiWechat size={32} />;
            default: return <img src="/images/kakao-ch-custom.png" alt="Kakao Channel" className="custom-cs-image" />;
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
            <div className={`support-cs-container cs-theme-${language} ${isAdmin ? 'admin-offset' : ''}`}>
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
