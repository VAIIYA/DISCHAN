'use client'

import React, { useState } from 'react';
import { RefreshCw } from 'lucide-react';

export const SyncButton: React.FC = () => {
    const [isSyncing, setIsSyncing] = useState(false);
    const [status, setStatus] = useState<string | null>(null);

    const handleSync = async () => {
        setIsSyncing(true);
        setStatus('Syncing...');
        try {
            const response = await fetch('/api/admin/auto-fetch', {
                method: 'POST',
            });
            const data = await response.json();
            if (data.success) {
                setStatus(`Successfully synced: ${data.addedCount} new threads.`);
                // Reload page to show new content if on home/catalog
                setTimeout(() => {
                    window.location.reload();
                }, 2000);
            } else {
                setStatus(`Sync failed: ${data.details || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Sync error:', error);
            setStatus('Sync failed. Please try again.');
        } finally {
            setIsSyncing(false);
            // Clear status after 5 seconds
            setTimeout(() => setStatus(null), 5000);
        }
    };

    return (
        <div className="flex flex-col items-center">
            <button
                onClick={handleSync}
                disabled={isSyncing}
                className="inline-flex items-center justify-center rounded-full font-bold transition-all active:scale-95 disabled:opacity-50 border-2 border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white px-4 py-1.5 text-sm gap-2 mt-2"
            >
                <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                {isSyncing ? 'Syncing with HASHCUBE...' : 'Sync with HASHCUBE'}
            </button>
            {status && (
                <p className="text-xs mt-2 text-gray-500 font-medium animate-in fade-in slide-in-from-top-1">
                    {status}
                </p>
            )}
        </div>
    );
};
