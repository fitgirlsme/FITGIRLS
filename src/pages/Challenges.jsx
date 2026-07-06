import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import SupportCS from '../components/SupportCS';
import Footer from '../components/Footer';
import { getData, STORES } from '../utils/db';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { MESSENGER_LINKS } from '../constants/links';
import './Challenges.css';

// 한글 날짜 형식 파싱 함수 (예: "2026. 07. 09. 오후 04:44")
const parseKoreanDate = (dateStr) => {
    if (!dateStr) return null;
    if (typeof dateStr !== 'string') return new Date(dateStr);
    
    try {
        const regex = /(\d{4})[.\-\s]+(\d{1,2})[.\-\s]+(\d{1,2})[.\-\s]*(오전|오후)?\s*(\d{1,2}):(\d{1,2})/;
        const match = dateStr.match(regex);
        
        if (match) {
            const year = parseInt(match[1], 10);
            const month = parseInt(match[2], 10) - 1; // 0-indexed
            const day = parseInt(match[3], 10);
            const ampm = match[4];
            let hour = parseInt(match[5], 10);
            const minute = parseInt(match[6], 10);
            
            if (ampm === '오후' && hour < 12) {
                hour += 12;
            } else if (ampm === '오전' && hour === 12) {
                hour = 0;
            }
            
            return new Date(year, month, day, hour, minute);
        }
    } catch (e) {
        console.error('Failed to parse Korean date string:', dateStr, e);
    }
    
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? null : d;
};

// D-Day 실시간 카운트다운 타이머 계산 함수
const calculateTimeLeft = (deadline) => {
    if (!deadline) return null;
    
    // deadline이 Firestore Timestamp인 경우 변환
    let targetDate = deadline;
    if (deadline.toDate) {
        targetDate = deadline.toDate();
    } else {
        targetDate = parseKoreanDate(deadline);
    }
    
    if (!targetDate || isNaN(targetDate.getTime())) {
        return null;
    }
    
    const difference = targetDate.getTime() - new Date().getTime();
    
    if (difference <= 0) {
        return {
            expired: true,
            string: '00d 00h 00m 00s'
        };
    }
    
    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((difference / 1000 / 60) % 60);
    const seconds = Math.floor((difference / 1000) % 60);
    
    const pad = (num) => String(num).padStart(2, '0');
    
    return {
        expired: false,
        string: `${pad(days)}d ${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`
    };
};

const isProjectClosed = (project) => {
    if (!project) return true;
    if (project.status === 'closed') return true;
    if (project.deadline) {
        let deadlineDate;
        if (project.deadline.toDate) {
            deadlineDate = project.deadline.toDate();
        } else {
            deadlineDate = parseKoreanDate(project.deadline);
        }
        if (!deadlineDate || isNaN(deadlineDate.getTime())) return false; // 파싱 실패 시 일단 열린 상태로 간주
        return deadlineDate <= new Date();
    }
    return false;
};

const Challenges = () => {
    const [loading, setLoading] = useState(true);
    const [isScrolled, setIsScrolled] = useState(false);
    const [projects, setProjects] = useState([]);
    const [activeProject, setActiveProject] = useState(null);
    const [archiveProjects, setArchiveProjects] = useState([]);
    const [timeLeftString, setTimeLeftString] = useState('00d 00h 00m 00s');
    const [isTimerExpired, setIsTimerExpired] = useState(false);

    // 1. 데이터 로드 로직 (IndexedDB -> Firestore)
    useEffect(() => {
        const fetchProjects = async () => {
            let list = [];
            try {
                // IndexedDB에서 우선 획득
                const localData = await getData(STORES.MONTHLY_PROJECTS);
                if (localData && localData.length > 0) {
                    list = localData;
                }
            } catch (err) {
                console.error('IndexedDB fetch error:', err);
            }

            if (list.length === 0) {
                // Firestore에서 백업 획득
                try {
                    const q = query(collection(db, 'monthly_projects'), orderBy('createdAt', 'desc'));
                    const snap = await getDocs(q);
                    list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                } catch (err) {
                    console.error('Firestore fetch error:', err);
                }
            }

            // 생성일자(createdAt) 기준 내림차순 정렬
            const sortedList = [...list].sort((a, b) => {
                const dateA = a.createdAt ? (a.createdAt.toDate ? a.createdAt.toDate() : new Date(a.createdAt)) : new Date(0);
                const dateB = b.createdAt ? (b.createdAt.toDate ? b.createdAt.toDate() : new Date(b.createdAt)) : new Date(0);
                return dateB - dateA;
            });

            setProjects(sortedList);
            setLoading(false);
        };

        fetchProjects();
    }, [isTimerExpired]); // 타이머 마감 시 데이터 재정렬 및 갱신을 위해 종속성 추가

    // 2. 활성 드롭 및 아카이브 분기 로직
    useEffect(() => {
        if (projects.length === 0) {
            setActiveProject(null);
            setArchiveProjects([]);
            return;
        }

        const now = new Date();
        
        // Active 후보군: status === 'active' 이면서 deadline이 지나지 않은 것
        const activeCandidates = projects.filter(p => {
            if (p.status !== 'active') return false;
            if (!p.deadline) return true; // deadline 설정이 없으면 무제한 진행으로 판단
            
            const deadlineDate = p.deadline.toDate ? p.deadline.toDate() : parseKoreanDate(p.deadline);
            if (!deadlineDate || isNaN(deadlineDate.getTime())) return true; // 파싱 실패 시 일단 활성 상태로 간주
            return deadlineDate > now;
        });

        // 가장 최신의 active 후보를 히어로 배너로 선택
        const currentActive = activeCandidates.length > 0 ? activeCandidates[0] : null;
        setActiveProject(currentActive);

        // activeProject가 아닌 프로젝트 중 실제로 마감된 프로젝트만 closed 아카이브로 분류
        const currentArchive = projects.filter(p => {
            if (currentActive && p.id === currentActive.id) return false;
            
            // status가 closed이거나 마감일이 지난 경우
            if (p.status === 'closed') return true;
            if (p.deadline) {
                const deadlineDate = p.deadline.toDate ? p.deadline.toDate() : parseKoreanDate(p.deadline);
                if (!deadlineDate || isNaN(deadlineDate.getTime())) return false; // 파싱 실패 시 일단 마감되지 않은 상태로 간주
                return deadlineDate <= now;
            }
            return false;
        });
        setArchiveProjects(currentArchive);

    }, [projects]);

    // 3. 실시간 카운트다운 타이머 이펙트
    useEffect(() => {
        if (!activeProject || !activeProject.deadline) {
            setTimeLeftString('00d 00h 00m 00s');
            return;
        }

        // 초기 계산
        const initial = calculateTimeLeft(activeProject.deadline);
        if (initial) {
            setTimeLeftString(initial.string);
            if (initial.expired) {
                setIsTimerExpired(true);
            }
        }

        const interval = setInterval(() => {
            const current = calculateTimeLeft(activeProject.deadline);
            if (!current) {
                clearInterval(interval);
                return;
            }
            setTimeLeftString(current.string);
            if (current.expired) {
                setIsTimerExpired(true);
                clearInterval(interval);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [activeProject]);

    // 4. 스크롤 헤더 감지
    const handleScroll = (e) => {
        setIsScrolled(e.target.scrollTop > 50);
    };

    // 정가와 할인가 비율 계산
    const getDiscountPercentage = (reg, disc) => {
        if (!reg || !disc) return null;
        const regNum = typeof reg === 'number' ? reg : parseInt(reg.toString().replace(/[^0-9]/g, ''), 10);
        const discNum = typeof disc === 'number' ? disc : parseInt(disc.toString().replace(/[^0-9]/g, ''), 10);
        if (isNaN(regNum) || isNaN(discNum) || regNum <= discNum) return null;
        return Math.round(((regNum - discNum) / regNum) * 100);
    };

    return (
        <div className="app-container" onScroll={handleScroll} style={{ overflowY: 'auto', height: '100vh', background: '#ffffff' }}>
            <Header 
                isScrolled={isScrolled} 
                isOnHero={false} 
                changeLanguage={() => {}} 
                currentLang="ko" 
            />
            
            <main className="challenges-main">
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '120px 0', color: '#ff0000', fontFamily: 'Playfair Display, serif', fontWeight: 700 }}>
                        LOADING THE PLATFORM...
                    </div>
                ) : (
                    <>
                        {/* 1. TOP HERO SECTION (CURRENT DROP) */}
                        <section className="hero-drop-section">
                            <div className="hero-drop-container">
                                {activeProject ? (
                                    <>
                                        <div className="hero-drop-banner">
                                            <img src={activeProject.hero_image} alt={activeProject.title} />
                                        </div>
                                        <div className="hero-meta-overlay">
                                            <span className="drop-badge">Current Drop</span>
                                            <h1 className="drop-title serif-title">{activeProject.title}</h1>
                                            
                                            {activeProject.deadline && (
                                                <div className="timer-container">
                                                    <span className="timer-label">Time Remaining</span>
                                                    <div className="timer-digits">{timeLeftString}</div>
                                                </div>
                                            )}
                                        </div>
                                    </>
                                ) : (
                                    <div className="fallback-empty-hero">
                                        <h3 className="serif-title">NO ACTIVE DROP CURRENTLY</h3>
                                        <p style={{ margin: 0, fontSize: '0.9rem', color: '#666' }}>새로운 에디토리얼 컨셉 드롭이 곧 시작됩니다.</p>
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* 2. MIDDLE SECTION (DETAILS & PRICES) */}
                        {activeProject && (
                            <section className="middle-drop-section">
                                <div className="drop-info-left">
                                    <div 
                                        className="drop-description ql-editor"
                                        dangerouslySetInnerHTML={{ __html: activeProject.description }}
                                    />
                                </div>
                                
                                <div className="drop-info-right">
                                    <div className="price-cta-box">
                                        <div className="drop-price-container">
                                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#666', letterSpacing: '0.05em' }}>MEMBERSHIP PRICE</span>
                                            {activeProject.price_regular && (
                                                <span className="price-regular">{activeProject.price_regular.toLocaleString()}원</span>
                                            )}
                                            {activeProject.price_discount && (
                                                <div className="price-discount-wrapper">
                                                    <span className="price-discount">{activeProject.price_discount.toLocaleString()}원</span>
                                                    {getDiscountPercentage(activeProject.price_regular, activeProject.price_discount) && (
                                                        <span className="discount-badge">
                                                            {getDiscountPercentage(activeProject.price_regular, activeProject.price_discount)}% OFF
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {activeProject.booking_url && (
                                            <a 
                                                href={activeProject.booking_url} 
                                                target="_blank" 
                                                rel="noopener noreferrer" 
                                                className="cta-booking-button"
                                            >
                                                <span>지금 예약하기 (네이버 예약)</span>
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                    <line x1="5" y1="12" x2="19" y2="12" />
                                                    <polyline points="12 5 19 12 12 19" />
                                                </svg>
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </section>
                        )}

                        {/* 3. BOTTOM SECTION (PAST DROPS ARCHIVE) */}
                        <section className="archive-drops-section">
                            <div className="archive-drops-container">
                                <div className="archive-header">
                                    <h2 className="serif-title">PAST DROPS ARCHIVE</h2>
                                    <p>핏걸즈가 전개해 온 지난 한정판 프로젝트 컬렉션입니다.</p>
                                </div>

                                {archiveProjects.length > 0 ? (
                                    <div className="archive-grid">
                                        {archiveProjects.map((project) => {
                                            const closed = isProjectClosed(project);
                                            return (
                                                <div 
                                                    key={project.id} 
                                                    className={`archive-card ${closed ? 'closed' : ''}`}
                                                    onClick={() => {
                                                        if (!closed && project.booking_url) {
                                                            window.open(project.booking_url, '_blank');
                                                        }
                                                    }}
                                                    style={{ cursor: !closed && project.booking_url ? 'pointer' : 'default' }}
                                                >
                                                    <div className="archive-img-wrapper">
                                                        <img src={project.hero_image} alt={project.title} />
                                                        {closed && <div className="closed-badge-overlay">Closed</div>}
                                                    </div>
                                                    <div className="archive-card-meta">
                                                        <h3 className="archive-card-title serif-title">{project.title}</h3>
                                                        {project.price_discount && (
                                                            <span className="archive-card-price">
                                                                {project.price_discount.toLocaleString()}원
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div style={{ textAlign: 'center', padding: '60px 0', color: '#999', fontSize: '0.9rem' }}>
                                        아카이브된 지난 프로젝트가 존재하지 않습니다.
                                    </div>
                                )}
                            </div>
                        </section>
                    </>
                )}
            </main>
            
            <SupportCS />
            <Footer isHidden={false} />
        </div>
    );
};

export default Challenges;
