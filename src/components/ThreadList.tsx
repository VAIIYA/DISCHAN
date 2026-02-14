import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Thread } from '../types';
import { Calendar, MessageSquare, Image, ArrowLeft, Plus, ChevronLeft, ChevronRight, Video, RefreshCw } from 'lucide-react';
import { useWallet } from '@/contexts/WalletContext';
import { ApiService } from '@/services/api';
import { HashtagCloud } from './HashtagCloud';

interface ThreadListProps {
  threads: Thread[];
  onThreadSelect?: (threadId: string) => void;
  onBack?: () => void;
  showBackButton?: boolean;
  loading?: boolean;
  onThreadCreated?: () => void;
  hidePagination?: boolean;
}

export const ThreadList: React.FC<ThreadListProps> = ({
  threads: initialThreads,
  onThreadSelect,
  onBack,
  showBackButton = true,
  loading: externalLoading = false,
  hidePagination = false
}) => {
  const router = useRouter();
  const { wallet } = useWallet();
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [threads, setThreads] = useState<Thread[]>(initialThreads);
  const [tagFilter, setTagFilter] = useState<string | null>(null);

  const formatDate = (date: Date | string | null | undefined) => {
    try {
      // Handle null/undefined cases
      if (date == null) {
        return 'No date';
      }

      // Convert string to Date if needed
      const dateObj = typeof date === 'string' ? new Date(date) : date;

      // Check if the date is valid
      if (isNaN(dateObj.getTime())) {
        console.warn('Invalid date value:', date);
        return 'Invalid date';
      }

      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(dateObj);
    } catch (error) {
      console.error('Error formatting date:', error, date);
      return 'Invalid date';
    }
  };

  const loadThreads = async (page: number, isBackgroundRefresh = false) => {
    // Don't show loading spinner for background refreshes
    if (!isBackgroundRefresh) {
      setIsLoading(true);
    }

    try {
      const response = await ApiService.getThreads(page, hidePagination ? 100 : undefined);

      // Normalize the thread data to convert date strings back to Date objects
      const normalizedThreads = (response.threads || []).map((thread: any) => {
        try {
          // Validate that the thread has the required structure
          if (!thread) {
            console.warn('Thread is null or undefined:', thread);
            return null;
          }

          // Handle threads that might not have op property (backward compatibility)
          if (!thread.op) {
            console.warn('Thread missing op property, creating fallback:', thread);
            // Create a fallback op structure
            thread.op = {
              id: `fallback_${thread.id}`,
              timestamp: new Date(thread.createdAt || Date.now()),
              content: thread.title || 'No content',
              authorWallet: thread.authorWallet || 'unknown',
              isAnonymous: true
            };
          }

          return {
            ...thread,
            lastReply: new Date(thread.lastReply || Date.now()),
            createdAt: new Date(thread.createdAt || Date.now()),
            lastActivity: new Date(thread.lastActivity || Date.now()),
            op: {
              ...thread.op,
              timestamp: new Date(thread.op.timestamp || Date.now())
            }
          };
        } catch (error) {
          console.error('Error normalizing thread:', error, thread);
          // Return a safe fallback thread
          return {
            ...thread,
            lastReply: new Date(),
            createdAt: new Date(),
            lastActivity: new Date(),
            op: {
              ...thread.op,
              timestamp: new Date()
            }
          };
        }
      }).filter(Boolean) as Thread[]; // Remove any null threads

      // Only update if we have new data or it's not a background refresh
      if (!isBackgroundRefresh || normalizedThreads.length !== threads.length) {
        setThreads(normalizedThreads);
      }
      setTotalPages(response.totalPages || 1);
    } catch (error) {
      console.error('Failed to load threads:', error);
      if (!isBackgroundRefresh) {
        setThreads([]);
        setTotalPages(1);
      }
    } finally {
      if (!isBackgroundRefresh) {
        setIsLoading(false);
      }
    }
  };

  // Normalize initial threads when they change
  useEffect(() => {
    if (initialThreads.length > 0) {
      console.log('Normalizing initial threads:', initialThreads.length);
      const normalizedInitialThreads = initialThreads.map((thread: Thread) => {
        try {
          console.log('Normalizing initial thread:', thread.id, 'with dates:', {
            lastReply: thread.lastReply,
            createdAt: thread.createdAt,
            lastActivity: thread.lastActivity,
            opTimestamp: thread.op?.timestamp
          });

          // Validate that the thread has the required structure
          if (!thread) {
            console.warn('Initial thread is null or undefined:', thread);
            return null;
          }

          // Handle threads that might not have op property (backward compatibility)
          if (!thread.op) {
            console.warn('Initial thread missing op property, creating fallback:', thread);
            // Create a fallback op structure
            thread.op = {
              id: `fallback_${thread.id}`,
              timestamp: new Date(thread.createdAt || Date.now()),
              content: thread.title || 'No content',
              authorWallet: thread.authorWallet || 'unknown',
              isAnonymous: true
            };
          }

          return {
            ...thread,
            lastReply: new Date(thread.lastReply || Date.now()),
            createdAt: new Date(thread.createdAt || Date.now()),
            lastActivity: new Date(thread.lastActivity || Date.now()),
            op: {
              ...thread.op,
              timestamp: new Date(thread.op.timestamp || Date.now())
            }
          };
        } catch (error) {
          console.error('Error normalizing initial thread:', error, thread);
          // Return a safe fallback thread
          return {
            ...thread,
            lastReply: new Date(),
            createdAt: new Date(),
            lastActivity: new Date(),
            op: {
              ...thread.op,
              timestamp: new Date()
            }
          };
        }
      }).filter(Boolean) as Thread[]; // Remove any null threads
      setThreads(normalizedInitialThreads);
    }
  }, [initialThreads]);

  // Hashtag click handler to filter feed via API
  const handleTagClick = async (name: string) => {
    setTagFilter(name);
    try {
      const result = await ApiService.searchThreads('', [name]);
      if (result?.threads) setThreads(result.threads as Thread[]);
    } catch (e) {
      console.error('Hashtag filter error', e);
    }
  };

  // Smart refresh: only refresh on user interactions
  // - Manual refresh button
  // - After creating a new thread
  // - When user returns to the page (visibility change)

  useEffect(() => {
    const handleVisibilityChange = () => {
      // Refresh when user returns to the tab (but not on initial load)
      if (!document.hidden && threads.length > 0) {
        loadThreads(currentPage, true); // Background refresh
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [currentPage, threads.length]);

  useEffect(() => {
    // Only load threads if we don't have initial threads
    if (initialThreads.length === 0) {
      loadThreads(currentPage);
    }
  }, [currentPage, initialThreads.length]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          {showBackButton && onBack && (
            <button
              onClick={onBack}
              className="flex items-center space-x-2 text-orange-600 hover:text-orange-700 transition-colors"
            >
              <ArrowLeft size={20} />
              <span>Back to boards</span>
            </button>
          )}
        </div>

        <div className="flex items-center space-x-3">
          {/* Manual refresh button */}
          <button
            onClick={() => loadThreads(currentPage)}
            disabled={isLoading}
            className="flex items-center space-x-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
            title="Refresh threads"
          >
            <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>

          {wallet.connected && wallet.publicKey && (
            <button
              onClick={() => router.push('/submit')}
              className="flex items-center space-x-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <Plus size={18} />
              <span>Start New Thread</span>
            </button>
          )}
        </div>
      </div>

      {/* Hashtag cloud bar for discovery and filtering */}
      <HashtagCloud onTagClick={handleTagClick} />

      {tagFilter && (
        <div className="mb-4 text-sm text-gray-600 text-center">
          Filtering by #{tagFilter} <button className="ml-2 text-blue-600" onClick={() => setTagFilter(null)}>Clear</button>
        </div>
      )}

      {showBackButton && (
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-orange-600 mb-2">Dischan</h1>
          {!hidePagination && (
            <p className="text-gray-600">Page {currentPage} of {totalPages}</p>
          )}
        </div>
      )}

      {(isLoading || externalLoading) ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="text-orange-500 mt-4">Loading threads...</p>
        </div>
      ) : threads.length === 0 ? (
        <div className="text-center py-12">
          <MessageSquare className="mx-auto text-orange-400 mb-4" size={48} />
          <p className="text-orange-500">No threads yet. Be the first to post!</p>
        </div>
      ) : (
        <>
          <div className="max-w-4xl mx-auto space-y-6">
            {threads.map((thread) => {
              try {
                return (
                  <div
                    key={thread.id}
                    onClick={() => {
                      // Use slug-based URL if available, fallback to ID
                      const threadUrl = thread.slug ? `/thread/${thread.slug}` : `/threads/${thread.id}`;

                      // For optimistic threads, add a small delay to ensure server processing
                      if (thread.isOptimistic) {
                        setTimeout(() => {
                          onThreadSelect?.(threadUrl);
                        }, 1000); // 1 second delay for optimistic threads
                      } else {
                        // Preload the thread data for instant navigation
                        ApiService.getThread(thread.id).catch(console.error);
                        onThreadSelect?.(threadUrl);
                      }
                    }}
                    className={`bg-white border rounded-lg p-6 hover:bg-gray-50 hover:border-orange-200 hover:shadow-md transition-all duration-200 cursor-pointer group shadow-sm ${thread.isOptimistic
                      ? 'border-blue-300 bg-blue-50'
                      : 'border-gray-200'
                      }`}
                  >
                    <div className="flex items-start space-x-4">
                      {thread.op && thread.op.image && (
                        <img
                          src={thread.op.imageThumb || thread.op.image}
                          alt="Thread image"
                          className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                        />
                      )}
                      {thread.op && thread.op.video && !thread.op.image && (
                        <div className="w-16 h-16 bg-gray-100 rounded-lg flex-shrink-0 flex items-center justify-center">
                          <Video size={24} className="text-gray-400" />
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="text-lg font-semibold text-gray-800 group-hover:text-orange-600 transition-colors">
                            {thread.title}
                          </h3>
                          {thread.isOptimistic && (
                            <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
                              Posting...
                            </span>
                          )}
                        </div>

                        <p className="text-gray-600 text-sm mb-3 line-clamp-3">
                          {thread.op?.content || ''}
                        </p>

                        {thread.hashtags && thread.hashtags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-3">
                            {thread.hashtags.map((tag) => (
                              <span
                                key={tag}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleTagClick(tag);
                                }}
                                className="px-2 py-0.5 bg-orange-100 text-orange-600 text-xs rounded-full hover:bg-orange-200 transition-colors"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}

                        {thread.ipnsLink && (
                          <div className="flex items-center space-x-1 mb-3 text-xs text-blue-600 font-medium">
                            <span className="uppercase font-bold text-[10px] bg-blue-100 px-1 rounded">IPNS</span>
                            <span className="truncate max-w-[200px]">{thread.ipnsLink}</span>
                          </div>
                        )}

                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-1">
                              <MessageSquare size={12} />
                              <span>{thread.replyCount} replies</span>
                            </div>

                            {thread.imageCount > 0 && (
                              <div className="flex items-center space-x-1">
                                <Image size={12} />
                                <span>{thread.imageCount} images</span>
                              </div>
                            )}

                            {thread.videoCount > 0 && (
                              <div className="flex items-center space-x-1">
                                <Video size={12} />
                                <span>{thread.videoCount} videos</span>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center space-x-1">
                            <Calendar size={12} />
                            <span>{formatDate(thread.lastReply)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              } catch (error) {
                console.error('Error rendering thread:', error, thread);
                return (
                  <div key={thread.id} className="bg-red-50 border border-red-200 rounded-lg p-6">
                    <p className="text-red-600">Error displaying thread: {thread.id}</p>
                  </div>
                );
              }
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && !hidePagination && (
            <div className="flex items-center justify-center space-x-2 mt-8">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="flex items-center space-x-1 px-3 py-2 text-orange-600 hover:text-orange-700 disabled:text-gray-400 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={16} />
                <span>Previous</span>
              </button>

              <div className="flex space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`px-3 py-2 rounded-lg ${pageNum === currentPage
                        ? 'bg-orange-500 text-white'
                        : 'text-orange-600 hover:bg-orange-100'
                        }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="flex items-center space-x-1 px-3 py-2 text-orange-600 hover:text-orange-700 disabled:text-gray-400 disabled:cursor-not-allowed"
              >
                <span>Next</span>
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
