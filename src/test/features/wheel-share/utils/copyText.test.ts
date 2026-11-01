import { copyText } from '@/features/wheel-share/utils/copyText';

describe('copyText', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns true when the clipboard write succeeds', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } });

    await expect(copyText('https://example.test/share?s=abc')).resolves.toBe(true);
    expect(writeText).toHaveBeenCalledWith('https://example.test/share?s=abc');
  });

  it('returns false when the clipboard write fails', async () => {
    vi.stubGlobal('navigator', {
      ...navigator,
      clipboard: { writeText: vi.fn().mockRejectedValue(new Error('denied')) },
    });

    await expect(copyText('https://example.test/share?s=abc')).resolves.toBe(false);
  });
});
