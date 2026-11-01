import { downloadJsonFile } from '@/features/wheel-export/utils/downloadJsonFile';

describe('downloadJsonFile', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('downloads a json blob and revokes the object url', () => {
    const click = vi.fn();
    const createObjectURL = vi.fn(() => 'blob:wheel-export');
    const revokeObjectURL = vi.fn();
    vi.stubGlobal('URL', {
      ...URL,
      createObjectURL,
      revokeObjectURL,
    });
    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      const element = document.createElementNS('http://www.w3.org/1999/xhtml', tagName);
      if (tagName === 'a') {
        Object.defineProperty(element, 'click', { value: click });
      }
      return element as HTMLElement;
    });

    downloadJsonFile('food-picker-wheel.json', '{"name":"Food Picker"}');

    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(click).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:wheel-export');
  });

  it('falls back to a data url when object urls are unavailable', () => {
    const click = vi.fn();
    vi.stubGlobal('URL', { ...URL, createObjectURL: undefined, revokeObjectURL: vi.fn() });
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(click);

    downloadJsonFile('wheel.json', '{"name":"Wheel"}');

    const link = document.querySelector('a[download="wheel.json"]');
    expect(link).toBeNull();
    expect(click).toHaveBeenCalledTimes(1);
  });
});
