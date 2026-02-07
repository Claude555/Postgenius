'use client';

import { useState, useEffect } from 'react';
import {
  BarChart3,
  Calendar,
  FileText,
  Image,
  Hash,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface AnalyticsData {
  overview: {
    totalPosts: number;
    scheduledPosts: number;
    publishedPosts: number;
    draftPosts: number;
    postsWithMedia: number;
    postsWithoutMedia: number;
    avgHashtags: string;
    aiGeneratedPosts: number;
    manualPosts: number;
  };
  platformStats: Array<{ platform: string; count: number }>;
  monthlyStats: Array<{ month: string; posts: number }>;
  statusOverTime: Array<{ month: string; draft: number; scheduled: number; published: number }>;
  dayStats: Array<{ day: string; posts: number }>;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#ec4899'];

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const workspaceId = localStorage.getItem('currentWorkspaceId');
      if (!workspaceId) return;

      const response = await fetch(`/api/analytics?workspaceId=${workspaceId}`);
      if (response.ok) {
        const analyticsData = await response.json();
        setData(analyticsData);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <BarChart3 className="mx-auto text-gray-400 mb-4" size={64} />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Data Available</h3>
          <p className="text-gray-500">Create some posts to see analytics</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
        <p className="text-gray-500 mt-1">Track your content performance and insights</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-3">
            <FileText className="text-blue-600" size={24} />
          </div>
          <h3 className="text-sm font-medium text-gray-500 mb-1">Total Posts</h3>
          <p className="text-3xl font-bold text-gray-900">{data.overview.totalPosts}</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-3">
            <Calendar className="text-blue-600" size={24} />
          </div>
          <h3 className="text-sm font-medium text-gray-500 mb-1">Scheduled</h3>
          <p className="text-3xl font-bold text-blue-600">{data.overview.scheduledPosts}</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-3">
            <TrendingUp className="text-green-600" size={24} />
          </div>
          <h3 className="text-sm font-medium text-gray-500 mb-1">Published</h3>
          <p className="text-3xl font-bold text-green-600">{data.overview.publishedPosts}</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-3">
            <Image className="text-purple-600" size={24} />
          </div>
          <h3 className="text-sm font-medium text-gray-500 mb-1">With Media</h3>
          <p className="text-3xl font-bold text-purple-600">{data.overview.postsWithMedia}</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-3">
            <Sparkles className="text-orange-600" size={24} />
          </div>
          <h3 className="text-sm font-medium text-gray-500 mb-1">AI Generated</h3>
          <p className="text-3xl font-bold text-orange-600">{data.overview.aiGeneratedPosts}</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Monthly Posts Trend */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Posts Over Time</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.monthlyStats}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" stroke="#6b7280" style={{ fontSize: '12px' }} />
              <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
              />
              <Line
                type="monotone"
                dataKey="posts"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={{ fill: '#3b82f6', r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Platform Distribution */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Posts by Platform</h2>
          {data.platformStats.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                    data={data.platformStats}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ payload }) => `${payload.platform}: ${payload.count}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="count"
                  >
                  {data.platformStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px]">
              <p className="text-gray-500">No platform data available</p>
            </div>
          )}
        </div>

        {/* Status Over Time */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Post Status Trend</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.statusOverTime}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" stroke="#6b7280" style={{ fontSize: '12px' }} />
              <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Bar dataKey="draft" fill="#6b7280" name="Draft" />
              <Bar dataKey="scheduled" fill="#3b82f6" name="Scheduled" />
              <Bar dataKey="published" fill="#10b981" name="Published" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Most Active Days */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Posting Days Activity</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.dayStats}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="day"
                stroke="#6b7280"
                style={{ fontSize: '11px' }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="posts" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Insights Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200 p-6">
          <div className="flex items-center gap-3 mb-3">
            <Hash className="text-blue-600" size={24} />
          </div>
          <h3 className="text-sm font-medium text-blue-900 mb-2">Average Hashtags</h3>
          <p className="text-3xl font-bold text-blue-900">{data.overview.avgHashtags}</p>
          <p className="text-sm text-blue-700 mt-2">per post</p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200 p-6">
          <div className="flex items-center gap-3 mb-3">
            <Image className="text-purple-600" size={24} />
          </div>
          <h3 className="text-sm font-medium text-purple-900 mb-2">Media Usage</h3>
          <p className="text-3xl font-bold text-purple-900">
            {data.overview.totalPosts > 0
              ? Math.round((data.overview.postsWithMedia / data.overview.totalPosts) * 100)
              : 0}
            %
          </p>
          <p className="text-sm text-purple-700 mt-2">posts include media</p>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg border border-orange-200 p-6">
          <div className="flex items-center gap-3 mb-3">
            <Sparkles className="text-orange-600" size={24} />
          </div>
          <h3 className="text-sm font-medium text-orange-900 mb-2">AI Assistance</h3>
          <p className="text-3xl font-bold text-orange-900">
            {data.overview.totalPosts > 0
              ? Math.round((data.overview.aiGeneratedPosts / data.overview.totalPosts) * 100)
              : 0}
            %
          </p>
          <p className="text-sm text-orange-700 mt-2">AI-generated content</p>
        </div>
      </div>

      {/* Recommendations */}
      <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">📊 Insights & Recommendations</h2>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
            <p className="text-gray-700">
              {data.overview.postsWithMedia < data.overview.totalPosts / 2
                ? 'Consider adding more media to your posts - visual content typically performs better!'
                : 'Great job! Most of your posts include media content.'}
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
            <p className="text-gray-700">
              {data.overview.scheduledPosts > 0
                ? `You have ${data.overview.scheduledPosts} posts scheduled - maintain consistency!`
                : 'Schedule posts in advance to maintain a consistent posting schedule.'}
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
            <p className="text-gray-700">
              {parseFloat(data.overview.avgHashtags) < 3
                ? 'Try using 3-5 hashtags per post to increase discoverability.'
                : 'Good hashtag usage! Keep maintaining 3-5 hashtags per post.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}