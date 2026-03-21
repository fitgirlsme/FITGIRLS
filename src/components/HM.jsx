import React from 'react';
import './HM.css';

const HM = () => {
    return (
        <section className="snap-section hairmakeup-container">
            <div className="container-inner">
                <header className="section-header">
                    <h2 className="section-title">HAIR & MAKEUP</h2>
                    <span className="section-subtitle">제휴 헤어메이크업 안내</span>
                </header>

                <div className="hairmakeup-card">
                    <h3 className="hairmakeup-shop-name">마벨꾸띠끄 (Mabelle Boutique)</h3>
                    <p className="hairmakeup-desc">
                        헤어/메이크업 연계샵 문의 시 마벨꾸띠끄에서 제휴가에 진행 가능합니다.
                        {"\n"}메이크업 예약이 빠르게 마감되는 관계로 핏걸즈 & 이너핏 촬영 예약과 동시에 메이크업 예약을 추천드립니다.
                        {"\n"}직접 예약 필수 (출장 불가)
                    </p>

                    <div className="hairmakeup-price-list">
                        <div className="hairmakeup-price-row">
                            <span>여자 (Female)</span>
                            <span>88,000 KRW <small>(VAT Incl.)</small></span>
                        </div>
                        <div className="hairmakeup-price-row">
                            <span>남자 (Male)</span>
                            <span>66,000 KRW <small>(VAT Incl.)</small></span>
                        </div>
                    </div>

                    <div className="hairmakeup-info">
                        <div className="hairmakeup-info-row">
                            <strong>TEL</strong>
                            <span>0507-1359-1859</span>
                        </div>
                        <div className="hairmakeup-info-row">
                            <strong>ADDR</strong>
                            <span>서울 강남구 학동로 47길 5 1층 (강남구청역 도보 5분)</span>
                        </div>
                    </div>

                    <div className="hairmakeup-buttons">
                        <a href="https://pf.kakao.com/_xxxx" target="_blank" rel="noopener noreferrer" className="hairmakeup-btn kakao">카카오톡 채널 상담</a>
                        <a href="https://www.instagram.com/mabelle_boutique_" target="_blank" rel="noopener noreferrer" className="hairmakeup-btn insta">인스타그램</a>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default HM;
