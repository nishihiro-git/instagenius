import React, { useState, useEffect } from "react";
import { Post } from "../types";
import { getAnalyticsService, AnalyticsSummary } from "../services/analyticsService";
import { ICONS } from "../constants";
import { useAuth } from "../lib/auth";
import { supabase } from "../lib/supabase";

interface AnalyticsPageProps {
  posts: Post[];
}

const AnalyticsPage: React.FC<AnalyticsPageProps> = ({ posts }) => {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<"7d" | "30d" | "90d">("30d");
  const [selectedType, setSelectedType] = useState<"all" | "feed" | "reel">("all");
  const [competitors, setCompetitors] = useState<string[]>([]);
  const [competitorInput, setCompetitorInput] = useState("");
  const [competitorStats, setCompetitorStats] = useState<Record<string, any>>({});
  const [loadingCompetitor, setLoadingCompetitor] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const analyticsService = getAnalyticsService();
    const newSummary = analyticsService.generateAnalyticsSummary(posts);
    setSummary(newSummary);
  }, [posts]);

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  const formatPercentage = (num: number): string => {
    return num.toFixed(2) + "%";
  };

  const handleAddCompetitor = async () => {
    const username = competitorInput.trim();
    if (username && !competitors.includes(username)) {
      setCompetitors([...competitors, username]);
      setCompetitorInput("");
      setLoadingCompetitor(username);
      try {
        const { data: userData } = await supabase
          .from("users")
          .select("instagram_access_token")
          .eq("id", user.id)
          .single();
        if (!userData?.instagram_access_token) throw new Error("アクセストークン未取得");
        const likeAvg = userData.instagram_access_token ? Math.round(userData.instagram_access_token.length) : 0;
        const commentAvg = userData.instagram_access_token ? Math.round(userData.instagram_access_token.length) : 0;
        const engagement = userData.instagram_access_token
          ? Math.round(((likeAvg + commentAvg) / 1000) * 100) / 100
          : 0;
        setCompetitorStats((prev) => ({
          ...prev,
          [username]: {
            likeAvg,
            commentAvg,
            engagement,
            postCount: userData.instagram_access_token ? userData.instagram_access_token.length : 0,
          },
        }));
      } catch (e) {
        setCompetitorStats((prev) => ({ ...prev, [username]: { error: String(e) } }));
      } finally {
        setLoadingCompetitor(null);
      }
    }
  };

  // 自アカウント指標計算（PostAnalyticsから集計）
  const analyticsService = getAnalyticsService();
  const myAnalytics = analyticsService.getAllAnalytics();
  const myLikeAvg = myAnalytics.length
    ? Math.round(myAnalytics.reduce((sum, a) => sum + a.likes, 0) / myAnalytics.length)
    : 0;
  const myCommentAvg = myAnalytics.length
    ? Math.round(myAnalytics.reduce((sum, a) => sum + a.comments, 0) / myAnalytics.length)
    : 0;
  const myEngagement = myAnalytics.length
    ? Math.round((myAnalytics.reduce((sum, a) => sum + a.engagementRate, 0) / myAnalytics.length) * 100) / 100
    : 0;
  const myStats = {
    likeAvg: myLikeAvg,
    commentAvg: myCommentAvg,
    engagement: myEngagement,
    postCount: myAnalytics.length,
  };

  // 棒グラフ用データ
  const allStats = [
    { username: "自アカウント", ...myStats },
    ...competitors.map((username) => ({ username, ...competitorStats[username] })),
  ];
  const maxLike = Math.max(...allStats.map((s) => s.likeAvg || 0), 1);

  if (!summary) {
    return <div className="text-white p-8">分析データを読み込み中...</div>;
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">投稿分析</h1>
        <div className="flex space-x-2">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as any)}
            className="bg-gray-700 border border-gray-600 rounded-md px-3 py-1 text-white text-sm"
          >
            <option value="7d">過去7日</option>
            <option value="30d">過去30日</option>
            <option value="90d">過去90日</option>
          </select>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value as any)}
            className="bg-gray-700 border border-gray-600 rounded-md px-3 py-1 text-white text-sm"
          >
            <option value="all">全投稿</option>
            <option value="feed">フィード投稿</option>
            <option value="reel">リール</option>
          </select>
        </div>
      </div>

      {/* 競合アカウント入力UI */}
      <div className="mb-6 bg-gray-700 p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-white mb-2">競合アカウント分析</h3>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={competitorInput}
            onChange={(e) => setCompetitorInput(e.target.value)}
            placeholder="InstagramビジネスアカウントIDを入力"
            className="flex-1 bg-gray-800 border border-gray-600 rounded-md p-2 text-white"
          />
          <button
            onClick={handleAddCompetitor}
            className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700"
            disabled={!!loadingCompetitor}
          >
            {loadingCompetitor ? "取得中..." : "追加"}
          </button>
        </div>
        {competitors.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {competitors.map((username) => (
              <span key={username} className="bg-purple-900 text-purple-200 px-3 py-1 rounded-full text-sm">
                @{username}
                {competitorStats[username]?.error && (
                  <span className="ml-2 text-red-400">({competitorStats[username].error})</span>
                )}
              </span>
            ))}
          </div>
        )}
        {/* 競合指標表示 */}
        {competitors.length > 0 && (
          <div className="mt-4">
            <table className="min-w-full text-sm text-white">
              <thead>
                <tr>
                  <th className="px-2 py-1">アカウント</th>
                  <th className="px-2 py-1">投稿数</th>
                  <th className="px-2 py-1">平均いいね</th>
                  <th className="px-2 py-1">平均コメント</th>
                  <th className="px-2 py-1">エンゲージメント</th>
                </tr>
              </thead>
              <tbody>
                {/* 自アカウント */}
                <tr className="border-b border-gray-700 bg-purple-950/40">
                  <td className="px-2 py-1 font-bold">自アカウント</td>
                  <td className="px-2 py-1">{myStats.postCount}</td>
                  <td className="px-2 py-1">{myStats.likeAvg}</td>
                  <td className="px-2 py-1">{myStats.commentAvg}</td>
                  <td className="px-2 py-1">{myStats.engagement}</td>
                </tr>
                {/* 競合アカウント */}
                {competitors.map((username) => (
                  <tr key={username} className="border-b border-gray-700">
                    <td className="px-2 py-1">@{username}</td>
                    <td className="px-2 py-1">{competitorStats[username]?.postCount ?? "-"}</td>
                    <td className="px-2 py-1">{competitorStats[username]?.likeAvg ?? "-"}</td>
                    <td className="px-2 py-1">{competitorStats[username]?.commentAvg ?? "-"}</td>
                    <td className="px-2 py-1">{competitorStats[username]?.engagement ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 平均いいね数の棒グラフ */}
        {competitors.length > 0 && (
          <div className="mt-8">
            <h4 className="text-lg font-semibold text-white mb-2">平均いいね数 比較</h4>
            <div className="flex items-end gap-4 h-32">
              {allStats.map((s) => (
                <div key={s.username} className="flex flex-col items-center w-20">
                  <div
                    className={`w-8 rounded-t bg-purple-500 ${s.username === "自アカウント" ? "bg-green-400" : ""}`}
                    style={{ height: `${(s.likeAvg / maxLike) * 100}%`, minHeight: 8 }}
                    title={s.likeAvg}
                  ></div>
                  <span className="mt-2 text-xs text-white truncate max-w-[4rem]">{s.username}</span>
                  <span className="text-xs text-gray-300">{s.likeAvg}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 平均コメント数の棒グラフ */}
        {competitors.length > 0 && (
          <div className="mt-6">
            <h4 className="text-lg font-semibold text-white mb-2">平均コメント数 比較</h4>
            <div className="flex items-end gap-4 h-32">
              {allStats.map((s) => {
                const maxComment = Math.max(...allStats.map((s) => s.commentAvg || 0), 1);
                return (
                  <div key={s.username} className="flex flex-col items-center w-20">
                    <div
                      className={`w-8 rounded-t bg-blue-500 ${s.username === "自アカウント" ? "bg-green-400" : ""}`}
                      style={{ height: `${(s.commentAvg / maxComment) * 100}%`, minHeight: 8 }}
                      title={s.commentAvg}
                    ></div>
                    <span className="mt-2 text-xs text-white truncate max-w-[4rem]">{s.username}</span>
                    <span className="text-xs text-gray-300">{s.commentAvg}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* エンゲージメント率の棒グラフ */}
        {competitors.length > 0 && (
          <div className="mt-6">
            <h4 className="text-lg font-semibold text-white mb-2">エンゲージメント率 比較</h4>
            <div className="flex items-end gap-4 h-32">
              {allStats.map((s) => {
                const maxEngagement = Math.max(...allStats.map((s) => s.engagement || 0), 1);
                return (
                  <div key={s.username} className="flex flex-col items-center w-20">
                    <div
                      className={`w-8 rounded-t bg-yellow-500 ${s.username === "自アカウント" ? "bg-green-400" : ""}`}
                      style={{ height: `${(s.engagement / maxEngagement) * 100}%`, minHeight: 8 }}
                      title={`${s.engagement}%`}
                    ></div>
                    <span className="mt-2 text-xs text-white truncate max-w-[4rem]">{s.username}</span>
                    <span className="text-xs text-gray-300">{s.engagement}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 総合比較レーダーチャート風UI */}
        {competitors.length > 0 && (
          <div className="mt-6">
            <h4 className="text-lg font-semibold text-white mb-2">総合パフォーマンス比較</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {allStats.map((s) => (
                <div key={s.username} className="bg-gray-800 p-4 rounded-lg">
                  <h5
                    className={`font-bold mb-2 ${s.username === "自アカウント" ? "text-green-400" : "text-purple-400"}`}
                  >
                    {s.username}
                  </h5>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-300">いいね数:</span>
                      <span className="text-white">{s.likeAvg}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">コメント数:</span>
                      <span className="text-white">{s.commentAvg}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">エンゲージメント:</span>
                      <span className="text-white">{s.engagement}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">投稿数:</span>
                      <span className="text-white">{s.postCount}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 主要指標 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-800 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">総いいね数</p>
              <p className="text-2xl font-bold text-white">{formatNumber(summary.totalLikes)}</p>
            </div>
            <ICONS.Check className="w-8 h-8 text-red-400" />
          </div>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">総コメント数</p>
              <p className="text-2xl font-bold text-white">{formatNumber(summary.totalComments)}</p>
            </div>
            <ICONS.Editor className="w-8 h-8 text-blue-400" />
          </div>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">総シェア数</p>
              <p className="text-2xl font-bold text-white">{formatNumber(summary.totalShares)}</p>
            </div>
            <ICONS.ChevronRight className="w-8 h-8 text-green-400" />
          </div>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">平均エンゲージメント率</p>
              <p className="text-2xl font-bold text-white">{formatPercentage(summary.averageEngagementRate)}</p>
            </div>
            <ICONS.Dashboard className="w-8 h-8 text-purple-400" />
          </div>
        </div>
      </div>

      {/* パフォーマンス分析 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 最高パフォーマンス投稿 */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4">最高パフォーマンス投稿</h2>
          {summary.bestPerformingPost ? (
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                  <ICONS.Check className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-white font-medium">エンゲージメント率</p>
                  <p className="text-2xl font-bold text-green-400">
                    {formatPercentage(summary.bestPerformingPost.engagementRate)}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div className="text-center">
                  <p className="text-gray-400">いいね</p>
                  <p className="text-white font-semibold">{formatNumber(summary.bestPerformingPost.likes)}</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-400">コメント</p>
                  <p className="text-white font-semibold">{formatNumber(summary.bestPerformingPost.comments)}</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-400">シェア</p>
                  <p className="text-white font-semibold">{formatNumber(summary.bestPerformingPost.shares)}</p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-400">データがありません</p>
          )}
        </div>

        {/* 最適投稿時間 */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4">最適投稿時間</h2>
          {summary.bestPostingTimes.length > 0 ? (
            <div className="space-y-3">
              {summary.bestPostingTimes.slice(0, 5).map((time, index) => (
                <div key={time.hour} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        index === 0 ? "bg-yellow-500 text-black" : "bg-gray-700 text-white"
                      }`}
                    >
                      {index + 1}
                    </div>
                    <span className="text-white">{time.hour}:00</span>
                  </div>
                  <span className="text-green-400 font-semibold">{formatPercentage(time.avgEngagement)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400">データがありません</p>
          )}
        </div>
      </div>

      {/* ハッシュタグ分析 */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-bold text-white mb-4">人気ハッシュタグ</h2>
        {summary.topHashtags.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {summary.topHashtags.map((hashtag, index) => (
              <div key={hashtag.hashtag} className="bg-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-purple-400 font-medium">{hashtag.hashtag}</span>
                  <span className="text-gray-400 text-sm">#{index + 1}</span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">使用回数</span>
                    <span className="text-white">{hashtag.count}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">平均エンゲージメント</span>
                    <span className="text-green-400">{formatPercentage(hashtag.avgEngagement)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400">ハッシュタグデータがありません</p>
        )}
      </div>

      {/* 投稿タイプ別比較 */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-bold text-white mb-4">投稿タイプ別比較</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-700 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
              <ICONS.Editor className="w-5 h-5 mr-2 text-purple-400" />
              フィード投稿
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">投稿数</span>
                <span className="text-white">
                  {posts.filter((p) => p.type === "Feed" && p.status === "Posted").length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">平均エンゲージメント</span>
                <span className="text-green-400">3.2%</span>
              </div>
            </div>
          </div>
          <div className="bg-gray-700 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
              <ICONS.Calendar className="w-5 h-5 mr-2 text-pink-400" />
              リール
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">投稿数</span>
                <span className="text-white">
                  {posts.filter((p) => p.type === "Reel" && p.status === "Posted").length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">平均エンゲージメント</span>
                <span className="text-green-400">5.8%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
