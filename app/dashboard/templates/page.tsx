'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Plus, Trash2, Edit, Copy, Globe, Lock, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Template {
  id: string;
  name: string;
  description?: string;
  content: string;
  platforms: string[];
  hashtags?: string[];
  category: string;
  isPublic: boolean;
  usageCount: number;
  createdAt: string;
}

const categories = [
  { value: 'general', label: 'General' },
  { value: 'announcement', label: 'Announcement' },
  { value: 'promotion', label: 'Promotion' },
  { value: 'engagement', label: 'Engagement' },
  { value: 'educational', label: 'Educational' },
  { value: 'inspirational', label: 'Inspirational' },
];

const platforms = [
  { id: 'twitter', name: 'Twitter', icon: '𝕏' },
  { id: 'linkedin', name: 'LinkedIn', icon: 'in' },
  { id: 'facebook', name: 'Facebook', icon: 'f' },
  { id: 'instagram', name: 'Instagram', icon: '📷' },
];

export default function TemplatesPage() {
  const router = useRouter();
  const [allTemplates, setAllTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    content: '',
    platforms: [] as string[],
    hashtags: '',
    category: 'general',
    isPublic: false,
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const workspaceId = localStorage.getItem('currentWorkspaceId');
      if (!workspaceId) return;

      const response = await fetch(`/api/templates?workspaceId=${workspaceId}`);
      if (response.ok) {
        const data = await response.json();
        setAllTemplates(data);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.content || formData.platforms.length === 0) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const workspaceId = localStorage.getItem('currentWorkspaceId');
      const response = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId,
          ...formData,
          hashtags: formData.hashtags.split(' ').filter((tag) => tag.startsWith('#')),
        }),
      });

      if (response.ok) {
        setShowCreateDialog(false);
        setFormData({
          name: '',
          description: '',
          content: '',
          platforms: [],
          hashtags: '',
          category: 'general',
          isPublic: false,
        });
        fetchTemplates();
      } else {
        alert('Failed to create template');
      }
    } catch (error) {
      console.error('Error creating template:', error);
      alert('Failed to create template');
    }
  };

  const handleDelete = async (templateId: string) => {
    if (!confirm('Delete this template?')) return;

    try {
      const response = await fetch(`/api/templates/${templateId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setAllTemplates(allTemplates.filter((t) => t.id !== templateId));
      }
    } catch (error) {
      console.error('Error deleting template:', error);
      alert('Failed to delete template');
    }
  };

  const handleUse = async (template: Template) => {
    try {
      // Increment usage count
      await fetch(`/api/templates/${template.id}/use`, { method: 'POST' });

      // Navigate to create post with template data
      const queryParams = new URLSearchParams({
        content: template.content,
        platforms: template.platforms.join(','),
        hashtags: (template.hashtags || []).join(' '),
      });

      router.push(`/dashboard/posts/new?${queryParams.toString()}`);
    } catch (error) {
      console.error('Error using template:', error);
    }
  };

  const togglePlatform = (platformId: string) => {
    setFormData((prev) => ({
      ...prev,
      platforms: prev.platforms.includes(platformId)
        ? prev.platforms.filter((p) => p !== platformId)
        : [...prev.platforms, platformId],
    }));
  };

  const filteredTemplates =
    selectedCategory === 'all'
      ? allTemplates
      : allTemplates.filter((t) => t.category === selectedCategory);

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading templates...</p>
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
            <h1 className="text-3xl font-bold text-gray-900">Content Templates</h1>
            <p className="text-gray-500 mt-1">Save and reuse your best-performing content</p>
          </div>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus size={20} className="mr-2" />
                Create Template
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Content Template</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <Label>Template Name *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Product Launch Announcement"
                    required
                  />
                </div>

                <div>
                  <Label>Description</Label>
                  <Input
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description of when to use this template"
                  />
                </div>

                <div>
                  <Label>Platforms *</Label>
                  <div className="grid grid-cols-4 gap-3 mt-2">
                    {platforms.map((platform) => (
                      <button
                        key={platform.id}
                        type="button"
                        onClick={() => togglePlatform(platform.id)}
                        className={`p-3 rounded-lg border-2 transition ${
                          formData.platforms.includes(platform.id)
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200'
                        }`}
                      >
                        <span className="text-2xl">{platform.icon}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Content *</Label>
                  <Textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="Your template content... Use [PRODUCT_NAME] for variables"
                    className="min-h-32"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Tip: Use square brackets for variables like [PRODUCT_NAME] or [DATE]
                  </p>
                </div>

                <div>
                  <Label>Hashtags</Label>
                  <Input
                    value={formData.hashtags}
                    onChange={(e) => setFormData({ ...formData, hashtags: e.target.value })}
                    placeholder="#marketing #socialmedia"
                  />
                </div>

                <div>
                  <Label>Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isPublic"
                    checked={formData.isPublic}
                    onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <Label htmlFor="isPublic" className="cursor-pointer">
                    Make this template public (share with community)
                  </Label>
                </div>

                <Button type="submit" className="w-full">
                  Create Template
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-500 mb-1">Total Templates</p>
          <p className="text-2xl font-bold text-gray-900">{allTemplates.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-500 mb-1">My Templates</p>
          <p className="text-2xl font-bold text-blue-600">
            {allTemplates.filter((t) => !t.isPublic).length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-500 mb-1">Public Templates</p>
          <p className="text-2xl font-bold text-green-600">
            {allTemplates.filter((t) => t.isPublic).length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-500 mb-1">Total Uses</p>
          <p className="text-2xl font-bold text-purple-600">
            {allTemplates.reduce((sum, t) => sum + t.usageCount, 0)}
          </p>
        </div>
      </div>

      {/* Category Filter */}
      <div className="mb-6">
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Templates Grid */}
      {filteredTemplates.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <FileText className="mx-auto text-gray-400 mb-4" size={64} />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No templates yet</h3>
          <p className="text-gray-500 mb-6">Create your first template to save time on content creation</p>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus size={20} className="mr-2" />
            Create Template
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <div
              key={template.id}
              className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-gray-900">{template.name}</h3>
                    {template.isPublic ? (
                      <Globe size={16} className="text-green-600" />
                    ) : (
                      <Lock size={16} className="text-gray-400" />
                    )}
                  </div>
                  {template.description && (
                    <p className="text-sm text-gray-500 mb-3">{template.description}</p>
                  )}
                </div>
              </div>

              <p className="text-sm text-gray-700 mb-4 line-clamp-3">{template.content}</p>

              {/* Platforms */}
              <div className="flex items-center gap-2 mb-3">
                {template.platforms.map((platformId) => {
                  const platform = platforms.find((p) => p.id === platformId);
                  return (
                    <span
                      key={platformId}
                      className="w-6 h-6 bg-gray-900 text-white rounded flex items-center justify-center text-xs font-bold"
                    >
                      {platform?.icon}
                    </span>
                  );
                })}
              </div>

              {/* Hashtags */}
              {template.hashtags && template.hashtags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-4">
                  {template.hashtags.slice(0, 3).map((tag, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {template.hashtags.length > 3 && (
                    <Badge variant="secondary" className="text-xs">
                      +{template.hashtags.length - 3}
                    </Badge>
                  )}
                </div>
              )}

              {/* Meta */}
              <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                <Badge variant="outline">{template.category}</Badge>
                <div className="flex items-center gap-1">
                  <TrendingUp size={12} />
                  <span>{template.usageCount} uses</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button onClick={() => handleUse(template)} className="flex-1" size="sm">
                  <Copy size={16} className="mr-1" />
                  Use
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(template.id)}
                  className="text-red-600"
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}