import { act } from '@testing-library/react';

import { RuntimeNoticeBanner } from '@/components/feedback/RuntimeNoticeBanner';
import { APP_ERROR_MESSAGES } from '@/constants/errorMessages';
import {
  reportRuntimeNotice,
  resetRuntimeNoticeStore,
  useRuntimeNoticeStore,
  type RuntimeNoticeKind,
} from '@/stores/runtimeNoticeStore';
import { renderWithProviders, screen, userEvent } from '@/test/test-utils';

const ERROR_KINDS = ['storageUnavailable', 'storageSaveFailed'] as const satisfies RuntimeNoticeKind[];
const WARNING_KINDS = ['storageRecovered', 'hierarchyRepaired'] as const satisfies RuntimeNoticeKind[];

const NOTICE_COPY: Record<RuntimeNoticeKind, string> = {
  storageUnavailable: APP_ERROR_MESSAGES.storageUnavailable,
  storageRecovered: APP_ERROR_MESSAGES.storageRecovered,
  storageSaveFailed: APP_ERROR_MESSAGES.storageSaveFailed,
  hierarchyRepaired: APP_ERROR_MESSAGES.hierarchyRepaired,
};

function seedNotice(kind: RuntimeNoticeKind, message?: string) {
  act(() => {
    if (message) {
      useRuntimeNoticeStore.getState().setNotice({ kind, message });
      return;
    }
    reportRuntimeNotice(kind);
  });
}

describe('RuntimeNoticeBanner', () => {
  beforeEach(() => {
    act(() => {
      resetRuntimeNoticeStore();
    });
  });

  afterEach(() => {
    act(() => {
      resetRuntimeNoticeStore();
    });
  });

  it('renders nothing when there is no notice', () => {
    const { container } = renderWithProviders(<RuntimeNoticeBanner />);

    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it.each(ERROR_KINDS)('shows an error alert for %s', (kind) => {
    seedNotice(kind);
    renderWithProviders(<RuntimeNoticeBanner />);

    const status = screen.getByRole('status');
    expect(status).toHaveAttribute('aria-live', 'polite');
    expect(status).toHaveTextContent(NOTICE_COPY[kind]);
    expect(status).toHaveClass('MuiAlert-colorError');
  });

  it.each(WARNING_KINDS)('shows a warning alert for %s', (kind) => {
    seedNotice(kind);
    renderWithProviders(<RuntimeNoticeBanner />);

    const status = screen.getByRole('status');
    expect(status).toHaveTextContent(NOTICE_COPY[kind]);
    expect(status).toHaveClass('MuiAlert-colorWarning');
  });

  it('renders a custom notice message from the store', () => {
    seedNotice('storageUnavailable', 'Custom storage warning for this session.');
    renderWithProviders(<RuntimeNoticeBanner />);

    expect(screen.getByRole('status')).toHaveTextContent(
      'Custom storage warning for this session.',
    );
  });

  it('dismisses the notice when the close control is clicked', async () => {
    const user = userEvent.setup();
    seedNotice('hierarchyRepaired');
    renderWithProviders(<RuntimeNoticeBanner />);

    expect(screen.getByRole('status')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: APP_ERROR_MESSAGES.dismissNotice }));

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(useRuntimeNoticeStore.getState().notice).toBeNull();
  });
});
