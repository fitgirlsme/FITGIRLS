import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getReviews } from '../utils/reviewService';
import reviewsBackup from '../data/reviews_backup.json';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SupportCS from '../components/SupportCS';
import { db } from '../utils/firebase';
import { collection, getDocs, orderBy, query, limit } from 'firebase/firestore';
import './Self.css';

const bookingSteps = {
    ko: [
        { step: '1단계', title: '스마트플레이스 예약', desc: '네이버 지도 스마트플레이스에서 촬영 일정을 직접 조율하고 예약금 없이 즉시 확정 진행' },
        { step: '2단계', title: '촬영 준비 및 방문', desc: '번거로운 사전 촬영 시안 제출이 전혀 없으므로, 편하게 포즈 구상 후 당일 스튜디오로 방문' },
        { step: '3단계', title: '방문 및 셀프 촬영', desc: '스튜디오 셀프 룸 장비 및 셔터 조작법 교육 수령 후 준비 10분, 촬영 30분, 마무리 10분 총 50분 동안 프라이빗 진행' },
        { step: '4단계', title: '원본 수령 및 보정', desc: '촬영 당일 고화질 원본 전체 무료 메일 수령 및 현장 셀렉을 통한 리터칭 파일 제공' }
    ],
    en: [
        { step: 'Step 1', title: 'SmartPlace Booking', desc: 'Select your schedule directly on Naver Map SmartPlace with no reservation deposit required.' },
        { step: 'Step 2', title: 'Preparation & Visit', desc: 'No need to submit any concept or outfit moodboards. Just prepare your vibe and visit us.' },
        { step: 'Step 3', title: 'Visit & Self Photoshoot', desc: 'Receive a brief machine guide, and proceed for a total of 50 minutes (10-min prep, 30-min shoot, 10-min wrap-up) in a private room.' },
        { step: 'Step 4', title: 'Receive Raw Files & Retouch', desc: 'Receive all high-resolution raw photos by email on the same day, with retouch files provided.' }
    ],
    ja: [
        { step: 'Step 1', title: 'スマートプレイス予約', desc: 'Naverマップのスマートプレイスから日時を選択して予約。予約金は不要です。' },
        { step: 'Step 2', title: '準備＆訪問', desc: '事前に撮影イメージや衣装シアンを送る必要はありません。ポーズを軽く考えてお気軽に訪問。' },
        { step: 'Step 3', title: '当日の訪問＆セルフ撮影', desc: '操作方法とリモコンシャッターの使い方についての説明後、準備10分・撮影30分・片付け10分の計50分間プライベート撮影。' },
        { step: 'Step 4', title: '全データの受領＆レタッチ', desc: '撮影当日に全データをメールで受領。現場セレクトを通じてレタッチファイルを提供。' }
    ],
    zh: [
        { step: '第一步', title: 'SmartPlace 预约', desc: '通过 Naver 地图 SmartPlace 直接选择档期进行预约，无需支付预约金。' },
        { step: '第二步', title: '拍摄准备与到店', desc: '自助拍摄无需提前提交 any 策划案 or 构想参考，轻松构想姿势后直接到店即可。' },
        { step: '第三步', title: '到店自助拍摄', desc: '到店接受设备和遥控快门使用方法的简短培训，进行共 50 分钟（准备 10 分钟、拍摄 30 分钟、整理 10 分钟）的专属自助拍摄。' },
        { step: '第四步', title: '获取原片与精修', desc: '拍摄当天即可通过电子邮件即时获取全部原片，通过现场选片获取精修文件。' }
    ]
};

const naverRealReviews = [
    {
        id: 'review-naver-1',
        author: '쏘코야',
        date: '22.08.14',
        concept: '룸 셀프촬영 [화이트룸/핑크룸]',
        title: '소품도 다양하고 조명도 너무 좋아서 복근도 생겨요!',
        text: '일단 결론은 너무 맘에 들었습니다! 정말 다 찍고 식사 하고 집가는 내내 만족했다는 말만 몇번을 했는지 몰라요! 소품도 다양하고 카메라도 바디프로필 스튜디오에서 사용하는 정말 좋은 카메라에 조명도 너무 좋아서 없던 복근도 생기고요 ㅎㅎ 카메라도 좋아서 얼굴도 잘 나와요 ㅜㅜ 포토샵도 의견 하나하나 들어주시면서 정말 잘 살려주고 몸도 말 안해도 척척 마술사 처럼 해주시더라구요!! 진짜 짱짱 추천입니다 😭😭🫶🏻👍'
    },
    {
        id: 'review-naver-2',
        author: 'Annnnnnaa',
        date: '22.08.20',
        concept: '룸 셀프촬영 [화이트룸/핑크룸]',
        title: '셀프라는 말이 무색할 정도로 높은 퀄리티!',
        text: '본바프 끝내고 6개월간 운동을 꾸준히 한 기념으로 셀프바디프로필을 예약하게 되었어요! 셀프라는 말이 무색할 정도로 퀄리티가 상당히 높아요bbb 셀프라서 포즈에 어려움이 있기는 했지만 실시간으로 보이는 모니터 덕분에 몸의 선이 잘 나오는 위치를 찾을 수 있어 베스트샷을 남길 수 있었네요! 편집해주시는 직원분도 너무 친절하시고, 스튜디오도 깔끔해서 너무 좋았습니다ㅎㅎ'
    },
    {
        id: 'review-naver-3',
        author: '이미성10',
        date: '22.08.21',
        concept: '룸 셀프촬영 [화이트룸/핑크룸]',
        title: '혼자서 진짜 야무지게 인생샷 건지고 가요!',
        text: '혼자서 진짜 야무지게 인생샷 건지고 가요 너무너무 조명 맛집 추천 강추 ㅋㅋㅋㅋㅋ 리뉴얼 되면 또 갈 예정 !'
    },
    {
        id: 'review-naver-4',
        author: '닉네임연',
        date: '22.08.14',
        concept: 'SUMMER 쿨톤 바프 [작가+셀프]',
        title: '시키는대로만 해도 인생샷 백만개 조명맛집!',
        text: '저처럼 긴장 많이 하시는 분들은 셀프로 한번 찍고 작가님 촬영으로 한번 찍는거 강추드립니다! 분위기도 편안하게 만들어주시고, 보정도 진짜 너무 마음에 들게 해주셔서 좋았습니다. 저처럼 바프 처음 찍는 분들이나 몸에 근육이 별로 없어서 걱정인 분들께 네버랜드스튜디오 정말 강추드립니다. 시키는대로만 해도 인생샷 백만개에 조명과 보정의 힘으로 진짜 사진 예쁘게 만들어주세요!'
    }
];

const Self = ({ changeLanguage, currentLang }) => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const [openFaqIndex, setOpenFaqIndex] = useState(null);
    const [realReviews, setRealReviews] = useState([]);
    const [activeFaqTab, setActiveFaqTab] = useState('before_booking'); // 'before_booking', 'before_shoot', 'after_shoot'
    const [allPhotos, setAllPhotos] = useState([]);

    // 갤러리 이미지 데이터 및 촬영 배경(studios)을 로드하여 네버랜드 셀프 실시간 비주얼 아카이브 채우기
    useEffect(() => {
        const fetchSelfArchiveAndZones = async () => {
            try {
                // 1. 갤러리에서 셀프 사진 로드
                const galleryRef = collection(db, 'gallery');
                const qGallery = query(galleryRef, orderBy('createdAt', 'desc'), limit(100));
                const snapGallery = await getDocs(qGallery);
                const loadedGallery = snapGallery.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    img: doc.data().imageUrl || doc.data().img,
                    isZone: false
                })).filter(item => 
                    item.img && 
                    (item.mainCategory === 'self' || 
                     (item.tags && item.tags.some(tag => tag.toLowerCase().includes('self') || tag.includes('네버랜드'))))
                );

                // 2. 스튜디오 배경(studios)에서 Neverland Self (mooz) 로드
                const studioRef = collection(db, 'studios');
                const snapStudio = await getDocs(studioRef);
                const loadedStudios = snapStudio.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    img: doc.data().image || doc.data().img,
                    isZone: true,
                    title: doc.data().title || 'Neverland Self Zone'
                })).filter(item => item.img && item.category === 'mooz');

                // 3. 촬영 배경 데이터가 우선 노출되도록 상단 배치하여 병합
                const combined = [...loadedStudios, ...loadedGallery];

                // fallback 데이터
                const fallbackZones = [
                    { id: 'fallback-1', img: '/images/zones/zone-10.jpg', title: 'Mooz Gray', tags: ['#클래식그레이'], isZone: true },
                    { id: 'fallback-2', img: '/images/zones/zone-11.jpg', title: 'Mooz Beige', tags: ['#네츄럴베이지'], isZone: true },
                    { id: 'fallback-3', img: '/images/zones/zone-12.jpg', title: 'Mooz White', tags: ['#모던화이트'], isZone: true },
                    { id: 'fallback-4', img: '/images/zones/zone-13.jpg', title: 'Mooz Black', tags: ['#딥블랙'], isZone: true },
                    { id: 'fallback-5', img: '/images/zones/zone-14.jpg', title: 'Mooz Mood', tags: ['#아늑한무드'], isZone: true },
                    { id: 'fallback-6', img: '/images/zones/zone-15.jpg', title: 'Mooz Ocean', tags: ['#오션블루'], isZone: true }
                ];

                if (combined.length === 0) {
                    setAllPhotos(fallbackZones);
                } else {
                    // 최소 6개 이상이 되도록 모자라면 fallback을 뒤에 붙여줌
                    if (combined.length < 6) {
                        setAllPhotos([...combined, ...fallbackZones.slice(0, 6 - combined.length)]);
                    } else {
                        setAllPhotos(combined);
                    }
                }
            } catch (err) {
                console.error("Failed to fetch self photos or zones", err);
                const fallbackZones = [
                    { id: 'fallback-1', img: '/images/zones/zone-10.jpg', title: 'Mooz Gray', tags: ['#클래식그레이'], isZone: true },
                    { id: 'fallback-2', img: '/images/zones/zone-11.jpg', title: 'Mooz Beige', tags: ['#네츄럴베이지'], isZone: true },
                    { id: 'fallback-3', img: '/images/zones/zone-12.jpg', title: 'Mooz White', tags: ['#모던화이트'], isZone: true },
                    { id: 'fallback-4', img: '/images/zones/zone-13.jpg', title: 'Mooz Black', tags: ['#딥블랙'], isZone: true },
                    { id: 'fallback-5', img: '/images/zones/zone-14.jpg', title: 'Mooz Mood', tags: ['#아늑한무드'], isZone: true },
                    { id: 'fallback-6', img: '/images/zones/zone-15.jpg', title: 'Mooz Ocean', tags: ['#오션블루'], isZone: true }
                ];
                setAllPhotos(fallbackZones);
            }
        };
        fetchSelfArchiveAndZones();
    }, []);

    const toggleFaq = (index) => {
        setOpenFaqIndex(openFaqIndex === index ? null : index);
    };

    const handleFaqTabChange = (tabName) => {
        setActiveFaqTab(tabName);
        setOpenFaqIndex(null); 
    };

    // 후기 데이터 로드 (셀프 촬영 관련 위주 또는 범용 후기 6개)
    useEffect(() => {
        const fetchRealReviews = async () => {
            try {
                const reviewsData = await getReviews('all');
                let combined = [...reviewsData];
                const existingIds = new Set(reviewsData.map(r => r.id));

                const lang = currentLang || i18n.language;
                const translatedBackup = reviewsBackup.map(backup => {
                    if (lang !== 'ko' && backup.translations?.[lang]) {
                        return {
                            ...backup,
                            text: backup.translations[lang].text,
                            title: backup.translations[lang].title
                        };
                    }
                    return backup;
                });

                translatedBackup.forEach(backup => {
                    if (!existingIds.has(backup.id)) {
                        combined.push(backup);
                    }
                });

                // 셀프스튜디오 키워드 매칭 우선 정렬
                combined.sort((a, b) => {
                    const aHasSelf = (a.text || '').includes('셀프') || (a.title || '').includes('셀프') ? 1 : 0;
                    const bHasSelf = (b.text || '').includes('셀프') || (b.title || '').includes('셀프') ? 1 : 0;
                    return bHasSelf - aHasSelf;
                });

                setRealReviews(combined.slice(0, 6));
            } catch (err) {
                setRealReviews(reviewsBackup.slice(0, 6));
            }
        };
        fetchRealReviews();
    }, [currentLang, i18n.language]);

    // 다국어 번역 데이터 결합
    const rawBeforeBookingFaqs = t('faq.before_booking', { returnObjects: true });
    const beforeBookingFaqs = Array.isArray(rawBeforeBookingFaqs) ? rawBeforeBookingFaqs : [];
    
    const rawBeforeShootFaqs = t('faq.before_shoot', { returnObjects: true });
    const beforeShootFaqs = Array.isArray(rawBeforeShootFaqs) ? rawBeforeShootFaqs : [];
    
    const rawAfterShootFaqs = t('faq.after_shoot', { returnObjects: true });
    const afterShootFaqs = Array.isArray(rawAfterShootFaqs) ? rawAfterShootFaqs : [];

    const beforeBookingList = [
        { q: t('self.faq_q1', '셀프 촬영은 처음인데 잘 나올 수 있나요?'), a: t('self.faq_a1', '네, 당연히 가능합니다. 탑티어 작가가 조명 각도와 카메라 구도, 톤 필터를 이미 최적의 값으로 고정 셋팅해 놓았기 때문에, 카메라 앞에 서서 셔터만 누르면 누구나 잡지 화보 같은 세련된 흑백/컬러 화보를 건질 수 있습니다.') },
        ...beforeBookingFaqs.slice(0, 3).map(item => ({ q: item.question || item.q, a: item.answer || item.a }))
    ];

    const beforeShootList = [
        { q: t('self.faq_q2', '리모컨 셔터 줄이 안 나오게 촬영하려면 어떻게 하나요?'), a: t('self.faq_a2', '셔터를 누르는 손을 등 뒤나 옆구리 쪽으로 숨겨서 누르거나, 포즈의 일부인 것처럼 리모컨을 자연스럽게 쥐고 촬영하는 것이 팁입니다. 무선 타입 또는 자연스럽게 노출되는 힙한 유선 케이블 무드 모두 개성 있게 나옵니다.') },
        ...beforeShootFaqs.slice(0, 3).map(item => ({ q: item.question || item.q, a: item.answer || item.a }))
    ];

    const afterShootList = [
        { q: t('self.faq_q3', '원본 사진이랑 보정본은 언제 받아볼 수 있나요?'), a: t('self.faq_a3', '셀프 촬영을 마친 원본 고화질 파일 전체는 촬영 당일 메일로 무료 전송됩니다. 현장에서 보정 요청할 베스트 2장을 셀렉해 주시면 당일 정밀 1차 보정본 1장을 받으실 수 있으며, 나머지 사진은 순차적으로 2~3주 이내 보정이 완성됩니다.') },
        ...afterShootFaqs.slice(0, 4).map(item => ({ q: item.question || item.q, a: item.answer || item.a }))
    ];

    const getFaqListByTab = () => {
        if (activeFaqTab === 'before_shoot') return beforeShootList;
        if (activeFaqTab === 'after_shoot') return afterShootList;
        return beforeBookingList;
    };

    const FAQS = getFaqListByTab();
    
    const rawFaqTabs = t('faq.tabs', { returnObjects: true });
    const FAQ_TABS = Array.isArray(rawFaqTabs) ? rawFaqTabs : ['예약 전', '촬영 전', '촬영 후'];

    const priceTitle = t('self.price_title', '네버랜드 셀프스튜디오 이용 요금');
    const priceDesc = t('self.price_desc', '예약제 스튜디오 · 모든 금액은 VAT 포함 / 카드 & 현금영수증 발급');

    const serviceCardTitle = t('self.service_card_title', 'SERVICE (1인기준)');
    const servicePrice = t('self.service_price', '99,000');
    const rawServiceFeatures = t('self.service_features', { returnObjects: true });
    const serviceFeatures = Array.isArray(rawServiceFeatures) && rawServiceFeatures.length > 0 ? rawServiceFeatures : [
        "촬영시간 30분 / 준비시간 10분",
        "의상 제한없음 (무제한)",
        "전체 웹용 원본파일 제공 (긴축 1500px)",
        "4×6인치 프린트 1장 제공 /인당",
        "촬영 가능컷 : 기본 200컷 (배경 및 시간 추가 시 +100컷)"
    ];

    const optionsCardTitle = t('self.options_card_title', 'ADDITIONAL OPTIONS / INFO');
    const rawOptionsFeatures = t('self.options_features', { returnObjects: true });
    const optionsFeatures = Array.isArray(rawOptionsFeatures) && rawOptionsFeatures.length > 0 ? rawOptionsFeatures : [
        "인원 추가: 22,000원 / 인당",
        "배경 및 시간(15분) 추가: 33,000원 / 시간(+15분)당",
        "의상 추가: 11,000원 / 벌당",
        "고해상도디테일 보정 추가: 33,000원/장",
        "고해상도원본파일 전체: 55,000원"
    ];

    const rawPriceNotes = t('self.price_notes', { returnObjects: true });
    const priceNotes = Array.isArray(rawPriceNotes) && rawPriceNotes.length > 0 ? rawPriceNotes : [
        "NEVERLAND SELF 스튜디오는 평일&주말 가격이 모두 동일합니다.",
        "보정기간 : 셀렉 당일 1장 당일 보정, 나머지 사진은 2~3주 이내 1차 보정 완료 (추가 수정 요청 가능)",
        "추가 보정은 장당 33,000원 추가 비용이 발생합니다.",
        "주차는 두원빌딩 유료주차장을 이용해 주세요.",
        "네이버 리뷰 작성 시 보정 1장 서비스, SNS 업로드 동의 시 보정 1장 서비스 제공."
    ];

    const defaultPrepGuides = [
        {
            title: "리모컨 선 안 보이게 잡는 법",
            desc: "셔터를 누를 때 리모컨을 쥔 손을 허벅지 뒤로 감추거나, 턱을 괴며 자연스럽게 손바닥 안으로 쥐면 무선 리모컨처럼 깔끔하게 나옵니다."
        },
        {
            title: "어깨 라인과 시선 처리",
            desc: "카메라 렌즈를 정면으로 노려보기보다, 몸을 45도 틀고 고개만 카메라로 향하거나 시선을 바닥에 툭 떨구는 것이 몸의 실루엣이 더 슬림해 보입니다."
        },
        {
            title: "포즈 시안 미리 스마트폰에 캡처해오기",
            desc: "셀프 룸에 들어서면 긴장될 수 있으니 인스타그램 등에서 원하는 셀프 바프나 화보 포즈 5개 이상을 스마트폰에 미리 저장해 두고 보면서 따라 찍으세요."
        }
    ];

    const rawPrepGuides = t('self.prep_guides', { returnObjects: true });
    const PREP_GUIDES = Array.isArray(rawPrepGuides) && rawPrepGuides.length > 0 ? rawPrepGuides : defaultPrepGuides;

    const introSubtitle = t('self.intro_subtitle', '인생네컷은 좀 가볍고, 바디프로필은 너무 부담스럽다면');
    const introQuote = t('self.intro_quote', '리모컨 하나로 내가 원하는 타이밍에, 내가 제일 자연스러운 표정으로 남기는 온전한 나의 분위기');

    const defaultTargets = [
        { title: "개인 화보", desc: "혼자서도 눈치 보지 않고 온전히 나만의 분위기와 표정을 남기고 싶은 분" },
        { title: "우정 & 듀엣", desc: "소중한 친구와 함께 힙하고 유쾌한 기념 화보를 남기고 싶은 분" },
        { title: "연인 & 커플", desc: "연인과 더 자유롭고 로맨틱한 데이트 스냅 및 셀프 웨딩을 남기고 싶은 분" },
        { title: "가족 기념", desc: "부담 없이 편안한 미소와 자연스러운 무드로 온 가족의 오늘을 담고 싶은 분" },
        { title: "반려동물", desc: "사랑하는 나의 반려견, 반려동물과의 소중하고 특별한 순간을 함께하고 싶은 분" }
    ];
    const rawRecommendTargets = t('self.recommend_targets', { returnObjects: true });
    const RECOMMEND_TARGETS = Array.isArray(rawRecommendTargets) && rawRecommendTargets.length > 0 ? rawRecommendTargets : defaultTargets;

    const synergyTitle = t('self.synergy_title', 'FITGIRLS ➔ NEVERLAND 코스 제안');
    const synergyDesc = t('self.synergy_desc', '핏걸즈에서 나만의 바디프로필을 완벽하게 남기고, 네버랜드셀프에서 함께해 준 소중한 인연들과 그날의 기쁨을 자유롭게 공유해 보세요.');
    const defaultSynergyCourses = [
        { badge: "Course 01", main: "개인 바프 ➔ 친구와 우정사진", desc: "나의 개인 바프 촬영 당일, 응원하러 와준 절친과 함께 힙한 우정 화보로 하루를 기록합니다." },
        { badge: "Course 02", main: "바프 완성 ➔ 트레이너와 기념사진", desc: "몇 달간 흘린 땀방울을 함께 지도해 주신 든든한 담당 트레이너 선생님과의 열정을 남깁니다." },
        { badge: "Course 03", main: "개인 프로필 ➔ 자유로운 커플/웨딩", desc: "정밀한 개인 프로필 촬영 후, 연인과 함께 자연스럽고 캐주얼한 커플 웨딩 스냅을 만듭니다." }
    ];
    const rawSynergyCourses = t('self.synergy_courses', { returnObjects: true });
    const SYNERGY_COURSES = Array.isArray(rawSynergyCourses) && rawSynergyCourses.length > 0 ? rawSynergyCourses : defaultSynergyCourses;

    const conceptsTitle = t('self.concepts_title', '다양한 네버랜드 셀프 촬영 스펙트럼');
    const defaultConcepts = [
        "#셀프프로필", "#셀프바디샷", "#우정사진", "#커플사진", "#셀프웨딩사진",
        "#셀프가족사진", "#셀프DJ프로필", "#셀프댄서프로필", "#배우프로필", "#모델프로필", "#전문가프로필"
    ];
    const rawConcepts = t('self.concepts_list', { returnObjects: true });
    const CONCEPTS = Array.isArray(rawConcepts) && rawConcepts.length > 0 ? rawConcepts : defaultConcepts;

    const footerSlogan = t('self.footer_slogan', '오늘의 우리는, 그냥 지나가기엔 너무 아까우니까.. This is the moment.');

    return (
        <div className="self-brand-container">
            <Header changeLanguage={changeLanguage} currentLang={currentLang} />

            {/* 1. HERO SECTION */}
            <header className="self-hero">
                <div className="self-hero-badge">🧚‍♂️ NEVERLAND SELF</div>
                <h1 className="self-hero-title">
                    {t('self.hero_title', '네버랜드 셀프스튜디오 | 리모컨 셀프 사진관 & 패션화보')}
                </h1>
                <p className="self-hero-desc">
                    {t('self.hero_desc', '오늘의 우리는, 그냥 지나가기엔 너무 아까우니까.. This is the moment.')}
                </p>
                <div className="self-hero-actions">
                    <button className="btn-primary" onClick={() => {
                        const archiveSec = document.getElementById('self-archive');
                        if (archiveSec) archiveSec.scrollIntoView({ behavior: 'smooth' });
                    }}>
                        {t('self.btn_concept', '셀프 갤러리 보기')}
                    </button>
                    <button className="btn-secondary" onClick={() => {
                        const priceSec = document.getElementById('self-price');
                        if (priceSec) priceSec.scrollIntoView({ behavior: 'smooth' });
                    }}>
                        {t('self.btn_price', '셀프 요금제 보기')}
                    </button>
                </div>
            </header>

            {/* 2. REAL CLIENT VISUAL ARCHIVE (대표 갤러리를 최상단으로 끌어올림 - GPT 제안 ①) */}
            <section className="self-section" id="self-archive">
                <div className="self-section-header">
                    <span className="self-section-number">🧚‍♂️ SHOWROOM</span>
                    <h2 className="self-section-title">{t('self.archive_section_title', '네버랜드 셀프 실시간 비주얼 아카이브')}</h2>
                    <p className="self-section-desc">
                        {t('self.archive_section_desc', '실제 고객님들이 촬영한 셀프 사진 포트폴리오와 네버랜드의 대표적인 실제 촬영 배경 세트입니다.')}
                    </p>
                </div>

                {/* 해시태그 촬영 가능 콘셉트 스펙트럼 */}
                <div className="self-concepts-container">
                    <h4 className="concepts-header">{conceptsTitle}</h4>
                    <div className="concepts-tags-wrapper">
                        {CONCEPTS.map((concept, idx) => (
                            <span key={idx} className="concept-tag-chip" onClick={() => navigate('/archive?main=self')}>{concept}</span>
                        ))}
                    </div>
                </div>

                <div className="self-archive-grid">
                    {allPhotos.slice(0, 12).map((photo) => (
                        <div 
                            key={photo.id} 
                            className="self-archive-photo-card" 
                            onClick={() => navigate('/archive?main=self')}
                        >
                            <div 
                                className="self-archive-photo-img" 
                                style={{ backgroundImage: 'url(' + photo.img + ')' }}
                            />
                            <div className="self-archive-photo-overlay">
                                <span className="self-archive-photo-tag">
                                    {photo.isZone 
                                        ? (photo.title || '#셀프촬영배경') 
                                        : (photo.tags && photo.tags.length > 0 ? photo.tags.slice(0, 2).join(' ') : '#네버랜드셀프')}
                                </span>
                                <span className="self-archive-photo-click">
                                    {photo.isZone ? 'VIEW STUDIO ZONE' : 'CLICK TO GALLERY'}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="self-archive-actions" style={{ textAlign: 'center', marginTop: '40px' }}>
                    <button className="btn-secondary" onClick={() => navigate('/archive?main=self')}>
                        {t('self.btn_archive_more', '셀프 아카이브 전체 사진 보기')} →
                    </button>
                </div>

                {/* 1차 예약 CTA 버튼 배치 (GPT 제안 ②) */}
                <div className="cta-section-btn-container">
                    <a 
                        href="https://map.naver.com/p/entry/place/1259998642?placePath=%252Fhome%253Fentry%253Dplt&searchType=place&lng=127.0203605&lat=37.5194843" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="cta-naver-booking-btn"
                    >
                        🟢 {currentLang === 'en' ? 'Book via Naver' : '예약 대기 없이 10초 만에 네이버 예약하기'}
                    </a>
                </div>
            </section>

            {/* 3. INTRO SECTION & 브랜드 철학 (GPT 제안 ⑦) */}
            <section className="self-section self-intro-section">
                <div className="self-intro-box">
                    <p className="self-intro-subtitle">“ {introSubtitle} ”</p>
                    <h3 className="self-intro-title">{introQuote}</h3>
                    <div className="self-intro-divider"></div>
                    <p className="self-intro-body" style={{ fontSize: '1.08rem', lineHeight: '1.8', maxWidth: '780px', margin: '0 auto' }}>
                        {t('self.brand_philosophy', '가장 나다운, 그리고 가장 자연스러운 순간은 타인이 찍어줄 때의 긴장 속이 아닌, 스스로 리모컨 셔터를 누르는 그 순간에 탄생합니다. 오늘의 나는 오늘밖에 존재하지 않기에. 네버랜드셀프스튜디오는 핏걸즈&이너핏의 조명 예술을 오롯이 나만의 독립된 프라이빗 룸으로 옮겨와 당신의 청춘과 순간을 영원히 보존합니다.')}
                    </p>
                </div>
            </section>

            {/* 4. WHY NEVERLAND SELF (독보적 차별화 전면에 부각 - GPT 제안 ⑤) */}
            <section className="self-section">
                <div className="self-section-header">
                    <span className="self-section-number">🧚‍♂️ Why 01</span>
                    <h2 className="self-section-title">{t('self.why_title', '네버랜드 셀프스튜디오가 특별한 4가지 이유')}</h2>
                    <p className="self-section-desc">
                        {t('self.why_subtitle', '단순한 일반 셀프사진관을 넘어, 핏걸즈의 오리지널 하이엔드 조명과 세팅 노하우를 그대로 계승한 프리미엄 스튜디오입니다.')}
                    </p>
                </div>

                <div className="why-grid">
                    <div className="why-card">
                        <span className="why-icon">🔒</span>
                        <h4>{t('self.why_1_title', '① 100% 완전 프라이빗 단독 룸')}</h4>
                        <p>{t('self.why_1_desc', '외부와 완벽히 차단된 우리만의 촬영 룸에서 원하는 음악을 블루투스로 크게 틀고 어색함 없이 자유로운 포즈를 마음껏 시도하세요.')}</p>
                    </div>
                    <div className="why-card">
                        <span className="why-icon">💡</span>
                        <h4>{t('self.why_2_title', '② 바디프로필 작가 세팅 & 패션 화보 조명')}</h4>
                        <p>{t('self.why_2_desc', '수천 명의 몸을 담아낸 핏걸즈의 조명 설계와 필터 셋팅을 그대로 이식하여, 일반 카메라로는 연출할 수 없는 클래식하고 슬림한 음영 화보가 완성됩니다.')}</p>
                    </div>
                    <div className="why-card">
                        <span className="why-icon">🖥️</span>
                        <h4>{t('self.why_3_title', '③ 대형 모니터 실시간 피드백')}</h4>
                        <p>{t('self.why_3_desc', '리모컨을 누르는 순간 1.5초 이내로 정밀 필터 톤이 적용된 내 촬영 모습이 전면 대형 화면에 표출되어 즉각적으로 자세와 눈빛을 교정할 수 있습니다.')}</p>
                    </div>
                    <div className="why-card">
                        <span className="why-icon">👗</span>
                        <h4>{t('self.why_4_title', '④ 핏걸즈 보정의상 대여 (소품 무료 / 의상 유료)')}</h4>
                        <p>{t('self.why_4_desc', '소품들은 전면 무료로 마음껏 사용 가능하며, 바디라인 보정력이 입증된 핏걸즈 오리지널 모노키니 및 힙한 크롭 의상은 벌당 11,000원의 저렴한 비용으로 현장 대여가 가능합니다.')}</p>
                    </div>
                </div>

                {/* 경쟁사 차별점 표/카드 (GPT 제안 ⑤) */}
                <div className="vs-comparison-table-wrapper">
                    <h4 style={{ textAlign: 'center', marginBottom: '24px', fontWeight: '800', fontSize: '1.2rem', color: '#fff' }}>
                        ⚖️ 일반 셀프네컷 vs 네버랜드 셀프스튜디오
                    </h4>
                    <div className="vs-grid">
                        <div className="vs-card">
                            <div className="vs-header-title" style={{ color: '#aaa' }}>
                                <span>❌</span> 일반 간이 셀프네컷
                            </div>
                            <ul className="vs-item-list">
                                <li><span>•</span> 평면적이고 납작한 일반 정면 플래시 조명</li>
                                <li><span>•</span> 좁고 개방된 부스로 인해 어색하고 경직된 포즈</li>
                                <li><span>•</span> 한정된 기본 소품 및 의상 대여 불가능</li>
                                <li><span>•</span> 작고 픽셀이 깨지는 저해상도 원본 파일 제공</li>
                            </ul>
                        </div>
                        <div className="vs-card neverland">
                            <div className="vs-header-title" style={{ color: '#00E676' }}>
                                <span>🧚‍♂️</span> 네버랜드 프리미엄 셀프
                            </div>
                            <ul className="vs-item-list">
                                <li><span>✓</span> 바디프로필 전문 작가가 특수 설계한 하이엔드 입체 조명</li>
                                <li><span>✓</span> 완전히 밀폐된 프라이빗 룸에서 자유롭고 힙한 포징</li>
                                <li><span>✓</span> 핏걸즈 오리지널 모노키니, 바프 보정의상 현장 렌탈 지원 (유료)</li>
                                <li><span>✓</span> 촬영 당일 고해상도 대용량 원본 파일 전체 무료 전송</li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="purpose-wrapper">
                    <h5>🧚‍♂️ {t('self.purpose_title', '이런 분들께 특히 추천해 드려요')}</h5>
                    <div className="self-recommend-targets-grid">
                        {RECOMMEND_TARGETS.map((target, idx) => (
                            <div key={idx} className="target-card">
                                <span className="target-icon">🧚</span>
                                <h4>{target.title}</h4>
                                <p>{target.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 2차 예약 CTA 버튼 배치 */}
                <div className="cta-section-btn-container">
                    <a 
                        href="https://map.naver.com/p/entry/place/1259998642?placePath=%252Fhome%253Fentry%253Dplt&searchType=place&lng=127.0203605&lat=37.5194843" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="cta-naver-booking-btn"
                    >
                        🟢 {currentLang === 'en' ? 'Book via Naver' : '예약 대기 없이 10초 만에 네이버 예약하기'}
                    </a>
                </div>
            </section>

            {/* 5. REAL CLIENT REVIEW (실제 네이버 플레이스 공식 통계 연동) */}
            <section className="self-section" style={{ background: 'rgba(255, 255, 255, 0.01)' }}>
                <div className="self-section-header">
                    <span className="self-section-number">🧚‍♂️ Real Review</span>
                    <h2 className="self-section-title">방문자들이 네이버리뷰에 직접 남긴 이야기</h2>
                    <p className="self-section-desc">
                        네이버 스마트플레이스 실제 촬영 및 방문 고객님들이 남겨주신 솔직한 기록입니다.
                    </p>
                </div>

                <div className="reviews-score-summary">
                    <div className="score-stars">★★★★★</div>
                    <div className="score-number">4.97 <span>/ 5.0</span></div>
                    <div className="score-label" style={{ marginBottom: '24px', color: '#03cf5d', fontWeight: 'bold' }}>
                        네이버 방문자 평점 4.97 / 5.0
                    </div>
                    {/* 네이버 플레이스 키워드 랭킹 표시 */}
                    <div className="concepts-tags-wrapper" style={{ gap: '12px' }}>
                        <span className="concept-tag-chip" style={{ borderColor: 'rgba(3, 207, 93, 0.3)', background: 'rgba(3, 207, 93, 0.05)', color: '#fff', cursor: 'default' }}>
                            👍 &quot;친절해요&quot; <strong style={{ color: '#03cf5d', marginLeft: '4px' }}>158</strong>
                        </span>
                        <span className="concept-tag-chip" style={{ borderColor: 'rgba(3, 207, 93, 0.3)', background: 'rgba(3, 207, 93, 0.05)', color: '#fff', cursor: 'default' }}>
                            ✨ &quot;시설이 깔끔해요&quot; <strong style={{ color: '#03cf5d', marginLeft: '4px' }}>152</strong>
                        </span>
                        <span className="concept-tag-chip" style={{ borderColor: 'rgba(3, 207, 93, 0.3)', background: 'rgba(3, 207, 93, 0.05)', color: '#fff', cursor: 'default' }}>
                            🎭 &quot;소품이 다양해요&quot; <strong style={{ color: '#03cf5d', marginLeft: '4px' }}>143</strong>
                        </span>
                    </div>
                </div>

                <div className="self-archive-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                    {naverRealReviews.map((review) => (
                        <div key={review.id} className="why-card" style={{ padding: '24px', textAlign: 'left', background: 'rgba(255, 255, 255, 0.02)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', paddingBottom: '8px' }}>
                                <strong style={{ color: '#fff', fontSize: '0.95rem' }}>{review.author}</strong>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                                    <span style={{ color: '#FFD700', fontSize: '0.85rem' }}>★★★★★</span>
                                    <span style={{ color: '#888', fontSize: '0.82rem' }}>{review.concept}</span>
                                </div>
                            </div>
                            <h5 style={{ color: '#fff', fontSize: '0.95rem', fontWeight: '700', marginBottom: '8px' }}>{review.title}</h5>
                            <p style={{ fontSize: '0.88rem', color: '#ccc', lineHeight: '1.7', margin: 0, wordBreak: 'keep-all' }}>
                                {review.text}
                            </p>
                        </div>
                    ))}
                </div>

                {/* 네이버 리뷰 전체 보기 버튼 배치 */}
                <div style={{ textAlign: 'center', marginTop: '40px' }}>
                    <a 
                        href="https://map.naver.com/p/entry/place/1259998642?placePath=%252Freview%252Fvisitor&searchType=place" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="btn-secondary"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', textDecoration: 'none', borderColor: '#03cf5d', color: '#03cf5d' }}
                    >
                        🟢 {currentLang === 'en' ? 'View All Naver Reviews' : '네이버 리뷰 전체 보기'} →
                    </a>
                </div>
            </section>

            {/* 6. SYNERGY COURSE SECTION (핏걸즈와 셀프 촬영의 시너지 흐름) */}
            <section className="self-section self-synergy-section">
                <div className="self-section-header">
                    <span className="self-section-number">🧚‍♂️ Why 02</span>
                    <h2 className="self-section-title">{synergyTitle}</h2>
                    <p className="self-section-desc">{synergyDesc}</p>
                </div>

                <div className="synergy-courses-grid">
                    {SYNERGY_COURSES.map((course, idx) => (
                        <div key={idx} className="synergy-course-card">
                            <span className="course-badge">🧚‍♂️ {course.badge}</span>
                            <h4>{course.main}</h4>
                            <p>{course.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* 7. NOW EVENT BANNER SECTION (지금 예약해야 하는 강력한 혜택 - GPT 제안 ④) */}
            <section className="self-section" style={{ borderBottom: 'none' }}>
                <div className="self-event-banner-box">
                    <span className="event-badge-label">🔥 SEASON EVENT</span>
                    <h3 className="event-title">네버랜드 셀프 런칭 기념 더블 혜택</h3>
                    <p className="event-desc">
                        예약을 망설이실 필요 없도록, 지금 촬영하시는 모든 고객님들께 즉시 적용되는 역대급 이벤트 혜택을 드립니다.
                    </p>
                    <div className="event-benefit-row">
                        <div className="benefit-badge">🎁 1. 네이버 영수증 포토리뷰 약속 시 정밀 보정 1장 추가 서비스</div>
                        <div className="benefit-badge">🎁 2. 인스타/SNS 업로드 동의 시 디테일 보정 1장 추가 서비스</div>
                        <div className="benefit-badge">🎁 3. 핏걸즈 촬영용 힙한 소품 & 대여 의상 무료 믹스매치 혜택</div>
                    </div>
                    <div style={{ color: '#00E676', fontSize: '0.9rem', fontWeight: '600' }}>
                        * 본 이벤트는 예약 인원 한정으로 진행되며 조기 종료될 수 있습니다.
                    </div>
                </div>
            </section>

            {/* 8. PRICE SECTION */}
            <section className="self-section" id="self-price">
                <div className="self-section-header">
                    <span className="self-section-number">🧚‍♂️ Why 03</span>
                    <h2 className="self-section-title">{priceTitle}</h2>
                    <p className="self-section-desc">
                        {priceDesc}
                    </p>
                </div>

                <div className="self-price-grid-wrapper">
                    {/* 왼쪽 카드: SERVICE */}
                    <div className="self-price-card service-card">
                        <h3 className="self-price-card-title">{serviceCardTitle}</h3>
                        <div className="self-price-amount">
                            {servicePrice} <span>{t('studios.price_ko', '원')}</span>
                        </div>
                        <ul className="self-price-features">
                            {serviceFeatures.map((feat, fIdx) => (
                                <li key={fIdx}>
                                    <span className="feature-check">✓</span> {feat}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* 오른쪽 카드: OPTIONS */}
                    <div className="self-price-card options-card">
                        <h3 className="self-price-card-title">{optionsCardTitle}</h3>
                        <ul className="self-price-features" style={{ marginTop: '24px' }}>
                            {optionsFeatures.map((feat, fIdx) => (
                                <li key={fIdx}>
                                    <span className="feature-check">✓</span> {feat}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* 하단 유의 사항 안내 리스트 */}
                <div className="self-price-notes-box">
                    <ul className="self-price-notes-list">
                        {priceNotes.map((note, nIdx) => (
                            <li key={nIdx} className="note-item">
                                • {note}
                            </li>
                        ))}
                    </ul>
                </div>

                {/* 3차 예약 CTA 버튼 배치 */}
                <div className="cta-section-btn-container">
                    <a 
                        href="https://map.naver.com/p/entry/place/1259998642?placePath=%252Fhome%253Fentry%253Dplt&searchType=place&lng=127.0203605&lat=37.5194843" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="cta-naver-booking-btn"
                    >
                        🟢 {currentLang === 'en' ? 'Book via Naver' : '예약 대기 없이 10초 만에 네이버 예약하기'}
                    </a>
                </div>
            </section>

            {/* 9. PROCESS & RESERVATION TABLE SECTION */}
            <section className="self-section">
                <div className="self-section-header">
                    <span className="self-section-number">🧚‍♂️ Why 04</span>
                    <h2 className="self-section-title">
                        {t('self.process_title', '네버랜드 셀프의 간편한 4단계 과정')}
                    </h2>
                    <p className="self-section-desc">
                        {t('self.process_desc', '예약 신청부터 당일 촬영, 사진 셀렉까지 복잡한 대기나 지연 없이 매끄럽게 진행되는 간편한 셀프 프로세스입니다.')}
                    </p>
                </div>

                <div className="booking-table-wrapper">
                    <table className="booking-process-table">
                        <thead>
                            <tr>
                                <th>{currentLang === 'en' ? 'Step' : currentLang === 'ja' ? '段階' : currentLang === 'zh' ? '步骤' : '진행 단계'}</th>
                                <th>{currentLang === 'en' ? 'Process Name' : currentLang === 'ja' ? 'プロセス名' : currentLang === 'zh' ? '流程名称' : '예약/촬영 절차'}</th>
                                <th>{currentLang === 'en' ? 'Details' : currentLang === 'ja' ? '詳細説明' : currentLang === 'zh' ? '详细说明' : '상세 진행 내용'}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(bookingSteps[currentLang] || bookingSteps.ko).map((item, idx) => (
                                <tr key={idx}>
                                    <td className="step-col">
                                        <span className="step-badge">{item.step}</span>
                                    </td>
                                    <td className="title-col"><strong>{item.title}</strong></td>
                                    <td className="desc-col">{item.desc}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div style={{ textAlign: 'center', marginTop: '40px' }}>
                    <a 
                        href="https://map.naver.com/p/entry/place/1259998642?placePath=%252Fhome%253Fentry%253Dplt&searchType=place&lng=127.0203605&lat=37.5194843" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="btn-primary"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}
                    >
                        🟢 {currentLang === 'en' ? 'Book via Naver' : '네이버 지도로 예약하기'}
                    </a>
                </div>
            </section>

            {/* 10. SLOGAN BANNER (감성 슬로건 배너) */}
            <section className="self-slogan-section">
                <div className="slogan-content">
                    <h2 className="slogan-text">🧚‍♂️ {footerSlogan} 🧚</h2>
                </div>
            </section>

            {/* 11. TIPS & PREPARATION SECTION */}
            <section className="self-section">
                <div className="self-section-header">
                    <span className="self-section-number">🧚‍♂️ Why 05</span>
                    <h2 className="self-section-title">{t('self.prep_title', '더 완성도 높은 셀프 촬영을 위한 꿀팁')}</h2>
                    <p className="self-section-desc">
                        {t('self.prep_desc', '작가 없는 셀프 스튜디오에서 훨씬 어색하지 않고 잡지 화보처럼 매력적인 사진을 건질 수 있는 준비 팁입니다.')}
                    </p>
                </div>

                <div className="prep-grid">
                    {PREP_GUIDES.map((guide, idx) => (
                        <div key={idx} className="prep-card">
                            <h4>{guide.title}</h4>
                            <p>{guide.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* 12. LOCATION SECTION */}
            <section className="self-section">
                <div className="self-section-header">
                    <span className="self-section-number">🧚‍♂️ Why 06</span>
                    <h2 className="self-section-title">{t('studios.loc_title', '위치 및 주차 안내')}</h2>
                    <p className="self-section-desc">
                        {t('studios.loc_desc', '강남구 신사동에 위치한 핏걸즈 스튜디오로 오시는 대중교통 및 상세 이동 안내입니다.')}
                    </p>
                </div>

                <div className="location-box">
                    <div className="location-info">
                        <h4>{t('studios.loc_card_title', '📍 핏걸즈&이너핏 스튜디오')}</h4>
                        <p>{t('location.address', '서울특별시 강남구 강남대로 160길 40 아티움빌딩 B1층')}</p>
                        
                        <ul className="location-details">
                            <li><strong>{t('studios.loc_sub', '신사역에서 오시는 길:')}</strong> {t('studios.loc_sub_desc', '3호선 신사역 8번 출구에서 나와 가로수길 방면 도보 약 7분 소요.')}</li>
                            <li><strong>{t('studios.loc_ap', '압구정역에서 오시는 길:')}</strong> {t('studios.loc_ap_desc', '3호선 압구정역 4번 출구에서 도보 약 12분 소요.')}</li>
                            <li><strong>{t('studios.loc_lost', '길을 잃으셨을 때:')}</strong> {t('studios.loc_lost_desc', '언제든 문의 주시면 신사동 입구 앞까지 친절히 마중 나와 안내해 드립니다.')}</li>
                        </ul>

                        {/* 주차 안내 강조 카드 */}
                        <div className="parking-alert-box" style={{
                            marginTop: '20px',
                            padding: '16px 20px',
                            background: 'rgba(255, 0, 60, 0.08)',
                            border: '1px dashed #FF003C',
                            borderRadius: '10px',
                            color: '#e5e5e5',
                            fontSize: '0.92rem',
                            lineHeight: '1.6'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                <span style={{ fontSize: '1.2rem' }}>🚗</span>
                                <strong style={{ color: '#FF003C', fontSize: '1rem' }}>
                                    {currentLang === 'en' ? 'Parking Guide (Not Available inside building)' : 
                                     currentLang === 'ja' ? '駐車場のご案内（ビル内駐車不可）' :
                                     currentLang === 'zh' ? '停车指南（大楼内无法停车）' : '자가용 및 주차 안내 (건물 내 주차 불가)'}
                                </strong>
                            </div>
                            <p style={{ margin: '0 0 10px 0', color: '#ccc', wordBreak: 'keep-all', lineHeight: '1.7' }}>
                                {currentLang && currentLang !== 'ko' ? (
                                    t('studios.loc_parking_desc', "본 스튜디오 건물(아티움빌딩)은 주차가 불가합니다. 자가용 이용 시 인근의 '두원빌딩 유료주차장'(서울특별시 강남구 강남대로 636 두원빌딩, 도보 2분 거리)을 이용해주시기 바랍니다.")
                                ) : (
                                    <>
                                        본 스튜디오 건물(아티움빌딩)은 주차가 불가합니다. 자가용 이용 시 인근의 <strong style={{ color: '#FF003C', fontSize: '1.02rem', textDecoration: 'underline', textUnderlineOffset: '4px', fontWeight: 'bold' }}>&quot;두원빌딩 유료주차장&quot;</strong>(서울특별시 강남구 강남대로 636 두원빌딩, 도보 2분 거리)을 이용해주시기 바랍니다.
                                    </>
                                )}
                            </p>
                            <div style={{ 
                                padding: '8px 12px', 
                                background: 'rgba(255, 255, 255, 0.05)', 
                                borderRadius: '6px',
                                borderLeft: '3px solid #FF003C',
                                display: 'inline-block',
                                width: '100%',
                                boxSizing: 'border-box'
                             }}>
                                <strong style={{ color: '#ffffff', marginRight: '8px' }}>
                                    {currentLang === 'en' ? 'Parking Fee:' : 
                                     currentLang === 'ja' ? '駐車料金:' :
                                     currentLang === 'zh' ? '停车费用:' : '주차 요금 정보:'}
                                </strong>
                                <span style={{ color: '#FF003C', fontWeight: 'bold', fontSize: '0.98rem' }}>
                                    {t('location.parking_price', '60분 3,000원 / 120분 6,000원 / 240분 9,000원')}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="location-map-wrap" style={{ position: 'relative', overflow: 'hidden' }}>
                        <iframe 
                            src="https://maps.google.com/maps?q=%ED%95%8F%EA%B1%B8%EC%A6%88%EC%8A%A4%ED%8A%9C%EB%94%94%EC%98%A4&t=&z=16&ie=UTF8&iwloc=&output=embed" 
                            width="100%" 
                            height="100%" 
                            style={{ border: 0, filter: 'invert(90%) hue-rotate(180deg)' }} 
                            allowFullScreen="" 
                            loading="lazy"
                            title="FitGirls Self Map"
                        ></iframe>
                        <a 
                            href="https://map.naver.com/p/entry/place/1259998642?placePath=%252Fhome%253Fentry%253Dplt&searchType=place&lng=127.0203605&lat=37.5194843"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="map-overlay-btn"
                        >
                            🟢 {t('studios.loc_naver_map', '네이버 지도로 길찾기')} →
                        </a>
                    </div>
                </div>
            </section>

            <SupportCS />
            <Footer currentLang={currentLang} />
        </div>
    );
};

export default Self;