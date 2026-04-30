import React, { useState, useEffect, useRef } from 'react';
import { collection, query, getDocs, doc, setDoc, getDoc, updateDoc, orderBy, where } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../utils/firebase';
import './SModel.css';

const SModel = () => {
    const [activeTab, setActiveTab] = useState('apply'); // 'apply' | 'archive'
    
    // Global state
    const [projects, setProjects] = useState([]);
    const [defaultProject, setDefaultProject] = useState(null);
    const [loading, setLoading] = useState(false);

    // Apply Form State
    const [applyPhone, setApplyPhone] = useState('');
    const [applyName, setApplyName] = useState('');
    const [applyEmail, setApplyEmail] = useState('');
    const [applyNote, setApplyNote] = useState('');
    const [applyFile, setApplyFile] = useState(null);
    const [applyExistingData, setApplyExistingData] = useState(null);
    const [applyStep, setApplyStep] = useState(1); // 1: Check phone, 2: Fill form
    
    // Archive Login State
    const [loginPhone, setLoginPhone] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [loggedInUser, setLoggedInUser] = useState(null);

    useEffect(() => {
        // Load projects
        const fetchProjects = async () => {
            try {
                const snap = await getDocs(query(collection(db, 'smodel_projects')));
                const pList = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                setProjects(pList);
                const defP = pList.find(p => p.isDefault && p.status === '모집중') || pList[0];
                setDefaultProject(defP);
            } catch (err) {
                console.error("Failed to load projects:", err);
            }
        };
        fetchProjects();
    }, []);

    // --- APPLY TAB LOGIC ---
    const handleCheckPhone = async (e) => {
        e.preventDefault();
        if (!applyPhone || applyPhone.length < 10) {
            alert('정확한 전화번호를 입력해주세요. (예: 01012345678)');
            return;
        }
        setLoading(true);
        try {
            const docRef = doc(db, 'smodel_masters', applyPhone.replace(/-/g, ''));
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                setApplyExistingData(docSnap.data());
                setApplyName(docSnap.data().name);
            } else {
                setApplyExistingData(null);
            }
            setApplyStep(2);
        } catch (err) {
            console.error(err);
            alert('오류가 발생했습니다.');
        }
        setLoading(false);
    };

    const handleApplySubmit = async (e) => {
        e.preventDefault();
        if (!defaultProject) {
            alert('현재 지원 가능한 프로젝트가 없습니다.');
            return;
        }
        if (!applyExistingData && !applyName) {
            alert('이름을 입력해주세요.');
            return;
        }
        if (!applyFile && !applyExistingData) {
            alert('최근 사진을 업로드해주세요.');
            return;
        }

        setLoading(true);
        try {
            const phoneId = applyPhone.replace(/-/g, '');
            let photoUrl = applyExistingData?.latestSelfie || '';
            
            if (applyFile) {
                const storageRef = ref(storage, `smodel/${phoneId}/${Date.now()}_${applyFile.name}`);
                const snapshot = await uploadBytes(storageRef, applyFile);
                photoUrl = await getDownloadURL(snapshot.ref);
            }

            if (applyExistingData) {
                // Update existing
                const updatedHistory = Array.from(new Set([...(applyExistingData.projectHistory || []), defaultProject.id]));
                await updateDoc(doc(db, 'smodel_masters', phoneId), {
                    latestSelfie: photoUrl,
                    projectHistory: updatedHistory,
                    [`projectNotes.${defaultProject.id}`]: applyNote,
                    updatedAt: Date.now()
                });
            } else {
                // Create new
                await setDoc(doc(db, 'smodel_masters', phoneId), {
                    id: phoneId,
                    phone: phoneId,
                    name: applyName,
                    email: applyEmail,
                    password: phoneId.slice(-4),
                    latestSelfie: photoUrl,
                    projectHistory: [defaultProject.id],
                    dropboxArchives: {},
                    projectStatuses: { [defaultProject.id]: '입금대기' },
                    projectNotes: { [defaultProject.id]: applyNote },
                    createdAt: Date.now()
                });
            }
            // Move to success step instead of resetting immediately
            setApplyStep(3);
        } catch (err) {
            console.error(err);
            alert('지원 처리 중 오류가 발생했습니다.');
        }
        setLoading(false);
    };

    // --- ARCHIVE TAB LOGIC ---
    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const phoneId = loginPhone.replace(/-/g, '');
            const docRef = doc(db, 'smodel_masters', phoneId);
            const docSnap = await getDoc(docRef);
            
            if (docSnap.exists() && docSnap.data().password === loginPassword) {
                setLoggedInUser(docSnap.data());
            } else {
                alert('전화번호 또는 비밀번호가 일치하지 않습니다.');
            }
        } catch (err) {
            console.error(err);
            alert('로그인 오류');
        }
        setLoading(false);
    };

    return (
        <div className="smodel-container">
            <div className="smodel-header">
                <h2>SENIOR MODEL</h2>
                <div className="smodel-tabs">
                    <button className={activeTab === 'apply' ? 'active' : ''} onClick={() => setActiveTab('apply')}>프로젝트 지원</button>
                    <button className={activeTab === 'archive' ? 'active' : ''} onClick={() => setActiveTab('archive')}>나만의 앨범 (로그인)</button>
                </div>
            </div>

            <div className="smodel-content">
                {activeTab === 'apply' && (
                    <div className="smodel-section apply-section">
                        <h3>{defaultProject ? `[${defaultProject.id}] ` : ''}시니어 모델 사진촬영 지원하기</h3>
                        <p className="smodel-subtitle">{defaultProject ? `현재 모집중: ${defaultProject.title}` : '현재 진행 중인 프로젝트를 불러오는 중입니다.'}</p>
                        
                        {applyStep === 1 && (
                            <form onSubmit={handleCheckPhone} className="smodel-form">
                                <div className="form-group">
                                    <label>전화번호 (Phone Number)</label>
                                    <input 
                                        type="tel" 
                                        placeholder="01012345678" 
                                        value={applyPhone} 
                                        onChange={(e) => setApplyPhone(e.target.value)} 
                                        required 
                                    />
                                    <small>기존 지원 내역이 있는지 확인합니다.</small>
                                </div>
                                <button type="submit" className="smodel-btn" disabled={loading || !defaultProject}>
                                    {loading ? '확인 중...' : '다음 단계'}
                                </button>
                            </form>
                        )}

                        {applyStep === 2 && (
                            <form onSubmit={handleApplySubmit} className="smodel-form">
                                {applyExistingData && (
                                    <div className="existing-notice">
                                        <p><strong>{applyExistingData.name}</strong>님, 기존 등록 정보가 확인되었습니다!</p>
                                        <p>이번 시즌을 위한 새로운 사진만 업데이트해 주세요.</p>
                                    </div>
                                )}
                                
                                <div className="form-group">
                                    <label>이름 (Name)</label>
                                    <input 
                                        type="text" 
                                        value={applyName} 
                                        onChange={(e) => setApplyName(e.target.value)} 
                                        disabled={!!applyExistingData}
                                        required 
                                    />
                                </div>

                                {!applyExistingData && (
                                    <div className="form-group">
                                        <label>이메일 (Email - 선택)</label>
                                        <input 
                                            type="email" 
                                            value={applyEmail} 
                                            onChange={(e) => setApplyEmail(e.target.value)} 
                                        />
                                    </div>
                                )}

                                <div className="form-group">
                                    <label>최근 사진 (Latest Selfie) *</label>
                                    <input 
                                        type="file" 
                                        accept="image/*" 
                                        onChange={(e) => setApplyFile(e.target.files[0])} 
                                        required={!applyExistingData} 
                                    />
                                </div>

                                <div className="form-group">
                                    <label>비고 (Note - 선택)</label>
                                    <textarea 
                                        placeholder="요청사항이나 전달하실 내용을 자유롭게 적어주세요." 
                                        value={applyNote} 
                                        onChange={(e) => setApplyNote(e.target.value)} 
                                        rows={4}
                                        style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #333', background: '#111', color: '#fff', boxSizing: 'border-box' }}
                                    />
                                </div>

                                <div className="btn-group">
                                    <button type="button" className="smodel-btn cancel" onClick={() => setApplyStep(1)}>뒤로 가기</button>
                                    <button type="submit" className="smodel-btn" disabled={loading}>
                                        {loading ? '처리 중...' : '지원 완료하기'}
                                    </button>
                                </div>
                            </form>
                        )}

                        {applyStep === 3 && (
                            <div className="smodel-form success-screen" style={{ textAlign: 'center', padding: '40px 20px', background: '#080B14', borderRadius: '16px', border: '1px solid #2A3649' }}>
                                <h3 style={{ color: '#00D4B6', marginBottom: '16px', fontSize: '1.5rem' }}>지원이 완료되었습니다! 🎉</h3>
                                <p style={{ marginBottom: '24px', lineHeight: '1.6', color: '#E2E8F0' }}>
                                    참여 확정을 위해 아래 계좌로 입금을 부탁드립니다.<br/>
                                    입금이 확인되면 관리자가 '입금확인' 상태로 변경해 드립니다.
                                </p>
                                <div style={{ background: '#111827', padding: '32px 24px', borderRadius: '12px', marginBottom: '32px', border: '1px solid #1F2937', width: '100%', boxSizing: 'border-box' }}>
                                    <p style={{ margin: '0 0 12px', color: '#8A9BB3', fontSize: '1rem' }}>입금 계좌</p>
                                    <h4 style={{ margin: '0', fontSize: '1.6rem', letterSpacing: '1px', color: '#fff', fontWeight: 'bold' }}>국민은행 94696144160</h4>
                                    <p style={{ margin: '12px 0 0', fontSize: '1.2rem', fontWeight: 'bold', color: '#00D4B6' }}>예금주: 신철민</p>
                                </div>
                                <button 
                                    className="smodel-btn" 
                                    onClick={() => {
                                        setApplyStep(1);
                                        setApplyPhone('');
                                        setApplyName('');
                                        setApplyEmail('');
                                        setApplyNote('');
                                        setApplyFile(null);
                                        setApplyExistingData(null);
                                    }}
                                >
                                    확인 및 처음으로 돌아가기
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'archive' && (
                    <div className="smodel-section archive-section">
                        {!loggedInUser ? (
                            <div className="login-box">
                                <h3>나만의 촬영 앨범</h3>
                                <p className="smodel-subtitle">등록된 전화번호와 비밀번호(전화번호 뒤 4자리)로 로그인하세요.</p>
                                <form onSubmit={handleLogin} className="smodel-form">
                                    <div className="form-group">
                                        <label>전화번호</label>
                                        <input type="tel" value={loginPhone} onChange={(e) => setLoginPhone(e.target.value)} placeholder="01012345678" required />
                                    </div>
                                    <div className="form-group">
                                        <label>비밀번호</label>
                                        <input type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} placeholder="전화번호 뒤 4자리" required />
                                    </div>
                                    <button type="submit" className="smodel-btn" disabled={loading}>
                                        {loading ? '로그인 중...' : '로그인'}
                                    </button>
                                </form>
                            </div>
                        ) : (
                            <div className="dashboard-box">
                                <h3>{loggedInUser.name}님의 아카이브</h3>
                                <div className="history-list">
                                    {loggedInUser.projectHistory?.length > 0 ? (
                                        loggedInUser.projectHistory.map(pId => {
                                            const pInfo = projects.find(p => p.id === pId);
                                            const dbLink = loggedInUser.dropboxArchives?.[pId];
                                            const pStatus = loggedInUser.projectStatuses?.[pId] || '입금대기';
                                            return (
                                                <div key={pId} className="history-item">
                                                    <div className="history-info">
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            <span className="history-code">{pId}</span>
                                                            <span style={{ 
                                                                background: pStatus === '입금대기' ? '#FF4D4D' : '#00D4B6', 
                                                                color: pStatus === '입금대기' ? '#fff' : '#080B14', 
                                                                padding: '4px 8px', 
                                                                borderRadius: '4px', 
                                                                fontSize: '0.85rem', 
                                                                fontWeight: 'bold' 
                                                            }}>
                                                                {pStatus}
                                                            </span>
                                                        </div>
                                                        <span className="history-title">{pInfo ? pInfo.title : '프로젝트 정보 없음'}</span>
                                                        
                                                        {pStatus === '입금대기' && (
                                                            <div style={{ 
                                                                marginTop: '16px', 
                                                                padding: '20px', 
                                                                background: '#111827', 
                                                                borderRadius: '12px', 
                                                                border: '1px solid #1F2937',
                                                                width: '100%',
                                                                boxSizing: 'border-box'
                                                            }}>
                                                                <p style={{ margin: '0', color: '#8A9BB3', fontSize: '0.9rem' }}>입금 계좌 안내</p>
                                                                <p style={{ margin: '8px 0', color: '#fff', fontWeight: 'bold', fontSize: '1.4rem', letterSpacing: '0.5px' }}>국민은행 94696144160</p>
                                                                <p style={{ margin: '0', color: '#00D4B6', fontWeight: 'bold', fontSize: '1.1rem' }}>신철민</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="history-action">
                                                        {dbLink && pStatus === '보정완료' ? (
                                                            <a href={dbLink} target="_blank" rel="noopener noreferrer" className="smodel-btn small">
                                                                최종 완성본 보기 (Dropbox)
                                                            </a>
                                                        ) : (
                                                            <span className="waiting-text">
                                                                {dbLink && pStatus !== '보정완료' ? '보정 작업이 진행 중입니다' : '업데이트 대기중'}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <p>참여한 프로젝트 이력이 없습니다.</p>
                                    )}
                                </div>
                                <button className="smodel-btn logout" onClick={() => setLoggedInUser(null)}>로그아웃</button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SModel;
