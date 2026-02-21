import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import FadeInSection from '../FadeInSection';
import './FAQ.css';

const FAQ = () => {
    const { t } = useTranslation();
    const [openIndex, setOpenIndex] = useState(null);

    const title = t('faq.title');
    const subtitle = t('faq.subtitle');
    const faqs = t('faq.list', { returnObjects: true });

    const handleToggle = (idx) => {
        setOpenIndex(openIndex === idx ? null : idx);
    };

    // Helper to format text with line breaks and extract specific links into buttons
    const formatAnswer = (text) => {
        if (!text) return null;

        const lines = text.split('\n');
        let elements = [];
        let buttons = [];

        lines.forEach((line, i) => {
            let processedLine = line;

            if (line.includes('http')) {
                const urlMatch = line.match(/(https?:\/\/[^\s]+)/);
                if (urlMatch) {
                    const url = urlMatch[0];
                    if (url.includes('instagram.com') || url.includes('instagr.am')) {
                        buttons.push(
                            <a key={`ig-${i}`} href={url} target="_blank" rel="noopener noreferrer" className="faq-action-btn insta">
                                Instagram
                            </a>
                        );
                        processedLine = processedLine.replace(url, '').trim();
                    } else if (url.includes('kakao.com')) {
                        buttons.push(
                            <a key={`ka-${i}`} href={url} target="_blank" rel="noopener noreferrer" className="faq-action-btn kakao">
                                KakaoTalk
                            </a>
                        );
                    } else if (url.includes('line.me')) {
                        buttons.push(
                            <a key={`line-${i}`} href={url} target="_blank" rel="noopener noreferrer" className="faq-action-btn line">
                                LINE
                            </a>
                        );
                        processedLine = processedLine.replace(url, '').trim();
                    }
                }
            }

            if (processedLine) {
                if (processedLine.startsWith('•') || processedLine.startsWith('-')) {
                    elements.push(<div key={i} className="faq-bullet">{processedLine}</div>);
                } else if (processedLine.startsWith('[')) {
                    elements.push(<div key={i} className="faq-subhead">{processedLine}</div>);
                } else {
                    elements.push(<div key={i} className="faq-text">{processedLine}</div>);
                }
            }
        });

        return (
            <div className="faq-answer-content">
                <div className="faq-text-group">{elements}</div>
                {buttons.length > 0 && <div className="faq-btn-group">{buttons}</div>}
            </div>
        );
    };

    return (
        <div className="container-inner faq-container">
            <FadeInSection className="section-header">
                <h2 className="section-title">{title}</h2>
                <p className="section-subtitle">{subtitle}</p>
            </FadeInSection>

            <div className="faq-list">
                {Array.isArray(faqs) && faqs.map((item, idx) => (
                    <FadeInSection key={idx} delay={idx * 0.1}>
                        <div
                            className={`faq-item ${openIndex === idx ? 'open' : ''}`}
                            onClick={() => handleToggle(idx)}
                        >
                            <div className="faq-question">
                                <h3>{item.question}</h3>
                                <span className="faq-icon">{openIndex === idx ? '−' : '+'}</span>
                            </div>
                            <div className="faq-answer">
                                {formatAnswer(item.answer)}
                            </div>
                        </div>
                    </FadeInSection>
                ))}
            </div>
        </div>
    );
};

export default FAQ;
