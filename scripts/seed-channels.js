const { createClient } = require('@libsql/client');
const { drizzle } = require('drizzle-orm/libsql');
const { v4: uuidv4 } = require('uuid');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

const client = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
});

const db = drizzle(client);

// Define table names as strings for simple SQL execution if we don't want to import full schema
const CHANNELS_TABLE = 'channels';
const THREADS_TABLE = 'threads';

async function seed() {
    console.log('Starting seed process...');

    const defaultChannels = [
        { id: uuidv4(), name: 'General', slug: 'general', description: 'General discussion', icon: 'Hash' },
        { id: uuidv4(), name: 'Music', slug: 'music', description: 'Share and discuss music', icon: 'Music' },
        { id: uuidv4(), name: 'Crypto', slug: 'crypto', description: 'Solana and crypto talk', icon: 'Coins' },
        { id: uuidv4(), name: 'Art', slug: 'art', description: 'Creative works and AI art', icon: 'Palette' },
        { id: uuidv4(), name: 'Gaming', slug: 'gaming', description: 'Game discussions', icon: 'Gamepad2' },
    ];

    try {
        // 1. Insert channels
        for (const channel of defaultChannels) {
            console.log(`Inserting channel: ${channel.name}`);
            await client.execute({
                sql: `INSERT OR IGNORE INTO ${CHANNELS_TABLE} (id, name, slug, description, icon, created_at, updated_at) 
                      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
                args: [channel.id, channel.name, channel.slug, channel.description, channel.icon]
            });
        }

        // 2. Get the ID of the general channel
        const generalChannelResult = await client.execute({
            sql: `SELECT id FROM ${CHANNELS_TABLE} WHERE slug = 'general' LIMIT 1`,
            args: []
        });

        const generalChannelId = generalChannelResult.rows[0]?.id;

        if (generalChannelId) {
            console.log(`Updating existing threads to use general channel (ID: ${generalChannelId})`);
            await client.execute({
                sql: `UPDATE ${THREADS_TABLE} SET channel_id = ? WHERE channel_id IS NULL`,
                args: [generalChannelId]
            });
        }

        console.log('Seed process completed successfully!');
    } catch (error) {
        console.error('Seed process failed:', error);
    } finally {
        process.exit(0);
    }
}

seed();
