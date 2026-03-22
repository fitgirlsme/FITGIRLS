import React from 'react';
import { useTranslation } from 'react-i18next';
import FadeInSection from './FadeInSection';
import './HM.css';

const HM = () => {
    const { t } = useTranslation();

    return (
        <section className="snap-section hairmakeup-container" id="hair-makeup">
            <div className="container-inner hairmakeup-inner">
                <header className="hairmakeup-header">
                    <div className="hairmakeup-header-left">
                        <h2 className="hairmakeup-title">HAIR & MAKEUP</h2>
                    </div>
                    <div className="hairmakeup-header-right">
                        <span className="hairmakeup-subtitle">제휴 헤어메이크업 안내</span>
                    </div>
                </header>

                <FadeInSection delay={0.2}>
                    <div className="hairmakeup-card">
                        <h3 className="hairmakeup-shop-name">마벨꾸띠끄(Mabelle Boutique)</h3>
                        
                        <div className="hairmakeup-desc-box">
                            <p className="hairmakeup-desc">
                                헤어/메이크업 연계샵 문의 시 마벨꾸띠끄에서 제휴가에 진행 가능합니다.<br />
                                *메이크업 예약이 빠르게 마감되는 관계로 핏걸즈&이너핏 촬영 예약과 동시에 메이크업 예약 추천드립니다.<br />
                                *예약 시 핏걸즈&이너핏 네이버예약 내역을 말씀해 주셔야 제휴 가격이 적용됩니다.<br />
                                직접 예약 필수 (출장 불가)
                            </p>
                        </div>

                        <div className="hairmakeup-price-list">
                            <div className="hairmakeup-price-row">
                                <span className="label">여자</span>
                                <span className="price">88,000원 <small>(부가세 포함)</small></span>
                            </div>
                            <div className="hairmakeup-price-row">
                                <span className="label">남자</span>
                                <span className="price">66,000원 <small>(부가세 포함)</small></span>
                            </div>
                        </div>

                        <div className="hairmakeup-info">
                            <div className="hairmakeup-info-row">
                                <span className="info-label">Tel.</span>
                                <a href="tel:050713591859" className="info-value">0507-1359-1859</a>
                            </div>
                            <div className="hairmakeup-info-row">
                                <span className="info-label">주소.</span>
                                <span className="info-value">서울 강남구 학동로 47길 5 1층 (강남구청역 도보 5분)</span>
                            </div>
                        </div>

                        <div className="hairmakeup-buttons">
                            <a 
                                href="https://pf.kakao.com/_qxiuxmxj" 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="hairmakeup-btn kakao"
                            >
                                카카오톡 채널
                            </a>
                            <a 
                                href="https://www.instagram.com/mabelle_boutique_" 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="hairmakeup-btn insta"
                            >
                                인스타그램
                            </a>
                        </div>
                    </div>
                </FadeInSection>
            </div>
        </section>
    );
};

export default HM;
