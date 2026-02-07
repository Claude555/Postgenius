import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { workspaceMembers, workspaces } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get member details
    const member = await db.query.workspaceMembers.findFirst({
      where: eq(workspaceMembers.id, id),
    });

    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    // Check if user is workspace owner
    const workspace = await db.query.workspaces.findFirst({
      where: eq(workspaces.id, member.workspaceId),
    });

    if (!workspace || workspace.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Only workspace owner can remove members' },
        { status: 403 }
      );
    }

    // Delete member
    await db.delete(workspaceMembers).where(eq(workspaceMembers.id, id));

    return NextResponse.json({ message: 'Member removed successfully' });
  } catch (error) {
    console.error('Error removing team member:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { role } = await request.json();

    if (!role) {
      return NextResponse.json({ error: 'Role is required' }, { status: 400 });
    }

    // Get member details
    const member = await db.query.workspaceMembers.findFirst({
      where: eq(workspaceMembers.id, id),
    });

    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    // Check if user is workspace owner
    const workspace = await db.query.workspaces.findFirst({
      where: eq(workspaces.id, member.workspaceId),
    });

    if (!workspace || workspace.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Only workspace owner can update roles' },
        { status: 403 }
      );
    }

    // Update role
    const [updatedMember] = await db
      .update(workspaceMembers)
      .set({ role })
      .where(eq(workspaceMembers.id, id))
      .returning();

    return NextResponse.json({
      message: 'Role updated successfully',
      member: updatedMember,
    });
  } catch (error) {
    console.error('Error updating team member:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}