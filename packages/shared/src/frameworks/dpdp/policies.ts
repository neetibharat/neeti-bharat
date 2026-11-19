// The 19 policies a company needs. Counsel's version.
import type { DpdpPolicy } from './types.js';

export const POLICIES: readonly DpdpPolicy[] = [
  {
    id: 'P01',
    slug: 'privacy-notice-consent',
    title: 'Privacy Notice and Consent Policy',
    summary:
      'Defines how the organisation publishes notice, captures consent, records proof, and makes withdrawal as easy as giving consent.',
    ownerRole: 'PRIVACY_LEAD',
    approver: 'General Counsel',
    reviewEvery: 'annual',
    legalReferences: ['Rule 3', 'Rule 9', 's.5', 's.6'],
  },
  {
    id: 'P02',
    slug: 'data-classification-ropa',
    title: 'Data Classification and Records of Processing Policy',
    summary:
      'Establishes the inventory of processing activities, data classification, purpose and retention mapping, and the evidence needed to prove data minimisation and accountability.',
    ownerRole: 'PRIVACY_LEAD',
    approver: 'Data Protection Officer',
    reviewEvery: 'annual',
    legalReferences: ['s.4', 's.8(3)', 'Rule 8'],
  },
  {
    id: 'P03',
    slug: 'information-security',
    title: 'Information Security Policy',
    summary:
      'Sets the security governance, risk assessment, control framework, training, and management review that underpin the Rule 6 safeguards.',
    ownerRole: 'SECURITY_LEAD',
    approver: 'Chief Technology Officer',
    reviewEvery: 'annual',
    legalReferences: ['Rule 6', 's.8(4)', 's.8(5)'],
  },
  {
    id: 'P04',
    slug: 'access-control',
    title: 'Access Control Policy',
    summary:
      'Defines identity, authentication, least privilege, privileged access, joiner-mover-leaver, and access review controls for systems holding personal data.',
    ownerRole: 'SECURITY_LEAD',
    approver: 'Chief Technology Officer',
    reviewEvery: 'annual',
    legalReferences: ['Rule 6(1)(b)', 's.8(5)'],
  },
  {
    id: 'P05',
    slug: 'encryption-key-management',
    title: 'Encryption and Key Management Standard',
    summary:
      'Defines encryption at rest and in transit, key custody and rotation, secrets management, masking, and the evidence needed for Rule 6(1)(a).',
    ownerRole: 'SECURITY_LEAD',
    approver: 'Chief Technology Officer',
    reviewEvery: 'annual',
    legalReferences: ['Rule 6(1)(a)', 's.8(5)'],
  },
  {
    id: 'P06',
    slug: 'logging-monitoring',
    title: 'Logging, Monitoring and Audit Trail Standard',
    summary:
      'Sets what is logged, how logs are protected and monitored, log retention for at least the required retention period, CERT-In log location, and monthly log review.',
    ownerRole: 'SECURITY_LEAD',
    approver: 'Chief Technology Officer',
    reviewEvery: 'annual',
    legalReferences: ['Rule 6(1)(c)', 'Rule 6(1)(e)', 's.8(5)'],
  },
  {
    id: 'P07',
    slug: 'backup-business-continuity',
    title: 'Backup, Disaster Recovery and Business Continuity Policy',
    summary:
      'Defines backup scope, encryption, restoration testing, recovery objectives, and continuity so processing can continue after a compromise.',
    ownerRole: 'SECURITY_LEAD',
    approver: 'Chief Technology Officer',
    reviewEvery: 'annual',
    legalReferences: ['Rule 6(1)(d)', 's.8(5)'],
  },
  {
    id: 'P08',
    slug: 'incident-response-breach',
    title: 'Incident Response and Breach Notification Policy',
    summary:
      'Defines breach intake, classification, containment, Board intimation without delay, the detailed breach report within the breach reporting window, Data Principal notice, and post-incident review.',
    ownerRole: 'DPO',
    approver: 'Chief Executive Officer',
    reviewEvery: 'annual',
    legalReferences: ['Rule 7', 's.8(6)'],
  },
  {
    id: 'P09',
    slug: 'retention-erasure',
    title: 'Data Retention and Erasure Policy',
    summary:
      'Sets the retention schedule, erasure when the purpose ends or consent is withdrawn, the minimum retention period for processing logs, advance notice before inactivity-based erasure, processor erasure and legal holds.',
    ownerRole: 'PRIVACY_LEAD',
    approver: 'Data Protection Officer',
    reviewEvery: 'annual',
    legalReferences: ['Rule 8', 's.8(7)'],
  },
  {
    id: 'P10',
    slug: 'data-subject-rights',
    title: 'Data Principal Rights Policy',
    summary:
      'Defines access, correction, completion, updating, erasure, and nomination requests, identity verification, response standards, and evidence retention.',
    ownerRole: 'DPO',
    approver: 'General Counsel',
    reviewEvery: 'annual',
    legalReferences: ['Rule 14', 's.11', 's.12', 's.14'],
  },
  {
    id: 'P11',
    slug: 'grievance-redressal',
    title: 'Grievance Redressal and DPO Contact Policy',
    summary:
      'Publishes the DPO or designated privacy contact and grievance channel, and sets acknowledgement, escalation and resolution of grievances within the published response period, with the route to the Data Protection Board.',
    ownerRole: 'DPO',
    approver: 'General Counsel',
    reviewEvery: 'annual',
    legalReferences: ['Rule 9', 'Rule 14', 's.13'],
  },
  {
    id: 'P12',
    slug: 'vendor-data-processor',
    title: 'Vendor and Data Processor Management Policy',
    summary:
      'Defines processor due diligence, contract clauses, sub-processor control, security safeguards, breach notice, deletion, audit rights, and register maintenance.',
    ownerRole: 'PROCUREMENT_LEAD',
    approver: 'Data Protection Officer',
    reviewEvery: 'annual',
    legalReferences: ['Rule 6(1)(f)', 's.8(1)', 's.8(2)'],
  },
  {
    id: 'P13',
    slug: 'childrens-disability-data',
    title: "Children's and Disability Data Policy",
    summary:
      'Defines age gating, verifiable parental consent, guardian consent for persons with disabilities, prohibitions on tracking and targeted advertising, and exemption records.',
    ownerRole: 'PRIVACY_LEAD',
    approver: 'Data Protection Officer',
    reviewEvery: 'annual',
    legalReferences: ['Rule 10', 'Rule 11', 'Rule 12', 's.9'],
  },
  {
    id: 'P14',
    slug: 'cross-border-transfer',
    title: 'Cross-Border Transfer Policy',
    summary:
      'Defines transfer approval, restricted-country checks, contractual safeguards, localisation, transfer register, and breach or change notification.',
    ownerRole: 'PRIVACY_LEAD',
    approver: 'Data Protection Officer',
    reviewEvery: 'annual',
    legalReferences: ['Rule 15', 's.16'],
  },
  {
    id: 'P15',
    slug: 'hr-personnel-security',
    title: 'HR and Personnel Security Policy',
    summary:
      'Defines screening, confidentiality, privacy and security training, joiner and leaver controls, contractor onboarding, and disciplinary handling.',
    ownerRole: 'HR_LEAD',
    approver: 'Data Protection Officer',
    reviewEvery: 'annual',
    legalReferences: ['Rule 6', 's.8(5)'],
  },
  {
    id: 'P16',
    slug: 'secure-development-change',
    title: 'Secure Development and Change Management Policy',
    summary:
      'Defines privacy by design, secure coding, code review, security testing, dependency and secrets controls, change approval, and rollback.',
    ownerRole: 'ENGINEERING_LEAD',
    approver: 'Security Lead',
    reviewEvery: 'annual',
    legalReferences: ['Rule 6', 's.8(5)'],
  },
  {
    id: 'P17',
    slug: 'sdf-dpia-governance',
    title: 'SDF Governance and DPIA Policy',
    summary:
      'Defines significant data fiduciary assessment, DPO and independent auditor appointments, annual DPIA and audit, localisation, board reporting, and remediation.',
    ownerRole: 'DPO',
    approver: 'Board of Directors',
    reviewEvery: 'annual',
    legalReferences: ['Rule 13', 's.10'],
  },
  {
    id: 'P18',
    slug: 'ai-governance',
    title: 'AI and Automated Decision-Making Policy',
    summary:
      'Defines AI inventory, lawful basis, training data provenance, due diligence, human oversight, explainability, contestability, bias monitoring, and third-party model review.',
    ownerRole: 'AI_OWNER',
    approver: 'Data Protection Officer',
    reviewEvery: 'annual',
    legalReferences: ['Rule 13', 'Rule 16', 's.10'],
  },
  {
    id: 'P19',
    slug: 'privacy-governance-assurance',
    title: 'Privacy Governance, Assurance and Evidence Policy',
    summary:
      'Sets roles, leadership oversight, policy management, control testing, compliance metrics, regulatory tracking and evidence management for the privacy programme.',
    ownerRole: 'DPO',
    approver: 'Chief Executive Officer',
    reviewEvery: 'annual',
    legalReferences: [],
  },
];
