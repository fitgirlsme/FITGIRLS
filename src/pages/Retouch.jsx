import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, doc, getDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { useTranslation } from 'react-i18next';
import './Retouch.css';

import Header from '../components/Header';

const Retouch = ({ changeLanguage, currentLang }) => {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [projects, setProjects] = useState([]);
    
    // Login State
    const [loginPhone, setLoginPhone] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [loggedInUser, setLoggedInUser] = useState(null);

    // Load persisted login
    useEffect(() => {
        const savedUser = localStorage.getItem('retouch_user');
        if (savedUser) {
            try {
                const userData = JSON.parse(savedUser);
                setLoggedInUser(userData);
            } catch (e) {
                console.error("Session parse error", e);
            }
        }

        const fetchProjects = async () => {
            try {
                const snap = await getDocs(query(collection(db, 'retouch_projects')));
                const pList = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                setProjects(pList);
            } catch (err) {
                console.error("Failed to load projects:", err);
            }
        };
        fetchProjects();
    }, []);

    // Real-time listener for logged in user data
    useEffect(() => {
        if (!loggedInUser?.id) return;

        const unsub = onSnapshot(doc(db, 'retouch_masters', loggedInUser.id), (doc) => {
            if (doc.exists()) {
                const newData = { id: doc.id, ...doc.data() };
                setLoggedInUser(newData);
                localStorage.setItem('retouch_user', JSON.stringify(newData));
            }
        });

        return () => unsub();
    }, [loggedInUser?.id]);

    const handleLogin = async (e) => {
        if(e) e.preventDefault();
        setLoading(true);
        try {
            const phoneId = loginPhone.replace(/[^0-9]/g, '');
            const docRef = doc(db, 'retouch_masters', phoneId);
            const docSnap = await getDoc(docRef);
            
            if (docSnap.exists()) {
                const userData = { id: docSnap.id, ...docSnap.data() };
                const correctPassword = userData.password || phoneId.slice(-4);
                
                if (correctPassword === loginPassword) {
                    setLoggedInUser(userData);
                    localStorage.setItem('retouch_user', JSON.stringify(userData));
                } else {
                    let msg = '비밀번호가 일치하지 않습니다.';
                    if(currentLang === 'en') msg = 'Incorrect password.';
                    if(currentLang === 'ja') msg = 'パスワードが一致しません。';
                    if(currentLang === 'zh') msg = '密码错误。';
                    alert(msg);
                }
            } else {
                let msg = '등록된 예약 내역이 없는 번호입니다.';
                if(currentLang === 'en') msg = 'No reservation found.';
                if(currentLang === 'ja') msg = '予約情報が見つかりません。';
                if(currentLang === 'zh') msg = '未找到预约信息。';
                alert(msg);
            }
        } catch (err) {
            console.error(err);
            alert('Error occurred during login.');
        }
        setLoading(false);
    };

    const handleLogout = () => {
        setLoggedInUser(null);
        localStorage.removeItem('retouch_user');
    };

    const getStatusColor = (status) => {
        switch(status) {
            case '보정대기': return '#8A9BB3';
            case '보정중': return '#FFB800';
            case '1차보정완료(피드백요청)': return '#00D4B6';
            case '2차수정중': return '#FFB800';
            case '최종보정완료': return '#FF4B4B';
            default: return '#2A3649';
        }
    };

    const translateStatus = (status) => {
        if (currentLang === 'en') {
            switch(status) {
                case '보정대기': return 'Pending';
                case '보정중': return 'In Progress';
                case '1차보정완료(피드백요청)': return '1st Retouch Done';
                case '2차수정중': return '2nd Editing';
                case '최종보정완료': return 'Completed';
                default: return status;
            }
        }
        if (currentLang === 'ja') {
            switch(status) {
                case '보정대기': return '補正待機';
                case '보정중': return '補正中';
                case '1차보정완료(피드백요청)': return '1次リタッチ完了';
                case '2차수정중': return '2次修正中';
                case '최종보정완료': return '最終補正完了';
                default: return status;
            }
        }
        if (currentLang === 'zh') {
            switch(status) {
                case '보정대기': return '待修图';
                case '보정중': return '修图中';
                case '1차보정완료(피드백요청)': return '初次修图完成';
                case '2차수정중': return '二次修图中';
                case '최종보정완료': return '最终修图完成';
                default: return status;
            }
        }
        return status;
    };

    return (
        <div className="retouch-container" style={{ 
            background: '#080B14', 
            minHeight: '100vh', 
            padding: '120px 20px 60px',
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
            position: 'relative'
        }}>
            <Header 
                isScrolled={true} 
                isOnHero={false} 
                isHidden={false} 
                changeLanguage={changeLanguage} 
                currentLang={currentLang} 
            />
            <div className="retouch-wrapper" style={{ maxWidth: '600px', margin: '0 auto' }}>
                
                <div className="retouch-header" style={{ textAlign: 'center', marginBottom: '48px' }}>
                    <div style={{ marginBottom: '10px', fontSize: '0.9rem', color: '#00D4B6', fontWeight: 'bold', letterSpacing: '2px' }}>FITGIRLS & INAFIT</div>
                    <h2 style={{ fontSize: '2.5rem', fontWeight: '900', color: '#fff' }}>RETOUCH STATUS</h2>
                    <p style={{ color: '#888', marginTop: '12px' }}>
                        {currentLang === 'ko' && '고객님의 보정 진행 현황을 실시간으로 확인하실 수 있습니다.'}
                        {currentLang === 'en' && 'Check your retouching progress in real-time.'}
                        {currentLang === 'ja' && 'レタッチの進行状況をリアルタイムで確認できます。'}
                        {currentLang === 'zh' && '实时查看您的修图进度。'}
                    </p>
                </div>

                {!loggedInUser ? (
                    <div className="retouch-login-section">
                        <div className="retouch-form" style={{ background: '#151D29', padding: '40px', borderRadius: '24px', border: '1px solid #2A3649' }}>
                            <h3 style={{ fontSize: '1.5rem', color: '#fff', marginBottom: '8px' }}>
                                {currentLang === 'ko' && '보정 현황 로그인'}
                                {currentLang === 'en' && 'Login Status'}
                                {currentLang === 'ja' && 'ログイン'}
                                {currentLang === 'zh' && '修图进度查询'}
                            </h3>
                            <p style={{ color: '#8A9BB3', fontSize: '0.9rem', marginBottom: '32px' }}>
                                {currentLang === 'ko' && '전화번호와 비밀번호(번호 뒤 4자리)로 로그인하세요.'}
                                {currentLang === 'en' && 'Login with your phone number and password (last 4 digits).'}
                                {currentLang === 'ja' && '電話번호와 비밀번호(번호 뒤 4자리)로 로그인하세요.'}
                                {currentLang === 'zh' && '请输入手机号和密码（手机号后4位）。'}
                            </p>
                            
                            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div className="form-group">
                                    <label style={{ display: 'block', color: '#8A9BB3', fontSize: '0.85rem', marginBottom: '8px' }}>
                                        {currentLang === 'ko' && '전화번호'}
                                        {currentLang === 'en' && 'Phone Number'}
                                        {currentLang === 'ja' && '電話番号'}
                                        {currentLang === 'zh' && '手机号'}
                                    </label>
                                    <input 
                                        type="tel" 
                                        value={loginPhone} 
                                        onChange={(e) => setLoginPhone(e.target.value)} 
                                        placeholder="01012345678" 
                                        style={{ width: '100%', padding: '16px', borderRadius: '12px', background: '#080B14', border: '1px solid #2A3649', color: '#fff', fontSize: '1rem', boxSizing: 'border-box' }}
                                        required 
                                    />
                                </div>
                                <div className="form-group">
                                    <label style={{ display: 'block', color: '#8A9BB3', fontSize: '0.85rem', marginBottom: '8px' }}>
                                        {currentLang === 'ko' && '비밀번호'}
                                        {currentLang === 'en' && 'Password'}
                                        {currentLang === 'ja' && 'パスワード'}
                                        {currentLang === 'zh' && '密码'}
                                    </label>
                                    <input 
                                        type="password" 
                                        value={loginPassword} 
                                        onChange={(e) => setLoginPassword(e.target.value)} 
                                        placeholder="****" 
                                        style={{ width: '100%', padding: '16px', borderRadius: '12px', background: '#080B14', border: '1px solid #2A3649', color: '#fff', fontSize: '1rem', boxSizing: 'border-box' }}
                                        required 
                                    />
                                </div>
                                <button type="submit" className="retouch-btn" style={{ width: '100%', padding: '18px', borderRadius: '12px', background: '#00D4B6', color: '#080B14', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer', border: 'none', marginTop: '12px' }} disabled={loading}>
                                    {loading ? '...' : (
                                        currentLang === 'ko' ? '보정 현황 조회하기' : 
                                        currentLang === 'en' ? 'Check Status' : 
                                        currentLang === 'ja' ? 'ログイン' : '查询'
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>
                ) : (
                    <div className="retouch-dashboard">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                            <h3 style={{ fontSize: '1.5rem', color: '#fff' }}>
                                <span style={{ color: '#00D4B6' }}>{loggedInUser.name}</span> 
                                {currentLang === 'ko' && ' 님의 보정 현황'}
                                {currentLang === 'en' && "'s Status"}
                                {currentLang === 'ja' && '様の補正状況'}
                                {currentLang === 'zh' && ' 的修图进度'}
                            </h3>
                            <button onClick={handleLogout} style={{ background: 'transparent', border: '1px solid #2A3649', color: '#8A9BB3', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }}>
                                {currentLang === 'ko' ? '로그아웃' : currentLang === 'en' ? 'Logout' : currentLang === 'ja' ? 'ログアウト' : '退出'}
                            </button>
                        </div>

                        <div className="history-list" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            {loggedInUser.projectHistory?.map(pId => {
                                const pInfo = projects.find(p => p.id === pId);
                                const dbLink = loggedInUser.dropboxArchives?.[pId];
                                const pStatus = loggedInUser.projectStatuses?.[pId] || '보정대기';
                                
                                return (
                                    <div key={pId} className="history-item" style={{ background: '#151D29', padding: '32px', borderRadius: '24px', border: '1px solid #2A3649', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px' }}>
                                            <span style={{ 
                                                background: getStatusColor(pStatus), 
                                                color: (pStatus === '1차보정완료(피드백요청)' || pStatus === '최종보정완료') ? '#080B14' : '#fff',
                                                padding: '8px 16px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 'bold'
                                            }}>
                                                {translateStatus(pStatus)}
                                            </span>
                                            <span style={{ color: '#00D4B6', fontSize: '1rem', fontWeight: 'bold' }}>{pId}</span>
                                        </div>
                                        
                                        <h4 style={{ fontSize: '1.6rem', color: '#fff', fontWeight: 'bold', margin: 0 }}>
                                            {pInfo ? pInfo.title : (
                                                currentLang === 'ko' ? `${loggedInUser.name} 님 촬영` : 
                                                currentLang === 'en' ? `${loggedInUser.name}'s Shoot` : 
                                                currentLang === 'ja' ? `${loggedInUser.name} 様の撮影` : `${loggedInUser.name} 的拍摄`
                                            )}
                                        </h4>

                                        {dbLink && (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                                {pStatus === '1차보정완료(피드백요청)' && (
                                                    <div style={{ background: 'rgba(0, 212, 182, 0.05)', padding: '20px', borderRadius: '16px', borderLeft: '4px solid #00D4B6', color: '#e0e0e0', fontSize: '0.9rem', lineHeight: '1.6' }}>
                                                        {currentLang === 'ko' && <>1차보정이 완료 되었습니다. 추가 수정을 원하시면 아래에 내용을 적어주세요. 없으시면 <strong>[컨펌완료]</strong>를 눌러주세요!</>}
                                                        {currentLang === 'en' && <>1st retouch is done! If you need more edits, please write below. If not, click <strong>[Confirm Complete]</strong>!</>}
                                                        {currentLang === 'ja' && <>1次リタッチ가 완료되었습니다. 추가의 수정이 필요한 경우는 이하에 기입해 주세요. 없는 경우는<strong>[承認完了]</strong>를 클릭해 주세요!</>}
                                                        {currentLang === 'zh' && <>初次修图已完成。如需进一步修改请在下方留言。如果没有请点击<strong>[确认完成]</strong>！</>}
                                                    </div>
                                                )}

                                                <a href={dbLink} target="_blank" rel="noopener noreferrer" style={{ display: 'block', background: '#fff', color: '#080B14', padding: '16px', borderRadius: '12px', textAlign: 'center', fontWeight: 'bold', textDecoration: 'none' }}>
                                                    {pStatus === '최종보정완료' ? (
                                                        currentLang === 'ko' ? '✅ 최종본 다운로드' : 
                                                        currentLang === 'en' ? '✅ Download Final' : 
                                                        currentLang === 'ja' ? '✅ 最終版ダウンロード' : '✅ 下载最终修图'
                                                    ) : (
                                                        currentLang === 'ko' ? '🔍 보정본 확인하기' : 
                                                        currentLang === 'en' ? '🔍 Check Retouched Photos' : 
                                                        currentLang === 'ja' ? '🔍 リタッチ写真を確認' : '🔍 查看修图'
                                                    )}
                                                </a>

                                                {pStatus === '1차보정완료(피드백요청)' && (
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                        <button 
                                                            onClick={async () => {
                                                                let confirmMsg = '이대로 최종 보정을 완료할까요?';
                                                                if(currentLang === 'en') confirmMsg = 'Do you want to finalize with these photos?';
                                                                if(currentLang === 'ja') confirmMsg = 'このまま最終リタッチを完了しますか？';
                                                                if(currentLang === 'zh') confirmMsg = '确定以此版本作为最终修图吗？';
                                                                
                                                                if(window.confirm(confirmMsg)) {
                                                                    try {
                                                                        await updateDoc(doc(db, 'retouch_masters', loggedInUser.id), {
                                                                            [`projectStatuses.${pId}`]: '최종보정완료'
                                                                        });

                                                                        const adminPhone = '01046961441';
                                                                        const template = getAlimtalkTemplate('UH_5023', {
                                                                            name: loggedInUser.name,
                                                                            projectTitle: pInfo ? pInfo.title : `${loggedInUser.name} 님 촬영`,
                                                                            date: new Date().toLocaleString('ko-KR')
                                                                        });
                                                                        await sendAlimtalk(adminPhone, template.code, template.message, {
                                                                            title: template.title,
                                                                            subtitle: template.subtitle
                                                                        });

                                                                        alert(currentLang === 'ko' ? '컨펌되었습니다!' : currentLang === 'en' ? 'Confirmed!' : currentLang === 'ja' ? '承認されました！' : '已确认！');
                                                                    } catch (err) {
                                                                        console.error("Confirm error:", err);
                                                                        alert('Error processing confirmation.');
                                                                    }
                                                                }
                                                            }}
                                                            style={{ background: '#FF4B4B', color: '#fff', border: 'none', borderRadius: '12px', padding: '16px', fontWeight: 'bold', cursor: 'pointer' }}
                                                        >
                                                            {currentLang === 'ko' ? '👌 컨펌완료 (최종본 요청)' : 
                                                             currentLang === 'en' ? '👌 Confirm Complete' : 
                                                             currentLang === 'ja' ? '👌 承認完了 (最終版をリクエスト)' : '👌 确认完成 (请求最终版)'}
                                                        </button>

                                                        <div style={{ marginTop: '10px' }}>
                                                            <textarea 
                                                                id={`feedback-${pId}`}
                                                                placeholder={
                                                                    currentLang === 'ko' ? "수정 요청 사항을 입력해주세요." : 
                                                                    currentLang === 'en' ? "Enter your feedback for edits." : 
                                                                    currentLang === 'ja' ? "修正依頼事項を入力してください。" : "请输入修改意见。"
                                                                }
                                                                defaultValue={loggedInUser.clientFeedbacks?.[pId] || ''}
                                                                style={{ width: '100%', padding: '16px', borderRadius: '12px', background: '#080B14', color: '#fff', border: '1px solid #2A3649', minHeight: '100px', boxSizing: 'border-box' }}
                                                            />
                                                            <button 
                                                                onClick={async () => {
                                                                    const val = document.getElementById(`feedback-${pId}`).value;
                                                                    if(!val.trim()) return alert(currentLang === 'ko' ? '내용을 입력해주세요.' : currentLang === 'en' ? 'Please enter feedback.' : currentLang === 'ja' ? '内容を入力してください。' : '请输入内容。');
                                                                    
                                                                    try {
                                                                        await updateDoc(doc(db, 'retouch_masters', loggedInUser.id), {
                                                                            [`clientFeedbacks.${pId}`]: val,
                                                                            [`projectStatuses.${pId}`]: '2차수정중'
                                                                        });

                                                                        const adminPhone = '01046961441';
                                                                        const template = getAlimtalkTemplate('UH_5022', {
                                                                            name: loggedInUser.name,
                                                                            projectTitle: pInfo ? pInfo.title : `${loggedInUser.name} 님 촬영`,
                                                                            feedback: val
                                                                        });
                                                                        await sendAlimtalk(adminPhone, template.code, template.message, {
                                                                            title: template.title,
                                                                            subtitle: template.subtitle
                                                                        });

                                                                        alert(currentLang === 'ko' ? '수정 요청이 전달되었습니다.' : currentLang === 'en' ? 'Feedback sent.' : currentLang === 'ja' ? '修正依頼が送信されました。' : '修改意见已提交。');
                                                                    } catch (err) {
                                                                        console.error("Feedback error:", err);
                                                                        alert('Error sending feedback.');
                                                                    }
                                                                }}
                                                                style={{ width: '100%', padding: '12px', borderRadius: '12px', background: '#2A3649', color: '#fff', border: 'none', marginTop: '8px', cursor: 'pointer' }}
                                                            >
                                                                {currentLang === 'ko' ? '작가님께 수정 요청하기' : 
                                                                 currentLang === 'en' ? 'Send Feedback' : 
                                                                 currentLang === 'ja' ? '作家に修正を依頼' : '提交给修图师'}
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {!dbLink && (
                                            <div style={{ textAlign: 'center', padding: '20px', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', color: '#8A9BB3' }}>
                                                {pStatus === '보정중' || pStatus === '2차수정중' ? (
                                                    <p>🎨 {
                                                        currentLang === 'ko' ? '작가가 예쁘게 보정 중입니다...' : 
                                                        currentLang === 'en' ? 'Artist is working on your photos...' : 
                                                        currentLang === 'ja' ? '作家がリタッチ作業中です...' : '修图师正在努力修图中...'
                                                    }</p>
                                                ) : (
                                                    <p>🖌️ {
                                                        currentLang === 'ko' ? '곧 보정 작업이 시작됩니다.' : 
                                                        currentLang === 'en' ? 'Retouching will start soon.' : 
                                                        currentLang === 'ja' ? 'まもなくリタッチ作業が始まります。' : '即将开始修图。'
                                                    }</p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Retouch;
