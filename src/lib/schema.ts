import { sqliteTable, text, integer, primaryKey } from 'drizzle-orm/sqlite-core';
import { sql, relations } from 'drizzle-orm';

// Users table for email/password auth
export const users = sqliteTable('users', {
    id: text('id').primaryKey(),
    email: text('email').notNull().unique(),
    password: text('password').notNull(),
    name: text('name').default('Anonymous'),
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
});

// Channels table
export const channels = sqliteTable('channels', {
    id: text('id').primaryKey(),
    name: text('name').notNull().unique(),
    slug: text('slug').notNull().unique(),
    description: text('description'),
    icon: text('icon'), // Lucide icon name or emoji
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
});

// Tags table (Keep for legacy support or specific tagging)
export const tags = sqliteTable('tags', {
    id: text('id').primaryKey(),
    name: text('name').notNull().unique(),
    slug: text('slug').notNull().unique(),
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
});

// User Profiles table
export const userProfiles = sqliteTable('user_profiles', {
    id: text('id').primaryKey(), // Using numeric ID string or random
    walletAddress: text('wallet_address').notNull().unique(),
    username: text('username'),
    location: text('location'),
    bio: text('bio'),
    xLink: text('x_link'),
    youtubeLink: text('youtube_link'),
    avatarCid: text('avatar_cid'),
    avatarUrl: text('avatar_url'),
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
});

// Files table (metadata)
export const files = sqliteTable('files', {
    id: text('id').primaryKey(),
    filename: text('filename').notNull(),
    contentType: text('content_type').notNull(),
    size: integer('size').notNull(),
    uploadedAt: integer('uploaded_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
    uploadedBy: text('uploaded_by').notNull(),
    gridFSFileId: text('gridFSFileId').notNull(), // Stores CID
    isDeleted: integer('is_deleted', { mode: 'boolean' }).default(false),
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
});

// Threads table
export const threads = sqliteTable('threads', {
    id: text('id').primaryKey(),
    slug: text('slug').notNull().unique(),
    title: text('title').notNull(),
    channelId: text('channel_id').references(() => channels.id), // Added channelId
    ipnsLink: text('ipns_link'),
    ipfsCid: text('ipfs_cid'),
    opPostId: text('op_post_id'), // Break circular dependency during creation
    authorId: text('author_id'), // Wallet address, optional for anonymous
    replyCount: integer('reply_count').default(0),
    imageCount: integer('image_count').default(0),
    videoCount: integer('video_count').default(0),
    lastActivity: integer('last_activity', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
    archived: integer('archived', { mode: 'boolean' }).default(false),
    archivedAt: integer('archived_at', { mode: 'timestamp' }),
    saged: integer('saged', { mode: 'boolean' }).default(false),
    sageCount: integer('sage_count').default(0),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
});

// Posts table
export const posts = sqliteTable('posts', {
    id: text('id').primaryKey(),
    threadId: text('thread_id').notNull(),
    content: text('content'),
    imageFileId: text('image_file_id'), // References files.id
    videoFileId: text('video_file_id'), // References files.id
    ipfsCid: text('ipfs_cid'),
    authorId: text('author_id'),
    isAnonymous: integer('is_anonymous', { mode: 'boolean' }).default(true),
    timestamp: integer('timestamp', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
    saged: integer('saged', { mode: 'boolean' }).default(false),
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
});

// Thread-Tags junction table
export const threadTags = sqliteTable('thread_tags', {
    threadId: text('thread_id').notNull(),
    tagId: text('tag_id').notNull(),
}, (table) => ({
    pk: primaryKey({ columns: [table.threadId, table.tagId] }),
}));

// Mods table
export const mods = sqliteTable('mods', {
    id: text('id').primaryKey(),
    walletAddress: text('wallet_address').notNull().unique(),
    addedBy: text('added_by').notNull(), // Admin wallet address
    addedAt: integer('added_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
});


// Ads table
export const ads = sqliteTable('ads', {
    id: text('id').primaryKey(),
    title: text('title').notNull(),
    link: text('link').notNull(),
    imageUrl: text('image_url').notNull(),
    placement: text('placement').notNull(), // 'header' or 'footer'
    startDate: integer('start_date', { mode: 'timestamp' }).notNull(),
    endDate: integer('end_date', { mode: 'timestamp' }).notNull(),
    duration: integer('duration').notNull(), // in days
    amount: integer('amount').notNull(), // in USDC
    currency: text('currency').default('USDC'),
    status: text('status').default('pending_payment'), // pending_payment, active, rejected, expired
    transactionSignature: text('transaction_signature'),
    advertiserWallet: text('advertiser_wallet').notNull(),
    email: text('email'),
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
});

// Relations
export const threadsRelations = relations(threads, ({ one, many }) => ({
    opPost: one(posts, {
        fields: [threads.opPostId],
        references: [posts.id],
    }),
    channel: one(channels, {
        fields: [threads.channelId],
        references: [channels.id],
    }),
    posts: many(posts),
    threadTags: many(threadTags),
}));

export const postsRelations = relations(posts, ({ one }) => ({
    thread: one(threads, {
        fields: [posts.threadId],
        references: [threads.id],
    }),
}));

export const channelsRelations = relations(channels, ({ many }) => ({
    threads: many(threads),
}));

export const tagsRelations = relations(tags, ({ many }) => ({
    threadTags: many(threadTags),
}));

export const threadTagsRelations = relations(threadTags, ({ one }) => ({
    thread: one(threads, {
        fields: [threadTags.threadId],
        references: [threads.id],
    }),
    tag: one(tags, {
        fields: [threadTags.tagId],
        references: [tags.id],
    }),
}));
