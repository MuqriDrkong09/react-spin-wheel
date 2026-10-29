import { formatDateTime } from '@/features/dashboard/utils/formatDateTime';
import { HistoryDetailsDialog } from '@/features/history/components/HistoryDetailsDialog';
import { HISTORY_MESSAGES, HISTORY_MODE_LABELS } from '@/features/history/constants';
import { formatDuration } from '@/features/history/utils/formatDuration';
import type { HistoryResult } from '@/features/history/utils/selectHistory';
import { renderWithProviders, screen, userEvent, within } from '@/test/test-utils';
import { SELECTION_MODE } from '@/types/wheel';

const result: HistoryResult = {
  id: 'r1',
  sessionId: 'session-r1',
  wheelId: 'pizza',
  wheelName: 'Pizza Night',
  selectedItemId: 'large',
  selectedItemName: 'Large',
  path: ['pizza', 'chicken-pepperoni', 'large'],
  pathLabels: ['Pizza', 'Chicken Pepperoni', 'Large'],
  pathLabel: 'Pizza → Chicken Pepperoni → Large',
  timestamp: '2026-01-04T12:00:00.000Z',
  duration: 4000,
  mode: SELECTION_MODE.manual,
};

describe('HistoryDetailsDialog', () => {
  it('stays closed when no result is selected', () => {
    renderWithProviders(<HistoryDetailsDialog result={null} onClose={vi.fn()} />);

    expect(screen.queryByRole('dialog', { name: HISTORY_MESSAGES.detailsTitle })).not.toBeInTheDocument();
  });

  it('stays closed when the result is omitted', () => {
    renderWithProviders(<HistoryDetailsDialog onClose={vi.fn()} />);

    expect(screen.queryByRole('dialog', { name: HISTORY_MESSAGES.detailsTitle })).not.toBeInTheDocument();
  });

  it('shows wheel, path, item, time, duration, mode, and session', () => {
    renderWithProviders(<HistoryDetailsDialog result={result} onClose={vi.fn()} />);

    const dialog = screen.getByRole('dialog', { name: HISTORY_MESSAGES.detailsTitle });

    expect(within(dialog).getByText(HISTORY_MESSAGES.wheel)).toBeInTheDocument();
    expect(within(dialog).getByText('Pizza Night')).toBeInTheDocument();
    expect(within(dialog).getByText(HISTORY_MESSAGES.path)).toBeInTheDocument();
    expect(within(dialog).getByText('Pizza → Chicken Pepperoni → Large')).toBeInTheDocument();
    expect(within(dialog).getByText(HISTORY_MESSAGES.selectedItem)).toBeInTheDocument();
    expect(within(dialog).getByText('Large')).toBeInTheDocument();
    expect(within(dialog).getByText(formatDateTime(result.timestamp))).toBeInTheDocument();
    expect(within(dialog).getByText(formatDuration(result.duration))).toBeInTheDocument();
    expect(within(dialog).getByText(HISTORY_MODE_LABELS[SELECTION_MODE.manual])).toBeInTheDocument();
    expect(within(dialog).getByText('session-r1')).toBeInTheDocument();
  });

  it('closes from the close button', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderWithProviders(<HistoryDetailsDialog result={result} onClose={onClose} />);

    await user.click(screen.getByRole('button', { name: HISTORY_MESSAGES.close }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes from Escape', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderWithProviders(<HistoryDetailsDialog result={result} onClose={onClose} />);

    await user.keyboard('{Escape}');

    expect(onClose).toHaveBeenCalled();
  });
});
