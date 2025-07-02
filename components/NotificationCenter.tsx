import React, { useState, useEffect } from "react";
import { getNotificationService, Notification, NotificationSettings } from "../services/notificationService";
import { ICONS } from "../constants";

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ isOpen, onClose }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const notificationService = getNotificationService();

  useEffect(() => {
    if (isOpen) {
      setNotifications(notificationService.getNotifications());
      setSettings(notificationService.getSettings());
    }
  }, [isOpen]);

  const handleMarkAsRead = (notificationId: string) => {
    notificationService.markAsRead(notificationId);
    setNotifications(notificationService.getNotifications());
  };

  const handleMarkAllAsRead = () => {
    notificationService.markAllAsRead();
    setNotifications(notificationService.getNotifications());
  };

  const handleDeleteNotification = (notificationId: string) => {
    notificationService.deleteNotification(notificationId);
    setNotifications(notificationService.getNotifications());
  };

  const handleClearAll = () => {
    notificationService.clearAllNotifications();
    setNotifications([]);
  };

  const handleSettingChange = (key: keyof NotificationSettings, value: boolean) => {
    if (!settings) return;

    const newSettings = { ...settings, [key]: value };
    notificationService.updateSettings(newSettings);
    setSettings(newSettings);
  };

  const handleRequestPermission = async () => {
    await notificationService.requestBrowserNotificationPermission();
    setSettings(notificationService.getSettings());
  };

  const getNotificationIcon = (type: Notification["type"]) => {
    switch (type) {
      case "success":
        return <ICONS.Check className="w-5 h-5 text-green-400" />;
      case "error":
        return <ICONS.X className="w-5 h-5 text-red-400" />;
      case "warning":
        return <ICONS.Magic className="w-5 h-5 text-yellow-400" />;
      case "info":
        return <ICONS.Analytics className="w-5 h-5 text-blue-400" />;
      default:
        return <ICONS.Analytics className="w-5 h-5 text-gray-400" />;
    }
  };

  const formatTime = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return "今";
    if (minutes < 60) return `${minutes}分前`;
    if (hours < 24) return `${hours}時間前`;
    return `${days}日前`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-gray-900 rounded-lg shadow-xl w-full max-w-md max-h-[80vh] flex flex-col">
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">通知</h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800"
            >
              <ICONS.Settings className="w-5 h-5" />
            </button>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800">
              <ICONS.X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 設定パネル */}
        {showSettings && settings && (
          <div className="p-4 border-b border-gray-700 bg-gray-800">
            <h3 className="text-lg font-semibold text-white mb-3">通知設定</h3>
            <div className="space-y-3">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={settings.postCompleted}
                  onChange={(e) => handleSettingChange("postCompleted", e.target.checked)}
                  className="rounded text-purple-600"
                />
                <span className="text-white">投稿完了通知</span>
              </label>
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={settings.postScheduled}
                  onChange={(e) => handleSettingChange("postScheduled", e.target.checked)}
                  className="rounded text-purple-600"
                />
                <span className="text-white">投稿スケジュール通知</span>
              </label>
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={settings.postError}
                  onChange={(e) => handleSettingChange("postError", e.target.checked)}
                  className="rounded text-purple-600"
                />
                <span className="text-white">投稿エラー通知</span>
              </label>
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={settings.browserNotifications}
                  onChange={(e) => handleSettingChange("browserNotifications", e.target.checked)}
                  className="rounded text-purple-600"
                />
                <span className="text-white">ブラウザ通知</span>
              </label>
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={settings.toastNotifications}
                  onChange={(e) => handleSettingChange("toastNotifications", e.target.checked)}
                  className="rounded text-purple-600"
                />
                <span className="text-white">トースト通知</span>
              </label>
              <button
                onClick={handleRequestPermission}
                className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700"
              >
                ブラウザ通知を許可
              </button>
            </div>
          </div>
        )}

        {/* 通知一覧 */}
        <div className="flex-1 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <ICONS.Settings className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>通知はありません</p>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 rounded-lg border ${
                    notification.read ? "bg-gray-800 border-gray-700" : "bg-gray-700 border-purple-500"
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    {getNotificationIcon(notification.type)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-white text-sm">{notification.title}</h4>
                        <span className="text-xs text-gray-400">{formatTime(notification.timestamp)}</span>
                      </div>
                      <p className="text-sm text-gray-300 mt-1">{notification.message}</p>
                      {notification.action && (
                        <button
                          onClick={notification.action.onClick}
                          className="text-purple-400 hover:text-purple-300 text-sm mt-2"
                        >
                          {notification.action.label}
                        </button>
                      )}
                    </div>
                    <div className="flex flex-col space-y-1">
                      {!notification.read && (
                        <button
                          onClick={() => handleMarkAsRead(notification.id)}
                          className="p-1 text-gray-400 hover:text-white"
                          title="既読にする"
                        >
                          <ICONS.Check className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteNotification(notification.id)}
                        className="p-1 text-gray-400 hover:text-red-400"
                        title="削除"
                      >
                        <ICONS.X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* フッター */}
        {notifications.length > 0 && (
          <div className="p-4 border-t border-gray-700 flex justify-between">
            <button onClick={handleMarkAllAsRead} className="text-purple-400 hover:text-purple-300 text-sm">
              全て既読にする
            </button>
            <button onClick={handleClearAll} className="text-red-400 hover:text-red-300 text-sm">
              全て削除
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationCenter;
