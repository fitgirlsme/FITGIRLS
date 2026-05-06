import React, { useState, useEffect } from 'react';
import { db } from '../utils/firebase';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import './AnalyticsWidget.css';

const PAGE_LABELS = {
    home: '🏠 홈', service: '💰 서비스/가격', retouch: '✏️ 보정 현황', gallery: '📷 갤러리',
    reservation: '📅 예약', faq: '❓ FAQ', location: '📍 오시는 길', magazine: '📖 FITORIALIST',
    partners: '🤝 파트너스', artist: '🎨 아티스트',
};

const SOURCE_LABELS = {
    direct: { label: '직접 유입', emoji: '🔗' }, instagram: { label: '인스타그램', emoji: '📸' },
    google: { label: '구글', emoji: '🔍' }, naver: { label: '네이버', emoji: '🟢' },
    kakao: { label: '카카오', emoji: '💬' }, facebook: { label: '페이스북', emoji: '👤' },
    youtube: { label: '유튜브', emoji: '▶️' }, twitter: { label: '트위터', emoji: '🐦' },
    internal: { label: '내부 이동', emoji: '🔄' }, other: { label: '기타', emoji: '🌐' },
};

const TABS = [
    { id: 'today', label: '오늘' },
    { id: 'last7', label: '최근 7일' },
    { id: 'thisMonth', label: '이번 달' },
    { id: 'thisYear', label: '올해' }
];

const DonutChart = ({ mobile = 0, tablet = 0, pc = 0 }) => {
    const total = mobile + tablet + pc || 1;
    const mPct = Math.round((mobile / total) * 100);
    const tPct = Math.round((tablet / total) * 100);
    const pPct = 100 - mPct - tPct;

    const gradient = `conic-gradient(
        #000000 0% ${mPct}%,
        #666666 ${mPct}% ${mPct + tPct}%,
        #e2e8f0 ${mPct + tPct}% 100%
    )`;

    return (
        <div className="aw-donut-wrap">
            <div className="aw-donut" style={{ background: gradient }}>
                <div className="aw-donut-hole">
                    <span className="aw-donut-main">{mPct}%</span>
                    <span className="aw-donut-sub">모바일</span>
                </div>
            </div>
            <div className="aw-donut-legend">
                <div className="aw-legend-item">
                    <span className="aw-legend-dot" style={{ background: '#000000' }} />
                    <span>모바일</span><strong>{mPct}%</strong>
                </div>
                {tablet > 0 && (
                    <div className="aw-legend-item">
                        <span className="aw-legend-dot" style={{ background: '#666666' }} />
                        <span>태블릿</span><strong>{tPct}%</strong>
                    </div>
                )}
                <div className="aw-legend-item">
                    <span className="aw-legend-dot" style={{ background: '#e2e8f0' }} />
                    <span>PC</span><strong>{pPct}%</strong>
                </div>
            </div>
        </div>
    );
};

const AnalyticsWidget = () => {
    const [activeTab, setActiveTab] = useState('today');
    const [loading, setLoading] = useState(true);
    
    // Aggregated Data
    const [aggData, setAggData] = useState({ total: 0, reservationClicks: 0, pages: {}, sources: {}, utmCampaigns: {}, devices: {}, chartData: [] });

    // Helper functions
    const getFormattedDate = (d) => d.toISOString().slice(0, 10);
    const getFormattedMonth = (d) => d.toISOString().slice(0, 7);
    
    const mergeData = (target, source) => {
        if (!source) return;
        target.total += (source.total || 0);
        target.reservationClicks += (source.reservationClicks || 0);
        
        ['pages', 'sources', 'utmCampaigns', 'devices'].forEach(category => {
            if (source[category]) {
                Object.entries(source[category]).forEach(([k, v]) => {
                    target[category][k] = (target[category][k] || 0) + v;
                });
            }
        });
    };

    useEffect(() => {
        const fetchTabData = async () => {
            setLoading(true);
            try {
                const now = new Date();
                const result = { total: 0, reservationClicks: 0, pages: {}, sources: {}, utmCampaigns: {}, devices: {}, chartData: [] };

                if (activeTab === 'today') {
                    const todayStr = getFormattedDate(now);
                    const snap = await getDoc(doc(db, 'analytics_daily', todayStr));
                    const data = snap.exists() ? snap.data() : {};
                    mergeData(result, data);
                    
                    // Chart: 24 Hours
                    for (let i = 0; i < 24; i++) {
                        const h = String(i).padStart(2, '0');
                        result.chartData.push({ label: `${i}시`, count: data.hours?.[h] || 0 });
                    }
                } 
                else if (activeTab === 'last7') {
                    // Chart: Last 7 days
                    for (let i = 6; i >= 0; i--) {
                        const d = new Date();
                        d.setDate(d.getDate() - i);
                        const dateStr = getFormattedDate(d);
                        const snap = await getDoc(doc(db, 'analytics_daily', dateStr));
                        const data = snap.exists() ? snap.data() : {};
                        mergeData(result, data);
                        result.chartData.push({ label: `${d.getMonth()+1}/${d.getDate()}`, count: data.total || 0 });
                    }
                }
                else if (activeTab === 'thisMonth') {
                    const monthStr = getFormattedMonth(now);
                    const snap = await getDoc(doc(db, 'analytics_monthly', monthStr));
                    mergeData(result, snap.exists() ? snap.data() : {});
                    
                    // Chart: Days of this month
                    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
                    for (let i = 1; i <= daysInMonth; i++) {
                        const d = new Date(now.getFullYear(), now.getMonth(), i);
                        if (d > now) break; // Don't fetch future days
                        const dateStr = getFormattedDate(d);
                        const dSnap = await getDoc(doc(db, 'analytics_daily', dateStr));
                        result.chartData.push({ label: `${i}일`, count: dSnap.exists() ? (dSnap.data().total || 0) : 0 });
                    }
                }
                else if (activeTab === 'thisYear') {
                    const yearStr = String(now.getFullYear());
                    // Fetch all months for this year
                    const colRef = collection(db, 'analytics_monthly');
                    const q = query(colRef, where('__name__', '>=', `${yearStr}-01`), where('__name__', '<=', `${yearStr}-12`));
                    const querySnapshot = await getDocs(q);
                    
                    const monthlyMap = {};
                    querySnapshot.forEach(doc => {
                        mergeData(result, doc.data());
                        monthlyMap[doc.id] = doc.data().total || 0;
                    });
                    
                    // Chart: 12 Months
                    for (let i = 1; i <= 12; i++) {
                        const mStr = `${yearStr}-${String(i).padStart(2, '0')}`;
                        if (new Date(yearStr, i-1, 1) > now) break;
                        result.chartData.push({ label: `${i}월`, count: monthlyMap[mStr] || 0 });
                    }
                }

                setAggData(result);
            } catch (e) {
                console.error('Analytics fetch error:', e);
            }
            setLoading(false);
        };

        fetchTabData();
    }, [activeTab]);

    const [showAllSources, setShowAllSources] = useState(false);

    // Sorting extractors (전체 데이터를 다 가져온 후, 화면 표시할 때만 자름)
    const allPages = Object.entries(aggData.pages)
        .map(([k, v]) => ({ name: PAGE_LABELS[k] || k, count: v }))
        .sort((a, b) => b.count - a.count);
    const topPages = allPages.slice(0, 5);
        
    const allSources = Object.entries(aggData.sources)
        .map(([k, v]) => ({ ...(SOURCE_LABELS[k] || { label: k, emoji: '🌐' }), count: v }))
        .sort((a, b) => b.count - a.count);
    const displayedSources = showAllSources ? allSources : allSources.slice(0, 5);
        
    const allCampaigns = Object.entries(aggData.utmCampaigns)
        .map(([k, v]) => ({ name: k, count: v }))
        .sort((a, b) => b.count - a.count);
    const topCampaigns = allCampaigns.slice(0, 5);

    const maxChartCount = Math.max(...aggData.chartData.map(d => d.count), 1);

    return (
        <div className="analytics-widget">
            <div className="aw-header-row">
                <div className="aw-header-left">
                    <span className="aw-title">데이터 센터</span>
                </div>
                
                {/* 2. 하이 컨트라스트 캡슐형 퀵 탭 */}
                <div className="aw-capsule-tabs">
                    {TABS.map(tab => (
                        <button 
                            key={tab.id}
                            className={`aw-capsule-btn ${activeTab === tab.id ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="aw-loading">데이터를 분석 중입니다...</div>
            ) : (
                <>
                    {/* 요약 카드 */}
                    <div className="aw-summary-cards">
                        <div className="aw-card">
                            <div className="aw-card-label">총 방문자</div>
                            <div className="aw-card-value">{aggData.total}</div>
                        </div>
                        <div className="aw-card accent">
                            <div className="aw-card-label">예약 클릭 수</div>
                            <div className="aw-card-value">{aggData.reservationClicks}</div>
                        </div>
                        <div className="aw-card">
                            <div className="aw-card-label">가장 많은 유입</div>
                            <div className="aw-card-value text-value">
                                {allSources.length > 0 ? allSources[0].label : '-'}
                            </div>
                        </div>
                    </div>

                    {/* 메인 차트 */}
                    <div className="aw-section">
                        <div className="aw-section-title">방문자 추이</div>
                        <div className="aw-trend-chart">
                            {aggData.chartData.map((d, i) => (
                                <div key={i} className="aw-trend-item" title={`${d.label}: ${d.count}명`}>
                                    <div className="aw-trend-bar" style={{ height: `${Math.max((d.count / maxChartCount) * 100, d.count > 0 ? 8 : 0)}%` }} />
                                    {/* 라벨을 적절히 건너뛰어 표시 (너무 많을 때) */}
                                    {(aggData.chartData.length <= 12 || i % 3 === 0) && (
                                        <div className="aw-trend-label">{d.label}</div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="aw-bottom-grid">
                        {/* 기기별 비율 */}
                        <div className="aw-section">
                            <div className="aw-section-title">기기별 접속 비율</div>
                            <DonutChart mobile={aggData.devices.mobile} tablet={aggData.devices.tablet} pc={aggData.devices.pc} />
                        </div>

                        {/* 인기 페이지 */}
                        <div className="aw-section">
                            <div className="aw-section-title">인기 페이지 Top 5</div>
                            {topPages.length === 0 ? <div className="aw-empty">데이터 없음</div> : (
                                <div className="aw-page-list">
                                    {topPages.map((p, i) => (
                                        <div key={i} className="aw-page-item">
                                            <span className="aw-page-rank">{i + 1}</span>
                                            <span className="aw-page-name">{p.name}</span>
                                            <span className="aw-page-count">{p.count}명</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="aw-bottom-grid">
                        {/* 유입 경로 */}
                        <div className="aw-section">
                            <div className="aw-section-title">유입 경로 {showAllSources ? '전체' : 'Top 5'}</div>
                            {displayedSources.length === 0 ? <div className="aw-empty">데이터 없음</div> : (
                                <div className="aw-page-list">
                                    {displayedSources.map((s, i) => (
                                        <div key={i} className="aw-page-item">
                                            <span className="aw-page-rank">{s.emoji}</span>
                                            <span className="aw-page-name">{s.label}</span>
                                            <span className="aw-page-count">{s.count}명</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {allSources.length > 5 && (
                                <button 
                                    onClick={() => setShowAllSources(!showAllSources)}
                                    className="aw-show-more-btn"
                                >
                                    {showAllSources ? '접기 ▲' : `더보기 (${allSources.length - 5}개 더 있음) ▼`}
                                </button>
                            )}
                        </div>

                        {/* UTM 캠페인 */}
                        <div className="aw-section">
                            <div className="aw-section-title">마케팅 캠페인 링크 (UTM) Top 5</div>
                            {topCampaigns.length === 0 ? <div className="aw-empty">데이터 없음</div> : (
                                <div className="aw-page-list">
                                    {topCampaigns.map((c, i) => (
                                        <div key={i} className="aw-page-item">
                                            <span className="aw-page-rank">🔗</span>
                                            <span className="aw-page-name">{c.name}</span>
                                            <span className="aw-page-count">{c.count}명</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default AnalyticsWidget;
