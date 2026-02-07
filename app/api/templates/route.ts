import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { templates } from '@/lib/db/schema';
import { eq, and, or } from 'drizzle-orm';

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

    // Get user's templates and public templates
    const userTemplates = await db.query.templates.findMany({
      where: or(
        and(eq(templates.workspaceId, workspaceId), eq(templates.userId, session.user.id)),
        eq(templates.isPublic, true)
      ),
      orderBy: (templates, { desc }) => [desc(templates.createdAt)],
    });

    return NextResponse.json(userTemplates);
  } catch (error) {
    console.error('Error fetching templates:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { workspaceId, name, description, content, platforms, hashtags, category, isPublic } =
      await request.json();

    if (!workspaceId || !name || !content || !platforms) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const [newTemplate] = await db
      .insert(templates)
      .values({
        workspaceId,
        userId: session.user.id,
        name,
        description: description || null,
        content,
        platforms,
        hashtags: hashtags || [],
        category: category || 'general',
        isPublic: isPublic || false,
      })
      .returning();

    return NextResponse.json(newTemplate, { status: 201 });
  } catch (error) {
    console.error('Error creating template:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}