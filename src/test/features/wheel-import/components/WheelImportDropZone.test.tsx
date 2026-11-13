import { fireEvent } from '@testing-library/react';
import { useRef, type ChangeEvent } from 'react';

import { WheelImportDropZone } from '@/features/wheel-import/components/WheelImportDropZone';
import { renderWithProviders, screen, userEvent } from '@/test/test-utils';

function DropZoneHarness({
  dragging = false,
  onInputChange = vi.fn(),
  onPickFile = vi.fn(),
}: {
  dragging?: boolean;
  onInputChange?: (event: ChangeEvent<HTMLInputElement>) => void;
  onPickFile?: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <WheelImportDropZone
      inputRef={inputRef}
      dragging={dragging}
      onInputChange={onInputChange}
      onPickFile={onPickFile}
    />
  );
}

describe('WheelImportDropZone', () => {
  it('lets the user choose a json file', async () => {
    const user = userEvent.setup();
    const onInputChange = vi.fn();
    const onPickFile = vi.fn();
    renderWithProviders(<DropZoneHarness onInputChange={onInputChange} onPickFile={onPickFile} />);

    expect(screen.getByRole('region', { name: 'Import wheel JSON' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Choose JSON file' }));
    expect(onPickFile).toHaveBeenCalledTimes(1);

    const input = screen.getByLabelText('Choose wheel JSON file');
    const file = new File(['{}'], 'wheel.json', { type: 'application/json' });
    fireEvent.change(input, { target: { files: [file] } });
    expect(onInputChange).toHaveBeenCalled();
  });

  it('highlights the drop zone while a file is dragged over it', () => {
    renderWithProviders(<DropZoneHarness dragging />);

    expect(screen.getByRole('region', { name: 'Import wheel JSON' })).toBeInTheDocument();
    expect(screen.getByText('Drop a file here or choose an exported wheel JSON file.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Choose JSON file' })).toBeInTheDocument();
  });
});
