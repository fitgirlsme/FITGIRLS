import React, { useState, useEffect } from 'react';
import { db } from '../../utils/firebase';
import { collection, query, getDocs, doc, setDoc, updateDoc, orderBy } from 'firebase/firestore';
import { sendAlimtalk, getAlimtalkTemplate } from '../../utils/aligoService';
import './RetouchAdminTab.css';

const RetouchAdminTab = () => {
    const [projects, setProjects] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(false);
    
    // Form State
    const [cName, setCName] = useState('');
    const [cPhone, setCPhone] = useState('');
    const [cProject, setCProject] = useState('');

    // Filter State
    const [filterProject, setFilterProject] = useState('ALL');
    const [filterStatus, setFilterStatus] = useState('ALL');
    
    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const customersPerPage = 15;

    const statuses = ['보정대기', '보정중', '1차보정완료(피드백요청)', '2차수정중', '최종보정완료'];

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const pSnap = await getDocs(collection(db, 'retouch_projects'));
            const pList = pSnap.docs.map(d => ({ id: d.id, ...d.data() }));
            setProjects(pList);

            const cSnap = await getDocs(collection(db, 'retouch_masters'));
            const cList = cSnap.docs.map(d => ({ id: d.id, ...d.data() }));
            // Manual sort since Firestore index might not be ready
            cList.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
            setCustomers(cList);
        } catch (err) {
            console.error("LOAD_DATA_ERROR:", err);
        }
        setLoading(false);
    };

    const handleRegisterCustomer = async (e) => {
        e.preventDefault();
        if (!cName || !cPhone || !cProject) return;
        const cId = cPhone.replace(/-/g, '');
        try {
            // 1. Check if project exists, if not create it
            const projectExists = projects.some(p => p.id === cProject);
            if (!projectExists) {
                await setDoc(doc(db, 'retouch_projects', cProject), {
                    title: `${cName} 님 촬영`,
                    createdAt: Date.now()
                });
            }

            // 2. Register/Update Customer
            const docRef = doc(db, 'retouch_masters', cId);
            const docSnap = customers.find(c => c.id === cId);
            
            const existingHistory = docSnap?.projectHistory || [];
            const existingStatuses = docSnap?.projectStatuses || {};
            
            await setDoc(docRef, {
                name: cName,
                phone: cPhone,
                projectHistory: Array.from(new Set([...existingHistory, cProject])),
                projectStatuses: { ...existingStatuses, [cProject]: existingStatuses[cProject] || '보정대기' },
                updatedAt: Date.now(),
                createdAt: docSnap?.createdAt || Date.now()
            }, { merge: true });
            
            setCName(''); setCPhone('');
            alert('등록 완료!');
            await loadData();
        } catch (err) {
            console.error("REGISTER_ERROR:", err);
            alert(`등록 중 오류가 발생했습니다: ${err.message}`);
        }
    };

    const handleUpdateDropbox = async (customerId, projectId, link) => {
        try {
            await updateDoc(doc(db, 'retouch_masters', customerId), {
                [`dropboxArchives.${projectId}`]: link
            });
        } catch (err) {
            console.error(err);
        }
    };

    const handleUpdateStatus = async (customerId, projectId, status) => {
        try {
            await updateDoc(doc(db, 'retouch_masters', customerId), {
                [`projectStatuses.${projectId}`]: status
            });
            alert('상태 변경 완료');
            loadData();
        } catch (err) {
            console.error(err);
        }
    };

    const handleSendAlimtalk = async (customer, projectTitle, status) => {
        const { name, phone, id: customerId } = customer;
        const link = customer.dropboxArchives?.[projectTitle] || '';

        // Determine template type based on status
        let type = '';
        if (status.includes('1차보정완료')) type = 'UH_5021';
        else if (status.includes('최종보정완료')) type = 'UH_5403';
        else if (status.includes('보정대기')) type = 'UH_5024'; // Fallback for testing or initial shoot

        if (!type) {
            alert(`[${status}] 상태에 매칭되는 알림톡 템플릿이 없습니다.`);
            return;
        }

        const template = getAlimtalkTemplate(type, { 
            name, 
            phone, 
            projectTitle, 
            link,
            feedback: customer.clientFeedbacks?.[projectTitle],
            date: new Date().toLocaleString()
        });
        if (!template) return;

        if (!confirm(`${name}님께 [${template.code}] 알림톡을 발송하시겠습니까?`)) return;

        try {
            const result = await sendAlimtalk(phone, template.code, template.message, {
                button: template.button,
                title: template.title,
                subtitle: template.subtitle
            });
            if (result.success) {
                alert('알림톡 발송 성공!');
            } else {
                alert(`발송 실패: ${result.error}\n\n(템플릿 문구가 정확히 일치하는지 확인해 주세요.)`);
            }
        } catch (err) {
            alert('발송 중 오류 발생: ' + err.message);
        }
    };

    const filteredCustomers = customers.filter(c => {
        let passP = filterProject === 'ALL' || (c.projectHistory && c.projectHistory.includes(filterProject));
        if (!passP) return false;
        if (filterStatus === 'ALL') return true;
        if (filterProject !== 'ALL') return c.projectStatuses?.[filterProject] === filterStatus;
        return c.projectStatuses && Object.values(c.projectStatuses).includes(filterStatus);
    });

    const indexOfLast = currentPage * customersPerPage;
    const indexOfFirst = indexOfLast - customersPerPage;
    const currentCustomers = filteredCustomers.slice(indexOfFirst, indexOfLast);
    const totalPages = Math.ceil(filteredCustomers.length / customersPerPage);

    useEffect(() => { setCurrentPage(1); }, [filterProject, filterStatus]);

    const [visiblePhones, setVisiblePhones] = useState({});

    const togglePhoneVisibility = (id) => {
        setVisiblePhones(prev => ({ ...prev, [id]: !prev[id] }));
    };

    return (
        <div className="retouch-admin-theme">
            <h3>FITGIRLS & INAFIT</h3>
            
            <div className="retouch-admin-card" style={{ marginBottom: '32px', maxWidth: '800px' }}>
                <h4>신규 보정 등록</h4>
                <p style={{ fontSize: '0.9rem', color: '#888', marginBottom: '16px' }}>
                    * 촬영일(코드)을 입력하면 프로젝트가 자동으로 생성됩니다. 2인 촬영 시 동일한 촬영일을 입력해 주세요.
                </p>
                <form onSubmit={handleRegisterCustomer} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr 1.5fr', gap: '12px' }}>
                        <div className="form-group">
                            <label>촬영일</label>
                            <input type="text" value={cProject} onChange={e=>setCProject(e.target.value)} placeholder="YYMMDD" required />
                        </div>
                        <div className="form-group">
                            <label>고객명</label>
                            <input type="text" value={cName} onChange={e=>setCName(e.target.value)} placeholder="이름" required />
                        </div>
                        <div className="form-group">
                            <label>연락처</label>
                            <input type="text" value={cPhone} onChange={e=>setCPhone(e.target.value)} placeholder="010-0000-0000" required />
                        </div>
                    </div>
                    <button type="submit" className="retouch-admin-btn" style={{ background: '#00D4B6', height: '48px', width: '100%', fontSize: '1rem', fontWeight: 'bold' }}>신규 보정 등록하기</button>
                </form>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h4>고객 보정 관리</h4>
                <select value={filterProject} onChange={e => setFilterProject(e.target.value)} style={{ width: 'auto' }}>
                    <option value="ALL">전체 프로젝트</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.id} ({p.title})</option>)}
                </select>
            </div>

            <div className="retouch-admin-tabs">
                {['ALL', ...statuses].map(status => (
                    <button key={status} className={`retouch-admin-tab ${filterStatus === status ? 'active' : ''}`} onClick={() => setFilterStatus(status)}>
                        {status} ({
                            customers.filter(c => {
                                let passP = filterProject === 'ALL' || (c.projectHistory && c.projectHistory.includes(filterProject));
                                if (!passP) return false;
                                if (status === 'ALL') return true;
                                if (filterProject !== 'ALL') return c.projectStatuses?.[filterProject] === status;
                                return c.projectStatuses && Object.values(c.projectStatuses).includes(status);
                            }).length
                        })
                    </button>
                ))}
            </div>

            <div className="retouch-admin-list">
                {currentCustomers.map(c => (
                    <div key={c.id} className="retouch-admin-list-item">
                        <div className="retouch-admin-info">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
                                <div className="retouch-admin-name" style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{c.name}</div>
                                <div className="retouch-admin-contact" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#888' }}>
                                    {visiblePhones[c.id] ? c.phone : '010-****-****'}
                                    <button 
                                        onClick={() => togglePhoneVisibility(c.id)} 
                                        style={{ padding: '2px 8px', fontSize: '0.7rem', background: '#444', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                    >
                                        {visiblePhones[c.id] ? '숨기기' : '보기'}
                                    </button>
                                </div>
                            </div>
                            
                            <div className="retouch-admin-archive-box">
                                {c.projectHistory?.map(pId => {
                                    const pInfo = projects.find(p => p.id === pId) || {};
                                    const currentStatus = c.projectStatuses?.[pId] || '보정대기';
                                    const currentLink = c.dropboxArchives?.[pId] || '';
                                    return (
                                        <div key={pId} className="retouch-admin-archive-row" style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', marginBottom: '8px' }}>
                                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                                                <span style={{ width: '80px', fontWeight: 'bold', color: '#00D4B6' }}>{pId}</span>
                                                <div style={{ display: 'flex', gap: '4px' }}>
                                                    <input 
                                                        id={`date-${c.id}-${pId}`}
                                                        type="text" 
                                                        placeholder="보정요청일" 
                                                        defaultValue={c.requestDates?.[pId] || ''} 
                                                        style={{ width: '100px' }} 
                                                        onKeyDown={(e) => { if(e.key === 'Enter') document.getElementById(`save-date-${c.id}-${pId}`).click(); }}
                                                    />
                                                    <button 
                                                        id={`save-date-${c.id}-${pId}`}
                                                        className="retouch-admin-btn secondary" 
                                                        style={{ padding: '4px 8px', fontSize: '0.7rem' }}
                                                        onClick={() => {
                                                            const val = document.getElementById(`date-${c.id}-${pId}`).value;
                                                            updateDoc(doc(db, 'retouch_masters', c.id), { [`requestDates.${pId}`]: val });
                                                            alert('날짜 저장됨');
                                                        }}
                                                    >저장</button>
                                                </div>
                                                <select value={currentStatus} onChange={(e) => handleUpdateStatus(c.id, pId, e.target.value)} style={{ width: '180px' }}>
                                                    {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                                                </select>
                                                <button className="retouch-admin-btn secondary" onClick={() => handleSendAlimtalk(c, pId, currentStatus)} style={{ marginLeft: 'auto' }}>알림톡 발송</button>
                                            </div>
                                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                <label style={{ fontSize: '0.8rem', color: '#888', whiteSpace: 'nowrap' }}>드롭박스:</label>
                                                <input 
                                                    id={`link-${c.id}-${pId}`}
                                                    type="url" 
                                                    placeholder="여기에 Dropbox 링크를 입력하세요" 
                                                    defaultValue={currentLink} 
                                                    style={{ flex: '1' }} 
                                                    onKeyDown={(e) => { if(e.key === 'Enter') document.getElementById(`save-link-${c.id}-${pId}`).click(); }}
                                                />
                                                <button 
                                                    id={`save-link-${c.id}-${pId}`}
                                                    className="retouch-admin-btn" 
                                                    style={{ padding: '8px 16px', background: '#333' }}
                                                    onClick={() => {
                                                        const val = document.getElementById(`link-${c.id}-${pId}`).value;
                                                        handleUpdateDropbox(c.id, pId, val);
                                                        alert('링크 저장됨');
                                                    }}
                                                >저장하기</button>
                                            </div>
                                            {c.clientFeedbacks?.[pId] && (
                                                <div style={{ marginTop: '12px', padding: '12px', background: 'rgba(255, 75, 75, 0.1)', borderRadius: '8px', borderLeft: '3px solid #FF4B4B' }}>
                                                    <div style={{ fontSize: '0.8rem', color: '#FF4B4B', fontWeight: 'bold', marginBottom: '4px' }}>⚠️ 고객 수정 요청 사항:</div>
                                                    <div style={{ fontSize: '0.9rem', color: '#fff', whiteSpace: 'pre-wrap' }}>
                                                        {c.clientFeedbacks[pId]}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '24px' }}>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                        <button key={n} onClick={() => setCurrentPage(n)} className={`retouch-admin-tab ${currentPage === n ? 'active' : ''}`} style={{ width: '40px', padding: '8px' }}>{n}</button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default RetouchAdminTab;
