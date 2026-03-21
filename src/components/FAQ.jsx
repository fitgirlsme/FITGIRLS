import React, { useState, useEffect } from 'react';
import './FAQ.css';

const faqData = {
    BEFORE_BOOKING: [
        { id: 1, question: "How do I make a reservation?", answer: "Please inquire on the FITGIRLS Kakao Channel first to check the schedule. After consultation, please apply through the reservation system we guide you to..." },
        { id: 2, question: "How much does the shoot cost?", answer: "Detailed package prices can be checked directly on the Naver Smart Place or the KakaoTalk consultation channel menu." },
        { id: 3, question: "What is the cancellation and refund policy?", answer: "A 100% refund of the deposit is possible if canceled 50 days or more before the shoot date. Cancellations made within 49 days are non-refundable." }
    ],
    BEFORE_SHOOTING: [
        { id: 4, question: "By when do I need to submit my shoot concept draft?", answer: "You must upload a draft of the vibe you want by 1 week before the shoot." },
        { id: 5, question: "What time should I arrive on the day of the shoot?", answer: "Our policy is for you to arrive 30 minutes before your reservation time." }
    ],
    AFTER_SHOOTING: [
        { id: 6, question: "When and how will I receive the original photos?", answer: "We will send all the originals on the day of the shoot via email and Airdrop." },
        { id: 7, question: "How long does the retouching process take?", answer: "Final retouched versions will be sent in about 4 weeks after selection." }
    ]
};

const FAQ = () => {
  const [activeTab, setActiveTab] = useState('BEFORE_BOOKING');
  const [faqs, setFaqs] = useState(faqData.BEFORE_BOOKING);

  useEffect(() => {
    setFaqs(faqData[activeTab]);
  }, [activeTab]);

  return (
    <section id="faq" className="snap-section faq-section">
      <div className="container faq-content">
        <header className="faq-header">
          <h2 className="faq-title">FAQ</h2>
          <span className="faq-subtitle">자주 묻는 질문</span>
        </header>

        <nav className="faq-tabs">
          <button 
            className={`faq-tab-btn ${activeTab === 'BEFORE_BOOKING' ? 'active' : ''}`}
            onClick={() => setActiveTab('BEFORE_BOOKING')}
          >
            예약 전
          </button>
          <button 
            className={`faq-tab-btn ${activeTab === 'BEFORE_SHOOTING' ? 'active' : ''}`}
            onClick={() => setActiveTab('BEFORE_SHOOTING')}
          >
            촬영 전
          </button>
          <button 
            className={`faq-tab-btn ${activeTab === 'AFTER_SHOOTING' ? 'active' : ''}`}
            onClick={() => setActiveTab('AFTER_SHOOTING')}
          >
            촬영 후
          </button>
        </nav>

        <div className="faq-list">
          {faqs.map((item) => (
            <div key={item.id} className="faq-item">
              <div className="faq-question">
                <span className="q-icon">Q</span>
                <span className="question-text">{item.question}</span>
                <span className="plus-icon">+</span>
              </div>
              <div className="faq-answer">
                <p>{item.answer}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQ;
