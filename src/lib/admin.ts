import 'server-only';
import { db } from './db';
import { mods } from './schema';
import { eq, desc } from 'drizzle-orm';
import { ADMIN_WALLET, TREASURY_WALLET, POSTING_FEE } from './constants';

// Re-export for backward compatibility
export { ADMIN_WALLET, TREASURY_WALLET, POSTING_FEE };

/**
 * Check if a wallet is an admin
 */
export function isAdmin(walletAddress: string): boolean {
  return walletAddress === ADMIN_WALLET;
}

/**
 * Check if a wallet is a mod
 */
export async function isMod(walletAddress: string): Promise<boolean> {
  if (isAdmin(walletAddress)) {
    return true; // Admins are also mods
  }

  try {
    const mod = await db.query.mods.findFirst({
      where: eq(mods.walletAddress, walletAddress),
    });
    return !!mod;
  } catch (error) {
    console.error('Error checking if wallet is mod:', error);
    return false;
  }
}

/**
 * Check if a wallet is exempt from fees (admin or mod)
 */
export async function isExemptFromFees(walletAddress: string): Promise<boolean> {
  return isAdmin(walletAddress) || await isMod(walletAddress);
}

/**
 * Get all mods
 */
export async function getAllMods() {
  return await db.query.mods.findMany({
    orderBy: [desc(mods.addedAt)],
  });
}

/**
 * Add a mod
 */
export async function addMod(walletAddress: string, addedBy: string) {
  // Check if already exists
  const existing = await db.query.mods.findFirst({
    where: eq(mods.walletAddress, walletAddress),
  });

  if (existing) {
    throw new Error('Wallet is already a mod');
  }

  const id = `mod_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  await db.insert(mods).values({
    id,
    walletAddress,
    addedBy,
    addedAt: new Date(),
  });

  return { id, walletAddress, addedBy, addedAt: new Date() };
}

/**
 * Remove a mod
 */
export async function removeMod(walletAddress: string) {
  // Don't allow removing the admin
  if (isAdmin(walletAddress)) {
    throw new Error('Cannot remove admin');
  }

  await db.delete(mods).where(eq(mods.walletAddress, walletAddress));
  return true;
}
