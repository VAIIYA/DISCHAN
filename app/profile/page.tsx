'use client'

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { useWallet } from '@/contexts/WalletContext';
import {
  User, Camera, Save, Loader, MessageSquare, Image as ImageIcon, ChevronRight, Zap, Globe
} from 'lucide-react';


interface ProfileData {
  username: string;
  location: string;
  x: string;
  youtube: string;
  bio: string;
  avatarCid: string;
  avatarUrl: string;
}

interface UserPost {
  id: string;
  threadId: string;
  content?: string;
  image?: string;
  video?: string;
  timestamp: string;
  threadTitle?: string;
  ipfsCid?: string;
}

export default function ProfilePage() {
  const { wallet } = useWallet();
  const [profile, setProfile] = useState<ProfileData>({
    username: '',
    location: '',
    x: '',
    youtube: '',
    bio: '',
    avatarCid: '',
    avatarUrl: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [userPosts, setUserPosts] = useState<UserPost[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [showImageEdit, setShowImageEdit] = useState(false);

  useEffect(() => {
    if (wallet.connected && wallet.publicKey) {
      loadProfile();
      loadUserPosts();
    } else {
      setLoading(false);
    }
  }, [wallet.connected, wallet.publicKey]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch(`/api/profile?walletAddress=${wallet.publicKey}`);
      if (response.ok) {
        const data = await response.json();
        setProfile({
          username: data.profile?.username || '',
          location: data.profile?.location || '',
          x: data.profile?.socialLinks?.x || '',
          youtube: data.profile?.socialLinks?.youtube || '',
          bio: data.profile?.bio || '',
          avatarCid: data.profile?.avatarCid || '',
          avatarUrl: data.profile?.avatarUrl || '',
        });
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserPosts = async () => {
    try {
      setPostsLoading(true);
      const response = await fetch(`/api/profile/posts?walletAddress=${wallet.publicKey}`);
      if (response.ok) {
        const data = await response.json();
        setUserPosts(data.posts || []);
      }
    } catch (error) {
      console.error('Failed to load user posts:', error);
    } finally {
      setPostsLoading(false);
    }
  };

  const handleSave = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!wallet.connected || !wallet.publicKey) return;
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: wallet.publicKey,
          username: profile.username.trim() || null,
          location: profile.location.trim() || null,
          socialLinks: { x: profile.x.trim() || null, youtube: profile.youtube.trim() || null },
          bio: profile.bio.trim() || null,
          avatarCid: profile.avatarCid.trim() || null,
          avatarUrl: profile.avatarUrl.trim() || null,
        }),
      });
      if (response.ok) {
        setSuccess('Profile updated successfully!');
        setShowImageEdit(false);
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (error) {
      setError('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const formatAddress = (address: string) => `${address.slice(0, 8)}...${address.slice(-8)}`;
  const avatarSrc = profile.avatarUrl || (profile.avatarCid ? `https://ipfs.io/ipfs/${profile.avatarCid}` : null);

  if (!wallet.connected || !wallet.publicKey) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header title="Profile" showHomeLink={true} showAdvertiseLink={true} />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="bg-white rounded-3xl p-12 shadow-2xl text-center border border-gray-100 max-w-lg w-full">
            <div className="w-20 h-20 bg-orange-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <User className="w-10 h-10 text-orange-500" />
            </div>
            <h2 className="text-2xl font-black text-gray-900 mb-2">Wallet Disconnected</h2>
            <p className="text-gray-500 mb-8">Please connect your Solana wallet to manage your decentralized identity.</p>
            <button onClick={() => window.location.href = '/'} className="w-full bg-orange-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-orange-100">Back Home</button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header title="Profile" showHomeLink={true} showAdvertiseLink={true} />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center">
            <Loader className="w-12 h-12 text-orange-500 animate-spin mx-auto mb-4 opacity-20" />
            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Loading Identity...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header title="User Profile" showHomeLink={true} showAdvertiseLink={true} />

      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-10">
        {/* Status Messages */}
        <div className="fixed top-24 right-6 z-50 flex flex-col gap-2 pointer-events-none">
          {error && (
            <div className="bg-red-500 text-white px-6 py-4 rounded-2xl shadow-2xl animate-in slide-in-from-right fade-in pointer-events-auto flex items-center gap-3">
              <span className="text-xl font-bold">!</span>
              <span className="font-bold text-sm">{error}</span>
            </div>
          )}
          {success && (
            <div className="bg-green-500 text-white px-6 py-4 rounded-2xl shadow-2xl animate-in slide-in-from-right fade-in pointer-events-auto flex items-center gap-3">
              <span className="text-xl font-bold">✓</span>
              <span className="font-bold text-sm">{success}</span>
            </div>
          )}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Sidebar / Settings */}
          <aside className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
              <div className="relative mb-8 flex justify-center">
                <div className="w-32 h-32 bg-gray-100 rounded-2xl overflow-hidden border-4 border-white shadow-lg group relative">
                  {avatarSrc ? <img src={avatarSrc} className="w-full h-full object-cover" /> : <User className="w-full h-full p-6 text-gray-300" />}
                  <button onClick={() => setShowImageEdit(!showImageEdit)} className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Camera className="text-white w-8 h-8" />
                  </button>
                </div>

                {showImageEdit && (
                  <div className="absolute top-full mt-4 w-full bg-white rounded-2xl shadow-xl p-4 z-50 border border-gray-100 animate-in zoom-in-95">
                    <input type="text" placeholder="Avatar URL" value={profile.avatarUrl} onChange={e => setProfile({ ...profile, avatarUrl: e.target.value })} className="w-full bg-gray-50 border-none rounded-lg p-3 text-sm mb-3" />
                    <button onClick={() => handleSave()} className="w-full bg-orange-500 text-white font-bold py-2 rounded-lg text-sm">Save Image</button>
                  </div>
                )}
              </div>

              <div className="text-center mb-10">
                <h2 className="text-2xl font-black text-gray-900 mb-1">{profile.username || 'Anonymous'}</h2>
                <div className="inline-flex items-center space-x-2 bg-gray-100 px-3 py-1 rounded-full">
                  <Globe size={12} className="text-gray-400" />
                  <span className="text-[10px] font-mono text-gray-500">{formatAddress(wallet.publicKey)}</span>
                </div>
              </div>

              <form onSubmit={handleSave} className="space-y-5">
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 mb-1.5 block">Display Name</label>
                  <input type="text" value={profile.username} onChange={e => setProfile({ ...profile, username: e.target.value })} className="w-full bg-gray-50 border-none rounded-xl p-3 font-bold text-gray-900 focus:ring-2 focus:ring-orange-500" />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 mb-1.5 block">Bio</label>
                  <textarea value={profile.bio} onChange={e => setProfile({ ...profile, bio: e.target.value })} rows={3} className="w-full bg-gray-50 border-none rounded-xl p-3 text-sm text-gray-600 focus:ring-2 focus:ring-orange-500 resize-none" />
                </div>
                <button type="submit" disabled={saving} className="w-full bg-gray-900 text-white font-bold py-3 rounded-xl flex items-center justify-center space-x-2 hover:bg-black transition-all">
                  {saving ? <Loader className="animate-spin w-5 h-5" /> : <><Save size={18} /><span>Save Profile</span></>}
                </button>
              </form>
            </div>

            <div className="bg-orange-500 rounded-3xl p-8 text-white shadow-lg shadow-orange-100">
              <h3 className="font-black text-xl mb-2">Premium Access</h3>
              <p className="text-orange-100 text-sm mb-6">Connect with Solana to unlock unique badges and custom themes.</p>
              <div className="flex items-center space-x-2 text-sm font-bold bg-white/20 px-4 py-2 rounded-xl">
                <Zap size={16} />
                <span>Active Member</span>
              </div>
            </div>
          </aside>

          {/* Main Feed Content */}
          <section className="lg:col-span-8">
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 mb-8">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-bold text-gray-900 flex items-center space-x-3">
                  <MessageSquare className="text-orange-500" />
                  <span>Your Transmissions</span>
                </h3>
                <span className="bg-orange-100 text-orange-600 px-3 py-1 rounded-full text-xs font-bold">{userPosts.length} Posts</span>
              </div>

              {postsLoading ? (
                <div className="py-20 flex flex-col items-center justify-center">
                  <Loader className="animate-spin text-orange-500 w-10 h-10 mb-4 opacity-20" />
                  <span className="text-xs font-bold text-gray-300 uppercase tracking-widest">Loading history...</span>
                </div>
              ) : userPosts.length === 0 ? (
                <div className="py-20 text-center">
                  <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <ImageIcon className="text-gray-200" />
                  </div>
                  <p className="text-gray-400 font-medium">No activity found yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {userPosts.map(post => (
                    <div key={post.id} className="group flex items-start space-x-4 p-4 rounded-2xl border border-gray-50 hover:border-orange-100 hover:bg-orange-50/30 transition-all">
                      <div className="flex-shrink-0 w-12 h-12 bg-gray-100 rounded-xl overflow-hidden">
                        {post.image ? <img src={post.image} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-300 font-bold">#</div>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-sm font-bold text-gray-900 truncate pr-4">{post.threadTitle || 'Discussion Post'}</h4>
                          <span className="text-[10px] text-gray-400 font-medium">{new Date(post.timestamp).toLocaleDateString()}</span>
                        </div>
                        <p className="text-xs text-gray-500 line-clamp-2 mb-3 leading-relaxed">{post.content}</p>
                        <a href={`/thread/${post.threadId}`} className="inline-flex items-center text-[10px] font-bold text-orange-600 uppercase tracking-wider hover:underline">
                          View Thread <ChevronRight size={10} className="ml-1" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

        </div>
      </main>
    </div>
  );
}


