import React, { useState, useEffect } from 'react';
import { db } from '../../utils/firebase';
import { collection, query, getDocs, doc, setDoc, updateDoc, deleteDoc, orderBy } from 'firebase/firestore';
import './SModelAdminTab.css';

const SModelAdminTab = () => {
    const [projects, setProjects] = useState([]);
    const [models, setModels] = useState([]);
    const [loading, setLoading] = useState(false);
    
    // Project Form State
    const [pCode, setPCode] = useState('');
    const [pTitle, setPTitle] = useState('');
    const [pStatus, setPStatus] = useState('모집중');
    const [isDefault, setIsDefault] = useState(false);

    // Filter State
    const [filterProject, setFilterProject] = useState('ALL');
    const [filterStatus, setFilterStatus] = useState('ALL');
    
    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const modelsPerPage = 15;

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            // Load projects
            const pSnap = await getDocs(query(collection(db, 'smodel_projects')));
            const pList = pSnap.docs.map(d => ({ id: d.id, ...d.data() }));
            setProjects(pList);

            // Load models
            const mSnap = await getDocs(query(collection(db, 'smodel_masters'), orderBy('createdAt', 'desc')));
            const mList = mSnap.docs.map(d => ({ id: d.id, ...d.data() }));
            setModels(mList);
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };

    const handleCreateProject = async (e) => {
        e.preventDefault();
        if (!pCode || !pTitle) {
            alert('프로젝트 코드와 명칭을 입력해주세요.');
            return;
        }
        try {
            await setDoc(doc(db, 'smodel_projects', pCode), {
                title: pTitle,
                status: pStatus,
                isDefault,
                createdAt: Date.now()
            });
            
            // If isDefault is true, set others to false
            if (isDefault) {
                projects.forEach(async (p) => {
                    if (p.id !== pCode && p.isDefault) {
                        await updateDoc(doc(db, 'smodel_projects', p.id), { isDefault: false });
                    }
                });
            }
            
            alert('프로젝트가 생성/수정 되었습니다.');
            setPCode(''); setPTitle(''); setIsDefault(false);
            loadData();
        } catch (err) {
            console.error(err);
            alert('오류가 발생했습니다.');
        }
    };

    const handleUpdateDropbox = async (modelId, projectId, link) => {
        try {
            const m = models.find(x => x.id === modelId);
            const currentArchives = m.dropboxArchives || {};
            await updateDoc(doc(db, 'smodel_masters', modelId), {
                [`dropboxArchives.${projectId}`]: link
            });
            alert('드롭박스 링크가 저장되었습니다.');
            loadData();
        } catch (err) {
            console.error(err);
            alert('링크 저장 오류');
        }
    };

    const handleUpdateStatus = async (modelId, projectId, status) => {
        try {
            await updateDoc(doc(db, 'smodel_masters', modelId), {
                [`projectStatuses.${projectId}`]: status
            });
            alert('상태가 변경되었습니다.');
            loadData();
        } catch (err) {
            console.error(err);
            alert('상태 변경 오류');
        }
    };

    const handleSendAlimtalk = (modelName, projectTitle) => {
        // Mock Alimtalk
        const msg = `[FITGIRLS] ${modelName}님, 이번 ${projectTitle} 촬영본이 업데이트되었습니다! ▶ fitgirls.me/smodel`;
        console.log("ALIMTALK MOCK:", msg);
        alert(`다음 내용으로 알림톡 발송 (시뮬레이션):\n\n${msg}`);
    };

    const filteredModels = models.filter(m => {
        // 1. Project Filter
        let passProject = true;
        if (filterProject !== 'ALL') {
            passProject = m.projectHistory && m.projectHistory.includes(filterProject);
        }
        if (!passProject) return false;

        // 2. Status Filter
        if (filterStatus === 'ALL') return true;
        
        if (filterProject !== 'ALL') {
            // Check specific project status
            return m.projectStatuses?.[filterProject] === filterStatus;
        } else {
            // Check if any project has this status
            return m.projectStatuses && Object.values(m.projectStatuses).includes(filterStatus);
        }
    });

    // Pagination logic
    const indexOfLastModel = currentPage * modelsPerPage;
    const indexOfFirstModel = indexOfLastModel - modelsPerPage;
    const currentModels = filteredModels.slice(indexOfFirstModel, indexOfLastModel);
    const totalPages = Math.ceil(filteredModels.length / modelsPerPage);

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    // Reset pagination when filter changes
    useEffect(() => {
        setCurrentPage(1);
    }, [filterProject, filterStatus]);

    const exportToExcel = () => {
        // Simple CSV export as fallback
        const headers = ['이름', '전화번호', '이메일', '참여프로젝트', '최근사진URL'];
        const rows = filteredModels.map(m => [
            m.name,
            m.phone,
            m.email || '',
            (m.projectHistory || []).join(','),
            m.latestSelfie || ''
        ]);
        
        const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
            + headers.join(',') + '\n' 
            + rows.map(e => e.join(',')).join('\n');
            
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `smodel_export_${Date.now()}.csv`);
        document.body.appendChild(link);
        link.click();
    };

    return (
        <div className="smodel-admin-theme">
            <h3>Senior Models (S-Model)</h3>
            
            <div className="smodel-admin-card">
                <h4>프로젝트 관리 (Project Management)</h4>
                <form onSubmit={handleCreateProject} style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                    <div className="form-group" style={{ flex: '1', minWidth: '150px' }}>
                        <label>프로젝트 코드 (예: 20260428)</label>
                        <input type="text" value={pCode} onChange={e=>setPCode(e.target.value)} required />
                    </div>
                    <div className="form-group" style={{ flex: '2', minWidth: '200px' }}>
                        <label>프로젝트 명칭</label>
                        <input type="text" value={pTitle} onChange={e=>setPTitle(e.target.value)} required />
                    </div>
                    <div className="form-group" style={{ width: '130px' }}>
                        <label>상태</label>
                        <select value={pStatus} onChange={e=>setPStatus(e.target.value)}>
                            <option value="모집중">모집중</option>
                            <option value="촬영중">촬영중</option>
                            <option value="완료">완료</option>
                        </select>
                    </div>
                    <div className="form-group checkbox-group">
                        <input type="checkbox" id="isDef" checked={isDefault} onChange={e=>setIsDefault(e.target.checked)} />
                        <label htmlFor="isDef" style={{ margin: 0 }}>메인(모집) 설정</label>
                    </div>
                    <div className="form-group">
                        <button type="submit" className="smodel-admin-btn">저장/추가</button>
                    </div>
                </form>

                <div style={{ marginTop: '32px' }}>
                    <h5>현재 프로젝트 목록:</h5>
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        {projects.map(p => (
                            <span key={p.id} className={`smodel-admin-badge ${p.isDefault ? 'active' : 'inactive'}`}>
                                {p.id} - {p.title} ({p.status}) {p.isDefault && '⭐'}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '16px' }}>
                <h4 style={{ margin: 0 }}>모델 DB 관리</h4>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <select 
                        value={filterProject} 
                        onChange={e => setFilterProject(e.target.value)}
                        style={{ width: 'auto', padding: '12px' }}
                    >
                        <option value="ALL">전체 프로젝트 보기</option>
                        {projects.map(p => (
                            <option key={p.id} value={p.id}>{p.id} ({p.title})</option>
                        ))}
                    </select>
                    <button onClick={exportToExcel} className="smodel-admin-btn secondary" style={{ padding: '12px 24px' }}>엑셀(CSV) 다운로드</button>
                </div>
            </div>

            {/* Status Tabs */}
            <div className="smodel-admin-tabs">
                {['ALL', '입금대기', '입금확인', '촬영중', '보정중', '보정완료'].map(status => (
                    <button
                        key={status}
                        className={`smodel-admin-tab ${filterStatus === status ? 'active' : ''}`}
                        onClick={() => setFilterStatus(status)}
                    >
                        {status === 'ALL' ? '전체 상태' : status} 
                        ({
                            models.filter(m => {
                                let passP = filterProject === 'ALL' || (m.projectHistory && m.projectHistory.includes(filterProject));
                                if (!passP) return false;
                                if (status === 'ALL') return true;
                                if (filterProject !== 'ALL') return m.projectStatuses?.[filterProject] === status;
                                return m.projectStatuses && Object.values(m.projectStatuses).includes(status);
                            }).length
                        })
                    </button>
                ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {currentModels.map(model => (
                    <div key={model.id} className="smodel-admin-list-item">
                        <div style={{ flex: '0 0 100px' }}>
                            {model.latestSelfie ? (
                                <img src={model.latestSelfie} alt={model.name} className="smodel-admin-avatar" />
                            ) : (
                                <div className="smodel-admin-avatar empty">No Image</div>
                            )}
                        </div>
                        <div className="smodel-admin-info">
                            <div className="smodel-admin-info-header">
                                <div>
                                    <h4 className="smodel-admin-name">{model.name}</h4>
                                    <p className="smodel-admin-contact">{model.phone} | {model.email}</p>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '0.85rem', color: '#8A9BB3', marginBottom: '8px' }}>참여 프로젝트</div>
                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                                        {(model.projectHistory || []).map(pId => (
                                            <span key={pId} className="smodel-admin-badge active" style={{ padding: '4px 8px' }}>{pId}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            
                            <div className="smodel-admin-archive-box">
                                <p style={{ margin: '0 0 8px', fontSize: '1rem', fontWeight: 'bold', color: '#fff' }}>프로젝트별 진행 상태 및 아카이브</p>
                                {(model.projectHistory || []).map(pId => {
                                    const pInfo = projects.find(p => p.id === pId) || {};
                                    const currentLink = model.dropboxArchives?.[pId] || '';
                                    const currentNote = model.projectNotes?.[pId] || '';
                                    return (
                                        <div key={pId} style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px', borderBottom: '1px solid #2A3649', paddingBottom: '16px' }}>
                                            <div className="smodel-admin-archive-row">
                                                <span className="smodel-admin-project-id">{pId}</span>
                                                <select 
                                                    value={model.projectStatuses?.[pId] || '입금대기'}
                                                    onChange={(e) => handleUpdateStatus(model.id, pId, e.target.value)}
                                                    style={{ width: '130px', padding: '12px' }}
                                                >
                                                    <option value="입금대기">입금대기</option>
                                                    <option value="입금확인">입금확인</option>
                                                    <option value="촬영중">촬영중</option>
                                                    <option value="보정중">보정중</option>
                                                    <option value="보정완료">보정완료</option>
                                                </select>
                                                <input 
                                                    type="url" 
                                                    placeholder="드롭박스 링크 (https://...)" 
                                                    defaultValue={currentLink}
                                                    onBlur={(e) => {
                                                        if (e.target.value !== currentLink) {
                                                            handleUpdateDropbox(model.id, pId, e.target.value);
                                                        }
                                                    }}
                                                    style={{ flex: '1', padding: '12px' }} 
                                                />
                                                <button 
                                                    onClick={() => handleSendAlimtalk(model.name, pInfo.title || pId)}
                                                    className="smodel-admin-btn danger" 
                                                    style={{ padding: '12px 24px' }}
                                                    disabled={!currentLink}
                                                    title={!currentLink ? "링크를 먼저 입력하세요." : ""}
                                                >
                                                    알림톡 전송
                                                </button>
                                            </div>
                                            {currentNote && (
                                                <div style={{ background: '#080B14', padding: '12px', borderRadius: '8px', fontSize: '0.9rem', color: '#8A9BB3' }}>
                                                    <strong style={{ color: '#00D4B6' }}>고객 전달사항:</strong> {currentNote}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                ))}
                {filteredModels.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '60px', background: '#212B3B', borderRadius: '16px', color: '#8A9BB3' }}>
                        등록된 시니어 모델이 없습니다.
                    </div>
                )}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '32px', flexWrap: 'wrap' }}>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(number => (
                        <button
                            key={number}
                            onClick={() => handlePageChange(number)}
                            style={{
                                background: currentPage === number ? '#00D4B6' : '#212B3B',
                                color: currentPage === number ? '#080B14' : '#ffffff',
                                border: '1px solid #2A3649',
                                borderRadius: '8px',
                                width: '40px',
                                height: '40px',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            {number}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default SModelAdminTab;
