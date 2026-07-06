import fs from 'fs';

const API_BASE = 'https://kakaoapi.aligo.in/akv10/history/list/';

async function getRecentHistory() {
    const formData = new URLSearchParams();
    formData.append('apikey', '6185ut1g3f7ni1xcbyfwcmv8urbtxa2c');
    formData.append('userid', 'inafit');
    formData.append('page', '1');
    formData.append('limit', '50'); // Fetch 50 items from the very first page (newest first)

    const response = await fetch(API_BASE, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData,
    });

    const data = await response.json();
    console.log("Recent History Page 1 (Newest First):");
    const items = data.list || [];
    items.slice(0, 10).forEach((item, idx) => {
        console.log(`\n[${idx + 1}] mid: ${item.mid}, regdate: ${item.regdate}, state: ${item.reserve_state}, sender: ${item.sender}`);
        console.log(`mbody:\n${item.mbody}`);
    });
}

getRecentHistory().catch(console.error);
