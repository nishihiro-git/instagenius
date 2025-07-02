import { generateCaption } from "./openaiService";

export interface TrendAnalysis {
  trendingTopics: string[];
  popularHashtags: string[];
  bestPostingTimes: { hour: number; engagement: number }[];
  contentTypes: { type: string; popularity: number }[];
  captionStyles: { style: string; effectiveness: number }[];
  visualElements: { element: string; impact: number }[];
}

export interface ViralPostPattern {
  topic: string;
  hashtags: string[];
  captionStyle: string;
  visualStyle: string;
  postingTime: number;
  engagementRate: number;
  viralityScore: number;
}

export interface TrendInsights {
  currentTrends: string[];
  trendingHashtags: string[];
  optimalPostingSchedule: { day: string; hour: number; engagement: number }[];
  contentRecommendations: string[];
  captionTemplates: string[];
}

class TrendAnalysisService {
  private trendData: TrendAnalysis = {
    trendingTopics: [
      "サステナブルライフ",
      "ミニマリズム",
      "プラントベース",
      "リモートワーク",
      "メンタルヘルス",
      "フィンテック",
      "クリプト",
      "AI・テクノロジー",
      "ウェルネス",
      "エシカルファッション",
    ],
    popularHashtags: [
      "#サステナブル",
      "#ミニマル",
      "#プラントベース",
      "#リモートワーク",
      "#メンタルヘルス",
      "#フィンテック",
      "#クリプト",
      "#AI",
      "#ウェルネス",
      "#エシカル",
    ],
    bestPostingTimes: [
      { hour: 9, engagement: 8.5 },
      { hour: 12, engagement: 7.2 },
      { hour: 18, engagement: 9.1 },
      { hour: 20, engagement: 8.8 },
      { hour: 21, engagement: 7.9 },
    ],
    contentTypes: [
      { type: "教育・ハウツー", popularity: 9.2 },
      { type: "インスピレーション", popularity: 8.7 },
      { type: "ユーモア・エンターテイメント", popularity: 8.5 },
      { type: "ライフスタイル", popularity: 8.3 },
      { type: "プロダクト紹介", popularity: 7.8 },
    ],
    captionStyles: [
      { style: "質問形式", effectiveness: 9.1 },
      { style: "ストーリーテリング", effectiveness: 8.9 },
      { style: "ハウツー・チュートリアル", effectiveness: 8.7 },
      { style: "インスピレーション", effectiveness: 8.5 },
      { style: "ユーモア・ジョーク", effectiveness: 8.3 },
    ],
    visualElements: [
      { element: "鮮やかな色彩", impact: 8.8 },
      { element: "ミニマルデザイン", impact: 8.6 },
      { element: "自然・アウトドア", impact: 8.4 },
      { element: "都市・アーキテクチャ", impact: 8.2 },
      { element: "抽象・アート", impact: 8.0 },
    ],
  };

  // 現在のトレンドを分析
  async analyzeCurrentTrends(): Promise<TrendInsights> {
    // 実際のAPIでは、Instagram APIや外部トレンドAPIを使用
    const currentTrends = this.trendData.trendingTopics.slice(0, 5);
    const trendingHashtags = this.trendData.popularHashtags.slice(0, 10);

    const optimalPostingSchedule = this.trendData.bestPostingTimes
      .sort((a, b) => b.engagement - a.engagement)
      .map((time) => ({
        day: "平日",
        hour: time.hour,
        engagement: time.engagement,
      }));

    const contentRecommendations = this.trendData.contentTypes
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, 3)
      .map((type) => type.type);

    const captionTemplates = [
      "今日の気づき：{topic}について考えてみました。あなたはどう思いますか？",
      "{topic}の魅力を発見！これからもっと詳しく調べてみようと思います。",
      "毎日の小さな変化が大きな違いを生む。{topic}で始める新しい習慣。",
      "知ってましたか？{topic}についての意外な事実。",
      "今日は{topic}について話したいと思います。あなたの経験は？",
    ];

    return {
      currentTrends,
      trendingHashtags,
      optimalPostingSchedule,
      contentRecommendations,
      captionTemplates,
    };
  }

  // バズ投稿のパターンを分析
  async analyzeViralPatterns(): Promise<ViralPostPattern[]> {
    const patterns: ViralPostPattern[] = [
      {
        topic: "サステナブルライフ",
        hashtags: ["#サステナブル", "#エコ", "#ゼロウェイスト", "#環境保護"],
        captionStyle: "質問形式",
        visualStyle: "自然・アウトドア",
        postingTime: 18,
        engagementRate: 9.2,
        viralityScore: 8.8,
      },
      {
        topic: "ミニマリズム",
        hashtags: ["#ミニマル", "#シンプルライフ", "#断捨離", "#整理整頓"],
        captionStyle: "インスピレーション",
        visualStyle: "ミニマルデザイン",
        postingTime: 9,
        engagementRate: 8.7,
        viralityScore: 8.5,
      },
      {
        topic: "メンタルヘルス",
        hashtags: ["#メンタルヘルス", "#セルフケア", "#マインドフルネス", "#癒し"],
        captionStyle: "ストーリーテリング",
        visualStyle: "自然・アウトドア",
        postingTime: 20,
        engagementRate: 8.9,
        viralityScore: 8.6,
      },
    ];

    return patterns.sort((a, b) => b.viralityScore - a.viralityScore);
  }

  // トレンドに基づいた投稿内容を生成
  async generateTrendBasedContent(topic?: string): Promise<{
    caption: string;
    hashtags: string[];
    visualStyle: string;
    postingTime: number;
  }> {
    const insights = await this.analyzeCurrentTrends();
    const patterns = await this.analyzeViralPatterns();

    // トピックが指定されていない場合、トレンドから選択
    const selectedTopic = topic || insights.currentTrends[Math.floor(Math.random() * insights.currentTrends.length)];

    // 最適なパターンを選択
    const bestPattern = patterns.find((p) => p.topic === selectedTopic) || patterns[0];

    // キャプションを生成
    const caption = await generateCaption({
      type: "feed",
      topic: selectedTopic,
      tone: "casual",
      hashtags: false,
      language: "ja",
    });

    // ハッシュタグを生成
    const hashtags = [...bestPattern.hashtags, ...insights.trendingHashtags.slice(0, 5)].slice(0, 10);

    return {
      caption: caption + "\n\n" + hashtags.join(" "),
      hashtags,
      visualStyle: bestPattern.visualStyle,
      postingTime: bestPattern.postingTime,
    };
  }

  // 競合分析
  async analyzeCompetitors(_: string[]): Promise<{
    topPosts: any[];
    commonPatterns: string[];
    engagementInsights: any;
  }> {
    // 実際の実装では、Instagram APIを使用して競合アカウントを分析
    return {
      topPosts: [],
      commonPatterns: ["質問形式のキャプション", "ストーリーテリング", "ユーザー参加型"],
      engagementInsights: {
        averageEngagement: 8.5,
        bestPostingTimes: [9, 18, 20],
        topHashtags: ["#トレンド", "#バズ", "#人気"],
      },
    };
  }

  // トレンド予測
  async predictTrends(): Promise<{
    upcomingTrends: string[];
    seasonalTrends: string[];
    nicheTrends: string[];
  }> {
    return {
      upcomingTrends: [
        "AI活用ライフハック",
        "デジタルデトックス",
        "サーキュラーエコノミー",
        "メタバースライフスタイル",
      ],
      seasonalTrends: ["春の新生活", "夏のアウトドア", "秋の読書", "冬のホームケア"],
      nicheTrends: ["クリプトアート", "NFTコレクション", "Web3ライフスタイル", "ブロックチェーン活用"],
    };
  }

  // パフォーマンス予測
  async predictPerformance(content: {
    topic: string;
    hashtags: string[];
    captionStyle: string;
    postingTime: number;
  }): Promise<{
    predictedEngagement: number;
    viralityScore: number;
    reachEstimate: number;
    recommendations: string[];
  }> {
    const patterns = await this.analyzeViralPatterns();
    const matchingPattern = patterns.find((p) => p.topic === content.topic);

    let predictedEngagement = 6.0; // ベースライン
    let viralityScore = 5.0;

    if (matchingPattern) {
      predictedEngagement = matchingPattern.engagementRate;
      viralityScore = matchingPattern.viralityScore;
    }

    // ハッシュタグ効果を加算
    const hashtagBonus = Math.min(content.hashtags.length * 0.2, 2.0);
    predictedEngagement += hashtagBonus;

    // 投稿時間効果を加算
    const timeBonus = this.trendData.bestPostingTimes.find((t) => t.hour === content.postingTime)?.engagement || 0;
    predictedEngagement = Math.max(predictedEngagement, timeBonus * 0.8);

    const reachEstimate = Math.floor(predictedEngagement * 1000);

    const recommendations = [
      "トレンドハッシュタグを追加",
      "質問形式のキャプションを使用",
      "最適な投稿時間を選択",
      "視覚的に魅力的な画像を使用",
    ];

    return {
      predictedEngagement,
      viralityScore,
      reachEstimate,
      recommendations,
    };
  }
}

// シングルトンインスタンス
let trendAnalysisService: TrendAnalysisService | null = null;

export const getTrendAnalysisService = (): TrendAnalysisService => {
  if (!trendAnalysisService) {
    trendAnalysisService = new TrendAnalysisService();
  }
  return trendAnalysisService;
};
