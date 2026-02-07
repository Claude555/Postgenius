'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Calendar as CalendarIcon, Image as ImageIcon, Sparkles, X } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const platforms = [
  { id: 'twitter', name: 'Twitter (X)', icon: '𝕏', color: 'bg-black' },
  { id: 'linkedin', name: 'LinkedIn', icon: 'in', color: 'bg-blue-700' },
  { id: 'facebook', name: 'Facebook', icon: 'f', color: 'bg-blue-600' },
  { id: 'instagram', name: 'Instagram', icon: '📷', color: 'bg-pink-600' },
];

export default function NewPostPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedDate = searchParams.get('date');

  const [loading, setLoading] = useState(false);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [content, setContent] = useState('');
  const [scheduledDate, setScheduledDate] = useState(
    preselectedDate || new Date().toISOString().split('T')[0]
  );
  const [scheduledTime, setScheduledTime] = useState('12:00');
  const [status, setStatus] = useState<'draft' | 'scheduled'>('draft');
  const [hashtags, setHashtags] = useState('');
  const [mediaPreview, setMediaPreview] = useState<string[]>([]);
  const [aiLoading, setAiLoading] = useState(false);

  const characterLimit = 280; // Twitter limit
  const remainingChars = characterLimit - content.length;

  const togglePlatform = (platformId: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platformId)
        ? prev.filter((p) => p !== platformId)
        : [...prev, platformId]
    );
  };

  useEffect(() => {
  // Load template data from URL if present
  const urlContent = searchParams.get('content');
  const urlPlatforms = searchParams.get('platforms');
  const urlHashtags = searchParams.get('hashtags');

  if (urlContent) setContent(urlContent);
  if (urlPlatforms) setSelectedPlatforms(urlPlatforms.split(','));
  if (urlHashtags) setHashtags(urlHashtags);
}, [searchParams]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newPreviews: string[] = [];
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        newPreviews.push(reader.result as string);
        if (newPreviews.length === files.length) {
          setMediaPreview([...mediaPreview, ...newPreviews]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setMediaPreview(mediaPreview.filter((_, i) => i !== index));
  };

//  generateAIContent function :

const [aiTopic, setAiTopic] = useState('');
const [aiTone, setAiTone] = useState<'professional' | 'casual' | 'funny' | 'inspiring'>('professional');
const [showAiDialog, setShowAiDialog] = useState(false);

const generateAIContent = async () => {
  if (!selectedPlatforms.length) {
    alert('Please select at least one platform first');
    return;
  }

  setAiLoading(true);
  try {
    const response = await fetch('/api/ai/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'generate',
        topic: aiTopic || undefined,
        tone: aiTone,
        platform: selectedPlatforms[0],
      }),
    });

    const data = await response.json();
    
    if (response.ok) {
      setContent(data.content);
      setShowAiDialog(false);
      
      // Extract hashtags if present
      const hashtagMatch = data.content.match(/#\w+/g);
      if (hashtagMatch) {
        setHashtags(hashtagMatch.join(' '));
      }
    } else {
      alert(data.error || 'Failed to generate content');
    }
  } catch (error) {
    console.error('AI generation error:', error);
    alert('Failed to generate content');
  } finally {
    setAiLoading(false);
  }
};

const improveWithAI = async () => {
  if (!content.trim()) {
    alert('Please enter some content first');
    return;
  }

  setAiLoading(true);
  try {
    const response = await fetch('/api/ai/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'improve',
        content,
        platform: selectedPlatforms[0] || 'twitter',
      }),
    });

    const data = await response.json();
    
    if (response.ok) {
      setContent(data.content);
    } else {
      alert(data.error || 'Failed to improve content');
    }
  } catch (error) {
    console.error('AI improvement error:', error);
    alert('Failed to improve content');
  } finally {
    setAiLoading(false);
  }
};

const generateAIHashtags = async () => {
  if (!content.trim()) {
    alert('Please enter some content first');
    return;
  }

  setAiLoading(true);
  try {
    const response = await fetch('/api/ai/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'hashtags',
        content,
      }),
    });

    const data = await response.json();
    
    if (response.ok) {
      setHashtags(data.content);
    } else {
      alert(data.error || 'Failed to generate hashtags');
    }
  } catch (error) {
    console.error('Hashtag generation error:', error);
    alert('Failed to generate hashtags');
  } finally {
    setAiLoading(false);
  }
};

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) {
      alert('Please enter post content');
      return;
    }

    if (selectedPlatforms.length === 0) {
      alert('Please select at least one platform');
      return;
    }

    setLoading(true);

    try {
      const workspaceId = localStorage.getItem('currentWorkspaceId');
      if (!workspaceId) {
        throw new Error('No workspace selected');
      }

      const scheduledAt =
        status === 'scheduled'
          ? new Date(`${scheduledDate}T${scheduledTime}`).toISOString()
          : null;

      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId,
          content,
          platforms: selectedPlatforms,
          scheduledAt,
          status,
          hashtags: hashtags.split(' ').filter((tag) => tag.startsWith('#')),
          mediaUrls: mediaPreview,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create post');
      }

      router.push('/dashboard');
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Failed to create post. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft size={20} />
          <span>Back to Calendar</span>
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Create New Post</h1>
        <p className="text-gray-500 mt-1">Compose and schedule your social media content</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Platform Selection */}
          <Card>
            <CardContent className="pt-6">
              <Label className="mb-3 block">Select Platforms *</Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {platforms.map((platform) => (
                  <button
                    key={platform.id}
                    type="button"
                    onClick={() => togglePlatform(platform.id)}
                    className={`p-4 rounded-lg border-2 transition flex flex-col items-center gap-2 ${
                      selectedPlatforms.includes(platform.id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div
                      className={`w-10 h-10 ${platform.color} text-white rounded-lg flex items-center justify-center text-lg font-bold`}
                    >
                      {platform.icon}
                    </div>
                    <span className="text-sm font-medium text-gray-700">
                      {platform.name.split(' ')[0]}
                    </span>
                  </button>
                ))}
              </div>
              {selectedPlatforms.length > 0 && (
                <div className="mt-3 flex gap-2 flex-wrap">
                  {selectedPlatforms.map((platformId) => {
                    const platform = platforms.find((p) => p.id === platformId);
                    return (
                      <Badge key={platformId} variant="secondary">
                        {platform?.icon} {platform?.name}
                      </Badge>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Content Editor */}
         {/* Content Editor - Update the AI button section */}
<Card>
  <CardContent className="pt-6">
    <div className="flex items-center justify-between mb-3">
      <Label>Post Content *</Label>
      <div className="flex gap-2">
        <Dialog open={showAiDialog} onOpenChange={setShowAiDialog}>
          <DialogTrigger asChild>
            <Button type="button" variant="outline" size="sm" disabled={aiLoading}>
              <Sparkles size={16} className="mr-2" />
              AI Generate
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Generate Content with AI</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Topic (Optional)</Label>
                <Input
                  value={aiTopic}
                  onChange={(e) => setAiTopic(e.target.value)}
                  placeholder="e.g., Product launch, Industry news"
                />
              </div>
              <div>
                <Label>Tone</Label>
                <Select value={aiTone} onValueChange={(value: any) => setAiTone(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="casual">Casual</SelectItem>
                    <SelectItem value="funny">Funny</SelectItem>
                    <SelectItem value="inspiring">Inspiring</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={generateAIContent} disabled={aiLoading} className="w-full">
                {aiLoading ? 'Generating...' : 'Generate Content'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        
        {content && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={improveWithAI}
            disabled={aiLoading}
          >
            <Sparkles size={16} className="mr-2" />
            Improve
          </Button>
        )}
      </div>
    </div>
    <Textarea
      value={content}
      onChange={(e) => setContent(e.target.value)}
      placeholder="What's on your mind? Share your thoughts..."
      className="min-h-48 resize-none"
    />
    <div className="flex items-center justify-between mt-2">
      <span className="text-sm text-gray-500">
        {hashtags.split(' ').filter((tag) => tag.startsWith('#')).length} hashtags
      </span>
      <span
        className={`text-sm ${
          remainingChars < 0
            ? 'text-red-600 font-semibold'
            : remainingChars < 50
            ? 'text-orange-600'
            : 'text-gray-500'
        }`}
      >
        {remainingChars} characters remaining
      </span>
    </div>
  </CardContent>
</Card>

{/* Hashtags - Add AI button */}
<Card>
  <CardContent className="pt-6">
    <div className="flex items-center justify-between mb-3">
      <Label>Hashtags</Label>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={generateAIHashtags}
        disabled={aiLoading || !content}
      >
        <Sparkles size={16} className="mr-2" />
        AI Suggest
      </Button>
    </div>
    <Input
      value={hashtags}
      onChange={(e) => setHashtags(e.target.value)}
      placeholder="#marketing #socialmedia #content"
    />
    <p className="text-xs text-gray-500 mt-2">
      Separate hashtags with spaces. They'll be added at the end of your post.
    </p>
  </CardContent>
</Card>

          {/* Hashtags */}
          <Card>
            <CardContent className="pt-6">
              <Label className="mb-3 block">Hashtags</Label>
              <Input
                value={hashtags}
                onChange={(e) => setHashtags(e.target.value)}
                placeholder="#marketing #socialmedia #content"
              />
              <p className="text-xs text-gray-500 mt-2">
                Separate hashtags with spaces. They'll be added at the end of your post.
              </p>
            </CardContent>
          </Card>

          {/* Media Upload */}
          <Card>
            <CardContent className="pt-6">
              <Label className="mb-3 block">Media (Optional)</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition">
                <input
                  type="file"
                  id="media"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <label htmlFor="media" className="cursor-pointer">
                  <ImageIcon className="mx-auto text-gray-400 mb-2" size={32} />
                  <p className="text-sm text-gray-600 mb-1">Click to upload images</p>
                  <p className="text-xs text-gray-500">PNG, JPG up to 10MB each</p>
                </label>
              </div>

              {/* Media Preview */}
              {mediaPreview.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4">
                  {mediaPreview.map((preview, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Scheduling & Actions */}
        <div className="space-y-6">
          {/* Post Status */}
          <Card>
            <CardContent className="pt-6">
              <Label className="mb-3 block">Post Status</Label>
              <Select value={status} onValueChange={(value: any) => setStatus(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Save as Draft</SelectItem>
                  <SelectItem value="scheduled">Schedule Post</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Schedule Date/Time */}
          {status === 'scheduled' && (
            <Card>
              <CardContent className="pt-6">
                <Label className="mb-3 block">
                  <CalendarIcon size={16} className="inline mr-2" />
                  Schedule For
                </Label>
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs text-gray-500 mb-1 block">Date</Label>
                    <Input
                      type="date"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500 mb-1 block">Time</Label>
                    <Input
                      type="time"
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Scheduled: {scheduledDate} at {scheduledTime}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Best Time Suggestion */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <h3 className="font-semibold text-blue-900 mb-2">💡 Best Time to Post</h3>
              <p className="text-sm text-blue-700 mb-3">
                Based on your audience, the best time to post is:
              </p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-blue-700">Weekdays:</span>
                  <span className="font-semibold text-blue-900">9 AM - 11 AM</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-blue-700">Weekends:</span>
                  <span className="font-semibold text-blue-900">11 AM - 1 PM</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button onClick={handleSubmit} disabled={loading} className="w-full">
              {loading
                ? 'Creating...'
                : status === 'scheduled'
                ? 'Schedule Post'
                : 'Save Draft'}
            </Button>
            <Button variant="outline" onClick={() => router.push('/dashboard')} className="w-full">
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}