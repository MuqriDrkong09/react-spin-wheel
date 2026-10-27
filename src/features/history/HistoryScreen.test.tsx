import { ROUTES } from '@/constants/routes';
import { HISTORY_MESSAGES } from '@/features/history/constants';
import { resetHistoryStore, useHistoryStore } from '@/stores/historyStore';
import { renderApp, screen, userEvent, within } from '@/test/test-utils';
import { SELECTION_MODE, SPIN_SESSION_STATUS, type SpinSession } from '@/types/wheel';

function historySession(
  id: string,
  extras: Partial<SpinSession> & {
    selectedItemName?: string;
    pathLabels?: string[];
    timestamp?: string;
    mode?: SpinSession['results'][number]['mode'];
    wheelName?: string;
    wheelId?: string;
  } = {},
): SpinSession {
  const selectedItemName = extras.selectedItemName ?? 'Large';
  const pathLabels = extras.pathLabels ?? ['Pizza', 'Chicken Pepperoni', 'Large'];
  const timestamp = extras.timestamp ?? `2026-01-0${id.slice(-1) || 1}T12:00:00.000Z`;
  const wheelId = extras.wheelId ?? 'pizza';
  const wheelName = extras.wheelName ?? 'Pizza Night';

  return {
    id,
    wheelId,
    wheelName,
    status: SPIN_SESSION_STATUS.completed,
    path: ['pizza', 'chicken-pepperoni', 'large'],
    startedAt: timestamp,
    completedAt: timestamp,
    results: [
      {
        id,
        sessionId: `session-${id}`,
        wheelId,
        itemId: 'large',
        itemName: selectedItemName,
        selectedItemId: 'large',
        selectedItemName,
        parentItemId: 'chicken-pepperoni',
        path: ['pizza', 'chicken-pepperoni', 'large'],
        pathLabels,
        depth: 2,
        probability: 1,
        timestamp,
        spunAt: timestamp,
        duration: 4000,
        mode: extras.mode ?? SELECTION_MODE.manual,
      },
    ],
    ...extras,
  };
}

describe('HistoryScreen', () => {
  beforeEach(() => {
    resetHistoryStore();
  });

  it('shows an empty state when there is no history', () => {
    renderApp({ initialEntries: [ROUTES.history] });

    expect(screen.getByRole('heading', { name: HISTORY_MESSAGES.title, level: 1 })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: HISTORY_MESSAGES.emptyTitle })).toBeInTheDocument();
  });

  it('searches, opens details, deletes a result, and clears history', async () => {
    const user = userEvent.setup();
    useHistoryStore.getState().addSpinSession(
      historySession('r1', {
        timestamp: '2026-01-04T12:00:00.000Z',
      }),
    );
    useHistoryStore.getState().addSpinSession(
      historySession('r2', {
        wheelId: 'chores',
        wheelName: 'Chores',
        selectedItemName: 'Dishes',
        pathLabels: ['Dishes'],
        timestamp: '2026-01-05T12:00:00.000Z',
        mode: SELECTION_MODE.ask,
      }),
    );
    renderApp({ initialEntries: [ROUTES.history] });

    expect(screen.getByText('Pizza → Chicken Pepperoni → Large')).toBeInTheDocument();
    expect(screen.getByText('Dishes')).toBeInTheDocument();

    await user.type(screen.getByRole('textbox', { name: HISTORY_MESSAGES.searchLabel }), 'chicken');
    expect(screen.getByText('Pizza → Chicken Pepperoni → Large')).toBeInTheDocument();
    expect(screen.queryByText('Dishes')).not.toBeInTheDocument();

    await user.clear(screen.getByRole('textbox', { name: HISTORY_MESSAGES.searchLabel }));
    await user.click(
      screen.getByRole('button', {
        name: `${HISTORY_MESSAGES.viewDetails}: Pizza → Chicken Pepperoni → Large`,
      }),
    );

    const details = screen.getByRole('dialog', { name: HISTORY_MESSAGES.detailsTitle });
    expect(within(details).getByText('Pizza → Chicken Pepperoni → Large')).toBeInTheDocument();
    expect(within(details).getByText('Pizza Night')).toBeInTheDocument();
    expect(within(details).getByText('Large')).toBeInTheDocument();
    await user.click(within(details).getByRole('button', { name: HISTORY_MESSAGES.close }));

    await user.click(
      screen.getByRole('button', {
        name: `${HISTORY_MESSAGES.deleteResult}: Dishes`,
      }),
    );
    await user.click(screen.getByRole('button', { name: HISTORY_MESSAGES.delete }));
    expect(screen.queryByText('Dishes')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: HISTORY_MESSAGES.clearHistory }));
    await user.click(
      within(screen.getByRole('dialog', { name: HISTORY_MESSAGES.clearHistoryTitle })).getByRole(
        'button',
        { name: HISTORY_MESSAGES.clearHistory },
      ),
    );
    expect(screen.getByRole('heading', { name: HISTORY_MESSAGES.emptyTitle })).toBeInTheDocument();
  });

  it('paginates long history lists', async () => {
    const user = userEvent.setup();
    for (let index = 1; index <= 11; index += 1) {
      useHistoryStore.getState().addSpinSession(
        historySession(`r${index}`, {
          selectedItemName: `Item ${index}`,
          pathLabels: [`Item ${index}`],
          timestamp: `2026-01-${String(index).padStart(2, '0')}T12:00:00.000Z`,
        }),
      );
    }
    renderApp({ initialEntries: [ROUTES.history] });

    expect(screen.getByText('Item 11')).toBeInTheDocument();
    expect(screen.queryByText('Item 1')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Go to next page' }));
    expect(screen.getByText('Item 1')).toBeInTheDocument();
  });
});
