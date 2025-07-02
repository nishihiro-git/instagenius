interface InstagramConfig {
  accessToken: string;
  instagramBusinessAccountId: string;
}

interface PostToInstagramParams {
  caption: string;
  mediaUrl: string;
  scheduledTime?: Date;
}

export class InstagramService {
  private accessToken: string;
  private instagramBusinessAccountId: string;
  private baseUrl = "https://graph.facebook.com/v18.0";

  constructor(config: InstagramConfig) {
    this.accessToken = config.accessToken;
    this.instagramBusinessAccountId = config.instagramBusinessAccountId;
  }

  // メディアをアップロード
  private async uploadMedia(mediaUrl: string, caption?: string): Promise<string> {
    const formData = new FormData();
    formData.append("access_token", this.accessToken);
    formData.append("image_url", mediaUrl);
    if (caption) {
      formData.append("caption", caption);
    }

    const response = await fetch(`${this.baseUrl}/${this.instagramBusinessAccountId}/media`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Failed to upload media: ${response.statusText}`);
    }

    const data = await response.json();
    return data.id;
  }

  // 投稿を公開
  private async publishPost(mediaId: string): Promise<string> {
    const formData = new FormData();
    formData.append("access_token", this.accessToken);
    formData.append("creation_id", mediaId);

    const response = await fetch(`${this.baseUrl}/${this.instagramBusinessAccountId}/media_publish`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Failed to publish post: ${response.statusText}`);
    }

    const data = await response.json();
    return data.id;
  }

  // スケジュール投稿を作成
  private async createScheduledPost(mediaId: string, scheduledTime: Date): Promise<string> {
    const formData = new FormData();
    formData.append("access_token", this.accessToken);
    formData.append("creation_id", mediaId);
    formData.append("published", "false");
    formData.append("scheduled_publish_time", Math.floor(scheduledTime.getTime() / 1000).toString());

    const response = await fetch(`${this.baseUrl}/${this.instagramBusinessAccountId}/media_publish`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Failed to schedule post: ${response.statusText}`);
    }

    const data = await response.json();
    return data.id;
  }

  // 投稿を実行（即座またはスケジュール）
  async postToInstagram(params: PostToInstagramParams): Promise<string> {
    try {
      // 1. メディアをアップロード
      const mediaId = await this.uploadMedia(params.mediaUrl);

      // 2. 投稿を公開またはスケジュール
      if (params.scheduledTime && params.scheduledTime > new Date()) {
        // スケジュール投稿
        return await this.createScheduledPost(mediaId, params.scheduledTime);
      } else {
        // 即座投稿
        return await this.publishPost(mediaId);
      }
    } catch (error) {
      console.error("Instagram posting error:", error);
      throw new Error(`Instagram投稿に失敗しました: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }
}
