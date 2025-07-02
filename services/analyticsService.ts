import { Post, PostStatus } from "../types";

export interface PostAnalytics {
  postId: string;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  reach: number;
  impressions: number;
  engagementRate: number;
  postedAt: Date;
  analyzedAt: Date;
}

export interface AnalyticsSummary {
  totalPosts: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  totalReach: number;
  averageEngagementRate: number;
  bestPerformingPost: PostAnalytics | null;
  worstPerformingPost: PostAnalytics | null;
  topHashtags: { hashtag: string; count: number; avgEngagement: number }[];
  bestPostingTimes: { hour: number; avgEngagement: number }[];
}

export interface HashtagAnalysis {
  hashtag: string;
  usageCount: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  averageEngagementRate: number;
  bestPost: PostAnalytics | null;
}

class AnalyticsService {
  private analytics: Map<string, PostAnalytics> = new Map();

  // 投稿分析データを追加・更新
  async updatePostAnalytics(postId: string, analytics: Partial<PostAnalytics>): Promise<void> {
    const existing = this.analytics.get(postId);
    const updated: PostAnalytics = {
      postId,
      likes: 0,
      comments: 0,
      shares: 0,
      saves: 0,
      reach: 0,
      impressions: 0,
      engagementRate: 0,
      postedAt: new Date(),
      analyzedAt: new Date(),
      ...existing,
      ...analytics,
    };

    // エンゲージメント率を計算
    if (updated.reach > 0) {
      updated.engagementRate = ((updated.likes + updated.comments + updated.shares) / updated.reach) * 100;
    }

    updated.analyzedAt = new Date();
    this.analytics.set(postId, updated);
  }

  // 投稿の分析データを取得
  getPostAnalytics(postId: string): PostAnalytics | null {
    return this.analytics.get(postId) || null;
  }

  // 全投稿の分析データを取得
  getAllAnalytics(): PostAnalytics[] {
    return Array.from(this.analytics.values());
  }

  // 分析サマリーを生成
  generateAnalyticsSummary(posts: Post[]): AnalyticsSummary {
    const postedPosts = posts.filter((post) => post.status === PostStatus.Posted);
    const analytics = this.getAllAnalytics();

    if (analytics.length === 0) {
      return {
        totalPosts: 0,
        totalLikes: 0,
        totalComments: 0,
        totalShares: 0,
        totalReach: 0,
        averageEngagementRate: 0,
        bestPerformingPost: null,
        worstPerformingPost: null,
        topHashtags: [],
        bestPostingTimes: [],
      };
    }

    const totalLikes = analytics.reduce((sum, a) => sum + a.likes, 0);
    const totalComments = analytics.reduce((sum, a) => sum + a.comments, 0);
    const totalShares = analytics.reduce((sum, a) => sum + a.shares, 0);
    const totalReach = analytics.reduce((sum, a) => sum + a.reach, 0);
    const averageEngagementRate = analytics.reduce((sum, a) => sum + a.engagementRate, 0) / analytics.length;

    // 最高・最低パフォーマンス投稿
    const sortedByEngagement = [...analytics].sort((a, b) => b.engagementRate - a.engagementRate);
    const bestPerformingPost = sortedByEngagement[0];
    const worstPerformingPost = sortedByEngagement[sortedByEngagement.length - 1];

    // ハッシュタグ分析
    const hashtagAnalysis = this.analyzeHashtags(posts, analytics);

    // 最適投稿時間分析
    const bestPostingTimes = this.analyzePostingTimes(analytics);

    return {
      totalPosts: postedPosts.length,
      totalLikes,
      totalComments,
      totalShares,
      totalReach,
      averageEngagementRate,
      bestPerformingPost,
      worstPerformingPost,
      topHashtags: hashtagAnalysis.slice(0, 10),
      bestPostingTimes,
    };
  }

  // ハッシュタグ分析
  private analyzeHashtags(
    posts: Post[],
    analytics: PostAnalytics[]
  ): { hashtag: string; count: number; avgEngagement: number }[] {
    const hashtagMap = new Map<string, { count: number; totalEngagement: number; posts: number }>();

    posts.forEach((post) => {
      if (post.status === PostStatus.Posted && post.caption) {
        const hashtags = this.extractHashtags(post.caption);
        const postAnalytics = analytics.find((a) => a.postId === post.id);

        hashtags.forEach((hashtag) => {
          const existing = hashtagMap.get(hashtag) || { count: 0, totalEngagement: 0, posts: 0 };
          existing.count++;
          existing.posts++;
          if (postAnalytics) {
            existing.totalEngagement += postAnalytics.engagementRate;
          }
          hashtagMap.set(hashtag, existing);
        });
      }
    });

    return Array.from(hashtagMap.entries())
      .map(([hashtag, data]) => ({
        hashtag,
        count: data.count,
        avgEngagement: data.posts > 0 ? data.totalEngagement / data.posts : 0,
      }))
      .sort((a, b) => b.avgEngagement - a.avgEngagement);
  }

  // 投稿時間分析
  private analyzePostingTimes(analytics: PostAnalytics[]): { hour: number; avgEngagement: number }[] {
    const hourMap = new Map<number, { totalEngagement: number; count: number }>();

    analytics.forEach((analytic) => {
      const hour = analytic.postedAt.getHours();
      const existing = hourMap.get(hour) || { totalEngagement: 0, count: 0 };
      existing.totalEngagement += analytic.engagementRate;
      existing.count++;
      hourMap.set(hour, existing);
    });

    return Array.from(hourMap.entries())
      .map(([hour, data]) => ({
        hour,
        avgEngagement: data.count > 0 ? data.totalEngagement / data.count : 0,
      }))
      .sort((a, b) => b.avgEngagement - a.avgEngagement);
  }

  // ハッシュタグを抽出
  private extractHashtags(caption: string): string[] {
    const hashtagRegex = /#[\w\u3040-\u309F\u30A0-\u30FF]+/g;
    return caption.match(hashtagRegex) || [];
  }

  // 期間別分析
  getAnalyticsByPeriod(startDate: Date, endDate: Date): PostAnalytics[] {
    return this.getAllAnalytics().filter((analytic) => analytic.postedAt >= startDate && analytic.postedAt <= endDate);
  }

  // 投稿タイプ別分析
  getAnalyticsByType(posts: Post[], type: "feed" | "reel"): PostAnalytics[] {
    const typePosts = posts.filter(
      (post) => (type === "feed" && post.type === "Feed") || (type === "reel" && post.type === "Reel")
    );
    const typePostIds = new Set(typePosts.map((post) => post.id));

    return this.getAllAnalytics().filter((analytic) => typePostIds.has(analytic.postId));
  }

  // 成長率計算
  calculateGrowthRate(
    period1Analytics: PostAnalytics[],
    period2Analytics: PostAnalytics[]
  ): {
    likesGrowth: number;
    commentsGrowth: number;
    sharesGrowth: number;
    engagementGrowth: number;
  } {
    const period1Avg = this.calculateAverageMetrics(period1Analytics);
    const period2Avg = this.calculateAverageMetrics(period2Analytics);

    const calculateGrowth = (current: number, previous: number): number => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    return {
      likesGrowth: calculateGrowth(period2Avg.likes, period1Avg.likes),
      commentsGrowth: calculateGrowth(period2Avg.comments, period1Avg.comments),
      sharesGrowth: calculateGrowth(period2Avg.shares, period1Avg.shares),
      engagementGrowth: calculateGrowth(period2Avg.engagementRate, period1Avg.engagementRate),
    };
  }

  private calculateAverageMetrics(analytics: PostAnalytics[]): {
    likes: number;
    comments: number;
    shares: number;
    engagementRate: number;
  } {
    if (analytics.length === 0) return { likes: 0, comments: 0, shares: 0, engagementRate: 0 };

    return {
      likes: analytics.reduce((sum, a) => sum + a.likes, 0) / analytics.length,
      comments: analytics.reduce((sum, a) => sum + a.comments, 0) / analytics.length,
      shares: analytics.reduce((sum, a) => sum + a.shares, 0) / analytics.length,
      engagementRate: analytics.reduce((sum, a) => sum + a.engagementRate, 0) / analytics.length,
    };
  }
}

// シングルトンインスタンス
let analyticsService: AnalyticsService | null = null;

export const getAnalyticsService = (): AnalyticsService => {
  if (!analyticsService) {
    analyticsService = new AnalyticsService();
  }
  return analyticsService;
};
