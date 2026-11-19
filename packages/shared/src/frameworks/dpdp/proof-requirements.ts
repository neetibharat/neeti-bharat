// Proof a company should be able to show, each under the control it supports. Counsel's version: the proof she keeps. Each title starts with its number, in order.
import type { ProofFrequency } from './evidence.js';

export interface ProofRequirementTemplate {
  /** For example `PR-P08-02`: the policy that covers the control, and a number within that policy. */
  id: string;
  controlId: string;
  title: string;
  /** What a good answer holds. Empty when the title says it all. */
  description?: string;
  frequency: ProofFrequency;
}

export const PROOF_REQUIREMENTS: readonly ProofRequirementTemplate[] = [
  {
    id: 'PR-P01-01',
    controlId: 'DPDP-R3-01',
    title: '01 – Published notice snapshot in every language offered',
    frequency: 'yearly',
  },
  {
    id: 'PR-P01-02',
    controlId: 'DPDP-R3-02',
    title: '02 – Consent record sample for each collection channel',
    frequency: 'yearly',
  },
  {
    id: 'PR-P01-03',
    controlId: 'DPDP-R3-02',
    title: '03 – Withdrawal request log with timestamps and resolution',
    frequency: 'quarterly',
  },
  {
    id: 'PR-P03-03',
    controlId: 'DPDP-R6-08',
    title: '04 – Security awareness training completion report',
    frequency: 'yearly',
  },
  {
    id: 'PR-P04-01',
    controlId: 'DPDP-R6-02',
    title: '05 – Identity inventory with role assignments and MFA status',
    frequency: 'yearly',
  },
  {
    id: 'PR-P04-04',
    controlId: 'DPDP-R6-02',
    title: '06 – Leaver deprovisioning evidence within the leaver deadline',
    frequency: 'quarterly',
  },
  {
    id: 'PR-P04-03',
    controlId: 'DPDP-R6-03',
    title: '07 – Privileged access list and approval records',
    frequency: 'yearly',
  },
  {
    id: 'PR-P05-01',
    controlId: 'DPDP-R6-01',
    title: '08 – Encryption configuration export for databases, storage, and backups',
    frequency: 'yearly',
  },
  {
    id: 'PR-P05-02',
    controlId: 'DPDP-R6-01',
    title: '09 – TLS configuration scan for public endpoints',
    frequency: 'quarterly',
  },
  {
    id: 'PR-P06-01',
    controlId: 'DPDP-R6-04',
    title: '10 – Log source inventory and coverage matrix',
    frequency: 'yearly',
  },
  {
    id: 'PR-P06-02',
    controlId: 'DPDP-R6-04',
    title: '11 – Log retention configuration showing at least the required retention period',
    frequency: 'yearly',
  },
  {
    id: 'PR-P06-04',
    controlId: 'DPDP-R6-05',
    title: '12 – Monthly log review sign-off',
    frequency: 'monthly',
  },
  {
    id: 'PR-P07-01',
    controlId: 'DPDP-R6-06',
    title: '13 – Backup configuration and schedule for all personal data systems',
    frequency: 'yearly',
  },
  {
    id: 'PR-P07-02',
    controlId: 'DPDP-R6-06',
    title: '14 – Restore test report with recovery time and data integrity results',
    frequency: 'quarterly',
  },
  {
    id: 'PR-P08-01',
    controlId: 'DPDP-R7-01',
    title: '15 – Incident register with discovery, containment, and notification timestamps',
    frequency: 'quarterly',
  },
  {
    id: 'PR-P08-02',
    controlId: 'DPDP-R7-02',
    title: '16 – Board first intimation copy and acknowledgement',
    description:
      'Copy and acknowledgement of every first intimation sent to the Board in the period, or a nil return if there was no notifiable breach.',
    frequency: 'yearly',
  },
  {
    id: 'PR-P08-03',
    controlId: 'DPDP-R7-04',
    title: '17 – Detailed breach report filed within the reporting window',
    description:
      'Every detailed report filed with the Board in the period, with filing time against the reporting window, or a nil return if there was no notifiable breach.',
    frequency: 'yearly',
  },
  {
    id: 'PR-P08-04',
    controlId: 'DPDP-R7-03',
    title: '18 – Data Principal notification copy in required languages',
    description:
      'Copy of every notice sent to affected Data Principals in the period, in each language used, or a nil return if there was no notifiable breach.',
    frequency: 'yearly',
  },
  {
    id: 'PR-P09-01',
    controlId: 'DPDP-R8-01',
    title: '19 – Approved retention schedule mapped to processing activities',
    frequency: 'yearly',
  },
  {
    id: 'PR-P09-02',
    controlId: 'DPDP-R8-02',
    title: '20 – Deletion job logs and completion certificates',
    frequency: 'quarterly',
  },
  {
    id: 'PR-P09-03',
    controlId: 'DPDP-R8-02',
    title: '21 – Pre-erasure notices sent to Data Principals',
    frequency: 'quarterly',
  },
  {
    id: 'PR-P09-04',
    controlId: 'DPDP-R8-03',
    title: '22 – Processor deletion confirmations',
    frequency: 'quarterly',
  },
  {
    id: 'PR-P10-01',
    controlId: 'DPDP-R14-01',
    title: '23 – Published rights request channel with instructions and response standards',
    frequency: 'yearly',
  },
  {
    id: 'PR-P10-02',
    controlId: 'DPDP-R14-01',
    title: '24 – Rights request register with acknowledgement and closure timestamps',
    frequency: 'quarterly',
  },
  {
    id: 'PR-P10-03',
    controlId: 'DPDP-R14-01',
    title: '25 – Access and correction fulfilment samples',
    frequency: 'quarterly',
  },
  {
    id: 'PR-P10-04',
    controlId: 'DPDP-R14-01',
    title: '26 – Erasure and nomination request records',
    frequency: 'quarterly',
  },
  {
    id: 'PR-P11-01',
    controlId: 'DPDP-R9-01',
    title: '27 – Published DPO or responsible person contact details and grievance channel',
    frequency: 'yearly',
  },
  {
    id: 'PR-P11-02',
    controlId: 'DPDP-R14-02',
    title: '28 – Grievance register with acknowledgement, escalation, and closure timestamps',
    frequency: 'quarterly',
  },
  {
    id: 'PR-P12-02',
    controlId: 'DPDP-R6-07',
    title: '29 – Signed data processing agreements with required clauses',
    frequency: 'yearly',
  },
  {
    id: 'PR-P13-02',
    controlId: 'DPDP-R10-01',
    title: '30 – Verifiable parental consent records and verification method',
    frequency: 'yearly',
  },
  {
    id: 'PR-P13-03',
    controlId: 'DPDP-R11-01',
    title: '31 – Guardian consent records for persons with disabilities',
    frequency: 'yearly',
  },
  {
    id: 'PR-P13-05',
    controlId: 'DPDP-R10-02',
    title: '32 – No-tracking and no-targeted-advertising attestation',
    frequency: 'yearly',
  },
  {
    id: 'PR-P14-02',
    controlId: 'DPDP-R15-01',
    title: '33 – Restricted-country assessment and legal update review',
    frequency: 'yearly',
  },
  {
    id: 'PR-P17-02',
    controlId: 'DPDP-R13-02',
    title: '34 – DPO appointment, qualifications, and India residency evidence',
    frequency: 'yearly',
  },
  {
    id: 'PR-P17-03',
    controlId: 'DPDP-R13-03',
    title: '35 – Independent auditor appointment, conflict check, and annual audit report',
    frequency: 'yearly',
  },
  {
    id: 'PR-P17-04',
    controlId: 'DPDP-R13-04',
    title: '36 – Annual DPIA, methodology, high-risk register, and remediation plan',
    frequency: 'yearly',
  },
  {
    id: 'PR-P17-05',
    controlId: 'DPDP-R13-06',
    title: '37 – Localisation attestation for specified data categories',
    frequency: 'yearly',
  },
  {
    id: 'PR-P18-02',
    controlId: 'DPDP-R13-05',
    title: '38 – Algorithm and AI due diligence assessment before deployment and annually',
    frequency: 'yearly',
  },
  {
    id: 'PR-P18-06',
    controlId: 'DPDP-R16-01',
    title: '39 – Rule 16 exemption reliance confirmation and safeguard check',
    description:
      "DPO's written confirmation of whether the organisation relies on the Rule 16 exemption and, if it does, how each use meets the Schedule standards and is not used for decisions about individuals.",
    frequency: 'yearly',
  },
];
