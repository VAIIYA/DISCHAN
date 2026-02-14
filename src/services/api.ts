import { CreateThreadRequest, CreatePostRequest, BlobUploadResult } from '@/types';

export class ApiService {
  static async uploadFile(file: File, authorWallet: string): Promise<BlobUploadResult> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('authorWallet', authorWallet);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Upload failed', status: response.status }));
        const errorMessage = error.error || error.details || `Upload failed with status ${response.status}`;
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('File upload successful:', result);
      return result;
    } catch (error) {
      console.error('File upload failed:', error);
      throw error;
    }
  }

  static async createThread(request: CreateThreadRequest & { authorWallet?: string; paymentSignature?: string }): Promise<any> {
    console.log('Creating thread:', request);

    try {
      const response = await fetch(`/api/threads`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      console.log('Thread creation response status:', response.status);

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to create thread' }));
        console.error('Thread creation error:', error);
        console.error('Response status:', response.status);
        console.error('Response headers:', Object.fromEntries(response.headers.entries()));
        throw new Error(error.error || 'Failed to create thread');
      }

      const result = await response.json();
      console.log('Thread creation result:', result);

      // Verify the result has the expected structure
      if (!result.success || !result.thread) {
        console.error('Invalid thread creation result:', result);
        throw new Error('Invalid response from server');
      }

      return result;
    } catch (error) {
      console.error('Thread creation request failed:', error);
      throw error;
    }
  }

  static async getThreads(page: number = 1, limit?: number): Promise<any> {
    console.log('Fetching threads, page:', page, 'limit:', limit);

    try {
      const url = limit
        ? `/api/threads?page=${page}&limit=${limit}`
        : `/api/threads?page=${page}`;
      const response = await fetch(url);

      if (!response.ok) {
        console.error('Failed to get threads, status:', response.status);
        // Return empty result instead of throwing for better UX
        return { threads: [], page, totalPages: 0, totalThreads: 0 };
      }

      const result = await response.json();
      console.log('Threads result:', result);
      return result;
    } catch (error) {
      console.error('Get threads request failed:', error);
      // Return empty result instead of throwing for better UX
      return { threads: [], page, totalPages: 0, totalThreads: 0 };
    }
  }

  static async createPost(request: CreatePostRequest & { authorWallet?: string; paymentSignature?: string }): Promise<any> {
    console.log('Creating post:', request);

    const response = await fetch(`/api/threads/${request.threadId}/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to create post' }));
      throw new Error(error.error || 'Failed to create post');
    }

    return response.json();
  }

  static async getThread(threadId: string): Promise<any> {
    try {
      const response = await fetch(`/api/threads/${threadId}`, {
        // Add cache control for better performance
        cache: 'no-store', // Always get fresh data
        headers: {
          'Cache-Control': 'no-cache'
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          return { success: false, error: 'Thread not found' };
        }
        const error = await response.json().catch(() => ({ error: 'Failed to get thread' }));
        return { success: false, error: error.error || 'Failed to get thread' };
      }

      const result = await response.json();
      return result;
    } catch (error) {
      // Don't log network errors as they're expected during retries
      return { success: false, error: 'Failed to load thread' };
    }
  }

  // Channel methods
  static async getChannels(): Promise<any> {
    try {
      const response = await fetch('/api/channels');
      if (!response.ok) {
        throw new Error('Failed to fetch channels');
      }
      return response.json();
    } catch (error) {
      console.error('Get channels failed:', error);
      return { success: false, channels: [] };
    }
  }

  // Simple search wrapper to hit the new /api/search endpoint
  static async searchThreads(query?: string, hashtags?: string[]): Promise<any> {
    const params = new URLSearchParams();
    if (query) params.set('query', query);
    if (hashtags && hashtags.length > 0) params.set('hashtags', hashtags.join(','));
    const url = `/api/search?${params.toString()}`;
    const response = await fetch(url);
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Search failed' }));
      throw new Error(error.error || 'Search failed');
    }
    return response.json();
  }
}

