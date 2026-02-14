import { db } from './db';
import { userProfiles } from './schema';
import { eq, inArray, and, ne } from 'drizzle-orm';

export interface ProfileData {
  walletAddress: string;
  username?: string | null;
  location?: string | null;
  socialLinks?: {
    x?: string | null;
    youtube?: string | null;
  };
  avatarCid?: string | null;
  avatarUrl?: string | null;
  bio?: string | null;
}

/**
 * Get user profile by wallet address
 */
export async function getUserProfile(walletAddress: string): Promise<ProfileData> {
  const profile = await db.query.userProfiles.findFirst({
    where: eq(userProfiles.walletAddress, walletAddress),
  });

  if (!profile) {
    // Return default profile
    return {
      walletAddress,
      username: null,
      location: null,
      socialLinks: {
        x: null,
        youtube: null,
      },
      bio: null,
      avatarCid: null,
      avatarUrl: null,
    };
  }

  return {
    walletAddress: profile.walletAddress,
    username: profile.username || null,
    location: profile.location || null,
    socialLinks: {
      x: profile.xLink || null,
      youtube: profile.youtubeLink || null,
    },
    bio: profile.bio || null,
    avatarCid: profile.avatarCid || null,
    avatarUrl: profile.avatarUrl || null,
  };
}

/**
 * Get multiple user profiles by wallet addresses
 */
export async function getUserProfiles(walletAddresses: string[]): Promise<ProfileData[]> {
  if (walletAddresses.length === 0) return [];

  const profiles = await db.query.userProfiles.findMany({
    where: inArray(userProfiles.walletAddress, walletAddresses),
  });

  // Create a map for quick lookup
  const profileMap = new Map<string, ProfileData>();
  profiles.forEach((profile) => {
    profileMap.set(profile.walletAddress, {
      walletAddress: profile.walletAddress,
      username: profile.username || null,
      location: profile.location || null,
      socialLinks: {
        x: profile.xLink || null,
        youtube: profile.youtubeLink || null,
      },
      bio: profile.bio || null,
      avatarCid: profile.avatarCid || null,
      avatarUrl: profile.avatarUrl || null,
    });
  });

  // Return profiles for all requested addresses (with defaults for missing ones)
  return walletAddresses.map(address => {
    const profile = profileMap.get(address);
    return profile || {
      walletAddress: address,
      username: null,
      location: null,
      socialLinks: {
        x: null,
        youtube: null,
      },
      bio: null,
      avatarCid: null,
      avatarUrl: null,
    };
  });
}

/**
 * Update or create user profile
 */
export async function updateUserProfile(walletAddress: string, profileData: Partial<ProfileData>) {
  // Validate username if provided
  if (profileData.username !== undefined) {
    if (profileData.username && profileData.username.length > 50) {
      throw new Error('Username must be 50 characters or less');
    }

    // Check if username is already taken by another wallet
    if (profileData.username) {
      const existing = await db.query.userProfiles.findFirst({
        where: and(
          eq(userProfiles.username, profileData.username),
          ne(userProfiles.walletAddress, walletAddress)
        ),
      });

      if (existing) {
        throw new Error('Username is already taken');
      }
    }
  }

  // Validate location if provided
  if (profileData.location !== undefined && profileData.location && profileData.location.length > 100) {
    throw new Error('Location must be 100 characters or less');
  }

  // Validate bio if provided
  if (profileData.bio !== undefined && profileData.bio && profileData.bio.length > 500) {
    throw new Error('Bio must be 500 characters or less');
  }

  // Validate social links
  if (profileData.socialLinks) {
    if (profileData.socialLinks.x && !isValidUrl(profileData.socialLinks.x, ['x.com', 'twitter.com'])) {
      throw new Error('Invalid X.com URL');
    }
    if (profileData.socialLinks.youtube && !isValidUrl(profileData.socialLinks.youtube, ['youtube.com', 'youtu.be'])) {
      throw new Error('Invalid YouTube URL');
    }
  }

  const existingProfile = await db.query.userProfiles.findFirst({
    where: eq(userProfiles.walletAddress, walletAddress),
  });

  const valuesToUpdate = {
    username: profileData.username,
    location: profileData.location,
    bio: profileData.bio,
    xLink: profileData.socialLinks?.x,
    youtubeLink: profileData.socialLinks?.youtube,
    avatarCid: profileData.avatarCid,
    avatarUrl: profileData.avatarUrl,
    updatedAt: new Date(),
  };

  if (existingProfile) {
    await db.update(userProfiles)
      .set(valuesToUpdate)
      .where(eq(userProfiles.walletAddress, walletAddress));
  } else {
    await db.insert(userProfiles)
      .values({
        id: `profile_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        walletAddress,
        ...valuesToUpdate,
      });
  }

  return await getUserProfile(walletAddress);
}

/**
 * Get display name for a wallet address (username or "Anonymous")
 */
export async function getDisplayName(walletAddress: string): Promise<string> {
  const profile = await getUserProfile(walletAddress);
  return profile.username || 'Anonymous';
}

/**
 * Get display names for multiple wallet addresses
 */
export async function getDisplayNames(walletAddresses: string[]): Promise<Map<string, string>> {
  if (walletAddresses.length === 0) return new Map();

  const profiles = await getUserProfiles(walletAddresses);
  const displayNames = new Map<string, string>();

  profiles.forEach(profile => {
    displayNames.set(profile.walletAddress, profile.username || 'Anonymous');
  });

  return displayNames;
}

/**
 * Helper function to validate URLs
 */
function isValidUrl(url: string, allowedDomains: string[]): boolean {
  try {
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
    const hostname = urlObj.hostname.toLowerCase();

    return allowedDomains.some(domain =>
      hostname === domain || hostname.endsWith(`.${domain}`)
    );
  } catch {
    return false;
  }
}
