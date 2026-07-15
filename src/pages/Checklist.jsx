import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../utils/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { MdCheckCircle } from 'react-icons/md';
import { sendAlimtalk, getAlimtalkTemplate } from '../utils/aligoService';
import './Checklist.css';

const CONCEPT_OPTIONS = [
  '개인 1컨셉',
  '개인 2컨셉',
  '개인 3컨셉',
  '우정 / 커플 1컨셉',
  '패키지 1 (개인 1컨셉 2명 + 우정 1컨셉)',
  '패키지 2 (개인 2컨셉 2명 + 우정 1컨셉)',
  '기타 촬영'
];

const SKIN_OPTIONS = [
  '밝고 하얀 피부톤',
  '내추럴한 보통 피부톤',
  '건강한 구릿빛 피부톤 (태닝 피부)',
  '촬영 전까지 태닝을 진행할 예정이에요',
  '아직 잘 모르겠고 추천받고 싶어요'
];

const MOOD_OPTIONS = [
  '자연스럽고 편안한 느낌',
  '핀터레스트 감성 느낌',
  '패션화보 같은 느낌',
  '섹시하고 고급스러운 느낌',
  '아직 잘 모르겠고 추천받고 싶어요'
];

const REF_IMG_OPTIONS = [
  '참고 이미지 있음 (작가님에게 전달 완료)',
  '참고 이미지 없음',
  '상담하면서 추천받고 싶어요'
];

const EMPHASIS_OPTIONS = [
  '얼굴 분위기',
  '어깨라인',
  '가슴라인',
  '허리라인',
  '복근 (11자 라인 선호)',
  '복근 (식스팩/선명함 선호)',
  '등라인',
  '골반라인',
  '다리라인',
  '전체적인 바디라인',
  '아직 잘 모르겠고 추천받고 싶어요'
];

const BURDEN_OPTIONS = [
  '노출이 많은 의상은 부담스러워요',
  '과한 섹시 포즈는 부담스러워요',
  '정면 포즈가 어색해요',
  '몸매가 너무 강조되는 컷은 부담스러워요',
  '특별히 부담스러운 부분은 없어요',
  '상담하면서 조율하고 싶어요'
];

const PURPOSE_OPTIONS = [
  '인스타그램 업로드',
  '개인 소장',
  '프로필 사진',
  '블로그 / SNS 콘텐츠',
  '포트폴리오',
  '기념 촬영',
  '기타'
];

const RETOUCH_LEVEL_OPTIONS = [
  { label: '1단계: 기본 잡티만 제거', desc: '피부결 정돈 및 기본 잡티 수준의 최소 보정' },
  { label: '2단계: 자연스럽게 티 안 나게', desc: '이목구비 대칭 및 라인을 티 나지 않고 자연스럽게 정돈' },
  { label: '3단계: 새로운 나 (얼굴만)', desc: '얼굴 위주로 확실한 이목구비 비율과 얼굴 라인 보정' },
  { label: '4단계: 새로운 나 (얼굴+몸)', desc: '얼굴과 몸매 라인 모두를 조화롭고 완벽하게 성형 보정' },
  { label: '5단계: 새로 태어나고 싶어요!', desc: '비율과 윤곽 등 극적이고 드라마틱한 최고 강도의 정밀 보정' }
];

const SELFIE_ANGLE_OPTIONS = [
  { label: '왼쪽 얼굴 사수 (왼얼사)', desc: '주로 왼쪽 모습이나 셀카 각도가 잘 나온다고 느끼시는 분' },
  { label: '오른쪽 얼굴 사수 (오얼사)', desc: '주로 오른쪽 모습이나 셀카 각도가 잘 나온다고 느끼시는 분' },
  { label: '잘 모르겠어요 (찾아주세요!)', desc: '촬영을 진행하며 어울리는 자신만의 핏(Angle)을 작가와 맞추고 싶으신 분' },
  { label: '정면이나 상관없음 (다 좋아요!)', desc: '특정 각도에 구애받지 않고 다채롭고 조화로운 앵글을 원하시는 분' }
];

const EXPRESSION_OPTIONS = [
  '활짝 웃는 미소 중심 (밝은 에너지)',
  '자연스러운 미소 (편안하고 은은하게)',
  '시크 / 무표정 중심 (웃는 건 어색해요!)',
  '다양하게 섞어서 (작가님 가이드에 따라)'
];

const Checklist = () => {
  const navigate = useNavigate();

  // Form States (Common)
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [date, setDate] = useState('');
  const [selectedConcept, setSelectedConcept] = useState('');
  const [selectedSkin, setSelectedSkin] = useState('');
  const [retouchLevel, setRetouchLevel] = useState('');
  const [selfieAngle, setSelfieAngle] = useState('');
  const [selectedPurpose, setSelectedPurpose] = useState([]);
  const [purposeText, setPurposeText] = useState('');
  const [freeNotes, setFreeNotes] = useState('');

  // 탭 밖으로 꺼낸 공통 참고이미지, 강조 부위, 부담 포즈 상태
  const [refImgState, setRefImgState] = useState('');
  const [refImgText, setRefImgText] = useState('');
  const [emphasis, setEmphasis] = useState([]);
  const [burden, setBurden] = useState([]);
  const [burdenText, setBurdenText] = useState('');

  // Form States (Concept-specific arrays, up to 3 concepts)
  const [activeConceptIdx, setActiveConceptIdx] = useState(0);
  const [concepts, setConcepts] = useState([
    { mood: '', expression: '' },
    { mood: '', expression: '' },
    { mood: '', expression: '' }
  ]);

  // UI States
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Determine concept count based on selected concept
  const getConceptCount = (concept) => {
    if (!concept) return 1;
    if (concept.includes('3컨셉')) return 3;
    if (concept.includes('2컨셉') || concept.includes('패키지 1') || concept.includes('패키지 2')) {
      if (concept.includes('패키지 1')) return 2;
      if (concept.includes('패키지 2')) return 3;
      return 2;
    }
    return 1;
  };

  const conceptCount = getConceptCount(selectedConcept);

  // Keep active concept index valid
  useEffect(() => {
    if (activeConceptIdx >= conceptCount) {
      setActiveConceptIdx(0);
    }
  }, [conceptCount, activeConceptIdx]);

  // SEO 및 Title 처리
  useEffect(() => {
    document.title = 'FITORIALIST 상담 체크리스트 | 핏걸즈';
    
    let metaDesc = document.querySelector('meta[name="description"]');
    let createdMeta = false;
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.name = 'description';
      document.head.appendChild(metaDesc);
      createdMeta = true;
    }
    const originalDesc = metaDesc.getAttribute('content') || '';
    metaDesc.setAttribute('content', `핏걸즈 ${new Date().getFullYear()} 프로젝트 FITORIALIST 촬영 전 상담 체크리스트. 원하는 무드, 포즈, 스타일링을 미리 전달해주세요.`);
    
    return () => {
      document.title = 'FITGIRLS';
      if (metaDesc) {
        if (createdMeta) {
          metaDesc.remove();
        } else {
          metaDesc.setAttribute('content', originalDesc);
        }
      }
    };
  }, []);

  // Update specific field for the active concept
  const updateConceptField = (field, value) => {
    setConcepts(prev => {
      const updated = [...prev];
      updated[activeConceptIdx] = {
        ...updated[activeConceptIdx],
        [field]: value
      };
      return updated;
    });
  };

  // Common multi-select helpers
  const handleEmphasisToggle = (option) => {
    if (option === '아직 잘 모르겠고 추천받고 싶어요') {
      setEmphasis(['아직 잘 모르겠고 추천받고 싶어요']);
    } else {
      setEmphasis(prev => {
        const filtered = prev.filter(item => item !== '아직 잘 모르겠고 추천받고 싶어요');
        if (filtered.includes(option)) {
          return filtered.filter(item => item !== option);
        } else {
          return [...filtered, option];
        }
      });
    }
  };

  const handleBurdenToggle = (option) => {
    setBurden(prev => {
      if (prev.includes(option)) {
        return prev.filter(item => item !== option);
      } else {
        return [...prev, option];
      }
    });
  };

  // Common multi-select helper
  const handlePurposeToggle = (option) => {
    setSelectedPurpose(prev => {
      if (prev.includes(option)) {
        return prev.filter(item => item !== option);
      } else {
        return [...prev, option];
      }
    });
  };

  // Form Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !date) {
      alert('이름, 연락처, 촬영일은 필수 입력 항목입니다.');
      return;
    }
    if (!retouchLevel) {
      alert('원하시는 보정 강도를 선택해 주세요.');
      return;
    }
    if (!selfieAngle) {
      alert('주로 자신 있는 얼굴 방향(셀카 각도)을 선택해 주세요.');
      return;
    }

    // Check if each active concept has expression and mood filled
    for (let i = 0; i < conceptCount; i++) {
      if (!concepts[i].mood) {
        alert(`${i + 1}번째 컨셉의 촬영 무드를 선택해 주세요.`);
        return;
      }
      if (!concepts[i].expression) {
        alert(`${i + 1}번째 컨셉의 표정 스타일을 선택해 주세요.`);
        return;
      }
    }

    if (!selectedSkin) {
      alert('현재 피부톤을 선택해 주세요.');
      return;
    }
    if (!refImgState) {
      alert('참고 이미지 여부를 선택해 주세요.');
      return;
    }
    if (emphasis.length === 0) {
      alert('강조하고 싶은 부위를 선택해 주세요.');
      return;
    }
    if (burden.length === 0) {
      alert('부담스러운 포즈/노출 범위를 선택해 주세요.');
      return;
    }

    setLoading(true);
    try {
      // Save only active concepts according to selected count
      const activeConceptsData = concepts.slice(0, conceptCount);

      const docData = {
        name: name.trim(),
        phone: phone.trim(),
        date: date,
        concept: selectedConcept,
        skin: selectedSkin,
        retouchLevel: retouchLevel,
        selfieAngle: selfieAngle,
        concepts: activeConceptsData, // Array containing detail per concept
        refImgState: refImgState,
        refImgText: refImgText,
        emphasis: emphasis,
        burden: burden,
        burdenText: burdenText,
        purpose: selectedPurpose,
        purposeText: selectedPurpose.includes('기타') ? purposeText : '',
        freeNotes: freeNotes,
        createdAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'fitorialist_checklists'), docData);

      // Send Kakao Alimtalk to client
      try {
        const template = getAlimtalkTemplate('UJ_2731', {
          name: name.trim(),
          date: date,
          concept: selectedConcept || '미지정',
          id: docRef.id
        });
        if (template) {
          await sendAlimtalk(phone.trim(), template.code, template.message, {
            title: template.title,
            subtitle: template.subtitle,
            button: template.button
          });
        }
      } catch (alimtalkErr) {
        console.error('Failed to send checklist confirmation alimtalk:', alimtalkErr);
      }

      setShowSuccessModal(true);
    } catch (err) {
      console.error('Error submitting checklist: ', err);
      alert('제출 과정 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModal = () => {
    setShowSuccessModal(false);
    navigate('/');
  };

  return (
    <div className="checklist-page">
      <div className="checklist-container">
        
        {/* Header */}
        <header className="checklist-header">
          <div className="checklist-logo-wrapper" onClick={() => navigate('/')}>
            <img src="/images/logo-red.png" alt="FITGIRLS Logo" className="checklist-logo" onError={(e) => { e.target.src = '/logo.png' }} />
          </div>
          <h1 className="checklist-title-h1">FITORIALIST 상담 체크리스트</h1>
          <p className="checklist-subtitle">
            핏걸즈는 고객님이 원하는 분위기와 결과물에 더 가까이 다가가기 위해<br />
            촬영 전 무드, 포즈, 스타일링 방향을 함께 확인합니다.<br />
            아래 내용을 작성해주시면 고객님께 가장 잘 어울리는 촬영 방향을 준비하는 데 도움이 됩니다.
          </p>
        </header>

        {/* Form */}
        <form onSubmit={handleSubmit} className="checklist-form">
          
          {/* Card 0: Basic Info */}
          <div className="checklist-card">
            <span className="card-num">Step 0</span>
            <h2 className="card-question">기본 정보 입력</h2>
            <span className="card-desc">고객님의 예약 정보를 입력해주세요.</span>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="text-input-wrapper">
                <label className="text-input-label" htmlFor="client-name">
                  이름<span className="required-star">*</span>
                </label>
                <input
                  id="client-name"
                  type="text"
                  required
                  placeholder="이름을 입력해주세요"
                  className="checklist-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="text-input-wrapper">
                <label className="text-input-label" htmlFor="client-phone">
                  연락처 (휴대폰 번호)<span className="required-star">*</span>
                </label>
                <input
                  id="client-phone"
                  type="tel"
                  required
                  placeholder="휴대폰 번호를 입력해주세요 (예: 010-1234-5678)"
                  className="checklist-input"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <div className="text-input-wrapper">
                <label className="text-input-label" htmlFor="shoot-date">
                  촬영일<span className="required-star">*</span>
                </label>
                <input
                  id="shoot-date"
                  type="date"
                  required
                  className="checklist-input"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Card 0.5: Concept Select */}
          <div className="checklist-card">
            <span className="card-num">Step 0.5</span>
            <h2 className="card-question">예약하신 촬영 컨셉 (상품)</h2>
            <span className="card-desc">예약하신 촬영 종류를 선택해주세요.</span>
            
            <div className="options-list">
              {CONCEPT_OPTIONS.map((option) => (
                <label key={option} className={`option-item ${selectedConcept === option ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="concept"
                    value={option}
                    checked={selectedConcept === option}
                    onChange={() => setSelectedConcept(option)}
                    className="option-input"
                  />
                  <span className="option-indicator"></span>
                  <span className="option-text">{option}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Dynamic Concept Section Header */}
          {conceptCount > 1 && (
            <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ fontSize: '0.9rem', color: '#ff1e27', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                촬영 컨셉별 개별 시안 설정
              </div>
              <div className="concept-tabs-container">
                {Array.from({ length: conceptCount }).map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className={`concept-tab-btn ${activeConceptIdx === idx ? 'active' : ''}`}
                    onClick={() => setActiveConceptIdx(idx)}
                  >
                    {idx + 1}번째 컨셉
                  </button>
                ))}
              </div>
              <span style={{ fontSize: '0.8rem', color: '#777', marginTop: '-4px' }}>
                각 탭을 선택하여 해당 촬영 컨셉에 맞는 시안을 입력해 주세요. (현재 선택: {activeConceptIdx + 1}번째 컨셉)
              </span>
            </div>
          )}

          {/* Card 1: Mood (Concept specific) */}
          <div className="checklist-card">
            <span className="card-num">Concept {activeConceptIdx + 1} - Question 1</span>
            <h2 className="card-question">[{activeConceptIdx + 1}번째 컨셉] 원하시는 촬영 무드는 어떤 쪽에 가까우세요?</h2>
            <span className="card-desc">해당 컨셉에 원하는 분위기를 선택해주세요.</span>
            
            <div className="options-list">
              {MOOD_OPTIONS.map((option) => (
                <label key={option} className={`option-item ${concepts[activeConceptIdx].mood === option ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name={`mood-${activeConceptIdx}`}
                    value={option}
                    checked={concepts[activeConceptIdx].mood === option}
                    onChange={() => updateConceptField('mood', option)}
                    className="option-input"
                  />
                  <span className="option-indicator"></span>
                  <span className="option-text">{option}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Card 1.5: Expression (Concept specific) */}
          <div className="checklist-card">
            <span className="card-num">Concept {activeConceptIdx + 1} - Question 1.5</span>
            <h2 className="card-question">[{activeConceptIdx + 1}번째 컨셉] 원하시는 표정 스타일은 무엇인가요?</h2>
            <span className="card-desc">이 컨셉에서 짓고 싶거나 편한 미소/표정 성향을 선택해 주세요.</span>
            
            <div className="options-list">
              {EXPRESSION_OPTIONS.map((option) => (
                <label key={option} className={`option-item ${concepts[activeConceptIdx].expression === option ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name={`expression-${activeConceptIdx}`}
                    value={option}
                    checked={concepts[activeConceptIdx].expression === option}
                    onChange={() => updateConceptField('expression', option)}
                    className="option-input"
                  />
                  <span className="option-indicator"></span>
                  <span className="option-text">{option}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Card 2: Reference Image (Common) */}
          <div className="checklist-card">
            <span className="card-num">Question 2</span>
            <h2 className="card-question">참고하고 싶은 이미지가 있으신가요?</h2>
            <span className="card-desc">핀터레스트, 인스타그램 등의 참고 이미지가 있다면 기재해주세요.</span>
            
            <div className="options-list">
              {REF_IMG_OPTIONS.map((option) => (
                <label key={option} className={`option-item ${refImgState === option ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="refImageState"
                    value={option}
                    checked={refImgState === option}
                    onChange={() => setRefImgState(option)}
                    className="option-input"
                  />
                  <span className="option-indicator"></span>
                  <span className="option-text">{option}</span>
                </label>
              ))}
            </div>

            {refImgState.includes('참고 이미지 있음') && (
              <div className="conditional-input-area">
                <div className="text-input-wrapper">
                  <label className="text-input-label" htmlFor="ref-img-text">참고 이미지 링크 또는 메모</label>
                  <input
                    id="ref-img-text"
                    type="text"
                    placeholder="참고 이미지 링크나 원하는 분위기를 적어주세요"
                    className="checklist-input"
                    value={refImgText}
                    onChange={(e) => setRefImgText(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Card 3: Emphasis Part (Common) */}
          <div className="checklist-card">
            <span className="card-num">Question 3</span>
            <h2 className="card-question">촬영에서 가장 강조하고 싶은 부분은 어디인가요?</h2>
            <span className="card-desc">가장 예쁘게 담고 싶은 곳을 선택해주세요. (중복 선택 가능)</span>
            
            <div className="options-list">
              {EMPHASIS_OPTIONS.map((option) => (
                <label key={option} className={`option-item ${emphasis.includes(option) ? 'selected' : ''}`}>
                  <input
                    type="checkbox"
                    value={option}
                    checked={emphasis.includes(option)}
                    onChange={() => handleEmphasisToggle(option)}
                    className="option-input"
                  />
                  <span className="option-indicator square"></span>
                  <span className="option-text">{option}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Card 4: Burden Pose (Common) */}
          <div className="checklist-card">
            <span className="card-num">Question 4</span>
            <h2 className="card-question">부담스러운 포즈나 노출 정도가 있으신가요?</h2>
            <span className="card-desc">피하고 싶은 자세나 부담스러운 노출 범위를 선택해주세요. (중복 선택 가능)</span>
            
            <div className="options-list">
              {BURDEN_OPTIONS.map((option) => (
                <label key={option} className={`option-item ${burden.includes(option) ? 'selected' : ''}`}>
                  <input
                    type="checkbox"
                    value={option}
                    checked={burden.includes(option)}
                    onChange={() => handleBurdenToggle(option)}
                    className="option-input"
                  />
                  <span className="option-indicator square"></span>
                  <span className="option-text">{option}</span>
                </label>
              ))}
            </div>

            <div className="conditional-input-area">
              <div className="text-input-wrapper">
                <label className="text-input-label" htmlFor="burden-text">추가로 피하고 싶은 부분</label>
                <input
                  id="burden-text"
                  type="text"
                  placeholder="부담스러운 포즈나 노출 정도를 자유롭게 적어주세요"
                  className="checklist-input"
                  value={burdenText}
                  onChange={(e) => setBurdenText(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Card: Selfie Angle Select */}
          <div className="checklist-card">
            <span className="card-num">Question 4.5</span>
            <h2 className="card-question">주로 자신 있는 얼굴 방향(셀카 각도)은 어느 쪽이신가요?</h2>
            <span className="card-desc">가장 아름다운 실루엣과 각도를 중심으로 맞춤 촬영하기 위해 고르시는 방향입니다.</span>
            
            <div className="options-list">
              {SELFIE_ANGLE_OPTIONS.map((option) => (
                <label key={option.label} className={`option-item ${selfieAngle === option.label ? 'selected' : ''}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: '16px', gap: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                    <input
                      type="radio"
                      name="selfieAngle"
                      value={option.label}
                      checked={selfieAngle === option.label}
                      onChange={() => setSelfieAngle(option.label)}
                      className="option-input"
                    />
                    <span className="option-indicator"></span>
                    <span className="option-text" style={{ fontWeight: 'bold' }}>{option.label}</span>
                  </div>
                  <span style={{ fontSize: '0.8rem', color: '#666', marginLeft: '28px', lineHeight: 1.4 }}>
                    {option.desc}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Card 0.7: Skin Tone Select */}
          <div className="checklist-card">
            <span className="card-num">Question 5</span>
            <h2 className="card-question">현재 본인의 피부톤은 어떤 상태이신가요?</h2>
            <span className="card-desc">피부톤에 맞춘 조명 세팅과 조화로운 메이크업/스타일링 조율을 위해 선택해주세요.</span>
            
            <div className="options-list">
              {SKIN_OPTIONS.map((option) => (
                <label key={option} className={`option-item ${selectedSkin === option ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="skin"
                    value={option}
                    checked={selectedSkin === option}
                    onChange={() => setSelectedSkin(option)}
                    className="option-input"
                  />
                  <span className="option-indicator"></span>
                  <span className="option-text">{option}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Card: Retouch Level Select */}
          <div className="checklist-card">
            <span className="card-num">Question 5.5</span>
            <h2 className="card-question">원하시는 보정의 강도를 선택해 주세요.</h2>
            <span className="card-desc">아티스트의 보정 작업 시 원하는 변신의 정도를 조율하기 위한 기준입니다.</span>
            
            <div className="options-list">
              {RETOUCH_LEVEL_OPTIONS.map((option) => (
                <label key={option.label} className={`option-item ${retouchLevel === option.label ? 'selected' : ''}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: '16px', gap: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                    <input
                      type="radio"
                      name="retouchLevel"
                      value={option.label}
                      checked={retouchLevel === option.label}
                      onChange={() => setRetouchLevel(option.label)}
                      className="option-input"
                    />
                    <span className="option-indicator"></span>
                    <span className="option-text" style={{ fontWeight: 'bold' }}>{option.label}</span>
                  </div>
                  <span style={{ fontSize: '0.8rem', color: '#666', marginLeft: '28px', lineHeight: 1.4 }}>
                    {option.desc}
                  </span>
                </label>
              ))}
            </div>
          </div>



          {/* Card 5: Photo Purpose */}
          <div className="checklist-card">
            <span className="card-num">Question 6</span>
            <h2 className="card-question">촬영한 사진은 어디에 사용하실 예정인가요?</h2>
            <span className="card-desc">사진 활용 목적에 따라 전반적인 촬영 방향이 달라질 수 있습니다. (중복 선택 가능)</span>
            
            <div className="options-list">
              {PURPOSE_OPTIONS.map((option) => (
                <label key={option} className={`option-item ${selectedPurpose.includes(option) ? 'selected' : ''}`}>
                  <input
                    type="checkbox"
                    value={option}
                    checked={selectedPurpose.includes(option)}
                    onChange={() => handlePurposeToggle(option)}
                    className="option-input"
                  />
                  <span className="option-indicator square"></span>
                  <span className="option-text">{option}</span>
                </label>
              ))}
            </div>

            {selectedPurpose.includes('기타') && (
              <div className="conditional-input-area">
                <div className="text-input-wrapper">
                  <label className="text-input-label" htmlFor="purpose-text">기타 사용 목적</label>
                  <input
                    id="purpose-text"
                    type="text"
                    placeholder="기타 사용 목적을 적어주세요"
                    className="checklist-input"
                    value={purposeText}
                    onChange={(e) => setPurposeText(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Card 6: Free Text */}
          <div className="checklist-card">
            <span className="card-num">Free Description</span>
            <h2 className="card-question">추가로 원하시는 촬영 느낌이 있다면 자유롭게 적어주세요.</h2>
            
            <div className="example-box">
              <span className="example-title">예시</span>
              <p className="example-text">
                • 자연스럽지만 분위기 있게 찍고 싶어요.<br />
                • 핀터레스트에서 본 화이트 셔츠 느낌으로 찍고 싶어요.<br />
                • 패션화보처럼 시크하고 고급스럽게 찍고 싶어요.
              </p>
            </div>

            <textarea
              placeholder="원하시는 촬영 느낌을 자유롭게 적어주세요"
              className="checklist-textarea"
              value={freeNotes}
              onChange={(e) => setFreeNotes(e.target.value)}
            />
          </div>

          {/* Brand Intro & Submit Button */}
          <div className="checklist-footer-desc">
            <p className="footer-top-phrase">
              작성해주신 내용을 바탕으로<br />
              핏걸즈가 고객님께 어울리는 무드, 포즈, 스타일링을 함께 기획해드립니다.
            </p>

            {/* 촬영 당일 유의사항 박스 추가 */}
            <div className="shoot-notice-box" style={{
              background: '#fff9f9',
              border: '1px solid #ffd8d8',
              borderRadius: '12px',
              padding: '16px 20px',
              textAlign: 'left',
              marginTop: '16px',
              marginBottom: '20px',
              fontSize: '0.85rem',
              color: '#333',
              lineHeight: '1.6'
            }}>
              <strong style={{ color: '#ff1e27', display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>📢 촬영 당일 유의사항 안내</strong>
              <ul style={{ margin: 0, paddingLeft: '18px', listStyleType: 'disc' }}>
                <li>촬영일에는 몸에 의류 자국이 남지 않도록 <strong>최대한 헐렁하고 편안한 옷</strong>을 입고 와주세요.</li>
                <li>스튜디오에서 대여 가능한 의상은 사전에 담당 작가님에게 확인 후 꼭 전달해 주세요.</li>
                <li>핏걸즈 스튜디오에는 운동 소품인 <strong>아령(1, 2, 3, 4kg), 루프 밴드, 요가 매트</strong>가 기본 보유되어 있습니다.</li>
                <li>촬영 연출용 <strong>바디 오일, 바세린, 니플 패치</strong>도 스튜디오 내에 완벽하게 준비되어 있으니 편하게 방문해 주세요.</li>
              </ul>
            </div>
            
            <h3 className="footer-brand-title">FITORIALIST</h3>
            <p className="footer-brand-explain">
              FIT + EDITORIAL + IST<br /><br />
              나의 핏과 분위기를 하나의 에디토리얼 화보처럼 완성하는 핏걸즈의 {new Date().getFullYear()} 촬영 프로젝트입니다.
            </p>
          </div>

          <div className="submit-btn-wrapper">
            <button
              type="submit"
              disabled={loading || !name.trim() || !phone.trim() || !date}
              className="checklist-submit-btn"
            >
              {loading ? '제출 중...' : '체크리스트 제출하기'}
            </button>
          </div>

        </form>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="success-modal-overlay">
          <div className="success-modal-content">
            <div className="success-icon-wrapper">
              <MdCheckCircle className="success-icon" style={{ fontSize: '32px', color: '#ff1e27' }} />
            </div>
            <h3 className="success-modal-title">체크리스트 제출 완료</h3>
            <p className="success-modal-desc">
              체크리스트가 성공적으로 제출되었습니다.<br />
              핏걸즈가 촬영 방향을 확인 후 준비해드릴게요.
            </p>
            <button onClick={handleCloseModal} className="success-modal-btn">
              홈페이지로 이동하기
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Checklist;
