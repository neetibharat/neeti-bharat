import type { StorageStatusResponse } from '@neeti-bharat/shared';

export type FileProblem = 'empty' | 'tooLarge' | 'type';

/**
 * A courtesy check before sending, so a wrong file is turned back at once. The API checks again,
 * and looks at the contents, which the browser cannot.
 */
export function checkProofFile(
  file: { name: string; size: number },
  rules: Pick<StorageStatusResponse, 'maxBytes' | 'allowedTypes'>,
): FileProblem | null {
  const dot = file.name.lastIndexOf('.');
  const extension = dot > 0 ? file.name.slice(dot + 1).toLowerCase() : '';
  if (!rules.allowedTypes.includes(extension)) return 'type';
  if (file.size === 0) return 'empty';
  return file.size > rules.maxBytes ? 'tooLarge' : null;
}

/** The types as people read them: PDF, PNG, JPG. */
export function listAllowedTypes(allowedTypes: string[]): string {
  return allowedTypes.map((type) => type.toUpperCase()).join(', ');
}

/** The types as the file picker wants them: `.pdf`, `.png`. */
export const pickerTypes = (allowedTypes: string[]): string[] =>
  allowedTypes.map((type) => `.${type}`);
