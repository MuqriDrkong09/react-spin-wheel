export function downloadJsonFile(filename: string, contents: string): boolean {
  try {
    const blob = new Blob([contents], { type: 'application/json' });
    const url = createDownloadUrl(blob, contents);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.rel = 'noopener';
    document.body.append(link);
    link.click();
    link.remove();

    if (url.startsWith('blob:')) {
      URL.revokeObjectURL(url);
    }

    return true;
  } catch {
    return false;
  }
}

function createDownloadUrl(blob: Blob, contents: string): string {
  if (typeof URL.createObjectURL === 'function') {
    return URL.createObjectURL(blob);
  }

  return `data:application/json;charset=utf-8,${encodeURIComponent(contents)}`;
}
