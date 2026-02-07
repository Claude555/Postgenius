import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { workspaceMembers, users, workspaces } from '@/lib/db/schema';
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

    try {
      // Get all members for this workspace with their user details
      const members = await db
        .select({
          id: workspaceMembers.id,
          userId: workspaceMembers.userId,
          role: workspaceMembers.role,
          userName: users.name,
          userEmail: users.email,
          userImage: users.profileImageUrl,
        })
        .from(workspaceMembers)
        .leftJoin(users, eq(workspaceMembers.userId, users.id))
        .where(eq(workspaceMembers.workspaceId, workspaceId));

      return NextResponse.json(members || []);
    } catch (dbError) {
      console.error('Database error:', dbError);
      // Return empty array if table doesn't exist yet
      return NextResponse.json([]);
    }
  } catch (error) {
    console.error('Error fetching team members:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { workspaceId, email, role } = await request.json();

    if (!workspaceId || !email) {
      return NextResponse.json(
        { error: 'Workspace ID and email are required' },
        { status: 400 }
      );
    }

    // Check if user is owner/admin of workspace
    const workspace = await db.query.workspaces.findFirst({
      where: eq(workspaces.id, workspaceId),
    });

    if (!workspace || workspace.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Only workspace owner can invite members' },
        { status: 403 }
      );
    }

    // Find user by email
    const invitedUser = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!invitedUser) {
      return NextResponse.json(
        { error: 'User not found. They need to register first.' },
        { status: 404 }
      );
    }

    // Check if already a member
    const existingMember = await db.query.workspaceMembers.findFirst({
      where: and(
        eq(workspaceMembers.workspaceId, workspaceId),
        eq(workspaceMembers.userId, invitedUser.id)
      ),
    });

    if (existingMember) {
      return NextResponse.json({ error: 'User is already a member' }, { status: 400 });
    }

    // Add member
    const [newMember] = await db
      .insert(workspaceMembers)
      .values({
        workspaceId,
        userId: invitedUser.id,
        role: role || 'member',
      })
      .returning();

    return NextResponse.json(
      {
        message: 'Team member added successfully',
        member: {
          id: newMember.id,
          userId: invitedUser.id,
          role: newMember.role,
          userName: invitedUser.name,
          userEmail: invitedUser.email,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error inviting team member:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}