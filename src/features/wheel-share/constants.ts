export const WHEEL_SHARE_FORMAT = 'spinflow.share' as const;

export const WHEEL_SHARE_VERSION = 1 as const;

export const SHARE_QUERY_PARAM = 's';

export const SHARE_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export const MAX_SHARE_TOKEN_LENGTH = 8_000;

export const SHARE_TRANSPORT = {
  encodedQuery: 'encoded-query',
  remotePath: 'remote-path',
} as const;

export const ACTIVE_SHARE_TRANSPORT = SHARE_TRANSPORT.encodedQuery;

export const SHARE_MESSAGES = {
  pageTitle: 'Shared wheel',
  pageDescription: 'Preview this wheel, then save a copy to your workspace.',
  previewHint: 'This is a preview. Saving creates a new wheel with new ids. Favorites, history, and other private state are never included in a share link.',
  optionsHeading: 'Items',
  copyLink: 'Copy share link',
  saveCopy: 'Save a copy',
  backToDashboard: 'Back to dashboard',
  copied: (name: string) => `Copied share link for ${name}.`,
  saved: (name: string) => `Saved ${name} as a copy.`,
  copyFailed: 'Could not copy the share link.',
  notFound: 'This wheel is missing or was deleted.',
  tooLarge: 'This wheel is too large to share as a link.',
  nameRequired: 'Add a wheel name before sharing.',
  itemNameRequired: 'Each item needs a name before sharing.',
  itemsRequired: 'Add at least one item before sharing.',
  invalidColor: 'Each item needs a valid color before sharing.',
  invalidWeight: 'Each item needs a weight of at least 1 before sharing.',
  invalidSettings: 'Wheel settings are incomplete or invalid.',
  invalidWheel: 'This wheel cannot be shared until its data is valid.',
  missingTitle: 'This share link is missing',
  missing: 'This share link is missing or incomplete.',
  expiredTitle: 'This share link has expired',
  expired: 'This share link has expired and can no longer be opened.',
  invalidTitle: 'This share link is invalid',
  invalid: 'This share link is invalid and cannot be opened.',
  unavailableTitle: 'This share link cannot be opened',
  unavailable: 'This share link needs a sharing service that is not configured yet.',
  saveFailed: 'This shared wheel could not be saved.',
} as const;
