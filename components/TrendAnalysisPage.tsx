import React, { useState, useEffect } from "react";
import { ICONS } from "../constants";
import { getTrendAnalysisService, TrendInsights, ViralPostPattern } from "../services/trendAnalysisService";

interface TrendAnalysisPageProps {
  onGeneratePost: (content: { caption: string; hashtags: string[]; visualStyle: string; postingTime: number }) => void;
}

const TrendAnalysisPage: React.FC<TrendAnalysisPageProps> = ({ onGeneratePost }) => {
  const [insights, setInsights] = useState<TrendInsights | null>(null);
  const [patterns, setPatterns] = useState<ViralPostPattern[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<any>(null);
  const [performancePrediction, setPerformancePrediction] = useState<any>(null);

  useEffect(() => {
    loadTrendData();
  }, []);

  const loadTrendData = async () => {
    const trendService = getTrendAnalysisService();
    const [trendInsights, viralPatterns] = await Promise.all([
      trendService.analyzeCurrentTrends(),
      trendService.analyzeViralPatterns(),
    ]);
    setInsights(trendInsights);
    setPatterns(viralPatterns);
  };

  const handleGenerateTrendBasedPost = async () => {
    if (!selectedTopic) return;

    setIsGenerating(true);
    try {
      const trendService = getTrendAnalysisService();
      const content = await trendService.generateTrendBasedContent(selectedTopic);
      setGeneratedContent(content);

      // パフォーマンス予測
      const prediction = await trendService.predictPerformance({
        topic: selectedTopic,
        hashtags: content.hashtags,
        captionStyle: "質問形式",
        postingTime: content.postingTime,
      });
      setPerformancePrediction(prediction);
    } catch (error) {
      console.error("投稿生成エラー:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUseGeneratedContent = () => {
    if (generatedContent) {
      onGeneratePost(generatedContent);
    }
  };

  const formatTime = (hour: number): string => {
    return `${hour.toString().padStart(2, "0")}:00`;
  };

  if (!insights) {
    return <div className="text-white p-8">トレンドデータを読み込み中...</div>;
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">バズ投稿分析</h1>
        <div className="flex items-center space-x-2">
          <ICONS.Sparkles className="w-6 h-6 text-yellow-400" />
          <span className="text-sm text-gray-400">リアルタイム更新</span>
        </div>
      </div>

      {/* 現在のトレンド */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center">
          <ICONS.Dashboard className="w-5 h-5 mr-2 text-purple-400" />
          現在バズっているトピック
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {insights.currentTrends.map((trend, index) => (
            <div
              key={trend}
              className={`p-3 rounded-lg cursor-pointer transition-all ${
                selectedTopic === trend ? "bg-purple-600 text-white" : "bg-gray-700 hover:bg-gray-600 text-gray-300"
              }`}
              onClick={() => setSelectedTopic(trend)}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{trend}</span>
                <span className="text-sm opacity-75">#{index + 1}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* バズ投稿パターン */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-bold text-white mb-4">バズ投稿パターン分析</h2>
        <div className="space-y-4">
          {patterns.slice(0, 3).map((pattern) => (
            <div key={pattern.topic} className="bg-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-white">{pattern.topic}</h3>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-400">バズ度</span>
                  <span className="text-yellow-400 font-bold">{pattern.viralityScore.toFixed(1)}</span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-400">キャプションスタイル</p>
                  <p className="text-white font-medium">{pattern.captionStyle}</p>
                </div>
                <div>
                  <p className="text-gray-400">視覚スタイル</p>
                  <p className="text-white font-medium">{pattern.visualStyle}</p>
                </div>
                <div>
                  <p className="text-gray-400">最適投稿時間</p>
                  <p className="text-white font-medium">{formatTime(pattern.postingTime)}</p>
                </div>
              </div>
              <div className="mt-3">
                <p className="text-gray-400 text-sm mb-2">推奨ハッシュタグ</p>
                <div className="flex flex-wrap gap-2">
                  {pattern.hashtags.slice(0, 4).map((hashtag) => (
                    <span key={hashtag} className="text-purple-400 text-sm">
                      {hashtag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 自動投稿生成 */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-bold text-white mb-4">トレンドベース投稿生成</h2>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">トピックを選択（または自動選択）</label>
          <div className="flex space-x-2">
            <select
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
              className="flex-1 bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white"
            >
              <option value="">自動選択</option>
              {insights.currentTrends.map((trend) => (
                <option key={trend} value={trend}>
                  {trend}
                </option>
              ))}
            </select>
            <button
              onClick={handleGenerateTrendBasedPost}
              disabled={isGenerating}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2 rounded-md hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <ICONS.Loader className="w-4 h-4 mr-2 animate-spin inline" />
                  生成中...
                </>
              ) : (
                <>
                  <ICONS.Sparkles className="w-4 h-4 mr-2 inline" />
                  投稿生成
                </>
              )}
            </button>
          </div>
        </div>

        {/* 生成されたコンテンツ */}
        {generatedContent && (
          <div className="bg-gray-700 rounded-lg p-4 mb-4">
            <h3 className="text-lg font-semibold text-white mb-3">生成された投稿</h3>
            <div className="space-y-3">
              <div>
                <p className="text-gray-400 text-sm mb-1">キャプション</p>
                <p className="text-white whitespace-pre-wrap text-sm">{generatedContent.caption}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm mb-1">推奨ハッシュタグ</p>
                <div className="flex flex-wrap gap-1">
                  {generatedContent.hashtags.map((tag: string) => (
                    <span key={tag} className="text-purple-400 text-sm">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-400">視覚スタイル</p>
                  <p className="text-white">{generatedContent.visualStyle}</p>
                </div>
                <div>
                  <p className="text-gray-400">推奨投稿時間</p>
                  <p className="text-white">{formatTime(generatedContent.postingTime)}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* パフォーマンス予測 */}
        {performancePrediction && (
          <div className="bg-gray-700 rounded-lg p-4 mb-4">
            <h3 className="text-lg font-semibold text-white mb-3">パフォーマンス予測</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <p className="text-gray-400">予想エンゲージメント</p>
                <p className="text-green-400 font-bold text-lg">
                  {performancePrediction.predictedEngagement.toFixed(1)}%
                </p>
              </div>
              <div className="text-center">
                <p className="text-gray-400">バズ度スコア</p>
                <p className="text-yellow-400 font-bold text-lg">{performancePrediction.viralityScore.toFixed(1)}</p>
              </div>
              <div className="text-center">
                <p className="text-gray-400">リーチ予想</p>
                <p className="text-blue-400 font-bold text-lg">
                  {performancePrediction.reachEstimate.toLocaleString()}
                </p>
              </div>
              <div className="text-center">
                <p className="text-gray-400">推奨事項</p>
                <p className="text-purple-400 font-medium">{performancePrediction.recommendations.length}件</p>
              </div>
            </div>
            <div className="mt-3">
              <p className="text-gray-400 text-sm mb-2">改善提案</p>
              <ul className="text-sm text-gray-300 space-y-1">
                {performancePrediction.recommendations.map((rec: string, index: number) => (
                  <li key={index} className="flex items-center">
                    <ICONS.Check className="w-3 h-3 mr-2 text-green-400" />
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* アクションボタン */}
        {generatedContent && (
          <div className="flex space-x-3">
            <button
              onClick={handleUseGeneratedContent}
              className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700"
            >
              <ICONS.Editor className="w-4 h-4 mr-2 inline" />
              投稿エディターで使用
            </button>
            <button
              onClick={() => setGeneratedContent(null)}
              className="bg-gray-600 text-white px-6 py-2 rounded-md hover:bg-gray-700"
            >
              クリア
            </button>
          </div>
        )}
      </div>

      {/* 最適投稿時間 */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-bold text-white mb-4">最適投稿時間</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {insights.optimalPostingSchedule.map((schedule, index) => (
            <div key={index} className="bg-gray-700 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-white mb-1">{formatTime(schedule.hour)}</div>
              <div className="text-sm text-gray-400">エンゲージメント: {schedule.engagement.toFixed(1)}%</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TrendAnalysisPage;
