import React from 'react';
import { useTranslation } from 'react-i18next';
import './SupportCS.css';

const SupportCS = () => {
    const { t, i18n: { language } } = useTranslation();

    const getLink = () => {
        switch (language) {
            case 'ja': return 'https://line.me/R/ti/p/@575kojji';
            case 'ko':
            default: return 'http://pf.kakao.com/_cpxbxnC';
        }
    };

    const getIcon = () => {
        if (language === 'ko') return <img src="/images/kakao-channel.png" alt="카카오채널" className="cs-icon-img" />;
        if (language === 'ja') return <img src="/images/line-icon.jpg" alt="LINE" className="cs-icon-img" />;
        return <span className="cs-icon">CS</span>;
    };

    if (language === 'en' || language === 'zh') return null;

    return (
        <div className="cs-container">
            <a
                href={getLink()}
                target="_blank"
                rel="noopener noreferrer"
                className={`cs-button cs-button--${language}`}
            >
                {getIcon()}
                <span className="cs-label">{t('cs.link_text')}</span>
            </a>
        </div>
    );
};

export default SupportCS;
