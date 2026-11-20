import { createHash } from 'node:crypto';
import type { FileStorage } from '../../core/storage/file-storage';
import { toPolicyDocument } from '../../frameworks/utils/policy-document';
import type { ExportRepository } from '../repositories/export.repository';
import { documentToMarkdown } from './doc-markdown';
import type { PackWriter } from './pack-writer';
import type { PackPaths } from './tables';
import { safeName } from './zip-names';

type PolicyRows = Awaited<ReturnType<ExportRepository['policies']>>;
type EvidenceRows = Awaited<ReturnType<ExportRepository['evidence']>>;

const sha256 = (bytes: Uint8Array): string => createHash('sha256').update(bytes).digest('hex');

/** Each policy's newest approved text, as Markdown. A policy that was never approved has none to give. */
export function addPolicyTexts(writer: PackWriter, policies: PolicyRows): PackPaths {
  const paths = new Map<string, string>();
  for (const policy of policies) {
    const approval = policy.approvals[0];
    if (!approval) continue;
    const path = `policies/${safeName(`${policy.id} ${policy.title}`)}.md`;
    const heading = `# ${policy.title}\n\nVersion ${approval.version}, approved on ${approval.approvedAt.toISOString().slice(0, 10)} by ${approval.approvedByName}.\n\n`;
    writer.text(path, heading + documentToMarkdown(toPolicyDocument(approval.content)));
    paths.set(policy.id, path);
  }
  return paths;
}

/** Uploaded proof, one file at a time. A file that cannot be read is listed as a problem instead of stopping the pack. */
export async function addProofFiles(
  writer: PackWriter,
  evidence: EvidenceRows,
  storage: FileStorage,
  problems: string[],
): Promise<PackPaths> {
  const paths = new Map<string, string>();
  for (const item of evidence.filter((entry) => entry.fileKey)) {
    const label = `${item.control.id}: ${item.fileName ?? item.title}`;
    try {
      const bytes = await storage.read(item.fileKey!);
      if (item.fileSha256 && sha256(bytes) !== item.fileSha256) {
        problems.push(`${label} does not match the fingerprint saved when it was uploaded.`);
      }
      const path = `proof/${item.control.id}/${item.id.slice(-8)}-${safeName(item.fileName ?? item.title)}`;
      writer.file(path, bytes);
      paths.set(item.id, path);
    } catch {
      problems.push(`${label} could not be read from storage, so it is not in the pack.`);
    }
  }
  return paths;
}

/** What `integrity.txt` says about the activity log. */
export function integrityText(result: { ok: boolean; checked: number }): string {
  if (result.ok) {
    return `The activity log is intact: ${result.checked} events checked, none changed or missing.\n`;
  }
  return `The activity log FAILED its integrity check after ${result.checked} events.\n`;
}
