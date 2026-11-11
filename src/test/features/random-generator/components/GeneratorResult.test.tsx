import { GeneratorResultCard } from '@/features/random-generator/components/GeneratorResult';
import { GENERATOR_MESSAGES } from '@/features/random-generator/constants';
import { renderWithProviders, screen } from '@/test/test-utils';

describe('GeneratorResultCard', () => {
  it('shows empty, success, and error states', async () => {
    const { rerender } = renderWithProviders(<GeneratorResultCard />);
    expect(screen.getByRole('status')).toHaveTextContent(GENERATOR_MESSAGES.emptyResult);

    rerender(<GeneratorResultCard values={['Avery Brooks', 'Jordan Chen']} />);
    expect(screen.getByLabelText(GENERATOR_MESSAGES.resultLabel)).toHaveTextContent('Avery Brooks');
    expect(screen.getByLabelText(GENERATOR_MESSAGES.resultLabel)).toHaveTextContent('Jordan Chen');

    rerender(<GeneratorResultCard error={GENERATOR_MESSAGES.itemsRequired} />);
    expect(screen.getByRole('alert')).toHaveTextContent(GENERATOR_MESSAGES.itemsRequired);
  });
});
