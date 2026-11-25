// Cross-Border Transfer Policy, as counsel wrote it.
export const P14_TEXT = `> {{companyName}} may store or access personal data outside India only where no government restriction applies to that country, the transfer is recorded, and the recipient is bound to {{companyName}}'s safeguards.

## 1. Purpose

To comply with s.16, under which the Central Government may restrict transfers to notified countries or territories, and Rule 15, under which transfers outside India are subject to any requirements the Government specifies by order about making personal data available to a foreign State or its entities.

## 2. Scope

Any storage of, or remote access to, {{companyName}} or client personal data from outside India, including cloud regions, offshore vendors, sub-processors, overseas group companies, staff travelling or working abroad, and DR sites.

**Applicability.** The controls in this policy apply if the organisation transfers or gives access to personal data outside India. {{companyName}} records its position in its setup (sends data abroad: {{sendsDataAbroad}}; primary hosting region: {{hostingRegion}}). Each year the Privacy lead, with the Security lead, confirms in writing which hosting and cloud regions hold personal data (including backups, logs and DR) and whether any support or administration happens from outside India. If any transfer exists, the setup answer is changed and this policy applies in full.

## 3. Policy statements

**3.1 Default location.** Production personal data, backups and logs are stored in {{hostingRegion}}. Storage outside India needs approval under 3.2.

**3.2 Approval.** Before any new transfer, the Privacy lead checks and records:

- the destination country is not restricted by a notification under s.16;
- no Rule 15 order or sectoral rule (e.g. RBI, SEBI, IRDAI data localisation) applies to that data;
- for a Significant Data Fiduciary, the data is not in a category the Government has required to stay in India (see P17);
- client contracts permit the transfer (for client data);
- the recipient has signed a DPA under P12 with standard contractual clauses or equivalent safeguards and onward-transfer limits;
- for a high-risk destination, a transfer impact assessment has been completed and approved by the DPO, {{dpoName}}.

**3.3 Transfer register.** Every transfer is recorded in a transfer register and in the Record of Processing (P02): data categories, destination, recipient, purpose, safeguard, legal check date.

**3.4 Government access requests.** If a foreign government or authority requests access to personal data, the recipient must notify {{companyName}} (where lawful) and {{companyName}} follows any applicable Rule 15 requirement. Requests are logged and reviewed by General Counsel.

**3.5 Monitoring changes.** The Privacy lead checks for new s.16 notifications and Rule 15 orders regularly, and once a year records a restricted-country assessment and legal update review. Where data must stay in India, the Privacy lead signs a localisation attestation. If a destination becomes restricted, transfers stop and data is repatriated or erased under a plan approved by the DPO.

## 4. Roles

- **Privacy lead:** owns the register and legal checks.
- **Security lead:** confirms hosting region configurations.
- **General Counsel:** advises on sectoral localisation and foreign access requests.
- **DPO ({{dpoName}}):** approves this policy and any high-risk transfer.

## 5. Evidence

Transfer register; restricted-country assessment; localisation attestation; contractual safeguards; transfer impact assessments; annual region confirmation.

## 6. Review

Annual, and whenever the Government notifies a restriction or order.

## Exceptions

Any departure from this policy needs a written exception that states the reason, the compensating controls and an end date within the maximum exception period set under P19. It is approved by this policy's approver and recorded in the exception log.

## Contact

Questions about this policy go to the Data Protection Officer, {{dpoName}}, at {{dpoEmail}}.

## Appendix: Audit controls and required proof

This policy covers the controls below from the DPDP audit checklist. Proof items and frequencies match the compliance platform. Each control applies if the organisation performs this activity.

- **DPDP-R15-01 Transfer register and restrictions** (applies if the organisation performs this activity): Transfer register with destination, data category, purpose, and safeguard. Frequency: yearly.
- **DPDP-R15-01 Transfer register and restrictions** (applies if the organisation performs this activity): Restricted-country assessment and legal update review. Frequency: yearly.
- **DPDP-R15-01 Transfer register and restrictions** (applies if the organisation performs this activity): Localisation attestation for data required to remain in India. Frequency: yearly.
- **DPDP-R15-02 Transfer safeguards** (applies if the organisation performs this activity): Standard contractual clauses or equivalent safeguards. Frequency: yearly.
- **DPDP-R15-02 Transfer safeguards** (applies if the organisation performs this activity): Transfer impact assessment for high-risk destinations. Frequency: yearly.
`;
