export enum Page {
  Dashboard = "Dashboard",
  Editor = "Editor",
  Calendar = "Calendar",
  BrandKit = "Brand Kit",
  Settings = "Settings",
  Analytics = "Analytics",
  TrendAnalysis = "Trend Analysis",
}

export enum PostStatus {
  Draft = "Draft",
  Review = "In Review",
  Approved = "Approved",
  Scheduled = "Scheduled",
  Posted = "Posted",
  Failed = "Failed",
}

export enum PostType {
  Feed = "Feed",
  Reel = "Reel",
}

export interface Post {
  id: string;
  type: PostType;
  status: PostStatus;
  caption: string;
  mediaUrl: string; // Base64 or blob URL for local preview
  scheduledAt: Date | null;
  postedAt: Date | null;
  account: InstagramAccount;
}

export interface InstagramAccount {
  id: string;
  username: string;
  avatarUrl: string;
}

export interface BrandKit {
  primaryColors: string[];
  secondaryColors: string[];
  analyzedImages: string[];
}
