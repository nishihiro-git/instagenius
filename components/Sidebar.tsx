import React, { useState, useEffect } from "react";
import { Page } from "../types";
import { ICONS, PAGE_NAMES } from "../constants";
import { useAuth } from "../lib/auth";
import { getNotificationService } from "../services/notificationService";
import NotificationCenter from "./NotificationCenter";

interface SidebarProps {
  activePage: Page;
  onPageChange: (page: Page) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activePage, onPageChange }) => {
  const { user, signOut } = useAuth();
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const notificationService = getNotificationService();

  useEffect(() => {
    const updateUnreadCount = () => {
      const unread = notificationService.getUnreadNotifications();
      setUnreadCount(unread.length);
    };

    updateUnreadCount();
    const interval = setInterval(updateUnreadCount, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("サインアウトエラー:", error);
    }
  };

  const handlePageChange = (page: Page) => {
    onPageChange(page);
    setIsMobileMenuOpen(false);
  };

  // ページのキー名リスト
  const pageKeys = ["Dashboard", "Editor", "Calendar", "BrandKit", "Analytics", "TrendAnalysis", "Settings"];

  return (
    <>
      {/* モバイルハンバーガーメニュー */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 bg-gray-800 rounded-lg text-white hover:bg-gray-700"
        >
          <ICONS.Dashboard className="w-6 h-6" />
        </button>
      </div>

      {/* モバイルオーバーレイ */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* サイドバー */}
      <div
        className={`
        fixed top-0 left-0 h-full bg-gray-900 shadow-2xl z-50 transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        w-64 lg:w-64
      `}
      >
        {/* ヘッダー */}
        <div className="p-4 lg:p-6 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl lg:text-2xl font-bold text-white">InstaGenius</h1>
              <p className="text-gray-400 text-xs lg:text-sm mt-1">AI-powered Instagram Manager</p>
            </div>
            <button onClick={() => setIsMobileMenuOpen(false)} className="lg:hidden p-2 text-gray-400 hover:text-white">
              <ICONS.X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ナビゲーション */}
        <nav className="flex-1 p-2 lg:p-4">
          <ul className="space-y-1 lg:space-y-2">
            {pageKeys.map((key) => (
              <li key={key}>
                <button
                  onClick={() => handlePageChange(Page[key as keyof typeof Page])}
                  className={`w-full flex items-center space-x-2 lg:space-x-3 px-3 lg:px-4 py-2 lg:py-3 rounded-lg transition-colors text-sm lg:text-base ${
                    activePage === Page[key as keyof typeof Page]
                      ? "bg-purple-600 text-white"
                      : "text-gray-300 hover:bg-gray-800 hover:text-white"
                  }`}
                >
                  {React.createElement(ICONS[key as keyof typeof ICONS], { className: "w-4 h-4 lg:w-5 lg:h-5" })}
                  <span className="truncate">{PAGE_NAMES[Page[key as keyof typeof Page]]}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* 通知ボタン */}
        <div className="p-2 lg:p-4 border-t border-gray-700">
          <button
            onClick={() => setShowNotificationCenter(true)}
            className="w-full flex items-center justify-between px-3 lg:px-4 py-2 lg:py-3 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-colors text-sm lg:text-base"
          >
            <div className="flex items-center space-x-2 lg:space-x-3">
              <ICONS.Settings className="w-4 h-4 lg:w-5 lg:h-5" />
              <span>通知</span>
            </div>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs rounded-full px-1.5 lg:px-2 py-0.5 lg:py-1 min-w-[16px] lg:min-w-[20px] text-center">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>
        </div>

        {/* ユーザー情報 */}
        <div className="p-2 lg:p-4 border-t border-gray-700">
          <div className="flex items-center space-x-2 lg:space-x-3 mb-2 lg:mb-3">
            <img
              src={user?.user_metadata?.avatar_url || "https://picsum.photos/seed/avatar/40/40"}
              alt="Avatar"
              className="w-8 h-8 lg:w-10 lg:h-10 rounded-full"
            />
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium truncate text-sm lg:text-base">
                {user?.user_metadata?.full_name || user?.email || "ユーザー"}
              </p>
              <p className="text-gray-400 text-xs lg:text-sm truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center space-x-2 lg:space-x-3 px-3 lg:px-4 py-2 lg:py-3 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-colors text-sm lg:text-base"
          >
            <ICONS.Logout className="w-4 h-4 lg:w-5 lg:h-5" />
            <span>ログアウト</span>
          </button>
        </div>
      </div>

      {/* 通知センター */}
      <NotificationCenter isOpen={showNotificationCenter} onClose={() => setShowNotificationCenter(false)} />
    </>
  );
};

export default Sidebar;
