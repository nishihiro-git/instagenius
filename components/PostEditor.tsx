import React, { useState, useEffect } from "react";
import { Post, PostType, PostStatus } from "../types";
import { ICONS, MOCK_ACCOUNT } from "../constants";
import PostPreview from "./PostPreview";
import {
  generateCaption,
  GenerateCaptionParams,
  generateImageByPrompt,
  editImageWithPrompt,
} from "../services/openaiService";
import { getNotificationService } from "../services/notificationService";
import { createPost } from "../services/postService";
import { useAuth } from "../lib/auth";

interface PostEditorProps {
  onSave: (post: Post) => void;
  postToEdit?: Post;
}

const STEPS = ["メディア", "コンテンツ", "予約", "確認 & 予約"];

const PostEditor: React.FC<PostEditorProps> = ({ onSave, postToEdit }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [post, setPost] = useState<Partial<Post>>(
    postToEdit || {
      id: `post_${Date.now()}`,
      type: PostType.Feed,
      status: PostStatus.Draft,
      caption: "",
      mediaUrl: "",
      scheduledAt: null,
      account: MOCK_ACCOUNT,
    }
  );

  useEffect(() => {
    if (postToEdit) {
      setPost(postToEdit);
    }
  }, [postToEdit]);

  const [isGeneratingCaption, setIsGeneratingCaption] = useState(false);
  const [aiTopic, setAiTopic] = useState("");
  const [aiTone, setAiTone] = useState<"casual" | "professional" | "funny" | "inspirational">("casual");
  const [mediaMode, setMediaMode] = useState<"upload" | "ai" | "edit">("upload");
  const [aiImagePrompt, setAiImagePrompt] = useState("");
  const [aiEditPrompt, setAiEditPrompt] = useState("");
  const [aiImageLoading, setAiImageLoading] = useState(false);
  const [aiImageError, setAiImageError] = useState("");
  const [postToInstagram, setPostToInstagram] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [captionMode, setCaptionMode] = useState<"manual" | "ai">("ai");
  const [captionLength, setCaptionLength] = useState<"short" | "normal" | "long">("normal");

  const { user } = useAuth();

  const updatePost = (data: Partial<Post>) => {
    setPost((prev) => ({ ...prev, ...data }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => updatePost({ mediaUrl: event.target?.result as string });
      reader.readAsDataURL(file);
    }
  };

  const handleGenerateCaption = async () => {
    if (!aiTopic) return;
    setIsGeneratingCaption(true);
    try {
      const params: GenerateCaptionParams = {
        type: post.type === PostType.Reel ? "reel" : "feed",
        topic: aiTopic,
        tone: aiTone,
        hashtags: true,
        language: "ja",
        length: captionLength,
      };
      const newCaption = await generateCaption(params);
      updatePost({ caption: newCaption });
      setCaptionMode("ai");
    } catch (error) {
      alert((error as Error).message);
    } finally {
      setIsGeneratingCaption(false);
    }
  };

  const isStepComplete = () => {
    switch (currentStep) {
      case 1:
        return !!post.mediaUrl;
      case 2:
        return !!post.caption?.trim();
      case 3:
        return !!post.scheduledAt;
      default:
        return true;
    }
  };

  const handleNext = () => setCurrentStep((prev) => (prev < STEPS.length ? prev + 1 : prev));
  const handleBack = () => setCurrentStep((prev) => (prev > 1 ? prev - 1 : prev));
  const handleSave = async () => {
    if (!user) return;

    setIsPosting(true);
    try {
      const notificationService = getNotificationService();
      const savedPost = await createPost({
        type: post.type || PostType.Feed,
        status: post.status || PostStatus.Draft,
        caption: post.caption || "",
        mediaUrl: post.mediaUrl || "",
        scheduledAt: post.scheduledAt || null,
        postedAt: post.postedAt || null,
        account: post.account || MOCK_ACCOUNT,
        user_id: user.id,
      });

      if (postToInstagram) {
        // 投稿完了通知
        notificationService.notifyPostCompleted(post.caption || "投稿");
      } else if (post.scheduledAt) {
        // スケジュール通知
        notificationService.notifyPostScheduled(post.caption || "投稿", post.scheduledAt);
      }

      onSave(savedPost);
    } catch (error) {
      console.error("投稿保存エラー:", error);
      // 投稿エラー通知
      const notificationService = getNotificationService();
      notificationService.notifyPostError(post.caption || "投稿", String(error));
    } finally {
      setIsPosting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return renderMediaStep();
      case 2:
        return renderContentStep();
      case 3:
        return renderScheduleStep();
      case 4:
        return renderReviewStep();
      default:
        return null;
    }
  };

  const renderMediaStep = () => (
    <div>
      <h3 className="text-xl font-bold text-white mb-4">1. メディアを選択</h3>
      <div className="mb-4 flex gap-2">
        <button
          className={`px-4 py-2 rounded-md font-medium ${
            mediaMode === "upload" ? "bg-purple-600 text-white" : "bg-gray-700 text-gray-300"
          }`}
          onClick={() => setMediaMode("upload")}
        >
          アップロード
        </button>
        <button
          className={`px-4 py-2 rounded-md font-medium ${
            mediaMode === "ai" ? "bg-purple-600 text-white" : "bg-gray-700 text-gray-300"
          }`}
          onClick={() => setMediaMode("ai")}
        >
          AI画像生成
        </button>
        <button
          className={`px-4 py-2 rounded-md font-medium ${
            mediaMode === "edit" ? "bg-purple-600 text-white" : "bg-gray-700 text-gray-300"
          }`}
          onClick={() => setMediaMode("edit")}
        >
          画像＋AI編集
        </button>
      </div>
      {/* --- アップロード --- */}
      {mediaMode === "upload" && (
        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-600 border-dashed rounded-md">
          <div className="space-y-1 text-center">
            <ICONS.Image className="mx-auto h-12 w-12 text-gray-500" />
            <label
              htmlFor="file-upload"
              className="relative cursor-pointer bg-gray-700 rounded-md font-medium text-purple-400 hover:text-purple-300 px-2"
            >
              <span>ファイルをアップロード</span>
              <input
                id="file-upload"
                type="file"
                className="sr-only"
                onChange={handleFileChange}
                accept="image/*,video/*"
              />
            </label>
            <p className="pl-1 inline">またはドラッグ＆ドロップ</p>
            <p className="text-xs text-gray-500">PNG, JPG, GIF (最大10MB)</p>
          </div>
        </div>
      )}
      {/* --- AI画像生成 --- */}
      {mediaMode === "ai" && (
        <div className="bg-gray-800 rounded-lg p-4 mt-2">
          <label className="block text-sm font-medium text-gray-300 mb-2">生成したい画像の説明（プロンプト）</label>
          <input
            type="text"
            className="w-full bg-gray-700 border-gray-600 rounded-md p-2 mb-2 text-sm"
            value={aiImagePrompt}
            onChange={(e) => setAiImagePrompt(e.target.value)}
            placeholder="例: 富士山と桜の幻想的な風景"
          />
          <button
            onClick={handleGenerateImage}
            disabled={aiImageLoading || !aiImagePrompt}
            className="w-full bg-purple-600 text-white py-2 rounded-md font-semibold hover:bg-purple-700 disabled:bg-purple-800 disabled:cursor-not-allowed"
          >
            {aiImageLoading ? "生成中..." : "AIで画像生成"}
          </button>
          {aiImageError && <p className="text-red-400 mt-2">{aiImageError}</p>}
        </div>
      )}
      {/* --- 画像＋AI編集 --- */}
      {mediaMode === "edit" && (
        <div className="bg-gray-800 rounded-lg p-4 mt-2">
          <label className="block text-sm font-medium text-gray-300 mb-2">アップロード画像</label>
          {post.mediaUrl ? (
            <img src={post.mediaUrl} alt="アップロード画像" className="w-32 h-32 object-cover rounded mb-2 mx-auto" />
          ) : (
            <div className="text-gray-400 text-center mb-2">まず画像をアップロードしてください</div>
          )}
          <label className="block text-sm font-medium text-gray-300 mb-2">編集内容（プロンプト）</label>
          <input
            type="text"
            className="w-full bg-gray-700 border-gray-600 rounded-md p-2 mb-2 text-sm"
            value={aiEditPrompt}
            onChange={(e) => setAiEditPrompt(e.target.value)}
            placeholder="例: 空を夕焼けに変更"
          />
          <button
            onClick={handleEditImage}
            disabled={aiImageLoading || !aiEditPrompt || !post.mediaUrl}
            className="w-full bg-purple-600 text-white py-2 rounded-md font-semibold hover:bg-purple-700 disabled:bg-purple-800 disabled:cursor-not-allowed"
          >
            {aiImageLoading ? "編集中..." : "AIで画像編集"}
          </button>
          {aiImageError && <p className="text-red-400 mt-2">{aiImageError}</p>}
        </div>
      )}
      {/* --- プレビュー --- */}
      {post.mediaUrl && (
        <div className="mt-6 flex flex-col items-center">
          <span className="text-gray-400 text-sm mb-2">プレビュー</span>
          <img src={post.mediaUrl} alt="preview" className="max-w-xs max-h-64 rounded shadow" />
        </div>
      )}
      {/* 投稿タイプ選択は従来通り */}
      <div className="mt-6">
        <label className="block text-sm font-medium text-gray-300 mb-2">投稿タイプ</label>
        <div className="flex gap-2">
          <button
            onClick={() => updatePost({ type: PostType.Feed })}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              post.type === PostType.Feed ? "bg-purple-600 text-white" : "bg-gray-700 hover:bg-gray-600"
            }`}
          >
            フィード (1:1)
          </button>
          <button
            onClick={() => updatePost({ type: PostType.Reel })}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              post.type === PostType.Reel ? "bg-purple-600 text-white" : "bg-gray-700 hover:bg-gray-600"
            }`}
          >
            リール (9:16)
          </button>
        </div>
      </div>
    </div>
  );

  const renderContentStep = () => (
    <div>
      <h3 className="text-xl font-bold text-white mb-4">2. コンテンツを作成</h3>
      <p className="text-gray-400 mb-6">
        投稿のキャプションを作成します。AIアシスタントに手伝ってもらうこともできます。
      </p>

      {/* キャプション作成モード切り替え */}
      <div className="mb-4 flex gap-2">
        <button
          className={`px-4 py-2 rounded-md font-medium ${
            captionMode === "manual" ? "bg-purple-600 text-white" : "bg-gray-700 text-gray-300"
          }`}
          onClick={() => setCaptionMode("manual")}
        >
          自分で作成
        </button>
        <button
          className={`px-4 py-2 rounded-md font-medium ${
            captionMode === "ai" ? "bg-purple-600 text-white" : "bg-gray-700 text-gray-300"
          }`}
          onClick={() => setCaptionMode("ai")}
        >
          AIで生成
        </button>
      </div>

      {/* AIキャプション生成UI */}
      {captionMode === "ai" && (
        <div className="mb-4 p-4 bg-gray-700/50 rounded-lg">
          <h3 className="font-semibold text-white mb-2 flex items-center">
            <ICONS.Magic className="w-5 h-5 mr-2 text-purple-400" /> AIキャプションジェネレーター
          </h3>
          <input
            type="text"
            placeholder="トピックを入力 (例: 新商品発売)"
            value={aiTopic}
            onChange={(e) => setAiTopic(e.target.value)}
            className="w-full bg-gray-800 border-gray-600 rounded-md p-2 mb-2 text-sm focus:ring-purple-500"
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-3">
            <select
              value={aiTone}
              onChange={(e) => setAiTone(e.target.value as any)}
              className="w-full bg-gray-800 border-gray-600 rounded-md p-2 text-sm"
            >
              <option value="casual">カジュアル</option>
              <option value="professional">プロフェッショナル</option>
              <option value="funny">面白い</option>
              <option value="inspirational">インスピレーショナル</option>
            </select>
            <select
              value={captionLength}
              onChange={(e) => setCaptionLength(e.target.value as any)}
              className="w-full bg-gray-800 border-gray-600 rounded-md p-2 text-sm"
            >
              <option value="short">短い</option>
              <option value="normal">普通</option>
              <option value="long">長い</option>
            </select>
          </div>
          <button
            onClick={handleGenerateCaption}
            disabled={isGeneratingCaption || !aiTopic}
            className="w-full flex items-center justify-center bg-purple-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-purple-700 disabled:bg-purple-800 disabled:cursor-not-allowed"
          >
            {isGeneratingCaption ? "生成中..." : "キャプションを生成"}
          </button>
        </div>
      )}

      {/* キャプション編集エリア（共通） */}
      <label htmlFor="caption" className="block text-sm font-medium text-gray-300">
        キャプション
      </label>
      <textarea
        id="caption"
        name="caption"
        rows={8}
        className="mt-1 block w-full bg-gray-800 border-gray-600 rounded-md p-2 text-sm"
        value={post.caption}
        onChange={(e) => updatePost({ caption: e.target.value })}
        placeholder="ここにキャプションを入力..."
      />
    </div>
  );

  const renderScheduleStep = () => (
    <div>
      <h3 className="text-xl font-bold text-white mb-4">3. 日時を予約</h3>
      <p className="text-gray-400 mb-6">この投稿を公開したい日時を設定してください。</p>
      <label htmlFor="schedule-time" className="block text-sm font-medium text-gray-300">
        予約日時
      </label>
      <input
        type="datetime-local"
        id="schedule-time"
        className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md p-3 text-white"
        value={
          post.scheduledAt
            ? new Date(post.scheduledAt.getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)
            : ""
        }
        onChange={(e) => updatePost({ scheduledAt: e.target.value ? new Date(e.target.value) : null })}
      />
    </div>
  );

  const renderReviewStep = () => (
    <div>
      <h3 className="text-xl font-bold text-white mb-4">4. 確認 & 予約</h3>
      <p className="text-gray-400 mb-6">投稿内容を確認し、Instagramへの投稿も選択できます。</p>

      <div className="mb-6">
        <PostPreview post={post as Post} account={post.account || MOCK_ACCOUNT} />
      </div>

      <div className="mb-6 p-4 bg-gray-700/50 rounded-lg">
        <div className="flex items-center mb-4">
          <input
            id="post-to-instagram"
            type="checkbox"
            checked={postToInstagram}
            onChange={(e) => setPostToInstagram(e.target.checked)}
            className="w-4 h-4 text-purple-600 bg-gray-800 border-gray-600 rounded focus:ring-purple-500"
          />
          <label htmlFor="post-to-instagram" className="ml-2 text-sm font-medium text-gray-300">
            Instagramにも投稿する
          </label>
        </div>
        {postToInstagram && (
          <div className="text-xs text-gray-400">
            • 投稿は指定した日時にInstagramに自動投稿されます • 投稿に失敗した場合はローカルに保存されます
          </div>
        )}
      </div>

      <div className="flex justify-between">
        <button
          onClick={handleBack}
          className="flex items-center px-4 py-2 text-gray-400 hover:text-white transition-colors"
        >
          <ICONS.ChevronLeft className="w-5 h-5 mr-2" />
          戻る
        </button>
        <button
          onClick={handleSave}
          disabled={isPosting}
          className="flex items-center bg-purple-600 text-white font-semibold py-2 px-6 rounded-md hover:bg-purple-700 disabled:bg-purple-800 disabled:cursor-not-allowed"
        >
          {isPosting ? (
            <>
              <ICONS.Loader className="w-5 h-5 mr-2 animate-spin" />
              保存中...
            </>
          ) : (
            <>
              <ICONS.Check className="w-5 h-5 mr-2" />
              投稿を保存
            </>
          )}
        </button>
      </div>
    </div>
  );

  // AI画像生成
  const handleGenerateImage = async () => {
    setAiImageLoading(true);
    setAiImageError("");
    try {
      const img = await generateImageByPrompt(aiImagePrompt);
      updatePost({ mediaUrl: img });
    } catch (e: any) {
      setAiImageError(e.message || "画像生成に失敗しました");
    } finally {
      setAiImageLoading(false);
    }
  };
  // AI画像編集
  const handleEditImage = async () => {
    setAiImageLoading(true);
    setAiImageError("");
    try {
      if (!post.mediaUrl) throw new Error("まず画像をアップロードしてください");
      const img = await editImageWithPrompt(post.mediaUrl, aiEditPrompt);
      updatePost({ mediaUrl: img });
    } catch (e: any) {
      setAiImageError(e.message || "画像編集に失敗しました");
    } finally {
      setAiImageLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 lg:p-8">
      {/* ヘッダー */}
      <div className="mb-6 lg:mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold">投稿を作成</h1>
        <p className="text-gray-400 mt-2">ステップ {currentStep} / 4</p>
      </div>

      {/* ステップインジケーター */}
      <div className="mb-6 lg:mb-8">
        <div className="flex items-center justify-center gap-6 lg:gap-8 w-full max-w-xl mx-auto">
          {[1, 2, 3, 4].map((step) => (
            <div key={step} className="flex items-center">
              <div
                className={`w-8 h-8 lg:w-10 lg:h-10 rounded-full flex items-center justify-center text-sm lg:text-base font-semibold ${
                  step <= currentStep ? "bg-purple-600 text-white" : "bg-gray-700 text-gray-400"
                }`}
              >
                {step}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="max-w-4xl mx-auto">
        <div className="bg-gray-800 rounded-lg p-4 lg:p-8">{renderStepContent()}</div>
      </div>

      {/* フッターナビゲーション */}
      <div className="fixed bottom-0 left-0 right-0 lg:relative bg-gray-900 lg:bg-transparent p-4 lg:p-0 border-t lg:border-t-0 border-gray-700 lg:mt-8">
        <div className="flex justify-between items-center max-w-4xl mx-auto">
          <button
            onClick={handleBack}
            disabled={currentStep === 1}
            className="px-4 lg:px-6 py-2 lg:py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm lg:text-base"
          >
            戻る
          </button>
          <button
            onClick={handleNext}
            disabled={!isStepComplete()}
            className="px-4 lg:px-6 py-2 lg:py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm lg:text-base"
          >
            {currentStep === 4 ? "投稿を保存" : "次へ"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PostEditor;
