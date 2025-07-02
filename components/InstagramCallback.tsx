import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/auth";

const InstagramCallback: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [status, setStatus] = useState("認証処理中...");

  useEffect(() => {
    const fetchAndSaveInstagramToken = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      if (!code || !user) {
        setStatus("認証コードまたはユーザー情報が見つかりません。");
        return;
      }
      try {
        // 1. codeからアクセストークン取得
        const clientId = import.meta.env.VITE_FB_APP_ID;
        const clientSecret = import.meta.env.VITE_FB_APP_SECRET;
        const redirectUri = window.location.origin + "/instagram-callback";
        const tokenRes = await fetch(
          `https://graph.facebook.com/v18.0/oauth/access_token?client_id=${clientId}&redirect_uri=${encodeURIComponent(
            redirectUri
          )}&client_secret=${clientSecret}&code=${code}`
        );
        const tokenData = await tokenRes.json();
        if (!tokenData.access_token) throw new Error("アクセストークン取得失敗: " + JSON.stringify(tokenData));
        const accessToken = tokenData.access_token;
        const expiresIn = tokenData.expires_in || 60 * 60 * 24 * 60; // 60日(秒)デフォルト
        const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

        // 2. ユーザーのビジネスアカウントID取得
        // 2-1. ユーザーのFacebookページ一覧取得
        const pagesRes = await fetch(`https://graph.facebook.com/v18.0/me/accounts?access_token=${accessToken}`);
        const pagesData = await pagesRes.json();
        if (!pagesData.data || pagesData.data.length === 0) throw new Error("Facebookページが見つかりません");
        const pageId = pagesData.data[0].id;

        // 2-2. ページに紐づくInstagramビジネスアカウントID取得
        const igRes = await fetch(
          `https://graph.facebook.com/v18.0/${pageId}?fields=instagram_business_account&access_token=${accessToken}`
        );
        const igData = await igRes.json();
        const instagramBusinessAccountId = igData.instagram_business_account?.id;
        if (!instagramBusinessAccountId) throw new Error("InstagramビジネスアカウントIDが見つかりません");

        // 3. Supabaseに保存
        const { error } = await supabase
          .from("users")
          .update({
            instagram_access_token: accessToken,
            instagram_business_account_id: instagramBusinessAccountId,
            instagram_token_expires_at: expiresAt,
          })
          .eq("id", user.id);
        if (error) throw error;

        setStatus("Instagram連携が完了しました。自動的にリダイレクトします...");
        setTimeout(() => navigate("/"), 2000);
      } catch (err: any) {
        setStatus("連携エラー: " + (err.message || String(err)));
      }
    };
    fetchAndSaveInstagramToken();
  }, [navigate, user]);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white">
      <h1 className="text-2xl font-bold mb-4">Instagram連携</h1>
      <p>{status}</p>
    </div>
  );
};

export default InstagramCallback;
