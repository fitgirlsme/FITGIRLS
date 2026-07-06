import fs from 'fs';

const API_BASE = 'https://kakaoapi.aligo.in/akv10/alimtalk/send/';

async function sendTest(testCaseName, messageContent) {
    const name = '신철민';
    const discountDisplay = '50%'; // Raw value with %
    const issuedCode = 'TESTCODE1234';
    const receiver = '01046961441';

    const today = new Date();
    const issueDateStr = `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, '0')}.${String(today.getDate()).padStart(2, '0')}`;
    const expire = new Date(today);
    expire.setMonth(expire.getMonth() + 6);
    const expireDateStr = `${expire.getFullYear()}.${String(expire.getMonth() + 1).padStart(2, '0')}.${String(expire.getDate()).padStart(2, '0')}`;

    // Replace template variables
    let finalMessage = messageContent
        .replace('${name}', name)
        .replace('${discountDisplay}', discountDisplay)
        .replace('${params.issuedCode || \'\'}', issuedCode)
        .replace('${issueDateStr}', issueDateStr)
        .replace('${expireDateStr}', expireDateStr);

    const formData = new URLSearchParams();
    formData.append('apikey', '6185ut1g3f7ni1xcbyfwcmv8urbtxa2c');
    formData.append('userid', 'inafit');
    formData.append('senderkey', 'd478985a72f92efafd38018b136c4e82de3f024e');
    formData.append('tpl_code', 'UH_5901');
    formData.append('sender', '01046961434');
    formData.append('receiver_1', receiver);
    formData.append('subject_1', '[FITGIRLS] 알림');
    formData.append('message_1', finalMessage);
    formData.append('emtitle_1', '이벤트당첨');
    formData.append('emsubtitle_1', '핏걸즈&이너핏 이벤트 당첨안내');
    formData.append('button_1', JSON.stringify({
        button: [{
            name: '채널추가',
            linkType: 'AC'
        }]
    }));

    console.log(`\n============================`);
    console.log(`Running Test: ${testCaseName}`);
    console.log(`Sending message:\n${finalMessage}`);

    const response = await fetch(API_BASE, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData,
    });

    const data = await response.json();
    console.log("Aligo API Response:", data);
}

async function runAllTests() {
    const rawContent = `안녕하세요, \${name}님! 핏걸즈 이벤트 쿠폰 발급이 완료되었습니다. 축하드립니다! ✨ 지정된 기한 내에 촬영 예약 시 [\${discountDisplay}] 할인이 적용됩니다. ■ 발급 코드: \${params.issuedCode || ''} ■ 발급 일자: \${issueDateStr} ■ 유효 기간: \${expireDateStr} (발급일로부터 6개월) 예약 상담이나 궁금하신 점은 지금 보고 계신 이 채팅창에 바로 메시지를 남겨주세요! 😊 담당 작가가 확인 후 친절히 안내해 드리겠습니다. 고객님의 아름다운 순간을 위해 정성을 다하겠습니다. 감사합니다!`;

    // Test Case 1: 순수 본문만 발송 (No Extra/Advert)
    await sendTest("TEST 1: 순수 본문만 전송", rawContent);

    // Test Case 2: 본문 + \n\n※ 이 메시지는... + \n채널 추가하고... (2단 개행 결합)
    const combinedContent = `${rawContent}\n\n※ 이 메시지는 고객님이 참여한 이벤트 당첨으로 지급된 쿠폰 안내 메시지입니다.\n채널 추가하고 이 채널의 광고와 마케팅 메시지를 카카오톡으로 받기`;
    await sendTest("TEST 2: 본문 + 부가정보(\\n\\n) + 광고(\\n) 결합 전송", combinedContent);
}

runAllTests().catch(console.error);
