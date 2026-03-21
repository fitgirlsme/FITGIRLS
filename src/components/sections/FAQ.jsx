import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import FadeInSection from '../FadeInSection';
import './FAQ.css';

const FAQ = () => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState(0);
    const [openIndex, setOpenIndex] = useState(null);

    const title = t('faq.title');
    const subtitle = t('faq.subtitle');
    const tabLabels = t('faq.tabs', { returnObjects: true });

    const categories = ['before_booking', 'before_shoot', 'after_shoot'];

    const tabs = categories.map((id, idx) => ({
        id,
        label: Array.isArray(tabLabels) ? tabLabels[idx] : id,
        list: t(`faq.${id}`, { returnObjects: true })
    }));

    const handleTabChange = (idx) => {
        setActiveTab(idx);
        setOpenIndex(null);
    };

    const handleToggle = (idx) => {
        setOpenIndex(openIndex === idx ? null : idx);
    };

    const formatAnswer = (text) => {
        if (!text) return null;
        return text.split('\n').map((line, i) => {
            if (!line) return <br key={i} />;
            return <p key={i} className="faq-text">{line}</p>;
        });
    };

    const renderLinkBtn = (link, idx) => {
        const typeClass = link.type || 'link';
        return (
            <a
                key={idx}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`faq-action-btn ${typeClass}`}
            >
                {link.label}
            </a>
        );
    };

    const activeList = tabs[activeTab]?.list || [];

    return (
        <div className="container-inner faq-container">
            <FadeInSection className="section-header">
                <h2 className="section-title">{title}</h2>
                <p className="section-subtitle">{subtitle}</p>
            </FadeInSection>

            <FadeInSection delay={0.1}>
                <div className="faq-tabs">
                    {tabs.map((tab, idx) => (
                        <button
                            key={tab.id}
                            className={`faq-tab-btn ${activeTab === idx ? 'active' : ''}`}
                            onClick={() => handleTabChange(idx)}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </FadeInSection>

            <div className="faq-list">
                {Array.isArray(activeList) && activeList.map((item, idx) => {
                    const isOpen = openIndex === idx;
                    return (
                        <div
                            key={`${activeTab}-${idx}`}
                            className={`faq-item ${isOpen ? 'open' : ''}`}
                            onClick={() => handleToggle(idx)}
                        >
                            <div className="faq-question">
                                <h4><span className="faq-q-mark">Q</span> {item.question}</h4>
                                <span className="faq-icon">{isOpen ? '−' : '+'}</span>
                            </div>
                            <div className="faq-answer">
                                <div className="faq-answer-content">
                                    <div className="faq-answer-text-wrap">
                                        {formatAnswer(item.answer)}
                                        {item.links && item.links.length > 0 && (
                                            <div className="faq-btn-group">
                                                {item.links.map((link, li) => renderLinkBtn(link, li))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default FAQ;
