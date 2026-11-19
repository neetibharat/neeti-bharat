// Vendor and Data Processor Management Policy, as counsel wrote it.
export const P12_TEXT = `> {{companyName}} engages a Data Processor only under a valid contract that requires Rule 6 safeguards, and stays responsible for what its processors do with personal data.

## 1. Purpose

To reflect that {{companyName}} remains responsible for compliance even when processing is done by a processor (s.8(1)), that processors may only be engaged under a valid contract (s.8(2)), and that the contract must provide for reasonable security safeguards (Rule 6(1)(f)). It also covers {{companyName}}'s own duties when it acts as a processor for clients.

## 2. Scope

All vendors, sub-processors, contractors and SaaS tools that store, access or process {{companyName}} or client personal data.

## 3. Onboarding

1. Business owner raises a request describing the data, purpose and volume.
2. Privacy and Security complete a risk assessment, scaled to data classification (P02): security questionnaire, certifications (such as ISO 27001 or SOC 2), data locations, sub-processors, breach history.
3. A Data Processing Agreement (DPA) is signed before any personal data is shared.
4. The vendor is added to the processor register (data categories, storage locations, contract status) and to the processor and transfer mapping in the Record of Processing (P02).
5. Sub-processors proposed by the vendor are approved in writing before use; the approved sub-processor list is kept with the register.

## 4. Minimum contract terms

- Process only on {{companyName}}'s documented instructions and for the specified purpose.
- Implement reasonable security safeguards at least equal to Rule 6: encryption ({{encryptionStandard}} at rest, {{minTls}} or higher in transit), access control, logging, backups, and log retention of at least {{logKeepPeriod}}.
- Notify {{companyName}} of any personal data breach without delay, within the period the contract sets, through {{breachContact}}, with the information needed for Rule 7 notices.
- Report cyber incidents to {{companyName}} quickly enough for {{companyName}} to meet its CERT-In reporting deadline.
- Confidentiality obligations on all personnel.
- No sub-processor without {{companyName}}'s prior approval; same obligations flow down.
- Assist with Data Principal rights requests and grievances.
- Retain personal data, traffic data and processing logs for at least {{logKeepPeriod}} from processing where Rule 8(3) requires, in a restricted hold, then erase.
- Erase or return data at contract end or on instruction, with written confirmation.
- Transfers outside India only as permitted under P14.
- Audit and information rights for {{companyName}}.

## 5. Ongoing oversight

Vendors are reassessed on a cycle set by risk tier. High-risk vendors (Restricted data or large volumes) are reassessed at least annually, with review of certification reports. Medium and low risk vendors are reassessed at the intervals the Privacy lead sets in the vendor management procedure, and at least at contract renewal.

At off-boarding, {{companyName}} obtains a written deletion confirmation from the vendor and files it with the register. Off-boarding confirmations are collected every quarter for vendors that left in the quarter.

## 6. {{companyName}} as a processor

When {{companyName}} processes client data, it follows the client's instructions and DPA, applies these same safeguards, notifies the client of breaches as set out in P08, and maintains a sub-processor list it can share with clients.

## 7. Roles

- **Procurement lead:** owns the process and vendor register.
- **Security lead and Privacy lead:** perform assessments; the Privacy lead sets reassessment intervals.
- **General Counsel:** maintains DPA templates.
- **DPO ({{dpoName}}):** approves this policy.

## 8. Evidence

Processor register; completed assessments; signed DPAs; sub-processor approvals; off-boarding deletion confirmations.

## 9. Review

Annual.

## Exceptions

Any departure from this policy needs a written exception that states the reason, the compensating controls and an end date within the maximum exception period set under P19. It is approved by this policy's approver and recorded in the exception log.

## Contact

Questions about this policy go to the Data Protection Officer, {{dpoName}}, at {{dpoEmail}}. Vendors report incidents to {{breachContact}}.

## Appendix: Audit controls and required proof

This policy covers the controls below from the DPDP audit checklist. Proof items and frequencies match the compliance platform. Where a control is shared, its proof items are listed once, in the policy named.

- **DPDP-R6-07 Processor contract safeguards**: Processor register with data categories, locations, and contract status. Frequency: yearly.
- **DPDP-R6-07 Processor contract safeguards**: Signed data processing agreements with required clauses. Frequency: yearly.
- **DPDP-R6-07 Processor contract safeguards**: Security due diligence questionnaire and evidence. Frequency: yearly.
- **DPDP-R6-07 Processor contract safeguards**: Sub-processor list and approval records. Frequency: yearly.
- **DPDP-R6-07 Processor contract safeguards**: Deletion and offboarding confirmations. Frequency: quarterly.
- **DPDP-ORG-05 Vendor management**: Proof items are listed in P02.
`;
