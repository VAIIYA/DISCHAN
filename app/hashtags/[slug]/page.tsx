'use client'

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { ThreadList } from '@/components/ThreadList';
import { ApiService } from '@/services/api';
import { Thread } from '@/types';

export default function HashtagThreadsPage() {
    const { slug } = useParams();
    const tagName = decodeURIComponent(slug as string);
    const [threads, setThreads] = useState<Thread[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const loadTaggedThreads = async () => {
            try {
                setLoading(true);
                const result = await ApiService.searchThreads('', [tagName]);
                if (result?.threads) {
                    setThreads(result.threads);
                }
            } catch (error) {
                console.error('Error loading tagged threads:', error);
            } finally {
                setLoading(false);
            }
        };

        if (tagName) {
            loadTaggedThreads();
        }
    }, [tagName]);

    return (
        <div className="min-h-screen bg-gray-50">
            <Header title={`#${tagName}`} onBack={() => router.back()} />

            <main className="max-w-6xl mx-auto px-6 py-8">
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Threads tagged with <span className="text-orange-600">#{tagName}</span>
                    </h1>
                    <p className="text-gray-600">
                        {threads.length} {threads.length === 1 ? 'thread' : 'threads'} found
                    </p>
                </div>

                <ThreadList
                    threads={threads}
                    loading={loading}
                    showBackButton={false}
                    onThreadSelect={(url) => router.push(url)}
                />
            </main>
        </div>
    );
}
