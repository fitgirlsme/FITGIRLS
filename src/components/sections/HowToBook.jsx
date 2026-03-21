import React from 'react';
import { useTranslation } from 'react-i18next';
import FadeInSection from '../FadeInSection';
import './HowToBook.css';

// 단계별 색상 및 아이콘 설정
const STEP_CONFIG = [
    { color: '#3DAA6C', bg: 'rgba(61,170,108,0.15)', icon: '📅' },
    { color: '#4A6FA5', bg: 'rgba(74,111,165,0.15)', icon: '💳' },
    { color: '#E50914', bg: 'rgba(229,9,20,0.12)', icon: '✅' },
];

const HowToBook = () => {
    const { t } = useTranslation();
    const title = t('how_to_book.title');
    const subtitle = t('how_to_book.subtitle');
    const steps = t('how_to_book.steps', { returnObjects: true });

    return (
        <div className="container-inner htb-container">
            <FadeInSection className="section-header">
                <h2 className="section-title">{title}</h2>
                <p className="section-subtitle">{subtitle}</p>
            </FadeInSection>

            <div className="htb-flow">
                {Array.isArray(steps) && steps.map((step, idx) => {
                    const cfg = STEP_CONFIG[idx] || STEP_CONFIG[0];
                    const descLines = step.desc.split('\n');
                    return (
                        <React.Fragment key={idx}>
                            <FadeInSection delay={idx * 0.15} className="htb-step-col">
                                {/* 원형 뱃지 */}
                                <div className="htb-badge-wrap">
                                    <div
                                        className="htb-badge"
                                        style={{ background: cfg.color, boxShadow: `0 8px 28px ${cfg.color}55` }}
                                    >
                                        <span className="htb-badge-step">{step.step}</span>
                                        <span className="htb-badge-icon">{cfg.icon}</span>
                                        <span className="htb-badge-title">{step.title}</span>
                                        {step.highlight.split('\n').map((line, li) => (
                                            <span key={li} className="htb-badge-highlight">{line}</span>
                                        ))}
                                    </div>
                                </div>
                                {/* 설명 */}
                                <div className="htb-desc" style={{ borderTopColor: cfg.color }}>
                                    {descLines.map((line, li) => {
                                        if (!line) return <br key={li} />;
                                        if (line.startsWith('[') && line.endsWith(']')) {
                                            return <p key={li} className="htb-desc-highlight" style={{ color: cfg.color }}>{line}</p>;
                                        }
                                        if (line.endsWith(':')) {
                                            return <p key={li} className="htb-desc-label">{line}</p>;
                                        }
                                        return <p key={li} className="htb-desc-text">{line}</p>;
                                    })}
                                </div>
                            </FadeInSection>

                            {/* 화살표 (마지막 스텝 제외) */}
                            {idx < steps.length - 1 && (
                                <div className="htb-arrow">→</div>
                            )}
                        </React.Fragment>
                    );
                })}
            </div>
        </div>
    );
};

export default HowToBook;
