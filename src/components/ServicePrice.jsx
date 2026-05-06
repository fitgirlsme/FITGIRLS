import React, { useState } from 'react';
import './ServicePrice.css';

const pricingData = {
    PORTRAIT: [
        {
            id: 1,
            category: 'PERSONAL · 개인 촬영',
            title: '1 컨셉',
            price: '275,000원',
            details: [
                '컨셉당 의상 1벌, 배경 2가지',
                '보정 2장 · 5x7 프린트 1장 · 웹용 원본파일 제공 · 30분 촬영'
            ]
        },
        {
            id: 2,
            category: 'PERSONAL · 개인 촬영',
            title: '2 컨셉',
            price: '440,000원',
            details: [
                '컨셉당 의상 1벌, 배경 무제한 · 포즈 무제한',
                '보정 4장 · 5x7 프린트 2장 · 웹용 원본파일 제공 · 90분 촬영'
            ]
        },
        {
            id: 3,
            category: 'PERSONAL · 개인 촬영',
            title: '3 컨셉',
            price: '550,000원',
            details: [
                '의상 · 배경 · 포즈 모두 무제한 활용',
                '보정 6장 · 5x7 프린트 3장 · 웹용 원본파일 제공 · 120분 촬영'
            ]
        }
    ],
    FRIENDS: [
        {
            id: 4,
            category: '우정 & 커플 패키지',
            title: '우정/커플 1컨셉',
            price: '330,000원',
            details: [
                '2~3인 기준 (4인부터 1인 추가 50,000원)',
                '의상 1벌씩 · 배경 1개 · 포즈 2~3가지',
                '보정 2장 · 개인당 5x7 프린트 1장 · 30분 촬영'
            ]
        },
        {
            id: 5,
            category: '우정 & 커플 패키지',
            title: 'PACKAGE 1',
            price: '770,000원',
            details: [
                '개인 1컨셉씩 2명 + 우정 1컨셉',
                '토탈 보정 6장'
            ]
        },
        {
            id: 6,
            category: '우정 & 커플 패키지',
            title: 'PACKAGE 2',
            price: '1,100,000원',
            details: [
                '개인 2컨셉씩 2명 + 우정 1컨셉',
                '토탈 보정 10장'
            ]
        }
    ]
};

const ServicePrice = () => {
    const [activeTab, setActiveTab] = useState('PORTRAIT');

    return (
        <section id="service" className="snap-section service-container">
            <div className="container-inner">
                <header className="service-main-header">
                    <span className="service-main-subtitle">PRICING & SERVICES</span>
                    <h2 className="service-main-title">SERVICE MENU</h2>
                    <p className="service-main-desc">핏걸즈만의 감도 높은 결과물을 합리적인 구성으로 만나보세요.</p>
                </header>

                <nav className="service-tabs">
                    <button 
                        className={`service-tab-btn ${activeTab === 'PORTRAIT' ? 'active' : ''}`}
                        onClick={() => setActiveTab('PORTRAIT')}
                    >
                        PORTRAIT MENU
                    </button>
                    <button 
                        className={`service-tab-btn ${activeTab === 'FRIENDS' ? 'active' : ''}`}
                        onClick={() => setActiveTab('FRIENDS')}
                    >
                        FRIENDS & COUPLE
                    </button>
                </nav>

                <div className="service-category">
                    <div className="service-cards">
                        {pricingData[activeTab].map((item) => (
                            <div key={item.id} className="service-card">
                                <div className="service-header">
                                    <div className="service-name-wrapper">
                                        <span className="category-label">{item.category}</span>
                                        <h3 className="service-name">{item.title}</h3>
                                    </div>
                                    <span className="service-price">{item.price}</span>
                                </div>
                                <ul className="service-details">
                                    {item.details.map((detail, idx) => (
                                        <li key={idx}>{detail}</li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="service-notice">
                    <ul>
                        <li>재방문 예약 시 2회 20%, 3회 이상 30% 할인 혜택 (카카오채널 문의)</li>
                        <li>예약제 스튜디오 · 모든 금액은 VAT 포함</li>
                        <li><strong>핏걸즈 스튜디오는 평일&주말 가격이 모두 동일합니다.</strong></li>
                        <li>보정기간 : 셀렉 당일 1장 당일 보정, 나머지 사진은 약 4주 이내 완료</li>
                        <li>추가 보정은 장당 33,000원 비용이 발생합니다.</li>
                        <li>네이버 리뷰 작성 시 보정 1장 서비스 제공.</li>
                    </ul>
                </div>
                
                <div style={{ marginTop: '30px', textAlign: 'center', fontSize: '0.8rem', color: '#999', lineHeight: '1.6' }}>
                    <p style={{ margin: 0, fontWeight: '700' }}>[계약금 및 환불 규정]</p>
                    <p style={{ margin: '4px 0 0 0' }}>스케줄 변경 시 남은 기간과 관계없이 계약금 환불은 불가합니다.</p>
                </div>
            </div>
        </section>
    );
};

export default ServicePrice;
