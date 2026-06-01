import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { addItem, STORES } from '../../utils/db';
import { db } from '../../utils/firebase';
import { collection, addDoc, serverTimestamp, getDocs, query } from 'firebase/firestore';
import './ModelRecruit.css';

const ModelRecruit = () => {
    const { t } = useTranslation();
    const [form, setForm] = useState({ name: '', insta: '', location: '', job: '', phone: '', keywords: '' });
    const [status, setStatus] = useState(null); // 'success' | 'error'
    const [submitting, setSubmitting] = useState(false);
    const [applicantCount, setApplicantCount] = useState(null);
    const isAdmin = localStorage.getItem('admin_logged_in') === 'true';

    React.useEffect(() => {
        if (isAdmin) {
            getDocs(query(collection(db, 'applications')))
                .then(snap => setApplicantCount(snap.size))
                .catch(console.error);
        }
    }, [isAdmin]);

    const handleChange = (e) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setStatus(null);
        try {
            // Fetch current batch from settings
            let currentBatch = '1st';
            try {
                const settingsSnap = await getDocs(query(collection(db, 'settings')));
                const recruitmentDoc = settingsSnap.docs.find(d => d.id === 'recruitment');
                if (recruitmentDoc) {
                    currentBatch = recruitmentDoc.data().currentBatch || '1st';
                }
            } catch (err) {
                console.error('Batch fetch error:', err);
            }

            // Save to Firebase (for Admin panel)
            await addDoc(collection(db, 'applications'), {
                ...form,
                batch: currentBatch,
                createdAt: serverTimestamp()
            });
            // Also save to IndexedDB (local cache)
            await addItem(STORES.APPLICATIONS, {
                ...form,
                batch: currentBatch,
                createdAt: new Date().toISOString()
            });
            setStatus('success');
            setForm({ name: '', insta: '', location: '', job: '', phone: '', keywords: '' });
        } catch {
            setStatus('error');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <section className="model-apply-section">
            <div className="model-apply-container">
                <div className="model-apply-header">
                    <h2>{t('modelApply.title', '2026 FITORIAL 엠버서더 지원')}</h2>
                    <p className="model-apply-intro">{t('modelApply.ambassadorDetail.intro', '')}</p>
                </div>

                <div className="model-recruit-curation">
                    <div className="curation-header">
                        <p className="curation-subtitle">GLOBAL BRAND CASTING</p>
                        <h3 className="curation-main-title editorial">
                            MORE THAN<br/>
                            <span>A MODEL</span>
                        </h3>
                        <p className="editorial-desc">FITORIALIST+는 단순한 모델이 아닙니다. 자신의 삶을 스스로 연출하는 아티스트입니다.</p>
                    </div>

                    <div className="social-proof-block closed">
                        <div className="proof-status-badge">1기 지원 마감</div>
                        <span className="proof-label">1st BATCH APPLICATIONS</span>
                        <span className="proof-value">380</span>
                        <p className="proof-footer">뜨거운 성원으로 1기 모집이 조기 마감되었습니다.</p>
                    </div>

                    <div className="curation-grid">
                        <div className="curation-section magazine-style">
                            <h4 className="curation-sec-title">AMBASSADOR PASS</h4>
                            <ul className="curation-list editorial-style">
                                <li>
                                    <strong className="editorial-label">SESSION</strong>
                                    <span className="editorial-main">3개월마다 정기 FITORIAL 촬영 진행</span>
                                </li>
                                <li>
                                    <strong className="editorial-label">FEATURE</strong>
                                    <span className="editorial-main">공식 매거진 및 SNS 채널 에디토리얼 피처드</span>
                                </li>
                                <li>
                                    <strong className="editorial-label">CAMPAIGN</strong>
                                    <span className="editorial-main">브랜드 캠페인 및 글로벌 프로젝트 우선 참여</span>
                                </li>
                            </ul>
                        </div>

                        <div className="curation-section magazine-style">
                            <h4 className="curation-sec-title">OUR VALUES</h4>
                            <ul className="curation-list editorial-style">
                                <li>
                                    <strong className="editorial-label">ATTITUDE</strong>
                                    <span className="editorial-main">팔로워 수보다 중요한 본질적인 태도</span>
                                </li>
                                <li>
                                    <strong className="editorial-label">EXPRESSION</strong>
                                    <span className="editorial-main">완벽한 몸보다 매력적인 자기 표현력</span>
                                </li>
                                <li>
                                    <strong className="editorial-label">ENERGY</strong>
                                    <span className="editorial-main">누구보다 빛나는 꾸준함과 존재감</span>
                                </li>
                                <li>
                                    <strong className="editorial-label">MOOD</strong>
                                    <span className="editorial-main">유행을 따르지 않는 자신만의 독보적 무드</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="model-apply-quote">
                    <p className="quote-main">"Age is just a number, Nationality is just a background.<br/>Your 'Fit' is everything."</p>
                    {t('modelApply.quoteSub', '') && (
                        <p className="quote-sub">{t('modelApply.quoteSub', "나이는 숫자일 뿐, 국적은 배경일 뿐입니다. 당신의 '핏'이 전부입니다.")}</p>
                    )}
                </div>

                <form className="model-apply-form" onSubmit={handleSubmit}>
                    <div className="apply-form-grid">
                        <div className="apply-form-group">
                            <label>{t('modelApply.name', '이름')}</label>
                            <input
                                type="text"
                                name="name"
                                value={form.name}
                                onChange={handleChange}
                                required
                                placeholder={t('modelApply.namePlaceholder', '이름을 입력해주세요')}
                            />
                        </div>
                        <div className="apply-form-group">
                            <label>{t('modelApply.insta', '인스타그램 ID')}</label>
                            <input
                                type="text"
                                name="insta"
                                value={form.insta}
                                onChange={handleChange}
                                placeholder={t('modelApply.instaPlaceholder', '@아이디')}
                            />
                        </div>
                        <div className="apply-form-group">
                            <label>{t('modelApply.location', '지역')}</label>
                            <input
                                type="text"
                                name="location"
                                value={form.location}
                                onChange={handleChange}
                                placeholder={t('modelApply.locationPlaceholder', '거주 지역')}
                            />
                        </div>
                        <div className="apply-form-group">
                            <label>{t('modelApply.job', '직업')}</label>
                            <input
                                type="text"
                                name="job"
                                value={form.job}
                                onChange={handleChange}
                                placeholder={t('modelApply.jobPlaceholder', '예: 학생, 프리랜서 등')}
                            />
                        </div>
                        <div className="apply-form-group">
                            <label>{t('modelApply.phone', '연락처')}</label>
                            <input
                                type="tel"
                                name="phone"
                                value={form.phone}
                                onChange={handleChange}
                                required
                                placeholder={t('modelApply.phonePlaceholder', '010-0000-0000')}
                            />
                        </div>
                        <div className="apply-form-group full-width">
                            <label>{t('modelApply.keywords', '나를 표현하는 스타일 키워드 3가지')}</label>
                            <input
                                type="text"
                                name="keywords"
                                value={form.keywords}
                                onChange={handleChange}
                                required
                                placeholder={t('modelApply.keywordsPlaceholder', '(예: #에디토리얼 #Y2K #에너지)')}
                            />
                        </div>
                    </div>
                    <button
                        type="submit"
                        className="apply-submit-btn"
                        disabled={submitting}
                    >
                        {submitting 
                            ? t('modelApply.submitting', 'SUBMITTING...') 
                            : t('modelApply.submit', 'JOIN FITORIALIST+') 
                        }
                    </button>
                    <p className="apply-final-cta">당신의 FITORIAL을 시작하세요.</p>
                    {status === 'success' && (
                        <div className="apply-status success">
                            {t('modelApply.successMsg', '지원이 완료되었습니다. 감사합니다!')}
                        </div>
                    )}
                    {status === 'error' && (
                        <div className="apply-status error">
                            {t('modelApply.errorMsg', '오류가 발생했습니다. 다시 시도해주세요.')}
                        </div>
                    )}
                </form>
                {/* Admin-only applicants view */}
                {isAdmin && (
                    <div className="model-apply-admin-link" style={{ marginTop: '20px', textAlign: 'center' }}>
                        <a href="/admin?tab=apply" style={{ 
                            display: 'inline-block',
                            padding: '12px 24px',
                            background: 'rgba(255, 59, 48, 0.05)',
                            border: '1px solid rgba(255, 59, 48, 0.2)',
                            borderRadius: '12px',
                            color: '#FF3B30',
                            textDecoration: 'none',
                            fontSize: '0.95rem',
                            fontWeight: 700,
                            transition: 'all 0.2s',
                            boxShadow: '0 2px 8px rgba(255, 59, 48, 0.1)'
                        }}>
                            📋 {t('modelApply.viewApps', '지원자보기')} (지원인원 +{applicantCount ?? '...'}명)
                        </a>
                    </div>
                )}


                <div className="model-apply-footer-note-luxury">
                    {t('modelApply.footerNoteCompressed', '국적과 나이를 넘어, 자신만의 무드를 가진 모든 사람을 기다립니다.')}
                </div>


                <div className="model-list-link-container" style={{ marginTop: '60px', textAlign: 'center' }}>
                    <a href="/fitorialist" className="model-list-link-btn" style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '12px 30px',
                        border: '1px solid var(--color-primary)',
                        borderRadius: '30px',
                        color: 'var(--color-primary)',
                        textDecoration: 'none',
                        fontSize: '0.9rem',
                        fontWeight: 600,
                        letterSpacing: '0.1em',
                        transition: 'all 0.3s'
                    }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                        {t('modelApply.viewList', 'VIEW AMBASSADOR LIST')}
                    </a>
                </div>
            </div>
        </section>
    );
};

export default ModelRecruit;
