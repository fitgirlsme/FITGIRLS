import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { MdLanguage, MdChat, MdPayment, MdCheckCircle, MdInfo, MdOutlineMap } from 'react-icons/md';
import './GlobalBooking.css';

const GlobalBooking = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const currentLang = i18n.language || 'ko';

  // 언어별 맞춤 콘텐츠 정의 (순서 정정: 라인상담 -> 스마트플레이스예약 -> 예약금9만 페이팔결제)
  const content = {
    ko: {
      title: '글로벌 고객 해외 예약 안내',
      subtitle: '해외 거주 고객님을 위한 [라인상담 ➔ 스마트플레이스 예약 ➔ 페이팔 예약금 결제] 프로세스',
      step1Title: '1. LINE 및 DM 상담 일정 조율',
      step1Desc: '핏걸즈 공식 LINE 계정 또는 인스타그램 DM을 통해 촬영 희망 일시와 원하시는 패키지를 상담해 주세요. (영어/일본어/중국어 상담 지원)',
      step2Title: '2. 네이버 스마트플레이스 예약 등록',
      step2Desc: '상담을 통해 조율된 촬영 일정을 아래의 네이버 예약 버튼을 눌러 등록해 주세요.',
      step3Title: '3. 예약금 90,000원 페이팔(PayPal) 결제',
      step3Desc: '스마트플레이스 예약 후, 아래의 페이팔 결제 버튼을 통해 예약금(90,000 KRW / 상당 달러/엔화)을 결제하시면 최종 확정됩니다.',
      lineBtn: '공식 LINE 상담 연결',
      naverBtn: '네이버 스마트플레이스 예약',
      paypalBtn: '페이팔로 예약금 결제',
      noticeTitle: '해외 고객 필수 확인사항',
      notice1: '촬영 일정 변경 및 취소는 촬영 예정일 최소 14일 전까지 연락해 주셔야 전액 환불이 가능합니다.',
      notice2: '스튜디오 내에 아령(1~4kg), 밴드, 요가 매트, 바디 오일, 니플 패치가 모두 무상 구비되어 있으니 편하게 방문해 주세요.',
      notice3: '대여하고 싶으신 의상이 있는 경우 사전에 라인 상담 시 미리 지정해 주셔야 촬영 당일 지장이 없습니다.'
    },
    en: {
      title: 'Global Booking Guide',
      subtitle: 'Process for Overseas Guests: LINE Inquiry ➔ Naver Booking ➔ PayPal Deposit',
      step1Title: '1. LINE & SNS Consultation',
      step1Desc: 'Message us on official LINE or Instagram DM to coordinate your preferred shoot date and package. (English, Japanese & Chinese supported)',
      step2Title: '2. Naver Smart Place Reservation',
      step2Desc: 'Register your coordinated shoot date on our official Naver Smart Place reservation page by clicking below.',
      step3Title: '3. Deposit 90,000 KRW PayPal Payment',
      step3Desc: 'After registering your reservation on Naver, complete your booking by making a secure deposit of 90,000 KRW (approx. $68 USD) via PayPal.',
      lineBtn: 'Contact Official LINE',
      naverBtn: 'Book via Naver Place',
      paypalBtn: 'Pay Deposit via PayPal',
      noticeTitle: 'Important Guidelines for Foreign Guests',
      notice1: 'Rescheduling or cancellation must be requested at least 14 days prior to your shoot date for a full deposit refund.',
      notice2: 'Workout props (dumbbells 1-4kg, loop bands, yoga mats), body oil, and nipple patches are fully equipped at the studio free of charge.',
      notice3: 'If you wish to rent outfits from the studio, please specify them in advance during the LINE consultation.'
    },
    ja: {
      title: '海外のお客様向け予約案内',
      subtitle: '海外在住のお客様専用の [LINE相談 ➔ Naverスマートプレイス予約 ➔ PayPal決済] プロセス',
      step1Title: '1. LINEおよびDMでの日程調整',
      step1Desc: '公式LINEアカウントまたはInstagramのDMにて、ご希望の撮影日時とプランをご相談ください。（日本語対応スタッフ常駐）',
      step2Title: '2. Naverスマートプレイス予約登録',
      step2Desc: 'ご相談のうえ決定した撮影日程を、下記のNaver予約ボタンよりご登録ください。',
      step3Title: '3. デポジット90,000 KRWのPayPal決済',
      step3Desc: 'スマートプレイスにてご予約登録後、下記のPayPal決済ボタンよりデポジット90,000 KRW（約10,000 JPY）をご決済いただくことでご予約が正式に確定いたします。',
      lineBtn: '公式LINEで相談する',
      naverBtn: 'Naver公式予約へ進む',
      paypalBtn: 'PayPalでデポジットを決済',
      noticeTitle: '海外のお客様への注意事項',
      notice1: '日程変更またはキャンセルは、撮影予定日の14日前までにご連絡いただいた場合のみ、デポジットの全額返金が可能です。',
      notice2: 'スタジオ内にはダンベル(1〜4kg)、ループバンド、ヨガマット、ボディオイル、ニップレスが全て無料で完備されています。',
      notice3: 'レンタル衣装をご希望の場合は、当日の進行をスムーズにするため、事前にLINE相談時に必ずお伝えください。'
    },
    zh: {
      title: '海外客户预约指南',
      subtitle: '为海外居住客户提供的 [微信/LINE咨询 ➔ Naver地图预约 ➔ PayPal定金支付] 流程',
      step1Title: '1. LINE 及 DM 咨询日程',
      step1Desc: '请通过官方 LINE 官方或 Instagram DM 与我们联系，协调您心仪的拍摄日期和套餐。（支持中文、英文及日文服务）',
      step2Title: '2. Naver 官方快速预约',
      step2Desc: '将协调好的拍摄日程在 Naver 官方地图预约页面进行登记。',
      step3Title: '3. 支付 90,000 KRW 定金 (PayPal)',
      step3Desc: '在 Naver 登记预约后，通过下方的 PayPal 按钮支付 90,000 KRW（约 $68 美元）定金以最终确认您的预约。',
      lineBtn: '联系官方 LINE',
      naverBtn: '通过 Naver 官方预约',
      paypalBtn: '通过 PayPal 支付定金',
      noticeTitle: '海外客户注意事项',
      notice1: '如需更改或取消拍摄，请至少在拍摄日前 14 天联系我们，方可获得全额退款。',
      notice2: '教室内免费备有哑铃（1-4kg）、拉力带、瑜伽垫、身体润肤油及胸贴，您可以轻松空手前来。',
      notice3: '如需租赁工作室服装，请务必提前在 LINE 咨询时与我们确认。'
    }
  };

  const activeContent = content[currentLang] || content.ko;

  // 예약 주소 설정
  const PAYPAL_DEPOSIT_LINK = 'https://www.paypal.com/paypalme/imfitgirls'; 
  const LINE_INQUIRY_LINK = 'https://line.me/R/ti/p/@575kojji'; 
  const NAVER_PLACE_LINK = 'https://naver.me/GWeuhE37'; 

  return (
    <div className="global-booking-page">
      <div className="global-booking-container">
        <header className="global-booking-header">
          <div className="language-badge">
            <MdLanguage className="lang-icon" />
            <span>GLOBAL RESERVATION</span>
          </div>
          <h1>{activeContent.title}</h1>
          <p>{activeContent.subtitle}</p>
        </header>

        <div className="global-booking-flow">
          {/* Step 1: LINE */}
          <div className="flow-card">
            <div className="flow-icon-wrap">
              <MdChat size={28} color="#ff1e27" />
            </div>
            <div className="flow-text">
              <h3>{activeContent.step1Title}</h3>
              <p>{activeContent.step1Desc}</p>
              <a href={LINE_INQUIRY_LINK} target="_blank" rel="noopener noreferrer" className="global-action-btn line">
                {activeContent.lineBtn}
              </a>
            </div>
          </div>

          {/* Step 2: Naver */}
          <div className="flow-card">
            <div className="flow-icon-wrap">
              <MdOutlineMap size={28} color="#ff1e27" />
            </div>
            <div className="flow-text">
              <h3>{activeContent.step2Title}</h3>
              <p>{activeContent.step2Desc}</p>
              <a href={NAVER_PLACE_LINK} target="_blank" rel="noopener noreferrer" className="global-action-btn naver">
                {activeContent.naverBtn}
              </a>
            </div>
          </div>

          {/* Step 3: PayPal */}
          <div className="flow-card">
            <div className="flow-icon-wrap">
              <MdPayment size={28} color="#ff1e27" />
            </div>
            <div className="flow-text">
              <h3>{activeContent.step3Title}</h3>
              <p>{activeContent.step3Desc}</p>
              <a href={PAYPAL_DEPOSIT_LINK} target="_blank" rel="noopener noreferrer" className="global-action-btn paypal">
                {activeContent.paypalBtn}
              </a>
            </div>
          </div>
        </div>

        {/* Curation details for trust */}
        <div className="global-booking-notice-card">
          <div className="notice-header">
            <MdInfo size={20} color="#ff1e27" />
            <h3>{activeContent.noticeTitle}</h3>
          </div>
          <ul>
            <li><MdCheckCircle className="li-check" /> {activeContent.notice1}</li>
            <li><MdCheckCircle className="li-check" /> {activeContent.notice2}</li>
            <li><MdCheckCircle className="li-check" /> {activeContent.notice3}</li>
          </ul>
        </div>

        <div className="global-booking-footer-btn-wrap">
          <button onClick={() => navigate('/')} className="back-to-home-btn">
            FITGIRLS HOME
          </button>
        </div>
      </div>
    </div>
  );
};

export default GlobalBooking;
