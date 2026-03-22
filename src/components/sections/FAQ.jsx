import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import FadeInSection from '../FadeInSection';
import './FAQ.css';

const FAQ = () => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState(0);
    const [openIndex, setOpenIndex] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [aiResponse, setAiResponse] = useState(null);
    const [isThinking, setIsThinking] = useState(false);
    const [displayedAnswer, setDisplayedAnswer] = useState('');

    const title = t('faq.title');
    const subtitle = t('faq.subtitle');
    const tabLabels = t('faq.tabs', { returnObjects: true });
    const categories = ['before_booking', 'before_shoot', 'after_shoot'];

    const tabs = useMemo(() => categories.map((id, idx) => ({
        id,
        label: Array.isArray(tabLabels) ? tabLabels[idx] : id,
        list: t(`faq.${id}`, { returnObjects: true })
    })), [categories, tabLabels, t]);

    // All FAQ items flattened for search
    const allItems = useMemo(() => {
        return tabs.reduce((acc, tab) => {
            if (Array.isArray(tab.list)) {
                return [...acc, ...tab.list.map(item => ({ ...item, category: tab.label }))];
            }
            return acc;
        }, []);
    }, [tabs]);

    // Simple Scoring Search Logic
    const handleSearch = (e) => {
        const query = e.target.value;
        setSearchQuery(query);

        if (!query.trim() || query.length < 2) {
            setAiResponse(null);
            return;
        }

        setIsThinking(true);
        
        // Simulate AI "thinking"
        setTimeout(() => {
            const searchTerms = query.toLowerCase().split(' ').filter(q => q.length > 0);
            
            let bestMatch = null;
            let maxScore = 0;

            allItems.forEach(item => {
                let score = 0;
                const question = item.question.toLowerCase();
                const answer = item.answer.toLowerCase();

                searchTerms.forEach(term => {
                    if (question.includes(term)) score += 10;
                    if (answer.includes(term)) score += 2;
                });

                if (score > maxScore) {
                    maxScore = score;
                    bestMatch = item;
                }
            });

            if (maxScore > 5) {
                setAiResponse(bestMatch);
            } else {
                setAiResponse({ no_results: true });
            }
            setIsThinking(false);
            setDisplayedAnswer('');
        }, 600);
    };

    // Typewriter effect
    useEffect(() => {
        if (aiResponse && !aiResponse.no_results && aiResponse.answer) {
            let index = 0;
            const timer = setInterval(() => {
                setDisplayedAnswer(aiResponse.answer.slice(0, index));
                index++;
                if (index > aiResponse.answer.length) clearInterval(timer);
            }, 15);
            return () => clearInterval(timer);
        }
    }, [aiResponse]);

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

            {/* AI Search Bar */}
            <FadeInSection delay={0.1}>
                <div className="faq-search-wrapper">
                    <div className="faq-search-bar">
                        <span className="search-icon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="11" cy="11" r="8"></circle>
                                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                            </svg>
                        </span>
                        <input
                            type="text"
                            placeholder={t('faq.search_placeholder', '원하시는 질문을 해주세요.')}
                            value={searchQuery}
                            onChange={handleSearch}
                            className="faq-search-input"
                        />
                        {searchQuery && (
                            <button className="search-clear" onClick={() => { setSearchQuery(''); setAiResponse(null); }}>
                                ✕
                            </button>
                        )}
                    </div>
                </div>
            </FadeInSection>

            {/* Smart AI Response Card */}
            {aiResponse && (
                <FadeInSection className="ai-response-container">
                    <div className="ai-response-card">
                        <div className="ai-card-header">
                            <div className="ai-badge">
                                <span className="ai-spark">✨</span>
                                {t('faq.ai_badge', 'AI SMART ANSWER')}
                            </div>
                            {!aiResponse.no_results && (
                                <span className="ai-category-tag">{aiResponse.category}</span>
                            )}
                        </div>
                        
                        <div className="ai-card-body">
                            {isThinking ? (
                                <div className="ai-thinking">
                                    <span className="dot"></span><span className="dot"></span><span className="dot"></span>
                                    <p>{t('faq.ai_thinking', 'AI가 답변을 분석 중입니다...')}</p>
                                </div>
                            ) : aiResponse.no_results ? (
                                <p className="ai-no-results">{t('faq.no_results', '관련된 답변을 찾지 못했습니다.')}</p>
                            ) : (
                                <>
                                    <h3 className="ai-matched-q">Q. {aiResponse.question}</h3>
                                    <div className="ai-matched-a">
                                        {formatAnswer(displayedAnswer)}
                                        {displayedAnswer.length >= aiResponse.answer.length && aiResponse.links && (
                                            <div className="faq-btn-group ai-btn-group">
                                                {aiResponse.links.map((link, li) => renderLinkBtn(link, li))}
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </FadeInSection>
            )}

            <FadeInSection delay={0.15}>
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
