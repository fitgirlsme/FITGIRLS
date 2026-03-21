import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import './Service.css';

const Service = () => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState('PORTRAIT');

    const list1 = t('services.list1', { returnObjects: true }) || [];
    const list2 = t('services.list2', { returnObjects: true }) || [];
    const notices = t('services.notices', { returnObjects: true }) || [];

    const items = activeTab === 'PORTRAIT' ? list1 : list2;
    const category = activeTab === 'PORTRAIT'
        ? t('services.menu1.category')
        : t('services.menu2.category');

    return (
        <div className="service-container">
            <div className="container-inner">
                <header className="service-main-header">
                    <span className="service-main-subtitle">{t('services.header_subtitle')}</span>
                    <h2 className="service-main-title">{t('services.header_title')}</h2>
                    <p className="service-main-desc">{t('services.header_desc')}</p>
                </header>

                <nav className="service-tabs">
                    <button
                        className={`service-tab-btn ${activeTab === 'PORTRAIT' ? 'active' : ''}`}
                        onClick={() => setActiveTab('PORTRAIT')}
                    >
                        {t('services.menu1.title')}
                    </button>
                    <button
                        className={`service-tab-btn ${activeTab === 'FRIENDS' ? 'active' : ''}`}
                        onClick={() => setActiveTab('FRIENDS')}
                    >
                        {t('services.menu2.title')}
                    </button>
                </nav>

                <div className="service-category">
                    <div className="service-cards">
                        {items.map((item, idx) => (
                            <div key={idx} className="service-card">
                                <div className="service-header">
                                    <div className="service-name-wrapper">
                                        <span className="category-label">{category}</span>
                                        <h3 className="service-name">{item.title}</h3>
                                    </div>
                                    {item.price && (
                                        <span className="service-price">{item.price}</span>
                                    )}
                                </div>
                                <ul className="service-details">
                                    {(item.details || []).map((detail, i) => (
                                        <li key={i}>{detail}</li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="service-notice">
                    <ul>
                        {notices.map((notice, idx) => (
                            <li key={idx}>{notice}</li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default Service;
