export interface NotificationSettings {
  postCompleted: boolean;
  postScheduled: boolean;
  postError: boolean;
  analyticsUpdate: boolean;
  browserNotifications: boolean;
  toastNotifications: boolean;
}

export interface Notification {
  id: string;
  type: "success" | "error" | "warning" | "info";
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}

class NotificationService {
  private notifications: Notification[] = [];
  private settings: NotificationSettings = {
    postCompleted: true,
    postScheduled: true,
    postError: true,
    analyticsUpdate: true,
    browserNotifications: true,
    toastNotifications: true,
  };

  // 通知を追加
  addNotification(notification: Omit<Notification, "id" | "timestamp" | "read">): void {
    const newNotification: Notification = {
      ...notification,
      id: `notification_${Date.now()}_${Math.random()}`,
      timestamp: new Date(),
      read: false,
    };

    this.notifications.unshift(newNotification);
    this.showNotification(newNotification);
  }

  // 通知を表示
  private showNotification(notification: Notification): void {
    // ブラウザ通知
    if (this.settings.browserNotifications && "Notification" in window) {
      if (Notification.permission === "granted") {
        new Notification(notification.title, {
          body: notification.message,
          icon: "/favicon.ico",
        });
      } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then((permission) => {
          if (permission === "granted") {
            new Notification(notification.title, {
              body: notification.message,
              icon: "/favicon.ico",
            });
          }
        });
      }
    }

    // トースト通知
    if (this.settings.toastNotifications) {
      this.showToast(notification);
    }
  }

  // トースト表示
  private showToast(notification: Notification): void {
    const toast = document.createElement("div");
    toast.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm transform transition-all duration-300 translate-x-full`;

    const bgColor = {
      success: "bg-green-600",
      error: "bg-red-600",
      warning: "bg-yellow-600",
      info: "bg-blue-600",
    }[notification.type];

    toast.className += ` ${bgColor} text-white`;

    toast.innerHTML = `
      <div class="flex items-start">
        <div class="flex-1">
          <h4 class="font-semibold">${notification.title}</h4>
          <p class="text-sm opacity-90">${notification.message}</p>
        </div>
        <button class="ml-2 text-white opacity-70 hover:opacity-100" onclick="this.parentElement.parentElement.remove()">
          ×
        </button>
      </div>
    `;

    document.body.appendChild(toast);

    // アニメーション
    setTimeout(() => {
      toast.classList.remove("translate-x-full");
    }, 100);

    // 自動削除
    setTimeout(() => {
      toast.classList.add("translate-x-full");
      setTimeout(() => {
        if (toast.parentElement) {
          toast.parentElement.removeChild(toast);
        }
      }, 300);
    }, 5000);
  }

  // 投稿完了通知
  notifyPostCompleted(postTitle: string): void {
    if (!this.settings.postCompleted) return;

    this.addNotification({
      type: "success",
      title: "投稿完了",
      message: `「${postTitle}」が正常に投稿されました`,
    });
  }

  // 投稿スケジュール通知
  notifyPostScheduled(postTitle: string, scheduledTime: Date): void {
    if (!this.settings.postScheduled) return;

    const timeStr = scheduledTime.toLocaleString("ja-JP");
    this.addNotification({
      type: "info",
      title: "投稿スケジュール",
      message: `「${postTitle}」が${timeStr}にスケジュールされました`,
    });
  }

  // 投稿エラー通知
  notifyPostError(postTitle: string, error: string): void {
    if (!this.settings.postError) return;

    this.addNotification({
      type: "error",
      title: "投稿エラー",
      message: `「${postTitle}」の投稿に失敗しました: ${error}`,
    });
  }

  // 分析更新通知
  notifyAnalyticsUpdate(): void {
    if (!this.settings.analyticsUpdate) return;

    this.addNotification({
      type: "info",
      title: "分析更新",
      message: "投稿分析データが更新されました",
    });
  }

  // 通知を取得
  getNotifications(): Notification[] {
    return this.notifications;
  }

  // 未読通知を取得
  getUnreadNotifications(): Notification[] {
    return this.notifications.filter((n) => !n.read);
  }

  // 通知を既読にする
  markAsRead(notificationId: string): void {
    const notification = this.notifications.find((n) => n.id === notificationId);
    if (notification) {
      notification.read = true;
    }
  }

  // 全通知を既読にする
  markAllAsRead(): void {
    this.notifications.forEach((n) => (n.read = true));
  }

  // 通知を削除
  deleteNotification(notificationId: string): void {
    this.notifications = this.notifications.filter((n) => n.id !== notificationId);
  }

  // 全通知を削除
  clearAllNotifications(): void {
    this.notifications = [];
  }

  // 設定を取得
  getSettings(): NotificationSettings {
    return { ...this.settings };
  }

  // 設定を更新
  updateSettings(settings: Partial<NotificationSettings>): void {
    this.settings = { ...this.settings, ...settings };
  }

  // ブラウザ通知の許可を要求
  async requestBrowserNotificationPermission(): Promise<boolean> {
    if (!("Notification" in window)) {
      return false;
    }

    if (Notification.permission === "granted") {
      return true;
    }

    if (Notification.permission === "denied") {
      return false;
    }

    const permission = await Notification.requestPermission();
    return permission === "granted";
  }
}

// シングルトンインスタンス
let notificationService: NotificationService | null = null;

export const getNotificationService = (): NotificationService => {
  if (!notificationService) {
    notificationService = new NotificationService();
  }
  return notificationService;
};
