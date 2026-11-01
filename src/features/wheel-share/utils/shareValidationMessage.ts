import { SHARE_MESSAGES } from '@/features/wheel-share/constants';

export function shareValidationMessage(issues: readonly { path: PropertyKey[] }[]): string {
  const path = issues[0]?.path.map(String).join('.') ?? '';

  if (path === 'wheel.name' || path === 'name') {
    return SHARE_MESSAGES.nameRequired;
  }

  if (path.endsWith('.name')) {
    return SHARE_MESSAGES.itemNameRequired;
  }

  if (path === 'wheel.items' || path === 'items' || path.endsWith('.items')) {
    return SHARE_MESSAGES.itemsRequired;
  }

  if (path.includes('color')) {
    return SHARE_MESSAGES.invalidColor;
  }

  if (path.includes('weight')) {
    return SHARE_MESSAGES.invalidWeight;
  }

  if (path.includes('settings') || path.includes('appearance')) {
    return SHARE_MESSAGES.invalidSettings;
  }

  return SHARE_MESSAGES.invalidWheel;
}
