'use client'

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ThreadList } from '@/components/ThreadList';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Thread, Channel } from '@/types';
import { ApiService } from '@/services/api';
import { Hash, Info } from 'lucide-react';

export default function ChannelPage() {
    const params = useParams();
    const router = useRouter();
    const slug = params.slug as string;

    const [threads, setThreads] = useState<Thread[]>([]);
    const [channel, setChannel] = useState<Channel | null>(null);
    const [loading, setLoading] = useState(true);

    const loadChannelData = useCallback(async () => {
        try {
            setLoading(true);

            // 1. Get channel info
            const channelsRes = await ApiService.getChannels();
            if (channelsRes.success) {
                const currentChannel = channelsRes.channels.find((c: Channel) => c.slug === slug);
                if (currentChannel) {
                    setChannel(currentChannel);
                } else {
                    // Handle 404
                    router.push('/');
                    return;
                }
            }

            // 2. Get threads for this channel
            // We'll use search for now as a filter
            const response = await ApiService.searchThreads('', []); // We need to update searchThreads or getThreads to filter by channelId
            if (response.success) {
                // Filter locally if API doesn't support it yet
                // In a real app, the API should handle this
                const filtered = (response.threads || []).filter((t: Thread) => t.channelId === channel?.id);
                setThreads(filtered);
            }
        } catch (error) {
            console.error('Error loading channel data:', error);
        } finally {
            setLoading(false);
        }
    }, [slug, channel?.id, router]);

    useEffect(() => {
        loadChannelData();
    }, [loadChannelData]);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Header title={`#${slug}`} showHomeLink={true} showAdvertiseLink={false} />

            <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-8">
                {/* Channel Header */}
                <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 mb-8 border-b-4 border-b-orange-500">
                    <div className="flex items-center space-x-4 mb-4">
                        <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600">
                            <Hash size={32} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-gray-900 tracking-tight capitalize">
                                {channel?.name || slug}
                            </h1>
                            <p className="text-gray-500 flex items-center mt-1">
                                <Info size={14} className="mr-1" />
                                {channel?.description || `Welcome to the ${slug} channel.`}
                            </p>
                        </div>
                    </div>
                    <hr className="border-gray-100 my-6" />
                    <div className="flex items-center justify-between text-sm">
                        <div className="flex space-x-6 text-gray-500">
                            <span><strong>{threads.length}</strong> Threads</span>
                            <span><strong>{threads.reduce((acc, t) => acc + t.replyCount, 0)}</strong> Messages</span>
                        </div>
                    </div>
                </div>

                <ThreadList
                    threads={threads}
                    showBackButton={false}
                    loading={loading}
                    onThreadSelect={(url) => router.push(url)}
                    onThreadCreated={loadChannelData}
                    hidePagination={true}
                />
            </main>

            <Footer />
        </div>
    );
}
