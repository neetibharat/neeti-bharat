// SDF Governance and DPIA Policy, as counsel wrote it.
export const P17_TEXT = `> If {{companyName}} is notified as a Significant Data Fiduciary, it will run a Data Protection Impact Assessment and an independent audit every 12 months and report significant findings to the Data Protection Board; in all cases, it runs DPIAs on high-risk processing.

## 1. Purpose

To set the governance that s.10 and Rule 13 require of a Significant Data Fiduciary (SDF), and a DPIA practice that applies to all high-risk processing regardless of SDF status.

## 2. SDF status

The Central Government notifies SDFs based on factors including volume and sensitivity of data, risk to Data Principals' rights, and impact on sovereignty, security or public order. The DPO, {{dpoName}}, monitors notifications and reports {{companyName}}'s status to leadership.

{{companyName}} records its SDF status in its setup (setup answer: {{isSignificantFiduciary}}). The DPO records a written SDF assessment each year (factors considered, conclusion and date) and updates the setup answer immediately if a notification is received.

## 3. Obligations that apply if {{companyName}} is an SDF

- **DPO (s.10(2)(a)):** Requirement: Appoint a DPO based in India, responsible to the Board of Directors, as the point of contact for grievances; keep appointment letter, qualifications and residency evidence; Owner: Board of Directors
- **Independent data auditor (s.10(2)(b)):** Requirement: Appoint an independent auditor after a conflict-of-interest check; obtain an annual audit report; Owner: Board of Directors
- **Annual DPIA and audit (Rule 13):** Requirement: Once every 12 months from notification, as Rule 13 requires; furnish a report of significant observations to the Data Protection Board; Owner: DPO
- **Algorithmic due diligence (Rule 13):** Requirement: Verify that algorithmic software used to process personal data is not likely to pose a risk to Data Principals' rights (see P18); Owner: AI owner, DPO
- **Data localisation (Rule 13):** Requirement: Keep any personal data and related traffic data that the Government specifies within India (current hosting region: {{hostingRegion}}); Owner: Security lead, Privacy lead
- **Board reporting:** Requirement: The DPO reports DPIA, audit and remediation findings to the Board of Directors; Owner: DPO

## 4. DPIA practice (applies to every organisation)

A DPIA is required before:

- processing Restricted data at scale or children's data;
- new profiling, automated decision-making or AI use on personal data (P18);
- new large-scale monitoring or new cross-border transfer patterns (P14);
- any processing the DPO judges likely to pose significant risk.

DPIAs follow a written methodology. Findings feed a DPIA register and a remediation plan with owners and dates. Each DPIA records: description and purpose of processing; necessity and proportionality; risks to Data Principals' rights; measures to address risks; DPO sign-off; residual risk acceptance by the business owner. DPIAs are revisited when processing changes and at least annually for ongoing high-risk processing.

Because this practice applies regardless of SDF status, its evidence is kept under the organisation-wide risk assessment control (DPDP-ORG-04).

## 5. Leadership oversight

The DPO reports to leadership on DPIA outcomes, audit findings, breaches, rights and grievance metrics, and progress against this policy set, as part of the quarterly compliance metrics report under P19. If {{companyName}} is an SDF, this policy is approved by the Board of Directors and the approval is recorded in Board minutes.

## 6. Evidence

SDF status assessment; DPIA register, methodology and remediation plan; DPO appointment records; audit reports; Board reports; localisation attestation.

## 7. Review

Annual, and immediately upon SDF notification.

## Exceptions

Any departure from this policy needs a written exception that states the reason, the compensating controls and an end date within the maximum exception period set under P19. It is approved by this policy's approver and recorded in the exception log.

## Contact

Questions about this policy go to the Data Protection Officer, {{dpoName}}, at {{dpoEmail}}.

## Appendix: Audit controls and required proof

This policy covers the controls below from the DPDP audit checklist. Proof items and frequencies match the compliance platform. Where a control is shared, its proof items are listed once, in the policy named.

- **DPDP-ORG-04 Risk assessment**: DPIA register, methodology, and remediation plan for high-risk processing. Frequency: yearly.
- **DPDP-ORG-04 Risk assessment**: Further proof items are listed in P03 and P18.
- **DPDP-R13-01 SDF assessment and designation** (applies if the organisation performs this activity): SDF designation assessment, factors, and notification. Frequency: yearly.
- **DPDP-R13-02 DPO in India** (applies if the organisation performs this activity): DPO appointment, qualifications, and India residency evidence. Frequency: yearly.
- **DPDP-R13-02 DPO in India** (applies if the organisation performs this activity): Board reporting on DPIA, audit, and remediation findings. Frequency: yearly.
- **DPDP-R13-03 Independent audit** (applies if the organisation performs this activity): Independent auditor appointment, conflict check, and annual audit report. Frequency: yearly.
- **DPDP-R13-04 Annual DPIA** (applies if the organisation performs this activity): Annual DPIA, methodology, high-risk register, and remediation plan. Frequency: yearly.
- **DPDP-R13-06 Localisation** (applies if the organisation performs this activity): Localisation attestation for specified data categories. Frequency: yearly.
`;
