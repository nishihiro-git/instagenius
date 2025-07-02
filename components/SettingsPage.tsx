import React, { useState } from "react";
import { useAuth } from "../lib/auth";
import { fetchOpenAIApiKey, saveOpenAIApiKey } from "../services/postService";
import { supabase } from "../lib/supabase";

const ToggleSwitch: React.FC<{ label: string; enabled: boolean; onToggle: () => void }> = ({
  label,
  enabled,
  onToggle,
}) => (
  <div className="flex items-center justify-between">
    <span className="text-gray-300">{label}</span>
    <button
      onClick={onToggle}
      className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${
        enabled ? "bg-purple-600" : "bg-gray-600"
      }`}
    >
      <span
        className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${
          enabled ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  </div>
);

const getInstagramAuthUrl = () => {
  const clientId = import.meta.env.VITE_FB_APP_ID;
  const redirectUri = encodeURIComponent(window.location.origin + "/instagram-callback");
  const scope = "instagram_basic,instagram_content_publish,pages_show_list,pages_read_engagement";
  const responseType = "code";
  return `https://www.facebook.com/v18.0/dialog/oauth?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&response_type=${responseType}`;
};

const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState({
    reminders: true,
    approvals: true,
    failures: false,
  });
  const [isLoadingApiKey, setIsLoadingApiKey] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [apiKeySaved, setApiKeySaved] = useState(false);
  const [apiKeyError, setApiKeyError] = useState("");
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [instagramAccount, setInstagramAccount] = useState<any>(null);
  const [isLoadingAccount, setIsLoadingAccount] = useState(true);

  React.useEffect(() => {
    if (user?.id) {
      setIsLoadingApiKey(true);
      fetchOpenAIApiKey(user.id)
        .then((key) => {
          setApiKey(key || "");
        })
        .catch(() => setApiKeyError("APIキーの取得に失敗しました。"))
        .finally(() => setIsLoadingApiKey(false));

      setIsLoadingAccount(true);
      supabase
        .from("instagram_accounts")
        .select("*")
        .eq("user_id", user.id)
        .single()
        .then(({ data }) => {
          setInstagramAccount(data);
          setIsLoadingAccount(false);
        });
    }
  }, [user]);

  const handleToggle = (key: keyof typeof notifications) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleInstagramConnect = () => {
    window.location.href = getInstagramAuthUrl();
  };

  const handleInstagramDisconnect = async () => {
    if (!user?.id) return;
    setIsDisconnecting(true);
    await supabase.from("instagram_accounts").delete().eq("user_id", user.id);
    setInstagramAccount(null);
    setIsDisconnecting(false);
  };

  const handleApiKeySave = async () => {
    if (!user?.id) return;
    setIsLoadingApiKey(true);
    setApiKeyError("");
    try {
      await saveOpenAIApiKey(user.id, apiKey);
      setApiKeySaved(true);
      setTimeout(() => setApiKeySaved(false), 2000);
    } catch (e) {
      setApiKeyError("APIキーの保存に失敗しました。");
    } finally {
      setIsLoadingApiKey(false);
    }
  };

  return (
    <div className="p-6 bg-gray-800/50 rounded-lg h-full overflow-y-auto">
      <h2 className="text-2xl font-bold text-white mb-6">設定</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Connected Accounts */}
        <div className="bg-gray-800 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-white mb-4">Instagram連携</h3>
          <div className="space-y-4">
            {isLoadingAccount ? (
              <div className="text-gray-400">読み込み中...</div>
            ) : instagramAccount ? (
              <div className="flex items-center justify-between p-3 bg-gray-700 rounded-md">
                <div className="flex items-center">
                  <img
                    src={instagramAccount.avatar_url || "https://placehold.co/40x40?text=IG"}
                    alt="avatar"
                    className="w-10 h-10 rounded-full"
                  />
                  <div className="ml-3">
                    <p className="font-semibold text-white">{instagramAccount.username}</p>
                    <p className="text-sm text-green-400">連携済み</p>
                  </div>
                </div>
                <button
                  className="text-sm text-red-400 hover:text-red-300 disabled:opacity-50"
                  onClick={handleInstagramDisconnect}
                  disabled={isDisconnecting}
                >
                  {isDisconnecting ? "解除中..." : "連携解除"}
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between p-3 bg-gray-700 rounded-md">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center text-gray-400">
                    ?
                  </div>
                  <div className="ml-3">
                    <p className="font-semibold text-white">未連携</p>
                    <p className="text-sm text-red-400">Instagramアカウント未連携</p>
                  </div>
                </div>
                <button className="text-sm text-purple-400 hover:text-purple-300" onClick={handleInstagramConnect}>
                  Instagramアカウントを連携
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-gray-800 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-white mb-4">通知</h3>
          <div className="space-y-4">
            <ToggleSwitch
              label="投稿リマインダー"
              enabled={notifications.reminders}
              onToggle={() => handleToggle("reminders")}
            />
            <ToggleSwitch
              label="承認リクエスト"
              enabled={notifications.approvals}
              onToggle={() => handleToggle("approvals")}
            />
            <ToggleSwitch
              label="投稿失敗アラート"
              enabled={notifications.failures}
              onToggle={() => handleToggle("failures")}
            />
          </div>
          <div className="mt-6">
            <label htmlFor="slack-webhook" className="block text-sm font-medium text-gray-300 mb-2">
              Slack Webhook URL
            </label>
            <input
              type="text"
              id="slack-webhook"
              placeholder="https://hooks.slack.com/services/..."
              className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-sm focus:ring-purple-500 focus:border-purple-500"
            />
          </div>
        </div>

        {/* API Keys */}
        <div className="bg-gray-800 p-6 rounded-lg col-span-1 md:col-span-2">
          <h3 className="text-lg font-semibold text-white mb-4">OpenAI APIキー設定</h3>
          <p className="text-sm text-gray-400 mb-4">
            OpenAI APIキーを登録すると、あなた自身のAPIキーでAI機能を利用できます。
            <br />
            <a
              href="https://platform.openai.com/account/api-keys"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 underline"
            >
              OpenAIのAPIキーを取得する
            </a>
          </p>
          <div className="flex items-center gap-4 bg-gray-700/50 p-4 rounded-md">
            <input
              type="password"
              className="flex-1 bg-gray-800 border border-gray-600 rounded-md p-2 text-sm text-white focus:ring-purple-500 focus:border-purple-500"
              placeholder="sk-..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              disabled={isLoadingApiKey}
            />
            <button
              onClick={handleApiKeySave}
              disabled={isLoadingApiKey || !apiKey}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
            >
              {isLoadingApiKey ? "保存中..." : "保存"}
            </button>
            {apiKeySaved && <span className="text-green-400 ml-2">保存済み</span>}
            {apiKeyError && <span className="text-red-400 ml-2">{apiKeyError}</span>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
