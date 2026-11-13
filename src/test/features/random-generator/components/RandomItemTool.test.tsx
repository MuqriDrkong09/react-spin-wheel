import { act } from '@testing-library/react';
import type { FieldValues, UseFormReturn } from 'react-hook-form';
import type { ZodType } from 'zod';

import { RandomItemTool } from '@/features/random-generator/components/RandomItemTool';
import { GENERATOR_MESSAGES } from '@/features/random-generator/constants';
import * as generateRandomItem from '@/features/random-generator/utils/generateRandomItem';
import { renderWithProviders, screen, userEvent, within } from '@/test/test-utils';

const formCapture = vi.hoisted(() => ({
  current: null as UseFormReturn<FieldValues> | null,
}));

vi.mock('@/hooks/useAppForm', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/hooks/useAppForm')>();
  return {
    useAppForm: <TValues extends FieldValues>(
      schema: ZodType<TValues, TValues>,
      options?: Parameters<typeof actual.useAppForm<TValues>>[1],
    ) => {
      const form = actual.useAppForm(schema, options);
      formCapture.current = form as UseFormReturn<FieldValues>;
      return form;
    },
  };
});

describe('RandomItemTool', () => {
  afterEach(() => {
    formCapture.current = null;
    vi.restoreAllMocks();
  });

  it('renders the default item rows with an empty result', () => {
    renderWithProviders(<RandomItemTool />);

    const form = screen.getByRole('form', { name: GENERATOR_MESSAGES.itemTab });
    expect(within(form).getByText(GENERATOR_MESSAGES.itemHint)).toBeInTheDocument();
    expect(within(form).getByRole('group', { name: GENERATOR_MESSAGES.itemTab })).toBeInTheDocument();
    expect(within(form).getByLabelText('Item 1')).toBeInTheDocument();
    expect(within(form).getByLabelText('Weight 1')).toHaveValue(1);
    expect(within(form).getByLabelText('Item 2')).toBeInTheDocument();
    expect(within(form).getByLabelText('Weight 2')).toHaveValue(1);
    expect(within(form).getByRole('status')).toHaveTextContent(GENERATOR_MESSAGES.emptyResult);
    expect(within(form).getByRole('button', { name: GENERATOR_MESSAGES.generateItem })).toBeInTheDocument();
  });

  it('adds an item row and keeps remove disabled when only one remains', async () => {
    const user = userEvent.setup();
    renderWithProviders(<RandomItemTool />);

    const form = screen.getByRole('form', { name: GENERATOR_MESSAGES.itemTab });
    expect(within(form).getByRole('button', { name: GENERATOR_MESSAGES.removeItem(1) })).toBeEnabled();

    await user.click(within(form).getByRole('button', { name: GENERATOR_MESSAGES.addItem }));
    expect(within(form).getByLabelText('Item 3')).toBeInTheDocument();
    expect(within(form).getByLabelText('Weight 3')).toHaveValue(1);

    await user.click(within(form).getByRole('button', { name: GENERATOR_MESSAGES.removeItem(3) }));
    await user.click(within(form).getByRole('button', { name: GENERATOR_MESSAGES.removeItem(2) }));

    expect(within(form).queryByLabelText('Item 2')).not.toBeInTheDocument();
    expect(within(form).getByRole('button', { name: GENERATOR_MESSAGES.removeItem(1) })).toBeDisabled();
  });

  it('shows validation when item names are blank', async () => {
    const user = userEvent.setup();
    renderWithProviders(<RandomItemTool />);

    const form = screen.getByRole('form', { name: GENERATOR_MESSAGES.itemTab });
    await user.click(within(form).getByRole('button', { name: GENERATOR_MESSAGES.generateItem }));

    expect(
      await within(form).findAllByText(GENERATOR_MESSAGES.itemNameRequired),
    ).not.toHaveLength(0);
  });

  it('shows an items-level validation alert and describes the fields', async () => {
    renderWithProviders(<RandomItemTool />);
    expect(formCapture.current).not.toBeNull();

    await act(async () => {
      formCapture.current!.setError('items', {
        type: 'manual',
        message: GENERATOR_MESSAGES.itemsRequired,
      });
    });

    const form = screen.getByRole('form', { name: GENERATOR_MESSAGES.itemTab });
    const alert = await within(form).findByRole('alert');
    expect(alert).toHaveTextContent(GENERATOR_MESSAGES.itemsRequired);
    expect(alert).toHaveAttribute('id', 'random-item-items-error');

    expect(within(form).getByRole('group', { name: GENERATOR_MESSAGES.itemTab })).toHaveAttribute(
      'aria-describedby',
      'random-item-items-error',
    );
    expect(within(form).getByLabelText('Item 1')).toHaveAttribute(
      'aria-describedby',
      expect.stringContaining('random-item-items-error'),
    );
    expect(within(form).getByLabelText('Weight 1')).toHaveAttribute(
      'aria-describedby',
      expect.stringContaining('random-item-items-error'),
    );
  });

  it('falls back to the items root error message', async () => {
    renderWithProviders(<RandomItemTool />);
    expect(formCapture.current).not.toBeNull();

    await act(async () => {
      formCapture.current!.setError('items.root', {
        type: 'manual',
        message: GENERATOR_MESSAGES.itemsRequired,
      });
    });

    const form = screen.getByRole('form', { name: GENERATOR_MESSAGES.itemTab });
    expect(await within(form).findByRole('alert')).toHaveTextContent(
      GENERATOR_MESSAGES.itemsRequired,
    );
  });

  it('generates a weighted item and switches the submit label', async () => {
    const user = userEvent.setup();
    vi.spyOn(Math, 'random').mockReturnValue(0);
    renderWithProviders(<RandomItemTool />);

    const form = screen.getByRole('form', { name: GENERATOR_MESSAGES.itemTab });
    await user.type(within(form).getByLabelText('Item 1'), 'Pizza');
    await user.clear(within(form).getByLabelText('Weight 1'));
    await user.type(within(form).getByLabelText('Weight 1'), '1');
    await user.type(within(form).getByLabelText('Item 2'), 'Burger');
    await user.clear(within(form).getByLabelText('Weight 2'));
    await user.type(within(form).getByLabelText('Weight 2'), '3');
    await user.click(within(form).getByRole('button', { name: GENERATOR_MESSAGES.generateItem }));

    expect(within(form).getByRole('status')).toHaveTextContent('Pizza');
    expect(within(form).getByLabelText(GENERATOR_MESSAGES.resultLabel)).toBeInTheDocument();
    expect(
      within(form).getByRole('button', { name: GENERATOR_MESSAGES.generateAgain }),
    ).toBeInTheDocument();
  });

  it('picks the heavier item when the random roll lands in its range', async () => {
    const user = userEvent.setup();
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    renderWithProviders(<RandomItemTool />);

    const form = screen.getByRole('form', { name: GENERATOR_MESSAGES.itemTab });
    await user.type(within(form).getByLabelText('Item 1'), 'Pizza');
    await user.clear(within(form).getByLabelText('Weight 1'));
    await user.type(within(form).getByLabelText('Weight 1'), '1');
    await user.type(within(form).getByLabelText('Item 2'), 'Burger');
    await user.clear(within(form).getByLabelText('Weight 2'));
    await user.type(within(form).getByLabelText('Weight 2'), '3');
    await user.click(within(form).getByRole('button', { name: GENERATOR_MESSAGES.generateItem }));

    expect(within(form).getByRole('status')).toHaveTextContent('Burger');
  });

  it('generates again and replaces the previous result', async () => {
    const user = userEvent.setup();
    const random = vi.spyOn(Math, 'random').mockReturnValue(0);
    renderWithProviders(<RandomItemTool />);

    const form = screen.getByRole('form', { name: GENERATOR_MESSAGES.itemTab });
    await user.type(within(form).getByLabelText('Item 1'), 'Pizza');
    await user.type(within(form).getByLabelText('Item 2'), 'Burger');
    await user.click(within(form).getByRole('button', { name: GENERATOR_MESSAGES.generateItem }));
    expect(within(form).getByRole('status')).toHaveTextContent('Pizza');

    random.mockReturnValue(0.9);
    await user.click(within(form).getByRole('button', { name: GENERATOR_MESSAGES.generateAgain }));
    expect(within(form).getByRole('status')).toHaveTextContent('Burger');
  });

  it('rejects invalid weights after names are filled', async () => {
    const user = userEvent.setup();
    renderWithProviders(<RandomItemTool />);

    const form = screen.getByRole('form', { name: GENERATOR_MESSAGES.itemTab });
    await user.type(within(form).getByLabelText('Item 1'), 'Pizza');
    await user.clear(within(form).getByLabelText('Weight 1'));
    await user.type(within(form).getByLabelText('Weight 1'), '0');
    await user.type(within(form).getByLabelText('Item 2'), 'Burger');
    await user.click(within(form).getByRole('button', { name: GENERATOR_MESSAGES.generateItem }));

    expect(await within(form).findByText(GENERATOR_MESSAGES.invalidWeight)).toBeInTheDocument();
  });

  it('surfaces a generator error and clears any previous result', async () => {
    const user = userEvent.setup();
    const generateSpy = vi.spyOn(generateRandomItem, 'generateRandomItem').mockReturnValue({
      ok: true,
      value: { name: 'Pizza', weight: 1 },
    });
    renderWithProviders(<RandomItemTool />);

    const form = screen.getByRole('form', { name: GENERATOR_MESSAGES.itemTab });
    await user.type(within(form).getByLabelText('Item 1'), 'Pizza');
    await user.type(within(form).getByLabelText('Item 2'), 'Burger');
    await user.click(within(form).getByRole('button', { name: GENERATOR_MESSAGES.generateItem }));

    expect(within(form).getByRole('status')).toHaveTextContent('Pizza');
    expect(
      within(form).getByRole('button', { name: GENERATOR_MESSAGES.generateAgain }),
    ).toBeInTheDocument();

    generateSpy.mockReturnValue({
      ok: false,
      error: GENERATOR_MESSAGES.itemsRequired,
    });
    await user.click(within(form).getByRole('button', { name: GENERATOR_MESSAGES.generateAgain }));

    expect(within(form).getByRole('alert')).toHaveTextContent(GENERATOR_MESSAGES.itemsRequired);
    expect(within(form).queryByLabelText(GENERATOR_MESSAGES.resultLabel)).not.toBeInTheDocument();
    expect(
      within(form).getByRole('button', { name: GENERATOR_MESSAGES.generateItem }),
    ).toBeInTheDocument();
  });
});
