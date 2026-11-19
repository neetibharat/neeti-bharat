// Data Classification and Records of Processing Policy, as counsel wrote it.
export const P02_TEXT = `> {{companyName}} classifies every data set it holds and keeps a single Record of Processing (RoP) showing what personal data it processes, why, on what lawful basis, where, and for how long.

## 1. Purpose

To show that all processing has a lawful ground under s.4 (consent or a legitimate use), that data used for decisions or disclosed to others is complete, accurate and consistent (s.8(3)), and to give P09 the purpose and retention facts that Rule 8 depends on.

## 2. Scope

All information assets in any system, environment or format that {{companyName}} owns, operates or uses through a vendor, including client data {{companyName}} processes as a Data Processor.

## 3. Classification levels

- **Restricted:** Meaning: Personal data whose exposure would cause serious harm; Examples: Government IDs, financial account data, health data, children's data, credentials, client production data; Minimum handling: Encrypted at rest ({{encryptionStandard}}) and in transit ({{minTls}} or higher), need-to-know access, logged access, no use in non-production
- **Confidential:** Meaning: Other personal data and sensitive business data; Examples: Names, emails, phone numbers, employee records, contracts; Minimum handling: Encrypted in transit ({{minTls}} or higher), role-based access, no public sharing
- **Internal:** Meaning: Business information not meant for the public; Examples: Internal procedures, non-personal metrics; Minimum handling: Access limited to staff and approved contractors
- **Public:** Meaning: Approved for publication; Examples: Website content, published policies; Minimum handling: None beyond integrity controls

When in doubt, data is classified at the higher level. Personal data is never classified below Confidential.

## 4. Record of Processing

The Privacy lead maintains the RoP. Each processing activity records:

- activity name, business owner and system(s);
- categories of Data Principals and of personal data;
- purpose(s) and lawful ground under s.4 (consent reference or s.7 legitimate use);
- whether {{companyName}} is Data Fiduciary or Data Processor;
- recipients, processors and sub-processors (link to P12);
- storage locations (default hosting region: {{hostingRegion}}) and any transfer outside India (link to P14);
- retention period and erasure trigger, including the {{logKeepPeriod}} minimum hold under Rule 8(3) (link to P09);
- classification level and key safeguards.

A new activity, or a change in purpose, data or vendor, is added to the RoP before go-live. Each activity's business owner signs off its RoP entry at least once a year.

**Processor and transfer mapping.** For each activity the RoP shows which processors and sub-processors receive the data and where it is stored or accessed from. This mapping is the starting point for vendor oversight under P12.

**Data minimisation review.** Once a year, the Privacy lead reviews every high-risk activity (Restricted data, large volumes, children's data, AI use) to confirm each data field is still needed, and records fields removed.

## 5. Data quality

Where personal data is used to make a decision affecting a person, or is disclosed to another Data Fiduciary, the business owner checks it is complete, accurate and consistent, and has a way to correct it (P10).

## 6. Roles

- **Privacy lead:** owns the RoP and classification scheme.
- **System and data owners:** classify their assets and keep RoP entries current.
- **DPO ({{dpoName}}):** reviews the RoP at least once a year and approves this policy.

## 7. Evidence

Current RoP with owner sign-offs; classification register; processor and transfer mapping; RoP change history; DPO review notes; minimisation review record.

## 8. Review

Annual, and when new categories of data or purposes are introduced.

## Exceptions

Any departure from this policy needs a written exception that states the reason, the compensating controls and an end date within the maximum exception period set under P19. It is approved by this policy's approver and recorded in the exception log.

## Contact

Questions about this policy go to the Data Protection Officer, {{dpoName}}, at {{dpoEmail}}.

## Appendix: Audit controls and required proof

This policy covers the controls below from the DPDP audit checklist. Proof items and frequencies match the compliance platform. Where a control is shared, its proof items are listed once, in the policy named.

- **DPDP-ORG-06 Records of processing**: Approved records of processing activities with owner sign-off. Frequency: yearly.
- **DPDP-R8-01 Retention schedule**: Data classification register and handling rules. Frequency: yearly.
- **DPDP-R8-01 Retention schedule**: Data minimisation review for high-risk activities. Frequency: yearly.
- **DPDP-R8-01 Retention schedule**: Further proof items are listed in P09.
- **DPDP-ORG-05 Vendor management**: Processor and transfer mapping per activity. Frequency: yearly.
`;
