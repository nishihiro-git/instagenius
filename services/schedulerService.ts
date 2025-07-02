import { Post, PostStatus } from "../types";
import { PostType } from "../types";
import { updatePost } from "./postService";
import { supabase } from "../lib/supabase";

interface ScheduledPost {
  id: string;
  post: Post;
  scheduledTime: Date;
  status: "pending" | "processing" | "completed" | "failed";
}

class SchedulerService {
  private scheduledPosts: Map<string, ScheduledPost> = new Map();
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;

  // Supabaseからpendingなスケジュールを復元
  async initFromSupabase() {
    const { data, error } = await supabase
      .from("scheduled_posts")
      .select("id, user_id, caption, media_url, scheduled_at, status")
      .eq("status", "pending");
    if (error) {
      console.error("スケジュール復元エラー:", error);
      return;
    }
    for (const row of data) {
      this.addScheduledPostFromDb(row);
    }
    console.log(`Supabaseから${data.length}件のスケジュールを復元しました`);
  }

  // DBレコードからスケジュール追加
  addScheduledPostFromDb(row: any): void {
    if (!row.scheduled_at) return;
    const scheduledPost: ScheduledPost = {
      id: row.id,
      post: {
        id: row.id,
        caption: row.caption,
        mediaUrl: row.media_url,
        scheduledAt: new Date(row.scheduled_at),
        status: PostStatus.Scheduled,
        type: PostType.Feed,
        account: { id: row.user_id, username: "", avatarUrl: "" },
        postedAt: null,
      },
      scheduledTime: new Date(row.scheduled_at),
      status: row.status,
    };
    this.scheduledPosts.set(row.id, scheduledPost);
  }

  // スケジュール投稿を追加
  addScheduledPost(post: Post): void {
    if (!post.scheduledAt) return;

    const scheduledPost: ScheduledPost = {
      id: post.id,
      post,
      scheduledTime: post.scheduledAt,
      status: "pending",
    };

    this.scheduledPosts.set(post.id, scheduledPost);
    console.log(`投稿をスケジュールしました: ${post.id} at ${post.scheduledAt}`);
  }

  // スケジュール投稿を削除
  removeScheduledPost(postId: string): void {
    this.scheduledPosts.delete(postId);
    console.log(`スケジュール投稿を削除しました: ${postId}`);
  }

  // スケジューラーを開始
  start(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    this.intervalId = setInterval(() => {
      this.checkScheduledPosts();
    }, 60000); // 1分ごとにチェック

    console.log("スケジューラーを開始しました");
  }

  // スケジューラーを停止
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log("スケジューラーを停止しました");
  }

  // スケジュール投稿をチェック
  private async checkScheduledPosts(): Promise<void> {
    const now = new Date();
    const postsToProcess: ScheduledPost[] = [];

    // 実行時刻が来た投稿を収集
    for (const [, scheduledPost] of this.scheduledPosts) {
      if (scheduledPost.status === "pending" && scheduledPost.scheduledTime <= now) {
        postsToProcess.push(scheduledPost);
      }
    }

    // 投稿を処理
    for (const scheduledPost of postsToProcess) {
      await this.processScheduledPost(scheduledPost);
    }
  }

  // スケジュール投稿を処理
  private async processScheduledPost(scheduledPost: ScheduledPost): Promise<void> {
    const { post } = scheduledPost;

    try {
      // ステータスを処理中に更新
      scheduledPost.status = "processing";
      await updatePost(post.id, { status: PostStatus.Review });

      // 成功時
      scheduledPost.status = "completed";
      await updatePost(post.id, {
        status: PostStatus.Posted,
        postedAt: new Date(),
      });
      await supabase
        .from("scheduled_posts")
        .update({ status: "success", posted_at: new Date().toISOString() })
        .eq("id", scheduledPost.id);

      console.log(`投稿が完了しました: ${post.id}`);
    } catch (error) {
      // 失敗時
      scheduledPost.status = "failed";
      await updatePost(post.id, { status: PostStatus.Failed });
      await supabase
        .from("scheduled_posts")
        .update({ status: "failed", error_message: String(error) })
        .eq("id", scheduledPost.id);

      console.error(`投稿に失敗しました: ${post.id}`, error);
    } finally {
      // 処理完了後はスケジュールから削除
      this.removeScheduledPost(post.id);
    }
  }

  // スケジュール済み投稿一覧を取得
  getScheduledPosts(): ScheduledPost[] {
    return Array.from(this.scheduledPosts.values());
  }

  // 特定の投稿のスケジュール状態を取得
  getScheduledPost(postId: string): ScheduledPost | undefined {
    return this.scheduledPosts.get(postId);
  }

  // スケジューラーの状態を取得
  isSchedulerRunning(): boolean {
    return this.isRunning;
  }
}

// シングルトンインスタンス
let schedulerService: SchedulerService | null = null;

export const getSchedulerService = (): SchedulerService => {
  if (!schedulerService) {
    schedulerService = new SchedulerService();
  }
  return schedulerService;
};

export const initializeScheduler = (): void => {
  const service = getSchedulerService();
  service.start();
};

export const stopScheduler = (): void => {
  if (schedulerService) {
    schedulerService.stop();
  }
};
