/**
 * Formats a title into a safe filename.
 * @param title - The title to format
 * @param sloId - Optional SLO ID to prefix
 * @returns A sanitized filename string (without extension)
 */
export function formatFileName(title: string, sloId?: string): string {
  const baseName = sloId ? `${sloId}_${title}` : title;
  return baseName.replace(/[^a-z0-9_.-]/gi, '_').substring(0, 100);
}
