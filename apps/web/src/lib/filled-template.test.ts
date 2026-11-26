import type { EvidenceResponse } from '@neeti-bharat/shared';
import { describe, expect, it } from 'vitest';
import { splitProof, templateFileOf } from './filled-template';

const file = (id: string, fileName: string): EvidenceResponse => ({
  id,
  kind: 'file',
  title: fileName,
  url: null,
  note: null,
  fileName,
  addedByName: 'A',
  createdAt: '2026-11-25T00:00:00.000Z',
});

const DESCRIPTION =
  'Template, if you want one: /templates/GP04_Register_of_AI_tools.docx. Fill it in and upload it here.';

describe('templateFileOf', () => {
  it('reads the file the description names', () => {
    expect(templateFileOf(DESCRIPTION)).toBe('GP04_Register_of_AI_tools.docx');
  });

  it('is null when no template is named', () => {
    expect(templateFileOf('Collect the register.')).toBeNull();
  });
});

describe('splitProof', () => {
  it('puts a file saved under the template name first and the rest after', () => {
    const items = [file('1', 'screenshot.png'), file('2', 'gp04_register_of_ai_tools_filled.DOCX')];
    const { filled, other } = splitProof(items, DESCRIPTION);
    expect(filled.map((item) => item.id)).toEqual(['2']);
    expect(other.map((item) => item.id)).toEqual(['1']);
  });

  it('keeps everything in other when there is no template', () => {
    const items = [file('1', 'a.pdf')];
    expect(splitProof(items, 'Plain.').other).toEqual(items);
  });
});
