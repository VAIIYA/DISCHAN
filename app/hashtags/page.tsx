'use client'

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { useRouter } from 'next/navigation';


type Hashtag = {
    id: string;
    name: string;
    slug: string;
    count?: number;
};

export default function HashtagsPage() {
    const [tags, setTags] = useState<Hashtag[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        fetch('/api/hashtags')
            .then(res => res.json())
            .then((data) => {
                if (data?.tags) {
                    // Sort by count desc
                    const sortedTags = [...data.tags].sort((a, b) => (b.count || 0) - (a.count || 0));
                    setTags(sortedTags);
                }
            })
            .catch((e) => console.error('Hashtags fetch error', e))
            .finally(() => setLoading(false));
    }, []);

    const handleTagClick = (tagName: string) => {
        router.push(`/hashtags/${tagName}`);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Header title="Hashtags" />

            <main className="max-w-4xl mx-auto px-6 py-12">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">Explore Hashtags</h1>
                    <p className="text-xl text-gray-600">
                        Discover discussions by topic across Dischan
                    </p>
                </div>

                {loading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
                        <p className="text-orange-600">Loading tags...</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl shadow-sm border border-orange-100 p-8">
                        <div className="flex flex-wrap gap-4 justify-center">
                            {tags.map((tag) => (
                                <button
                                    key={tag.id}
                                    onClick={() => handleTagClick(tag.name)}
                                    className="group relative flex items-center space-x-2 px-4 py-2 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-full transition-all duration-200"
                                >
                                    <span className="text-orange-600 font-medium">#{tag.name}</span>
                                    <span className="bg-white px-2 py-0.5 rounded-full text-xs text-orange-400 border border-orange-100 group-hover:border-orange-200">
                                        {tag.count || 0}
                                    </span>
                                </button>
                            ))}
                        </div>

                        {tags.length === 0 && (
                            <div className="text-center py-12 text-gray-500">
                                No hashtags found yet. Start a thread with a hashtag to see it here!
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}
