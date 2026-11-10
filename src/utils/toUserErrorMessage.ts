import { APP_ERROR_MESSAGES } from '@/constants/errorMessages';

/** Maps unknown thrown values to a safe, user-facing message (never a stack). */
export function toUserErrorMessage(error: unknown, fallback = APP_ERROR_MESSAGES.crashDescription): string {
  if (typeof error === 'string' && error.trim()) {
    return error.trim();
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message.trim();
  }

  return fallback;
}

export function isProductionUi(): boolean {
  return import.meta.env.PROD;
}
