// Logging, Monitoring and Audit Trail Standard, as counsel wrote it.
export const P06_TEXT = `> {{companyName}} logs every access to personal data, monitors those logs for unauthorised activity, and keeps them for at least {{logKeepPeriod}}.

## 1. Purpose

To implement Rule 6(1)(c), giving visibility of access to personal data through logs, monitoring and review so that unauthorised access can be detected, investigated, remediated and prevented; and Rule 6(1)(e), retaining those logs and the related personal data for {{logKeepPeriod}} unless law requires otherwise.

## 2. Scope

Production applications, databases, cloud control planes, identity provider, VPN and zero-trust access, endpoints, CI/CD, and any SaaS tool holding Confidential or Restricted data.

## 3. What must be logged

- Authentication events: success, failure, MFA challenges, lockouts.
- Access to personal data: who, what record or data set, action (read, create, update, delete, export), when, from where.
- Privileged actions: admin console use, permission changes, key operations, configuration changes.
- Security events: malware alerts, firewall and WAF blocks, data-loss alerts.
- Data subject operations: consent changes, rights requests fulfilled, erasures performed.

Logs must not contain passwords, full card numbers, secrets or unmasked Restricted data. A log source inventory and coverage matrix show which systems send which event types; gaps are tracked to closure.

## 4. Protection and retention

- Logs are sent to a central log platform promptly, time-synchronised (NTP), and protected from alteration (write-once or access-restricted with integrity checks).
- Only Security staff can delete or modify log configuration; such changes are themselves logged.
- **Log location:** the central log store is hosted in {{hostingRegion}}. The Security lead records each year where logs are stored.
- **CERT-In:** logs of all ICT systems are kept within India for at least 180 days, as the CERT-In Directions of 2022 require. If any log store is outside India, a copy of at least 180 days of logs is kept in India.
- **Retention: at least {{logKeepPeriod}}** for all logs above, longer where a contract or other law requires. After that, logs are deleted or anonymised under P09.

## 5. Monitoring and review

- Automated alerts for high-risk events (e.g. bulk export, access outside business hours to Restricted data, privilege escalation, disabled logging) are triaged promptly; critical alerts page on-call.
- The alert rule list and a sample of alert investigations, with outcome and time to close, are reviewed every quarter.
- Security reviews privileged and Restricted-data access throughout the month. The Security lead signs off a monthly log review record.
- Confirmed or suspected breaches are escalated under P08 to {{breachContact}}.

## 6. Roles

- **Security lead:** owns log platform, alert rules and reviews.
- **System owners:** ensure their systems emit required logs.

## 7. Evidence

Log source inventory and coverage matrix; retention configuration; log integrity and access configuration; alert rule list and investigations; monthly review sign-offs.

## 8. Review

Annual.

## Exceptions

Any departure from this policy needs a written exception that states the reason, the compensating controls and an end date within the maximum exception period set under P19. It is approved by this policy's approver and recorded in the exception log.

## Contact

Questions about this policy go to the Data Protection Officer, {{dpoName}}, at {{dpoEmail}}.

## Appendix: Audit controls and required proof

This policy covers the controls below from the DPDP audit checklist. Proof items and frequencies match the compliance platform.

- **DPDP-R6-04 Logging and monitoring**: Log source inventory and coverage matrix. Frequency: yearly.
- **DPDP-R6-04 Logging and monitoring**: Log retention configuration showing at least the required retention period. Frequency: yearly.
- **DPDP-R6-04 Logging and monitoring**: Log integrity and access control configuration. Frequency: yearly.
- **DPDP-R6-05 Log integrity and review**: Alert rule list and sample alert investigations. Frequency: quarterly.
- **DPDP-R6-05 Log integrity and review**: Monthly log review sign-off. Frequency: monthly.
`;
