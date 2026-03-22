import React from 'react';
import './Location.css';

const Location = () => {
  const studioAddress = "B1, Artium Bldg, 18 Gangnam-daero 160-gil, Gangnam-gu, Seoul";
  const studioMapUrl = "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3164.717!2d127.017!3d37.514!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x357ca3e72dc7d3f9%3A0xc3f1f7ca45df27d0!2z6rCV64Ko64yA66GcIDYzNg!5e0!3m2!1sko!2skr!4v1683901234567!5m2!1sko!2skr";

  return (
    <section id="location" className="snap-section location-section">
      <div className="container location-content">
        <header className="location-header">
          <h2 className="location-title">LOCATION</h2>
          <span className="location-subtitle">How to find us</span>
        </header>

        <div className="location-card">
          <div className="location-map-container">
            <iframe 
              src={studioMapUrl}
              width="100%" 
              height="100%" 
              style={{ border: 0 }} 
              allowFullScreen="" 
              loading="lazy"
              title="Studio Location"
            ></iframe>
          </div>

          <div className="location-info">
            <div className="info-group">
              <h3 className="info-label">ADDRESS.</h3>
              <p className="info-text">
                {studioAddress}<br />
                (서울특별시 강남구 강남대로 160길 18 아티움빌딩 B1)
              </p>
            </div>

            <div className="info-group">
              <h3 className="info-label">PARKING GUIDE</h3>
              <p className="info-text">
                전용 주차장이 없습니다. 가장 가깝고 합리적인 [두원빌딩 유료주차장] 이용을 추천드립니다.<br />
                (서울 강남구 강남대로 636, 도보 2분)
              </p>
            </div>

            <div className="info-group">
              <h3 className="info-label">CONTACT.</h3>
              <p className="info-text">
                TEL. +82.10.4696.1434<br />
                EMAIL. inafit@daum.net<br />
                ALL DAY 10:00 ~ 23:00
              </p>
            </div>

            <div className="location-actions">
              <button className="btn-find-studio" onClick={() => window.open('https://naver.me/GWeuhE37')}>📍 스튜디오 길찾기</button>
              <button className="btn-find-parking" onClick={() => window.open('https://map.naver.com/p/search/두원빌딩%20주차장/place/667509448?placePath=%3Fbk_query%3D%25EB%2591%2590%25EC%259B%2590%25EB%25B9%258C%25EB%2594%25A9%2520%25EC%25A3%25BC%25EC%25B0%25A8%25EC%259E%25A5%26entry%3Dpll%26from%3Dnx%26fromNxList%3Dtrue&placeSearchOption=bk_query%3D%25EB%2591%2590%25EC%259B%2590%25EB%25B9%258C%25EB%2594%25A9%2520%25EC%25A3%25BC%25EC%25B0%25A8%25EC%259E%25A5%26entry%3Dpll%26fromNxList%3Dtrue%26x%3D127.022781%26y%3D37.524010&searchType=place')}>🏎️ 주차장 위치보기</button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Location;
