// Children's and Disability Data Policy, as counsel wrote it.
export const P13_TEXT = `> {{companyName}} processes data of anyone under 18, or of a person with a disability who has a lawful guardian, only with verifiable consent of the parent or guardian, and never tracks, behaviourally monitors or targets ads at children.

## 1. Purpose

To meet s.9 and Rules 10 to 12 on processing personal data of children (under 18) and of persons with disabilities who have a lawful guardian.

## 2. Scope

Any {{companyName}} service, campaign, event or internal process (e.g. internships, employee family benefits) that collects or is likely to collect such data. If no {{companyName}} service is directed at children, this policy still governs incidental collection.

**Applicability.** The controls in this policy apply if the organisation processes children's data or data of persons with a lawful guardian. {{companyName}} records its position in its setup (handles children's data: {{handlesChildrenData}}), and the DPO, {{dpoName}}, confirms it each year in writing, including whether any intern or worker is under 18. If a service becomes directed at, or likely to be used by, children or persons with a lawful guardian, the controls below apply before launch.

## 3. Policy statements

**3.1 Identify.** Product owners declare in the Record of Processing (P02) whether a service is directed at, or likely to be used by, children. Such services include an age declaration at sign-up. Any age gate is configured and tested, with test results kept.

**3.2 Verifiable parental consent (Rule 10).** Before processing a child's data, {{companyName}}:

- obtains consent from the person identifying as parent; and
- takes due diligence to check that the parent is an identifiable adult, using reliable identity and age details already held by {{companyName}}, or details or a virtual token provided voluntarily (for example through a government-authorised digital locker service).

**3.3 Lawful guardian (Rule 11).** For a person with a disability who cannot take legally binding decisions even with support, consent is taken from their lawful guardian. {{companyName}} verifies the guardian's appointment by a court, designated authority or local committee under the applicable law.

**3.4 Prohibited processing (s.9).** {{companyName}} does not:

- process children's data in a way likely to cause a detrimental effect on their well-being;
- track or behaviourally monitor children;
- direct targeted advertising at children.

**3.5 Exemptions (Rule 12).** Some classes of fiduciaries and purposes are exempt from parts of s.9 under the Rules' Fourth Schedule (e.g. healthcare, education, child safety). Any reliance is recorded in an exemption register naming the Fourth Schedule class or purpose. The DPO approves each register entry before processing.

**3.6 Minimisation and security.** Children's data is classified Restricted (P02), encrypted under P05 ({{encryptionStandard}}), and kept only as long as needed (P09).

**3.7 Attestation.** The Privacy lead signs a yearly attestation that no {{companyName}} service tracks, behaviourally monitors or targets advertising at children.

## 4. Roles

- **Privacy lead:** owns this policy and reviews any service flagged for children.
- **Product owners:** implement age gating and parental consent flows.
- **DPO ({{dpoName}}):** approves any exemption reliance and confirms applicability each year.

## 5. Evidence

RoP flags; age-gate configuration and tests; consent and verification records; guardian consent records; exemption register; no-tracking attestation; annual applicability confirmation.

## 6. Review

Annual, and before launch of any service likely to be used by children.

## Exceptions

Any departure from this policy needs a written exception that states the reason, the compensating controls and an end date within the maximum exception period set under P19. It is approved by this policy's approver and recorded in the exception log.

## Contact

Questions about this policy go to the Data Protection Officer, {{dpoName}}, at {{dpoEmail}}. Parents and guardians can raise concerns at {{grievanceEmail}}.

## Appendix: Audit controls and required proof

This policy covers the controls below from the DPDP audit checklist. Proof items and frequencies match the compliance platform. Each control applies if the organisation performs this activity.

- **DPDP-R10-01 Age gate and parental consent** (applies if the organisation performs this activity): Age gate configuration and test results. Frequency: yearly.
- **DPDP-R10-01 Age gate and parental consent** (applies if the organisation performs this activity): Verifiable parental consent records and verification method. Frequency: yearly.
- **DPDP-R10-02 No tracking or targeted advertising** (applies if the organisation performs this activity): No-tracking and no-targeted-advertising attestation. Frequency: yearly.
- **DPDP-R11-01 Guardian consent** (applies if the organisation performs this activity): Guardian consent records for persons with disabilities. Frequency: yearly.
- **DPDP-R12-01 Exemption register** (applies if the organisation performs this activity): Exemption register with Fourth Schedule class or purpose. Frequency: yearly.
`;
