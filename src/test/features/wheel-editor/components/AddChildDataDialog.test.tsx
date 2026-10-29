import type { ComponentProps } from 'react';

import { AddChildDataDialog } from '@/features/wheel-editor/components/AddChildDataDialog';
import { defaultItemFormValues } from '@/features/wheel-editor/schema';
import { renderWithProviders, screen, userEvent, within } from '@/test/test-utils';

const mobileHarness = vi.hoisted(() => ({ isMobile: false }));

vi.mock('@/hooks/useIsMobile', () => ({
  useIsMobile: () => mobileHarness.isMobile,
}));

function renderDialog(overrides: Partial<ComponentProps<typeof AddChildDataDialog>> = {}) {
  const props = {
    open: true,
    parentName: 'Sushi',
    defaultValues: defaultItemFormValues,
    onClose: vi.fn(),
    onSubmit: vi.fn(),
    ...overrides,
  };

  return { ...renderWithProviders(<AddChildDataDialog {...props} />), props };
}

describe('AddChildDataDialog', () => {
  beforeEach(() => {
    mobileHarness.isMobile = false;
  });

  it('renders nothing when closed', () => {
    renderDialog({ open: false });

    expect(screen.queryByRole('dialog', { name: 'Add Child Data' })).not.toBeInTheDocument();
    expect(screen.queryByText('Parent')).not.toBeInTheDocument();
  });

  it('shows the parent and child form in a dialog on desktop', () => {
    renderDialog();

    const dialog = screen.getByRole('dialog', { name: 'Add Child Data' });
    expect(within(dialog).getByText('Parent')).toBeInTheDocument();
    expect(within(dialog).getByText('Sushi')).toBeInTheDocument();
    expect(within(dialog).getByRole('form', { name: 'Add Child Data' })).toBeInTheDocument();
    expect(within(dialog).getByLabelText(/child name/i)).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'Add Child' })).toBeInTheDocument();
  });

  it('still shows the parent label when the parent name is missing', () => {
    renderDialog({ parentName: undefined });

    const dialog = screen.getByRole('dialog', { name: 'Add Child Data' });
    expect(within(dialog).getByText('Parent')).toBeInTheDocument();
    expect(within(dialog).queryByText('Sushi')).not.toBeInTheDocument();
  });

  it('closes from Cancel and Escape', async () => {
    const user = userEvent.setup();
    const { props } = renderDialog();

    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(props.onClose).toHaveBeenCalledTimes(1);

    await user.keyboard('{Escape}');
    expect(props.onClose).toHaveBeenCalledTimes(2);
  });

  it('submits the child form', async () => {
    const user = userEvent.setup();
    const { props } = renderDialog();

    await user.type(screen.getByLabelText(/child name/i), 'Salmon');
    await user.click(screen.getByRole('button', { name: 'Add Child' }));

    expect(props.onSubmit).toHaveBeenCalledTimes(1);
    expect(props.onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Salmon',
        enabled: true,
        weight: 1,
      }),
    );
  });

  it('shows a bottom drawer on mobile and closes from the backdrop', async () => {
    const user = userEvent.setup();
    mobileHarness.isMobile = true;
    const { props } = renderDialog();

    expect(screen.queryByRole('dialog', { name: 'Add Child Data' })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Add Child Data', level: 2 })).toBeInTheDocument();
    expect(screen.getByText('Sushi')).toBeInTheDocument();
    expect(screen.getByRole('form', { name: 'Add Child Data' })).toBeInTheDocument();
    expect(document.querySelector('.MuiDrawer-paper')).toBeInTheDocument();

    const backdrop = document.querySelector('.MuiBackdrop-root');
    expect(backdrop).toBeTruthy();
    await user.click(backdrop!);

    expect(props.onClose).toHaveBeenCalledTimes(1);
  });
});
