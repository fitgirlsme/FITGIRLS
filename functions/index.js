const { onRequest } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const { initializeApp, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const fetch = require('node-fetch');
const cors = require('cors')({ origin: true });

const serviceAccount = require('./google-credentials.json');

initializeApp({
  credential: cert(serviceAccount)
});

// 환경변수 (Firebase Functions Secret Manager 또는 Functions Config로 설정해야 하지만, 일단 하드코딩 또는 process.env 사용)
// TODO: Functions 배포 시 이 값들을 secret으로 주입하거나 하드코딩
const ALIGO_API_KEY = process.env.ALIGO_API_KEY || '6185ut1g3f7ni1xcbyfwcmv8urbtxa2c';
const ALIGO_USER_ID = process.env.ALIGO_USER_ID || 'inafit';
const ALIGO_SENDER_KEY = process.env.ALIGO_SENDER_KEY || 'd478985a72f92efafd38018b136c4e82de3f024e';
const ALIGO_SENDER = process.env.ALIGO_SENDER || '01046961434';
const API_BASE = 'https://kakaoapi.aligo.in/akv10/alimtalk/send/';

exports.sendAlimtalk = onRequest((req, res) => {
    cors(req, res, async () => {
        if (req.method !== 'POST') {
            return res.status(405).send({ error: 'Method not allowed' });
        }

        // 인증 체크 (클라이언트 측에서 호출하더라도, 인증된 사용자만 호출 가능하게 하거나 특정 조건 필요)
        // 현재는 서비스 로직상 알림톡은 관리자(Admin) 또는 폼 제출 시 누구나 발송 가능. 
        // 폼 제출 시 익명으로도 발송되므로 열어두되, 악용 방지를 위해 CORS origin 등 검증 필요
        // cors({origin: true}) 가 처리함.

        const { receiver, templateCode, message, options = {} } = req.body;

        if (!receiver || !templateCode || !message) {
            return res.status(400).send({ error: 'Missing required parameters' });
        }

        const formData = new URLSearchParams();
        formData.append('apikey', ALIGO_API_KEY);
        formData.append('userid', ALIGO_USER_ID);
        formData.append('senderkey', ALIGO_SENDER_KEY);
        formData.append('tpl_code', templateCode);
        formData.append('sender', ALIGO_SENDER);
        formData.append('receiver_1', receiver.replace(/-/g, ''));
        formData.append('subject_1', '[FITGIRLS] 알림');
        formData.append('message_1', message);

        if (options.title) formData.append('emtitle_1', options.title);
        if (options.subtitle) formData.append('emsubtitle_1', options.subtitle);
        if (options.button) formData.append('button_1', JSON.stringify(options.button));

        try {
            const response = await fetch(API_BASE, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: formData,
            });

            const data = await response.json();
            
            if (data.code === 0 || data.result_code === '0') {
                return res.status(200).send({ success: true, data });
            } else {
                logger.error('Aligo API Error', data);
                return res.status(500).send({ success: false, error: data.message || data.result_msg });
            }
        } catch (error) {
            logger.error('ALIGO_SEND_ERROR', error);
            return res.status(500).send({ success: false, error: 'Internal Server Error' });
        }
    });
});

// 어드민 로그인용 엔드포인트
exports.adminLogin = onRequest((req, res) => {
    cors(req, res, async () => {
        if (req.method !== 'POST') {
            return res.status(405).send({ error: 'Method not allowed' });
        }

        const { password } = req.body;

        // 실제로는 훨씬 강력한 비밀번호를 사용해야 함
        const ADMIN_PASSWORD = 'admin123';

        if (password === ADMIN_PASSWORD) {
            try {
                // 커스텀 토큰 생성 (uid는 'admin'으로 고정)
                const customToken = await getAuth().createCustomToken('admin', { admin: true });
                return res.status(200).send({ success: true, token: customToken });
            } catch (error) {
                logger.error("Error creating custom token:", error);
                return res.status(500).send({ success: false, error: 'Error creating token' });
            }
        } else {
            return res.status(401).send({ success: false, error: 'Invalid password' });
        }
    });
});
