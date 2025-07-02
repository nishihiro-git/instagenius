import React, { useState } from "react";
import { ICONS } from "../constants";

interface InstagramConnectProps {
  onConnect: () => void;
}

const InstagramConnect: React.FC<InstagramConnectProps> = ({ onConnect }) => {
  const [accessToken, setAccessToken] = useState("");
  const [instagramBusinessAccountId, setInstagramBusinessAccountId] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken || !instagramBusinessAccountId) {
      setError("すべてのフィールドを入力してください。");
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      // Instagramサービスを初期化
      // const service = initializeInstagramService({
      //   accessToken,
      //   instagramBusinessAccountId,
      // });

      // 接続テスト
      // await service.getAccountInfo();

      // 成功時は親コンポーネントに通知
      onConnect();
    } catch (error) {
      setError(`接続に失敗しました: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="flex items-center mb-6">
          <ICONS.Instagram className="w-8 h-8 text-pink-500 mr-3" />
          <h2 className="text-2xl font-bold text-white">Instagram連携設定</h2>
        </div>

        <div className="mb-6 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-300 mb-2">設定手順</h3>
          <ol className="text-sm text-gray-300 space-y-2">
            <li>1. Facebook開発者アカウントでアプリを作成</li>
            <li>2. Instagram Basic Display APIを有効化</li>
            <li>3. アクセストークンを取得</li>
            <li>4. Instagram Business Account IDを取得</li>
          </ol>
        </div>

        <form onSubmit={handleConnect} className="space-y-4">
          <div>
            <label htmlFor="accessToken" className="block text-sm font-medium text-gray-300 mb-2">
              Instagram Access Token
            </label>
            <input
              id="accessToken"
              type="password"
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-md p-3 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Instagram Access Tokenを入力"
              required
            />
          </div>

          <div>
            <label htmlFor="accountId" className="block text-sm font-medium text-gray-300 mb-2">
              Instagram Business Account ID
            </label>
            <input
              id="accountId"
              type="text"
              value={instagramBusinessAccountId}
              onChange={(e) => setInstagramBusinessAccountId(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-md p-3 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Instagram Business Account IDを入力"
              required
            />
          </div>

          {error && (
            <div className="p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isConnecting}
            className="w-full flex items-center justify-center bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold py-3 px-4 rounded-md hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            {isConnecting ? (
              <>
                <ICONS.Loader className="w-5 h-5 mr-2 animate-spin" />
                接続中...
              </>
            ) : (
              <>
                <ICONS.Instagram className="w-5 h-5 mr-2" />
                Instagramに接続
              </>
            )}
          </button>
        </form>

        <div className="mt-6 p-4 bg-gray-700/50 rounded-lg">
          <h4 className="text-sm font-semibold text-gray-300 mb-2">注意事項</h4>
          <ul className="text-xs text-gray-400 space-y-1">
            <li>• Instagram Business Accountが必要です</li>
            <li>• Facebook開発者アカウントが必要です</li>
            <li>• アクセストークンは安全に管理してください</li>
            <li>• 投稿は自動的にInstagramに公開されます</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default InstagramConnect;
