// HR and Personnel Security Policy, as counsel wrote it.
export const P15_TEXT = `> Everyone who works for {{companyName}} is screened, bound by confidentiality, trained in privacy and security on joining and every year, and loses all access within {{leaverAccessWithin}} of leaving.

## 1. Purpose

To cover the people side of Rule 6 reasonable security safeguards (organisational measures under Rule 6(1)(g)), so that staff and contractors handle personal data safely.

## 2. Scope

Employees, interns, contractors and consultants with access to {{companyName}} systems or to {{companyName}} or client personal data.

## 3. Before employment

- Background verification proportionate to role and data access (identity, education, previous employment; criminal record check for roles with Restricted data access, where lawful). Candidates are told what checks are done, consistent with P01.
- Every employee, contractor and temporary worker signs a confidentiality undertaking before access is granted.
- Contractors and temporary staff follow the same onboarding, confidentiality and training steps as employees, with records kept.
- Employment and contractor agreements include confidentiality, acceptable use and data protection clauses that survive termination.
- Interns or other workers under 18 are handled under P13 (consent of a parent or lawful guardian) before any of their personal data is processed.

## 4. During employment

- **Induction training:** Requirement: Privacy (DPDP basics, P01, P10) and security (P03, P08 reporting) before access to Restricted data
- **Annual refresher:** Requirement: All staff, with completion tracked
- **Role-based training:** Requirement: Engineers: secure coding (P16). Support: rights requests (P10). Leads: incident roles (P08)
- **Phishing simulations:** Requirement: Run regularly, at the frequency set by the Security lead
- **Policy acknowledgement:** Requirement: Staff acknowledge this policy set on joining and after each major version
- **Access review support:** Requirement: Managers confirm their team's access {{accessReview}} as part of the P04 access review

Breaches of policy are handled through the disciplinary process, proportionate to severity and intent.

## 5. Employee personal data

{{companyName}} processes staff data for employment purposes as a legitimate use under s.7, gives staff a notice describing that processing, applies P09 retention, and limits HR data access to HR and authorised managers. Staff raise privacy questions or grievances about their own data with {{dpoName}} at {{dpoEmail}} or at {{grievanceEmail}} (P11).

## 6. Joining, changing role or leaving

- A joiner, mover and leaver checklist records each access approval and revocation, and is reviewed every quarter.
- HR notifies IT on or before the effective date (P04). All access is removed within {{leaverAccessWithin}} of exit, and immediately for involuntary exits.
- Movers lose access they no longer need promptly after the role change.
- Devices, ID cards and tokens are returned; company data on personal devices is wiped.
- Leavers receive a written reminder of continuing confidentiality obligations, kept on file.

## 7. Roles

- **HR lead:** owns screening, agreements, joiner and leaver notices, training tracking.
- **DPO and Security lead:** provide training content.
- **Managers:** ensure their teams complete training and confirm access in reviews.

## 8. Evidence

Screening records and signed undertakings; contractor onboarding records; training completion reports; joiner, mover and leaver checklists; exit reminders and disciplinary records.

## 9. Review

Annual.

## Exceptions

Any departure from this policy needs a written exception that states the reason, the compensating controls and an end date within the maximum exception period set under P19. It is approved by this policy's approver and recorded in the exception log.

## Contact

Questions about this policy go to the Data Protection Officer, {{dpoName}}, at {{dpoEmail}}.

## Appendix: Audit controls and required proof

This policy covers the controls below from the DPDP audit checklist. Proof items and frequencies match the compliance platform. Where a control is shared, its proof items are listed once, in the policy named.

- **DPDP-ORG-03 Training and awareness**: Role-based privacy and security training completion report. Frequency: yearly.
- **DPDP-R6-02 Access control**: Joiner, mover, and leaver checklist with access approval and revocation. Frequency: quarterly.
- **DPDP-R6-02 Access control**: Further proof items are listed in P04.
- **DPDP-R6-08 Organisational measures and training**: Background screening and signed confidentiality undertakings for personnel. Frequency: yearly.
- **DPDP-R6-08 Organisational measures and training**: Contractor and temporary staff onboarding, confidentiality, and training records. Frequency: yearly.
- **DPDP-R6-08 Organisational measures and training**: Disciplinary, exit, and continuing obligation reminders. Frequency: yearly.
- **DPDP-R6-08 Organisational measures and training**: Further proof items are listed in P03.
`;
