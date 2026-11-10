import { Alert } from '@mui/material';
import { useFormContext } from 'react-hook-form';

import { APP_ERROR_MESSAGES } from '@/constants/errorMessages';

function collectMessages(value: unknown, messages: string[] = []): string[] {
  if (!value || typeof value !== 'object') {
    return messages;
  }

  if ('message' in value && typeof value.message === 'string' && value.message.trim()) {
    messages.push(value.message.trim());
    return messages;
  }

  for (const nested of Object.values(value as Record<string, unknown>)) {
    collectMessages(nested, messages);
  }

  return messages;
}

/** Accessible summary of react-hook-form validation errors after submit. */
export function FormErrorSummary({ fallback = APP_ERROR_MESSAGES.formIncomplete }: { fallback?: string }) {
  const {
    formState: { errors, submitCount, isValid },
  } = useFormContext();

  if (submitCount === 0 || isValid) {
    return null;
  }

  const messages = [...new Set(collectMessages(errors))];
  // Single-field errors already appear beside the input; summarize only when multiple fail.
  if (messages.length <= 1) {
    return null;
  }

  return (
    <Alert severity="error" role="alert" sx={{ mb: 1 }}>
      {fallback}
    </Alert>
  );
}
