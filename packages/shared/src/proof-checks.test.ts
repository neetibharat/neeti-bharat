import { describe, expect, it } from 'vitest';
import { AZURE_CHECK_IDS, GITHUB_CHECK_IDS } from './connections.js';
import { PROOF_REQUIREMENTS } from './frameworks/dpdp/proof-requirements.js';
import { PROOF_CHECKS } from './proof-checks.js';

describe('PROOF_CHECKS', () => {
  it('names proofs the catalogue has', () => {
    const ids = new Set(PROOF_REQUIREMENTS.map((proof) => proof.id));
    for (const proofId of Object.keys(PROOF_CHECKS)) expect(ids.has(proofId)).toBe(true);
  });

  it('lists only checks the system it names really has', () => {
    for (const byProvider of Object.values(PROOF_CHECKS)) {
      for (const id of byProvider.azure ?? []) expect(AZURE_CHECK_IDS).toContain(id);
      for (const id of byProvider.github ?? []) expect(GITHUB_CHECK_IDS).toContain(id);
    }
  });
});
