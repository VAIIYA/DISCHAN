import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ApiService } from '@/services/api';

// Mock fetch globally
const fetchMock = vi.fn();
global.fetch = fetchMock;

describe('ApiService.uploadFile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should upload file successfully', async () => {
    const mockFile = new File(['test content'], 'test.png', { type: 'image/png' });
    const mockResponse = {
      url: '/api/files/test-id',
      blobId: 'test-id',
      fileId: 'test-id',
      filename: 'test.png',
      fileType: 'image/png',
      isVideo: false,
    };

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const result = await ApiService.uploadFile(mockFile, 'test-wallet');

    expect(fetchMock).toHaveBeenCalledWith('/api/upload', {
      method: 'POST',
      body: expect.any(FormData),
    });

    expect(result).toEqual(mockResponse);
  });

  it('should handle upload failure', async () => {
    const mockFile = new File(['test content'], 'test.png', { type: 'image/png' });

    fetchMock.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: 'Upload failed' }),
    });

    await expect(ApiService.uploadFile(mockFile, 'test-wallet')).rejects.toThrow('Upload failed');
  });

  it('should handle network error', async () => {
    const mockFile = new File(['test content'], 'test.png', { type: 'image/png' });

    fetchMock.mockRejectedValueOnce(new Error('Network error'));

    await expect(ApiService.uploadFile(mockFile, 'test-wallet')).rejects.toThrow('Network error');
  });
});