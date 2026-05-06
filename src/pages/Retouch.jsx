import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../utils/firebase';
import './Retouch.css';

const Retouch = () => {
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [customer, setCustomer] = useState(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [loading, setLoading] = useState(false);

    const statuses = ['보정대기', '선보정(당일보정)', '보정중', '1차보정완료(피드백요청)', '2차보정', '최종컴펌완료', '최종보정완료'];

    const statusGuides = {
        '보정대기': '원본 셀렉 파일을 기다리고 있습니다. 셀렉 완료 후 메일(inafit@daum.net)로 회신 주시면 보정 작업이 시작됩니다. (셀렉 후 약 4주 소요). 보정본 수령 후 추가로 보정이 더 필요할 시 핏걸즈 스마트 플레이스 (핏걸즈스튜디오)에서 추가 구매가 가능합니다.',
        '선보정(당일보정)': '먼저 받고 싶은 사진 한 장에 대해 우선적으로 보정을 진행하는 단계입니다.',
        '보정중': '선택하신 사진을 작가가 정성스럽게 보정하고 있는 단계입니다. 조금만 더 기다려 주세요!',
        '1차보정완료(피드백요청)': '1차 보정이 완료되어 업로드되었습니다. 보정본을 확인하신 후, 추가 수정 사항이 있으시면 말씀해 주세요.',
        '2차보정': '전달해주신 피드백을 바탕으로 2차 보정 작업을 진행 중입니다.',
        '최종컴펌완료': '모든 보정 작업에 대한 컨펌이 완료되었습니다. 최종 파일을 정리 중입니다.',
        '최종보정완료': '모든 보정 작업이 완료되었습니다! 최종 보정본을 다운로드하실 수 있습니다.'
    };

    const [selectedStatuses, setSelectedStatuses] = useState({});

    // Robust Date Formatter
    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        const str = String(dateStr).replace(/[^0-9]/g, '');
        
        // MMDD (4자리) 처리
        if (str.length === 4) {
            const month = str.substring(0, 2);
            const day = str.substring(2, 4);
            return `2026.${month}.${day}`;
        }
        
        // YYMMDD (6자리) 처리
        if (str.length === 6) {
            const year = '20' + str.substring(0, 2);
            const month = str.substring(2, 4);
            const day = str.substring(4, 6);
            return `${year}.${month}.${day}`;
        }
        
        return dateStr;
    };

    // Helper to calculate days passed
    const getDaysPassed = (dateStr) => {
        if (!dateStr) return null;
        try {
            const str = String(dateStr).replace(/[^0-9]/g, '');
            let targetDate;
            if (str.length === 6) {
                const year = 2000 + parseInt(str.substring(0, 2));
                const month = parseInt(str.substring(2, 4)) - 1;
                const day = parseInt(str.substring(4, 6));
                targetDate = new Date(year, month, day);
            } else {
                targetDate = new Date(dateStr);
            }
            if (isNaN(targetDate.getTime())) return null;
            const today = new Date();
            today.setHours(0,0,0,0);
            targetDate.setHours(0,0,0,0);
            const diffTime = today - targetDate;
            return Math.floor(diffTime / (1000 * 60 * 60 * 24));
        } catch (e) { return null; }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        const phoneId = phone.replace(/[^0-9]/g, '');
        try {
            const docRef = doc(db, 'retouch_masters', phoneId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const data = docSnap.data();
                if (data.password === password) {
                    setCustomer({ id: docSnap.id, ...data });
                    setIsLoggedIn(true);
                    try { localStorage.setItem('retouch_user', phoneId); } catch(e) {}
                } else { alert('비밀번호가 일치하지 않습니다.'); }
            } else { alert('등록된 정보를 찾을 수 없습니다.'); }
        } catch (err) { console.error(err); alert('로그인 중 오류가 발생했습니다.'); }
        setLoading(false);
    };

    useEffect(() => {
        let unsub;
        try {
            const savedUser = localStorage.getItem('retouch_user');
            if (savedUser) {
                unsub = onSnapshot(doc(db, 'retouch_masters', savedUser), (snapshot) => {
                    if (snapshot.exists()) {
                        setCustomer({ id: snapshot.id, ...snapshot.data() });
                        setIsLoggedIn(true);
                    }
                });
            }
        } catch (e) { console.error(e); }
        return () => { if (unsub) unsub(); };
    }, []);

    const handleLogout = () => {
        try { localStorage.removeItem('retouch_user'); } catch(e) {}
        setIsLoggedIn(false);
        setCustomer(null);
    };

    if (!isLoggedIn) {
        return (
            <div className="retouch-login-wrapper">
                <div className="retouch-login-box">
                    <h2 className="login-title">RETOUCH <span>DASHBOARD</span></h2>
                    <p className="login-subtitle">고객님의 보정 현황을 확인하세요.</p>
                    <form onSubmit={handleLogin} className="login-form">
                        <div className="form-input">
                            <label>아이디 (전화번호)</label>
                            <input type="text" value={phone} onChange={(e)=>setPhone(e.target.value)} placeholder="01012345678" required />
                        </div>
                        <div className="form-input">
                            <label>비밀번호 (전화번호 뒤 4자리)</label>
                            <input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} placeholder="****" required />
                        </div>
                        <button type="submit" disabled={loading} className="submit-btn">
                            {loading ? '로그인 중...' : '로그인'}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="retouch-dashboard-main">
            <header className="dashboard-header">
                <h1 className="logo-text">RETOUCH <span>CLIENT</span></h1>
                <div className="user-info">
                    <span><strong>{customer?.name || '고객'}</strong> 님</span>
                    <button onClick={handleLogout} className="logout-button">로그아웃</button>
                </div>
            </header>

            <main className="dashboard-container">
                <div className="welcome-banner">
                    <h2>반갑습니다, {customer?.name || '고객'}님!</h2>
                    <p>요청하신 보정 작업의 실시간 현황입니다.</p>
                </div>

                <div className="project-list">
                    {customer?.projectHistory?.slice().reverse().map(pId => {
                        const status = customer.projectStatuses?.[pId] || '보정대기';
                        const currentIdx = statuses.indexOf(status);
                        const link = customer.dropboxArchives?.[pId] || '';
                        const base = customer.projectBaseRetouchCounts?.[pId] || 0;
                        const insta = customer.instaConsents?.[pId] || false;
                        const review = customer.reviewConsents?.[pId] || false;
                        const bonus = (insta ? 1 : 0) + (review ? 1 : 0);
                        const extra = customer.projectExtraRetouchCounts?.[pId] || 0;
                        const total = base + bonus + extra;
                        const requestDate = customer.requestDates?.[pId] || '';
                        const daysPassed = getDaysPassed(requestDate);

                        return (
                            <div key={pId} className={`project-item-card ${status === '최종보정완료' ? 'completed' : ''}`}>
                                <div className="card-top">
                                    <div className="p-header">
                                        <span className="p-id">촬영일: {formatDate(pId)}</span>
                                        <div className="p-status-badge" data-status={status}>{status}</div>
                                    </div>
                                    <h3 className="p-title">{customer.name} 님 FITORIAL PROJECT</h3>

                                    {/* Visual Stepper */}
                                    <div className="p-stepper-container">
                                        <div className="stepper-track">
                                            <div className="stepper-progress" style={{ width: `${(currentIdx / (statuses.length - 1)) * 100}%` }}></div>
                                        </div>
                                        <div className="stepper-steps">
                                            {statuses.map((s, idx) => {
                                                const currentStatus = customer.projectStatuses?.[pId] || '보정대기';
                                                const isSelected = (selectedStatuses[pId] || currentStatus) === s;
                                                return (
                                                    <div 
                                                        key={idx} 
                                                        className={`step-item ${idx <= statuses.indexOf(currentStatus) ? 'active' : ''} ${isSelected ? 'selected' : ''} ${
                                                            s.includes('보정대기') ? 'status-waiting' :
                                                            s.includes('선보정') ? 'status-pre-retouch' :
                                                            s.includes('보정중') ? 'status-processing' :
                                                            s.includes('1차보정완료') ? 'status-1st-done' :
                                                            s.includes('2차보정') ? 'status-2nd-processing' :
                                                            s.includes('최종컴펌완료') ? 'status-confirm' :
                                                            s.includes('최종보정완료') ? 'status-final-done' : ''
                                                        }`}
                                                        onClick={() => setSelectedStatuses(prev => ({ ...prev, [pId]: s }))}
                                                    >
                                                        <div className="step-dot"></div>
                                                        <span className="step-label">
                                                            {s.replace('(피드백요청)', '').replace(' 진행', '')}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div className="p-status-guide-box">
                                        <p className="guide-text">
                                            {statusGuides[selectedStatuses[pId] || customer.projectStatuses?.[pId] || '보정대기']}
                                        </p>
                                    </div>
                                    
                                    <div className="p-timeline">
                                        <div className="time-col">
                                            <span className="time-label">보정 요청일</span>
                                            <span className="time-val">{formatDate(requestDate)}</span>
                                        </div>
                                        <div className="time-col">
                                            <span className="time-label">진행 기간</span>
                                            <span className="time-val highlight">{daysPassed !== null ? `D+${daysPassed}일째` : '-'}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="card-stats">
                                    <div className="stats-header">
                                        <div className="stats-main">
                                            <span className="stats-label">전체 보정 수량</span>
                                            <span className="stats-num">{total}<span>장</span></span>
                                        </div>
                                        <div className="stats-breakdown">
                                            기본 {base} {bonus > 0 && `+ 이벤트 ${bonus}`} {extra > 0 && `+ 추가 ${extra}`}
                                        </div>
                                    </div>
                                    {link && (
                                        <a href={link} target="_blank" rel="noreferrer" className="dropbox-btn">보정본 확인하기</a>
                                    )}
                                </div>

                                <div className="card-actions">
                                    <div className="action-ready">
                                        <div className="consent-options">
                                            <label className={`opt-item ${insta ? 'checked' : ''}`}>
                                                <input type="checkbox" checked={insta} onChange={async (e) => {
                                                    await updateDoc(doc(db, 'retouch_masters', customer.id), { [`instaConsents.${pId}`]: e.target.checked });
                                                }} />
                                                인스타그램 업로드 동의 (서비스 +1장)
                                            </label>
                                            <label className={`opt-item ${review ? 'checked' : ''}`}>
                                                <input type="checkbox" checked={review} onChange={async (e) => {
                                                    await updateDoc(doc(db, 'retouch_masters', customer.id), { [`reviewConsents.${pId}`]: e.target.checked });
                                                }} />
                                                리뷰 작성 완료 (서비스 +1장)
                                            </label>
                                        </div>

                                        {insta && status === '최종보정완료' && (
                                            <div className="insta-id-input-box">
                                                <p className="insta-guide">📸 인스타그램 업로드 시 태그를 위해 아이디를 알려주세요!</p>
                                                <div className="insta-input-group">
                                                    <input 
                                                        type="text" 
                                                        id={`insta-input-${pId}`}
                                                        placeholder="인스타그램 아이디" 
                                                        defaultValue={customer.instaIds?.[pId] || ''}
                                                    />
                                                    <button 
                                                        className="insta-save-btn"
                                                        onClick={async () => {
                                                            const val = document.getElementById(`insta-input-${pId}`).value;
                                                            await updateDoc(doc(db, 'retouch_masters', customer.id), { 
                                                                [`instaIds.${pId}`]: val 
                                                            });
                                                            alert('인스타 아이디가 저장되었습니다!');
                                                        }}
                                                    >
                                                        저장
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {!link && (
                                            <div className="action-waiting">
                                                <div className="wait-icon">🎨</div>
                                                <p>작가님이 요청사항을 확인 후 순차적으로 보정을 시작합니다.<br/>조금만 기다려 주세요!</p>
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="extra-purchase-box">
                                        <p className="extra-guide-text">보정본 수령 후 추가로 보정이 더 필요하신가요?</p>
                                        <a href="https://smartstore.naver.com/imfitgirl" target="_blank" rel="noreferrer" className="extra-purchase-btn">
                                            추가 보정 구매하기 (네이버 스마트스토어)
                                        </a>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <footer className="dashboard-footer">
                    <div className="status-guide-box">
                        <h4 className="guide-title">보정 프로세스 안내</h4>
                        <div className="status-steps-text">
                            {statuses.map((s, idx) => (
                                <React.Fragment key={idx}>
                                    <span className="status-text-item">{s.replace('(피드백요청)', '').replace(' 진행', '')}</span>
                                    {idx < statuses.length - 1 && <span className="status-separator">→</span>}
                                </React.Fragment>
                            ))}
                        </div>
                        <p className="guide-notice">※ 모든 작업은 순차적으로 진행되며, 단계별 현황은 본 페이지에서 실시간으로 확인하실 수 있습니다.</p>
                    </div>
                </footer>
            </main>
        </div>
    );
};

export default Retouch;
