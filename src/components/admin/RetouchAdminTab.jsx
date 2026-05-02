import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, doc, getDoc, updateDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../../utils/firebase';
import './RetouchAdminTab.css';
import { getAlimtalkTemplate, sendAlimtalk } from '../../utils/aligoService';

const RetouchAdminTab = () => {
    const [customers, setCustomers] = useState([]);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    
    const [cName, setCName] = useState('');
    const [cPhone, setCPhone] = useState('');
    const [cProject, setCProject] = useState('');
    const [cConcept, setCConcept] = useState('1컨셉');
    const todayStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    const [cRequestDate, setCRequestDate] = useState(todayStr);

    const [filterStatus, setFilterStatus] = useState('ALL');
    const [filterProject, setFilterProject] = useState('ALL');
    const [searchTerm, setSearchTerm] = useState('');
    const [showInstaOnly, setShowInstaOnly] = useState(false);
    const [visiblePhones, setVisiblePhones] = useState({});

    const statuses = ['보정대기', '선보정(당일보정)', '보정중', '1차보정완료(피드백요청)', '2차보정', '최종컴펌완료', '최종보정완료'];

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const mSnap = await getDocs(query(collection(db, 'retouch_masters')));
            const mList = mSnap.docs.map(d => ({ id: d.id, ...d.data() }));
            setCustomers(mList);

            const pSnap = await getDocs(query(collection(db, 'retouch_projects')));
            const pList = pSnap.docs.map(d => ({ id: d.id, ...d.data() }));
            setProjects(pList.sort((a,b) => b.id.localeCompare(a.id)));
        } catch (err) { console.error(err); }
        setLoading(false);
    };

    const getRetouchCount = (concept) => {
        const counts = { '1컨셉': 2, '2컨셉': 4, '3컨셉': 6, '우정패키지1': 6, '우정패키지2': 10 };
        return counts[concept] || 0;
    };

    const parseYYMMDD = (dateStr) => {
        if (!dateStr) return null;
        const str = String(dateStr).replace(/[^0-9]/g, '');
        if (str.length !== 6) return null;
        let yy = parseInt(str.substring(0, 2));
        const mm = parseInt(str.substring(2, 4)) - 1;
        const dd = parseInt(str.substring(4, 6));
        if (yy < 20) yy = 26; 
        return new Date(2000 + yy, mm, dd);
    };

    const formatDate = (dateStr) => {
        const d = parseYYMMDD(dateStr);
        if (!d) return dateStr;
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}. ${month}. ${day}`;
    };

    const getDaysPassed = (dateStr) => {
        const targetDate = parseYYMMDD(dateStr);
        if (!targetDate || isNaN(targetDate.getTime())) return null;
        const today = new Date();
        today.setHours(0,0,0,0);
        targetDate.setHours(0,0,0,0);
        const diffTime = today - targetDate;
        return Math.floor(diffTime / (1000 * 60 * 60 * 24));
    };

    const handleRegisterCustomer = async (e) => {
        e.preventDefault();
        if (!cProject || !cName || !cPhone) return alert('모든 필드를 입력해주세요.');
        const phoneId = cPhone.replace(/[^0-9]/g, '');
        const pId = cProject.trim();
        const count = getRetouchCount(cConcept);
        try {
            const pRef = doc(db, 'retouch_projects', pId);
            if (!(await getDoc(pRef)).exists()) {
                await setDoc(pRef, { title: `${pId} 촬영`, createdAt: new Date().toISOString() });
            }
            const cRef = doc(db, 'retouch_masters', phoneId);
            const cSnap = await getDoc(cRef);
            let finalReqDate = cRequestDate;
            if (cRequestDate.startsWith('0')) finalReqDate = '26' + cRequestDate.substring(2);
            if (cSnap.exists()) {
                const data = cSnap.data();
                const history = data.projectHistory || [];
                const updates = {
                    projectHistory: history.includes(pId) ? history : [...history, pId],
                    [`projectStatuses.${pId}`]: '보정대기',
                    [`projectConcepts.${pId}`]: cConcept,
                    [`projectBaseRetouchCounts.${pId}`]: count,
                    [`requestDates.${pId}`]: finalReqDate
                };
                if (!data.password) updates.password = phoneId.slice(-4);
                await updateDoc(cRef, updates);
            } else {
                await setDoc(cRef, {
                    name: cName, phone: cPhone, password: phoneId.slice(-4),
                    projectHistory: [pId],
                    projectStatuses: { [pId]: '보정대기' },
                    projectConcepts: { [pId]: cConcept },
                    projectBaseRetouchCounts: { [pId]: count },
                    requestDates: { [pId]: finalReqDate },
                    instaConsents: {}, reviewConsents: {}, dropboxArchives: {}, clientFeedbacks: {}
                });
            }
            alert('등록 완료!'); setCName(''); setCPhone(''); setCProject(''); setCRequestDate(todayStr); loadData();
        } catch (err) { console.error(err); alert(`오류: ${err.message}`); }
    };

    const handleUpdateDropbox = async (customerId, projectId, link) => {
        try { await updateDoc(doc(db, 'retouch_masters', customerId), { [`dropboxArchives.${projectId}`]: link }); } catch (err) { console.error(err); }
    };

    const handleUpdateStatus = async (customerId, projectId, status) => {
        try {
            await updateDoc(doc(db, 'retouch_masters', customerId), { [`projectStatuses.${projectId}`]: status });
            alert('상태 변경 완료'); loadData();
        } catch (err) { console.error(err); }
    };

    const handleSendAlimtalk = async (customer, projectTitle, status) => {
        const { name, phone } = customer;
        const link = customer.dropboxArchives?.[projectTitle] || '';
        let type = '';
        
        // 상태값에 따른 템플릿 타입 매칭 (명칭 통일화 반영)
        if (status.includes('1차보정완료')) type = 'UH_5021';
        else if (status.includes('최종보정완료')) type = 'UH_5403';
        else if (status.includes('보정대기')) type = 'UH_5024';

        if (!type) { 
            alert(`매칭된 템플릿이 없습니다. (현재 상태: ${status})`); 
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

        if (!template) {
            alert('템플릿 데이터를 생성할 수 없습니다.');
            return;
        }

        try {
            const res = await sendAlimtalk(phone, template.code, template.message, { 
                title: template.title, 
                subtitle: template.subtitle, 
                button: template.button 
            });

            if (res.success) {
                alert('알림톡 전송 요청 완료 (알리고 접수됨)');
            } else {
                // 상세 에러 메시지 표시
                alert(`알림톡 발송 실패\n- 사유: ${res.error || '알 수 없는 오류'}\n- 템플릿: ${type}`);
                console.error('ALIMTALK_FAIL_DETAIL:', res);
            }
        } catch (err) {
            console.error('ALIMTALK_ERROR:', err);
            alert(`시스템 오류: ${err.message}`);
        }
    };

    const handleTogglePreRetouch = async (customer, projectId, isChecked) => {
        if (isChecked && !window.confirm('고객에게 선보정 전송 알림톡을 발송하시겠습니까?')) return;
        
        try {
            await updateDoc(doc(db, 'retouch_masters', customer.id), {
                [`preRetouchSent.${projectId}`]: isChecked
            });
            
            if (isChecked) {
                const type = 'UH_5710';
                const template = getAlimtalkTemplate(type, { 
                    name: customer.name, 
                    phone: customer.phone, 
                    projectTitle: projectId,
                    link: customer.dropboxArchives?.[projectId] || '',
                    date: new Date().toLocaleString()
                });
                
                if (template) {
                    const res = await sendAlimtalk(customer.phone, template.code, template.message, { 
                        title: template.title, 
                        subtitle: template.subtitle, 
                        button: template.button 
                    });
                    if (res.success) alert('선보정 알림톡 발송 완료');
                    else alert(`알림톡 발송 실패: ${res.error}`);
                }
            }
            loadData();
        } catch (err) {
            console.error(err);
            alert('데이터 업데이트 중 오류가 발생했습니다.');
        }
    };

    const handleUpdateExtraCount = async (customerId, projectId, count) => {
        try { await updateDoc(doc(db, 'retouch_masters', customerId), { [`projectExtraRetouchCounts.${projectId}`]: parseInt(count) || 0 }); } catch (err) { console.error(err); }
    };

    const handleUpdateDate = async (customerId, projectId, date) => {
        let finalDate = date;
        if (date.startsWith('0')) finalDate = '26' + date.substring(2);
        try { await updateDoc(doc(db, 'retouch_masters', customerId), { [`requestDates.${projectId}`]: finalDate }); alert('업데이트 완료'); loadData(); } catch (err) { console.error(err); }
    };

    const handleUpdateFeedback = async (customerId, projectId, feedback) => {
        try { 
            await updateDoc(doc(db, 'retouch_masters', customerId), { [`clientFeedbacks.${projectId}`]: feedback }); 
            loadData();
        } catch (err) { console.error(err); }
    };

    const handleUpdateConcept = async (customerId, projectId, concept) => {
        if (!concept) return;
        try {
            await updateDoc(doc(db, 'retouch_masters', customerId), { [`projectConcepts.${projectId}`]: concept, [`projectBaseRetouchCounts.${projectId}`]: getRetouchCount(concept) });
            loadData();
        } catch (err) { console.error(err); }
    };

    const currentCustomers = customers.filter(c => {
        const passStatus = filterStatus === 'ALL' || (c.projectStatuses && Object.values(c.projectStatuses).includes(filterStatus));
        const passProject = filterProject === 'ALL' || (c.projectHistory && c.projectHistory.includes(filterProject));
        const passSearch = !searchTerm || (c.name && c.name.toLowerCase().includes(searchTerm.toLowerCase()));
        const passInsta = !showInstaOnly || (filterProject !== 'ALL' ? c.instaConsents?.[filterProject] : c.projectHistory?.some(pId => c.instaConsents?.[pId]));
        return passStatus && passProject && passSearch && passInsta;
    });

    return (
        <div className="retouch-admin-container">
            <div className="retouch-admin-header">
                <div className="header-left">
                    <h2 className="admin-logo">RETOUCH <span>ADMIN</span></h2>
                </div>
                <div className="header-right">
                    <div className="search-container">
                        <span className="search-icon">🔍</span>
                        <input 
                            type="text" 
                            placeholder="이름 검색..." 
                            value={searchTerm} 
                            onChange={e => setSearchTerm(e.target.value)} 
                            className="name-search-input"
                        />
                    </div>
                </div>
            </div>

            <div className="admin-content-inner">
                <div className="admin-card reg-card">
                    <h4 className="card-label">신규 프로젝트 등록</h4>
                    <form onSubmit={handleRegisterCustomer} className="reg-form-flex">
                        <input type="text" value={cProject} onChange={e=>setCProject(e.target.value)} placeholder="날짜(YYMMDD)" required />
                        <input type="text" value={cName} onChange={e=>setCName(e.target.value)} placeholder="이름" required />
                        <input type="text" value={cPhone} onChange={e=>setCPhone(e.target.value)} placeholder="연락처" required />
                        <div className="date-input-group">
                            <input type="text" value={cRequestDate} onChange={e=>setCRequestDate(e.target.value)} placeholder="보정요청일(YYMMDD)" required />
                            <small>{formatDate(cRequestDate)}</small>
                        </div>
                        <select value={cConcept} onChange={e => setCConcept(e.target.value)}>
                            <option value="1컨셉">1컨셉 (2장)</option>
                            <option value="2컨셉">2컨셉 (4장)</option>
                            <option value="3컨셉">3컨셉 (6장)</option>
                            <option value="우정패키지1">우정1 (6장)</option>
                            <option value="우정패키지2">우정2 (10장)</option>
                        </select>
                        <button type="submit" className="btn-primary">등록</button>
                    </form>
                </div>

                <div className="status-tab-row">
                    {['ALL', ...statuses].map(s => {
                        let statusClass = "";
                        if (s.includes('보정대기')) statusClass = "status-waiting";
                        else if (s.includes('선보정')) statusClass = "status-pre-retouch";
                        else if (s.includes('보정중')) statusClass = "status-processing";
                        else if (s.includes('1차보정완료')) statusClass = "status-1st-done";
                        else if (s.includes('2차보정')) statusClass = "status-2nd-processing";
                        else if (s.includes('최종컴펌완료')) statusClass = "status-confirm";
                        else if (s.includes('최종보정완료')) statusClass = "status-final-done";

                        return (
                            <button 
                                key={s} 
                                onClick={() => setFilterStatus(s)} 
                                className={`tab-btn ${filterStatus === s ? 'active' : ''} ${statusClass}`}
                            >
                                {s.replace('(피드백요청)', '')}
                            </button>
                        );
                    })}
                </div>

                <div className="insta-toggle" onClick={() => setShowInstaOnly(!showInstaOnly)}>
                    <div className={`checkbox ${showInstaOnly ? 'checked' : ''}`}></div>
                    <span>인스타 동의자만 보기</span>
                </div>

                <div className="admin-list-grid">
                    {currentCustomers.map(c => (
                        <div key={c.id} className="admin-card customer-card">
                            <div className="customer-header">
                                <div className="c-info">
                                    <span className="c-name">{c.name}</span>
                                    <span className="c-phone">{visiblePhones[c.id] ? c.phone : '010-****-****'}</span>
                                    <button className="btn-text" onClick={() => setVisiblePhones(p => ({ ...p, [c.id]: !p[c.id] }))}>{visiblePhones[c.id] ? '숨기기' : '보기'}</button>
                                    
                                    {c.instaIds && Object.values(c.instaIds).some(id => id) && (
                                        <span className="c-insta-id-header">
                                            📸 {Array.from(new Set(Object.values(c.instaIds).filter(id => id))).map(id => id.startsWith('@') ? id : `@${id}`).join(', ')}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="project-stack">
                                {c.projectHistory?.slice().reverse().map(pId => {
                                    const status = c.projectStatuses?.[pId] || '보정대기';
                                    const base = c.projectBaseRetouchCounts?.[pId] || 0;
                                    const bonus = (c.instaConsents?.[pId] ? 1 : 0) + (c.reviewConsents?.[pId] ? 1 : 0);
                                    const extra = c.projectExtraRetouchCounts?.[pId] || 0;
                                    const requestDate = c.requestDates?.[pId] || '';
                                    const statusClass = 
                                        status.includes('보정대기') ? 'status-waiting' :
                                        status.includes('선보정') ? 'status-pre-retouch' :
                                        status.includes('보정중') ? 'status-processing' :
                                        status.includes('1차보정완료') ? 'status-1st-done' :
                                        status.includes('2차보정') ? 'status-2nd-processing' :
                                        status.includes('최종컴펌완료') ? 'status-confirm' :
                                        status.includes('최종보정완료') ? 'status-final-done' : '';
                                    
                                    const daysPassed = getDaysPassed(requestDate);

                                    return (
                                        <div key={pId} className={`project-item-box ${statusClass} ${status === '최종보정완료' ? 'completed' : ''}`}>
                                            <div className="p-item-top">
                                                <div className="p-meta">
                                                    <span className={`status-tag ${statusClass}`}>{status.replace('(피드백요청)', '')}</span>
                                                    <span className="p-id">{formatDate(pId)}</span>
                                                    {daysPassed !== null && <span className={`d-day-badge ${daysPassed > 7 ? 'danger' : ''}`}>D+{daysPassed}</span>}
                                                </div>
                                                <div className="p-count">
                                                    <strong>총 {base + bonus + extra}장</strong>
                                                    <small>({base}+{bonus}+{extra})</small>
                                                </div>
                                            </div>

                                            <div className="p-date-row">
                                                <span className="label">보정요청일:</span>
                                                <input type="text" defaultValue={requestDate} onBlur={e => handleUpdateDate(c.id, pId, e.target.value)} className="inline-input" />
                                                <small className="date-hint">{formatDate(requestDate)}</small>
                                            </div>

                                            <div className="p-action-grid">
                                                <select value={c.projectConcepts?.[pId] || ''} onChange={e => handleUpdateConcept(c.id, pId, e.target.value)}>
                                                    <option value="">상품 선택</option>
                                                    <option value="1컨셉">1컨셉 (2장)</option>
                                                    <option value="2컨셉">2컨셉 (4장)</option>
                                                    <option value="3컨셉">3컨셉 (6장)</option>
                                                    <option value="우정패키지1">우정1 (6장)</option>
                                                    <option value="우정패키지2">우정2 (10장)</option>
                                                </select>
                                                <button onClick={() => handleSendAlimtalk(c, pId, status)} className="btn-alimtalk">알림톡 발송</button>
                                            </div>

                                            <div className="p-status-row">
                                                <div className="pre-retouch-check">
                                                    <input 
                                                        type="checkbox" 
                                                        id={`pre-${c.id}-${pId}`}
                                                        checked={c.preRetouchSent?.[pId] || false} 
                                                        onChange={e => handleTogglePreRetouch(c, pId, e.target.checked)} 
                                                    />
                                                    <label htmlFor={`pre-${c.id}-${pId}`}>선보정 완료</label>
                                                </div>
                                                <div className="extra-count">
                                                    <span>추가:</span>
                                                    <input type="number" defaultValue={extra} onBlur={e => handleUpdateExtraCount(c.id, pId, e.target.value)} />
                                                </div>
                                                <select value={status} onChange={e => handleUpdateStatus(c.id, pId, e.target.value)}>
                                                    {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                                                </select>
                                            </div>

                                            <div className="p-link-box">
                                                <input type="text" placeholder="드롭박스 링크 입력" defaultValue={c.dropboxArchives?.[pId] || ''} onBlur={e => handleUpdateDropbox(c.id, pId, e.target.value)} />
                                            </div>

                                            <div className="p-feedback-box">
                                                <span className="f-label">고객 피드백 (수정 가능)</span>
                                                <textarea 
                                                    className="f-content-edit" 
                                                    defaultValue={c.clientFeedbacks?.[pId] || ''} 
                                                    onBlur={e => handleUpdateFeedback(c.id, pId, e.target.value)}
                                                    placeholder="고객 요청사항 입력..."
                                                />
                                            </div>

                                            <div className="p-consent-row">
                                                <div className={`consent-chip insta-chip ${c.instaConsents?.[pId] ? 'on' : ''}`} onClick={() => updateDoc(doc(db, 'retouch_masters', c.id), { [`instaConsents.${pId}`]: !c.instaConsents?.[pId] }).then(loadData)}>인스타업로드 동의</div>
                                                <div className={`consent-chip review-chip ${c.reviewConsents?.[pId] ? 'on' : ''}`} onClick={() => updateDoc(doc(db, 'retouch_masters', c.id), { [`reviewConsents.${pId}`]: !c.reviewConsents?.[pId] }).then(loadData)}>리뷰 완료</div>
                                            </div>

                                            {c.instaIds?.[pId] && (
                                                <div className="p-insta-id-display">
                                                    <span className="label">📸 프로젝트 인스타:</span>
                                                    <span className="val">{c.instaIds[pId].startsWith('@') ? c.instaIds[pId] : `@${c.instaIds[pId]}`}</span>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default RetouchAdminTab;
