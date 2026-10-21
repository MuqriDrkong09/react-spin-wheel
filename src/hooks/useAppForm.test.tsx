import { useState } from 'react';
import { z } from 'zod';

import { Form } from '@/components/common/Form';
import { FormTextField } from '@/components/common/FormTextField';
import { renderWithProviders, screen, userEvent } from '@/test/test-utils';

import { useAppForm } from './useAppForm';

const schema = z.object({
  email: z.email('Enter a valid email address'),
});

type FormValues = z.infer<typeof schema>;

function EmailForm() {
  const [submittedEmail, setSubmittedEmail] = useState('');
  const form = useAppForm<FormValues>(schema, {
    defaultValues: {
      email: '',
    },
  });

  return (
    <Form
      form={form}
      onSubmit={(values) => {
        setSubmittedEmail(values.email);
      }}
    >
      <FormTextField<FormValues> name="email" label="Email" />
      <button type="submit">Submit</button>
      {submittedEmail ? <p>Submitted {submittedEmail}</p> : null}
    </Form>
  );
}

describe('useAppForm', () => {
  it('validates invalid values with zod', async () => {
    const user = userEvent.setup();
    renderWithProviders(<EmailForm />);

    await user.type(screen.getByLabelText(/email/i), 'not-an-email');
    await user.click(screen.getByRole('button', { name: /submit/i }));

    expect(await screen.findByText(/enter a valid email address/i)).toBeInTheDocument();
  });

  it('submits valid values', async () => {
    const user = userEvent.setup();
    renderWithProviders(<EmailForm />);

    await user.type(screen.getByLabelText(/email/i), 'hello@spinflow.dev');
    await user.click(screen.getByRole('button', { name: /submit/i }));

    expect(await screen.findByText(/submitted hello@spinflow.dev/i)).toBeInTheDocument();
  });
});
