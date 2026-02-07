import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { templates } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Increment usage count
    await db
      .update(templates)
      .set({
        usageCount: sql`${templates.usageCount} + 1`,
      })
      .where(eq(templates.id, id));

    return NextResponse.json({ message: 'Usage count updated' });
  } catch (error) {
    console.error('Error updating usage count:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}