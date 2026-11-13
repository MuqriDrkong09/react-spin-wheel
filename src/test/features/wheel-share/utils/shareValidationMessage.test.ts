import { SHARE_MESSAGES } from '@/features/wheel-share/constants';
import { shareValidationMessage } from '@/features/wheel-share/utils/shareValidationMessage';

describe('shareValidationMessage', () => {
  it('maps validation paths to share errors', () => {
    expect(shareValidationMessage([{ path: ['wheel', 'name'] }])).toBe(SHARE_MESSAGES.nameRequired);
    expect(shareValidationMessage([{ path: ['name'] }])).toBe(SHARE_MESSAGES.nameRequired);
    expect(shareValidationMessage([{ path: ['wheel', 'items', 0, 'name'] }])).toBe(
      SHARE_MESSAGES.itemNameRequired,
    );
    expect(shareValidationMessage([{ path: ['wheel', 'items'] }])).toBe(SHARE_MESSAGES.itemsRequired);
    expect(shareValidationMessage([{ path: ['items'] }])).toBe(SHARE_MESSAGES.itemsRequired);
    expect(shareValidationMessage([{ path: ['wheel', 'group', 'items'] }])).toBe(
      SHARE_MESSAGES.itemsRequired,
    );
    expect(shareValidationMessage([{ path: ['wheel', 'items', 0, 'color'] }])).toBe(
      SHARE_MESSAGES.invalidColor,
    );
    expect(shareValidationMessage([{ path: ['wheel', 'items', 0, 'weight'] }])).toBe(
      SHARE_MESSAGES.invalidWeight,
    );
    expect(shareValidationMessage([{ path: ['wheel', 'settings'] }])).toBe(SHARE_MESSAGES.invalidSettings);
    expect(shareValidationMessage([{ path: ['wheel', 'appearance', 'theme'] }])).toBe(
      SHARE_MESSAGES.invalidSettings,
    );
    expect(shareValidationMessage([{ path: ['format'] }])).toBe(SHARE_MESSAGES.invalidWheel);
    expect(shareValidationMessage([])).toBe(SHARE_MESSAGES.invalidWheel);
  });
});
