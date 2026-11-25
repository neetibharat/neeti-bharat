// Backup, Disaster Recovery and Business Continuity Policy, as counsel wrote it.
export const P07_TEXT = `> {{companyName}} backs up all systems holding personal data, tests restores every quarter, and can keep processing after an outage or compromise within agreed recovery targets.

## 1. Purpose

To implement Rule 6(1)(d): reasonable measures for continued processing where confidentiality, integrity or availability of personal data is compromised, including by keeping data backups.

## 2. Scope

All production systems, databases, file stores and SaaS tools that hold {{companyName}} or client personal data, and the people and processes needed to run them.

## 3. Backup requirements

- **Frequency:** Requirement: Backups taken often enough to stay within the maximum data loss target ({{maxDataLoss}}) for each system
- **Copies:** Requirement: At least one copy logically or geographically separate from production, with one immutable or offline copy for ransomware resilience
- **Location:** Requirement: Backups are stored in {{hostingRegion}}; any backup copy outside India is covered by P14
- **Encryption:** Requirement: Encrypted under P05 ({{encryptionStandard}})
- **Access:** Requirement: Restore rights limited to named engineers; access logged under P06
- **Retention:** Requirement: As set in P09; backups expire automatically on schedule
- **Restore tests:** Requirement: Every quarter for each critical system, with a report recording actual recovery time and data integrity checks

Erased data that persists in backups is not restored to active use and ages out on the backup schedule (see P09). Operational backups are separate from the Rule 8(3) {{logKeepPeriod}} hold described in P09 section 4.6.

## 4. Recovery targets

Each system is tiered. Critical systems follow {{companyName}}'s company standard: maximum data loss {{maxDataLoss}}, restore within {{timeToRestore}}. The CTO sets the targets for other tiers, confirms the tier of each system, and records both with the DR runbook. Where a client contract sets a stricter target, the contract target applies to that client's systems.

## 5. Disaster recovery and continuity

- Critical systems have a documented DR runbook, including failover to a second availability zone or region.
- The DR runbook includes a current contact list for staff, vendors and clients, with {{breachContact}} as the security escalation point.
- A business continuity plan covers loss of office, loss of key staff, and loss of a key vendor, with communication trees.
- DR and business continuity are exercised at least annually; an exercise report records findings, which are tracked to closure.
- Where a DR site is outside India, P14 applies.

## 6. Roles

- **Security lead:** owns policy, test schedule and records.
- **Engineering lead:** maintains runbooks and executes tests.
- **CTO:** confirms system tiers and recovery targets, and approves BCP.

## 7. Evidence

Backup configuration and schedule; restore test reports; DR runbook and contact list; continuity exercise report; backup access and encryption configuration.

## 8. Review

Annual, and after any invocation of DR or BCP.

## Exceptions

Any departure from this policy needs a written exception that states the reason, the compensating controls and an end date within the maximum exception period set under P19. It is approved by this policy's approver and recorded in the exception log.

## Contact

Questions about this policy go to the Data Protection Officer, {{dpoName}}, at {{dpoEmail}}.

## Appendix: Audit controls and required proof

This policy covers the controls below from the DPDP audit checklist. Proof items and frequencies match the compliance platform.

- **DPDP-R6-06 Backup and continued processing**: Backup configuration and schedule for all personal data systems. Frequency: yearly.
- **DPDP-R6-06 Backup and continued processing**: Restore test report with recovery time and data integrity results. Frequency: quarterly.
- **DPDP-R6-06 Backup and continued processing**: Disaster recovery runbook and contact list. Frequency: yearly.
- **DPDP-R6-06 Backup and continued processing**: Business continuity exercise report. Frequency: yearly.
- **DPDP-R6-06 Backup and continued processing**: Backup access and encryption configuration. Frequency: yearly.
`;
