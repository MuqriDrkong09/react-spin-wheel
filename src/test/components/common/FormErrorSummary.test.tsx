import type { FieldErrors } from 'react-hook-form';

import { FormErrorSummary } from '@/components/common/FormErrorSummary';
import { APP_ERROR_MESSAGES } from '@/constants/errorMessages';
import { renderWithProviders, screen } from '@/test/test-utils';

const formState = vi.hoisted(() => ({
  errors: {} as FieldErrors,
  submitCount: 0,
  isValid: true,
}));

vi.mock('react-hook-form', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-hook-form')>();

  return {
    ...actual,
    useFormContext: () => ({
      formState: {
        get errors() {
          return formState.errors;
        },
        get submitCount() {
          return formState.submitCount;
        },
        get isValid() {
          return formState.isValid;
        },
      },
    }),
  };
});

function renderSummary(fallback?: string) {
  return renderWithProviders(
    fallback === undefined ? <FormErrorSummary /> : <FormErrorSummary fallback={fallback} />,
  );
}

describe('FormErrorSummary', () => {
  beforeEach(() => {
    formState.errors = {};
    formState.submitCount = 0;
    formState.isValid = true;
  });

  it('renders nothing before the first submit', () => {
    formState.submitCount = 0;
    formState.isValid = false;
    formState.errors = {
      name: { type: 'required', message: 'Name is required' },
      email: { type: 'required', message: 'Email is required' },
    };

    const { container } = renderSummary();

    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('renders nothing when the form is valid after submit', () => {
    formState.submitCount = 1;
    formState.isValid = true;
    formState.errors = {
      name: { type: 'required', message: 'Name is required' },
      email: { type: 'required', message: 'Email is required' },
    };

    const { container } = renderSummary();

    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when there are no collectible error messages', () => {
    formState.submitCount = 1;
    formState.isValid = false;
    formState.errors = {
      name: { type: 'required' },
      nested: { child: { type: 'required', message: '   ' } },
    };

    const { container } = renderSummary();

    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing for a single field error (shown beside the input instead)', () => {
    formState.submitCount = 2;
    formState.isValid = false;
    formState.errors = {
      name: { type: 'required', message: 'Name is required' },
    };

    const { container } = renderSummary();

    expect(container).toBeEmptyDOMElement();
  });

  it('deduplicates identical messages and stays hidden when only one unique message remains', () => {
    formState.submitCount = 1;
    formState.isValid = false;
    formState.errors = {
      name: { type: 'required', message: 'Required' },
      email: { type: 'required', message: 'Required' },
      nested: { label: { type: 'required', message: '  Required  ' } },
    };

    const { container } = renderSummary();

    expect(container).toBeEmptyDOMElement();
  });

  it('shows the default fallback alert when multiple distinct errors exist after submit', () => {
    formState.submitCount = 1;
    formState.isValid = false;
    formState.errors = {
      name: { type: 'required', message: 'Name is required' },
      email: { type: 'required', message: 'Email is required' },
    };

    renderSummary();

    expect(screen.getByRole('alert')).toHaveTextContent(APP_ERROR_MESSAGES.formIncomplete);
  });

  it('collects nested field errors and shows the summary when more than one message exists', () => {
    formState.submitCount = 1;
    formState.isValid = false;
    formState.errors = {
      profile: {
        firstName: { type: 'required', message: 'First name is required' },
        address: {
          city: { type: 'required', message: 'City is required' },
        },
      },
    };

    renderSummary();

    expect(screen.getByRole('alert')).toHaveTextContent(APP_ERROR_MESSAGES.formIncomplete);
  });

  it('uses a custom fallback message when provided', () => {
    formState.submitCount = 3;
    formState.isValid = false;
    formState.errors = {
      a: { type: 'required', message: 'A is required' },
      b: { type: 'required', message: 'B is required' },
    };

    renderSummary('Fix the marked fields.');

    expect(screen.getByRole('alert')).toHaveTextContent('Fix the marked fields.');
    expect(screen.queryByText(APP_ERROR_MESSAGES.formIncomplete)).not.toBeInTheDocument();
  });
});
