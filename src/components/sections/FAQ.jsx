import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import FadeInSection from '../FadeInSection';
import './FAQ.css';

const FAQ = () => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState('before_reservation');
    const [openIndex, setOpenIndex] = useState(null);

    const title = t('faq.title');
    const subtitle = t('faq.subtitle');

    const tabs = [
        {
            id: 'before_reservation',
            label: t('faq.category_before_reservation'),
            list: t('faq.before_reservation', { returnObjects: true })
        },
        {
            id: 'before_shooting',
            label: t('faq.category_before_shooting'),
            list: t('faq.before_shooting', { returnObjects: true })
        },
        {
            id: 'after_shooting',
            label: t('faq.category_after_shooting'),
            list: t('faq.after_shooting', { returnObjects: true })
        }
    ];

    const handleTabChange = (tabId) => {
        setActiveTab(tabId);
        setOpenIndex(null); // 탭 전환 시 아코디언 닫기
    };

    const handleToggle = (idx) => {
        setOpenIndex(openIndex === idx ? null : idx);
    };

    // **bold** → <strong> 처리
    const renderBold = (text) => {
        const parts = text.split(/\*\*(.+?)\*\*/g);
        return parts.map((part, i) =>
            i % 2 === 1 ? <strong key={i}>{part}</strong> : part
        );
    };

    // 링크 포함 텍스트 처리 helper
    const formatAnswer = (text) => {
        if (!text) return null;
        return text.split('\n').map((line, i) => {
            if (!line) return <br key={i} />;

            // 드롭박스 등 링크 처리
            if (line.includes('http')) {
                const urlMatch = line.match(/(https?:\/\/[^\s]+)/);
                if (urlMatch) {
                    const url = urlMatch[0];
                    const before = line.slice(0, line.indexOf(url));
                    return (
                        <p key={i} className="faq-text">
                            {renderBold(before)}
                            <a href={url} target="_blank" rel="noopener noreferrer" className="faq-link">
                                {url}
                            </a>
                        </p>
                    );
                }
            }

            if (line.startsWith('📂')) {
                return <p key={i} className="faq-text faq-text-warn">{renderBold(line)}</p>;
            }
            if (line.startsWith('파일명') || line.startsWith('File') || line.startsWith('ファイル') || line.startsWith('文件')) {
                return <p key={i} className="faq-text faq-text-sub">{renderBold(line)}</p>;
            }
            return <p key={i} className="faq-text">{renderBold(line)}</p>;
        });
    };

    const activeList = tabs.find(t => t.id === activeTab)?.list || [];

    return (
        <div className="container-inner faq-container">
            <FadeInSection className="section-header">
                <h2 className="section-title">{title}</h2>
                <p className="section-subtitle">{subtitle}</p>
            </FadeInSection>

            {/* 상단 탭 */}
            <FadeInSection delay={0.1}>
                <div className="faq-tabs">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            className={`faq-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                            onClick={() => handleTabChange(tab.id)}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </FadeInSection>

            {/* 아코디언 Q&A 목록 */}
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
                                <h4><span className="faq-prefix q-prefix">Q.</span> {item.question}</h4>
                                <span className="faq-icon">{isOpen ? '−' : '+'}</span>
                            </div>
                            <div className="faq-answer">
                                <div className="faq-answer-content">
                                    <span className="faq-prefix a-prefix">A.</span>
                                    <div className="faq-answer-text-wrap">
                                        {formatAnswer(item.answer)}
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
