import { APP_ERROR_MESSAGES } from '@/constants/errorMessages';
import { isProductionUi, toUserErrorMessage } from '@/utils/toUserErrorMessage';

describe('toUserErrorMessage', () => {
  it('prefers error messages and falls back safely', () => {
    expect(toUserErrorMessage(new Error('Nope'))).toBe('Nope');
    expect(toUserErrorMessage(new Error('  Disk full  '))).toBe('Disk full');
    expect(toUserErrorMessage('  Broken JSON  ')).toBe('Broken JSON');
    expect(toUserErrorMessage('')).toBe(APP_ERROR_MESSAGES.crashDescription);
    expect(toUserErrorMessage('   ')).toBe(APP_ERROR_MESSAGES.crashDescription);
    expect(toUserErrorMessage(new Error(''))).toBe(APP_ERROR_MESSAGES.crashDescription);
    expect(toUserErrorMessage({})).toBe(APP_ERROR_MESSAGES.crashDescription);
    expect(toUserErrorMessage(null, 'Custom fallback')).toBe('Custom fallback');
  });
});

describe('isProductionUi', () => {
  it('reflects the Vite production flag', () => {
    expect(isProductionUi()).toBe(Boolean(import.meta.env.PROD));
  });
});
