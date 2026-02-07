import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { posts } from '@/lib/db/schema';
import { eq, and, gte, sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');

    if (!workspaceId) {
      return NextResponse.json({ error: 'Workspace ID required' }, { status: 400 });
    }

    // Get all posts for this workspace
    const allPosts = await db.query.posts.findMany({
      where: and(eq(posts.workspaceId, workspaceId), eq(posts.userId, session.user.id)),
    });

    // Calculate statistics
    const totalPosts = allPosts.length;
    const scheduledPosts = allPosts.filter((p) => p.status === 'scheduled').length;
    const publishedPosts = allPosts.filter((p) => p.status === 'published').length;
    const draftPosts = allPosts.filter((p) => p.status === 'draft').length;

    // Posts by platform
    const platformStats: Record<string, number> = {};
    allPosts.forEach((post) => {
      const platforms = post.platforms as string[];
      platforms.forEach((platform) => {
        platformStats[platform] = (platformStats[platform] || 0) + 1;
      });
    });

    // Posts by month (last 6 months)
    const monthlyStats = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = date.toLocaleDateString('en-US', { month: 'short' });
      const year = date.getFullYear();
      const month = date.getMonth();

      const count = allPosts.filter((post) => {
        if (!post.createdAt) return false;
        const postDate = new Date(post.createdAt);
        return postDate.getMonth() === month && postDate.getFullYear() === year;
      }).length;

      monthlyStats.push({
        month: monthName,
        posts: count,
      });
    }

    // Posts by status over time
    const statusOverTime = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = date.toLocaleDateString('en-US', { month: 'short' });
      const year = date.getFullYear();
      const month = date.getMonth();

      const monthPosts = allPosts.filter((post) => {
        if (!post.createdAt) return false;
        const postDate = new Date(post.createdAt);
        return postDate.getMonth() === month && postDate.getFullYear() === year;
      });

      statusOverTime.push({
        month: monthName,
        draft: monthPosts.filter((p) => p.status === 'draft').length,
        scheduled: monthPosts.filter((p) => p.status === 'scheduled').length,
        published: monthPosts.filter((p) => p.status === 'published').length,
      });
    }

    // Most active posting days
    const dayStats: Record<string, number> = {
      Sunday: 0,
      Monday: 0,
      Tuesday: 0,
      Wednesday: 0,
      Thursday: 0,
      Friday: 0,
      Saturday: 0,
    };

    allPosts.forEach((post) => {
      const dateValue = post.scheduledAt || post.createdAt;
      if (!dateValue) return;
      const date = new Date(dateValue);
      const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
      dayStats[dayName]++;
    });

    // Posts with media vs without
    const postsWithMedia = allPosts.filter(
      (p) => p.mediaUrls && Array.isArray(p.mediaUrls) && p.mediaUrls.length > 0
    ).length;
    const postsWithoutMedia = totalPosts - postsWithMedia;

    // Average hashtags per post
    const totalHashtags = allPosts.reduce((sum, post) => {
      const hashtags = post.hashtags || [];
      return sum + (Array.isArray(hashtags) ? hashtags.length : 0);
    }, 0);
    const avgHashtags = totalPosts > 0 ? (totalHashtags / totalPosts).toFixed(1) : 0;

    // AI generated vs manual
    const aiGeneratedPosts = allPosts.filter((p) => p.aiGenerated).length;
    const manualPosts = totalPosts - aiGeneratedPosts;

    return NextResponse.json({
      overview: {
        totalPosts,
        scheduledPosts,
        publishedPosts,
        draftPosts,
        postsWithMedia,
        postsWithoutMedia,
        avgHashtags,
        aiGeneratedPosts,
        manualPosts,
      },
      platformStats: Object.entries(platformStats).map(([platform, count]) => ({
        platform,
        count,
      })),
      monthlyStats,
      statusOverTime,
      dayStats: Object.entries(dayStats).map(([day, count]) => ({
        day,
        posts: count,
      })),
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}