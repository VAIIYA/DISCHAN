'use client'

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { ThreadList } from '@/components/ThreadList';
import { ApiService } from '@/services/api';
import { Thread } from '@/types';
import { Search } from 'lucide-react';

function SearchResults() {
    const searchParams = useSearchParams();
    const query = searchParams.get('q') || '';
    const [threads, setThreads] = useState<Thread[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const performSearch = async () => {
            if (!query) {
                setThreads([]);
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                const result = await ApiService.searchThreads(query);
                if (result?.threads) {
                    setThreads(result.threads);
                }
            } catch (error) {
                console.error('Search error:', error);
            } finally {
                setLoading(false);
            }
        };

        performSearch();
    }, [query]);

    return (
        <main className="max-w-6xl mx-auto px-6 py-8">
            <div className="mb-8">
                <div className="flex items-center space-x-3 mb-4">
                    <Search className="text-orange-600 w-8 h-8" />
                    <h1 className="text-3xl font-bold text-gray-900">
                        Search Results
                    </h1>
                </div>

                <p className="text-gray-600">
                    {query ? (
                        <>Showing results for "<span className="font-semibold text-gray-900">{query}</span>"</>
                    ) : (
                        "Enter a search term in the box above to find threads and comments."
                    )}
                </p>
                {query && (
                    <p className="text-sm text-gray-500 mt-1">
                        {threads.length} {threads.length === 1 ? 'result' : 'results'} found
                    </p>
                )}
            </div>

            {query ? (
                <ThreadList
                    threads={threads}
                    loading={loading}
                    showBackButton={false}
                    onThreadSelect={(url) => router.push(url)}
                />
            ) : (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
                    <Search className="w-16 h-16 text-gray-200 mb-4" />
                    <p className="text-gray-400 text-lg">Type something to search...</p>
                </div>
            )}
        </main>
    );
}

export default function SearchPage() {
    return (
        <div className="min-h-screen bg-gray-50">
            <Header title="Search Results" />
            <Suspense fallback={
                <main className="max-w-6xl mx-auto px-6 py-20 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
                    <p className="text-gray-500">Loading search results...</p>
                </main>
            }>
                <SearchResults />
            </Suspense>
        </div>
    );
}
