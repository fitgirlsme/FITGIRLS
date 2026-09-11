const crypto = require('crypto');
const https = require('https');

const KAKAO_API_KEY = '47a0546cd15e4d3a5a839279e2ff4d16';
const FIREBASE_PROJECT_ID = 'ogirls';
const FIREBASE_CLIENT_EMAIL = 'firebase-adminsdk-fbsvc@ogirls.iam.gserviceaccount.com';
const FIREBASE_PRIVATE_KEY = '-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDDeKMw5S9DWwAM\nbSCqdosAvOq9Uk00n3YTXPONx5S7Qggttrm1iFCnz4d7tDLLkz9Z/V+Mqz4KJ7Hr\nb+uZ3+g6Up5J9yqA9WIraACKR4fGpYPI44a8sDe6LYdIhsdedIqSh7oRpb/0UYpn\n6ZE1DSQdYFm2J9chCXzAPmjRlM0RokPmjX4PDc+opabJAeg98pdUQ6xmBQG3XTQs\nduHWWbslyAeP8/6QNNhCKrxSJmgupv1/mcolqywCmBuJxXiqD7BnTYWE4VkSdbYk\nBdzP0YzQyz1ca4reoc+OOlhkaRshBASeqGUuzfx1dO0YY/6LjXc3qirE54aRCIYm\nz7Z8w8X3AgMBAAECggEACKm5jcqyeAk57NMPTg635V36B0709f6VNJF7h86PFGd+\nRkxhWZ7DeFR1vDFFyQjrF1ln2Sujsb6Fn5oTtnuaZq9PrZaDLzjw01ymHXrDFTYz\nq30N9SHYLmujIb87ab+/fnP+dpbCdZkBic5rrY66CYVCJJUKbz/k4/5AFf3CwuO6\nw5LOP12Ytx6sLiObjYbtLGP8lM4UjcCYTEEgy+aiXgviZ6R0VU2keq/R/uE+N8/Z\nLkqRDZLGunVdlVgQTWqimlIypXMxHh2s5lxgGhBWXfal72o+3938DrMoBCBXbqi8\nI8WabxD6HNVlPnDtjiASL1v2auILw6ivt41+x40Z6QKBgQDsqrRLlmlQpa2NUQv5\nx2PTb7tmYG8xA43z0x6tyevuLe4jxUI1p5SMTSJJXIBRHCVyMiQPVZaKwkTYp1S2\nhUo2wgtR7mRlRuNOI+D/5ToEAvlNY0IgElhMMA5sbJe63qAiDMA/M1jkeJdnZydN\nOuBgpNxAZPzbjL5QV7B1q+sTzwKBgQDTcIrRl19umUGUv2qFyTvlk/WGP9//Kpuk\nOVAAfBAsXOFizD/StqdHY5O8oE8h3U7orHO3XPEgl3FE2WSroDc3i4ogOnDqVlIy\nDmX0+9QXkBPJRk/Gt5Y+sPWb6a8g+bRq9u/Xp92F02UpVkMr0uP4s1COrfeRQxfk\nycVduKmtWQKBgBWQ5bqNlkM3Fb2O6Rx1wu79e4I0v20j+ceCMYV8pPcrUEwKKaJi\nBvNSBBHTUA4UFoV1dDvBfNpgIY3skZegRcb/n7BznMptz0DLnDE1XjgHXVhj9x6d\nDVbD+kx/CMSKjOUNbGdV8n+/TWyqxbYP62pjG37ytOf8x0ri8r2GUQGZAoGAXMcU\nUrV+TZR3/2IixsOvQaSz5o2ep2O12dDANwY5Po4e4/BFzRsSubOK/wjE0FJArr4F\nJJ9muutY62IM13Y85GWZXVzncRwhgw9oU6Awx4oT9IyissqZ5bZWf2yByRFoxkrG\noTVqca95wzKz1MX7/IQKRCE38YikMmMK9H30DjkCgYEAnPUOZBI3TW8wlBG8BsrB\nZ6hiYw/tq257IZ5WVA4XuXnfaaVxFMEMliJtDiDzLxL4sFIGOoA6SSYbrqTRMJGO\nV/kWudWAsS/K7FtMXgJ2+JzcqvU+pDq1Ehcuf7nma/8Y159F9IDOr3VBeg8m++CK\n4LfC19AC7hA5Yz2r9IIDJYw=\n-----END PRIVATE KEY-----\n';

// 대한민국 전역 행정구역 데이터
const KOREA_REGIONS = {
  '경기도': {
    '평택시': ['비전동', '동삭동', '고덕동', '세교동', '용이동', '죽백동', '서정동', '이충동', '장당동', '신장동', '안중읍', '포승읍', '청북읍', '팽성읍'],
    '수원시': ['인계동', '매산동', '영통동', '광교동', '정자동', '화서동', '권선동', '곡반정동', '망포동'],
    '성남시': ['분당동', '정자동', '서현동', '수내동', '야탑동', '판교동', '백현동', '신흥동', '모란동'],
    '화성시': ['동탄동', '병점동', '봉담읍', '향남읍', '남양읍', '송산동', '진안동'],
    '용인시': ['기흥동', '수지동', '처인동', '풍덕천동', '상현동', '죽전동', '동백동', '역북동'],
    '고양시': ['일산동', '주엽동', '마두동', '백석동', '화정동', '행신동', '삼송동', '원흥동'],
    '안양시': ['안양동', '평촌동', '범계동', '호계동', '비산동', '관양동'],
    '부천시': ['중동', '상동', '심곡동', '송내동', '역곡동', '원종동'],
    '안산시': ['고잔동', '중앙동', '초지동', '선부동', '본오동', '사동'],
    '시흥시': ['배곧동', '정왕동', '은계동', '목감동', '은행동', '대야동'],
    '하남시': ['미사동', '위례동', '신장동', '덕풍동', '감일동'],
    '김포시': ['구래동', '장기동', '운양동', '풍무동', '사우동'],
    '파주시': ['운정동', '야당동', '금촌동', '문산읍', '교하동'],
    '남양주시': ['다산동', '별내동', '호평동', '평내동', '진접읍', '화도읍'],
    '의정부시': ['의정부동', '호원동', '민락동', '장암동', '신곡동'],
    '광명시': ['철산동', '하안동', '소하동', '일직동', '광명동']
  },
  '서울특별시': {
    '강남구': ['역삼동', '개포동', '청담동', '삼성동', '대치동', '신사동', '논현동', '압구정동', '도곡동'],
    '서초구': ['서초동', '잠원동', '반포동', '방배동', '양재동', '내곡동'],
    '송파구': ['잠실동', '신천동', '문정동', '가락동', '송파동', '방이동', '오금동', '석촌동', '위례동'],
    '마포구': ['서교동', '연남동', '망원동', '상암동', '공덕동', '합정동', '아현동'],
    '영등포구': ['여의도동', '당산동', '문래동', '영등포동', '신길동', '양평동'],
    '강서구': ['마곡동', '화곡동', '가양동', '발산동', '방화동', '염창동'],
    '용산구': ['한남동', '이태원동', '효창동', '이촌동', '원효로동', '남영동'],
    '성동구': ['성수동', '왕십리동', '행당동', '옥수동', '금호동'],
    '노원구': ['상계동', '중계동', '하계동', '공릉동', '월계동'],
    '광진구': ['자양동', '구의동', '화양동', '군자동', '중곡동'],
    '양천구': ['목동', '신정동', '신월동'],
    '구로구': ['구로동', '신도림동', '개봉동', '고척동', '오류동']
  },
  '인천광역시': {
    '연수구': ['송도동', '연수동', '동춘동', '청학동'],
    '남동구': ['구월동', '논현동', '간석동', '만수동', '서창동'],
    '부평구': ['부평동', '산곡동', '삼산동', '부개동', '청천동'],
    '서구': ['청라동', '검단동', '루원시티', '가정동', '당하동', '마전동']
  },
  '부산광역시': {
    '해운대구': ['우동', '중동', '좌동', '재송동', '반여동'],
    '부산진구': ['부전동', '전포동', '당감동', '양정동', '개금동'],
    '수영구': ['광안동', '남천동', '민락동', '망미동'],
    '동래구': ['온천동', '사직동', '명륜동', '수안동']
  },
  '대구광역시': {
    '수성구': ['범어동', '만촌동', '황금동', '지산동', '두산동'],
    '중구': ['동성로', '삼덕동', '대봉동', '남산동'],
    '달서구': ['상인동', '월성동', '신당동', '용산동', '이곡동']
  },
  '대전광역시': {
    '유성구': ['봉명동', '관평동', '노은동', '도룡동', '원신흥동'],
    '서구': ['둔산동', '월평동', '탄방동', '갈마동', '도안동']
  },
  '광주광역시': {
    '서구': ['치평동', '화정동', '풍암동', '금호동', '쌍촌동'],
    '북구': ['용봉동', '일곡동', '운암동', '두암동', '문흥동'],
    '광산구': ['수완동', '첨단동', '신창동', '월계동', '송정동']
  },
  '울산광역시': {
    '남구': ['삼산동', '달동', '신정동', '무거동', '옥동']
  },
  '세종특별자치시': {
    '세종시': ['나성동', '어진동', '아름동', '도담동', '보람동', '새롬동', '다정동']
  },
  '충청남도': {
    '천안시': ['불당동', '두정동', '신부동', '백석동', '쌍용동', '청수동'],
    '아산시': ['배방읍', '탕정면', '모종동', '용화동', '온천동']
  },
  '충청북도': {
    '청주시': ['가경동', '복대동', '오창읍', '오송읍', '율량동', '용암동']
  },
  '전북특별자치도': {
    '전주시': ['효자동', '송천동', '삼천동', '인후동', '서신동', '혁신도시']
  },
  '전라남도': {
    '순천시': ['조례동', '연향동', '신대지구', '중앙동'],
    '여수시': ['학동', '웅천동', '신기동', '문수동']
  },
  '경상북도': {
    '포항시': ['양덕동', '두호동', '이동', '장성동', '효자동'],
    '구미시': ['인동', '옥계동', '원평동', '송정동', '형곡동']
  },
  '경상남도': {
    '창원시': ['상남동', '용호동', '중앙동', '팔용동', '월영동'],
    '김해시': ['내외동', '삼계동', '율하동', '장유동', '부원동']
  },
  '강원특별자치도': {
    '원주시': ['무실동', '단구동', '단계동', '반곡동'],
    '춘천시': ['퇴계동', '석사동', '온의동', '후평동']
  },
  '제주특별자치도': {
    '제주시': ['노형동', '연동', '아라동', '이도동', '외도동'],
    '서귀포시': ['서홍동', '동홍동', '중문동', '강정동']
  }
};

function getAccessToken() {
  return new Promise((resolve, reject) => {
    const header = { alg: 'RS256', typ: 'JWT' };
    const now = Math.floor(Date.now() / 1000);
    const claimSet = {
      iss: FIREBASE_CLIENT_EMAIL,
      scope: 'https://www.googleapis.com/auth/datastore',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now
    };
    const encode = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    const signatureInput = encode(header) + '.' + encode(claimSet);
    const sign = crypto.createSign('RSA-SHA256');
    sign.update(signatureInput);
    const signatureBase64 = sign.sign(FIREBASE_PRIVATE_KEY, 'base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    const jwt = signatureInput + '.' + signatureBase64;
    const postData = 'grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=' + jwt;
    const req = https.request({
      hostname: 'oauth2.googleapis.com',
      port: 443,
      path: '/token',
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': postData.length }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data).access_token));
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

function searchKakao(queryText, page = 1) {
  return new Promise((resolve) => {
    const url = `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(queryText)}&page=${page}&size=15`;
    const req = https.request(url, {
      method: 'GET',
      headers: {
        'Authorization': `KakaoAK ${KAKAO_API_KEY}`
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json.documents || []);
        } catch (e) {
          resolve([]);
        }
      });
    });
    req.on('error', () => resolve([]));
    req.end();
  });
}

function convertToFirestoreFields(data) {
  const fields = {};
  for (const [key, value] of Object.entries(data)) {
    if (value === null || value === undefined) continue;
    if (typeof value === 'string') fields[key] = { stringValue: value };
    else if (typeof value === 'number') {
      if (Number.isInteger(value)) fields[key] = { integerValue: value.toString() };
      else fields[key] = { doubleValue: value };
    }
    else if (typeof value === 'boolean') fields[key] = { booleanValue: value };
    else if (Array.isArray(value)) {
      fields[key] = {
        arrayValue: {
          values: value.map(v => (typeof v === 'string' ? { stringValue: v } : { mapValue: { fields: convertToFirestoreFields(v) } }))
        }
      };
    }
    else if (typeof value === 'object') {
      fields[key] = { mapValue: { fields: convertToFirestoreFields(value) } };
    }
  }
  return fields;
}

function commitBatch(token, writes) {
  return new Promise((resolve, reject) => {
    if (!writes || writes.length === 0) return resolve({ writeResults: [] });
    const postData = JSON.stringify({ writes });
    const req = https.request({
      hostname: 'firestore.googleapis.com',
      port: 443,
      path: `/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents:commit`,
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve({});
        }
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log('🚀 [오걸즈] 전국 피트니스 & 필라테스 포털검색 전체 수집기 시작...');
  console.log('🔑 카카오 로컬 검색 API 키:', KAKAO_API_KEY.slice(0, 8) + '...');

  let authToken = await getAccessToken();
  let tokenExpiry = Date.now() + 3000 * 1000;

  // 모든 지역 리스트 평탄화
  const regionTasks = [];
  for (const [sido, sigunguObj] of Object.entries(KOREA_REGIONS)) {
    for (const [sigungu, dongs] of Object.entries(sigunguObj)) {
      for (const dong of dongs) {
        regionTasks.push({ sido, sigungu, dong });
      }
    }
  }

  console.log(`📍 총 대상 지역: ${regionTasks.length}개 동 (17개 시도, 60개 시군구)`);

  const collectedLeadsMap = new Map(); // kakaoId -> lead
  const phoneSet = new Set();
  const nameSet = new Set();

  let completedTasks = 0;

  for (const reg of regionTasks) {
    completedTasks++;
    const { sido, sigungu, dong } = reg;

    // 카테고리별 검색 (1: 피트니스, 2: 필라테스)
    const queries = [
      { q: `${sigungu} ${dong} 피트니스`, cat: 'fitness', catName: '피트니스' },
      { q: `${sigungu} ${dong} 필라테스`, cat: 'pilates', catName: '필라테스' }
    ];

    for (const item of queries) {
      // 1페이지 및 필요 시 2페이지 검색
      for (let p = 1; p <= 2; p++) {
        const docs = await searchKakao(item.q, p);
        if (!docs || docs.length === 0) break;

        for (const doc of docs) {
          const kakaoId = doc.id;
          const cleanPhone = (doc.phone || '').replace(/[^0-9]/g, '');
          const cleanName = (doc.place_name || '').replace(/\s+/g, '').toLowerCase();

          // 중복 스킵
          if (collectedLeadsMap.has(kakaoId)) continue;
          if (cleanPhone && phoneSet.has(cleanPhone)) continue;
          if (cleanName && nameSet.has(cleanName)) continue;

          if (cleanPhone) phoneSet.add(cleanPhone);
          if (cleanName) nameSet.add(cleanName);

          const isPilates = doc.place_name.includes('필라테스') || 
                            (doc.category_name && doc.category_name.includes('필라테스')) || 
                            item.cat === 'pilates';

          const lead = {
            id: `kakao_${kakaoId}`,
            name: doc.place_name,
            category: isPilates ? 'pilates' : 'fitness',
            categoryName: isPilates ? '필라테스' : '피트니스',
            rawCategory: doc.category_name || '',
            region: {
              sido,
              sigungu,
              dong
            },
            roadAddress: doc.road_address_name || '',
            address: doc.address_name || '',
            phone: doc.phone || '',
            placeUrl: doc.place_url || '',
            status: 'pending',
            memo: '',
            source: 'portal_search',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };

          collectedLeadsMap.set(kakaoId, lead);
        }

        if (docs.length < 15) break; // 마지막 페이지
      }

      await sleep(40); // 카카오 API 안전 딜레이
    }

    if (completedTasks % 30 === 0 || completedTasks === regionTasks.length) {
      console.log(`[진행률 ${completedTasks}/${regionTasks.length}] (${Math.round(completedTasks/regionTasks.length*100)}%) - 현재까지 고유 수집: ${collectedLeadsMap.size}개 업체`);
    }
  }

  const allLeads = Array.from(collectedLeadsMap.values());
  console.log(`\n🎉 [수집 완료] 전국 총 ${allLeads.length}개의 고유 피트니스/필라테스 업체를 성공적으로 확보했습니다!`);
  console.log(`💾 Firestore(sales_leads) 일괄 저장(Commit) 시작...`);

  // Firestore Batch Writes (최대 300개씩 커밋)
  const BATCH_SIZE = 300;
  let savedCount = 0;

  for (let i = 0; i < allLeads.length; i += BATCH_SIZE) {
    if (Date.now() > tokenExpiry) {
      authToken = await getAccessToken();
      tokenExpiry = Date.now() + 3000 * 1000;
    }

    const chunk = allLeads.slice(i, i + BATCH_SIZE);
    const writes = chunk.map(lead => ({
      update: {
        name: `projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/sales_leads/${lead.id}`,
        fields: convertToFirestoreFields(lead)
      }
    }));

    try {
      await commitBatch(authToken, writes);
      savedCount += chunk.length;
      console.log(`  저장 진행률: ${savedCount} / ${allLeads.length} 건 저장 완료...`);
    } catch (err) {
      console.error(`  배치 저장 에러 (${i}~${i + BATCH_SIZE}):`, err);
    }
  }

  console.log(`\n✨ [최종 완료] 총 ${savedCount}개 업체를 Firestore 영업리스트(sales_leads)에 완벽하게 등록했습니다!`);
}

main().catch(console.error);
