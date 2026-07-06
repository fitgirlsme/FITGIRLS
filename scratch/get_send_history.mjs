import fs from 'fs';

const API_BASE = 'https://kakaoapi.aligo.in/akv10/history/detail/';

async function checkStatus(mid, label) {
    const formData = new URLSearchParams();
    formData.append('apikey', '6185ut1g3f7ni1xcbyfwcmv8urbtxa2c');
    formData.append('userid', 'inafit');
    formData.append('mid', mid);

    const response = await fetch(API_BASE, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData,
    });

    const data = await response.json();
    console.log(`\n-------------------------------------`);
    console.log(`Result for ${label} (mid: ${mid}):`);
    console.log(JSON.stringify(data, null, 2));
}

async function runCheck() {
    // We will check both mid numbers
    await checkStatus('1357503814', 'TEST 1 (순수 본문만 전송)');
    await checkStatus('1357503816', 'TEST 2 (본문 + 부가정보\\n\\n + 광고\\n 결합 전송)');
}

runCheck().catch(console.error);
