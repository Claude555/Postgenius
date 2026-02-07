'use client';

import { useState, useEffect } from 'react';
import { Users, Mail, Trash2, Shield, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface TeamMember {
  id: string;
  userId: string;
  role: string;
  invitedAt: string;
  userName: string;
  userEmail: string;
  userImage?: string;
}

export default function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  const fetchTeamMembers = async () => {
    try {
      setLoading(true);
      const workspaceId = localStorage.getItem('currentWorkspaceId');
      if (!workspaceId) return;

      const response = await fetch(`/api/team?workspaceId=${workspaceId}`);
      if (response.ok) {
        const data = await response.json();
        setMembers(data);
      }
    } catch (error) {
      console.error('Error fetching team members:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inviteEmail.trim()) {
      alert('Please enter an email address');
      return;
    }

    setInviting(true);

    try {
      const workspaceId = localStorage.getItem('currentWorkspaceId');
      const response = await fetch('/api/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId,
          email: inviteEmail,
          role: inviteRole,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert('Team member added successfully!');
        setShowInviteDialog(false);
        setInviteEmail('');
        setInviteRole('member');
        fetchTeamMembers();
      } else {
        alert(data.error || 'Failed to add team member');
      }
    } catch (error) {
      console.error('Error inviting member:', error);
      alert('Failed to add team member');
    } finally {
      setInviting(false);
    }
  };

  const handleRemove = async (memberId: string) => {
    if (!confirm('Remove this team member?')) return;

    try {
      const response = await fetch(`/api/team/${memberId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setMembers(members.filter((m) => m.id !== memberId));
      } else {
        alert('Failed to remove member');
      }
    } catch (error) {
      console.error('Error removing member:', error);
      alert('Failed to remove member');
    }
  };

  const handleRoleChange = async (memberId: string, newRole: string) => {
    try {
      const response = await fetch(`/api/team/${memberId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });

      if (response.ok) {
        setMembers(
          members.map((m) => (m.id === memberId ? { ...m, role: newRole } : m))
        );
      } else {
        alert('Failed to update role');
      }
    } catch (error) {
      console.error('Error updating role:', error);
      alert('Failed to update role');
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'owner':
        return <Badge className="bg-purple-100 text-purple-700">Owner</Badge>;
      case 'admin':
        return <Badge className="bg-blue-100 text-blue-700">Admin</Badge>;
      default:
        return <Badge variant="secondary">Member</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading team...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Team Members</h1>
            <p className="text-gray-500 mt-1">Manage your workspace team</p>
          </div>
          <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus size={20} className="mr-2" />
                Invite Member
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite Team Member</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleInvite} className="space-y-4">
                <div>
                  <Label>Email Address</Label>
                  <Input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="colleague@example.com"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    User must have an account to be invited
                  </p>
                </div>
                <div>
                  <Label>Role</Label>
                  <Select value={inviteRole} onValueChange={setInviteRole}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" disabled={inviting} className="w-full">
                  {inviting ? 'Inviting...' : 'Send Invitation'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-500 mb-1">Total Members</p>
          <p className="text-2xl font-bold text-gray-900">{members.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-500 mb-1">Admins</p>
          <p className="text-2xl font-bold text-blue-600">
            {members.filter((m) => m.role === 'admin' || m.role === 'owner').length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-500 mb-1">Members</p>
          <p className="text-2xl font-bold text-gray-600">
            {members.filter((m) => m.role === 'member').length}
          </p>
        </div>
      </div>

      {/* Team Members List */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {members.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="mx-auto text-gray-400 mb-4" size={64} />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No team members yet</h3>
            <p className="text-gray-500 mb-6">Invite your first team member to collaborate</p>
            <Button onClick={() => setShowInviteDialog(true)}>
              <UserPlus size={20} className="mr-2" />
              Invite Member
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {members.map((member) => (
              <div key={member.id} className="p-6 hover:bg-gray-50 transition">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-lg font-semibold text-blue-600">
                        {member.userName?.[0] || 'U'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900">{member.userName}</h3>
                        {getRoleBadge(member.role)}
                      </div>
                      <p className="text-sm text-gray-500">{member.userEmail}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Joined {new Date(member.invitedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {member.role !== 'owner' && (
                      <>
                        <Select
                          value={member.role}
                          onValueChange={(value) => handleRoleChange(member.id, value)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="member">Member</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemove(member.id)}
                          className="text-red-600"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Role Descriptions */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-blue-900 mb-3">
          <Shield size={20} className="inline mr-2" />
          Role Permissions
        </h3>
        <div className="space-y-2 text-sm text-blue-800">
          <p>
            <strong>Owner:</strong> Full control of workspace, can manage team and billing
          </p>
          <p>
            <strong>Admin:</strong> Can create/edit/delete posts, invite members
          </p>
          <p>
            <strong>Member:</strong> Can create and edit their own posts
          </p>
        </div>
      </div>
    </div>
  );
}