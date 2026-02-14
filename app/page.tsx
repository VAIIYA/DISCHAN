'use client'

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ThreadList } from '@/components/ThreadList';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Thread } from '@/types';
import { ApiService } from '@/services/api';
import { Rocket, Shield, Users } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);

  const loadThreads = useCallback(async () => {
    try {
      setLoading(true);
      const response = await ApiService.getThreads(1, 100);
      if (response.success) {
        setThreads(response.threads || []);
      }
    } catch (error) {
      console.error('Error loading threads:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadThreads();
  }, [loadThreads]);


  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Feed" showHomeLink={false} showAdvertiseLink={true} />

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Welcome Section */}
        <div className="relative overflow-hidden bg-gradient-to-br from-orange-600 to-amber-600 rounded-3xl p-12 mb-12 shadow-xl shadow-orange-200">
          <div className="relative z-10 max-w-2xl">
            <h1 className="text-5xl font-black text-white mb-6 leading-tight">
              We. As One.
            </h1>
            <p className="text-xl text-orange-50/90 mb-8 leading-relaxed">
              Welcome to <strong>Dischan</strong>. The ultimate decentralized discussion board
              bridging the gap between legacy imageboards and modern chat ecosystems.
            </p>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full text-white text-sm font-medium border border-white/20">
                <Shield size={16} />
                <span>Anonymous Posting</span>
              </div>
              <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full text-white text-sm font-medium border border-white/20">
                <Users size={16} />
                <span>Solana Powered</span>
              </div>
              <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full text-white text-sm font-medium border border-white/20">
                <Rocket size={16} />
                <span>Decentralized Media</span>
              </div>
            </div>
          </div>

          {/* Abstract background shape */}
          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-[600px] h-[600px] bg-white/10 rounded-full blur-3xl"></div>
        </div>

        <div className="flex items-center justify-between mb-8 px-2">
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Recent Activity</h2>
          <div className="h-px flex-1 bg-gray-200 mx-6"></div>
        </div>

        <ThreadList
          threads={threads}
          showBackButton={false}
          loading={loading}
          onThreadSelect={(url) => router.push(url)}
          onThreadCreated={loadThreads}
          hidePagination={true}
        />
      </main>

      {/* Footer with Board Rules */}
      <Footer />
    </div>
  );
}
