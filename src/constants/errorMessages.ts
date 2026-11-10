export const APP_ERROR_MESSAGES = {
  crashTitle: 'Something went wrong',
  crashDescription:
    'Spinflow hit an unexpected problem. Your wheels are still saved when possible. Try again or return to the dashboard.',
  crashTryAgain: 'Try again',
  crashGoHome: 'Back to dashboard',
  routeTitle: 'This page could not be loaded',
  routeDescription: 'An unexpected problem stopped this screen. You can go back and keep using Spinflow.',
  storageUnavailable:
    'Browser storage is unavailable. Changes stay in this session only and may be lost when you close the tab.',
  storageRecovered:
    'Saved data looked damaged, so Spinflow started fresh. Imported or previously saved wheels may need to be added again.',
  storageSaveFailed:
    'Changes could not be saved to browser storage. Check available space or private browsing settings.',
  hierarchyRepaired:
    'Some wheel items had invalid structure and were repaired automatically.',
  invalidWheel:
    'This wheel could not be used because its data is incomplete or invalid.',
  invalidHierarchy:
    'This wheel hierarchy is invalid and could not be updated.',
  spinFailed:
    'The wheel could not finish this spin. Check item weights and try again.',
  importFailed:
    'This file could not be imported. Check that it is a valid Spinflow wheel export.',
  formIncomplete: 'Please fix the highlighted fields before continuing.',
  dismissNotice: 'Dismiss',
} as const;
