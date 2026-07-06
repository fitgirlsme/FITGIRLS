import fs from 'fs';

const API_BASE = 'https://kakaoapi.aligo.in/akv10/template/list/';

async function getTemplateInfo() {
    const formData = new URLSearchParams();
    formData.append('apikey', '6185ut1g3f7ni1xcbyfwcmv8urbtxa2c');
    formData.append('userid', 'inafit');
    formData.append('senderkey', 'd478985a72f92efafd38018b136c4e82de3f024e');
    formData.append('tpl_code', 'UH_5901');

    const response = await fetch(API_BASE, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData,
    });

    const data = await response.json();
    const content = data.list[0].templtContent;
    
    console.log("templtContent length:", content.length);
    console.log("Contains \\n:", content.includes('\n'));
    console.log("Contains \\r:", content.includes('\r'));
    console.log("JSON stringified content:");
    console.log(JSON.stringify(content));
}

getTemplateInfo().catch(console.error);
