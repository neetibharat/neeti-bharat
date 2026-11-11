// The 13 DPDP Rules that put duties on a company. Written from the prototype framework file and not yet reviewed by counsel.
import type { DpdpRule } from './types.js';

export const RULES: readonly DpdpRule[] = [
  {
    id: 'R3',
    reference: 'Rule 3',
    title: 'Notice and consent',
    summary:
      'A Data Fiduciary must give an itemised notice in clear language, obtain free, specific, informed, unconditional, and unambiguous consent, and provide an easy withdrawal mechanism.',
    appliesWhen: 'always',
  },
  {
    id: 'R4',
    reference: 'Rule 4',
    title: 'Consent Managers',
    summary:
      'Consent Managers must be registered with the Board, maintain a technically compatible and interoperable platform, and provide accessible, transparent, and secure consent management.',
    appliesWhen: 'always',
  },
  {
    id: 'R6',
    reference: 'Rule 6',
    title: 'Security safeguards',
    summary:
      'A Data Fiduciary must implement reasonable technical and organisational measures including encryption, access control, logging and monitoring, backup and continued processing, one-year log retention, processor contract clauses, and organisational measures.',
    appliesWhen: 'always',
  },
  {
    id: 'R7',
    reference: 'Rule 7',
    title: 'Breach notification',
    summary:
      'A Data Fiduciary must intimate the Board and affected Data Principals without delay, and submit a detailed report within 72 hours.',
    appliesWhen: 'always',
  },
  {
    id: 'R8',
    reference: 'Rule 8',
    title: 'Retention and erasure',
    summary:
      'Personal data must be erased when the purpose is fulfilled or consent is withdrawn, with 48-hour notice, one-year log retention, processor deletion, and special Third Schedule retention.',
    appliesWhen: 'always',
  },
  {
    id: 'R9',
    reference: 'Rule 9',
    title: 'Contact information',
    summary:
      'A Data Fiduciary must publish the contact details of a person who can answer questions about how it handles personal data.',
    appliesWhen: 'always',
  },
  {
    id: 'R10',
    reference: 'Rule 10',
    title: "Children's data",
    summary:
      "Before processing a child's personal data, a Data Fiduciary must get verifiable consent from the child's parent.",
    appliesWhen: 'children',
  },
  {
    id: 'R11',
    reference: 'Rule 11',
    title: 'Persons with disabilities',
    summary:
      'Before processing the personal data of a person with a disability who has a lawful guardian, a Data Fiduciary must check the guardian is lawfully appointed.',
    appliesWhen: 'children',
  },
  {
    id: 'R12',
    reference: 'Rule 12',
    title: 'Exemptions',
    summary:
      "Some bodies and some purposes are exempt from the children's data duties, as long as the stated conditions are met.",
    appliesWhen: 'children',
  },
  {
    id: 'R13',
    reference: 'Rule 13',
    title: 'Significant Data Fiduciary',
    summary:
      'An SDF must appoint a DPO in India, an independent auditor, conduct annual DPIA and audit, perform algorithm due diligence, and comply with localisation requirements.',
    appliesWhen: 'sdf',
  },
  {
    id: 'R14',
    reference: 'Rule 14',
    title: 'Rights and grievance redressal',
    summary:
      'A Data Fiduciary must provide accessible rights and grievance channels, verify identity, and resolve grievances within 90 days.',
    appliesWhen: 'always',
  },
  {
    id: 'R15',
    reference: 'Rule 15',
    title: 'Cross-border transfer',
    summary:
      'Personal data may be sent outside India, subject to any restrictions the Central Government sets for particular countries.',
    appliesWhen: 'abroad',
  },
  {
    id: 'R16',
    reference: 'Rule 16',
    title: 'Research and statistical purposes',
    summary:
      'Personal data may be processed for research, archiving or statistics under lighter duties, if the conditions in the Rules are met.',
    appliesWhen: 'always',
  },
];
