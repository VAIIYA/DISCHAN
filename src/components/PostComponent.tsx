import React, { useState } from 'react';
import { Post } from '../types';
import { Play, Pause, X, Maximize2, User } from 'lucide-react';
import { MarkdownContent } from './MarkdownContent';

interface PostComponentProps {
  post: Post;
  isOP?: boolean;
}

export const PostComponent: React.FC<PostComponentProps> = ({ post, isOP = false }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoRef, setVideoRef] = useState<HTMLVideoElement | null>(null);
  const [isImageExpanded, setIsImageExpanded] = useState(false);


  const formatDate = (date: Date | string | null | undefined) => {
    try {
      if (date == null) return 'No date';
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      if (isNaN(dateObj.getTime())) return 'Invalid date';

      return new Intl.DateTimeFormat('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      }).format(dateObj);
    } catch (error) {
      return 'Invalid date';
    }
  };

  const handleVideoPlayPause = () => {
    if (videoRef) {
      if (isPlaying) videoRef.pause();
      else videoRef.play();
      setIsPlaying(!isPlaying);
    }
  };

  const toggleImageExpansion = () => setIsImageExpanded(!isImageExpanded);

  return (
    <div className="flex items-start space-x-3 group mb-6 hover:bg-gray-50/50 p-2 rounded-xl transition-colors">
      {/* Avatar */}
      <div className={`
        flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white shadow-sm
        ${isOP ? 'bg-orange-500' : 'bg-gray-400'}
      `}>
        <User size={20} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline space-x-2 mb-1">
          <span className={`font-bold text-sm ${!post.isAnonymous && post.authorWallet ? 'text-orange-600' : 'text-gray-900'}`}>
            {post.authorDisplayName || (post.isAnonymous ? 'Anonymous' : (post.authorWallet ? `${post.authorWallet.slice(0, 8)}` : 'Unknown'))}
          </span>
          <span className="text-[10px] text-gray-400 font-medium">
            {formatDate(post.timestamp)}
          </span>
          {isOP && (
            <span className="text-[9px] bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded font-bold uppercase tracking-tighter">
              OP
            </span>
          )}
        </div>

        {/* Content Bubble */}
        <div className={`
          relative inline-block max-w-[95%] rounded-2xl p-4 shadow-sm border
          ${isOP ? 'bg-orange-50 border-orange-100 rounded-tl-none' : 'bg-white border-gray-100 rounded-tl-none'}
        `}>
          {/* Media Content */}
          {(post.image || post.video || post.ipfsCid) && (
            <div className="mb-3 overflow-hidden rounded-lg">
              {post.image && (
                <div className="relative group/media">
                  <img
                    src={post.imageThumb || post.image}
                    alt="Post media"
                    className="max-w-full h-auto cursor-pointer hover:brightness-95 transition-all"
                    style={{ maxHeight: '400px' }}
                    onClick={toggleImageExpansion}
                  />
                  <button
                    onClick={toggleImageExpansion}
                    className="absolute top-2 right-2 bg-black/50 text-white p-1.5 rounded-lg opacity-0 group-hover/media:opacity-100 transition-opacity"
                  >
                    <Maximize2 size={14} />
                  </button>
                </div>
              )}

              {post.video && !post.image && (
                <div className="relative bg-black rounded-lg overflow-hidden group/video">
                  <video
                    ref={setVideoRef}
                    src={post.video}
                    className="max-w-full h-auto"
                    style={{ maxHeight: '400px' }}
                    onEnded={() => setIsPlaying(false)}
                    autoPlay
                    muted
                    loop
                  />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/video:opacity-100 transition-opacity">
                    <button
                      onClick={handleVideoPlayPause}
                      className="bg-black/50 text-white p-3 rounded-full hover:bg-black/70"
                    >
                      {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                    </button>
                  </div>
                </div>
              )}

              {post.ipfsCid && !post.image && !post.video && (
                <div className="bg-gray-900 p-4 flex flex-col items-center">
                  <span className="text-[10px] text-orange-400 font-mono mb-2">CID: {post.ipfsCid.slice(0, 20)}...</span>
                  <a
                    href={`https://gateway.ipfs.io/ipfs/${post.ipfsCid}`}
                    target="_blank"
                    className="text-white bg-orange-600 px-4 py-2 rounded-lg text-xs font-bold hover:bg-orange-700"
                  >
                    View IPFS Content
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Text Content */}
          {post.content && (
            <div className="prose prose-sm max-w-none text-gray-800 break-words leading-relaxed">
              <MarkdownContent content={post.content} />
            </div>
          )}
        </div>

        {/* Post Metadata/Hash */}
        <div className="mt-1 flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-[9px] font-mono text-gray-400">ID: {post.id.slice(0, 8)}</span>
        </div>
      </div>

      {/* Expanded Image Modal */}
      {isImageExpanded && post.image && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="relative max-w-6xl max-h-full">
            <img
              src={post.image}
              alt="Expanded"
              className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl"
            />
            <button
              onClick={toggleImageExpansion}
              className="absolute -top-12 right-0 text-white hover:text-orange-400 transition-colors"
            >
              <X size={32} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};