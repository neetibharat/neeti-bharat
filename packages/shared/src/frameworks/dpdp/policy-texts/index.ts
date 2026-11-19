// Counsel's text for each policy, as Markdown. `{{key}}` marks a company answer that is filled in when the text is shown.
import { P01_TEXT } from './p01-privacy-notice-consent.js';
import { P02_TEXT } from './p02-data-classification-ropa.js';
import { P03_TEXT } from './p03-information-security.js';
import { P04_TEXT } from './p04-access-control.js';
import { P05_TEXT } from './p05-encryption-key-management.js';
import { P06_TEXT } from './p06-logging-monitoring.js';
import { P07_TEXT } from './p07-backup-business-continuity.js';
import { P08_TEXT } from './p08-incident-response-breach.js';
import { P09_TEXT } from './p09-retention-erasure.js';
import { P10_TEXT } from './p10-data-subject-rights.js';
import { P11_TEXT } from './p11-grievance-redressal.js';
import { P12_TEXT } from './p12-vendor-data-processor.js';
import { P13_TEXT } from './p13-childrens-disability-data.js';
import { P14_TEXT } from './p14-cross-border-transfer.js';
import { P15_TEXT } from './p15-hr-personnel-security.js';
import { P16_TEXT } from './p16-secure-development-change.js';
import { P17_TEXT } from './p17-sdf-dpia-governance.js';
import { P18_TEXT } from './p18-ai-governance.js';
import { P19_TEXT } from './p19-privacy-governance-assurance.js';

/** The text each built-in policy starts with, by policy id. */
export const POLICY_TEXTS: Readonly<Record<string, string>> = {
  P01: P01_TEXT,
  P02: P02_TEXT,
  P03: P03_TEXT,
  P04: P04_TEXT,
  P05: P05_TEXT,
  P06: P06_TEXT,
  P07: P07_TEXT,
  P08: P08_TEXT,
  P09: P09_TEXT,
  P10: P10_TEXT,
  P11: P11_TEXT,
  P12: P12_TEXT,
  P13: P13_TEXT,
  P14: P14_TEXT,
  P15: P15_TEXT,
  P16: P16_TEXT,
  P17: P17_TEXT,
  P18: P18_TEXT,
  P19: P19_TEXT,
};
