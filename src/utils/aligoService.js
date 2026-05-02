/**
 * Aligo Alimtalk Service for FITGIRLS & INAFIT
 * Handles Kakao Notification Talk via Aligo API.
 */

const API_BASE = 'https://kakaoapi.aligo.in/akv10/alimtalk/send/';

/**
 * Sends an Alimtalk to a specific receiver using a pre-approved template.
 * @param {string} receiver - The phone number (e.g., 01012345678)
 * @param {string} templateCode - The template code from Aligo (e.g., UH_5021)
 * @param {string} message - The message content (must match template exactly with variables)
 * @param {Object} options - Additional options like buttons
 */
export const sendAlimtalk = async (receiver, templateCode, message, options = {}) => {
    const {
        VITE_ALIGO_API_KEY: apikey,
        VITE_ALIGO_USER_ID: userid,
        VITE_ALIGO_SENDER_KEY: senderkey,
        VITE_ALIGO_SENDER: sender
    } = import.meta.env;

    if (!apikey || !userid || !senderkey) {
        throw new Error('Aligo configuration is missing in .env');
    }

    const formData = new URLSearchParams();
    formData.append('apikey', apikey);
    formData.append('userid', userid);
    formData.append('senderkey', senderkey);
    formData.append('tpl_code', templateCode);
    formData.append('sender', sender);
    formData.append('receiver_1', receiver.replace(/-/g, ''));
    formData.append('subject_1', '[FITGIRLS] 알림');
    formData.append('message_1', message);

    // Emphasis Type (강조표기형) parameters
    if (options.title) formData.append('emtitle_1', options.title);
    // Subtitle is handled automatically by Aligo based on the template registration

    if (options.button) {
        formData.append('button_1', JSON.stringify(options.button));
    }


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
            return { success: true, data };
        } else {
            return { success: false, error: data.message || data.result_msg };
        }
    } catch (error) {
        console.error('ALIGO_SEND_ERROR:', error);
        return { success: false, error: 'Network error or CORS issue. Please check API server settings.' };
    }
};

/**
 * Template Helper: Generates message and options for specific templates
 */
export const getAlimtalkTemplate = (type, params) => {
    const { name, phone, projectTitle, link, feedback, date } = params;
    const cleanPhone = phone ? phone.replace(/[^0-9]/g, '') : '';
    const phoneLast4 = cleanPhone ? cleanPhone.slice(-4) : '0000';
    
    switch (type) {
        case 'UH_5024': // 촬영완료
            return {
                code: 'UH_5024',
                title: '촬영완료',
                subtitle: '',
                message: `안녕하세요, ${name}님!\n오늘 촬영하시느라 너무나도 고생 많으셨습니다. 😊\n원활한 보정 작업을 위해 아래 내용을 확인해 주세요!\n1. 메일에서 [원본파일]을 꼭 다운로드해 주세요.\n2. 이쁜 사진들을 골라 inafit@daum.net으로 답장 메일을 보내주시면 보정 작업이 시작됩니다. ✨\n■ 보정 현황 확인: https://fitgirls.me/retouch\n■ 로그인 ID:\n${cleanPhone} (전화번호)\n■ 초기 PW:\n${phoneLast4} (전화번호 뒤 4자리)\n🎁 [리뷰 이벤트]\n네이버 또는 구글 리뷰를 작성해 주시면 '서비스 보정 1장'을 추가로 해드립니다! 많은 참여 부탁드려요. 🙏\n멋진 사진으로 보답하겠습니다. 감사합니다!`,
                button: {
                    button: [{
                        name: '보정 현황 보기',
                        linkType: 'WL',
                        linkMo: 'https://fitgirls.me/retouch',
                        linkPc: 'https://fitgirls.me/retouch'
                    }]
                }
            };
            
        case 'UH_5021': // 보정본 확인 요청
            return {
                code: 'UH_5021',
                title: '보정본 확인 요청',
                subtitle: '피드백요청',
                message: `안녕하세요, ${name}님!\n기다려주신 1차보정이 완료되었습니다. 😊\n\n아래 링크의 대시보드에서 보정본을 확인하신 후, [컨펌완료] 또는 [추가수정요청]을 진행해 주세요.\n\n로그인 아이디: \n${cleanPhone} (전화번호)\n비밀번호: \n${phoneLast4} (전화번호 뒤 4자리)\n\n감사합니다.\n멋진 사진으로 보답하겠습니다! ✨`,
                button: {
                    button: [
                        {
                            name: '채널추가',
                            linkType: 'AC'
                        },
                        {
                            name: '사진확인하기',
                            linkType: 'WL',
                            linkMo: 'https://fitgirls.me/retouch',
                            linkPc: 'https://fitgirls.me/retouch'
                        }
                    ]
                }
            };

        case 'UH_5022': // 고객 수정 요청 알림 (Admin 알림용)
            return {
                code: 'UH_5022',
                title: '',
                subtitle: '',
                message: `[보정 수정 요청 알림]\n${name} 고객님께서 추가 수정 요청을 등록하셨습니다.\n내용 확인 후 2차 수정을 진행해 주세요!\n■ 프로젝트: ${projectTitle}\n■ 수정요청내용: ${feedback || '대시보드 확인'}\n대시보드 관리자 페이지에서 상세 내용을 확인하세요.`,
                button: null
            };

        case 'UH_5023': // 고객_보정_컨펌완료 (Admin 알림용)
            return {
                code: 'UH_5023',
                title: '',
                subtitle: '',
                message: `[보정 컨펌 완료 알림]\n${name} 고객님께서 보정본 컨펌을 완료하셨습니다.\n최종본 제작 및 배포 작업을 시작해 주세요!\n■ 프로젝트: ${projectTitle}\n■ 고객성함: ${name}\n■ 확인일시: ${date || new Date().toLocaleString('ko-KR')}\n대시보드에서 상세 내용을 확인하세요.`,
                button: null
            };

        case 'UH_5403': // 최종보정완료_안내 (고객용)
            return {
                code: 'UH_5403',
                title: '최종보정완료',
                subtitle: '멋진 사진이 완성되었습니다! ✨',
                message: `안녕하세요, ${name}님!\n요청하신 최종 보정본이 완성되었습니다. 😊\n보정본과 함께 멋진 매거진 커버를 같이 보내드렸습니다.\n\n아래 링크의 대시보드에서 최종본을 확인하고 고화질로 다운로드하실 수 있습니다.\n(파일 보관 기한이 있으니 가급적 빨리 저장해 주세요!)\n\n그동안 핏걸즈 & 이너핏을\n믿고 기다려 주셔서 감사합니다.\n완성된 사진이 고객님께 소중한 추억이 \n되길 바랍니다.\n\n더욱 멋진 컨셉과 모습으로 다음 촬영에서도 또 뵙기를 기대하겠습니다! ✨\n\n감사합니다.`,
                button: {
                    button: [
                        {
                            name: '최종보정다운로드받기',
                            linkType: 'WL',
                            linkMo: 'https://fitgirls.me/retouch',
                            linkPc: 'https://fitgirls.me/retouch'
                        }
                    ]
                }
            };

        case 'UH_5710': // 선보정완료_안내 (고객용)
            return {
                code: 'UH_5710',
                title: '선보정완료',
                subtitle: '요청하신 선보정본 전송 안내',
                message: `안녕하세요, ${name}님!\n요청하신 촬영본 중 [선보정본]이 먼저 완성되어 전송되었습니다. 😊\n지금 바로 아래 대시보드에서 선보정본을 확인하실 수 있습니다.\n남은 사진들도 정성껏 작업하여 빠르게 전달드리겠습니다! ✨\n■ 보정 현황 확인:\nhttps://fitgirls.me/retouch\n감사합니다.`,
                button: {
                    button: [
                        {
                            name: '선보정사진다운로드',
                            linkType: 'WL',
                            linkMo: 'https://fitgirls.me/retouch',
                            linkPc: 'https://fitgirls.me/retouch'
                        }
                    ]
                }
            };

        case 'UH_5901': // 쿠폰발급_안내 (고객용)
            return {
                code: 'UH_5901',
                title: '이벤트당첨안내',
                subtitle: '핏걸즈&이너핏 이벤트 당첨안내',
                message: `안녕하세요, ${name}님!\n핏걸즈 이벤트 쿠폰 발급이 완료되었습니다. 축하드립니다! ✨\n지정된 기한 내에 촬영 예약 시 [${params.discount || '50%'}] 할인이 적용됩니다.\n■ 발급 코드: ${params.issuedCode}\n예약 상담이나 궁금하신 점은 지금 보고 계신 이 채팅창에 바로 메시지를 남겨주세요! 😊\n담당 작가가 확인 후 친절히 안내해 드리겠습니다.\n고객님의 아름다운 순간을 위해 정성을 다하겠습니다. 감사합니다!`,
                button: null
            };

        default:
            return null;
    }
};
