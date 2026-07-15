const SYNC_PREFIX = '[ALPHABAG_SYNC:';
const SYNC_SUFFIX = ']';

export interface CloudSyncData {
  wallets: any[];
  manualHoldings: any[];
  hideSmall: boolean;
}

/**
 * Extracts the serialized portfolio sync state from the user bio text.
 * Returns the clean, user-readable biography text and the parsed sync configuration.
 */
export const extractSyncData = (bio: string = ''): { bioText: string; syncData: CloudSyncData | null } => {
  if (!bio) return { bioText: '', syncData: null };
  
  const startIdx = bio.indexOf(SYNC_PREFIX);
  if (startIdx === -1) return { bioText: bio, syncData: null };
  
  const endIdx = bio.indexOf(SYNC_SUFFIX, startIdx);
  if (endIdx === -1) return { bioText: bio, syncData: null };
  
  // Reconstruct clean bio description without the sync tag
  const before = bio.substring(0, startIdx).trim();
  const after = bio.substring(endIdx + SYNC_SUFFIX.length).trim();
  const bioText = [before, after].filter(Boolean).join(' ');
  
  const jsonStr = bio.substring(startIdx + SYNC_PREFIX.length, endIdx);
  try {
    const parsed = JSON.parse(jsonStr);
    return {
      bioText,
      syncData: {
        wallets: Array.isArray(parsed.wallets) ? parsed.wallets : [],
        manualHoldings: Array.isArray(parsed.manualHoldings) ? parsed.manualHoldings : [],
        hideSmall: typeof parsed.hideSmall === 'boolean' ? parsed.hideSmall : true,
      }
    };
  } catch (e) {
    console.warn('[SyncService] Failed to parse serialized cloud sync payload from bio.', e);
    return { bioText: bio, syncData: null };
  }
};

/**
 * Serializes portfolio configurations and injects them as an invisible payload into user's bio text.
 */
export const injectSyncData = (bioText: string = '', syncData: CloudSyncData): string => {
  // Strip any existing sync tags first
  const cleanBio = bioText.replace(/\[ALPHABAG_SYNC:.*?\]/g, '').trim();
  const payload: CloudSyncData = {
    wallets: syncData.wallets || [],
    manualHoldings: syncData.manualHoldings || [],
    hideSmall: syncData.hideSmall
  };
  return `${cleanBio} [ALPHABAG_SYNC:${JSON.stringify(payload)}]`.trim();
};
