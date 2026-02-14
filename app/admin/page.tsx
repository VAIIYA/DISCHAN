'use client'

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Shield, UserPlus, UserMinus, Users, AlertTriangle, Archive, ArchiveRestore, FileText } from 'lucide-react';
import { useWallet } from '@/contexts/WalletContext';

const ADMIN_WALLET = '2Z9eW3nwa2GZUM1JzXdfBK1MN57RPA2PrhuTREEZ31VY';

interface Mod {
  _id: string;
  walletAddress: string;
  addedBy: string;
  addedAt: string;
}

interface ArchivedThread {
  id: string;
  slug: string;
  title: string;
  archivedAt: string;
  createdAt: string;
  replyCount: number;
  imageCount: number;
  videoCount: number;
  op: {
    authorDisplayName: string;
    timestamp: string;
  };
}

export default function AdminPage() {
  const { wallet } = useWallet();
  const [mods, setMods] = useState<Mod[]>([]);
  const [archivedThreads, setArchivedThreads] = useState<ArchivedThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [archiveLoading, setArchiveLoading] = useState(false);
  const [newModWallet, setNewModWallet] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const isAdmin = wallet.connected && wallet.publicKey === ADMIN_WALLET;

  useEffect(() => {
    if (isAdmin) {
      loadMods();
      loadArchivedThreads();
    }
  }, [isAdmin]);

  const loadMods = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/mods', {
        headers: {
          'x-admin-wallet': wallet.publicKey || ''
        }
      });

      if (response.ok) {
        const data = await response.json();
        setMods(data.mods || []);
      } else if (response.status === 403) {
        setError('Admin access denied');
      } else {
        setError('Failed to load mods');
      }
    } catch (error) {
      console.error('Failed to load mods:', error);
      setError('Failed to load mods');
    } finally {
      setLoading(false);
    }
  };

  const loadArchivedThreads = async () => {
    try {
      setArchiveLoading(true);
      const response = await fetch('/api/admin/archive', {
        headers: {
          'x-admin-wallet': wallet.publicKey || ''
        }
      });

      if (response.ok) {
        const data = await response.json();
        setArchivedThreads(data.archivedThreads?.threads || []);
      } else {
        console.error('Failed to load archived threads');
      }
    } catch (error) {
      console.error('Failed to load archived threads:', error);
    } finally {
      setArchiveLoading(false);
    }
  };

  const handleAddMod = async () => {
    if (!newModWallet.trim()) {
      setError('Please enter a wallet address');
      return;
    }

    try {
      setError('');
      setSuccess('');
      
      const response = await fetch('/api/admin/mods', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-wallet': wallet.publicKey || ''
        },
        body: JSON.stringify({
          action: 'add',
          walletAddress: newModWallet.trim()
        }),
      });

      if (response.ok) {
        setSuccess('Mod added successfully');
        setNewModWallet('');
        loadMods();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to add mod');
      }
    } catch (error) {
      console.error('Failed to add mod:', error);
      setError('Failed to add mod. Please try again.');
    }
  };

  const handleRemoveMod = async (walletAddress: string) => {
    if (!confirm(`Are you sure you want to remove ${walletAddress.slice(0, 8)}...${walletAddress.slice(-8)} as a mod?`)) {
      return;
    }

    try {
      setError('');
      setSuccess('');

      const response = await fetch('/api/admin/mods', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-wallet': wallet.publicKey || ''
        },
        body: JSON.stringify({
          action: 'remove',
          walletAddress
        }),
      });

      if (response.ok) {
        setSuccess('Mod removed successfully');
        loadMods();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to remove mod');
      }
    } catch (error) {
      console.error('Failed to remove mod:', error);
      setError('Failed to remove mod. Please try again.');
    }
  };

  const handleUnarchiveThread = async (threadId: string, threadTitle: string) => {
    if (!confirm(`Are you sure you want to unarchive the thread "${threadTitle}"?`)) {
      return;
    }

    try {
      setError('');
      setSuccess('');

      const response = await fetch('/api/admin/archive', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-wallet': wallet.publicKey || ''
        },
        body: JSON.stringify({
          action: 'unarchive',
          threadId
        }),
      });

      if (response.ok) {
        setSuccess('Thread unarchived successfully');
        loadArchivedThreads();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to unarchive thread');
      }
    } catch (error) {
      console.error('Failed to unarchive thread:', error);
      setError('Failed to unarchive thread. Please try again.');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 8)}...${address.slice(-8)}`;
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen">
        <Header title="Admin Dashboard" showHomeLink={true} showAdvertiseLink={false} />
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="text-center">
            <div className="bg-white rounded-lg p-8 shadow-md max-w-md mx-auto">
              <div className="flex justify-center mb-4">
                <Shield className="w-16 h-16 text-red-500" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
              <p className="text-gray-600 mb-6">
                This admin dashboard is restricted to authorized wallet addresses only.
              </p>
              {!wallet.connected ? (
                <div className="space-y-4">
                  <p className="text-sm text-gray-500">
                    Please connect your wallet to verify admin access.
                  </p>
                  <button
                    onClick={() => window.location.href = '/'}
                    className="w-full bg-orange-500 text-white py-2 px-4 rounded-lg hover:bg-orange-600 transition-colors"
                  >
                    Go to Homepage
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Connected wallet is not authorized for admin access</span>
                  </div>
                  <p className="text-xs text-gray-400">
                    Connected: {formatAddress(wallet.publicKey || '')}
                  </p>
                  <button
                    onClick={() => window.location.href = '/'}
                    className="w-full bg-orange-500 text-white py-2 px-4 rounded-lg hover:bg-orange-600 transition-colors"
                  >
                    Go to Homepage
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header title="Admin Dashboard" showHomeLink={true} showAdvertiseLink={false} />
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <p className="text-orange-600">Loading mods...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header title="Admin Dashboard" showHomeLink={true} showAdvertiseLink={false} />
      
      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Admin Dashboard
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Manage moderators, archived threads, and configure Dischan settings.
          </p>
        </div>

        {/* Status Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-2 text-red-800">
              <AlertTriangle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-2 text-green-800">
              <span>✓</span>
              <span>{success}</span>
            </div>
          </div>
        )}

        {/* Add Mod Section */}
        <div className="bg-white rounded-lg p-6 shadow-md mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
            <UserPlus className="w-6 h-6 mr-2 text-orange-500" />
            Add Moderator
          </h2>
          
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                value={newModWallet}
                onChange={(e) => setNewModWallet(e.target.value)}
                placeholder="Enter Solana wallet address"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
              />
            </div>
            
            <button
              onClick={handleAddMod}
              className="px-6 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors"
            >
              Add Mod
            </button>
          </div>
          
          <p className="text-sm text-gray-500 mt-2">
            Moderators can post and comment without paying fees.
          </p>
        </div>

        {/* Mods List */}
        <div className="bg-white rounded-lg p-6 shadow-md mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
            <Users className="w-6 h-6 mr-2 text-orange-500" />
            Current Moderators ({mods.length})
          </h2>

          {mods.length === 0 ? (
            <p className="text-gray-500 italic">No moderators added yet.</p>
          ) : (
            <div className="space-y-3">
              {mods.map((mod) => (
                <div key={mod._id} className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                  <div className="flex-1">
                    <div className="font-mono text-sm text-gray-700 mb-1">
                      {mod.walletAddress}
                    </div>
                    <div className="text-xs text-gray-500">
                      Added by {formatAddress(mod.addedBy)} on {formatDate(mod.addedAt)}
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveMod(mod.walletAddress)}
                    className="flex items-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                  >
                    <UserMinus className="w-4 h-4" />
                    <span>Remove</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Archived Threads */}
        <div className="bg-white rounded-lg p-6 shadow-md">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
            <Archive className="w-6 h-6 mr-2 text-orange-500" />
            Archived Threads ({archivedThreads.length})
          </h2>

          <p className="text-sm text-gray-600 mb-4">
            Threads are automatically archived when there are more than 100 active threads.
            Only admins can unarchive them.
          </p>

          {archiveLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-2"></div>
              <p className="text-orange-600">Loading archived threads...</p>
            </div>
          ) : archivedThreads.length === 0 ? (
            <p className="text-gray-500 italic">No threads archived yet.</p>
          ) : (
            <div className="space-y-3">
              {archivedThreads.map((thread) => (
                <div key={thread.id} className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 mb-1">
                      {thread.title}
                    </div>
                    <div className="text-sm text-gray-600 mb-1">
                      by {thread.op.authorDisplayName} • {thread.replyCount} replies
                      {thread.imageCount > 0 && ` • ${thread.imageCount} images`}
                      {thread.videoCount > 0 && ` • ${thread.videoCount} videos`}
                    </div>
                    <div className="text-xs text-gray-500">
                      Created {formatDate(thread.createdAt)} • Archived {formatDate(thread.archivedAt)}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <a
                      href={`/threads/${thread.id}`}
                      className="flex items-center space-x-2 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <FileText className="w-4 h-4" />
                      <span>View</span>
                    </a>
                    <button
                      onClick={() => handleUnarchiveThread(thread.id, thread.title)}
                      className="flex items-center space-x-2 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                    >
                      <ArchiveRestore className="w-4 h-4" />
                      <span>Unarchive</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-8">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">About Dischan</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• <strong>Moderators:</strong> Can post and comment without paying the 0.01 USDC fee</li>
            <li>• <strong>Admins:</strong> Automatically exempt from fees and can manage moderators and archived threads</li>
            <li>• <strong>Archiving:</strong> Threads are automatically archived when there are more than 100 active threads</li>
            <li>• <strong>Fees:</strong> Regular users pay 0.01 USDC per thread or comment to the treasury wallet</li>
            <li>• <strong>Files:</strong> Images and videos are stored on Storacha (decentralized storage)</li>
            <li>• <strong>Sage:</strong> Users can sage posts to prevent thread bumping</li>
            <li>• <strong>Treasury:</strong> 2sRhKuPffCwT2uuGVu3DXDsLFmjv78uKkEMd9UYrF5jv</li>
          </ul>
        </div>
      </main>
    </div>
  );
}

