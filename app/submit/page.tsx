'use client'

import React from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { PostForm } from '@/components/PostForm';
import { ApiService } from '@/services/api';
import { useWallet } from '@/contexts/WalletContext';

export default function SubmitPage() {
    const router = useRouter();
    const { wallet } = useWallet();

    const handleCreateThread = async (data: any) => {
        if (!wallet.connected || !wallet.publicKey) {
            alert('Please connect your Solana wallet to create a thread');
            return;
        }

        try {
            let imageUrl = undefined;
            let videoUrl = undefined;

            // Handle Image Upload
            if (data.image) {
                try {
                    const uploadResult = await ApiService.uploadFile(data.image, wallet.publicKey);
                    imageUrl = uploadResult.url;
                } catch (error) {
                    console.error('Failed to upload image:', error);
                    alert(`Failed to upload image: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`);
                    return;
                }
            }

            // Handle Video Upload
            if (data.video) {
                try {
                    const uploadResult = await ApiService.uploadFile(data.video, wallet.publicKey);
                    videoUrl = uploadResult.url;
                } catch (error) {
                    console.error('Failed to upload video:', error);
                    alert(`Failed to upload video: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`);
                    return;
                }
            }

            // Create thread on server
            const result = await ApiService.createThread({
                title: data.title,
                content: data.content || undefined,
                image: imageUrl || undefined,
                video: videoUrl || undefined,
                authorWallet: wallet.publicKey || undefined,
                ipfsCid: data.ipfsCid || undefined,
                twitterUrl: data.twitterUrl || undefined,
                hashtags: data.hashtags || undefined,
                isAnonymous: data.isAnonymous ?? true
            });

            if (result.success && result.thread) {
                // Redirect to the new thread
                const threadUrl = result.thread.slug ? `/thread/${result.thread.slug}` : `/threads/${result.thread.id}`;
                router.push(threadUrl);
            } else {
                throw new Error(result.error || 'Failed to create thread');
            }
        } catch (error: any) {
            console.error('Thread creation failed:', error);
            alert(`Failed to create thread: ${error.message || 'Unknown error'}. Please try again.`);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Header title="Submit Thread" />

            <main className="max-w-4xl mx-auto px-6 py-12">
                <PostForm
                    onSubmit={handleCreateThread}
                    onCancel={() => router.back()}
                />
            </main>

            <Footer />
        </div>
    );
}
