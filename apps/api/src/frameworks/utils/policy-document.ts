import { POLICY_DOCUMENT_MAX_BYTES, type DocNode, type PolicyDocument } from '@dpdp-kit/shared';
import { z } from 'zod';

// Loose objects keep what the editor adds (a link's address, for one); only the outline is checked.
const markSchema = z.looseObject({ type: z.string() });

const nodeSchema: z.ZodType<DocNode> = z.lazy(() =>
  z.looseObject({
    type: z.string(),
    text: z.string().optional(),
    marks: z.array(markSchema).optional(),
    attrs: z.record(z.string(), z.unknown()).optional(),
    content: z.array(nodeSchema).optional(),
  }),
);

/** The editor's JSON: a `doc` of nodes, no bigger than any real policy. */
export const policyDocumentSchema = z
  .object({ type: z.literal('doc'), content: z.array(nodeSchema).max(2000) })
  .refine((document) => Buffer.byteLength(JSON.stringify(document)) <= POLICY_DOCUMENT_MAX_BYTES);

/** Policy text read back from the database, checked before it is trusted as a document. */
export function toPolicyDocument(json: unknown): PolicyDocument {
  const parsed = policyDocumentSchema.safeParse(json);
  if (!parsed.success) throw new Error('Stored policy text is not a valid document');
  return parsed.data;
}
