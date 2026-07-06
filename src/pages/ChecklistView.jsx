import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { db } from '../utils/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { MdCheckCircle, MdAssignment, MdLockOutline } from 'react-icons/md';
import './ChecklistView.css';

const ChecklistView = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const docId = searchParams.get('id');

  const [loading, setLoading] = useState(false);
  const [checklist, setChecklist] = useState(null);
  const [error, setError] = useState('');
  
  // Authentication states
  const [isVerified, setIsVerified] = useState(false);
  const [authName, setAuthName] = useState('');
  const [authPhoneLast4, setAuthPhoneLast4] = useState('');
  const [authError, setAuthError] = useState('');

  // Fetch document meta for security check
  const [tempMeta, setTempMeta] = useState(null);

  useEffect(() => {
    if (!docId) {
      setError('올바르지 않은 접근입니다. 체크리스트 ID가 누락되었습니다.');
      return;
    }

    const fetchMeta = async () => {
      setLoading(true);
      try {
        const docRef = doc(db, 'fitorialist_checklists', docId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setTempMeta(docSnap.data());
        } else {
          setError('해당 체크리스트를 찾을 수 없습니다.');
        }
      } catch (err) {
        console.error('Error fetching checklist meta:', err);
        setError('데이터를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchMeta();
  }, [docId]);

  const handleVerify = (e) => {
    e.preventDefault();
    if (!tempMeta) return;

    const inputName = authName.trim();
    const inputPhoneLast4 = authPhoneLast4.trim();

    // Clean DB phone number to get last 4 digits
    const dbPhoneClean = tempMeta.phone ? tempMeta.phone.replace(/[^0-9]/g, '') : '';
    const dbPhoneLast4 = dbPhoneClean.slice(-4);

    if (tempMeta.name === inputName && dbPhoneLast4 === inputPhoneLast4) {
      setChecklist(tempMeta);
      setIsVerified(true);
      setAuthError('');
    } else {
      setAuthError('이름 또는 연락처 뒷자리가 일치하지 않습니다.');
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '-';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="checklist-view-loading" style={{ textAlign: 'center', padding: '100px 20px', color: '#666', fontFamily: 'sans-serif' }}>
        <p>상담지를 안전하게 불러오는 중입니다...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="checklist-view-error" style={{ textAlign: 'center', padding: '80px 20px', color: '#ff1e27', fontFamily: 'sans-serif' }}>
        <h2>오류 발생</h2>
        <p style={{ color: '#666', margin: '20px 0' }}>{error}</p>
        <button onClick={() => navigate('/')} style={{ background: '#ff1e27', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold' }}>홈페이지로 가기</button>
      </div>
    );
  }

  if (!isVerified) {
    return (
      <div className="checklist-auth-container">
        <div className="checklist-auth-card">
          <div className="auth-icon-wrapper">
            <MdLockOutline size={32} color="#ff1e27" />
          </div>
          <h2 className="auth-title">상담지 본인 확인</h2>
          <p className="auth-desc">개인정보 보호를 위해 예약자 본인 확인이 필요합니다.</p>
          
          <form onSubmit={handleVerify} className="auth-form">
            <div className="auth-input-group">
              <label htmlFor="auth-name">예약자 성함</label>
              <input
                id="auth-name"
                type="text"
                required
                placeholder="예약하신 분의 성함을 입력하세요"
                value={authName}
                onChange={(e) => setAuthName(e.target.value)}
              />
            </div>
            
            <div className="auth-input-group">
              <label htmlFor="auth-phone">휴대폰 번호 뒷 4자리</label>
              <input
                id="auth-phone"
                type="password"
                required
                maxLength={4}
                pattern="[0-9]*"
                inputMode="numeric"
                placeholder="휴대폰 번호 뒤 4자리를 입력하세요"
                value={authPhoneLast4}
                onChange={(e) => setAuthPhoneLast4(e.target.value)}
              />
            </div>

            {authError && <p className="auth-error-msg">{authError}</p>}

            <button type="submit" className="auth-submit-btn">상담지 열람하기</button>
          </form>
        </div>
      </div>
    );
  }

  const refImgState = checklist.refImgState || (checklist.concepts && checklist.concepts[0]?.refImgState);
  const refImgText = checklist.refImgText || (checklist.concepts && checklist.concepts[0]?.refImgText);
  const emphasis = checklist.emphasis || (checklist.concepts && checklist.concepts[0]?.emphasis);
  const burden = checklist.burden || (checklist.concepts && checklist.concepts[0]?.burden);
  const burdenText = checklist.burdenText || (checklist.concepts && checklist.concepts[0]?.burdenText);

  const handlePrint = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const originalTitle = document.title;
    document.title = `바디프로필_핏걸즈_${checklist.name || '상담지'}`;
    window.print();
    setTimeout(() => {
      document.title = originalTitle;
    }, 500);
  };

  return (
    <div className="checklist-view-page">
      <div className="checklist-view-container">
        
        {/* Header */}
        <header className="checklist-view-header">
          <div className="checklist-logo-wrapper" onClick={() => navigate('/')}>
            <img src="/images/logo-red.png" alt="FITGIRLS Logo" className="checklist-logo" onError={(e) => { e.target.src = '/logo.png' }} />
          </div>
          <h1 className="checklist-title-h1">제출 완료된 상담지</h1>
          <p className="checklist-subtitle">
            {checklist.name}님이 제출하신 FITORIALIST 상담 체크리스트 상세 내용입니다.
          </p>
        </header>

        {/* PDF / Print button */}
        <div className="print-btn-wrapper" style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
          <button 
            type="button" 
            onClick={handlePrint}
            style={{
              background: '#111',
              color: '#fff',
              border: 'none',
              padding: '12px 20px',
              borderRadius: '12px',
              cursor: 'pointer',
              fontWeight: '700',
              fontSize: '0.88rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
            }}
          >
            🖨️ PDF 저장 / 인쇄하기
          </button>
        </div>

        <div className="checklist-detail-box">
          
          {/* Card: Base Info */}
          <div className="checklist-card">
            <span className="card-num">촬영 정보</span>
            <div className="info-summary-grid">
              <div className="info-summary-item">
                <span>성함</span>
                <strong>{checklist.name}</strong>
              </div>
              <div className="info-summary-item">
                <span>연락처</span>
                <strong>{checklist.phone}</strong>
              </div>
              <div className="info-summary-item">
                <span>촬영 예정일</span>
                <strong>{checklist.date}</strong>
              </div>
              <div className="info-summary-item">
                <span>예약 상품</span>
                <strong>{checklist.concept || '(미지정)'}</strong>
              </div>
              <div className="info-summary-item">
                <span>셀카 각도</span>
                <strong>{checklist.selfieAngle || '(미지정)'}</strong>
              </div>
              <div className="info-summary-item">
                <span>피부톤</span>
                <strong>{checklist.skin || '(미지정)'}</strong>
              </div>
              <div className="info-summary-item">
                <span>보정 강도</span>
                <strong>{checklist.retouchLevel || '(미지정)'}</strong>
              </div>
              <div className="info-summary-item">
                <span>제출일시</span>
                <strong>{formatDate(checklist.createdAt)}</strong>
              </div>
            </div>
          </div>

          {/* Card: Concept details */}
          {checklist.concepts && checklist.concepts.length > 0 ? (
            checklist.concepts.map((concept, cIdx) => (
              <div className="checklist-card" key={cIdx}>
                <span className="card-num" style={{ color: '#ff1e27' }}>[컨셉 {cIdx + 1}] 세부 방향</span>
                <h3 className="card-question" style={{ borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '16px' }}>
                  {cIdx + 1}번째 컨셉 촬영 시안
                </h3>

                <div className="detail-item-section">
                  <h4>1. 촬영 무드</h4>
                  <p className="detail-value">{concept.mood || '(미선택)'}</p>
                </div>

                <div className="detail-item-section">
                  <h4>1.5. 표정 스타일</h4>
                  <p className="detail-value">{concept.expression || '(미선택)'}</p>
                </div>
              </div>
            ))
          ) : (
            /* Legacy single concept rendering */
            <div className="checklist-card">
              <span className="card-num">촬영 세부 시안</span>
              <h3 className="card-question" style={{ borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '16px' }}>
                촬영 세부 방향
              </h3>

              <div className="detail-item-section">
                <h4>1. 촬영 무드</h4>
                <p className="detail-value">{checklist.mood || (checklist.concepts && checklist.concepts[0]?.mood) || '(미선택)'}</p>
              </div>

              <div className="detail-item-section">
                <h4>1.5. 표정 스타일</h4>
                <p className="detail-value">{checklist.expression || (checklist.concepts && checklist.concepts[0]?.expression) || '(미선택)'}</p>
              </div>
            </div>
          )}

          {/* Card: Common Concept Details */}
          <div className="checklist-card">
            <span className="card-num" style={{ color: '#ff1e27' }}>공통 촬영 방향</span>
            <h3 className="card-question" style={{ borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '16px' }}>
              공통 시안 설정
            </h3>

            <div className="detail-item-section">
              <h4>2. 참고 이미지 정보</h4>
              <p className="detail-value">{refImgState || '(미선택)'}</p>
              {refImgText && (
                <div className="detail-sub-box">
                  {refImgText}
                </div>
              )}
            </div>

            <div className="detail-item-section">
              <h4>3. 강조 부위</h4>
              <div className="detail-badge-container">
                {emphasis && emphasis.length > 0 ? (
                  emphasis.map((part, idx) => (
                    <span key={idx} className="detail-badge red">{part}</span>
                  ))
                ) : '(선택 없음)'}
              </div>
            </div>

            <div className="detail-item-section">
              <h4>4. 피하고 싶은 부담 포즈 / 노출</h4>
              <div className="detail-badge-container" style={{ marginBottom: burdenText ? '10px' : '0' }}>
                {burden && burden.length > 0 ? (
                  burden.map((pose, idx) => (
                    <span key={idx} className="detail-badge gray">{pose}</span>
                  ))
                ) : '(선택 없음)'}
              </div>
              {burdenText && (
                <div className="detail-sub-box">
                  {burdenText}
                </div>
              )}
            </div>
          </div>


          {/* Card: Common parameters */}
          <div className="checklist-card">
            <span className="card-num">기타 안내 및 목적</span>
            
            <div className="detail-item-section">
              <h4>사진 활용 목적</h4>
              <div className="detail-badge-container" style={{ marginBottom: checklist.purposeText ? '10px' : '0' }}>
                {checklist.purpose && checklist.purpose.length > 0 ? (
                  checklist.purpose.map((pur, idx) => (
                    <span key={idx} className="detail-badge gray">{pur}</span>
                  ))
                ) : '(선택 없음)'}
              </div>
              {checklist.purposeText && (
                <div className="detail-sub-box">
                  {checklist.purposeText}
                </div>
              )}
            </div>

            <div className="detail-item-section">
              <h4>추가 자유 의견</h4>
              <div className="detail-sub-box text-pre">
                {checklist.freeNotes || '(입력 내용 없음)'}
              </div>
            </div>
          </div>

        </div>

        <div className="view-footer-actions" style={{ display: 'flex', justifyContent: 'center', marginTop: '30px' }}>
          <button 
            onClick={() => navigate('/')} 
            style={{ 
              background: '#ff1e27', 
              color: '#fff', 
              border: 'none', 
              padding: '16px 32px', 
              borderRadius: '16px', 
              cursor: 'pointer', 
              fontWeight: 'bold', 
              fontSize: '1rem',
              boxShadow: '0 4px 15px rgba(255, 30, 39, 0.2)'
            }}
          >
            핏걸즈 홈페이지로 이동
          </button>
        </div>

      </div>
    </div>
  );
};

export default ChecklistView;
