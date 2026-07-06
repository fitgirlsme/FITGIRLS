import React, { useState, useEffect } from 'react';
import { db } from '../../utils/firebase';
import { collection, getDocs, deleteDoc, doc, query, orderBy, updateDoc } from 'firebase/firestore';
import { MdDelete, MdClose, MdAssignment } from 'react-icons/md';

const ChecklistAdminTab = () => {
  const [checklists, setChecklists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);

  const fetchChecklists = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'fitorialist_checklists'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const items = [];
      querySnapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() });
      });
      setChecklists(items);
    } catch (e) {
      console.error("Error fetching checklists:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChecklists();
  }, []);

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm("정말 이 체크리스트를 삭제하시겠습니까?")) return;
    try {
      await deleteDoc(doc(db, 'fitorialist_checklists', id));
      setChecklists(prev => prev.filter(item => item.id !== id));
      if (selectedItem?.id === id) setSelectedItem(null);
    } catch (err) {
      console.error("Error deleting checklist:", err);
      alert("삭제 중 에러가 발생했습니다.");
    }
  };

  const toggleChecked = async (id, currentCheckedVal) => {
    try {
      const docRef = doc(db, 'fitorialist_checklists', id);
      const nextVal = !currentCheckedVal;
      await updateDoc(docRef, { checked: nextVal });
      
      // Update checklists list state
      setChecklists(prev => prev.map(item => {
        if (item.id === id) {
          const updatedItem = { ...item, checked: nextVal };
          if (selectedItem?.id === id) {
            setSelectedItem(updatedItem);
          }
          return updatedItem;
        }
        return item;
      }));
    } catch (err) {
      console.error("Error toggling checked status:", err);
      alert("상태 업데이트 중 에러가 발생했습니다.");
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '-';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('ko-KR', {
      year: '2-digit',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const refImgState = selectedItem?.refImgState || (selectedItem?.concepts && selectedItem?.concepts[0]?.refImgState) || selectedItem?.referenceImageState;
  const refImgText = selectedItem?.refImgText || (selectedItem?.concepts && selectedItem?.concepts[0]?.refImgText) || selectedItem?.referenceImageText;
  const emphasis = selectedItem?.emphasis || (selectedItem?.concepts && selectedItem?.concepts[0]?.emphasis) || selectedItem?.emphasisPart;
  const burden = selectedItem?.burden || (selectedItem?.concepts && selectedItem?.concepts[0]?.burden) || selectedItem?.burdenPose;
  const burdenText = selectedItem?.burdenText || (selectedItem?.concepts && selectedItem?.concepts[0]?.burdenText) || selectedItem?.burdenPoseText;

  const handlePrint = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!selectedItem) return;
    const originalTitle = document.title;
    document.title = `바디프로필_핏걸즈_${selectedItem.name || '상담지'}`;
    window.print();
    setTimeout(() => {
      document.title = originalTitle;
    }, 500);
  };

  return (
    <div className="admin-checklist-tab" style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
      <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        
        {/* List Section */}
        <div style={{ flex: '1 1 500px', background: '#fff', borderRadius: '12px', padding: '20px', border: '1px solid #eee' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>체크리스트 제출 목록 ({checklists.length}건)</h3>
            <button 
              onClick={fetchChecklists} 
              style={{ background: '#f5f5f5', border: '1px solid #ddd', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}
            >
              새로고침
            </button>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>로딩 중...</div>
          ) : checklists.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>제출된 체크리스트가 없습니다.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #eee', textAlign: 'left', color: '#666' }}>
                    <th style={{ padding: '12px 8px' }}>이름</th>
                    <th style={{ padding: '12px 8px' }}>촬영일</th>
                    <th style={{ padding: '12px 8px' }}>제출 시각</th>
                    <th style={{ padding: '12px 8px', textAlign: 'center' }}>동작</th>
                  </tr>
                </thead>
                <tbody>
                  {checklists.map((item) => {
                    const isSelected = selectedItem?.id === item.id;
                    const isChecked = item.checked === true;
                    
                    let rowBg = 'transparent';
                    if (isSelected) {
                      rowBg = '#fff5f5';
                    } else if (isChecked) {
                      rowBg = '#e8f4ff'; // Light blue highlight
                    }

                    return (
                      <tr 
                        key={item.id} 
                        onClick={() => setSelectedItem(item)}
                        style={{ 
                          borderBottom: '1px solid #eee', 
                          cursor: 'pointer',
                          backgroundColor: rowBg,
                          transition: 'background-color 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.backgroundColor = isChecked ? '#dceeff' : '#fafafa';
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = rowBg;
                        }}
                      >
                        <td style={{ padding: '14px 8px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {item.name}
                          {isChecked ? (
                            <span style={{ 
                              background: '#e8f4ff', 
                              color: '#0066ff', 
                              fontSize: '0.7rem', 
                              padding: '2px 6px', 
                              borderRadius: '4px', 
                              fontWeight: 'bold',
                              border: '1px solid #0066ff',
                              whiteSpace: 'nowrap'
                            }}>
                              확인완료
                            </span>
                          ) : (
                            <span style={{ 
                              background: '#fff0f0', 
                              color: '#ff1e27', 
                              fontSize: '0.7rem', 
                              padding: '2px 6px', 
                              borderRadius: '4px', 
                              fontWeight: 'bold',
                              border: '1px solid #ff1e27',
                              whiteSpace: 'nowrap'
                            }}>
                              확인대기
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '14px 8px' }}>{item.date}</td>
                        <td style={{ padding: '14px 8px', color: '#666', fontSize: '0.85rem' }}>{formatDate(item.createdAt)}</td>
                        <td style={{ padding: '14px 8px', textAlign: 'center' }}>
                          <button 
                            onClick={(e) => handleDelete(item.id, e)}
                            style={{ background: 'none', border: 'none', color: '#999', cursor: 'pointer', padding: '4px' }}
                            onMouseEnter={(e) => e.currentTarget.style.color = '#ff1e27'}
                            onMouseLeave={(e) => e.currentTarget.style.color = '#999'}
                          >
                            <MdDelete size={18} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Detail Section */}
        {selectedItem && (
          <div className="admin-checklist-detail-panel-to-print" style={{ flex: '1 1 350px', background: '#fff', borderRadius: '12px', padding: '24px', border: '1px solid #eee', position: 'sticky', top: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: '16px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MdAssignment size={20} color="#ff1e27" />
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>{selectedItem.name}님의 체크리스트</h3>
              </div>
              <div className="admin-detail-header-actions" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  onClick={() => toggleChecked(selectedItem.id, selectedItem.checked)}
                  style={{
                    background: selectedItem.checked ? '#0066ff' : 'transparent',
                    border: '1.5px solid #0066ff',
                    color: selectedItem.checked ? '#fff' : '#0066ff',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'all 0.2s'
                  }}
                  className="admin-print-btn-no-print"
                >
                  {selectedItem.checked ? '✓ 체크완료' : '체크대기'}
                </button>
                <button
                  onClick={handlePrint}
                  style={{
                    background: '#f1f3f5',
                    border: '1px solid #dee2e6',
                    color: '#343a40',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                  className="admin-print-btn-no-print"
                >
                  🖨️ 인쇄
                </button>
                <button 
                  onClick={() => setSelectedItem(null)} 
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#999', padding: '4px' }}
                >
                  <MdClose size={20} />
                </button>
              </div>
            </div>

            <div className="admin-checklist-detail-inner-box" style={{ display: 'flex', flexDirection: 'column', gap: '18px', fontSize: '0.9rem', lineHeight: 1.5 }}>
              <div>
                <strong style={{ color: '#ff1e27', fontSize: '0.8rem', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>촬영 정보</strong>
                <p style={{ margin: 0 }}>이름: <strong>{selectedItem.name}</strong></p>
                <p style={{ margin: 0 }}>연락처: <strong>{selectedItem.phone || '(번호 없음)'}</strong></p>
                <p style={{ margin: 0 }}>촬영일: <strong>{selectedItem.date}</strong></p>
                {selectedItem.concept && <p style={{ margin: 0 }}>예약 상품: <strong>{selectedItem.concept}</strong></p>}
                {selectedItem.selfieAngle && <p style={{ margin: 0 }}>셀카 각도: <strong style={{ color: '#0066ff' }}>{selectedItem.selfieAngle}</strong></p>}
                {selectedItem.skin && <p style={{ margin: 0 }}>피부톤: <strong>{selectedItem.skin}</strong></p>}
                {selectedItem.retouchLevel && <p style={{ margin: 0 }}>보정 강도: <strong style={{ color: '#0066ff' }}>{selectedItem.retouchLevel}</strong></p>}
                <p style={{ margin: 0, color: '#888', fontSize: '0.8rem' }}>제출: {formatDate(selectedItem.createdAt)}</p>
              </div>

              {/* Concepts details (Multi-concept support) */}
              {selectedItem.concepts && selectedItem.concepts.length > 0 ? (
                selectedItem.concepts.map((concept, cIdx) => (
                  <div key={cIdx} className="admin-print-concept-card" style={{ borderTop: '2px solid #ff1e27', paddingTop: '16px', marginTop: '6px' }}>
                    <h4 style={{ margin: '0 0 14px 0', color: '#ff1e27', fontSize: '0.95rem', fontWeight: 800 }}>[컨셉 {cIdx + 1}] 세부 시안</h4>
                    
                    <div style={{ marginBottom: '12px' }}>
                      <strong style={{ color: '#555', display: 'block', marginBottom: '2px', fontSize: '0.8rem' }}>• 촬영 무드</strong>
                      <p style={{ margin: 0, fontWeight: 'bold' }}>{concept.mood || '(미선택)'}</p>
                    </div>

                    <div style={{ marginBottom: '12px' }}>
                      <strong style={{ color: '#555', display: 'block', marginBottom: '2px', fontSize: '0.8rem' }}>• 표정 스타일</strong>
                      <p style={{ margin: 0, fontWeight: 'bold' }}>{concept.expression || '(미선택)'}</p>
                    </div>
                  </div>
                ))
              ) : (
                /* Legacy single concept fallback */
                <>
                  <div style={{ borderTop: '1px solid #eee', paddingTop: '14px' }}>
                    <strong style={{ color: '#555', display: 'block', marginBottom: '4px' }}>1. 원하시는 촬영 무드</strong>
                    <p style={{ margin: 0, fontWeight: 'bold' }}>{selectedItem.mood || (selectedItem.concepts && selectedItem.concepts[0]?.mood) || '(미선택)'}</p>
                  </div>

                  <div style={{ borderTop: '1px solid #eee', paddingTop: '14px' }}>
                    <strong style={{ color: '#555', display: 'block', marginBottom: '4px' }}>1.5. 표정 스타일</strong>
                    <p style={{ margin: 0, fontWeight: 'bold' }}>{selectedItem.expression || (selectedItem.concepts && selectedItem.concepts[0]?.expression) || '(미선택)'}</p>
                  </div>
                </>
              )}

              {/* Card: Common Concept Details */}
              <div style={{ borderTop: '2px solid #ff1e27', paddingTop: '16px', marginTop: '6px' }}>
                <h4 style={{ margin: '0 0 14px 0', color: '#ff1e27', fontSize: '0.95rem', fontWeight: 800 }}>[공통] 촬영 방향 설정</h4>

                <div style={{ marginBottom: '12px' }}>
                  <strong style={{ color: '#555', display: 'block', marginBottom: '2px', fontSize: '0.8rem' }}>• 참고 이미지</strong>
                  <p style={{ margin: 0, fontWeight: 'bold' }}>{refImgState || '(미선택)'}</p>
                  {refImgText && (
                    <p style={{ margin: '6px 0 0', padding: '8px 12px', background: '#f9f9f9', borderRadius: '6px', fontSize: '0.85rem', wordBreak: 'break-all' }}>
                      {refImgText}
                    </p>
                  )}
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <strong style={{ color: '#555', display: 'block', marginBottom: '2px', fontSize: '0.8rem' }}>• 강조하고 싶은 부위</strong>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
                    {emphasis && emphasis.length > 0 ? (
                      emphasis.map((part, idx) => (
                        <span key={idx} style={{ background: '#fff0f0', color: '#ff1e27', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600 }}>{part}</span>
                      ))
                    ) : '(선택 없음)'}
                  </div>
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <strong style={{ color: '#555', display: 'block', marginBottom: '2px', fontSize: '0.8rem' }}>• 부담스러운 포즈 / 노출</strong>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px', marginBottom: burdenText ? '8px' : '0' }}>
                    {burden && burden.length > 0 ? (
                      burden.map((pose, idx) => (
                        <span key={idx} style={{ background: '#f5f5f5', color: '#666', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem' }}>{pose}</span>
                      ))
                    ) : '(선택 없음)'}
                  </div>
                  {burdenText && (
                    <p style={{ margin: 0, padding: '8px 12px', background: '#f9f9f9', borderRadius: '6px', fontSize: '0.85rem' }}>
                      {burdenText}
                    </p>
                  )}
                </div>
              </div>

              {/* Purpose (Common to both layouts) */}
              <div style={{ borderTop: '1px solid #eee', paddingTop: '14px' }}>
                <strong style={{ color: '#555', display: 'block', marginBottom: '4px' }}>촬영 목적</strong>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px', marginBottom: selectedItem.purposeText ? '8px' : '0' }}>
                  {selectedItem.purpose && selectedItem.purpose.length > 0 ? (
                    selectedItem.purpose.map((pur, idx) => (
                      <span key={idx} style={{ background: '#f5f5f5', color: '#666', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem' }}>{pur}</span>
                    ))
                  ) : '(선택 없음)'}
                </div>
                {selectedItem.purposeText && (
                  <p style={{ margin: 0, padding: '8px 12px', background: '#f9f9f9', borderRadius: '6px', fontSize: '0.85rem' }}>
                    {selectedItem.purposeText}
                  </p>
                )}
              </div>

              <div style={{ borderTop: '1px solid #eee', paddingTop: '14px' }}>
                <strong style={{ color: '#555', display: 'block', marginBottom: '4px' }}>추가 자유 의견</strong>
                <p style={{ margin: 0, padding: '10px 14px', background: '#fffcf5', border: '1px solid #fcf2d9', borderRadius: '8px', fontSize: '0.85rem', whiteSpace: 'pre-wrap' }}>
                  {selectedItem.freeNotes || '(입력 내용 없음)'}
                </p>
              </div>
            </div>
          </div>
        )}

      </div>
      <style>{`
        @media print {
          /* 1. Hide non-print areas explicitly */
          .admin-sidebar, 
          .admin-top-bar, 
          .admin-mobile-menu, 
          .mobile-only,
          .top-bar-left,
          .top-bar-right,
          .admin-checklist-tab > div:first-child,
          .admin-checklist-tab button,
          .admin-print-btn-no-print,
          button {
            display: none !important;
          }

          /* 2. Configure screen styling for printing container */
          body, html, #root, .root-layout, .admin-page, .admin-main, .admin-content-area, .tab-content-wrapper, .admin-checklist-tab {
            background: #ffffff !important;
            color: #000000 !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important;
            font-size: 8.5pt !important;
            line-height: 1.35 !important;
            height: auto !important;
            overflow: visible !important;
          }

          /* 3. Detail printing card stretches full width */
          .admin-checklist-detail-panel-to-print {
            width: 100% !important;
            max-width: 100% !important;
            border: none !important;
            padding: 10px 14px !important;
            margin: 0 !important;
            background: #ffffff !important;
            box-shadow: none !important;
            display: block !important;
          }

          /* 4. Flex container to format concept details side by side */
          .admin-checklist-detail-inner-box {
            display: flex !important;
            flex-direction: row !important;
            flex-wrap: wrap !important;
            gap: 8px !important;
          }

          /* Base info (first div child) spans full width */
          .admin-checklist-detail-inner-box > div:first-child {
            flex: 1 1 100% !important;
            display: grid !important;
            grid-template-columns: repeat(4, 1fr) !important;
            gap: 8px !important;
            border-bottom: 1.5px solid #000000 !important;
            padding-bottom: 8px !important;
            margin-bottom: 10px !important;
          }

          .admin-checklist-detail-inner-box > div:first-child p {
            margin: 0 !important;
          }

          /* Concept specific cards sit side-by-side (2 columns) */
          .admin-print-concept-card {
            flex: 1 1 48% !important;
            border: 1px solid #bbbbbb !important;
            border-radius: 6px !important;
            padding: 10px 14px !important;
            margin-top: 0 !important;
            box-sizing: border-box !important;
            page-break-inside: avoid !important;
          }

          /* Legacy single fallback or other non-classified blocks stretch full width */
          .admin-checklist-detail-inner-box > div:not(.admin-print-concept-card):not(:first-child) {
            flex: 1 1 100% !important;
            border-top: 1px solid #eeeeee !important;
            padding-top: 8px !important;
            margin-top: 4px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default ChecklistAdminTab;
