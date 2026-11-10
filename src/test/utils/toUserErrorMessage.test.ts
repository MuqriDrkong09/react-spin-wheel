import { APP_ERROR_MESSAGES } from '@/constants/errorMessages';
import { toUserErrorMessage } from '@/utils/toUserErrorMessage';

describe('toUserErrorMessage', () => {
  it('prefers error messages and falls back safely', () => {
    expect(toUserErrorMessage(new Error('Nope'))).toBe('Nope');
    expect(toUserErrorMessage('  Broken JSON  ')).toBe('Broken JSON');
    expect(toUserErrorMessage({})).toBe(APP_ERROR_MESSAGES.crashDescription);
  });
});
