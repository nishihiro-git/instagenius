import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

export interface GenerateCaptionParams {
  type: "feed" | "reel";
  topic?: string;
  tone?: "casual" | "professional" | "funny" | "inspirational";
  hashtags?: boolean;
  language?: "ja" | "en";
  length?: "short" | "normal" | "long";
}

export const generateCaption = async (params: GenerateCaptionParams): Promise<string> => {
  const { type, topic, tone = "casual", hashtags = true, language = "ja", length = "normal" } = params;

  let lengthInstruction = "";
  let maxTokens = 500;
  if (length === "short") {
    lengthInstruction = "短く（50文字程度）";
    maxTokens = 100;
  } else if (length === "long") {
    lengthInstruction = "長めに（200文字以上）";
    maxTokens = 800;
  } else {
    lengthInstruction = "普通の長さ（100文字程度）";
    maxTokens = 300;
  }

  const prompt = `
以下の条件でInstagramの${type === "feed" ? "投稿" : "リール"}用のキャプションを生成してください：

- 投稿タイプ: ${type === "feed" ? "フィード投稿" : "リール"}
- トピック: ${topic || "一般的なライフスタイル"}
- トーン: ${
    tone === "casual"
      ? "カジュアル"
      : tone === "professional"
      ? "プロフェッショナル"
      : tone === "funny"
      ? "面白い"
      : "インスピレーショナル"
  }
- ハッシュタグ: ${hashtags ? "含める" : "含めない"}
- 言語: ${language === "ja" ? "日本語" : "英語"}
- 文字量: ${lengthInstruction}

${
  type === "reel"
    ? "リールは短く、インパクトのある内容にしてください。"
    : "フィード投稿は詳細で魅力的な内容にしてください。"
}

キャプションのみを返してください。説明文は不要です。
`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content:
            "あなたはInstagramの投稿キャプション作成の専門家です。魅力的でエンゲージメントを高めるキャプションを作成してください。",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: maxTokens,
      temperature: 0.7,
    });

    return completion.choices[0]?.message?.content || "キャプションの生成に失敗しました。";
  } catch (error) {
    console.error("OpenAI API Error:", error);
    throw new Error("キャプションの生成中にエラーが発生しました。");
  }
};

export const generateHashtags = async (caption: string, count: number = 10): Promise<string[]> => {
  const prompt = `
以下のキャプションに適したInstagramハッシュタグを${count}個生成してください：

キャプション: ${caption}

ハッシュタグのみを配列形式で返してください。説明文は不要です。
例: ["#hashtag1", "#hashtag2", "#hashtag3"]
`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content:
            "あなたはInstagramハッシュタグの専門家です。エンゲージメントを高める効果的なハッシュタグを提案してください。",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: 200,
      temperature: 0.5,
    });

    const content = completion.choices[0]?.message?.content || "";
    // JSON配列として解析を試みる
    try {
      const hashtags = JSON.parse(content);
      return Array.isArray(hashtags) ? hashtags : [];
    } catch {
      // JSON解析に失敗した場合、テキストからハッシュタグを抽出
      const hashtagRegex = /#[\w\u3040-\u309F\u30A0-\u30FF]+/g;
      return content.match(hashtagRegex) || [];
    }
  } catch (error) {
    console.error("OpenAI API Error:", error);
    throw new Error("ハッシュタグの生成中にエラーが発生しました。");
  }
};

export async function extractBrandColorsFromImage(base64Image: string): Promise<string[]> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4-vision-preview",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "この画像から主要なブランドカラーを3~5色、HEXカラーコードで抽出し、配列で返してください。",
            },
            { type: "image_url", image_url: { url: `data:image/png;base64,${base64Image}` } },
          ],
        },
      ],
      max_tokens: 300,
    }),
  });
  const data = await response.json();
  // レスポンスからHEXカラー配列を抽出
  // 例: ["#123456", "#abcdef", ...]
  const match = data.choices?.[0]?.message?.content.match(/#(?:[0-9a-fA-F]{3}){1,2}/g);
  return match || [];
}

// DALL·E 画像生成: プロンプトのみ
export const generateImageByPrompt = async (prompt: string): Promise<string> => {
  try {
    const response = await openai.images.generate({
      prompt,
      n: 1,
      size: "1024x1024",
      response_format: "b64_json",
    });
    if (!response.data || !response.data[0]?.b64_json) throw new Error("画像生成に失敗しました");
    return `data:image/png;base64,${response.data[0].b64_json}`;
  } catch (error) {
    console.error("OpenAI Image API Error:", error);
    throw new Error("画像生成中にエラーが発生しました。");
  }
};

// DALL·E 画像編集: アップロード画像＋プロンプト
export const editImageWithPrompt = async (base64Image: string, prompt: string): Promise<string> => {
  try {
    // base64→Blob変換
    const byteString = atob(base64Image.split(",")[1]);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
    const blob = new Blob([ab], { type: "image/png" });

    // OpenAI APIへリクエスト
    const formData = new FormData();
    formData.append("image", blob, "image.png");
    formData.append("prompt", prompt);
    formData.append("n", "1");
    formData.append("size", "1024x1024");
    formData.append("response_format", "b64_json");

    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    const response = await fetch("https://api.openai.com/v1/images/edits", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: formData,
    });
    const data = await response.json();
    if (!data.data || !data.data[0]?.b64_json) throw new Error("画像編集に失敗しました");
    return `data:image/png;base64,${data.data[0].b64_json}`;
  } catch (error) {
    console.error("OpenAI Image Edit API Error:", error);
    throw new Error("画像編集中にエラーが発生しました。");
  }
};
