import { POLICY_IMPORT_EXTENSIONS, POLICY_IMPORT_MAX_BYTES } from '@neeti-bharat/shared';

/** The file types the picker offers, with a dot. */
export const IMPORT_PICKER_TYPES: string[] = POLICY_IMPORT_EXTENSIONS.map((type) => `.${type}`);

export type ImportProblem = 'empty' | 'type' | 'size';

/** Why a file cannot be read as a policy, if it cannot. The API checks again, from the contents. */
export function checkImportFile(file: { name: string; size: number }): ImportProblem | null {
  const dot = file.name.lastIndexOf('.');
  const type = dot < 0 ? '' : file.name.slice(dot + 1).toLowerCase();
  if (!(POLICY_IMPORT_EXTENSIONS as readonly string[]).includes(type)) return 'type';
  if (file.size === 0) return 'empty';
  return file.size > POLICY_IMPORT_MAX_BYTES ? 'size' : null;
}
