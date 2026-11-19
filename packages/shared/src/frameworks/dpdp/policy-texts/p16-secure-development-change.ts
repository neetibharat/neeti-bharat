// Secure Development and Change Management Policy, as counsel wrote it.
export const P16_TEXT = `> Every change to {{companyName}} software or infrastructure is peer-reviewed, security-tested and approved before release, and privacy is designed in from the start.

## 1. Purpose

To build Rule 6 safeguards into {{companyName}} products and client deliverables, so that new code and changes do not introduce vulnerabilities or unplanned processing of personal data.

## 2. Scope

All software {{companyName}} builds or maintains (internal tools, products and client projects), infrastructure-as-code, and changes to production configuration.

## 3. Secure development lifecycle

- **Design:** Requirement: Privacy and security review for features that collect new personal data or new purposes; update RoP (P02); DPIA for high-risk processing (P17)
- **Build:** Requirement: Follow secure coding guidance (OWASP Top 10, OWASP ASVS for web apps); no secrets in code; use approved libraries; encryption meets P05 ({{encryptionStandard}} at rest, {{minTls}} or higher in transit)
- **Review:** Requirement: At least one peer review on every pull request; security-sensitive changes reviewed by a designated reviewer
- **Test:** Requirement: Automated SAST, dependency and secrets scanning on every build; DAST or penetration test before major releases; findings fixed within the deadlines in the vulnerability management standard (P03) unless an exception is approved
- **Data:** Requirement: No real Restricted personal data in development or test; use synthetic or masked data (P05)
- **Deploy:** Requirement: Through CI/CD pipeline only; production deploy rights limited (P04); each release has a rollback plan and post-release monitoring, with records kept
- **Third parties:** Requirement: Third-party code, libraries, APIs and AI models are reviewed before adoption for security, licensing, data use, retention and transfer; review records kept (P18 for AI)

## 4. Change management

- **Standard changes** (pre-approved, low risk, repeatable) follow the documented procedure and are logged.
- **Normal changes** need a ticket with description, risk, test evidence, rollback plan and approval by the system owner.
- **Emergency changes** may be made to restore service or fix a critical vulnerability, with prompt retrospective review.
- Production configuration changes are made through code or recorded change tickets; drift is detected and investigated.
- Segregation of duties: the author of a change does not approve their own production release.

A sample of change approvals and tests, scan reports, and release and rollback records are reviewed every quarter.

## 5. Privacy by design

Every feature that touches personal data completes a privacy-by-design checklist. A DPIA (P17) is triggered when a change introduces any of: Restricted or children's data, a new purpose, profiling or AI, large-scale monitoring, or a new transfer outside India or outside {{hostingRegion}}.

New features minimise data collected, set privacy-protective defaults, provide notice and consent hooks (P01), support rights fulfilment and deletion (P09, P10), and emit the logs P06 requires (retained for at least {{logKeepPeriod}}).

## 6. Roles

- **Engineering lead:** owns SDLC and change process.
- **Security lead:** approves this policy, defines tooling and reviews security exceptions.
- **Developers:** follow the lifecycle and complete secure coding training (P15).

## 7. Evidence

SDLC procedure and privacy-by-design checklist; change approval and testing samples; scan reports; release and rollback records; third-party review records.

## 8. Review

Annual.

## Exceptions

Any departure from this policy needs a written exception that states the reason, the compensating controls and an end date within the maximum exception period set under P19. It is approved by this policy's approver and recorded in the exception log.

## Contact

Questions about this policy go to the Data Protection Officer, {{dpoName}}, at {{dpoEmail}}. Security vulnerabilities found in production are reported to {{breachContact}}.

## Appendix: Audit controls and required proof

This policy covers the controls below from the DPDP audit checklist. Proof items and frequencies match the compliance platform. Where a control is shared, its proof items are listed once, in the policy named.

- **DPDP-ORG-07 Change management**: SDLC policy, privacy-by-design checklist, and DPIA trigger criteria. Frequency: yearly.
- **DPDP-ORG-07 Change management**: Change approval and testing sample. Frequency: quarterly.
- **DPDP-ORG-07 Change management**: SAST, DAST, dependency, and secrets scan reports. Frequency: quarterly.
- **DPDP-ORG-07 Change management**: Release, rollback, and post-release monitoring records. Frequency: quarterly.
- **DPDP-ORG-07 Change management**: Third-party code, API, and model review records. Frequency: yearly.
- **DPDP-R6-01 Encryption at rest and in transit**: Proof items are listed in P05.
- **DPDP-R6-08 Organisational measures and training**: Proof items are listed in P03 and P15.
`;
