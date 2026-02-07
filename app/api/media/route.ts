import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { media } from '@/lib/db/schema';
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

    const userMedia = await db.query.media.findMany({
      where: and(eq(media.workspaceId, workspaceId), eq(media.userId, session.user.id)),
      orderBy: (media, { desc }) => [desc(media.createdAt)],
    });

    return NextResponse.json(userMedia);
  } catch (error) {
    console.error('Error fetching media:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { files } = await request.json();

    if (!files || !Array.isArray(files)) {
      return NextResponse.json({ error: 'Invalid files data' }, { status: 400 });
    }

    const insertedMedia = await Promise.all(
      files.map((file) =>
        db
          .insert(media)
          .values({
            workspaceId: file.workspaceId,
            userId: session.user.id,
            fileUrl: file.fileUrl,
            fileName: file.fileName,
            fileSize: file.fileSize,
            fileType: file.fileType,
          })
          .returning()
      )
    );

    return NextResponse.json(insertedMedia.flat(), { status: 201 });
  } catch (error) {
    console.error('Error saving media:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}