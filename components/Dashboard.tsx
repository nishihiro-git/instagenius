import React from "react";
import { Post, PostStatus, Page } from "../types";
import { ICONS, POST_STATUS_NAMES } from "../constants";

interface DashboardProps {
  posts: Post[];
  onPageChange?: (page: Page) => void;
  onPostClick?: (post: Post) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ posts, onPageChange, onPostClick }) => {
  const recentPosts = posts
    .filter((post) => post.status === PostStatus.Posted)
    .sort((a, b) => (b.postedAt?.getTime() || 0) - (a.postedAt?.getTime() || 0))
    .slice(0, 5);

  return (
    <div className="p-4 lg:p-8 bg-gray-900 min-h-screen">
      {/* ヘッダー */}
      <div className="mb-6 lg:mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">ダッシュボード</h1>
        <p className="text-gray-400">投稿の概要と統計情報</p>
      </div>

      {/* 統計カード */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6 lg:mb-8">
        <div className="bg-gray-800 p-4 lg:p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm lg:text-base text-gray-400">総投稿数</p>
              <p className="text-2xl lg:text-3xl font-bold text-white">{posts.length}</p>
            </div>
            <ICONS.Editor className="w-8 h-8 lg:w-10 lg:h-10 text-purple-400" />
          </div>
        </div>
        <div className="bg-gray-800 p-4 lg:p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm lg:text-base text-gray-400">予約済み</p>
              <p className="text-2xl lg:text-3xl font-bold text-white">
                {posts.filter((p) => p.status === PostStatus.Scheduled).length}
              </p>
            </div>
            <ICONS.Calendar className="w-8 h-8 lg:w-10 lg:h-10 text-blue-400" />
          </div>
        </div>
        <div className="bg-gray-800 p-4 lg:p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm lg:text-base text-gray-400">投稿済み</p>
              <p className="text-2xl lg:text-3xl font-bold text-white">
                {posts.filter((p) => p.status === PostStatus.Posted).length}
              </p>
            </div>
            <ICONS.Check className="w-8 h-8 lg:w-10 lg:h-10 text-green-400" />
          </div>
        </div>
        <div className="bg-gray-800 p-4 lg:p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm lg:text-base text-gray-400">下書き</p>
              <p className="text-2xl lg:text-3xl font-bold text-white">
                {posts.filter((p) => p.status === PostStatus.Draft).length}
              </p>
            </div>
            <ICONS.Editor className="w-8 h-8 lg:w-10 lg:h-10 text-yellow-400" />
          </div>
        </div>
      </div>

      {/* 最近の投稿 */}
      <div className="bg-gray-800 rounded-lg p-4 lg:p-6">
        <div className="flex items-center justify-between mb-4 lg:mb-6">
          <h2 className="text-xl lg:text-2xl font-bold text-white">最近の投稿</h2>
          {onPageChange && (
            <button
              onClick={() => onPageChange(Page.Editor)}
              className="bg-purple-600 text-white px-4 lg:px-6 py-2 lg:py-3 rounded-lg hover:bg-purple-700 transition-colors text-sm lg:text-base"
            >
              新規投稿
            </button>
          )}
        </div>
        <div className="space-y-3 lg:space-y-4">
          {recentPosts.map((post) => (
            <div
              key={post.id}
              className="flex items-center justify-between p-3 lg:p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors cursor-pointer"
              onClick={() => onPostClick?.(post)}
            >
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-white truncate text-sm lg:text-base">
                  {post.caption || "無題の投稿"}
                </h3>
                <p className="text-gray-400 text-xs lg:text-sm">
                  {post.scheduledAt
                    ? `予約: ${post.scheduledAt.toLocaleDateString("ja-JP")}`
                    : post.postedAt
                    ? `投稿: ${post.postedAt.toLocaleDateString("ja-JP")}`
                    : "下書き"}
                </p>
              </div>
              <div className="flex items-center space-x-2 lg:space-x-3">
                <span
                  className={`px-2 lg:px-3 py-1 rounded-full text-xs lg:text-sm font-medium ${
                    post.status === PostStatus.Posted
                      ? "bg-green-900 text-green-300"
                      : post.status === PostStatus.Scheduled
                      ? "bg-blue-900 text-blue-300"
                      : "bg-gray-600 text-gray-300"
                  }`}
                >
                  {POST_STATUS_NAMES[post.status]}
                </span>
                <ICONS.ChevronRight className="w-4 h-4 lg:w-5 lg:h-5 text-gray-400" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
