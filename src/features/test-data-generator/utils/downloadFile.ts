/** Download arbitrary text/blob content without coupling to wheel export. */
export function downloadFile(
  filename: string,
  contents: string,
  mimeType: string,
): boolean {
  try {
    const blob = new Blob([contents], { type: mimeType });
    const url =
      typeof URL.createObjectURL === 'function'
        ? URL.createObjectURL(blob)
        : `data:${mimeType};charset=utf-8,${encodeURIComponent(contents)}`;
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
