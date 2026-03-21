import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import './Service.css';

const Service = () => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState(0);

    const headerDesc = t('services.header_desc');
    const samePrice = t('services.same_price', { defaultValue: '' });
    const returnDiscount = t('reservation.return_discount', { defaultValue: '' });
    const menu1 = t('services.menu1', { returnObjects: true }) || {};
    const list1 = t('services.list1', { returnObjects: true }) || [];
    const menu2 = t('services.menu2', { returnObjects: true }) || {};
    const list2 = t('services.list2', { returnObjects: true }) || [];
    const notices = t('services.notices', { returnObjects: true }) || [];

    const items = activeTab === 0 ? list1 : list2;

    return (
        <div className="container-inner service-container">
            <nav className="service-tabs">
                <button
                    className={`service-tab-btn ${activeTab === 0 ? 'active' : ''}`}
                    onClick={() => setActiveTab(0)}
                >
                    {menu1.title || 'PORTRAIT MENU'}
                </button>
                <button
                    className={`service-tab-btn ${activeTab === 1 ? 'active' : ''}`}
                    onClick={() => setActiveTab(1)}
                >
                    {menu2.title || 'FRIENDS & COUPLE'}
                </button>
            </nav>

            <div className="service-category">
                <div className="service-cards">
                    {Array.isArray(items) && items.map((item, idx) => (
                        <div key={idx} className="service-card full-details">
                            <div className="service-header">
                                <h4 className="service-name">{item.title}</h4>
                                <div className="service-price">{item.price}</div>
                            </div>
                            <ul className="service-details">
                                {Array.isArray(item.details) && item.details.map((detail, i) => (
                                    <li key={i}>{detail}</li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>

            <div className="service-notice">
                {returnDiscount && (
                    <p className="service-main-desc" style={{ marginBottom: '12px', fontWeight: 600, color: 'var(--color-primary)' }}>
                        {returnDiscount}
                    </p>
                )}
                <p className="service-main-desc" style={{ marginBottom: '12px' }}>
                    {headerDesc}
                </p>
                {samePrice && (
                    <p className="service-main-desc" style={{ marginBottom: '12px', fontWeight: 600, color: 'var(--color-text)' }}>
                        {samePrice}
                    </p>
                )}
                <ul>
                    {Array.isArray(notices) && notices.map((notice, idx) => (
                        <li key={idx}>{notice}</li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default Service;
