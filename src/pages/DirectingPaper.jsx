import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import html2canvas from 'html2canvas';
import Header from '../components/Header';
import './DirectingPaper.css';

/* ===== Category Data (i18n keys) ===== */
const CATEGORIES = [
  {
    id: 'mood', i18nKey: 'mood', icon: '🌙', type: 'single',
    options: [
      { key: 'opt_deep', icon: '🖤' },
      { key: 'opt_sunday', icon: '☀️' },
      { key: 'opt_highkey', icon: '✨' },
      { key: 'opt_grunge', icon: '⚡' },
      { key: 'opt_architectural', icon: '🏛️' },
      { key: 'opt_noir', icon: '🎬' },
      { key: 'opt_elegance', icon: '🦢' },
      { key: 'opt_vintage', icon: '🎞️' },
    ]
  },
  {
    id: 'color', i18nKey: 'color', icon: '🎨', type: 'single',
    options: [
      { key: 'opt_mono', icon: '⬛' },
      { key: 'opt_sunlight', icon: '🌅' },
      { key: 'opt_cyber', icon: '🧊' },
      { key: 'opt_pop', icon: '🍭' },
      { key: 'opt_earthy', icon: '🌿' },
      { key: 'opt_y2k', icon: '📼' },
      { key: 'opt_midnight', icon: '🌌' },
      { key: 'opt_desert', icon: '🏜️' },
    ]
  },
  {
    id: 'expression', i18nKey: 'expression', icon: '😎', type: 'single',
    options: [
      { key: 'opt_playful', icon: '😜' },
      { key: 'opt_relaxed', icon: '😌' },
      { key: 'opt_fierce', icon: '🔥' },
      { key: 'opt_dreamy', icon: '💭' },
      { key: 'opt_chic', icon: '🧥' },
      { key: 'opt_raw_emotion', icon: '🎭' },
      { key: 'opt_radiant', icon: '😁' },
      { key: 'opt_mysterious', icon: '👁️' },
    ]
  },
  {
    id: 'focus', i18nKey: 'focus', icon: '💪', type: 'multi',
    options: [
      { key: 'opt_abs', icon: '🔲' },
      { key: 'opt_back', icon: '🔙' },
      { key: 'opt_arms', icon: '💪' },
      { key: 'opt_legs', icon: '🦵' },
      { key: 'opt_glutes', icon: '🍑' },
      { key: 'opt_shoulders', icon: '🔺' },
      { key: 'opt_sline', icon: '〰️' },
      { key: 'opt_fullbody', icon: '🧍' },
    ]
  },
  {
    id: 'texture', i18nKey: 'texture', icon: '💎', type: 'single',
    options: [
      { key: 'opt_glossy', icon: '💧' },
      { key: 'opt_peachy', icon: '🍑' },
      { key: 'opt_matte', icon: '☁️' },
      { key: 'opt_sweaty', icon: '💦' },
      { key: 'opt_velvet', icon: '🧣' },
      { key: 'opt_sunkissed', icon: '🌞' },
      { key: 'opt_raw_tex', icon: '🗿' },
      { key: 'opt_metallic', icon: '📀' },
    ]
  },
  {
    id: 'skintone', i18nKey: 'skintone', icon: '🎭', type: 'single',
    options: [
      { key: 'opt_white', icon: '🤍' },
      { key: 'opt_natural', icon: '🧡' },
      { key: 'opt_tanning', icon: '🤎' },
    ]
  },
];

const PRESETS = [
  { id: 'hip', mood: 'opt_grunge', color: 'opt_y2k', expression: 'opt_chic' },
  { id: 'elegant', mood: 'opt_elegance', color: 'opt_sunlight', expression: 'opt_relaxed' },
  { id: 'vivid', mood: 'opt_highkey', color: 'opt_pop', expression: 'opt_radiant' },
  { id: 'noir', mood: 'opt_noir', color: 'opt_midnight', expression: 'opt_mysterious' },
  { id: 'minimal', mood: 'opt_architectural', color: 'opt_mono', expression: 'opt_chic' },
];

/* ===== D-Day Calculator ===== */
function calcDDay(targetDateStr) {
  if (!targetDateStr) return null;
  const parts = targetDateStr.split('-');
  if (parts.length !== 3) return null;
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10) - 1;
  const d = parseInt(parts[2], 10);
  if (isNaN(y) || isNaN(m) || isNaN(d)) return null;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const target = new Date(y, m, d); target.setHours(0, 0, 0, 0);
  const diff = Math.round((target - today) / (1000 * 60 * 60 * 24));
  if (diff > 0) return `D-${diff}`;
  if (diff === 0) return 'D-DAY';
  return `D+${Math.abs(diff)}`;
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

/* ===== Component ===== */
const DirectingPaper = () => {
  const { t, i18n } = useTranslation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [step, setStep] = useState('intro');
  const [userName, setUserName] = useState('');
  const [shootDate, setShootDate] = useState('');
  const [conceptCount, setConceptCount] = useState(1);
  const [activeConceptIdx, setActiveConceptIdx] = useState(0);
  const [selections, setSelections] = useState({});
  const [results, setResults] = useState([]);
  const [resultTabIdx, setResultTabIdx] = useState(0);
  const captureRefs = useRef([]);
  const dday = calcDDay(shootDate);

  const completedConcepts = results.length;
  const progress = step === 'intro' ? 0 : step === 'result' ? 100
    : Math.round(((completedConcepts * CATEGORIES.length + Object.keys(selections).length) / (conceptCount * CATEGORIES.length)) * 100);

  // Helper to get translated option name (for display & storing)
  const optName = (key) => t(`directing.${key}.name`, key);
  const optSub = (key) => t(`directing.${key}.sub`, '');
  const catLabel = (cat) => t(`directing.${cat.i18nKey}.label`, cat.id.toUpperCase());
  const catName = (cat) => t(`directing.${cat.i18nKey}.name`, cat.id);

  const handleStart = () => {
    if (!userName.trim() || !shootDate) return;
    setResults([]); setActiveConceptIdx(0); setSelections({}); setStep('select');
  };

  const handleSingleSelect = (catId, optionKey) => {
    setSelections(prev => ({ ...prev, [catId]: optionKey }));
  };

  const handleMultiToggle = (catId, optionKey) => {
    setSelections(prev => {
      const current = prev[catId] || [];
      const updated = current.includes(optionKey)
        ? current.filter(k => k !== optionKey)
        : [...current, optionKey];
      return { ...prev, [catId]: updated };
    });
  };

  const handleApplyPreset = (preset) => {
    setSelections(prev => {
      const next = { ...prev };
      if (preset.mood) next.mood = preset.mood;
      if (preset.color) next.color = preset.color;
      if (preset.expression) next.expression = preset.expression;
      return next;
    });
  };

  const handleConceptDone = () => {
    const allFilled = CATEGORIES.every(cat => {
      const val = selections[cat.id];
      if (cat.type === 'multi') return val && val.length > 0;
      return !!val;
    });
    if (!allFilled) { alert(t('directing.alert_fill')); return; }

    const newResults = [...results, { ...selections }];
    setResults(newResults);

    if (newResults.length < conceptCount) {
      setActiveConceptIdx(prev => prev + 1);
      setSelections({});
    } else {
      setStep('result');
    }
  };

  const handleSave = async (idx) => {
    const el = captureRefs.current[idx];
    if (!el) return;
    try {
      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#0a0a0a',
        width: el.offsetWidth,
        height: el.offsetHeight,
        logging: false,
      });
      const link = document.createElement('a');
      link.download = `directing_paper_${userName}_concept${idx + 1}.png`;
      link.href = canvas.toDataURL('image/png', 1.0);
      link.click();
    } catch (err) {
      console.error(err);
      alert('이미지 저장에 실패했습니다.');
    }
  };

  const handleRestart = () => {
    setStep('intro'); setUserName(''); setShootDate(''); setConceptCount(1);
    setResults([]); setSelections({}); setActiveConceptIdx(0); setResultTabIdx(0);
  };

  /* ===== Result Card ===== */
  const renderCard = (concept, cIdx) => (
    <>
      <div className="dp-card-top">
        <div className="dp-card-header-line">
          <div className="dp-card-brand">Fitorial Directing Paper</div>
          {dday && <div className="dp-card-dday-top">{dday}</div>}
        </div>
        <div className="dp-card-user-name">{userName}</div>
        <div className="dp-card-date">
          {formatDate(shootDate)}
          {conceptCount > 1 && ` — CONCEPT ${cIdx + 1}`}
        </div>
      </div>
      <div className="dp-card-body">
        {CATEGORIES.map(cat => {
          const val = concept[cat.id];
          if (!val) return null;
          return (
            <div key={cat.id} className="dp-card-concept-block">
              <div className="dp-card-concept-label">
                {cat.icon} {catName(cat)} <span className="dp-label-dot">·</span> <span className="dp-label-en">{catLabel(cat)}</span>
              </div>
              <div className="dp-card-concept-results">
                {Array.isArray(val)
                  ? val.map(k => <span key={k} className="dp-card-result-tag">{optSub(k)}</span>)
                  : <span className="dp-card-result-tag">{optSub(val)}</span>
                }
              </div>
            </div>
          );
        })}
      </div>
      <div className="dp-card-watermark">FITGIRLS.ME</div>
    </>
  );

  /* ===== RENDER ===== */
  const changeLanguage = (lng) => i18n.changeLanguage(lng);

  const handleScroll = (e) => {
    setIsScrolled(e.target.scrollTop > 50);
  };

  return (
    <div className="app-container" onScroll={handleScroll} style={{ overflowY: 'auto', height: '100vh' }}>
      <Header
        isScrolled={isScrolled}
        isOnHero={false}
        changeLanguage={changeLanguage}
        currentLang={i18n.language}
      />
      <div className="dp-container">
        {/* Sub Header */}
        <div className="dp-header-bar">
          <div className="dp-header-logo">Fitorial <span>Directing</span> Paper</div>
          <div className="dp-header-step">
            {step === 'intro' && '✏️ START'}
            {step === 'select' && `🎬 CONCEPT ${activeConceptIdx + 1} / ${conceptCount}`}
            {step === 'result' && '🎬 COMPLETE'}
          </div>
        </div>

      <div className="dp-progress-bar">
        <div className="dp-progress-fill" style={{ width: `${progress}%` }} />
      </div>



      {/* ===== INTRO ===== */}
      {step === 'intro' && (
        <div className="dp-intro dp-fade-in">
          <h1 className="dp-intro-title">{t('directing.title')}</h1>
          <p className="dp-intro-subtitle">{t('directing.subtitle')}</p>
          <div className="dp-intro-form">
            <div className="dp-field">
              <label className="dp-field-label">{t('directing.name_label')}</label>
              <input className="dp-field-input" type="text"
                placeholder={t('directing.name_placeholder')}
                value={userName} onChange={e => setUserName(e.target.value)} />
            </div>
            <div className="dp-field">
              <label className="dp-field-label">{t('directing.date_label')}</label>
              <input className="dp-field-input" type="date"
                value={shootDate} onChange={e => setShootDate(e.target.value)} />
            </div>
            <div className="dp-field">
              <label className="dp-field-label">{t('directing.concept_label')}</label>
              <div className="dp-concept-selector">
                {[1, 2, 3].map(n => (
                  <button key={n}
                    className={`dp-concept-btn ${conceptCount === n ? 'active' : ''}`}
                    onClick={() => setConceptCount(n)}>{n}</button>
                ))}
              </div>
            </div>
            <button className="dp-start-btn" onClick={handleStart}
              disabled={!userName.trim() || !shootDate}>
              {t('directing.start_btn')}
            </button>
          </div>
        </div>
      )}

      {/* ===== SELECT ===== */}
      {step === 'select' && (
        <div className="dp-select-page dp-fade-in" key={activeConceptIdx}>
          {conceptCount > 1 && (
            <div className="dp-tabs">
              {Array.from({ length: conceptCount }, (_, i) => (
                <span key={i} className={`dp-tab ${i === activeConceptIdx ? 'active' : ''} ${i < results.length ? 'done' : ''}`}>
                  🎬 CONCEPT {i + 1}
                </span>
              ))}
            </div>
          )}

          {/* FITORIALIST’s Choice (Presets) */}
          <div className="dp-presets-section">
            <div className="dp-presets-title">{t('directing.preset_choice')}</div>
            <div className="dp-presets-scroll">
              {PRESETS.map(p => (
                <button
                  key={p.id}
                  className="dp-preset-chip"
                  onClick={() => handleApplyPreset(p)}
                >
                  # {t(`directing.preset_${p.id}`)}
                </button>
              ))}
            </div>
          </div>

          {CATEGORIES.map(cat => (
            <div key={cat.id} className="dp-select-section">
              <div className="dp-select-header">
                <span className="dp-select-icon">{cat.icon}</span>
                <div>
                  <div className="dp-select-title">{catLabel(cat)}</div>
                  <div className="dp-select-subtitle">
                    {catName(cat)}{cat.type === 'multi' ? ` ${t('directing.multi_hint')}` : ''}
                  </div>
                </div>
              </div>
              <div className={`dp-select-grid ${cat.type === 'multi' ? 'dp-select-grid-multi' : ''}`}>
                {cat.options.map(opt => {
                  const isSelected = cat.type === 'multi'
                    ? (selections[cat.id] || []).includes(opt.key)
                    : selections[cat.id] === opt.key;
                  return (
                    <div key={opt.key}
                      className={`dp-select-card ${isSelected ? 'selected' : ''}`}
                      onClick={() => cat.type === 'multi'
                        ? handleMultiToggle(cat.id, opt.key)
                        : handleSingleSelect(cat.id, opt.key)
                      }>
                      <div className="dp-select-card-icon">{opt.icon}</div>
                      <div className="dp-select-card-name">{optName(opt.key)}</div>
                      <div className="dp-select-card-sub">{optSub(opt.key)}</div>
                      {isSelected && <div className="dp-select-check">✓</div>}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          <button className="dp-submit-btn" onClick={handleConceptDone}>
            {activeConceptIdx < conceptCount - 1
              ? `${t('directing.submit_btn')} → ${t('directing.submit_next')}`
              : t('directing.result_btn')}
          </button>
        </div>
      )}

      {/* ===== RESULT ===== */}
      {step === 'result' && (
        <div className="dp-result-wrapper dp-fade-in">
          <div className="dp-result-actions">
            <button className="dp-restart-btn" onClick={handleRestart}>{t('directing.restart_btn')}</button>
          </div>

          {/* Concept Tabs (only if multi-concept) */}
          {conceptCount > 1 && (
            <div className="dp-result-tabs">
              {results.map((_, cIdx) => (
                <button
                  key={cIdx}
                  className={`dp-result-tab ${resultTabIdx === cIdx ? 'active' : ''}`}
                  onClick={() => setResultTabIdx(cIdx)}
                >
                  🎬 CONCEPT {cIdx + 1}
                </button>
              ))}
            </div>
          )}

          {/* Active Card */}
          <div className="dp-result-card-group">
            <div className="dp-result-card-label">
              {conceptCount > 1 ? `CONCEPT ${resultTabIdx + 1}` : t('directing.your_direction')}
            </div>
            <div className="dp-result-card">{renderCard(results[resultTabIdx], resultTabIdx)}</div>
            <button className="dp-save-btn" onClick={() => handleSave(resultTabIdx)}>
              {t('directing.save_btn')} {conceptCount > 1 ? `Concept ${resultTabIdx + 1}` : ''}
            </button>
          </div>

          {/* Hidden Capture Cards (one per concept, always mounted) */}
          {results.map((concept, cIdx) => (
            <div key={cIdx} className="dp-capture-card" ref={el => { captureRefs.current[cIdx] = el; }}>
              {renderCard(concept, cIdx)}
            </div>
          ))}
        </div>
      )}
      </div>
    </div>
  );
};

export default DirectingPaper;
