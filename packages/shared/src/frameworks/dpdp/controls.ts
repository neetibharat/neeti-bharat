// The 47 controls: one job each, grouped under a rule or the organisation. Counsel's version.
import type { DpdpControl } from './types.js';

export const CONTROLS: readonly DpdpControl[] = [
  {
    id: 'DPDP-R3-01',
    ruleId: 'R3',
    title: 'Itemised privacy notice',
    description:
      'Notice states the data, purpose, rights, grievance route, and withdrawal process.',
    policyIds: ['P01'],
  },
  {
    id: 'DPDP-R3-02',
    ruleId: 'R3',
    title: 'Consent capture and withdrawal',
    description:
      'Consent is recorded with purpose, timestamp, and version, and withdrawal is as easy as consent.',
    policyIds: ['P01'],
  },
  {
    id: 'DPDP-R3-03',
    ruleId: 'R3',
    title: 'Purpose limitation and minimisation',
    description: 'Data is collected only for stated purposes and limited to what is necessary.',
    policyIds: ['P01'],
  },
  {
    id: 'DPDP-R4-01',
    ruleId: 'R4',
    title: 'Consent Manager readiness',
    description:
      'The organisation can accept and act on consent records from a registered Consent Manager.',
    policyIds: ['P01'],
  },
  {
    id: 'DPDP-R6-01',
    ruleId: 'R6',
    title: 'Encryption at rest and in transit',
    description:
      'Personal data is encrypted in transit and at rest using approved algorithms and key management.',
    policyIds: ['P05', 'P16'],
  },
  {
    id: 'DPDP-R6-02',
    ruleId: 'R6',
    title: 'Access control',
    description:
      'Access is role-based, least privilege, reviewed, and revoked on exit or role change.',
    policyIds: ['P04', 'P15'],
  },
  {
    id: 'DPDP-R6-03',
    ruleId: 'R6',
    title: 'Authentication and privileged access',
    description:
      'Strong authentication is enforced, privileged access is managed, and shared accounts are prohibited.',
    policyIds: ['P04'],
  },
  {
    id: 'DPDP-R6-04',
    ruleId: 'R6',
    title: 'Logging and monitoring',
    description:
      'Access and processing events are logged, monitored, and retained for at least the required log retention period.',
    policyIds: ['P06'],
  },
  {
    id: 'DPDP-R6-05',
    ruleId: 'R6',
    title: 'Log integrity and review',
    description: 'Logs are protected from tampering, reviewed, and alerts are investigated.',
    policyIds: ['P06'],
  },
  {
    id: 'DPDP-R6-06',
    ruleId: 'R6',
    title: 'Backup and continued processing',
    description:
      'Backups are encrypted, tested, and support continued processing during disruption.',
    policyIds: ['P07'],
  },
  {
    id: 'DPDP-R6-07',
    ruleId: 'R6',
    title: 'Processor contract safeguards',
    description:
      'Contracts require security safeguards, breach notice, deletion, and audit rights.',
    policyIds: ['P12'],
  },
  {
    id: 'DPDP-R6-08',
    ruleId: 'R6',
    title: 'Organisational measures and training',
    description: 'Roles are assigned, policies are communicated, and personnel are trained.',
    policyIds: ['P03', 'P15', 'P16'],
  },
  {
    id: 'DPDP-R7-01',
    ruleId: 'R7',
    title: 'Breach detection and triage',
    description: 'Incidents are detected, classified, and escalated using a documented process.',
    policyIds: ['P08'],
  },
  {
    id: 'DPDP-R7-02',
    ruleId: 'R7',
    title: 'Board intimation',
    description: 'The Board is intimated without delay with the required particulars.',
    policyIds: ['P08'],
  },
  {
    id: 'DPDP-R7-03',
    ruleId: 'R7',
    title: 'Data Principal notification',
    description:
      'Affected Data Principals are notified in clear language with protective guidance.',
    policyIds: ['P08'],
  },
  {
    id: 'DPDP-R7-04',
    ruleId: 'R7',
    title: 'Detailed breach report',
    description:
      'A detailed report is submitted to the Board within the breach reporting window and updated as facts develop.',
    policyIds: ['P08'],
  },
  {
    id: 'DPDP-R8-01',
    ruleId: 'R8',
    title: 'Retention schedule',
    description: 'Every processing activity has a documented retention period and basis.',
    policyIds: ['P09', 'P02'],
  },
  {
    id: 'DPDP-R8-02',
    ruleId: 'R8',
    title: 'Erasure with notice',
    description:
      'Data is erased on purpose completion or withdrawal, with 48-hour notice where required.',
    policyIds: ['P09', 'P10'],
  },
  {
    id: 'DPDP-R8-03',
    ruleId: 'R8',
    title: 'Deletion verification',
    description: 'Deletion is verified and confirmed for processors and backups.',
    policyIds: ['P09'],
  },
  {
    id: 'DPDP-R9-01',
    ruleId: 'R9',
    title: 'Published contact and grievance route',
    description:
      'DPO or responsible person contact details and the grievance route are published and current.',
    policyIds: ['P11', 'P01'],
  },
  {
    id: 'DPDP-R10-01',
    ruleId: 'R10',
    title: 'Age gate and parental consent',
    description:
      'Age gating is implemented and verifiable parental consent is obtained before processing.',
    policyIds: ['P13'],
  },
  {
    id: 'DPDP-R10-02',
    ruleId: 'R10',
    title: 'No tracking or targeted advertising',
    description: "Children's data is not behaviourally tracked or used for targeted advertising.",
    policyIds: ['P13'],
  },
  {
    id: 'DPDP-R11-01',
    ruleId: 'R11',
    title: 'Guardian consent',
    description: 'Guardian authority is verified and consent is recorded before processing.',
    policyIds: ['P13'],
  },
  {
    id: 'DPDP-R12-01',
    ruleId: 'R12',
    title: 'Exemption register',
    description: 'Every exemption is documented, approved, conditioned, and reviewed.',
    policyIds: ['P13'],
  },
  {
    id: 'DPDP-R13-01',
    ruleId: 'R13',
    title: 'SDF assessment and designation',
    description: 'SDF factors are assessed and the designation is documented.',
    policyIds: ['P17'],
  },
  {
    id: 'DPDP-R13-02',
    ruleId: 'R13',
    title: 'DPO in India',
    description: 'A DPO resident in India is appointed and reports to the Board.',
    policyIds: ['P17'],
  },
  {
    id: 'DPDP-R13-03',
    ruleId: 'R13',
    title: 'Independent audit',
    description: 'An independent auditor is appointed and an annual audit is completed.',
    policyIds: ['P17'],
  },
  {
    id: 'DPDP-R13-04',
    ruleId: 'R13',
    title: 'Annual DPIA',
    description: 'A DPIA is completed annually and on material change, with remediation tracked.',
    policyIds: ['P17'],
  },
  {
    id: 'DPDP-R13-05',
    ruleId: 'R13',
    title: 'Algorithm due diligence',
    description:
      'Algorithms and AI systems are assessed for design, data, output, and rights risks.',
    policyIds: ['P18'],
  },
  {
    id: 'DPDP-R13-06',
    ruleId: 'R13',
    title: 'Localisation',
    description: 'Specified personal data is stored in India as required.',
    policyIds: ['P17'],
  },
  {
    id: 'DPDP-R14-01',
    ruleId: 'R14',
    title: 'Rights fulfilment',
    description:
      'Access, correction, completion, updating, erasure, and nomination requests are fulfilled.',
    policyIds: ['P10'],
  },
  {
    id: 'DPDP-R14-02',
    ruleId: 'R14',
    title: 'Grievance SLA',
    description:
      'Grievances are acknowledged and resolved within 90 days with escalation to the DPO.',
    policyIds: ['P11'],
  },
  {
    id: 'DPDP-R15-01',
    ruleId: 'R15',
    title: 'Transfer register and restrictions',
    description: 'Transfers are recorded and restricted destinations are blocked.',
    policyIds: ['P14'],
  },
  {
    id: 'DPDP-R15-02',
    ruleId: 'R15',
    title: 'Transfer safeguards',
    description: 'Lawful basis, contractual safeguards, and impact assessments are documented.',
    policyIds: ['P14'],
  },
  {
    id: 'DPDP-R16-01',
    ruleId: 'R16',
    title: 'Research safeguards',
    description:
      'Research processing is documented, minimised, and approved under the applicable conditions.',
    policyIds: ['P18'],
  },
  {
    id: 'DPDP-ORG-01',
    ruleId: 'ORG',
    title: 'Governance and accountability',
    description: 'Roles, responsibilities, and board oversight for DPDP are defined.',
    policyIds: ['P19', 'P03'],
  },
  {
    id: 'DPDP-ORG-02',
    ruleId: 'ORG',
    title: 'Policy management',
    description: 'Policies are approved, published, reviewed, and version-controlled.',
    policyIds: ['P19', 'P03'],
  },
  {
    id: 'DPDP-ORG-03',
    ruleId: 'ORG',
    title: 'Training and awareness',
    description: 'Personnel receive role-based privacy and security training.',
    policyIds: ['P15'],
  },
  {
    id: 'DPDP-ORG-04',
    ruleId: 'ORG',
    title: 'Risk assessment',
    description: 'Privacy risks are assessed, treated, and tracked.',
    policyIds: ['P03', 'P18', 'P17'],
  },
  {
    id: 'DPDP-ORG-05',
    ruleId: 'ORG',
    title: 'Vendor management',
    description: 'Processors are assessed, contracted, monitored, and offboarded.',
    policyIds: ['P02', 'P12'],
  },
  {
    id: 'DPDP-ORG-06',
    ruleId: 'ORG',
    title: 'Records of processing',
    description: 'A RoPA is maintained and kept current.',
    policyIds: ['P02'],
  },
  {
    id: 'DPDP-ORG-07',
    ruleId: 'ORG',
    title: 'Change management',
    description: 'Privacy and security reviews are part of product and infrastructure change.',
    policyIds: ['P16'],
  },
  {
    id: 'DPDP-ORG-08',
    ruleId: 'ORG',
    title: 'Audit and assurance',
    description: 'Controls are independently tested and findings are remediated.',
    policyIds: ['P19'],
  },
  {
    id: 'DPDP-ORG-09',
    ruleId: 'ORG',
    title: 'Incident management',
    description: 'Incidents are logged, investigated, and reviewed.',
    policyIds: ['P08'],
  },
  {
    id: 'DPDP-ORG-10',
    ruleId: 'ORG',
    title: 'Monitoring and metrics',
    description: 'Compliance metrics are defined, collected, and reported.',
    policyIds: ['P19'],
  },
  {
    id: 'DPDP-ORG-11',
    ruleId: 'ORG',
    title: 'Regulatory engagement',
    description: 'Regulatory changes and enquiries are tracked and handled.',
    policyIds: ['P19'],
  },
  {
    id: 'DPDP-ORG-12',
    ruleId: 'ORG',
    title: 'Documentation and evidence',
    description: 'Compliance evidence is retained and available for audit.',
    policyIds: ['P19'],
  },
];
