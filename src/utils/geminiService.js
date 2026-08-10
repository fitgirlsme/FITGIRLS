import { GoogleGenerativeAI } from '@google/generative-ai';

// 환경 변수에서 API 키 로드
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

/**
 * 핏시아 AI 매니저 마케팅 콘텐츠 생성 헬퍼
 * @param {Object} modelData 모델 데이터 (name, phone, instagram 등)
 * @param {Array} projectTitles 모델이 참여한 프로젝트의 한글 명칭 목록
 */
export const generateMarketingContent = async (modelData, projectTitles = []) => {
  if (!API_KEY) {
    throw new Error('Gemini API Key가 VITE_GEMINI_API_KEY 환경변수에 누락되었습니다. .env 파일을 확인해주세요.');
  }

  try {
    const genAI = new GoogleGenerativeAI(API_KEY);
    
    // 가장 가볍고 속도가 빠른 1.5-flash 탑재
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: {
        responseMimeType: "application/json" // JSON 결과 엄격 규정
      }
    });

    const systemInstruction = `
      너는 패션 화보 브랜드 '핏걸즈(&이너핏)'의 AI 마케팅 매니저이자 직원인 '핏시아(Fitxia)'다.
      너는 핏걸즈의 직원으로서 고객 정보와 참여 이력을 기반으로 최적의 홍보 멘트를 생산해야 한다.
      자연스러운 핀터레스트 감성의 'FITORIAL(핏토리얼)' 촬영 정체성을 담아 마케팅 글을 작성해라.
      
      [인스타그램 규칙]:
      1. 과도한 이모티콘 사용은 격하게 금지한다 (최대 1~2개로 제한).
      2. 세련되고, 시크하며 감성적인 톤앤매너를 일관되게 유지해라.
      3. 해시태그는 정확하게 5개만 생성해서 맨 밑에 붙여라. 5개를 초과하거나 미달하면 안 된다.
      
      [블로그 규칙]:
      1. 촬영 비하인드 스토리와 브랜드의 가치를 녹인 깊이 있고 감동을 주는 긴 글을 작성해라.
      2. 화보의 무드와 모델의 매력을 부드럽고 차분한 문체로 묘사해라.
      
      [출력 규칙]:
      반드시 다음 구조의 JSON 객체 하나만 반환해야 하며, 마크다운 코드 블록 (\`\`\`json ...) 없이 순수 JSON 텍스트로만 반환해라.
      {
        "instagramCopy": "인스타용 홍보 문구 내용... #해시태그1 #해시태그2 #해시태그3 #해시태그4 #해시태그5",
        "blogPost": "네이버 블로그용 깊이 있는 비하인드 저널 콘텐츠..."
      }
    `;

    const prompt = `
      [모델 및 참여 정보]
      - 모델 이름: ${modelData.name}
      - 인스타그램 ID: ${modelData.instagram || '미등록'}
      - 최근 참여 프로젝트: ${projectTitles.join(', ') || '최근 참여 없음'}
      
      위 고객 정보를 토대로 우리 브랜드 핏걸즈를 돋보이게 만들 인스타그램 카피와 블로그 홍보 초안을 생성해줘.
    `;

    const result = await model.generateContent({
      contents: [
        { role: 'user', parts: [{ text: systemInstruction + '\n\n' + prompt }] }
      ]
    });

    const text = result.response.text();
    
    try {
      const parsedData = JSON.parse(text);
      return {
        success: true,
        instagramCopy: parsedData.instagramCopy || '',
        blogPost: parsedData.blogPost || ''
      };
    } catch (parseErr) {
      console.warn('JSON parsing failed, attempting text cleaning', text);
      // 백업 파싱 (JSON 마크다운 기호 제거 시도)
      const cleanJson = text.replace(/```json|```/g, '').trim();
      const parsedData = JSON.parse(cleanJson);
      return {
        success: true,
        instagramCopy: parsedData.instagramCopy || '',
        blogPost: parsedData.blogPost || ''
      };
    }

  } catch (error) {
    console.error('[FITXIA] AI Generation Failed:', error);
    throw new Error(error.message || '핏시아 AI 호출 중 장애가 발생했습니다.');
  }
};
