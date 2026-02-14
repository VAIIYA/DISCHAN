'use client'

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { Thread } from '@/types';
import { ApiService } from '@/services/api';
import { MessageSquare, Video, Plus } from 'lucide-react';

export default function CatalogPage() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadThreads();
  }, []);

  const loadThreads = async () => {
    try {
      setLoading(true);
      const response = await ApiService.getThreads(1, 200); // Load more threads for catalog
      if (response.success) {
        setThreads(response.threads || []);
      }
    } catch (error) {
      console.error('Error loading threads:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleThreadClick = (threadId: string) => {
    router.push(`/threads/${threadId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header title="Catalog" showHomeLink={true} showAdvertiseLink={true} />
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <p className="text-orange-600">Loading catalog...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header title="Catalog" showHomeLink={true} showAdvertiseLink={true} />

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Thread Catalog</h1>
          <p className="text-xl text-gray-600">
            Browse all active threads at a glance
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {threads.map((thread) => (
            <div
              key={thread.id}
              onClick={() => handleThreadClick(thread.id)}
              className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:border-orange-300 hover:shadow-md transition-all cursor-pointer"
            >
              {/* Thumbnail */}
              <div className="aspect-square bg-gray-100 relative">
                {thread.op?.image ? (
                  <img
                    src={thread.op.image}
                    alt="Thread thumbnail"
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : thread.op?.video ? (
                  <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                    <Video className="w-8 h-8 text-white" />
                  </div>
                ) : (
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                    <MessageSquare className="w-8 h-8 text-gray-400" />
                  </div>
                )}

                {/* Thread stats overlay */}
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white text-xs p-2">
                  <div className="flex justify-between items-center">
                    <span>R: {thread.replyCount || 0}</span>
                    <span>I: {(thread.imageCount || 0) + (thread.videoCount || 0)}</span>
                  </div>
                </div>
              </div>

              {/* Thread info */}
              <div className="p-3">
                <h3 className="font-medium text-gray-900 text-sm line-clamp-2 mb-1">
                  {thread.title || 'Untitled Thread'}
                </h3>
                <div className="text-xs text-gray-500 space-y-1">
                  <div className="flex justify-between">
                    <span>{thread.op?.authorDisplayName || 'Anonymous'}</span>
                    <span>{formatTimeAgo(thread.lastActivity || thread.createdAt)}</span>
                  </div>
                  <div className="line-clamp-2 text-gray-600">
                    {thread.op?.content || 'No content'}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {threads.length === 0 && (
          <div className="text-center py-16">
            <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">No threads yet</h3>
            <p className="text-gray-600 mb-4">Be the first to start a discussion!</p>
            <a
              href="/"
              className="inline-flex items-center px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Thread
            </a>
          </div>
        )}
      </main>
    </div>
  );
}

function formatTimeAgo(date: string | Date): string {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  return `${diffDays}d`;
}