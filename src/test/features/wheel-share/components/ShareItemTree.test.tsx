import { ShareItemTree } from '@/features/wheel-share/components/ShareItemTree';
import { renderWithProviders, screen } from '@/test/test-utils';

describe('ShareItemTree', () => {
  it('renders nested item names', async () => {
    renderWithProviders(
      <ShareItemTree
        items={[
          {
            name: 'Pizza',
            icon: '🍕',
            color: '#ea580c',
            enabled: true,
            weight: 1,
            children: [{ name: 'Pepperoni', color: '#dc2626', enabled: true, weight: 1 }],
          },
        ]}
      />,
    );

    expect(screen.getByText('🍕 Pizza')).toBeInTheDocument();
    expect(screen.getByText('Pepperoni')).toBeInTheDocument();
  });
});
