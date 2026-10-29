import { SelectionPath } from '@/features/spin/components/SelectionPath';
import { SPIN_MESSAGES } from '@/features/spin/constants';
import { renderWithProviders, screen, within } from '@/test/test-utils';

const pizza = { id: 'pizza', name: 'Pizza', icon: '🍕' };
const pepperoni = { id: 'pepperoni', name: 'Pepperoni' };
const large = { id: 'large', name: 'Large', icon: '📏' };

describe('SelectionPath', () => {
  it('renders nothing when there are no steps', () => {
    const { container } = renderWithProviders(<SelectionPath steps={[]} />);

    expect(container).toBeEmptyDOMElement();
  });

  it('labels a single screen step without an icon', () => {
    renderWithProviders(<SelectionPath steps={[pepperoni]} />);

    const list = screen.getByRole('list', { name: 'Pepperoni' });
    expect(within(list).getByText('Pepperoni')).toHaveAttribute('aria-current', 'true');
    expect(screen.queryByText('↓')).not.toBeInTheDocument();
  });

  it('renders nested steps with arrows and a path label', () => {
    renderWithProviders(<SelectionPath steps={[pizza, pepperoni, large]} />);

    const list = screen.getByRole('list', {
      name: SPIN_MESSAGES.pathLabel(['Pizza', 'Pepperoni', 'Large']),
    });
    const items = within(list).getAllByRole('listitem');

    expect(items).toHaveLength(3);
    expect(within(items[0]!).getByText('Pizza')).not.toHaveAttribute('aria-current');
    expect(within(items[1]!).getByText('Pepperoni')).not.toHaveAttribute('aria-current');
    expect(within(items[2]!).getByText('Large')).toHaveAttribute('aria-current', 'true');
    expect(within(list).getAllByText('↓')).toHaveLength(2);
    expect(within(list).getByText('🍕')).toBeInTheDocument();
    expect(within(list).getByText('📏')).toBeInTheDocument();
  });

  it('omits the path label when an id is provided', () => {
    renderWithProviders(<SelectionPath id="final-result-path" steps={[pizza]} />);

    const list = screen.getByRole('list');
    expect(list).toHaveAttribute('id', 'final-result-path');
    expect(list).not.toHaveAttribute('aria-label');
  });

  it('emphasizes the leaf in dialog size', () => {
    renderWithProviders(<SelectionPath size="dialog" steps={[pizza, large]} />);

    expect(screen.getByText('Large').tagName).toBe('P');
    expect(screen.getByText('Large')).toHaveClass('MuiTypography-h4');
    expect(screen.getByText('Pizza')).toHaveClass('MuiTypography-body1');
  });

  it('emphasizes the leaf in result size', () => {
    renderWithProviders(<SelectionPath size="result" steps={[pizza, large]} />);

    expect(screen.getByText('Large')).toHaveClass('MuiTypography-h4');
    expect(screen.getByText('Pizza')).toHaveClass('MuiTypography-body1');
  });

  it('applies a custom text color to ancestors and the leaf', () => {
    renderWithProviders(
      <SelectionPath textColor="#f8fafc" steps={[pizza, pepperoni]} />,
    );

    expect(screen.getByText('Pizza')).toHaveStyle({ color: 'rgb(248, 250, 252)' });
    expect(screen.getByText('Pepperoni')).toHaveStyle({ color: 'rgb(248, 250, 252)' });
    expect(screen.getByText('↓')).toHaveStyle({ color: 'rgb(248, 250, 252)' });
  });
});
