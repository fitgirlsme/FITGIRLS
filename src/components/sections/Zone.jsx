import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import FadeInSection from '../FadeInSection';
import { getGalleries } from '../../utils/galleryService';
import './Zone.css';

const ZONE_DATA = [
    { id: 'zone-1', nameKey: 'zone.names.zone1', img: 'https://static.wixstatic.com/media/923969_39c43aa9cce345c883aba76520a8abc5~mv2.jpg/v1/crop/x_0,y_11,w_1798,h_2712/fill/w_369,h_523,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/%ED%99%A9%EC%9B%90%EA%B2%BD_S_0604_fitgirls_1_82257.jpg' },
    { id: 'zone-2', nameKey: 'zone.names.zone2', img: 'https://static.wixstatic.com/media/923969_e66d9b28475944daab92d2ddf9751bf0~mv2.jpg/v1/crop/x_0,y_187,w_1821,h_2357/fill/w_369,h_523,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/%EA%B9%80%EC%9D%80%EC%A7%80_S_0717_fitgirls_1_13516.jpg' },
    { id: 'zone-3', nameKey: 'zone.names.zone3', img: 'https://static.wixstatic.com/media/923969_af541d24ed854088ae487074c3e30fea~mv2.jpg/v1/crop/x_0,y_187,w_1821,h_2357/fill/w_369,h_523,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/%EC%9A%B0%EC%95%84%EC%98%81_S_0625_fitgirls_2_0402.jpg' },
    { id: 'zone-4', nameKey: 'zone.names.zone4', img: 'https://static.wixstatic.com/media/923969_539b9a694dd543ba8da939b7dc0f830b~mv2.jpg/v1/crop/x_14,y_0,w_772,h_1000/fill/w_369,h_523,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/%EA%B0%95%EA%B0%80%EC%9C%A83.jpg' },
    { id: 'zone-5', nameKey: 'zone.names.zone5', img: 'https://static.wixstatic.com/media/923969_7dfbcc9e11d644e4b4b8bd303655bb8c~mv2.jpg/v1/crop/x_0,y_187,w_1821,h_2357/fill/w_369,h_523,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/%EA%B6%8C%EB%8B%A4%EC%9D%80_S_1227_fitgirls_3_15142.jpg' },
    { id: 'zone-6', nameKey: 'zone.names.zone6', img: 'https://static.wixstatic.com/media/923969_56ad0752bda842b1a0f15d0bb6c464ce~mv2.jpg/v1/crop/x_0,y_559,w_5464,h_7073/fill/w_369,h_523,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/S_0707_fitgirls_2_6590r%20copy.jpg' },
    { id: 'zone-7', nameKey: 'zone.names.zone7', img: 'https://static.wixstatic.com/media/923969_ae8adeff4a7b4c2f905d96d341fdf450~mv2.jpg/v1/crop/x_0,y_187,w_1821,h_2357/fill/w_369,h_523,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/%EC%9D%B4%ED%9D%AC%EC%9D%80_S_0710_fitgirls_3_8745.jpg' },
    { id: 'zone-8', nameKey: 'zone.names.zone8', img: 'https://static.wixstatic.com/media/923969_416b762be5af4cbcb568f85790cca7a1~mv2.jpg/v1/crop/x_0,y_134,w_1311,h_1697/fill/w_369,h_523,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/S_IN5_6389r.jpg' },
    { id: 'zone-9', nameKey: 'zone.names.zone9', img: 'https://static.wixstatic.com/media/923969_0d2530ebf9e94299b0471357e443d4a6~mv2.jpg/v1/crop/x_0,y_134,w_1311,h_1697/fill/w_369,h_523,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/%EA%B9%80%EC%9C%A4%ED%9D%AC_S_0P7A7621.jpg' },
    { id: 'zone-10', nameKey: 'zone.names.zone10', img: 'https://static.wixstatic.com/media/923969_c5361ea5012846159522faab499e4322~mv2.jpg/v1/crop/x_0,y_134,w_1311,h_1697/fill/w_369,h_523,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/%EB%85%B8%EC%88%98%EC%A7%80_S_0P7A8373.jpg' },
    { id: 'zone-11', nameKey: 'zone.names.zone11', img: 'https://static.wixstatic.com/media/923969_88ec306344a34005bcfadce22d85d75a~mv2.jpg/v1/crop/x_0,y_134,w_1311,h_1697/fill/w_369,h_523,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/%EC%B5%9C%ED%98%9C%EC%84%B1_S_0P7A1475.jpg' },
    { id: 'zone-12', nameKey: 'zone.names.zone12', img: 'https://static.wixstatic.com/media/923969_bf2dc527ef894687b166a4fbe714bf96~mv2.jpg/v1/crop/x_0,y_55,w_1311,h_1856/fill/w_369,h_523,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/%EC%9D%B4%EC%8A%AC_S_0708_fitgirls_4_6924.jpg' },
    { id: 'zone-13', nameKey: 'zone.names.zone13', img: 'https://static.wixstatic.com/media/923969_7680f894a6454ae6b02f637a3387ab5e~mv2.jpg/v1/crop/x_0,y_134,w_1311,h_1697/fill/w_369,h_523,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/%EA%B9%80%EB%AF%BC%EC%A7%80_S_0P7A7015.jpg' },
    { id: 'zone-14', nameKey: 'zone.names.zone14', img: 'https://static.wixstatic.com/media/923969_0439cd0117944b04ba24bd0ea789eab9~mv2.jpg/v1/crop/x_0,y_134,w_1311,h_1697/fill/w_369,h_523,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/%EB%AC%B8%EC%98%88%EC%A7%84_S_0P7A9834.jpg' },
    { id: 'zone-15', nameKey: 'zone.names.zone15', img: 'https://static.wixstatic.com/media/923969_8545fad4d6a5482b8b8568b319bfe0b1~mv2.jpg/v1/crop/x_267,y_0,w_593,h_768/fill/w_369,h_523,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/%EA%B9%80%EB%AF%BC%EC%A7%80_S_0627_fitgirls_2_1572.jpg' },
    { id: 'zone-16', nameKey: 'zone.names.zone16', img: 'https://static.wixstatic.com/media/923969_9b0cfb4de9584258ad1774f3719ac5ab~mv2.jpg/v1/crop/x_0,y_134,w_1311,h_1697/fill/w_369,h_523,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/%EB%B0%95%EB%8B%A4%EC%A0%95_S_00625_fitgirls_3_0615.jpg' },
    { id: 'zone-17', nameKey: 'zone.names.zone17', img: 'https://static.wixstatic.com/media/923969_c5d0947c40e149b2af1f170c40c0e3d9~mv2.jpg/v1/crop/x_0,y_134,w_1311,h_1697/fill/w_369,h_523,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/%EC%A1%B0%EB%AF%BC%EC%A7%80_S_0619_fitgirls_3_10740.jpg' },
    { id: 'zone-18', nameKey: 'zone.names.zone18', img: 'https://static.wixstatic.com/media/923969_f7880aff796b4a1e8788e60d2aef19aa~mv2.jpg/v1/crop/x_0,y_134,w_1311,h_1697/fill/w_369,h_523,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/%EA%B9%80%ED%98%9C%EC%97%B0_S_0623_fitgirls_2_0826.jpg' },
    { id: 'zone-19', nameKey: 'zone.names.zone19', img: 'https://static.wixstatic.com/media/923969_ca3ee9205c244f4ab6c22b7cd17bbf68~mv2.jpg/v1/crop/x_0,y_55,w_1311,h_1856/fill/w_369,h_523,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/%EB%B0%95%EB%8B%A4%EC%A0%95_S_00625_fitgirls_3_0663.jpg' },
    { id: 'zone-20', nameKey: 'zone.names.zone20', img: 'https://static.wixstatic.com/media/923969_4baf829c923849d4929de20ce09d7873~mv2.jpg/v1/crop/x_0,y_55,w_1311,h_1856/fill/w_369,h_523,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/%EC%B5%9C%EC%86%8C%EC%9D%80_S_0520_fitgirls_3_70984.jpg' },
    { id: 'zone-21', nameKey: 'zone.names.zone21', img: 'https://static.wixstatic.com/media/923969_e1a87d9d862146358e15384be4e2166d~mv2.jpg/v1/crop/x_0,y_55,w_1311,h_1856/fill/w_369,h_523,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/%EC%9C%A0%EC%9E%AC%EC%98%81_S_0620_fitgirls_1_0234.jpg' },
    { id: 'zone-22', nameKey: 'zone.names.zone22', img: 'https://static.wixstatic.com/media/923969_c6853b8caf684c13abbdc0b7807c3d4d~mv2.jpg/v1/crop/x_0,y_55,w_1311,h_1856/fill/w_369,h_523,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/%EA%B9%80%EB%AF%BC%ED%95%98_S_0525_fitgirls_1_75295.jpg' },
    { id: 'zone-23', nameKey: 'zone.names.zone23', img: 'https://static.wixstatic.com/media/923969_763e4efa5e474607b8678b33a742dc98~mv2.jpg/v1/crop/x_37,y_0,w_5927,h_8400/fill/w_369,h_523,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/%ED%9D%91%EB%B0%B1%EC%BB%A4%EB%B2%84%202%20copy.jpg' },
    { id: 'zone-24', nameKey: 'zone.names.zone24', img: 'https://static.wixstatic.com/media/923969_dd16100892384ed89ee8d42156872901~mv2.jpg/v1/crop/x_0,y_224,w_5464,h_7744/fill/w_369,h_523,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/S_1123_fitgirls_shin_1_2495.jpg' },
];

const Zone = () => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState('zone');
    const [lookbookItems, setLookbookItems] = useState([]);
    const [visibleCount, setVisibleCount] = useState(18);

    // Lookbook 데이터 로드 (Firebase lookbook 컬렉션)
    useEffect(() => {
        if (activeTab === 'lookbook') {
            (async () => {
                try {
                    const items = await getGalleries('LOOKBOOK');
                    setLookbookItems(items);
                } catch (err) {
                    console.error('Failed to load lookbook:', err);
                }
            })();
        }
    }, [activeTab]);

    const visibleLookbook = lookbookItems.slice(0, visibleCount);
    const hasMore = visibleCount < lookbookItems.length;

    return (
        <div className="zone-full-container">
            <FadeInSection className="zone-header-wrapper">
                <h2 className="zone-main-title">{t('zone.title')}</h2>
                <p className="zone-subtitle">{t('zone.subtitle')}</p>
                <p className="zone-subtitle zone-subtitle-insta">
                    {t('zone.subtitleInsta')}{' '}
                    <a
                        href="https://www.instagram.com/explore/tags/%ED%95%8F%EA%B1%B8%EC%A6%88/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="zone-insta-hashtag"
                    >
                        {t('zone.subtitleHashtag')}
                    </a>
                    {t('zone.subtitleInstaEnd')}
                </p>

                <div className="tier1-tabs zone-tabs-container" style={{ marginTop: '24px', marginBottom: '10px' }}>
                    <button
                        className={`tier1-tab ${activeTab === 'zone' ? 'active' : ''}`}
                        onClick={() => setActiveTab('zone')}
                    >
                        {t('zone.tabs.zone')}
                    </button>
                    <button
                        className={`tier1-tab ${activeTab === 'lookbook' ? 'active' : ''}`}
                        onClick={() => setActiveTab('lookbook')}
                    >
                        {t('zone.tabs.lookbook')}
                    </button>
                </div>
            </FadeInSection>

            {activeTab === 'zone' ? (
                <div className="zone-grid-container" style={{ animation: 'fadeIn 0.5s ease' }}>
                    <div className="zone-grid">
                        {ZONE_DATA.map(zone => (
                            <div key={zone.id} className="zone-card">
                                <div className="zone-img-wrapper">
                                    <img src={zone.img} alt={t(zone.nameKey)} loading="lazy" />
                                </div>
                                <div className="zone-info">
                                    <span className="zone-badge">FITGIRLS ZONE</span>
                                    <h3 className="zone-name">{t(zone.nameKey)}</h3>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="gallery-masonry-wrapper" style={{ animation: 'fadeIn 0.5s ease' }}>
                    {lookbookItems.length > 0 && (
                        <p className="lookbook-notice-text">{t('zone.lookbookNotice')}</p>
                    )}
                    <div className="lookbook-grid">
                        {visibleLookbook.map((item, idx) => (
                            <div key={item.id || idx} className="lookbook-item">
                                <div className="lookbook-img-wrapper">
                                    <img src={item.img || item.imageUrl} alt="Lookbook Image" loading="lazy" />
                                </div>
                                <div className="lookbook-info">
                                    {item.outfitName && (
                                        <p className="lookbook-name">{item.outfitName}</p>
                                    )}
                                    <p className="lookbook-size">
                                        {item.outfitSize
                                            ? String(item.outfitSize).includes('/') || String(item.outfitSize).includes(',')
                                                ? `${t('zone.lookbook.top')} ${String(item.outfitSize).split(/[/,]/)[0].trim()} / ${t('zone.lookbook.bottom')} ${String(item.outfitSize).split(/[/,]/)[1]?.trim() || ''}`
                                                : `${t('zone.lookbook.sizeLabel')} ${item.outfitSize}`
                                            : t('zone.lookbook.sizeUnknown')
                                        }
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {hasMore && (
                        <div className="gallery-more-container">
                            <button
                                className="gallery-more-btn"
                                onClick={() => setVisibleCount(prev => prev + 18)}
                            >
                                더 보기
                            </button>
                        </div>
                    )}

                    {lookbookItems.length === 0 && (
                        <div className="gallery-empty-state">
                            <p>룩북 이미지가 없습니다.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Zone;
