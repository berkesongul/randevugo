/**
 * Accept only same-origin application paths for post-authentication redirects.
 * This prevents external redirects and executable URL schemes from being passed
 * to Next.js navigation APIs.
 */
export function getSafeRedirectPath(value: string | null): string | null {
  if (
    !value ||
    !value.startsWith('/') ||
    value.startsWith('//') ||
    value.includes('\\') ||
    /[\u0000-\u001F\u007F]/.test(value)
  ) {
    return null;
  }

  try {
    const parsed = new URL(value, 'https://randevigo.local');
    if (parsed.origin !== 'https://randevigo.local') {
      return null;
    }

    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return null;
  }
}
