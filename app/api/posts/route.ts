import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { posts } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

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

    const userPosts = await db.query.posts.findMany({
      where: and(
        eq(posts.workspaceId, workspaceId),
        eq(posts.userId, session.user.id)
      ),
      orderBy: (posts, { desc }) => [desc(posts.createdAt)],
    });

    return NextResponse.json(userPosts);
  } catch (error) {
    console.error('Error fetching posts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { workspaceId, content, platforms, scheduledAt, status, hashtags, mediaUrls } =
      await request.json();

    if (!workspaceId || !content || !platforms || platforms.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const [newPost] = await db
      .insert(posts)
      .values({
        workspaceId,
        userId: session.user.id,
        content,
        platforms,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        status: status || 'draft',
        hashtags: hashtags || [],
        mediaUrls: mediaUrls || [],
        aiGenerated: false,
      })
      .returning();

    return NextResponse.json(newPost, { status: 201 });
  } catch (error) {
    console.error('Error creating post:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}