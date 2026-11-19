// Information Security Policy, as counsel wrote it.
export const P03_TEXT = `> {{companyName}} protects personal data with the reasonable security safeguards set out in Rule 6, implemented through the standards in P04 to P07, P12, P15 and P16.

## 1. Purpose

To set {{companyName}}'s top-level security commitments, so that it implements appropriate technical and organisational measures (s.8(4)) and reasonable security safeguards to prevent personal data breaches (s.8(5)), including for processing done by its Data Processors.

## 2. Scope

All {{companyName}} staff, contractors and vendors; all systems, networks, devices, cloud services and environments that store, process or transmit {{companyName}} or client data, wherever hosted (primary hosting region: {{hostingRegion}}).

## 3. Rule 6 minimum safeguards and where they are implemented

- **(a) Encryption, obfuscation, masking or virtual tokens:** Implemented by: P05 Encryption and Key Management ({{encryptionStandard}} at rest, {{minTls}} or higher in transit)
- **(b) Access control to computer resources:** Implemented by: P04 Access Control (access reviewed {{accessReview}})
- **(c) Visibility of access through logs, monitoring and review:** Implemented by: P06 Logging and Monitoring
- **(d) Continued processing after compromise, including backups:** Implemented by: P07 Backup, DR and BCP (maximum data loss {{maxDataLoss}}, restore within {{timeToRestore}})
- **(e) Retaining logs and personal data for {{logKeepPeriod}} to detect and investigate breaches:** Implemented by: P06 and P09
- **(f) Safeguard clauses in Data Processor contracts:** Implemented by: P12 Vendor and Processor Management
- **(g) Appropriate technical and organisational measures to ensure effective observance:** Implemented by: This policy, P15, P16, P19

## 4. Policy statements

- **Risk management:** the Security lead maintains a risk register, assesses risk at least annually and before major changes, and tracks treatment to closure.
- **Asset management:** all assets are inventoried and classified under P02.
- **Endpoint security:** company and BYOD devices that access Restricted or Confidential data use full-disk encryption, screen lock, supported OS versions, endpoint protection and remote wipe.
- **Network security:** production networks are segmented; inbound access is restricted to required ports; administrative access uses VPN or zero-trust access with MFA.
- **Vulnerability management:** vulnerabilities are remediated within the deadlines set by severity in {{companyName}}'s vulnerability management standard, which the CTO approves. Critical and high findings have the shortest deadlines. External penetration testing is done at least annually. Unremediated vulnerabilities are treated as risks in the risk register.
- **Physical security:** offices restrict entry to authorised people; data centres are provided by vendors with recognised certifications.
- **Acceptable use:** staff use {{companyName}} systems only for business purposes, do not share credentials, and report suspected incidents immediately under P08 to {{breachContact}}.
- **Security awareness:** all staff complete security awareness training each year, tracked under P15.
- **Annual management review:** leadership reviews the policy set (P01 to P19) once a year and records decisions and changes.
- **Annual risk assessment:** the Security lead and DPO ({{dpoName}}) complete a privacy and security risk assessment each year, with a treatment plan naming owners and dates.
- **Vulnerability reporting:** a vulnerability and patch management report, showing open items against the remediation deadlines, is produced every quarter and reviewed by the CTO as part of risk assessment.

## 5. Roles

- **CTO:** accountable for the security programme and resourcing; approves this policy, the vulnerability management standard and exceptions.
- **Security lead:** owns this policy and the supporting standards.
- **All staff:** follow this policy and complete training under P15.

Overall privacy governance roles and leadership oversight are set in P19.

## 6. Evidence

Risk register and treatment plan; asset inventory; quarterly vulnerability reports; penetration test reports; exception log; training completion reports; management review minutes.

## 7. Review

Annual, after any significant breach, and after major infrastructure change.

## Exceptions

Any departure from this policy needs a written exception that states the reason, the compensating controls and an end date within the maximum exception period set under P19. It is approved by this policy's approver (the CTO) after review by the Security lead, and recorded in the exception log.

## Contact

Questions about this policy go to the Data Protection Officer, {{dpoName}}, at {{dpoEmail}}. Security incidents go to {{breachContact}}.

## Appendix: Audit controls and required proof

This policy covers the controls below from the DPDP audit checklist. Proof items and frequencies match the compliance platform. Where a control is shared, its proof items are listed once, in the policy named.

- **DPDP-ORG-02 Policy management**: Approved information security policy set and annual management review. Frequency: yearly.
- **DPDP-ORG-02 Policy management**: Further proof items are listed in P19.
- **DPDP-ORG-04 Risk assessment**: Annual risk assessment with treatment plan. Frequency: yearly.
- **DPDP-ORG-04 Risk assessment**: Vulnerability and patch management report. Frequency: quarterly.
- **DPDP-ORG-04 Risk assessment**: Further proof items are listed in P17 and P18.
- **DPDP-R6-08 Organisational measures and training**: Security awareness training completion report. Frequency: yearly.
- **DPDP-R6-08 Organisational measures and training**: Further proof items are listed in P15.
- **DPDP-ORG-01 Governance and accountability**: Proof items are listed in P19.
`;
