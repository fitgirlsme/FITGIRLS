import React, { useState, useEffect } from 'react';
import { db } from '../../utils/firebase';
import { collection, getDocs, deleteDoc, doc, query, orderBy, updateDoc } from 'firebase/firestore';
import { MdDelete, MdClose, MdAssignment } from 'react-icons/md';
import { sendAlimtalk, getAlimtalkTemplate } from '../../utils/aligoService';

const ChecklistAdminTab = () => {
  const [checklists, setChecklists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState(null);

  const selectItem = (item) => {
    setSelectedItem(item);
    setIsEditing(false);
    setEditForm(null);
  };

  const handleSendAlimtalk = async (item, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (!window.confirm(`${item.name} 고객님께 알림톡을 발송하시겠습니까?\n(동시에 작가님 휴대폰으로도 알림이 전송됩니다.)`)) {
      return;
    }
    
    let clientSuccess = false;
    let artistSuccess = false;
    let errorMsg = '';
    
    // 1. 고객 전송
    try {
      const clientTemplate = getAlimtalkTemplate('UJ_2731', {
        name: item.name,
        date: item.date,
        concept: item.concept || '미지정',
        id: item.id
      });
      if (clientTemplate) {
        const res = await sendAlimtalk(item.phone, clientTemplate.code, clientTemplate.message, clientTemplate);
        if (res.success) clientSuccess = true;
        else errorMsg += `고객 발송 실패: ${res.error}\n`;
      }
    } catch (err) {
      errorMsg += `고객 발송 에러: ${err.message}\n`;
    }

    // 2. 작가 전송 (010-4696-1441)
    try {
      const artistTemplate = getAlimtalkTemplate('UJ_2731', {
        name: item.name,
        date: item.date,
        concept: item.concept || '미지정',
        id: item.id
      });
      if (artistTemplate) {
        const res = await sendAlimtalk('01046961441', artistTemplate.code, artistTemplate.message, artistTemplate);
        if (res.success) artistSuccess = true;
        else errorMsg += `작가 발송 실패: ${res.error}\n`;
      }
    } catch (err) {
      errorMsg += `작가 발송 에러: ${err.message}\n`;
    }
    
    if (clientSuccess && artistSuccess) {
      alert('고객과 작가님 두 곳 모두 알림톡 발송이 성공했습니다.');
    } else if (clientSuccess || artistSuccess) {
      alert(`일부 발송 성공:\n${clientSuccess ? '고객 발송 성공' : '고객 발송 실패'}\n${artistSuccess ? '작가 발송 성공' : '작가 발송 실패'}\n\n상세 오류:\n${errorMsg}`);
    } else {
      alert(`알림톡 발송 실패:\n${errorMsg}`);
    }
  };

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

  const handleEditStart = () => {
    setEditForm({ ...selectedItem });
    setIsEditing(true);
  };

  const handleEditCancel = () => {
    setIsEditing(false);
    setEditForm(null);
  };

  const handleInputChange = (field, val) => {
    setEditForm(prev => ({ ...prev, [field]: val }));
  };

  const handleConceptChange = (index, field, val) => {
    setEditForm(prev => {
      const updatedConcepts = [...(prev.concepts || [])];
      updatedConcepts[index] = { ...updatedConcepts[index], [field]: val };
      return { ...prev, concepts: updatedConcepts };
    });
  };

  const handleEditSave = async () => {
    if (!editForm.name.trim()) {
      alert("이름은 필수 입력입니다.");
      return;
    }
    try {
      const docRef = doc(db, 'fitorialist_checklists', editForm.id);
      const { id, ...updateData } = editForm;
      await updateDoc(docRef, updateData);
      
      setChecklists(prev => prev.map(item => item.id === editForm.id ? editForm : item));
      setSelectedItem(editForm);
      setIsEditing(false);
      setEditForm(null);
      alert("체크리스트가 성공적으로 수정되었습니다.");
    } catch (err) {
      console.error("Error updating checklist:", err);
      alert("저장 중 에러가 발생했습니다.");
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
  const emphasisText = selectedItem?.emphasisText || '';
  const burden = selectedItem?.burden || (selectedItem?.concepts && selectedItem?.concepts[0]?.burden) || selectedItem?.burdenPose;
  const burdenText = selectedItem?.burdenText || (selectedItem?.concepts && selectedItem?.concepts[0]?.burdenText) || selectedItem?.burdenPoseText;

  const handleOpenLargeView = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!selectedItem) return;

    const popup = window.open('', '_blank', 'width=850,height=950,scrollbars=yes');
    if (!popup) {
      alert('팝업 차단이 설정되어 있습니다. 브라우저 설정에서 팝업을 허용해주세요.');
      return;
    }

    const refImgState = selectedItem.refImgState || (selectedItem.concepts && selectedItem.concepts[0]?.refImgState) || selectedItem.referenceImageState || '';
    const refImgText = selectedItem.refImgText || (selectedItem.concepts && selectedItem.concepts[0]?.refImgText) || selectedItem.referenceImageText || '';
    const emphasis = selectedItem.emphasis || (selectedItem.concepts && selectedItem.concepts[0]?.emphasis) || selectedItem.emphasisPart || [];
    const emphasisText = selectedItem.emphasisText || '';
    const burden = selectedItem.burden || (selectedItem.concepts && selectedItem.concepts[0]?.burden) || selectedItem.burdenPose || [];
    const burdenText = selectedItem.burdenText || (selectedItem.concepts && selectedItem.concepts[0]?.burdenText) || selectedItem.burdenPoseText || '';
    const purpose = selectedItem.purpose || [];
    const purposeText = selectedItem.purposeText || '';
    const freeNotes = selectedItem.freeNotes || '';

    const dateStr = selectedItem.date || '';
    const createdAtStr = formatDate(selectedItem.createdAt);

    let conceptsHtml = '';
    if (selectedItem.concepts && selectedItem.concepts.length > 0) {
      conceptsHtml = selectedItem.concepts.map((concept, cIdx) => `
        <div class="concept-section">
          <h3>[컨셉 ${cIdx + 1}] 세부 시안</h3>
          <div class="info-grid">
            <div class="info-item">
              <span class="label">촬영 무드</span>
              <span class="value">${concept.mood || '(미선택)'}</span>
            </div>
            <div class="info-item">
              <span class="label">표정 스타일</span>
              <span class="value">${concept.expression || '(미선택)'}</span>
            </div>
            ${concept.moodText ? `
            <div class="info-item full-width" style="margin-top: 5px;">
              <span class="label">추가로 촬영하고 싶은 느낌</span>
              <div class="value text-box">${concept.moodText}</div>
            </div>
            ` : ''}
          </div>
        </div>
      `).join('');
    } else {
      conceptsHtml = `
        <div class="concept-section">
          <h3>촬영 세부 시안</h3>
          <div class="info-grid">
            <div class="info-item">
              <span class="label">촬영 무드</span>
              <span class="value">${selectedItem.mood || '(미선택)'}</span>
            </div>
            <div class="info-item">
              <span class="label">표정 스타일</span>
              <span class="value">${selectedItem.expression || '(미선택)'}</span>
            </div>
            ${selectedItem.moodText ? `
            <div class="info-item full-width" style="margin-top: 5px;">
              <span class="label">추가로 촬영하고 싶은 느낌</span>
              <div class="value text-box">${selectedItem.moodText}</div>
            </div>
            ` : ''}
          </div>
        </div>
      `;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>바디프로필_핏걸즈_${selectedItem.name || '상담지'}</title>
        <meta charset="utf-8" />
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700;900&display=swap');
          
          body {
            font-family: 'Noto Sans KR', sans-serif;
            margin: 0;
            padding: 30px;
            color: #333;
            background-color: #fff;
            line-height: 1.5;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          .no-print-area {
            display: flex;
            justify-content: flex-end;
            gap: 10px;
            margin-bottom: 20px;
            border-bottom: 1px solid #eee;
            padding-bottom: 15px;
          }

          .btn {
            padding: 8px 16px;
            font-size: 0.85rem;
            font-weight: bold;
            border-radius: 6px;
            cursor: pointer;
            border: 1px solid #ddd;
            display: inline-flex;
            align-items: center;
            gap: 6px;
          }

          .btn-print {
            background-color: #ff1e27;
            color: white;
            border-color: #ff1e27;
          }

          .btn-close {
            background-color: #f8f9fa;
            color: #333;
          }

          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #111;
            padding-bottom: 20px;
          }

          .header h1 {
            font-size: 1.6rem;
            margin: 0 0 8px 0;
            color: #ff1e27;
            font-weight: 900;
            letter-spacing: -0.5px;
          }

          .header p {
            margin: 0;
            color: #666;
            font-size: 0.9rem;
          }

          .section {
            margin-bottom: 25px;
            border: 1px solid #e1e4e6;
            border-radius: 8px;
            padding: 18px;
            page-break-inside: avoid;
            background-color: #fff;
          }

          .section-title {
            font-size: 1rem;
            font-weight: 800;
            color: #111;
            margin-top: 0;
            margin-bottom: 15px;
            border-left: 3px solid #ff1e27;
            padding-left: 8px;
            line-height: 1;
          }

          .info-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
          }

          .info-item {
            display: flex;
            flex-direction: column;
            gap: 4px;
          }

          .info-item.full-width {
            grid-column: span 2;
          }

          .info-item .label {
            font-size: 0.75rem;
            color: #777;
            font-weight: 500;
          }

          .info-item .value {
            font-size: 0.9rem;
            font-weight: 700;
            color: #111;
          }

          .badge-container {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
            margin-top: 4px;
          }

          .badge {
            background-color: #fff0f0 !important;
            color: #ff1e27 !important;
            padding: 3px 8px;
            border-radius: 4px;
            font-size: 0.8rem;
            font-weight: 600;
            border: 1px solid #ffd8d8;
          }

          .badge.gray {
            background-color: #f5f6f7 !important;
            color: #555 !important;
            border: 1px solid #e1e4e6;
          }

          .text-box {
            background-color: #f9fafb !important;
            border: 1px solid #e5e7eb;
            border-radius: 6px;
            padding: 10px 12px;
            font-size: 0.85rem;
            font-weight: normal !important;
            color: #4b5563;
            white-space: pre-wrap;
            margin-top: 4px;
            min-height: 30px;
          }

          .concept-section {
            margin-bottom: 15px;
            border-bottom: 1px dashed #e1e4e6;
            padding-bottom: 15px;
          }

          .concept-section:last-child {
            margin-bottom: 0;
            border-bottom: none;
            padding-bottom: 0;
          }

          .concept-section h3 {
            margin-top: 0;
            margin-bottom: 10px;
            font-size: 0.9rem;
            color: #ff1e27;
            font-weight: 700;
          }

          @media print {
            .no-print-area {
              display: none !important;
            }

            body {
              padding: 0;
              margin: 0;
            }

            .section {
              border: 1px solid #ccc;
            }

            @page {
              size: A4;
              margin: 15mm;
            }
          }
        </style>
      </head>
      <body>
        <div class="no-print-area">
          <button class="btn btn-print" onclick="window.print()">🖨️ 바로 인쇄하기</button>
          <button class="btn btn-close" onclick="window.close()">창 닫기</button>
        </div>

        <div class="header">
          <h1>FITORIALIST 상담 체크리스트</h1>
          <p>${selectedItem.name} 고객님의 촬영 상세 계획서</p>
        </div>

        <!-- 기본 정보 -->
        <div class="section">
          <h2 class="section-title">기본 예약 정보</h2>
          <div class="info-grid">
            <div class="info-item">
              <span class="label">예약자 성함</span>
              <span class="value">${selectedItem.name}</span>
            </div>
            <div class="info-item">
              <span class="label">연락처</span>
              <span class="value">${selectedItem.phone || '(없음)'}</span>
            </div>
            <div class="info-item">
              <span class="label">이메일</span>
              <span class="value">${selectedItem.email || '(미입력)'}</span>
            </div>
            <div class="info-item">
              <span class="label">촬영 예정일</span>
              <span class="value">${dateStr}</span>
            </div>
            <div class="info-item">
              <span class="label">예약 상품</span>
              <span class="value">${selectedItem.concept || '(미지정)'}</span>
            </div>
            <div class="info-item">
              <span class="label">선호하는 셀카 각도</span>
              <span class="value">${selectedItem.selfieAngle || '(미지정)'}</span>
            </div>
            <div class="info-item">
              <span class="label">현재 피부톤</span>
              <span class="value">${selectedItem.skin || '(미지정)'}</span>
            </div>
            <div class="info-item">
              <span class="label">원하시는 보정 강도</span>
              <span class="value">${selectedItem.retouchLevel || '(미지정)'}</span>
            </div>
            <div class="info-item">
              <span class="label">제출 일시</span>
              <span class="value">${createdAtStr}</span>
            </div>
          </div>
        </div>

        <!-- 세부 컨셉 정보 -->
        <div class="section">
          <h2 class="section-title">촬영 컨셉별 세부 방향</h2>
          ${conceptsHtml}
        </div>

        <!-- 공통 촬영 방향 -->
        <div class="section">
          <h2 class="section-title">공통 촬영 방향 설정</h2>
          <div class="info-grid">
            <div class="info-item full-width">
              <span class="label">참고 이미지 여부</span>
              <span class="value">${refImgState || '(미선택)'}</span>
              ${refImgText ? `<div class="value text-box">${refImgText}</div>` : ''}
            </div>
            
            <div class="info-item full-width" style="margin-top: 5px;">
              <span class="label">촬영에서 가장 강조하고 싶은 부분</span>
              <div class="badge-container">
                ${emphasis.length > 0 ? emphasis.map(part => `<span class="badge">${part}</span>`).join('') : '(선택 없음)'}
              </div>
              ${emphasisText ? `<div class="value text-box">${emphasisText}</div>` : ''}
            </div>

            <div class="info-item full-width" style="margin-top: 5px;">
              <span class="label">피하고 싶은 부담 포즈 / 노출 정도</span>
              <div class="badge-container">
                ${burden.length > 0 ? burden.map(pose => `<span class="badge gray">${pose}</span>`).join('') : '(선택 없음)'}
              </div>
              ${burdenText ? `<div class="value text-box">${burdenText}</div>` : ''}
            </div>
          </div>
        </div>

        <!-- 기타 및 자유의견 -->
        <div class="section">
          <h2 class="section-title">기타 안내 및 목적</h2>
          <div class="info-grid">
            <div class="info-item full-width">
              <span class="label">사진 활용 목적</span>
              <div class="badge-container">
                ${purpose.length > 0 ? purpose.map(pur => `<span class="badge gray">${pur}</span>`).join('') : '(선택 없음)'}
              </div>
              ${purposeText ? `<div class="value text-box">${purposeText}</div>` : ''}
            </div>

            <div class="info-item full-width" style="margin-top: 5px;">
              <span class="label">추가 자유 의견</span>
              <div class="value text-box">${freeNotes || '(입력 내용 없음)'}</div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    popup.document.write(htmlContent);
    popup.document.close();
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
                        onClick={() => selectItem(item)}
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
                        <td style={{ padding: '14px 8px' }}>
                          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}>
                            <button 
                              onClick={(e) => handleSendAlimtalk(item, e)}
                              style={{ 
                                background: '#f1c40f', 
                                color: '#333', 
                                border: 'none', 
                                padding: '4px 8px', 
                                borderRadius: '4px', 
                                fontSize: '0.75rem', 
                                fontWeight: 'bold', 
                                cursor: 'pointer',
                                transition: 'background 0.2s'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.background = '#f39c12'}
                              onMouseLeave={(e) => e.currentTarget.style.background = '#f1c40f'}
                            >
                              알림톡
                            </button>
                            <button 
                              onClick={(e) => handleDelete(item.id, e)}
                              style={{ background: 'none', border: 'none', color: '#999', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}
                              onMouseEnter={(e) => e.currentTarget.style.color = '#ff1e27'}
                              onMouseLeave={(e) => e.currentTarget.style.color = '#999'}
                            >
                              <MdDelete size={18} />
                            </button>
                          </div>
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
              <div className="admin-detail-header-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {isEditing ? (
                  <>
                    <button
                      onClick={handleEditSave}
                      style={{
                        background: '#2ecc71',
                        border: 'none',
                        color: '#fff',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontSize: '0.8rem',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      💾 저장
                    </button>
                    <button
                      onClick={handleEditCancel}
                      style={{
                        background: '#e74c3c',
                        border: 'none',
                        color: '#fff',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontSize: '0.8rem',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      ✕ 취소
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={handleEditStart}
                      style={{
                        background: '#9b59b6',
                        border: 'none',
                        color: '#fff',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontSize: '0.8rem',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      className="admin-print-btn-no-print"
                    >
                      ✏️ 수정
                    </button>
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
                      onClick={handleOpenLargeView}
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
                      🔍 크게보기 / 인쇄
                    </button>
                  </>
                )}
                <button 
                  onClick={() => selectItem(null)} 
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#999', padding: '4px' }}
                >
                  <MdClose size={20} />
                </button>
              </div>
            </div>

            {isEditing && editForm ? (
              /* 에디터 폼 렌더링 */
              <div className="admin-checklist-detail-inner-box" style={{ display: 'flex', flexDirection: 'column', gap: '18px', fontSize: '0.9rem', lineHeight: 1.5 }}>
                <div>
                  <strong style={{ color: '#9b59b6', fontSize: '0.8rem', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>촬영 정보 수정</strong>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '0.8rem', color: '#666' }}>이름
                      <input 
                        type="text" 
                        value={editForm.name || ''} 
                        onChange={(e) => handleInputChange('name', e.target.value)} 
                        style={{ width: '100%', padding: '6px 10px', borderRadius: '4px', border: '1px solid #ddd', marginTop: '2px', boxSizing: 'border-box' }}
                      />
                    </label>
                    <label style={{ fontSize: '0.8rem', color: '#666' }}>연락처
                      <input 
                        type="text" 
                        value={editForm.phone || ''} 
                        onChange={(e) => handleInputChange('phone', e.target.value)} 
                        style={{ width: '100%', padding: '6px 10px', borderRadius: '4px', border: '1px solid #ddd', marginTop: '2px', boxSizing: 'border-box' }}
                      />
                    </label>
                    <label style={{ fontSize: '0.8rem', color: '#666' }}>이메일
                      <input 
                        type="email" 
                        value={editForm.email || ''} 
                        onChange={(e) => handleInputChange('email', e.target.value)} 
                        style={{ width: '100%', padding: '6px 10px', borderRadius: '4px', border: '1px solid #ddd', marginTop: '2px', boxSizing: 'border-box' }}
                      />
                    </label>
                    <label style={{ fontSize: '0.8rem', color: '#666' }}>촬영일
                      <input 
                        type="text" 
                        value={editForm.date || ''} 
                        onChange={(e) => handleInputChange('date', e.target.value)} 
                        style={{ width: '100%', padding: '6px 10px', borderRadius: '4px', border: '1px solid #ddd', marginTop: '2px', boxSizing: 'border-box' }}
                      />
                    </label>
                    <label style={{ fontSize: '0.8rem', color: '#666' }}>예약 상품
                      <input 
                        type="text" 
                        value={editForm.concept || ''} 
                        onChange={(e) => handleInputChange('concept', e.target.value)} 
                        style={{ width: '100%', padding: '6px 10px', borderRadius: '4px', border: '1px solid #ddd', marginTop: '2px', boxSizing: 'border-box' }}
                      />
                    </label>
                    <label style={{ fontSize: '0.8rem', color: '#666' }}>셀카 각도
                      <input 
                        type="text" 
                        value={editForm.selfieAngle || ''} 
                        onChange={(e) => handleInputChange('selfieAngle', e.target.value)} 
                        style={{ width: '100%', padding: '6px 10px', borderRadius: '4px', border: '1px solid #ddd', marginTop: '2px', boxSizing: 'border-box' }}
                      />
                    </label>
                    <label style={{ fontSize: '0.8rem', color: '#666' }}>피부톤
                      <input 
                        type="text" 
                        value={editForm.skin || ''} 
                        onChange={(e) => handleInputChange('skin', e.target.value)} 
                        style={{ width: '100%', padding: '6px 10px', borderRadius: '4px', border: '1px solid #ddd', marginTop: '2px', boxSizing: 'border-box' }}
                      />
                    </label>
                    <label style={{ fontSize: '0.8rem', color: '#666' }}>보정 강도
                      <input 
                        type="text" 
                        value={editForm.retouchLevel || ''} 
                        onChange={(e) => handleInputChange('retouchLevel', e.target.value)} 
                        style={{ width: '100%', padding: '6px 10px', borderRadius: '4px', border: '1px solid #ddd', marginTop: '2px', boxSizing: 'border-box' }}
                      />
                    </label>
                  </div>
                </div>

                {/* 컨셉 정보 수정 */}
                {editForm.concepts && editForm.concepts.length > 0 ? (
                  editForm.concepts.map((concept, cIdx) => (
                    <div key={cIdx} style={{ borderTop: '2px solid #9b59b6', paddingTop: '16px', marginTop: '6px' }}>
                      <h4 style={{ margin: '0 0 10px 0', color: '#9b59b6', fontSize: '0.9rem', fontWeight: 800 }}>[컨셉 {cIdx + 1}] 정보 수정</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '0.8rem', color: '#666' }}>촬영 무드
                          <input 
                            type="text" 
                            value={concept.mood || ''} 
                            onChange={(e) => handleConceptChange(cIdx, 'mood', e.target.value)} 
                            style={{ width: '100%', padding: '6px 10px', borderRadius: '4px', border: '1px solid #ddd', marginTop: '2px', boxSizing: 'border-box' }}
                          />
                        </label>
                        <label style={{ fontSize: '0.8rem', color: '#666', marginTop: '6px', display: 'block' }}>추가로 촬영하고 싶은 느낌
                          <input 
                            type="text" 
                            value={concept.moodText || ''} 
                            onChange={(e) => handleConceptChange(cIdx, 'moodText', e.target.value)} 
                            style={{ width: '100%', padding: '6px 10px', borderRadius: '4px', border: '1px solid #ddd', marginTop: '2px', boxSizing: 'border-box' }}
                          />
                        </label>
                        <label style={{ fontSize: '0.8rem', color: '#666' }}>표정 스타일
                          <input 
                            type="text" 
                            value={concept.expression || ''} 
                            onChange={(e) => handleConceptChange(cIdx, 'expression', e.target.value)} 
                            style={{ width: '100%', padding: '6px 10px', borderRadius: '4px', border: '1px solid #ddd', marginTop: '2px', boxSizing: 'border-box' }}
                          />
                        </label>
                      </div>
                    </div>
                  ))
                ) : (
                  <>
                    <div style={{ borderTop: '1px solid #eee', paddingTop: '14px' }}>
                      <strong style={{ color: '#555', display: 'block', marginBottom: '4px' }}>원하시는 촬영 무드 수정</strong>
                      <input 
                        type="text" 
                        value={editForm.mood || ''} 
                        onChange={(e) => handleInputChange('mood', e.target.value)} 
                        style={{ width: '100%', padding: '6px 10px', borderRadius: '4px', border: '1px solid #ddd', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div style={{ borderTop: '1px solid #eee', paddingTop: '14px' }}>
                      <strong style={{ color: '#555', display: 'block', marginBottom: '4px' }}>추가로 촬영하고 싶은 느낌 수정</strong>
                      <input 
                        type="text" 
                        value={editForm.moodText || ''} 
                        onChange={(e) => handleInputChange('moodText', e.target.value)} 
                        style={{ width: '100%', padding: '6px 10px', borderRadius: '4px', border: '1px solid #ddd', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div style={{ borderTop: '1px solid #eee', paddingTop: '14px' }}>
                      <strong style={{ color: '#555', display: 'block', marginBottom: '4px' }}>표정 스타일 수정</strong>
                      <input 
                        type="text" 
                        value={editForm.expression || ''} 
                        onChange={(e) => handleInputChange('expression', e.target.value)} 
                        style={{ width: '100%', padding: '6px 10px', borderRadius: '4px', border: '1px solid #ddd', boxSizing: 'border-box' }}
                      />
                    </div>
                  </>
                )}

                {/* 공통 세부 시안 텍스트 필드 수정 */}
                <div style={{ borderTop: '2px solid #9b59b6', paddingTop: '16px', marginTop: '6px' }}>
                  <h4 style={{ margin: '0 0 10px 0', color: '#9b59b6', fontSize: '0.9rem', fontWeight: 800 }}>[공통] 서술형 수정</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '0.8rem', color: '#666' }}>참고 이미지 설명
                      <textarea 
                        value={editForm.refImgText || editForm.referenceImageText || ''} 
                        onChange={(e) => handleInputChange('refImgText', e.target.value)} 
                        style={{ width: '100%', height: '60px', padding: '6px 10px', borderRadius: '4px', border: '1px solid #ddd', marginTop: '2px', boxSizing: 'border-box', fontFamily: 'inherit' }}
                      />
                    </label>
                    <label style={{ fontSize: '0.8rem', color: '#666' }}>가장 강조하고 싶은 부위 추가 의견
                      <textarea 
                        value={editForm.emphasisText || ''} 
                        onChange={(e) => handleInputChange('emphasisText', e.target.value)} 
                        style={{ width: '100%', height: '60px', padding: '6px 10px', borderRadius: '4px', border: '1px solid #ddd', marginTop: '2px', boxSizing: 'border-box', fontFamily: 'inherit' }}
                      />
                    </label>
                    <label style={{ fontSize: '0.8rem', color: '#666' }}>부담스러운 포즈 설명
                      <textarea 
                        value={editForm.burdenText || editForm.burdenPoseText || ''} 
                        onChange={(e) => handleInputChange('burdenText', e.target.value)} 
                        style={{ width: '100%', height: '60px', padding: '6px 10px', borderRadius: '4px', border: '1px solid #ddd', marginTop: '2px', boxSizing: 'border-box', fontFamily: 'inherit' }}
                      />
                    </label>
                    <label style={{ fontSize: '0.8rem', color: '#666' }}>촬영 목적 설명
                      <textarea 
                        value={editForm.purposeText || ''} 
                        onChange={(e) => handleInputChange('purposeText', e.target.value)} 
                        style={{ width: '100%', height: '60px', padding: '6px 10px', borderRadius: '4px', border: '1px solid #ddd', marginTop: '2px', boxSizing: 'border-box', fontFamily: 'inherit' }}
                      />
                    </label>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid #eee', paddingTop: '14px' }}>
                  <strong style={{ color: '#555', display: 'block', marginBottom: '4px' }}>추가 자유 의견</strong>
                  <textarea 
                    value={editForm.freeNotes || ''} 
                    onChange={(e) => handleInputChange('freeNotes', e.target.value)} 
                    style={{ width: '100%', height: '100px', padding: '8px 12px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box', fontFamily: 'inherit' }}
                  />
                </div>
              </div>
            ) : (
              /* 읽기 전용 뷰 렌더링 */
              <div className="admin-checklist-detail-inner-box" style={{ display: 'flex', flexDirection: 'column', gap: '18px', fontSize: '0.9rem', lineHeight: 1.5 }}>
                <div>
                  <strong style={{ color: '#ff1e27', fontSize: '0.8rem', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>촬영 정보</strong>
                  <p style={{ margin: 0 }}>이름: <strong>{selectedItem.name}</strong></p>
                  <p style={{ margin: 0 }}>연락처: <strong>{selectedItem.phone || '(번호 없음)'}</strong></p>
                  <p style={{ margin: 0 }}>이메일: <strong>{selectedItem.email || '(미입력)'}</strong></p>
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
                        {concept.moodText && (
                          <p style={{ margin: '6px 0 0', padding: '8px 12px', background: '#f9f9f9', borderRadius: '6px', fontSize: '0.85rem' }}>
                            {concept.moodText}
                          </p>
                        )}
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
                      {(selectedItem.moodText || (selectedItem.concepts && selectedItem.concepts[0]?.moodText)) && (
                        <p style={{ margin: '6px 0 0', padding: '8px 12px', background: '#f9f9f9', borderRadius: '6px', fontSize: '0.85rem' }}>
                          {selectedItem.moodText || (selectedItem.concepts && selectedItem.concepts[0]?.moodText)}
                        </p>
                      )}
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
                    {emphasisText && (
                      <p style={{ margin: '6px 0 0', padding: '8px 12px', background: '#fff3f3', borderRadius: '6px', fontSize: '0.85rem', color: '#dd1018', wordBreak: 'break-all' }}>
                        {emphasisText}
                      </p>
                    )}
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
            )}
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
