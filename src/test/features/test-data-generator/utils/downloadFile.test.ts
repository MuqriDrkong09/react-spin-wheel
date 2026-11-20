import { downloadFile } from '@/features/test-data-generator/utils/downloadFile';

describe('downloadFile', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('downloads a blob, sets link attributes, and revokes the object url', () => {
    const click = vi.fn();
    const createObjectURL = vi.fn(() => 'blob:test-data-export');
    const revokeObjectURL = vi.fn();
    let createdLink: HTMLAnchorElement | undefined;

    vi.stubGlobal('URL', {
      ...URL,
      createObjectURL,
      revokeObjectURL,
    });
    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      const element = document.createElementNS('http://www.w3.org/1999/xhtml', tagName);
      if (tagName === 'a') {
        createdLink = element as HTMLAnchorElement;
        Object.defineProperty(element, 'click', { value: click });
      }
      return element as HTMLElement;
    });

    const ok = downloadFile(
      'food-menu-results.csv',
      'Parent,Child\nPizza,Large\n',
      'text/csv;charset=utf-8',
    );

    expect(ok).toBe(true);
    expect(createObjectURL).toHaveBeenCalledTimes(1);
    const blob = createObjectURL.mock.calls[0]?.[0] as Blob;
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe('text/csv;charset=utf-8');
    expect(createdLink?.download).toBe('food-menu-results.csv');
    expect(createdLink?.href).toBe('blob:test-data-export');
    expect(createdLink?.rel).toBe('noopener');
    expect(click).toHaveBeenCalledTimes(1);
    expect(document.querySelector('a[download="food-menu-results.csv"]')).toBeNull();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:test-data-export');
  });

  it('falls back to a data url when object urls are unavailable', () => {
    const click = vi.fn();
    const revokeObjectURL = vi.fn();
    vi.stubGlobal('URL', { ...URL, createObjectURL: undefined, revokeObjectURL });
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(click);

    const contents = '{"format":"spinflow.test-data"}';
    const ok = downloadFile('qa-matrix-results.json', contents, 'application/json');

    expect(ok).toBe(true);
    expect(click).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).not.toHaveBeenCalled();
    expect(document.querySelector('a[download="qa-matrix-results.json"]')).toBeNull();
  });

  it('returns false when the download cannot be started', () => {
    vi.spyOn(document, 'createElement').mockImplementation(() => {
      throw new Error('blocked');
    });

    expect(downloadFile('blocked.csv', 'Parent\nLogin\n', 'text/csv;charset=utf-8')).toBe(false);
  });
});
