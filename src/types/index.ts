export interface Channel {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Post {
  id: string;
  timestamp: Date;
  content?: string | null; // Made optional - users can post just an image/video
  image?: string | null;
  imageThumb?: string | null;
  video?: string | null;
  replies?: Post[];
  authorWallet?: string; // Solana wallet address
  authorDisplayName?: string; // Custom username or "Anonymous"
  blobId?: string; // Vercel Blob ID for the post content
  imageBlobId?: string; // Vercel Blob ID for the image
  videoBlobId?: string; // Vercel Blob ID for the video
  ipfsCid?: string | null;
  twitterUrl?: string | null;
  isAnonymous: boolean;
  saged?: boolean; // Whether this post was saged
}

export interface Thread {
  id: string;
  slug?: string; // URL-friendly slug for the thread
  title: string;
  channelId?: string; // New channel reference
  ipnsLink?: string; // IPNS link for decentralized hosting
  ipfsCid?: string; // IPFS CID for thread media
  twitterUrl?: string; // Twitter video URL
  hashtags?: string[]; // Array of hashtags
  op: Post;
  replies: Post[];
  lastReply: Date;
  replyCount: number;
  imageCount: number;
  videoCount: number;
  board: string;
  page: number; // Which page this thread belongs to (1-10)
  createdAt: Date;
  lastActivity: Date; // For cleanup purposes
  authorWallet?: string; // OP's wallet address
  isOptimistic?: boolean; // Flag for optimistic updates
  saged?: boolean; // Whether the thread is saged (bumplocked)
}

export interface Board {
  id: string;
  name: string;
  description: string;
  threads?: Thread[];
  isNSFW?: boolean;
  maxPages: number; // Default 10
  threadsPerPage: number; // Default 10
  maxThreads: number; // Default 100 (10 pages * 10 threads)
}

export interface Page {
  pageNumber: number;
  threads: Thread[];
}

export interface WalletConnection {
  publicKey: string;
  connected: boolean;
  connecting: boolean;
}

export interface BlobUploadResult {
  url: string;
  blobId: string;
  fileType: string;
  isVideo: boolean;
}

export interface CreateThreadRequest {
  title: string;
  channelId?: string; // New channel reference
  content?: string; // Made optional - users can post just an image/video
  image?: string;
  video?: string;
  authorWallet?: string; // Solana wallet address
  paymentSignature?: string; // Payment transaction signature for posting fee
  ipnsLink?: string; // Optional IPNS link
  ipfsCid?: string | null; // Optional IPFS CID
  hashtags?: string[]; // Optional hashtags
  isAnonymous?: boolean; // Optional anonymity preference
  twitterUrl?: string | null; // Optional Twitter URL
}

export interface CreatePostRequest {
  threadId: string;
  content?: string | null; // Made optional - users can post just an image/video
  image?: string | null;
  video?: string | null;
  ipfsCid?: string | null;
  authorWallet?: string; // Solana wallet address
  paymentSignature?: string; // Payment transaction signature for posting fee
  isAnonymous?: boolean; // Optional anonymity preference
}