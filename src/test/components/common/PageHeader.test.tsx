import { Button } from '@mui/material';

import { PageHeader } from '@/components/common/PageHeader';
import { renderWithProviders, screen } from '@/test/test-utils';

describe('PageHeader', () => {
  it('renders the title as the page heading', () => {
    renderWithProviders(<PageHeader title="Dashboard" />);

    expect(screen.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeInTheDocument();
    expect(screen.queryByText('Manage workspace preferences.')).not.toBeInTheDocument();
  });

  it('renders an optional description', () => {
    renderWithProviders(
      <PageHeader title="Settings" description="Manage workspace preferences." />,
    );

    expect(screen.getByRole('heading', { name: 'Settings', level: 1 })).toBeInTheDocument();
    expect(screen.getByText('Manage workspace preferences.')).toBeInTheDocument();
  });

  it('renders an optional action beside the title from the sm breakpoint by default', () => {
    renderWithProviders(
      <PageHeader title="Dashboard" action={<Button>Create Wheel</Button>} />,
    );

    expect(screen.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create Wheel' })).toBeInTheDocument();
  });

  it('can keep the action stacked until the md breakpoint', () => {
    renderWithProviders(
      <PageHeader
        title="Spin"
        description="Spin Pizza Night."
        action={<Button>Choose another wheel</Button>}
        actionsBesideFrom="md"
      />,
    );

    expect(screen.getByRole('heading', { name: 'Spin', level: 1 })).toBeInTheDocument();
    expect(screen.getByText('Spin Pizza Night.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Choose another wheel' })).toBeInTheDocument();
  });
});
