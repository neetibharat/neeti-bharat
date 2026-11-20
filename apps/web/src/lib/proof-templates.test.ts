import { PROOF_REQUIREMENTS, PROOF_TEMPLATE_FILES, templateNote } from '@dpdp-kit/shared';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('proof templates', () => {
  it('each named file is in the folder the app serves them from', () => {
    for (const file of Object.values(PROOF_TEMPLATE_FILES)) {
      expect(existsSync(join(process.cwd(), 'public', 'templates', file)), file).toBe(true);
    }
  });

  it('each is for a proof in the catalogue, whose description names it', () => {
    for (const [id, file] of Object.entries(PROOF_TEMPLATE_FILES)) {
      const proof = PROOF_REQUIREMENTS.find((requirement) => requirement.id === id);
      expect(proof, id).toBeDefined();
      expect(proof?.description).toContain(templateNote(file));
    }
  });
});
