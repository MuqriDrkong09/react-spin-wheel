import { isRouteErrorResponse, useNavigate, useRouteError } from 'react-router-dom';

import { GlobalErrorFallback } from '@/components/feedback/GlobalErrorFallback';
import { APP_ERROR_MESSAGES } from '@/constants/errorMessages';
import { ROUTES } from '@/constants/routes';
import { isProductionUi, toUserErrorMessage } from '@/utils/toUserErrorMessage';

export function RouteErrorPage() {
  const error = useRouteError();
  const navigate = useNavigate();

  const title = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText || APP_ERROR_MESSAGES.routeTitle}`
    : APP_ERROR_MESSAGES.routeTitle;

  const description = isRouteErrorResponse(error)
    ? APP_ERROR_MESSAGES.routeDescription
    : APP_ERROR_MESSAGES.crashDescription;

  return (
    <GlobalErrorFallback
      title={title}
      description={description}
      error={isProductionUi() ? undefined : error}
      onReset={() => {
        void navigate(0);
      }}
      onGoHome={() => {
        void navigate(ROUTES.dashboard, { replace: true });
      }}
    />
  );
}

/** Keeps production route UI free of stack traces while still logging safely. */
export function describeRouteError(error: unknown): string {
  if (isRouteErrorResponse(error)) {
    return `${error.status}: ${error.statusText || 'Route error'}`;
  }

  return toUserErrorMessage(error, APP_ERROR_MESSAGES.routeDescription);
}
