import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./lib/auth";
import Sidebar from "./components/Sidebar";
import PostEditor from "./components/PostEditor";
import CalendarView from "./components/CalendarView";
import BrandKitAnalyzer from "./components/BrandKitAnalyzer";
import SettingsPage from "./components/SettingsPage";
import LoginPage from "./components/LoginPage";
import Dashboard from "./components/Dashboard";
import AnalyticsPage from "./components/AnalyticsPage";
import TrendAnalysisPage from "./components/TrendAnalysisPage";
import InstagramCallback from "./components/InstagramCallback";
import { Page, Post, InstagramAccount, PostStatus, PostType } from "./types";
import { MOCK_ACCOUNT } from "./constants";
import { fetchPosts, createPost, updatePost } from "./services/postService";
import { initializeScheduler, getSchedulerService } from "./services/schedulerService";

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const AppRoutes = () => {
  const { user } = useAuth();
  const [activePage, setActivePage] = React.useState<Page>(Page.Editor);
  const [posts, setPosts] = React.useState<Post[]>([]);
  const [account] = React.useState<InstagramAccount>(MOCK_ACCOUNT);
  const [postToEdit, setPostToEdit] = React.useState<Post | undefined>(undefined);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!user) return;
    setLoading(true);
    fetchPosts(user.id)
      .then((data) => setPosts(data || []))
      .finally(() => setLoading(false));
  }, [user]);

  React.useEffect(() => {
    initializeScheduler();
    // Supabaseからpendingスケジュールを復元
    const service = getSchedulerService();
    service.initFromSupabase();
    return () => {
      // コンポーネントアンマウント時にスケジューラーを停止
      // 実際のアプリでは、アプリ全体でスケジューラーを管理する
    };
  }, []);

  const handleSavePost = async (post: Post) => {
    setLoading(true);
    try {
      let saved: Post;
      if (post.id) {
        saved = await updatePost(post.id, post);
        setPosts((prev) => prev.map((p) => (p.id === post.id ? saved : p)));
      } else {
        saved = await createPost({ ...post, user_id: user.id });
        setPosts((prev) => [saved, ...prev]);
      }

      // スケジュール投稿の場合、スケジューラーに追加
      if (saved.scheduledAt && saved.status === PostStatus.Scheduled) {
        const schedulerService = getSchedulerService();
        schedulerService.addScheduledPost(saved);
      }

      setPostToEdit(undefined);
      setActivePage(Page.Calendar);
    } finally {
      setLoading(false);
    }
  };

  const handleEditPost = (post: Post) => {
    setPostToEdit(post);
    setActivePage(Page.Editor);
  };

  const handleNewPost = () => {
    setPostToEdit(undefined);
    setActivePage(Page.Editor);
  };

  const handleGenerateTrendBasedPost = (content: {
    caption: string;
    hashtags: string[];
    visualStyle: string;
    postingTime: number;
  }) => {
    const newPost: Post = {
      id: `post_${Date.now()}`,
      type: PostType.Feed,
      status: PostStatus.Draft,
      caption: content.caption,
      mediaUrl: "",
      scheduledAt: new Date(Date.now() + content.postingTime * 60 * 60 * 1000),
      postedAt: null,
      account: account,
    };
    setPostToEdit(newPost);
    setActivePage(Page.Editor);
  };

  if (loading) return <div className="text-white p-8">Loading...</div>;

  return (
    <div className="flex h-screen bg-gray-900">
      <Sidebar activePage={activePage} onPageChange={setActivePage} />
      <main className="flex-1 lg:ml-64 overflow-hidden">
        <div className="h-full overflow-y-auto">
          {activePage === Page.Dashboard && <Dashboard posts={posts} />}
          {activePage === Page.Editor && <PostEditor onSave={handleSavePost} postToEdit={postToEdit} />}
          {activePage === Page.Calendar && (
            <CalendarView posts={posts} onDateClick={handleNewPost} onPostClick={handleEditPost} />
          )}
          {activePage === Page.BrandKit && <BrandKitAnalyzer />}
          {activePage === Page.Analytics && <AnalyticsPage posts={posts} />}
          {activePage === Page.TrendAnalysis && <TrendAnalysisPage onGeneratePost={handleGenerateTrendBasedPost} />}
          {activePage === Page.Settings && <SettingsPage />}
        </div>
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/instagram-callback" element={<InstagramCallback />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <AppRoutes />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
