'use client'

import React, { useState } from 'react';
import { Send, X, Upload, Image, Video } from 'lucide-react';
import { useWallet } from '@/contexts/WalletContext';
import { HashtagInput } from './HashtagInput';

interface PostFormData {
  content?: string | null;
  image?: File | null;
  video?: File | null;
  title?: string | null;
  saged?: boolean;
  hashtags?: string[];
  ipnsLink?: string | null;
  ipfsCid?: string | null;
  twitterUrl?: string | null;
  isAnonymous?: boolean;
}

interface PostFormProps {
  isReply?: boolean;
  onSubmit: (data: PostFormData) => Promise<void>;
  onCancel?: () => void;
  threadSaged?: boolean;
}

export const PostForm: React.FC<PostFormProps> = ({
  isReply = false,
  onSubmit,
  onCancel
}) => {
  const { wallet, connect } = useWallet();
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [contentSource, setContentSource] = useState(''); // Combined CID/Twitter field
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saged, setSaged] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(true);

  const SUGGESTED_HASHTAGS = ['movies', 'opensource', 'ukraine', 'epstein'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content?.trim()) {
      alert('Please provide a comment');
      return;
    }

    if (!isReply && !title.trim()) {
      alert('Please provide a thread title');
      return;
    }

    setIsSubmitting(true);

    try {
      // Determine if contentSource is CID or Twitter URL
      let ipfsCid = null;
      let twitterUrl = null;

      const trimmedSource = contentSource.trim();
      if (trimmedSource) {
        if (trimmedSource.startsWith('http') || trimmedSource.includes('x.com') || trimmedSource.includes('twitter.com')) {
          twitterUrl = trimmedSource;
        } else {
          ipfsCid = trimmedSource;
        }
      }

      await onSubmit({
        content: content.trim() || null,
        title: isReply ? null : title.trim() || null,
        image: mediaFile?.type.startsWith('image/') ? mediaFile : null,
        video: mediaFile?.type.startsWith('video/') ? mediaFile : null,
        hashtags: hashtags,
        ipnsLink: null,
        ipfsCid,
        twitterUrl,
        saged: isReply ? saged : false,
        isAnonymous: isAnonymous
      });

      // Reset form
      setContent('');
      setTitle('');
      setMediaFile(null);
      setContentSource('');
      setIsAnonymous(true);
      setHashtags([]);
    } catch (error) {
      console.error('Failed to submit post:', error);
      alert('Failed to submit post. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target.files?.[0];
      if (file) {
        const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        const allowedVideoTypes = ['video/webm', 'video/mp4', 'video/quicktime'];
        const allowedTypes = [...allowedImageTypes, ...allowedVideoTypes];

        if (!allowedTypes.includes(file.type)) {
          alert('File type not allowed. Please select a JPG, PNG, GIF, WebP image or WebM/MP4/MOV video.');
          return;
        }

        const isVideo = allowedVideoTypes.includes(file.type);
        const maxSize = isVideo ? 10 * 1024 * 1024 : 5 * 1024 * 1024;

        if (file.size > maxSize) {
          const maxSizeMB = maxSize / (1024 * 1024);
          alert(`File too large. Maximum size for ${isVideo ? 'videos' : 'images'}: ${maxSizeMB}MB`);
          return;
        }

        setMediaFile(file);
      }
    } catch (error) {
      console.error('Error handling file change:', error);
      alert('Error processing file. Please try again.');
    }
  };

  const addSuggestedTag = (tag: string) => {
    if (hashtags.length < 3 && !hashtags.includes(tag)) {
      setHashtags([...hashtags, tag]);
    }
  };

  const getFileIcon = () => {
    if (!mediaFile) return <Upload size={18} />;
    return mediaFile.type.startsWith('video/') ? <Video size={18} /> : <Image size={18} />;
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-xl relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 via-pink-500 to-orange-500"></div>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">
            {isReply ? 'Post Reply' : 'Start New Thread'}
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Share your thoughts anonymously with the community
          </p>
        </div>
        <div className="flex items-center space-x-4">
          {!wallet.connected ? (
            <button
              onClick={connect}
              className="text-xs font-bold text-white bg-orange-500 hover:bg-orange-600 px-4 py-2 rounded-full shadow-sm transition-all"
            >
              Connect Wallet
            </button>
          ) : (
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Premium Account</span>
              <span className="text-xs font-semibold text-pink-600 bg-pink-50 px-3 py-1 rounded-full border border-pink-100">
                {wallet.publicKey?.toString().slice(0, 4)}...{wallet.publicKey?.toString().slice(-4)}
              </span>
            </div>
          )}

          {onCancel && (
            <button
              onClick={onCancel}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"
            >
              <X size={20} />
            </button>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {!isReply && (
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Subject <span className="text-orange-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What's on your mind?"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all"
              required={!isReply}
            />
          </div>
        )}

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">
            Description <span className="text-orange-500">*</span>
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Type your message here..."
            rows={5}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none resize-none transition-all"
            required
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              IPFS CID OR X VIDEO URL (Optional)
            </label>
            <input
              type="text"
              value={contentSource}
              onChange={(e) => setContentSource(e.target.value)}
              placeholder="Qm... or https://x.com/..."
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all"
            />
            <p className="text-[10px] text-gray-400 font-medium ml-1">
              Supports IPFS CIDs and Twitter/X video links
            </p>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Upload Media (Optional)
            </label>
            <div className="relative group">
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.gif,.webp,.webm,.mp4,.mov"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 flex items-center justify-between group-hover:border-orange-300 transition-all">
                <span className="text-gray-400 truncate max-w-[85%]">
                  {mediaFile ? mediaFile.name : "Click to select file..."}
                </span>
                <div className="text-orange-400">
                  {getFileIcon()}
                </div>
              </div>
            </div>
            {mediaFile && (
              <p className="text-[10px] text-green-600 font-bold ml-1 animate-pulse">
                READY: {mediaFile.name} ({(mediaFile.size / (1024 * 1024)).toFixed(2)}MB)
              </p>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <HashtagInput value={hashtags} onChange={setHashtags} maxTags={3} />
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Quick Tags:</span>
            {SUGGESTED_HASHTAGS.map(tag => (
              <button
                key={tag}
                type="button"
                onClick={() => addSuggestedTag(tag)}
                disabled={hashtags.includes(tag) || hashtags.length >= 3}
                className="text-[11px] px-2 py-1 bg-gray-100 hover:bg-orange-100 hover:text-orange-600 rounded-md text-gray-500 transition-all border border-transparent hover:border-orange-200 disabled:opacity-50"
              >
                #{tag}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center space-x-6">
            {isReply && (
              <label className="flex items-center space-x-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={saged}
                  onChange={(e) => setSaged(e.target.checked)}
                  className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                />
                <span className="text-sm font-semibold text-gray-600 group-hover:text-gray-900 transition-colors">Sage</span>
              </label>
            )}

            {wallet.connected && (
              <label className="flex items-center space-x-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                />
                <span className="text-sm font-semibold text-gray-600 group-hover:text-gray-900 transition-colors">Anonymous</span>
              </label>
            )}
          </div>

          <button
            type="submit"
            disabled={!content?.trim() || (!isReply && !title.trim()) || isSubmitting}
            className="group flex items-center space-x-3 bg-gray-900 hover:bg-orange-600 disabled:bg-gray-300 text-white px-8 py-4 rounded-xl font-bold transition-all duration-300 shadow-lg hover:shadow-orange-200 active:scale-95 touch-manipulation"
          >
            <span>{isSubmitting ? 'Processing...' : (isReply ? 'Post Reply' : 'Create Thread')}</span>
            <Send size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
          </button>
        </div>
      </form>
    </div>
  );
};
