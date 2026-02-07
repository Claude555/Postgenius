'use client';

import { useState, useEffect } from 'react';
import { ImageIcon, Upload, Trash2, Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { UploadButton } from '@uploadthing/react';
import type { OurFileRouter } from '@/app/api/uploadthing/core';

interface MediaFile {
  id: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  createdAt: string;
}

export default function MediaPage() {
  const router = useRouter();
  const [media, setMedia] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    fetchMedia();
  }, []);

  const fetchMedia = async () => {
    try {
      setLoading(true);
      const workspaceId = localStorage.getItem('currentWorkspaceId');
      if (!workspaceId) return;

      const response = await fetch(`/api/media?workspaceId=${workspaceId}`);
      if (response.ok) {
        const data = await response.json();
        setMedia(data);
      }
    } catch (error) {
      console.error('Error fetching media:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (mediaId: string) => {
    if (!confirm('Delete this image?')) return;

    try {
      const response = await fetch(`/api/media/${mediaId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setMedia(media.filter((m) => m.id !== mediaId));
      }
    } catch (error) {
      console.error('Error deleting media:', error);
      alert('Failed to delete image');
    }
  };

  const handleUploadComplete = async (res: any) => {
    if (!res) return;

    const workspaceId = localStorage.getItem('currentWorkspaceId');
    if (!workspaceId) return;

    // Save to database
    try {
      const uploadedFiles = res.map((file: any) => ({
        workspaceId,
        fileUrl: file.url,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type || 'image/jpeg',
      }));

      const response = await fetch('/api/media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files: uploadedFiles }),
      });

      if (response.ok) {
        fetchMedia(); // Refresh list
      }
    } catch (error) {
      console.error('Error saving media:', error);
    }
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading media...</p>
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
            <h1 className="text-3xl font-bold text-gray-900">Media Library</h1>
            <p className="text-gray-500 mt-1">Upload and manage your images</p>
          </div>
          <UploadButton<OurFileRouter, 'imageUploader'>
            endpoint="imageUploader"
            onClientUploadComplete={handleUploadComplete}
            onUploadError={(error: Error) => {
              alert(`Upload failed: ${error.message}`);
            }}
            appearance={{
              button: 'bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700',
              allowedContent: 'text-gray-500 text-sm',
            }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-500 mb-1">Total Files</p>
          <p className="text-2xl font-bold text-gray-900">{media.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-500 mb-1">Total Size</p>
          <p className="text-2xl font-bold text-gray-900">
            {(media.reduce((sum, m) => sum + m.fileSize, 0) / 1024 / 1024).toFixed(1)} MB
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-500 mb-1">This Month</p>
          <p className="text-2xl font-bold text-gray-900">
            {media.filter((m) => new Date(m.createdAt).getMonth() === new Date().getMonth()).length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-500 mb-1">Storage Used</p>
          <p className="text-2xl font-bold text-blue-600">
            {((media.reduce((sum, m) => sum + m.fileSize, 0) / 1024 / 1024 / 100) * 100).toFixed(0)}%
          </p>
        </div>
      </div>

      {/* Media Grid */}
      {media.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <ImageIcon className="mx-auto text-gray-400 mb-4" size={64} />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No media files yet</h3>
          <p className="text-gray-500 mb-6">Upload your first image to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {media.map((file) => (
            <div
              key={file.id}
              className="relative group bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition cursor-pointer"
              onClick={() => setSelectedImage(file.fileUrl)}
            >
              <div className="aspect-square">
                <img
                  src={file.fileUrl}
                  alt={file.fileName}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition flex items-center justify-center opacity-0 group-hover:opacity-100">
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(file.fileUrl, '_blank');
                    }}
                  >
                    <Download size={16} />
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(file.id);
                    }}
                    className="text-red-600"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
              <div className="p-2">
                <p className="text-xs text-gray-600 truncate">{file.fileName}</p>
                <p className="text-xs text-gray-400">{(file.fileSize / 1024).toFixed(0)} KB</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Image Preview Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl max-h-full">
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 p-2 bg-white rounded-full hover:bg-gray-100"
            >
              <X size={20} />
            </button>
            <img src={selectedImage} alt="Preview" className="max-w-full max-h-[90vh] rounded-lg" />
          </div>
        </div>
      )}
    </div>
  );
}