const fs = require('fs');

const code = `import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Building2, 
  Search, 
  Download, 
  Plus, 
  Phone, 
  ExternalLink, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  PhoneCall, 
  Calendar, 
  XCircle, 
  X, 
  Settings, 
  RefreshCw,
  Sparkles,
  MapPin,
  Check,
  Map as MapIcon,
  List,
  Navigation,
  Layers,
  ChevronRight,
  Filter
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { 
  KOREA_REGIONS, 
  REGION_COORDINATES,
  searchPortalFitnessLeads, 
  fetchSalesLeads, 
  importLeadsBatch, 
  addSingleLead, 
  updateLeadStatus, 
  updateLeadMemo, 
  deleteLead,
  getKakaoApiKey,
  setKakaoApiKey
} from '../services/salesLeadService';
import './SalesLeads.css';

export default function SalesLeads() {
  // 🌟 0. 뷰 모드 ('map' | 'table')
  const [viewMode, setViewMode] = useState('map');

  // 🌟 1. 지역/업종 검색 컨트롤러 상태
  const [selectedSido, setSelectedSido] = useState('경기도');
  const [selectedSigungu, setSelectedSigungu] = useState('평택시');
  const [selectedDong, setSelectedDong] = useState('비전동');
  const [customDong, setCustomDong] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('fitness'); // 'fitness' | 'pilates' | 'all'

  // 시군구 목록
  const sigunguList = useMemo(() => {
    return selectedSido && KOREA_REGIONS[selectedSido] ? Object.keys(KOREA_REGIONS[selectedSido]) : [];
  }, [selectedSido]);

  // 동 목록
  const dongList = useMemo(() => {
    return selectedSido && selectedSigungu && KOREA_REGIONS[selectedSido]?.[selectedSigungu]
      ? KOREA_REGIONS[selectedSido][selectedSigungu]
      : [];
  }, [selectedSido, selectedSigungu]);

  // 시도 변경 시
  const handleSidoChange = (sido) => {
    setSelectedSido(sido);
    const newSigungus = sido && KOREA_REGIONS[sido] ? Object.keys(KOREA_REGIONS[sido]) : [];
    const firstSigungu = newSigungus[0] || '';
    setSelectedSigungu(firstSigungu);
    const newDongs = firstSigungu && KOREA_REGIONS[sido]?.[firstSigungu] ? KOREA_REGIONS[sido][firstSigungu] : [];
    setSelectedDong(newDongs[0] || '');
    setCustomDong('');
  };

  // 시군구 변경 시
  const handleSigunguChange = (sigungu) => {
    setSelectedSigungu(sigungu);
    const newDongs = selectedSido && sigungu && KOREA_REGIONS[selectedSido]?.[sigungu] ? KOREA_REGIONS[selectedSido][sigungu] : [];
    setSelectedDong(newDongs[0] || '');
    setCustomDong('');
  };

  // 🌟 2. 영업 리스트 목록 상태
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // 실시간 조회된 지역별 업체 (폴백 및 즉시 지도용)
  const [realtimeLeads, setRealtimeLeads] = useState([]);
  const [loadingRealtime, setLoadingRealtime] = useState(false);

  // 지도 인스턴스 및 마커 관리
  const mapRef = useRef(null);
  const kakaoMapObj = useRef(null);
  const markersRef = useRef([]);
  const activeInfoWindowRef = useRef(null);
  const [selectedLeadId, setSelectedLeadId] = useState(null);

  // 데이터 로드
  const loadLeads = async () => {
    try {
      setLoading(true);
      const data = await fetchSalesLeads();
      setLeads(data);
    } catch (error) {
      console.warn('영업리스트 DB 조회 알림 (실시간 검색 기능으로 대체 지원):', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeads();
  }, []);

  // 🌟 3. 포털 검색 모달 상태
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [selectedResultIds, setSelectedResultIds] = useState(new Set());
  const [importing, setImporting] = useState(false);

  // 포털 실시간 검색 실행
  const handlePortalSearch = async () => {
    const activeDong = customDong.trim() || selectedDong;
    const catText = selectedCategory === 'pilates' ? '필라테스' : selectedCategory === 'fitness' ? '피트니스 헬스장' : '피트니스 필라테스';
    const query = \`\${selectedSido} \${selectedSigungu} \${activeDong} \${catText}\`.trim();

    try {
      setSearching(true);
      setIsSearchModalOpen(true);
      setSearchResults([]);
      setSelectedResultIds(new Set());

      const res = await searchPortalFitnessLeads(query);
      setSearchResults(res.items);
      setSelectedResultIds(new Set(res.items.map(item => item.sourceId)));
    } catch (error) {
      console.error('검색 실패:', error);
      alert('포털 검색 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setSearching(false);
    }
  };

  const toggleSelectResult = (sourceId) => {
    const next = new Set(selectedResultIds);
    if (next.has(sourceId)) {
      next.delete(sourceId);
    } else {
      next.add(sourceId);
    }
    setSelectedResultIds(next);
  };

  const toggleSelectAll = () => {
    if (selectedResultIds.size === searchResults.length) {
      setSelectedResultIds(new Set());
    } else {
      setSelectedResultIds(new Set(searchResults.map(item => item.sourceId)));
    }
  };

  const handleImportSelected = async () => {
    const selectedItems = searchResults.filter(r => selectedResultIds.has(r.sourceId));
    if (selectedItems.length === 0) {
      alert('등록할 업체를 1개 이상 선택해주세요.');
      return;
    }

    try {
      setImporting(true);
      const activeDong = customDong.trim() || selectedDong;
      const regionInfo = {
        sido: selectedSido,
        sigungu: selectedSigungu,
        dong: activeDong
      };

      const result = await importLeadsBatch(selectedItems, regionInfo);
      alert(\`총 \${result.addedCount}개 업체가 영업리스트에 성공적으로 등록되었습니다! (중복 제외: \${result.skippedCount}건)\`);
      setIsSearchModalOpen(false);
      await loadLeads();
    } catch (error) {
      console.error('일괄 등록 오류:', error);
      alert('등록 중 오류가 발생했습니다.');
    } finally {
      setImporting(false);
    }
  };

  // 🌟 4. 영업 상태 및 메모 수정
  const handleStatusChange = async (leadId, newStatus) => {
    try {
      setLeads(prev => prev.map(item => item.id === leadId ? { ...item, status: newStatus } : item));
      setRealtimeLeads(prev => prev.map(item => item.id === leadId ? { ...item, status: newStatus } : item));
      await updateLeadStatus(leadId, newStatus);
    } catch (error) {
      console.error('상태 변경 실패:', error);
    }
  };

  const handleMemoBlur = async (leadId, newMemo) => {
    try {
      await updateLeadMemo(leadId, newMemo);
    } catch (error) {
      console.error('메모 저장 실패:', error);
    }
  };

  const handleDeleteLead = async (leadId, leadName) => {
    if (!window.confirm(\`'\${leadName}' 업체를 영업리스트에서 삭제하시겠습니까?\`)) return;
    try {
      setLeads(prev => prev.filter(item => item.id !== leadId));
      setRealtimeLeads(prev => prev.filter(item => item.id !== leadId));
      await deleteLead(leadId);
    } catch (error) {
      console.error('삭제 실패:', error);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  // 🌟 5. 수기 직접 추가 모달
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualForm, setManualForm] = useState({
    name: '',
    category: 'fitness',
    categoryName: '피트니스',
    phone: '',
    roadAddress: '',
    address: '',
    placeUrl: '',
    memo: ''
  });

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!manualForm.name.trim()) {
      alert('업체명을 입력해주세요.');
      return;
    }

    try {
      const activeDong = customDong.trim() || selectedDong;
      const payload = {
        ...manualForm,
        region: {
          sido: selectedSido,
          sigungu: selectedSigungu,
          dong: activeDong
        },
        status: 'pending'
      };

      await addSingleLead(payload);
      alert('새로운 영업 대상 업체가 등록되었습니다.');
      setIsManualModalOpen(false);
      setManualForm({
        name: '',
        category: 'fitness',
        categoryName: '피트니스',
        phone: '',
        roadAddress: '',
        address: '',
        placeUrl: '',
        memo: ''
      });
      await loadLeads();
    } catch (error) {
      console.error('수기 등록 오류:', error);
      alert('업체 등록 중 오류가 발생했습니다.');
    }
  };

  // 🌟 6. 엑셀 다운로드 (.xlsx)
  const handleExportExcel = (itemsToExport) => {
    const targetItems = Array.isArray(itemsToExport) ? itemsToExport : filteredLeads;
    if (targetItems.length === 0) {
      alert('내보낼 영업 리스트 데이터가 없습니다.');
      return;
    }

    const excelData = targetItems.map((item, idx) => ({
      'No': idx + 1,
      '업체명': item.name,
      '업종': item.categoryName || (item.category === 'pilates' ? '필라테스' : '피트니스'),
      '시도': item.region?.sido || '',
      '시군구': item.region?.sigungu || '',
      '읍면동': item.region?.dong || '',
      '도로명주소': item.roadAddress || item.address || '',
      '전화번호': item.phone || '',
      '영업상태': 
        item.status === 'partnered' ? '제휴성공' :
        item.status === 'scheduled' ? '방문/상담예정' :
        item.status === 'contacted' ? '통화완료' :
        item.status === 'rejected' ? '보류/거절' : '미접촉(신규발굴)',
      '상담/영업메모': item.memo || '',
      '카카오맵 링크': item.placeUrl || '',
      '수집경로': item.source === 'portal_search' ? '포털검색 자동발굴' : '수기등록'
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '영업리스트');

    const colWidths = [
      { wch: 6 },
      { wch: 25 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 35 },
      { wch: 18 },
      { wch: 15 },
      { wch: 30 },
      { wch: 35 },
      { wch: 18 }
    ];
    worksheet['!cols'] = colWidths;

    const today = new Date().toISOString().slice(0, 10);
    const activeDong = customDong.trim() || selectedDong;
    const fileName = \`오걸즈_영업리스트_\${selectedSigungu}_\${activeDong}_\${today}.xlsx\`;
    XLSX.writeFile(workbook, fileName);
  };

  // 🌟 7. API 키 설정 모달
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');

  const openKeyModal = () => {
    setApiKeyInput(getKakaoApiKey());
    setIsKeyModalOpen(true);
  };

  const handleSaveApiKey = () => {
    setKakaoApiKey(apiKeyInput);
    alert('카카오 API 키가 저장되었습니다.');
    setIsKeyModalOpen(false);
  };

  // 🌟 8. 지도 모드용 현재 선택된 지역의 업체 목록 가져오기
  const currentRegionLeads = useMemo(() => {
    let list = leads.filter(lead => {
      const matchSido = !selectedSido || lead.region?.sido === selectedSido;
      const matchSigungu = !selectedSigungu || lead.region?.sigungu === selectedSigungu;
      const matchDong = !selectedDong || lead.region?.dong === selectedDong;
      return matchSido && matchSigungu && matchDong;
    });

    if (list.length === 0 && selectedSigungu) {
      list = leads.filter(lead => {
        return (!selectedSido || lead.region?.sido === selectedSido) &&
               (!selectedSigungu || lead.region?.sigungu === selectedSigungu);
      });
    }

    if (realtimeLeads.length > 0) {
      const existingNames = new Set(list.map(l => (l.name || '').replace(/\\s+/g, '')));
      for (const rl of realtimeLeads) {
        if (!existingNames.has((rl.name || '').replace(/\\s+/g, ''))) {
          list.push(rl);
        }
      }
    }

    if (filterStatus !== 'all') {
      list = list.filter(l => l.status === filterStatus);
    }

    if (searchKeyword.trim()) {
      const kw = searchKeyword.toLowerCase();
      list = list.filter(item => 
        (item.name && item.name.toLowerCase().includes(kw)) ||
        (item.roadAddress && item.roadAddress.toLowerCase().includes(kw)) ||
        (item.phone && item.phone.includes(kw)) ||
        (item.memo && item.memo.toLowerCase().includes(kw))
      );
    }

    return list;
  }, [leads, realtimeLeads, selectedSido, selectedSigungu, selectedDong, filterStatus, searchKeyword]);

  // 🌟 9. 지역 변경 시 실시간 카카오 API 호출로 업체 보충 및 지도 갱신
  useEffect(() => {
    let isMounted = true;
    const fetchRegionLeadsLive = async () => {
      if (!selectedSigungu) return;
      const activeDong = customDong.trim() || selectedDong || '';
      const query1 = \`\${selectedSido} \${selectedSigungu} \${activeDong} 피트니스\`.trim();
      const query2 = \`\${selectedSido} \${selectedSigungu} \${activeDong} 필라테스\`.trim();

      try {
        setLoadingRealtime(true);
        const [res1, res2] = await Promise.all([
          searchPortalFitnessLeads(query1, 1),
          searchPortalFitnessLeads(query2, 1)
        ]);

        if (!isMounted) return;

        const combined = [...(res1.items || []), ...(res2.items || [])];
        const unique = [];
        const seen = new Set();

        for (const item of combined) {
          if (!seen.has(item.sourceId)) {
            seen.add(item.sourceId);
            unique.push({
              id: item.sourceId || \`lead_\${Date.now()}_\${Math.random().toString(36).substr(2, 5)}\`,
              name: item.name,
              category: item.category,
              categoryName: item.categoryName,
              region: { sido: selectedSido, sigungu: selectedSigungu, dong: activeDong },
              roadAddress: item.roadAddress,
              address: item.address,
              phone: item.phone,
              placeUrl: item.placeUrl,
              x: item.x,
              y: item.y,
              status: 'pending',
              memo: '',
              source: 'portal_search'
            });
          }
        }
        setRealtimeLeads(unique);
      } catch (err) {
        console.warn('실시간 지역 업체 조회 알림:', err);
      } finally {
        if (isMounted) setLoadingRealtime(false);
      }
    };

    fetchRegionLeadsLive();

    return () => { isMounted = false; };
  }, [selectedSido, selectedSigungu, selectedDong]);

  // 🌟 10. 카카오 지도 초기화 및 마커 렌더링
  useEffect(() => {
    if (viewMode !== 'map') return;

    if (!window.kakao || !window.kakao.maps) {
      console.warn('카카오 지도 SDK 로딩 대기 중...');
      return;
    }

    const container = mapRef.current;
    if (!container) return;

    let lat = 37.2750;
    let lng = 127.0094;
    let zoomLevel = 5;

    const sidoCoord = REGION_COORDINATES[selectedSido];
    if (sidoCoord) {
      lat = sidoCoord.lat;
      lng = sidoCoord.lng;
      zoomLevel = sidoCoord.zoom || 6;

      if (selectedSigungu && sidoCoord.sigungu?.[selectedSigungu]) {
        lat = sidoCoord.sigungu[selectedSigungu].lat;
        lng = sidoCoord.sigungu[selectedSigungu].lng;
        zoomLevel = sidoCoord.sigungu[selectedSigungu].zoom || 4;
      }
    }

    const centerPos = new window.kakao.maps.LatLng(lat, lng);

    if (!kakaoMapObj.current) {
      const options = {
        center: centerPos,
        level: zoomLevel
      };
      const map = new window.kakao.maps.Map(container, options);
      const zoomControl = new window.kakao.maps.ZoomControl();
      map.addControl(zoomControl, window.kakao.maps.ControlPosition.RIGHT);
      kakaoMapObj.current = map;
    } else {
      kakaoMapObj.current.setLevel(zoomLevel);
      kakaoMapObj.current.panTo(centerPos);
    }

    const map = kakaoMapObj.current;

    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];
    if (activeInfoWindowRef.current) {
      activeInfoWindowRef.current.close();
      activeInfoWindowRef.current = null;
    }

    const geocoder = window.kakao.maps.services ? new window.kakao.maps.services.Geocoder() : null;

    currentRegionLeads.forEach(lead => {
      const renderMarkerAt = (pos) => {
        const isPilates = lead.category === 'pilates' || lead.name.includes('필라테스');
        const markerColor = isPilates ? '#ec4899' : '#3b82f6';
        
        const marker = new window.kakao.maps.Marker({
          map: map,
          position: pos,
          title: lead.name
        });

        const infoContent = \`
          <div style="padding:12px; min-width:220px; font-family:sans-serif; line-height:1.4;">
            <div style="font-size:0.75rem; font-weight:800; color:\${markerColor}; margin-bottom:2px;">
              \${isPilates ? '🧘 필라테스 / 요가' : '🏋️ 피트니스 / 헬스'}
            </div>
            <strong style="font-size:0.95rem; color:#111; display:block; margin-bottom:4px;">\${lead.name}</strong>
            <div style="font-size:0.8rem; color:#555; margin-bottom:4px;">\${lead.roadAddress || lead.address || '주소 정보 없음'}</div>
            <div style="font-size:0.8rem; color:#2563eb; font-weight:bold; margin-bottom:6px;">\${lead.phone || '전화번호 미등록'}</div>
            <div style="display:flex; gap:6px;">
              \${lead.phone ? \`<a href="tel:\${lead.phone}" style="background:#2563eb; color:#fff; font-size:0.72rem; padding:4px 8px; border-radius:4px; text-decoration:none; font-weight:bold;">📞 전화하기</a>\` : ''}
              \${lead.placeUrl ? \`<a href="\${lead.placeUrl}" target="_blank" style="background:#f3f4f6; color:#333; font-size:0.72rem; padding:4px 8px; border-radius:4px; text-decoration:none; border:1px solid #ddd;">길찾기 ↗</a>\` : ''}
            </div>
          </div>
        \`;

        const infoWindow = new window.kakao.maps.InfoWindow({
          content: infoContent,
          removable: true
        });

        window.kakao.maps.event.addListener(marker, 'click', () => {
          if (activeInfoWindowRef.current) activeInfoWindowRef.current.close();
          infoWindow.open(map, marker);
          activeInfoWindowRef.current = infoWindow;
          setSelectedLeadId(lead.id);
        });

        markersRef.current.push(marker);
      };

      if (lead.y && lead.x) {
        renderMarkerAt(new window.kakao.maps.LatLng(Number(lead.y), Number(lead.x)));
      } else if (geocoder && (lead.roadAddress || lead.address)) {
        geocoder.addressSearch(lead.roadAddress || lead.address, (result, status) => {
          if (status === window.kakao.maps.services.Status.OK && result[0]) {
            renderMarkerAt(new window.kakao.maps.LatLng(result[0].y, result[0].x));
          }
        });
      }
    });

  }, [viewMode, selectedSido, selectedSigungu, selectedDong, currentRegionLeads]);

  const focusOnLead = (lead) => {
    setSelectedLeadId(lead.id);
    if (!kakaoMapObj.current) return;

    const moveMap = (pos) => {
      kakaoMapObj.current.setLevel(3);
      kakaoMapObj.current.panTo(pos);
    };

    if (lead.y && lead.x) {
      moveMap(new window.kakao.maps.LatLng(Number(lead.y), Number(lead.x)));
    } else if (window.kakao?.maps?.services && (lead.roadAddress || lead.address)) {
      const geocoder = new window.kakao.maps.services.Geocoder();
      geocoder.addressSearch(lead.roadAddress || lead.address, (result, status) => {
        if (status === window.kakao.maps.services.Status.OK && result[0]) {
          moveMap(new window.kakao.maps.LatLng(result[0].y, result[0].x));
        }
      });
    }
  };

  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      if (filterStatus !== 'all' && lead.status !== filterStatus) return false;
      if (searchKeyword.trim()) {
        const kw = searchKeyword.toLowerCase();
        const matchName = lead.name?.toLowerCase().includes(kw);
        const matchPhone = lead.phone?.includes(kw);
        const matchAddr = lead.roadAddress?.toLowerCase().includes(kw);
        const matchMemo = lead.memo?.toLowerCase().includes(kw);
        if (!matchName && !matchPhone && !matchAddr && !matchMemo) return false;
      }
      return true;
    });
  }, [leads, filterStatus, searchKeyword]);

  const stats = useMemo(() => {
    return {
      total: leads.length,
      pending: leads.filter(l => l.status === 'pending').length,
      contacted: leads.filter(l => l.status === 'contacted').length,
      scheduled: leads.filter(l => l.status === 'scheduled').length,
      partnered: leads.filter(l => l.status === 'partnered').length,
      rejected: leads.filter(l => l.status === 'rejected').length
    };
  }, [leads]);

  return (
    <div className="sales-leads-page">
      {/* 상단 타이틀 & 주요 액션 */}
      <div className="leads-header">
        <div className="leads-header-titles">
          <h1>
            <Building2 className="w-8 h-8 text-blue-600" />
            피트니스 & 필라테스 영업리스트
          </h1>
          <p>전국 지도에서 원하는 지역을 터치하면 해당 지역의 피트니스와 필라테스 업체가 실시간으로 펼쳐집니다.</p>
        </div>

        <div className="leads-header-actions">
          {/* 🌟 뷰 모드 전환 토글 탭 */}
          <div className="view-mode-toggle">
            <button 
              className={\`mode-btn \${viewMode === 'map' ? 'active' : ''}\`}
              onClick={() => setViewMode('map')}
            >
              <MapIcon className="w-4 h-4" />
              지도로 보기
            </button>
            <button 
              className={\`mode-btn \${viewMode === 'table' ? 'active' : ''}\`}
              onClick={() => setViewMode('table')}
            >
              <List className="w-4 h-4" />
              목록으로 보기
            </button>
          </div>

          <button className="btn-secondary-action" onClick={openKeyModal} title="카카오 API Key 관리">
            <Settings className="w-4 h-4" />
            API 설정
          </button>
          <button className="btn-secondary-action" onClick={() => setIsManualModalOpen(true)}>
            <Plus className="w-4 h-4" />
            업체 수기 등록
          </button>
          <button className="btn-excel-action" onClick={() => handleExportExcel(viewMode === 'map' ? currentRegionLeads : filteredLeads)}>
            <Download className="w-4 h-4" />
            엑셀 다운로드 ({viewMode === 'map' ? currentRegionLeads.length : filteredLeads.length})
          </button>
        </div>
      </div>

      {/* 🌟 인터랙티브 전국 지역 셀렉터 네비게이션 바 */}
      <div className="korea-region-bar">
        <div className="region-bar-title">
          <MapPin className="w-4 h-4 text-blue-600" />
          <span>대한민국 시·도 선택:</span>
        </div>
        <div className="region-pills-scroll">
          {Object.keys(KOREA_REGIONS).map(sido => (
            <button
              key={sido}
              className={\`region-pill \${selectedSido === sido ? 'active' : ''}\`}
              onClick={() => handleSidoChange(sido)}
            >
              {sido}
            </button>
          ))}
        </div>
      </div>

      {/* 🌟 선택된 시·도의 시·군·구 서브 칩 바 */}
      {sigunguList.length > 0 && (
        <div className="sigungu-sub-bar">
          <div className="sigungu-bar-label">
            <Navigation className="w-3.5 h-3.5 text-slate-500" />
            <strong>{selectedSido}</strong> 상세 시·군·구:
          </div>
          <div className="sigungu-chips-scroll">
            {sigunguList.map(sigungu => (
              <button
                key={sigungu}
                className={\`sigungu-chip \${selectedSigungu === sigungu ? 'active' : ''}\`}
                onClick={() => handleSigunguChange(sigungu)}
              >
                {sigungu}
              </button>
            ))}
          </div>

          {dongList.length > 0 && (
            <div className="dong-quick-select">
              <span className="text-xs text-slate-500 font-medium">동 선택:</span>
              <select 
                className="filter-select text-xs h-7"
                value={selectedDong} 
                onChange={(e) => { setSelectedDong(e.target.value); setCustomDong(''); }}
              >
                {dongList.map(dong => (
                  <option key={dong} value={dong}>{dong}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      {/* 🌟 1. 지도로 보기 모드 */}
      {viewMode === 'map' ? (
        <div className="leads-map-layout">
          {/* 좌측: 카카오 지도 영역 */}
          <div className="leads-map-wrapper">
            <div className="map-overlay-badge">
              <MapPin className="w-3.5 h-3.5 text-blue-600" />
              <span>{selectedSido} {selectedSigungu} {selectedDong}</span>
              <span className="badge-count">{currentRegionLeads.length}개 업체 발굴</span>
              {loadingRealtime && <span className="text-xs text-blue-600 animate-pulse">(실시간 갱신 중...)</span>}
            </div>

            <div id="kakao-sales-map" ref={mapRef} className="kakao-map-canvas" />

            <div className="map-legend">
              <span className="legend-item"><span className="legend-dot blue"></span> 🏋️ 피트니스</span>
              <span className="legend-item"><span className="legend-dot pink"></span> 🧘 필라테스</span>
            </div>
          </div>

          {/* 우측: 선택 지역 업체 리스트 패널 */}
          <div className="leads-map-sidebar">
            <div className="sidebar-header">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-800 text-base m-0">
                    {selectedSigungu} {selectedDong} 업체 목록
                  </h3>
                  <span className="region-count-pill">{currentRegionLeads.length}</span>
                </div>
                <button 
                  className="btn-primary-action py-1 px-2.5 text-xs flex items-center gap-1"
                  onClick={handlePortalSearch}
                  title="이 지역 신규 업체 추가 발굴"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  포털 자동발굴
                </button>
              </div>

              <div className="sidebar-filter-row">
                <div className="sidebar-search-box">
                  <Search className="w-3.5 h-3.5 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="업체명, 주소, 메모 검색..." 
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                  />
                </div>
                <select 
                  className="filter-select text-xs h-8"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="all">전체 상태</option>
                  <option value="pending">미접촉</option>
                  <option value="contacted">통화완료</option>
                  <option value="scheduled">상담예정</option>
                  <option value="partnered">제휴성공</option>
                  <option value="rejected">보류/거절</option>
                </select>
              </div>
            </div>

            <div className="sidebar-leads-list">
              {currentRegionLeads.length === 0 ? (
                <div className="sidebar-empty-state">
                  <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="font-bold text-slate-700 mb-1">해당 지역에 등록된 업체가 없습니다.</p>
                  <p className="text-xs text-slate-400 mb-3">상단의 [포털 자동발굴] 버튼을 누르면 즉시 발굴됩니다.</p>
                  <button className="btn-primary-action text-xs" onClick={handlePortalSearch}>
                    <Sparkles className="w-3.5 h-3.5" />
                    이 지역 업체 자동 발굴하기
                  </button>
                </div>
              ) : (
                currentRegionLeads.map((lead, idx) => {
                  const isPilates = lead.category === 'pilates' || lead.name.includes('필라테스');
                  const isSelected = selectedLeadId === lead.id;

                  return (
                    <div 
                      key={lead.id || idx} 
                      className={\`lead-card-item \${isSelected ? 'focused' : ''}\`}
                      onClick={() => focusOnLead(lead)}
                    >
                      <div className="card-top-row">
                        <span className={\`category-tag \${isPilates ? 'pilates' : 'fitness'}\`}>
                          {isPilates ? '🧘 필라테스' : '🏋️ 피트니스'}
                        </span>
                        
                        <select 
                          className={\`status-badge-select \${lead.status || 'pending'}\`}
                          value={lead.status || 'pending'}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                        >
                          <option value="pending">미접촉</option>
                          <option value="contacted">통화완료</option>
                          <option value="scheduled">상담예정</option>
                          <option value="partnered">제휴성공</option>
                          <option value="rejected">보류/거절</option>
                        </select>
                      </div>

                      <h4 className="card-lead-name">{lead.name}</h4>
                      
                      <p className="card-lead-address">
                        <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                        <span>{lead.roadAddress || lead.address || '주소 정보 없음'}</span>
                      </p>

                      <div className="card-contact-row">
                        {lead.phone ? (
                          <a 
                            href={\`tel:\${lead.phone}\`} 
                            className="card-phone-link"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Phone className="w-3 h-3 text-blue-600" />
                            <span>{lead.phone}</span>
                          </a>
                        ) : (
                          <span className="text-xs text-slate-400">전화번호 미등록</span>
                        )}

                        {lead.placeUrl && (
                          <a 
                            href={lead.placeUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="card-external-link"
                            onClick={(e) => e.stopPropagation()}
                          >
                            길찾기/정보 ↗
                          </a>
                        )}
                      </div>

                      <div className="card-memo-box" onClick={(e) => e.stopPropagation()}>
                        <input 
                          type="text" 
                          defaultValue={lead.memo || ''}
                          placeholder="영업 메모 입력 (엔터 시 저장)"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleMemoBlur(lead.id, e.target.value);
                              e.target.blur();
                            }
                          }}
                          onBlur={(e) => handleMemoBlur(lead.id, e.target.value)}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      ) : (
        /* 🌟 2. 테이블 목록으로 보기 모드 */
        <>
          <div className="leads-summary-row">
            <div className="summary-pill total">
              <span className="summary-pill-label">전체 영업대상</span>
              <span className="summary-pill-count">{stats.total}</span>
            </div>
            <div className="summary-pill pending">
              <span className="summary-pill-label">미접촉 (발굴)</span>
              <span className="summary-pill-count">{stats.pending}</span>
            </div>
            <div className="summary-pill contacted">
              <span className="summary-pill-label">통화완료</span>
              <span className="summary-pill-count">{stats.contacted}</span>
            </div>
            <div className="summary-pill scheduled">
              <span className="summary-pill-label">방문/상담예정</span>
              <span className="summary-pill-count">{stats.scheduled}</span>
            </div>
            <div className="summary-pill partnered">
              <span className="summary-pill-label">제휴성공 🎉</span>
              <span className="summary-pill-count">{stats.partnered}</span>
            </div>
            <div className="summary-pill rejected">
              <span className="summary-pill-label">보류/거절</span>
              <span className="summary-pill-count">{stats.rejected}</span>
            </div>
          </div>

          <div className="leads-table-container">
            <div className="leads-table-toolbar">
              <div className="toolbar-search">
                <Search className="toolbar-search-icon w-4 h-4" />
                <input 
                  type="text" 
                  placeholder="상호명, 전화번호, 주소, 메모 검색..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                />
              </div>

              <div className="toolbar-right">
                <select 
                  className="filter-select text-sm h-9"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="all">전체 영업상태</option>
                  <option value="pending">미접촉</option>
                  <option value="contacted">통화완료</option>
                  <option value="scheduled">방문/상담예정</option>
                  <option value="partnered">제휴성공</option>
                  <option value="rejected">보류/거절</option>
                </select>

                <button className="btn-secondary-action py-1.5 text-xs" onClick={loadLeads} title="새로고침">
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {loading ? (
              <div className="empty-state-box">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-2" />
                <h4>영업 리스트 로딩 중...</h4>
              </div>
            ) : filteredLeads.length === 0 ? (
              <div className="empty-state-box">
                <Building2 className="w-12 h-12 mx-auto text-slate-300 mb-2" />
                <h4>등록된 영업 리스트가 없습니다.</h4>
                <p>상단의 포털 검색 수집 버튼을 눌러 지역 피트니스/필라테스 업체를 검색해보세요.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="leads-table">
                  <thead>
                    <tr>
                      <th style={{ width: '60px' }}>No</th>
                      <th style={{ width: '220px' }}>피트니스 / 필라테스명</th>
                      <th>지역 / 도로명 주소</th>
                      <th style={{ width: '150px' }}>전화번호</th>
                      <th style={{ width: '100px' }}>링크</th>
                      <th style={{ width: '130px' }}>영업 상태</th>
                      <th>상담 / 영업 메모</th>
                      <th style={{ width: '60px' }}>관리</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLeads.map((item, index) => (
                      <tr key={item.id}>
                        <td className="text-center font-bold text-slate-400">{index + 1}</td>
                        <td>
                          <div className="lead-name-cell">
                            <span className="font-bold text-slate-900">{item.name}</span>
                            <span className={\`category-tag \${item.category === 'pilates' ? 'pilates' : 'fitness'}\`}>
                              {item.categoryName || (item.category === 'pilates' ? '필라테스' : '피트니스')}
                            </span>
                          </div>
                        </td>
                        <td>
                          <div className="lead-address-cell">
                            <span className="text-xs font-bold text-blue-600">
                              {item.region?.sido} {item.region?.sigungu} {item.region?.dong}
                            </span>
                            <span className="text-slate-600 text-xs truncate max-w-xs" title={item.roadAddress || item.address}>
                              {item.roadAddress || item.address || '-'}
                            </span>
                          </div>
                        </td>
                        <td>
                          {item.phone ? (
                            <a href={\`tel:\${item.phone}\`} className="lead-phone-cell">
                              <Phone className="w-3.5 h-3.5 text-blue-600" />
                              <span>{item.phone}</span>
                            </a>
                          ) : (
                            <span className="text-slate-400 text-xs">-</span>
                          )}
                        </td>
                        <td className="text-center">
                          {item.placeUrl ? (
                            <a 
                              href={item.placeUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="lead-link-btn"
                              title="카카오맵/포털 상세페이지 열기"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              보기
                            </a>
                          ) : (
                            <span className="text-slate-400 text-xs">-</span>
                          )}
                        </td>
                        <td>
                          <select 
                            className={\`status-select \${item.status || 'pending'}\`}
                            value={item.status || 'pending'}
                            onChange={(e) => handleStatusChange(item.id, e.target.value)}
                          >
                            <option value="pending">미접촉</option>
                            <option value="contacted">통화완료</option>
                            <option value="scheduled">방문/상담예정</option>
                            <option value="partnered">제휴성공 🎉</option>
                            <option value="rejected">보류/거절</option>
                          </select>
                        </td>
                        <td>
                          <input 
                            type="text"
                            className="memo-input"
                            defaultValue={item.memo || ''}
                            placeholder="영업 메모 입력 (엔터 또는 포커스 아웃 시 저장)"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleMemoBlur(item.id, e.target.value);
                                e.target.blur();
                              }
                            }}
                            onBlur={(e) => handleMemoBlur(item.id, e.target.value)}
                          />
                        </td>
                        <td className="text-center">
                          <button 
                            className="delete-lead-btn" 
                            onClick={() => handleDeleteLead(item.id, item.name)}
                            title="삭제"
                          >
                            <Trash2 className="w-4 h-4 text-rose-500" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* 포털 실시간 검색 모달 */}
      {isSearchModalOpen && (
        <div className="leads-modal-backdrop">
          <div className="leads-modal-content max-w-4xl">
            <div className="leads-modal-header">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-600" />
                <h3>포털 실시간 피트니스/필라테스 발굴 결과</h3>
              </div>
              <button className="modal-close-btn" onClick={() => setIsSearchModalOpen(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="leads-modal-body">
              {searching ? (
                <div className="py-16 text-center">
                  <RefreshCw className="w-10 h-10 animate-spin mx-auto text-blue-600 mb-3" />
                  <p className="font-bold text-slate-800 text-base">포털(카카오)에서 실시간으로 업체를 발굴하고 있습니다...</p>
                  <p className="text-sm text-slate-500">잠시만 기다려주세요.</p>
                </div>
              ) : searchResults.length === 0 ? (
                <div className="py-12 text-center">
                  <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <h4 className="font-bold text-slate-700 mb-1">검색 결과가 없습니다.</h4>
                  <p className="text-xs text-slate-500">다른 동 이름을 선택하거나 직접 입력하여 다시 검색해보세요.</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-3 px-1">
                    <span className="text-sm font-bold text-slate-700">
                      총 <strong className="text-blue-600">{searchResults.length}</strong>개 발굴 ({selectedResultIds.size}개 선택됨)
                    </span>
                    <button className="btn-secondary-action py-1 px-3 text-xs" onClick={toggleSelectAll}>
                      {selectedResultIds.size === searchResults.length ? '전체 해제' : '전체 선택'}
                    </button>
                  </div>

                  <div className="search-results-list">
                    {searchResults.map((item) => {
                      const isSelected = selectedResultIds.has(item.sourceId);
                      return (
                        <div 
                          key={item.sourceId}
                          className={\`search-result-card \${isSelected ? 'selected' : ''}\`}
                          onClick={() => toggleSelectResult(item.sourceId)}
                        >
                          <input 
                            type="checkbox" 
                            checked={isSelected}
                            onChange={() => {}} 
                            className="w-4 h-4 rounded text-blue-600"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-bold text-slate-900 text-sm truncate">{item.name}</span>
                              <span className={\`category-tag \${item.category === 'pilates' ? 'pilates' : 'fitness'}\`}>
                                {item.categoryName}
                              </span>
                            </div>
                            <div className="text-xs text-slate-500 truncate mb-1">
                              {item.roadAddress || item.address}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-slate-600">
                              <span>📞 {item.phone || '전화번호 미등록'}</span>
                              {item.placeUrl && (
                                <a 
                                  href={item.placeUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-blue-600 hover:underline flex items-center gap-0.5"
                                >
                                  지도보기 <ExternalLink className="w-3 h-3" />
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            <div className="leads-modal-footer">
              <button className="btn-secondary-action" onClick={() => setIsSearchModalOpen(false)}>
                닫기
              </button>
              <button 
                className="btn-primary-action"
                disabled={searching || selectedResultIds.size === 0 || importing}
                onClick={handleImportSelected}
              >
                {importing ? '등록 중...' : \`선택한 \${selectedResultIds.size}개 업체 영업리스트에 일괄 등록\`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 업체 수기 직접 등록 모달 */}
      {isManualModalOpen && (
        <div className="leads-modal-backdrop">
          <div className="leads-modal-content max-w-lg">
            <div className="leads-modal-header">
              <h3>신규 피트니스 / 필라테스 업체 직접 등록</h3>
              <button className="modal-close-btn" onClick={() => setIsManualModalOpen(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleManualSubmit}>
              <div className="leads-modal-body space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">업체명 *</label>
                  <input 
                    type="text" 
                    className="filter-input w-full" 
                    placeholder="예: 핏걸즈 피트니스 평택점"
                    value={manualForm.name}
                    onChange={(e) => setManualForm({ ...manualForm, name: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">업종 구분</label>
                    <select 
                      className="filter-select w-full"
                      value={manualForm.category}
                      onChange={(e) => setManualForm({ 
                        ...manualForm, 
                        category: e.target.value,
                        categoryName: e.target.value === 'pilates' ? '필라테스' : '피트니스'
                      })}
                    >
                      <option value="fitness">🏋️ 피트니스 / 헬스</option>
                      <option value="pilates">🧘 필라테스 / 요가</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">전화번호</label>
                    <input 
                      type="text" 
                      className="filter-input w-full" 
                      placeholder="031-000-0000"
                      value={manualForm.phone}
                      onChange={(e) => setManualForm({ ...manualForm, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">도로명 주소</label>
                  <input 
                    type="text" 
                    className="filter-input w-full" 
                    placeholder="예: 경기 평택시 비전5로 20-24"
                    value={manualForm.roadAddress}
                    onChange={(e) => setManualForm({ ...manualForm, roadAddress: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">카카오맵 또는 플레이스 URL</label>
                  <input 
                    type="url" 
                    className="filter-input w-full" 
                    placeholder="https://place.map.kakao.com/..."
                    value={manualForm.placeUrl}
                    onChange={(e) => setManualForm({ ...manualForm, placeUrl: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">영업 메모</label>
                  <textarea 
                    className="filter-input w-full h-20 resize-none" 
                    placeholder="원장님 상담 이력, 영업 특이사항 등..."
                    value={manualForm.memo}
                    onChange={(e) => setManualForm({ ...manualForm, memo: e.target.value })}
                  />
                </div>
              </div>

              <div className="leads-modal-footer">
                <button type="button" className="btn-secondary-action" onClick={() => setIsManualModalOpen(false)}>
                  취소
                </button>
                <button type="submit" className="btn-primary-action">
                  영업리스트에 등록
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 카카오 API 키 관리 모달 */}
      {isKeyModalOpen && (
        <div className="leads-modal-backdrop">
          <div className="leads-modal-content max-w-md">
            <div className="leads-modal-header">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-blue-600" />
                <h3>카카오 검색 REST API 키 설정</h3>
              </div>
              <button className="modal-close-btn" onClick={() => setIsKeyModalOpen(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="leads-modal-body space-y-3">
              <p className="text-xs text-slate-600 leading-relaxed">
                카카오 개발자 센터(developers.kakao.com)에서 발급받은 REST API 키를 입력하시면 하루 최대 30만 건까지 실시간 업체 검색이 가능합니다.
                <br /><span className="text-blue-600 font-bold">(기본 공용 키가 내장되어 있어 미입력 시에도 바로 검색이 동작합니다.)</span>
              </p>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Kakao REST API Key</label>
                <input 
                  type="text" 
                  className="filter-input w-full font-mono text-xs" 
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder="32자리 카카오 REST API 키"
                />
              </div>
            </div>
            <div className="leads-modal-footer">
              <button className="btn-secondary-action" onClick={() => setIsKeyModalOpen(false)}>
                취소
              </button>
              <button className="btn-primary-action" onClick={handleSaveApiKey}>
                저장하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
\`;

fs.writeFileSync('/Users/house/Pictures/ogirls/src/pages/SalesLeads.jsx', code, 'utf8');
console.log('Successfully wrote SalesLeads.jsx to ogirls');
