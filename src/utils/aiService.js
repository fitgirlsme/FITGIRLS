import { GoogleGenerativeAI } from '@google/generative-ai';

export async function generateEmbedding(text, apiKey) {
  const genAI = new GoogleGenerativeAI(apiKey);
  
  // According to Gemini docs, the model name is gemini-embedding-2 for newer accounts
  const model = genAI.getGenerativeModel({ model: "gemini-embedding-2" });
  
  const result = await model.embedContent(text);
  
  if (!result || !result.embedding || !result.embedding.values) {
    throw new Error('Empty response from Embedding API');
  }
  
  // Firestore Vector fields support a maximum of 2048 dimensions.
  // Gemini Embedding models return 3072 by default. We truncate it to 2048.
  return result.embedding.values.slice(0, 2048);
}

export async function generateAiTags(file, apiKey) {
  // 1. File 객체를 base64로 변환
  const base64Data = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

  const prompt = `Analyze this photo and generate SEO tags and relevant descriptions for a professional photoshoot gallery.
Return ONLY a valid JSON object in the exact format below, with no markdown formatting or backticks.
{
  "ko": ["바디프로필", "스튜디오", "태그1", "태그2"],
  "en": ["bodyprofile", "studio", "tag1", "tag2"],
  "ja": ["ボディプロフィール", "スタジオ", "tag1", "tag2"],
  "zh": ["身体档案", "工作室", "tag1", "tag2"]
}`;

  const result = await model.generateContent([
    prompt,
    {
      inlineData: {
        data: base64Data,
        mimeType: file.type || 'image/jpeg'
      }
    }
  ]);

  const responseText = result.response.text();
  let parsed = null;
  try {
    parsed = JSON.parse(responseText.replace(/```json/g, '').replace(/```/g, '').trim());
  } catch (e) {
    console.warn("AI Tag parsing failed, falling back to empty tags");
  }

  return parsed || { ko: [], en: [], ja: [], zh: [] };
}

export async function generateFaqAnswer(query, faqData, apiKey, language = 'ko') {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const faqText = faqData.map(item => `Q: ${item.question}\nA: ${item.answer}`).join('\n\n');

  let langInstruction = '한국어로 친절하고 전문적으로 답변해 주세요.';
  if (language === 'en') langInstruction = 'Please answer friendly and professionally in English.';
  else if (language === 'ja') langInstruction = '親切かつ丁寧に日本語で回答してください。';
  else if (language === 'zh') langInstruction = '请用中文亲切专业地回答。';

  const prompt = `You are a highly professional and friendly AI CS Assistant for "Fitgirls Studio (핏걸즈 스튜디오)".
Your job is to answer the user's question based strictly on the provided FAQ data.

Rules:
1. ${langInstruction}
2. Be conversational, polite, and helpful (e.g. use emojis like 😊, ✨).
3. If the answer is clearly found in the FAQ data, explain it well.
4. If the user's question cannot be answered using the FAQ data, politely apologize and advise them to contact the studio via KakaoTalk channel "핏걸즈". DO NOT make up information.

[FAQ Data]
${faqText}

User Question: ${query}`;

  try {
      const result = await model.generateContent(prompt);
      return result.response.text();
  } catch (error) {
      console.error("FAQ AI Error:", error);
      return null;
  }
}

export async function translateTextAi(texts, apiKey) {
  // texts is an object like { outfitName: '...', tag: '...' }
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

  const prompt = `Translate the following Korean text values into English, Japanese, and Chinese.
Return ONLY a valid JSON object without markdown formatting or backticks.
If a text is already in English, keep it as is for English, and translate to Japanese and Chinese.
Format requirement:
{
  "fieldKey": {
    "ko": "Original Korean Text",
    "en": "English Translation",
    "ja": "Japanese Translation",
    "zh": "Chinese Translation"
  }, ...
}

Texts to translate:
${JSON.stringify(texts, null, 2)}`;

  try {
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const parsed = JSON.parse(responseText.replace(/```json/g, '').replace(/```/g, '').trim());
    return parsed;
  } catch (error) {
    console.error("Translation AI Error:", error);
    return null;
  }
}
