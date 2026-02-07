export interface User {
  id: string;
  email: string;
  name: string;
  profileImageUrl?: string;
  subscriptionTier: 'free' | 'pro' | 'agency';
  aiCreditsRemaining: number;
}

export interface Workspace {
  id: string;
  userId: string;
  name: string;
  description?: string;
  avatarUrl?: string;
  createdAt: Date;
}

export interface Post {
  id: string;
  workspaceId: string;
  userId: string;
  content: string;
  platforms: string[];
  mediaUrls?: string[];
  scheduledAt?: Date;
  publishedAt?: Date;
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  aiGenerated: boolean;
  hashtags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface SocialAccount {
  id: string;
  workspaceId: string;
  platform: 'twitter' | 'linkedin' | 'facebook' | 'instagram';
  accountName?: string;
  accountHandle?: string;
  isConnected: boolean;
}